import { api } from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'SALES';
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'MANAGER' | 'SALES';
}

export interface UpdateUserData {
  id: string;
  name?: string;
  email?: string;
  role?: 'ADMIN' | 'MANAGER' | 'SALES';
}

export const usersApi = {
  // Get all users (ADMIN only)
  getUsers: async (): Promise<User[]> => {
    const response = await api.get('/api/users');
    return response.data.data || response.data;
  },

  // Get single user
  getUser: async (id: string): Promise<User> => {
    const response = await api.get(`/api/users/${id}`);
    return response.data.data || response.data;
  },

  // Create new user (ADMIN only)
  createUser: async (data: CreateUserData): Promise<User> => {
    const response = await api.post('/api/users', data);
    return response.data.data || response.data;
  },

  // Update user
  updateUser: async (data: UpdateUserData): Promise<User> => {
    const { id, ...updateData } = data;
    const response = await api.put(`/api/users/${id}`, updateData);
    return response.data.data || response.data;
  },

  // Delete user (ADMIN only)
  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/api/users/${id}`);
  },
};
