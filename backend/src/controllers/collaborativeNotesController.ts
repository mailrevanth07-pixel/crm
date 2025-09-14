import { Request, Response } from 'express';
import { CollaborativeNote, UserPresence, CollaborativeSession, User } from '../models';
import { AuthenticatedRequest } from '../middleware/auth';
import { redisService } from '../config/redis';
import { v4 as uuidv4 } from 'uuid';
import { YjsHelper } from '../utils/yjs';

export class CollaborativeNotesController {
  // Create a new collaborative note
  public static async createNote(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { title, content, leadId, permissions, metadata } = req.body;
      const userId = req.user!.id;

      // Create Y.js document
      const yDoc = YjsHelper.createDocument();
      const yText = YjsHelper.getText(yDoc, 'content');
      YjsHelper.insertText(yText, 0, content || '');
      
      // Convert Y.js document to buffer
      const yjsDocument = Buffer.from(YjsHelper.encodeStateAsUpdate(yDoc));

      const note = await CollaborativeNote.create({
        title,
        content: content || '',
        leadId: leadId || null,
        createdBy: userId,
        permissions: permissions || {
          canEdit: [userId],
          canView: [userId],
          canDelete: [userId]
        },
        metadata: metadata || {
          tags: [],
          category: null,
          priority: 'medium',
          dueDate: null
        },
        yjsDocument
      });

      // Cache the note in Redis
      await redisService.set(`note:${note.id}`, note.toJSON(), 3600); // 1 hour cache

      res.status(201).json({
        success: true,
        data: note.toJSON(),
        message: 'Collaborative note created successfully'
      });
    } catch (error) {
      console.error('Error creating collaborative note:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create collaborative note',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get a collaborative note by ID
  public static async getNote(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // Try to get from cache first
      let note = await redisService.get<CollaborativeNote>(`note:${id}`);
      
      if (!note) {
        // Get from database
        note = await CollaborativeNote.findByPk(id);
        if (!note) {
          res.status(404).json({
            success: false,
            message: 'Collaborative note not found'
          });
          return;
        }
        
        // Cache the note
        await redisService.set(`note:${id}`, note.toJSON(), 3600);
      }

      // Check permissions
      if (!note.hasViewPermission(userId)) {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to view this note'
        });
        return;
      }

      res.json({
        success: true,
        data: note.toJSON()
      });
    } catch (error) {
      console.error('Error getting collaborative note:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get collaborative note',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Update a collaborative note
  public static async updateNote(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, content, permissions, metadata } = req.body;
      const userId = req.user!.id;

      const note = await CollaborativeNote.findByPk(id);
      if (!note) {
        res.status(404).json({
          success: false,
          message: 'Collaborative note not found'
        });
        return;
      }

      // Check edit permissions
      if (!note.hasEditPermission(userId)) {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to edit this note'
        });
        return;
      }

      // Update note
      if (title !== undefined) note.title = title;
      if (content !== undefined) note.content = content;
      if (permissions !== undefined) note.permissions = permissions;
      if (metadata !== undefined) note.metadata = metadata;
      
      note.updatedBy = userId;
      note.incrementVersion();

      // Update Y.js document if content changed
      if (content !== undefined) {
        const yDoc = YjsHelper.createDocument();
        const yText = YjsHelper.getText(yDoc, 'content');
        YjsHelper.insertText(yText, 0, content);
        note.yjsDocument = Buffer.from(YjsHelper.encodeStateAsUpdate(yDoc));
      }

      await note.save();

      // Update cache
      await redisService.set(`note:${note.id}`, note.toJSON(), 3600);

