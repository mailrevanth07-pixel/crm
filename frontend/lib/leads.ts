import api from './api';

export interface Lead {
  id: string;
  title: string;
  description: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST';
  owner?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadData {
  title: string;
  description: string;
  status: Lead['status'];
  ownerId: string;
}

export interface UpdateLeadData extends Partial<CreateLeadData> {
  id: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const leadsApi = {
  // Get all leads
  getLeads: async (): Promise<Lead[]> => {
    const response = await api.get('/api/leads');
    return response.data.data.leads;
  },

  // Get single lead
  getLead: async (id: string): Promise<Lead> => {
    const response = await api.get(`/api/leads/${id}`);
    return response.data.data.lead;
  },

  // Create new lead
  createLead: async (data: CreateLeadData): Promise<Lead> => {
    const response = await api.post('/api/leads', data);
    return response.data.data.lead;
  },

  // Update lead
  updateLead: async (data: UpdateLeadData): Promise<Lead> => {
    const { id, ...updateData } = data;
    const response = await api.put(`/api/leads/${id}`, updateData);
    return response.data.data.lead;
  },

  // Delete lead
  deleteLead: async (id: string): Promise<void> => {
    await api.delete(`/api/leads/${id}`);
  },

  // Get users for owner selection
  getUsers: async (): Promise<User[]> => {
    const response = await api.get('/api/users');
    return response.data.data || response.data;
  },
};
