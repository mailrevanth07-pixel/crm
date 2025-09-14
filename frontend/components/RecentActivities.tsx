import { useState, useEffect } from 'react';
import { Activity, activitiesApi } from '@/lib/activities';
import { useSocket } from '@/contexts/SocketContext';

interface RecentActivitiesProps {
  limit?: number;
}

export default function RecentActivities({ limit = 5 }: RecentActivitiesProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { socket } = useSocket();

  const loadRecentActivities = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // This would typically be a dedicated endpoint for recent activities
      // For now, we'll simulate with empty array
      setActivities([]);
    } catch (err: any) {
      console.error('Error loading recent activities:', err);
      setError(err.response?.data?.message || 'Failed to load activities');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecentActivities();
  }, []);

  // Real-time updates via Socket.IO
  useEffect(() => {
    if (socket) {
      const handleActivityCreated = (newActivity: Activity) => {
        setActivities(prev => [newActivity, ...prev].slice(0, limit));
      };

      socket.on('activity:created', handleActivityCreated);

      return () => {
        socket.off('activity:created', handleActivityCreated);
      };
    }
  }, [socket, limit]);

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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (isLoading) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
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
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
        <div className="text-center py-8">
          <div className="text-red-400 text-4xl mb-2">⚠️</div>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">📝</div>
          <p className="text-gray-500 text-sm">No recent activities</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex space-x-3">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900 truncate">{activity.title}</h4>
                <time className="text-xs text-gray-500">{formatTimeAgo(activity.createdAt)}</time>
              </div>
              <p className="text-sm text-gray-600 truncate">{activity.body}</p>
              <p className="text-xs text-gray-500">by {activity.user?.name || 'Unknown User'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
