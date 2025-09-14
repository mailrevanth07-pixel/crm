import { DashboardStats } from '@/lib/dashboard';

interface KPICardsProps {
  stats: DashboardStats;
  isLoading?: boolean;
}

export default function KPICards({ stats, isLoading = false }: KPICardsProps) {
  const kpiData = [
    {
      title: 'Total Leads',
      value: stats.totalLeads,
      icon: '👥',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'All leads in the system',
    },
    {
      title: 'Open Leads',
      value: stats.openLeads,
      icon: '🔓',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'Leads in progress',
    },
    {
      title: 'Closed Leads',
      value: stats.closedLeads,
      icon: '✅',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      description: 'Completed leads',
    },
    {
      title: 'My Leads',
      value: stats.leadsAssignedToMe,
      icon: '👤',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      description: 'Assigned to you',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="ml-4 flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpiData.map((kpi, index) => (
        <div key={index} className="card hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className={`flex-shrink-0 w-12 h-12 ${kpi.bgColor} rounded-lg flex items-center justify-center`}>
              <span className="text-2xl">{kpi.icon}</span>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500">{kpi.title}</p>
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-1">{kpi.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
