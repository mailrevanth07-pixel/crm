import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import LeadCard from './LeadCard';
import { Lead, leadsApi } from '@/lib/leads';
import { useSocket } from '@/contexts/SocketContext';

interface LeadListProps {
  onEditLead?: (lead: Lead) => void;
}

export interface LeadListRef {
  refreshLeads: () => void;
}

const LeadList = forwardRef<LeadListRef, LeadListProps>(({ onEditLead }, ref) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const { socket } = useSocket();

  // Expose refreshLeads method to parent component
  useImperativeHandle(ref, () => ({
    refreshLeads: loadLeads
  }));

  // Load leads from API
  const loadLeads = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const leadsData = await leadsApi.getLeads();
      // Ensure leadsData is an array
      setLeads(Array.isArray(leadsData) ? leadsData : []);
    } catch (err: any) {
      console.error('Error loading leads:', err);
      setError('Failed to load leads. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  // Real-time updates via Socket.IO
  useEffect(() => {
    if (socket) {
      const handleLeadCreated = (eventData: any) => {
        // Handle both direct lead object and wrapped event data
        const newLead = eventData.lead || eventData;
        setLeads(prev => Array.isArray(prev) ? [newLead, ...prev] : [newLead]);
      };

      const handleLeadUpdated = (eventData: any) => {
        // Handle both direct lead object and wrapped event data
        const updatedLead = eventData.lead || eventData;
        setLeads(prev => 
          Array.isArray(prev) ? prev.map(lead => 
            lead.id === updatedLead.id ? updatedLead : lead
          ) : []
        );
      };

      socket.on('lead:created', handleLeadCreated);
      socket.on('lead:updated', handleLeadUpdated);

      return () => {
        socket.off('lead:created', handleLeadCreated);
        socket.off('lead:updated', handleLeadUpdated);
      };
    }
  }, [socket]);

  const filteredLeads = (leads || []).filter((lead) => {
    if (filter === 'all') return true;
    // Direct comparison since backend now returns uppercase status
    return lead.status === filter;
  });

  const statusOptions = [
    { value: 'all', label: 'All Leads', color: 'bg-gray-100 text-gray-800' },
    { value: 'NEW', label: 'New', color: 'bg-blue-100 text-blue-800' },
    { value: 'CONTACTED', label: 'Contacted', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'QUALIFIED', label: 'Qualified', color: 'bg-green-100 text-green-800' },
    { value: 'PROPOSAL', label: 'Proposal', color: 'bg-purple-100 text-purple-800' },
    { value: 'NEGOTIATION', label: 'Negotiation', color: 'bg-orange-100 text-orange-800' },
    { value: 'CLOSED_WON', label: 'Closed Won', color: 'bg-green-100 text-green-800' },
    { value: 'CLOSED_LOST', label: 'Closed Lost', color: 'bg-red-100 text-red-800' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="flex items-start space-x-4">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 text-6xl mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading leads</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <button
          onClick={loadLeads}
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div className="flex space-x-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`px-3 py-1 text-sm font-medium rounded-full transition-colors border ${
                filter === option.value
                  ? `${option.color} border-current`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="text-sm text-gray-500">
          {filteredLeads.length} of {(leads || []).length} leads
        </div>
      </div>

      {/* Leads grid */}
      {filteredLeads.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">👥</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
          <p className="text-gray-500">
            {filter === 'all' 
              ? 'Get started by adding your first lead.' 
              : `No leads with status "${filter}" found.`
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map((lead) => (
            <LeadCard 
              key={lead.id} 
              lead={lead} 
              onEdit={onEditLead ? () => onEditLead(lead) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
});

LeadList.displayName = 'LeadList';

export default LeadList;
