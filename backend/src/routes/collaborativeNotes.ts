import express from 'express';
import { CollaborativeNotesController } from '../controllers/collaborativeNotesController';
import { authMiddleware, roleGuard } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Create a new collaborative note
router.post('/', CollaborativeNotesController.createNote);

// Get a specific collaborative note
router.get('/:id', CollaborativeNotesController.getNote);

// Update a collaborative note
router.put('/:id', CollaborativeNotesController.updateNote);

// Delete a collaborative note (soft delete)
router.delete('/:id', CollaborativeNotesController.deleteNote);

// Get all notes for the authenticated user
router.get('/', CollaborativeNotesController.getUserNotes);

// Update note permissions (only creator or users with delete permission)
router.put('/:id/permissions', CollaborativeNotesController.updatePermissions);

// Get note participants (users currently viewing/editing)
router.get('/:id/participants', CollaborativeNotesController.getNoteParticipants);

// Start a collaborative session
router.post('/sessions/start', CollaborativeNotesController.startSession);

// End a collaborative session
router.post('/sessions/end', CollaborativeNotesController.endSession);

// Apply Y.js update to a note
router.post('/:id/yjs-update', CollaborativeNotesController.applyYjsUpdate);

export default router;
