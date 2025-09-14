import React, { useEffect, useRef, useState, useCallback } from 'react';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { schema } from 'prosemirror-schema-basic';
import { Schema } from 'prosemirror-model';
import { addListNodes } from 'prosemirror-schema-list';
import { exampleSetup } from 'prosemirror-example-setup';
import { ySyncPlugin } from 'y-prosemirror';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';

interface CollaborativeNoteEditorProps {
  noteId: string;
  onSave?: (content: string) => void;
  onParticipantsChange?: (participants: any[]) => void;
  className?: string;
}

interface Participant {
  id: string;
  name?: string;
  email: string;
  status: 'viewing' | 'editing' | 'idle';
  cursorPosition?: { line: number; column: number };
  color: string;
}

const CollaborativeNoteEditor: React.FC<CollaborativeNoteEditorProps> = ({
  noteId,
  onSave,
  onParticipantsChange,
  className = ''
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<any>(null);
  
  const { socket, isConnected: socketConnected } = useSocket();
  const { user } = useAuth();

  // Generate a unique color for each participant
  const getParticipantColor = useCallback((userId: string) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  }, []);

  // Initialize Y.js document and WebSocket provider
  useEffect(() => {
    if (!noteId || !user) return;

    const initCollaborativeEditor = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get note data
        const response = await api.get(`/collaborative-notes/${noteId}`);
        if (!response.data.success) {
          throw new Error('Failed to load note');
        }

        const noteData = response.data.data;
        setNote(noteData);

        // Create Y.js document
        const ydoc = new Y.Doc();
        ydocRef.current = ydoc;

        // Create WebSocket provider for real-time collaboration
        const provider = new WebsocketProvider(
          process.env.NEXT_PUBLIC_WS_URL || 'wss://crm-19gz.onrender.com',
          `note-${noteId}`,
          ydoc
        );

        providerRef.current = provider;

        // Set up provider event handlers
        provider.on('status', (event: any) => {
          setIsConnected(event.status === 'connected');
        });

        provider.on('connection-close', () => {
          setIsConnected(false);
        });

        provider.on('connection-error', (error: any) => {
          console.error('WebSocket provider connection error:', error);
          setError('Connection error. Please refresh the page.');
        });

        // Set up awareness for cursor positions and participants
        provider.awareness.on('change', () => {
          const states = Array.from(provider.awareness.getStates().values());
          const participantList: Participant[] = states.map((state: any) => ({
            id: state.user?.id || 'unknown',
            name: state.user?.name || 'Unknown User',
            email: state.user?.email || '',
            status: state.status || 'viewing',
            cursorPosition: state.cursor,
            color: getParticipantColor(state.user?.id || 'unknown')
          }));
          
          setParticipants(participantList);
          onParticipantsChange?.(participantList);
        });

        // Set up user awareness
        provider.awareness.setLocalStateField('user', {
          id: user.id,
          name: user.name,
          email: user.email
        });

        // Initialize ProseMirror editor
        const editorElement = editorRef.current;
        if (!editorElement) return;

        // Create schema with list support
        const mySchema = new Schema({
          nodes: addListNodes(schema.spec.nodes, 'paragraph block*', 'block'),
          marks: schema.spec.marks
        });

        // Create Y.js XML fragment type for ProseMirror
        const yXmlFragment = ydoc.getXmlFragment('content');
        
        // Initialize with existing content
        if (noteData.content) {
          // For now, just insert as text - this will be improved later
          const yText = ydoc.getText('content');
          yText.insert(0, noteData.content);
        }

        // Create ProseMirror state with Y.js sync plugin
        const state = EditorState.create({
          schema: mySchema,
          plugins: [
            ...exampleSetup({ schema: mySchema }),
            ySyncPlugin(yXmlFragment)
          ]
        });

        // Create editor view
        const view = new EditorView(editorElement, {
          state,
          dispatchTransaction: (tr) => {
            const newState = view.state.apply(tr);
            view.updateState(newState);
            
            // Auto-save on content change
            if (tr.docChanged) {
              const content = yXmlFragment.toString();
              onSave?.(content);
              debouncedSave(content);
            }
          }
        });

        editorViewRef.current = view;

        // Start collaborative session
        await api.post('/collaborative-notes/sessions/start', { noteId });

        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing collaborative editor:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize editor');
        setIsLoading(false);
      }
    };

    initCollaborativeEditor();

    // Cleanup on unmount
    return () => {
      if (providerRef.current) {
        providerRef.current.destroy();
      }
      if (editorViewRef.current) {
        editorViewRef.current.destroy();
      }
      if (ydocRef.current) {
        ydocRef.current.destroy();
      }
    };
  }, [noteId, user, onSave, onParticipantsChange, getParticipantColor]);

  // Debounced save function
  const debouncedSave = useCallback(
    debounce(async (content: string) => {
      try {
        await api.put(`/collaborative-notes/${noteId}`, { content });
      } catch (error) {
        console.error('Error auto-saving note:', error);
      }
    }, 1000),
    [noteId]
  );

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 's':
            event.preventDefault();
            if (editorViewRef.current && ydocRef.current) {
              const content = ydocRef.current.getXmlFragment('content').toString();
              onSave?.(content);
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (noteId) {
        api.post('/collaborative-notes/sessions/end', { noteId }).catch(console.error);
      }
    };
  }, [noteId]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading collaborative editor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`collaborative-editor ${className}`}>
      {/* Editor Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {note?.title || 'Untitled Note'}
          </h3>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        
        {/* Participants */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Participants:</span>
          <div className="flex -space-x-2">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-white"
                style={{ backgroundColor: participant.color }}
                title={`${participant.name} (${participant.status})`}
              >
                {(participant.name || participant.email || 'U').charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Editor Container */}
      <div className="relative">
        <div
          ref={editorRef}
          className="prose max-w-none p-4 min-h-[400px] focus:outline-none"
          style={{ minHeight: '400px' }}
        />
        
        {/* Cursor indicators for other participants */}
        {participants.map((participant) => (
          participant.cursorPosition && participant.id !== user?.id && (
            <div
              key={`cursor-${participant.id}`}
              className="absolute pointer-events-none z-10"
              style={{
                left: `${participant.cursorPosition.column * 8}px`,
                top: `${participant.cursorPosition.line * 24}px`,
                width: '2px',
                height: '20px',
                backgroundColor: participant.color
              }}
            >
              <div
                className="absolute -top-6 left-0 px-2 py-1 text-xs text-white rounded"
                style={{ backgroundColor: participant.color }}
              >
                {participant.name}
              </div>
            </div>
          )
        ))}
      </div>

      {/* Editor Footer */}
      <div className="flex items-center justify-between p-4 border-t bg-gray-50 text-sm text-gray-600">
        <div>
          {participants.length} participant{participants.length !== 1 ? 's' : ''} online
        </div>
        <div className="flex items-center space-x-4">
          <span>Version {note?.version || 1}</span>
          <span>Last modified: {note?.lastModified ? new Date(note.lastModified).toLocaleString() : 'Unknown'}</span>
        </div>
      </div>
    </div>
  );
};

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default CollaborativeNoteEditor;
