import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color: 'blue' | 'green' | 'red' | 'purple' | 'yellow';
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, trend, color }) => {
  const colorClasses = {
    blue: 'bg-blue-600 text-blue-100',
    green: 'bg-green-600 text-green-100',
    red: 'bg-red-600 text-red-100',
    purple: 'bg-purple-600 text-purple-100',
    yellow: 'bg-yellow-600 text-yellow-100'
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-all transform hover:scale-105 shadow-lg border border-gray-700 hover:border-gray-600">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {trend && (
            <p className="text-gray-500 text-xs mt-2">{trend}</p>
          )}
        </div>
        <div className={`p-4 rounded-xl ${colorClasses[color]} shadow-lg`}>
          <Icon className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;