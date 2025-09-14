import { withAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import KPICards from '@/components/KPICards';
import LeadsByStatusChart from '@/components/LeadsByStatusChart';
import RealtimeDashboard from '@/components/RealtimeDashboard';
import { useState, useEffect } from 'react';
import { DashboardData, dashboardApi } from '@/lib/dashboard';
import { useSocket } from '@/contexts/SocketContext';

function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { socket } = useSocket();

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await dashboardApi.getDashboardData();
      setDashboardData(data);
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Real-time updates via Socket.IO
  useEffect(() => {
    if (socket) {
      const handleLeadCreated = () => {
        loadDashboardData(); // Refresh dashboard data
      };

      const handleLeadUpdated = () => {
        loadDashboardData(); // Refresh dashboard data
      };

      socket.on('lead:created', handleLeadCreated);
      socket.on('lead:updated', handleLeadUpdated);

      return () => {
        socket.off('lead:created', handleLeadCreated);
        socket.off('lead:updated', handleLeadUpdated);
      };
    }
  }, [socket]);

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-400 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error loading dashboard</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadDashboardData}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome to your CRM dashboard</p>
        </div>
        
        {/* KPI Cards */}
        <KPICards 
          stats={dashboardData?.stats || {
            totalLeads: 0,
            openLeads: 0,
            closedLeads: 0,
            leadsAssignedToMe: 0,
          }}
          isLoading={isLoading}
        />

        {/* Charts and Live Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leads by Status Chart */}
          <LeadsByStatusChart 
            data={dashboardData?.leadsByStatus || []}
            isLoading={isLoading}
          />

          {/* Real-time Dashboard */}
          <RealtimeDashboard />
        </div>

      </div>
    </Layout>
  );
}

export default withAuth(Dashboard);
