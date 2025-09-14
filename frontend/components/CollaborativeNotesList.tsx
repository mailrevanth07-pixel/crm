import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

interface CollaborativeNote {
  id: string;
  title: string;
  content: string;
  leadId?: string;
  createdBy: string;
  updatedBy?: string;
  isActive: boolean;
  version: number;
  lastModified: string;
  permissions: {
    canEdit: string[];
    canView: string[];
    canDelete: string[];
  };
  metadata: {
    tags: string[];
    category?: string;
    priority: 'low' | 'medium' | 'high';
    dueDate?: string;
  };
  creator?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  updater?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

interface CollaborativeNotesListProps {
  leadId?: string;
  onNoteSelect?: (note: CollaborativeNote) => void;
  className?: string;
}

const CollaborativeNotesList: React.FC<CollaborativeNotesListProps> = ({
  leadId,
  onNoteSelect,
  className = ''
}) => {
  const [notes, setNotes] = useState<CollaborativeNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNotePriority, setNewNotePriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newNoteCategory, setNewNoteCategory] = useState('');
  const [newNoteTags, setNewNoteTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const { user } = useAuth();

  // Load notes
  useEffect(() => {
    loadNotes();
  }, [leadId]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (leadId) params.append('leadId', leadId);
      
      const response = await api.get(`/collaborative-notes?${params.toString()}`);
      
      if (response.data.success) {
        setNotes(response.data.data.notes);
      } else {
        setError('Failed to load notes');
      }
    } catch (err) {
      console.error('Error loading notes:', err);
      setError('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    try {
      if (!newNoteTitle.trim()) return;

      const response = await api.post('/collaborative-notes', {
        title: newNoteTitle,
        content: newNoteContent,
        leadId: leadId || null,
        metadata: {
          tags: newNoteTags,
          category: newNoteCategory || null,
          priority: newNotePriority,
          dueDate: null
        }
      });

      if (response.data.success) {
        setNotes(prev => [response.data.data, ...prev]);
        setShowCreateModal(false);
        setNewNoteTitle('');
        setNewNoteContent('');
        setNewNotePriority('medium');
        setNewNoteCategory('');
        setNewNoteTags([]);
        onNoteSelect?.(response.data.data);
      } else {
        setError('Failed to create note');
      }
    } catch (err) {
      console.error('Error creating note:', err);
      setError('Failed to create note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await api.delete(`/collaborative-notes/${noteId}`);
      
      if (response.data.success) {
        setNotes(prev => prev.filter(note => note.id !== noteId));
        if (selectedNote === noteId) {
          setSelectedNote(null);
        }
      } else {
        setError('Failed to delete note');
      }
    } catch (err) {
      console.error('Error deleting note:', err);
      setError('Failed to delete note');
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !newNoteTags.includes(newTag.trim())) {
      setNewNoteTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewNoteTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'all' || note.metadata.priority === filterPriority;
    const matchesCategory = filterCategory === 'all' || note.metadata.category === filterCategory;
    
    return matchesSearch && matchesPriority && matchesCategory;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`collaborative-notes-list ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Collaborative Notes {leadId && `for Lead`}
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + New Note
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search notes..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {Array.from(new Set(notes.map(note => note.metadata.category).filter(Boolean))).map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Notes List */}
      <div className="space-y-4">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm || filterPriority !== 'all' || filterCategory !== 'all' 
              ? 'No notes match your filters'
              : 'No notes found. Create your first note!'
            }
          </div>
        ) : (
          filteredNotes.map(note => (
            <div
              key={note.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedNote === note.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => {
                setSelectedNote(note.id);
                onNoteSelect?.(note);
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{note.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {note.content || 'No content'}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>v{note.version}</span>
                    <span>Modified: {new Date(note.lastModified).toLocaleDateString()}</span>
                    {note.creator && (
                      <span>By: {note.creator.firstName} {note.creator.lastName}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(note.metadata.priority)}`}>
                    {note.metadata.priority}
                  </span>
                  
                  {note.metadata.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {note.metadata.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                      {note.metadata.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          +{note.metadata.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(note.id);
                    }}
                    className="p-1 text-red-600 hover:text-red-800"
                    title="Delete note"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Note Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Note</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  placeholder="Enter note title..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Enter note content..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newNotePriority}
                    onChange={(e) => setNewNotePriority(e.target.value as 'low' | 'medium' | 'high')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={newNoteCategory}
                    onChange={(e) => setNewNoteCategory(e.target.value)}
                    placeholder="Enter category..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {newNoteTags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder="Add tag..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNote}
                disabled={!newNoteTitle.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaborativeNotesList;
