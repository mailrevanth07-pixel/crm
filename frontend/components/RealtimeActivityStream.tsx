import React, { useState, useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/hooks/useAuth';

interface ActivityEvent {
  id: string;
  type: 'lead' | 'activity' | 'user';
  action: 'created' | 'updated' | 'assigned' | 'deleted';
  title: string;
  description: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  timestamp: string;
  data?: any;
}

export default function RealtimeActivityStream() {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Lead events
    const handleLeadCreated = (data: any) => {
      addActivity({
        type: 'lead',
        action: 'created',
        title: 'New Lead Created',
        description: `${data.createdBy?.name || 'Unknown User'} created "${data.lead?.company || 'Unknown Company'}"`,
        user: data.createdBy,
        timestamp: data.timestamp,
        data
      });
    };

    const handleLeadUpdated = (data: any) => {
      addActivity({
        type: 'lead',
        action: 'updated',
        title: 'Lead Updated',
        description: `${data.updatedBy?.name || 'Unknown User'} updated "${data.lead?.company || 'Unknown Company'}"`,
        user: data.updatedBy,
        timestamp: data.timestamp,
        data
      });
    };

    const handleLeadAssigned = (data: any) => {
      addActivity({
        type: 'lead',
        action: 'assigned',
        title: 'Lead Assigned',
        description: `${data.assignedBy?.name || 'Unknown User'} assigned "${data.lead?.company || 'Unknown Company'}" to ${data.lead?.owner?.name || 'someone'}`,
        user: data.assignedBy,
        timestamp: data.timestamp,
        data
      });
    };

    // Activity events
    const handleActivityCreated = (data: any) => {
      addActivity({
        type: 'activity',
        action: 'created',
        title: 'New Activity Added',
        description: `${data.createdBy?.name || 'Unknown User'} added a ${data.activity?.type || 'activity'} to a lead`,
        user: data.createdBy,
        timestamp: data.timestamp,
        data
      });
    };

    // Register event listeners
    socket.on('lead:created', handleLeadCreated);
    socket.on('lead:updated', handleLeadUpdated);
    socket.on('lead:assigned', handleLeadAssigned);
    socket.on('activity:created', handleActivityCreated);

    // Cleanup
    return () => {
      socket.off('lead:created', handleLeadCreated);
      socket.off('lead:updated', handleLeadUpdated);
      socket.off('lead:assigned', handleLeadAssigned);
      socket.off('activity:created', handleActivityCreated);
    };
  }, [socket, isConnected, user]);

  const addActivity = (activity: Omit<ActivityEvent, 'id'>) => {
    const newActivity: ActivityEvent = {
      ...activity,
      id: Math.random().toString(36).substr(2, 9)
    };

    setActivities(prev => [newActivity, ...prev].slice(0, 50)); // Keep last 50 activities
  };

  const getActivityIcon = (type: string, action: string) => {
    if (type === 'lead') {
      switch (action) {
        case 'created': return '🆕';
        case 'updated': return '✏️';
        case 'assigned': return '👤';
        case 'deleted': return '🗑️';
        default: return '📋';
      }
    } else if (type === 'activity') {
      return '📝';
    }
    return '🔔';
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'lead': return 'bg-blue-50 border-blue-200';
      case 'activity': return 'bg-green-50 border-green-200';
      case 'user': return 'bg-purple-50 border-purple-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const isOwnActivity = (activity: ActivityEvent) => {
    return activity.user.id === user?.id;
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-primary-600 text-white p-3 rounded-full shadow-lg hover:bg-primary-700 transition-colors relative"
      >
        🔔
        {activities.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {activities.length}
          </span>
        )}
      </button>

      {/* Activity Stream Panel */}
      {isExpanded && (
        <div className="absolute bottom-16 right-0 w-80 bg-white rounded-lg shadow-xl border max-h-96 overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Live Activity</h3>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-xs text-gray-500">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {activities.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <div className="text-2xl mb-2">🔔</div>
                <p className="text-sm">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-2 p-2">
                {activities.map(activity => (
                  <div
                    key={activity.id}
                    className={`p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${getActivityColor(activity.type)} ${
                      isOwnActivity(activity) ? 'ring-2 ring-primary-200' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      <span className="text-lg flex-shrink-0">
                        {getActivityIcon(activity.type, activity.action)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {activity.title}
                          </h4>
                          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {formatTime(activity.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {activity.description}
                        </p>
                        {isOwnActivity(activity) && (
                          <span className="inline-block text-xs text-primary-600 font-medium mt-1">
                            You
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {activities.length > 0 && (
            <div className="p-2 border-t bg-gray-50">
              <button
                onClick={() => setActivities([])}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
