import { useState, useEffect } from 'react';
import { Lead, CreateLeadData, UpdateLeadData, User, leadsApi } from '@/lib/leads';

interface LeadEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lead: Lead) => void;
  lead?: Lead;
}

export default function LeadEditorModal({ isOpen, onClose, onSave, lead }: LeadEditorModalProps) {
  const [formData, setFormData] = useState<CreateLeadData>({
    title: lead?.title || '',
    description: lead?.description || '',
    status: lead?.status || 'NEW',
    ownerId: lead?.owner?.id || '',
  });

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toUpperCase().replace('-', '_');
    
    switch (normalizedStatus) {
      case 'NEW':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CONTACTED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'QUALIFIED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusDotColor = (status: string) => {
    const normalizedStatus = status.toUpperCase().replace('-', '_');
    
    switch (normalizedStatus) {
      case 'NEW':
        return 'bg-blue-500';
      case 'CONTACTED':
        return 'bg-yellow-500';
      case 'QUALIFIED':
        return 'bg-green-500';
      case 'CLOSED':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Load users when modal opens
  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  // Reset form when lead changes
  useEffect(() => {
    if (lead) {
      setFormData({
        title: lead.title,
        description: lead.description,
        status: lead.status,
        ownerId: lead.owner?.id || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'NEW',
        ownerId: '',
      });
    }
    setError(null);
  }, [lead, isOpen]);

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const usersData = await leadsApi.getUsers();
      setUsers(usersData);
    } catch (err) {
      console.error('Error loading users:', err);
      // Fallback to mock users for development
      const mockUsers: User[] = [
        {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          role: 'admin'
        },
        {
          id: '2',
          name: 'John Smith',
          email: 'john@example.com',
          role: 'sales'
        },
        {
          id: '3',
          name: 'Jane Doe',
          email: 'jane@example.com',
          role: 'sales'
        }
      ];
      setUsers(mockUsers);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let savedLead: Lead;
      
      if (lead) {
        // Update existing lead
        const updateData: UpdateLeadData = {
          id: lead.id,
          ...formData,
        };
        savedLead = await leadsApi.updateLead(updateData);
      } else {
        // Create new lead
        savedLead = await leadsApi.createLead(formData);
      }
      
      onSave(savedLead);
    } catch (err: any) {
      console.error('Error saving lead:', err);
      
      // Check if it's an authentication error
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
        // Don't create mock data for auth errors
        return;
      }
      
      // For other errors, show error message
      setError(err.response?.data?.message || 'Failed to save lead. Please try again.');
      
      // For development, create a mock lead when API fails (only for non-auth errors)
      if (process.env.NODE_ENV === 'development' && err.response?.status !== 401) {
        const selectedUser = users.find(u => u.id === formData.ownerId) || users[0];
        const mockLead: Lead = {
          id: lead?.id || Date.now().toString(),
          title: formData.title,
          description: formData.description,
          status: formData.status,
          owner: {
            id: selectedUser.id,
            name: selectedUser.name,
            email: selectedUser.email,
          },
          createdAt: lead?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        onSave(mockLead);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full mx-4">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {lead ? 'Edit Lead' : 'Add New Lead'}
                    </h3>
                    {lead && (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                          lead.status
                        )}`}
                      >
                        {lead.status}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        id="title"
                        required
                        className="input-field mt-1"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Enter lead title"
                      />
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        name="description"
                        id="description"
                        rows={3}
                        className="input-field mt-1"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Enter lead description"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                          Status
                        </label>
                        <div className="relative">
                          <select
                            name="status"
                            id="status"
                            className="input-field mt-1"
                            value={formData.status}
                            onChange={handleChange}
                          >
                            <option value="NEW">New</option>
                            <option value="CONTACTED">Contacted</option>
                            <option value="QUALIFIED">Qualified</option>
                            <option value="CLOSED">Closed</option>
                          </select>
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <span
                              className={`inline-block w-3 h-3 rounded-full ${getStatusDotColor(formData.status)}`}
                            ></span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="ownerId" className="block text-sm font-medium text-gray-700">
                          Owner *
                        </label>
                        <select
                          name="ownerId"
                          id="ownerId"
                          required
                          className="input-field mt-1"
                          value={formData.ownerId}
                          onChange={handleChange}
                          disabled={isLoadingUsers}
                        >
                          <option value="">Select owner</option>
                          {users.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.name}
                            </option>
                          ))}
                        </select>
                        {isLoadingUsers && (
                          <p className="mt-1 text-xs text-gray-500">Loading users...</p>
                        )}
                      </div>
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3">
                        <p className="text-sm text-red-800">{error}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse space-y-2 sm:space-y-0">
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary sm:ml-3 sm:w-auto w-full"
              >
                {isLoading ? 'Saving...' : (lead ? 'Update Lead' : 'Create Lead')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary sm:mt-0 sm:w-auto w-full"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
