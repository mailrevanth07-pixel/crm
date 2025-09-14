import { useState, useEffect } from 'react';
import { Activity, activitiesApi } from '@/lib/activities';
import { useSocket } from '@/contexts/SocketContext';

interface ActivityTimelineProps {
  leadId: string;
}

export default function ActivityTimeline({ leadId }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { socket } = useSocket();

  // Load activities from API
  const loadActivities = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const activitiesData = await activitiesApi.getActivities(leadId);
      setActivities(activitiesData);
    } catch (err: any) {
      console.error('Error loading activities:', err);
      setError('Failed to load activities');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [leadId]);

  // Real-time updates via Socket.IO
  useEffect(() => {
    if (socket) {
      const handleActivityCreated = (newActivity: Activity) => {
        if (newActivity.leadId === leadId) {
          setActivities(prev => [newActivity, ...prev]);
        }
      };

      socket.on('activity:created', handleActivityCreated);

      return () => {
        socket.off('activity:created', handleActivityCreated);
      };
    }
  }, [socket, leadId]);

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

  if (isLoading) {
    return (
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
    );
  }

  if (error) {
    return (
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
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-4xl mb-2">📝</div>
        <p className="text-gray-500 text-sm">No activities yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div key={activity.id} className="flex space-x-3">
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
            <p className="text-xs text-gray-500 mt-1">by {activity.user?.name || 'Unknown User'}</p>
          </div>
        </div>
      ))}
      
    </div>
  );
}
