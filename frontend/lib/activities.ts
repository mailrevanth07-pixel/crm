import api from './api';

export interface Activity {
  id: string;
  leadId: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task';
  title: string;
  body: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  lead?: {
    id: string;
    company: string;
    contactName: string;
    owner: {
      id: string;
      name: string;
      email: string;
    };
  };
}

export interface CreateActivityData {
  leadId: string;
  type: Activity['type'];
  title: string;
  body: string;
}

export interface ActivitiesResponse {
  activities: Activity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const activitiesApi = {
  // Get all activities with optional filtering
  getAllActivities: async (params?: {
    page?: number;
    limit?: number;
    leadId?: string;
    type?: string;
    userId?: string;
  }): Promise<ActivitiesResponse> => {
    const response = await api.get('/api/activities', { params });
    return response.data.data;
  },

  // Get activities for a lead
  getActivities: async (leadId: string): Promise<Activity[]> => {
    const response = await api.get(`/api/activities/lead/${leadId}`);
    return response.data.data.activities;
  },

  // Create new activity
  createActivity: async (data: CreateActivityData): Promise<Activity> => {
    const response = await api.post('/api/activities', data);
    return response.data.data.activity;
  },

  // Update activity
  updateActivity: async (id: string, data: Partial<CreateActivityData>): Promise<Activity> => {
    const response = await api.put(`/api/activities/${id}`, data);
    return response.data.data.activity;
  },

  // Delete activity
  deleteActivity: async (id: string): Promise<void> => {
    await api.delete(`/api/activities/${id}`);
  },
};