      res.json({
        success: true,
        data: note.toJSON(),
        message: 'Collaborative note updated successfully'
      });
    } catch (error) {
      console.error('Error updating collaborative note:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update collaborative note',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Delete a collaborative note
  public static async deleteNote(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const note = await CollaborativeNote.findByPk(id);
      if (!note) {
        res.status(404).json({
          success: false,
          message: 'Collaborative note not found'
        });
        return;
      }

      // Check delete permissions
      if (!note.hasDeletePermission(userId)) {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this note'
        });
        return;
      }

      // Soft delete
      note.isActive = false;
      await note.save();

      // Remove from cache
      await redisService.del(`note:${id}`);

      res.json({
        success: true,
        message: 'Collaborative note deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting collaborative note:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete collaborative note',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get all notes for a user
  public static async getUserNotes(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { leadId, page = 1, limit = 20 } = req.query;

      const whereClause: any = {
        isActive: true,
        $or: [
          { createdBy: userId },
          { permissions: { canView: { $contains: [userId] } } }
        ]
      };

      if (leadId) {
        whereClause.leadId = leadId;
      }

      const notes = await CollaborativeNote.findAndCountAll({
        where: whereClause,
        include: [
          { model: User, as: 'creator', attributes: ['id', 'email', 'firstName', 'lastName'] },
          { model: User, as: 'updater', attributes: ['id', 'email', 'firstName', 'lastName'] }
        ],
        order: [['lastModified', 'DESC']],
        limit: Number(limit),
        offset: (Number(page) - 1) * Number(limit)
      });

      res.json({
        success: true,
        data: {
          notes: notes.rows.map(note => note.toJSON()),
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: notes.count,
            pages: Math.ceil(notes.count / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('Error getting user notes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user notes',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Update note permissions
  public static async updatePermissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { permissions } = req.body;
      const userId = req.user!.id;

      const note = await CollaborativeNote.findByPk(id);
      if (!note) {
        res.status(404).json({
          success: false,
          message: 'Collaborative note not found'
        });
        return;
      }

      // Check if user can modify permissions (only creator or users with delete permission)
      if (!note.hasDeletePermission(userId)) {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to modify note permissions'
        });
        return;
      }

      note.permissions = permissions;
      note.updatedBy = userId;
      note.incrementVersion();
      await note.save();

      // Update cache
      await redisService.set(`note:${note.id}`, note.toJSON(), 3600);

      res.json({
        success: true,
        data: note.toJSON(),
        message: 'Note permissions updated successfully'
      });
    } catch (error) {
      console.error('Error updating note permissions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update note permissions',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get note participants (users currently viewing/editing)
  public static async getNoteParticipants(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const note = await CollaborativeNote.findByPk(id);
      if (!note) {
        res.status(404).json({
          success: false,
          message: 'Collaborative note not found'
        });
        return;
      }

      // Check view permissions
      if (!note.hasViewPermission(userId)) {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to view this note'
        });
        return;
      }

      // Get active presences for this note
      const presences = await UserPresence.findAll({
        where: {
          resourceType: 'note',
          resourceId: id,
          isActive: true
        },
        include: [
          { model: User, as: 'User', attributes: ['id', 'email', 'firstName', 'lastName'] }
        ],
        order: [['lastSeen', 'DESC']]
      });

      res.json({
        success: true,
        data: presences.map(presence => ({
          user: (presence as any).User,
          status: presence.status,
          lastSeen: presence.lastSeen,
          cursorPosition: presence.cursorPosition,
          selection: presence.selection
        }))
      });
    } catch (error) {
      console.error('Error getting note participants:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get note participants',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Start a collaborative session
  public static async startSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { noteId } = req.body;
      const userId = req.user!.id;

      const note = await CollaborativeNote.findByPk(noteId);
      if (!note) {
        res.status(404).json({
          success: false,
          message: 'Collaborative note not found'
        });
        return;
      }

      // Check edit permissions
      if (!note.hasEditPermission(userId)) {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to edit this note'
        });
        return;
      }

      // Check if there's already an active session
      let session = await CollaborativeSession.findOne({
        where: {
          noteId,
          isActive: true
        }
      });

      if (!session) {
        // Create new session
        session = await CollaborativeSession.create({
          noteId,
          sessionId: uuidv4(),
          participants: [userId],
          metadata: {
            totalEdits: 0,
            totalParticipants: 1,
            conflictResolutions: 0
          }
        });
      } else {
        // Add user to existing session
        session.addParticipant(userId);
        await session.save();
      }

      // Update user presence
      await UserPresence.upsert({
        userId,
        resourceType: 'note',
        resourceId: noteId,
        isActive: true,
        status: 'editing',
        lastSeen: new Date(),
        metadata: {
          sessionId: session.sessionId
        }
      });

      res.json({
        success: true,
        data: {
          sessionId: session.sessionId,
          participants: session.participants,
          note: note.toJSON()
        },
        message: 'Collaborative session started successfully'
      });
    } catch (error) {
      console.error('Error starting collaborative session:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start collaborative session',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // End a collaborative session
  public static async endSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { noteId } = req.body;
      const userId = req.user!.id;

      const session = await CollaborativeSession.findOne({
        where: {
          noteId,
          isActive: true
        }
      });

      if (session) {
        session.removeParticipant(userId);
        
        // If no more participants, end the session
        if (session.participants.length === 0) {
          session.endSession();
        }
        
        await session.save();
      }

      // Update user presence
      await UserPresence.update(
        { isActive: false, status: 'idle' },
        {
          where: {
            userId,
            resourceType: 'note',
            resourceId: noteId
          }
        }
      );

      res.json({
        success: true,
        message: 'Collaborative session ended successfully'
      });
    } catch (error) {
      console.error('Error ending collaborative session:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to end collaborative session',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Apply Y.js update to a note
  public static async applyYjsUpdate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { noteId } = req.params;
      const { update } = req.body;
      const userId = req.user!.id;

      const note = await CollaborativeNote.findByPk(noteId);
      if (!note) {
        res.status(404).json({
          success: false,
          message: 'Collaborative note not found'
        });
        return;
      }

      // Check edit permissions
      if (!note.hasEditPermission(userId)) {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to edit this note'
        });
        return;
      }

      // Get current Y.js document
      const yDoc = YjsHelper.createDocument();
      if (note.yjsDocument) {
        YjsHelper.applyUpdate(yDoc, note.yjsDocument);
      }

      // Apply the update
      const updateBuffer = Buffer.from(update, 'base64');
      YjsHelper.applyUpdate(yDoc, updateBuffer);

      // Update the note
      note.yjsDocument = Buffer.from(YjsHelper.encodeStateAsUpdate(yDoc));
      note.content = YjsHelper.getText(yDoc, 'content').toString();
      note.updatedBy = userId;
      note.incrementVersion();
      await note.save();

      // Add update to active session
      const session = await CollaborativeSession.findOne({
        where: {
          noteId,
          isActive: true
        }
      });

      if (session) {
        session.addYjsUpdate(updateBuffer);
        await session.save();
      }

      // Update cache
      await redisService.set(`note:${note.id}`, note.toJSON(), 3600);

      res.json({
        success: true,
        data: note.toJSON(),
        message: 'Y.js update applied successfully'
      });
    } catch (error) {
      console.error('Error applying Y.js update:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to apply Y.js update',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default CollaborativeNotesController;
