import Link from 'next/link';
import { Lead } from '@/lib/leads';

interface LeadCardProps {
  lead: Lead;
  onEdit?: () => void;
}

export default function LeadCard({ lead, onEdit }: LeadCardProps) {
  const getStatusColor = (status: string) => {
    // Normalize status to handle both uppercase and lowercase formats
    const normalizedStatus = status.toUpperCase().replace('-', '_');
    
    switch (normalizedStatus) {
      case 'NEW':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CONTACTED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'QUALIFIED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusDisplayName = (status: string) => {
    // Normalize status to handle both uppercase and lowercase formats
    const normalizedStatus = status.toUpperCase().replace('-', '_');
    
    switch (normalizedStatus) {
      case 'NEW':
        return 'New';
      case 'CONTACTED':
        return 'Contacted';
      case 'QUALIFIED':
        return 'Qualified';
      case 'CLOSED':
        return 'Closed';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="card hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <Link href={`/leads/${lead.id}`}>
            <h3 className="text-lg font-medium text-gray-900 hover:text-primary-600 cursor-pointer">
              {lead.title}
            </h3>
          </Link>
          <p className="text-sm text-gray-600">{lead.description}</p>
          <p className="text-sm text-gray-500">Owner: {lead.owner?.name || 'Unassigned'}</p>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
              lead.status
            )}`}
          >
            {getStatusDisplayName(lead.status)}
          </span>
          <span className="text-xs text-gray-500">Created {formatDate(lead.createdAt)}</span>
        </div>
      </div>
      
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 text-sm text-gray-500">
        <span>Updated {formatDate(lead.updatedAt)}</span>
        <div className="flex space-x-2">
          {onEdit && (
            <button 
              onClick={onEdit}
              className="text-primary-600 hover:text-primary-900"
            >
              Edit
            </button>
          )}
          <button className="text-gray-400 hover:text-gray-600">
            ⋯
          </button>
        </div>
      </div>
    </div>
  );
}
