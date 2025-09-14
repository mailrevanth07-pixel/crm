import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { LeadStatusData } from '@/lib/dashboard';

interface LeadsByStatusChartProps {
  data: LeadStatusData[];
  isLoading?: boolean;
}

// Color palette for different status values
const COLOR_PALETTE = [
  '#3B82F6', // Blue - Status 0
  '#F59E0B', // Amber - Status 1
  '#10B981', // Emerald - Status 2
  '#8B5CF6', // Violet - Status 3
  '#EF4444', // Red - Status 4
  '#06B6D4', // Cyan - Status 5
  '#F97316', // Orange - Status 6
];

const STATUS_LABELS = {
  '0': 'New',
  '1': 'Contacted',
  '2': 'Qualified',
  '3': 'Proposal',
  '4': 'Negotiation',
  '5': 'Closed Won',
  '6': 'Closed Lost',
  // Legacy string status support
  'NEW': 'New',
  'CONTACTED': 'Contacted',
  'QUALIFIED': 'Qualified',
  'PROPOSAL': 'Proposal',
  'NEGOTIATION': 'Negotiation',
  'CLOSED_WON': 'Closed Won',
  'CLOSED_LOST': 'Closed Lost',
  'CLOSED': 'Closed',
  // Lowercase with dashes support
  'new': 'New',
  'contacted': 'Contacted',
  'qualified': 'Qualified',
  'proposal': 'Proposal',
  'negotiation': 'Negotiation',
  'closed-won': 'Closed Won',
  'closed-lost': 'Closed Lost',
  'closed': 'Closed',
};

export default function LeadsByStatusChart({ data, isLoading = false }: LeadsByStatusChartProps) {
  const chartData = data.map((item, index) => {
    // Get color from palette based on status or index
    let color = '#6B7280'; // default grey
    if (typeof item.status === 'number') {
      color = COLOR_PALETTE[item.status] || COLOR_PALETTE[index % COLOR_PALETTE.length];
    } else if (typeof item.status === 'string') {
      // Handle string statuses (legacy support)
      const statusNum = parseInt(item.status);
      if (!isNaN(statusNum)) {
        color = COLOR_PALETTE[statusNum] || COLOR_PALETTE[index % COLOR_PALETTE.length];
      } else {
        // Handle named statuses
        color = COLOR_PALETTE[index % COLOR_PALETTE.length];
      }
    } else {
      color = COLOR_PALETTE[index % COLOR_PALETTE.length];
    }

    return {
      ...item,
      fill: color,
      label: STATUS_LABELS[item.status.toString() as keyof typeof STATUS_LABELS] || `Status ${item.status}`,
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.label}</p>
          <p className="text-sm text-gray-600">
            {data.count} leads ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center space-x-1 sm:space-x-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs sm:text-sm text-gray-600">
              {entry.value} ({entry.payload.count})
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Leads by Status</h3>
        </div>
        <div className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Leads by Status</h3>
        </div>
        <div className="h-80 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <p className="text-gray-500">No data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Leads by Status</h3>
        <div className="text-sm text-gray-500">
          Total: {data.reduce((sum, item) => sum + item.count, 0)} leads
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={2}
              dataKey="count"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
