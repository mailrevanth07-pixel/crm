import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Activity, activitiesApi, ActivitiesResponse } from '@/lib/activities';
import { useSocket } from '@/contexts/SocketContext';
import Layout from '@/components/Layout';
import Link from 'next/link';

export default function ActivitiesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [activitiesData, setActivitiesData] = useState<ActivitiesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    type: '',
    leadId: ''
  });
  const { socket } = useSocket();

  // Load all activities
  const loadActivities = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await activitiesApi.getAllActivities(filters);
      setActivitiesData(data);
    } catch (err: any) {
      console.error('Error loading activities:', err);
      setError('Failed to load activities');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      loadActivities();
    }
  }, [user, authLoading, filters]);

  // Real-time updates via Socket.IO
  useEffect(() => {
    if (socket) {
      const handleActivityCreated = (newActivity: Activity) => {
        setActivitiesData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            activities: [newActivity, ...prev.activities]
          };
        });
      };

      socket.on('activity:created', handleActivityCreated);

      return () => {
        socket.off('activity:created', handleActivityCreated);
      };
    }
  }, [socket]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call':
        return '📞';
      case 'email':
        return '📧';
      case 'meeting':
        return '🤝';
      case 'note':
        return '📝';
      case 'task':
        return '✅';
      default:
        return '📋';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'call':
        return 'bg-blue-100 text-blue-800';
      case 'email':
        return 'bg-green-100 text-green-800';
      case 'meeting':
        return 'bg-purple-100 text-purple-800';
      case 'note':
        return 'bg-yellow-100 text-yellow-800';
      case 'task':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h1>
          <p className="text-gray-600">You need to be logged in to view activities.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Activities</h1>
          <p className="mt-2 text-gray-600">View and manage all lead activities across your CRM</p>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Activity Type</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Types</option>
                <option value="call">Call</option>
                <option value="email">Email</option>
                <option value="meeting">Meeting</option>
                <option value="note">Note</option>
                <option value="task">Task</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lead ID</label>
              <input
                type="text"
                value={filters.leadId}
                onChange={(e) => handleFilterChange('leadId', e.target.value)}
                placeholder="Filter by Lead ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex items-end sm:col-span-2 lg:col-span-1">
              <button
                onClick={() => setFilters({ page: 1, limit: 20, type: '', leadId: '' })}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Activities List */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">All Activities</h3>
            {activitiesData && (
              <span className="text-sm text-gray-500">
                {activitiesData.pagination.total} total activities
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex space-x-3 animate-pulse">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-400 text-4xl mb-2">⚠️</div>
              <p className="text-gray-500 text-sm mb-4">{error}</p>
              <button
                onClick={loadActivities}
                className="text-primary-600 text-sm hover:text-primary-800"
              >
                Try Again
              </button>
            </div>
          ) : !activitiesData || activitiesData.activities.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-2">📝</div>
              <p className="text-gray-500 text-sm">No activities found</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {activitiesData.activities.map((activity) => (
                  <div key={activity.id} className="flex space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${getActivityColor(activity.type)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">{activity.title}</h4>
                        <time className="text-xs text-gray-500">{formatDate(activity.createdAt)}</time>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{activity.body}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-500">
                          by {activity.user?.name || 'Unknown User'}
                        </p>
                        {activity.lead && (
                          <Link
                            href={`/leads/${activity.leadId}`}
                            className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                          >
                            {activity.lead.company} - {activity.lead.contactName}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {activitiesData.pagination.totalPages > 1 && (
                <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="text-sm text-gray-500 text-center sm:text-left">
                    Showing {((activitiesData.pagination.page - 1) * activitiesData.pagination.limit) + 1} to{' '}
                    {Math.min(activitiesData.pagination.page * activitiesData.pagination.limit, activitiesData.pagination.total)} of{' '}
                    {activitiesData.pagination.total} results
                  </div>
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={() => handlePageChange(activitiesData.pagination.page - 1)}
                      disabled={activitiesData.pagination.page === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-sm bg-primary-100 text-primary-800 rounded-md">
                      {activitiesData.pagination.page} of {activitiesData.pagination.totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(activitiesData.pagination.page + 1)}
                      disabled={activitiesData.pagination.page === activitiesData.pagination.totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
