import api from './api';

export interface DashboardStats {
  totalLeads: number;
  openLeads: number;
  closedLeads: number;
  leadsAssignedToMe: number;
}

export interface LeadStatusData {
  status: string | number;
  count: number;
  percentage: number;
}

export interface DashboardData {
  stats: DashboardStats;
  leadsByStatus: LeadStatusData[];
}

export const dashboardApi = {
  // Get dashboard statistics
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/api/leads/stats');
    return response.data;
  },

  // Get leads grouped by status
  getLeadsByStatus: async (): Promise<LeadStatusData[]> => {
    const response = await api.get('/api/leads?groupBy=status');
    return response.data;
  },

  // Get complete dashboard data
  getDashboardData: async (): Promise<DashboardData> => {
    const [stats, leadsByStatus] = await Promise.all([
      dashboardApi.getStats(),
      dashboardApi.getLeadsByStatus(),
    ]);

    return {
      stats,
      leadsByStatus,
    };
  },
};
