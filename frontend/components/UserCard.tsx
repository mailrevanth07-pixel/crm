import { User } from '@/lib/users';

interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export default function UserCard({ user, onEdit, onDelete, canEdit, canDelete }: UserCardProps) {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'MANAGER':
        return 'bg-yellow-100 text-yellow-800';
      case 'SALES':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return '👑';
      case 'MANAGER':
        return '👨‍💼';
      case 'SALES':
        return '👤';
      default:
        return '👤';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      {/* User Avatar and Basic Info */}
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-lg font-medium text-primary-700">
              {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-gray-900 truncate">
            {user.name || 'No Name'}
          </h3>
          <p className="text-sm text-gray-500 truncate">{user.email}</p>
          <div className="mt-2 flex items-center space-x-2">
            <span className="text-lg">{getRoleIcon(user.role)}</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
              {user.role}
            </span>
          </div>
        </div>
      </div>

      {/* User Details */}
      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Created:</span>
          <span>{formatDate(user.createdAt)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>Last Updated:</span>
          <span>{formatDate(user.updatedAt)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        {canEdit && (
          <button
            onClick={() => onEdit(user)}
            className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center space-x-1"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Edit</span>
          </button>
        )}
        {canDelete && (
          <button
            onClick={() => onDelete(user.id)}
            className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200 transition-colors duration-200 flex items-center justify-center space-x-1"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Delete</span>
          </button>
        )}
      </div>
    </div>
  );
}
