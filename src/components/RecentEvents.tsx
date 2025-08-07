import React from 'react';
import { AlertTriangle, Shield, Lock, Globe } from 'lucide-react';

interface SecurityEvent {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: string;
  deviceId?: string;
}

interface RecentEventsProps {
  events: SecurityEvent[];
}

const RecentEvents: React.FC<RecentEventsProps> = ({ events }) => {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'high_risk_connection':
        return AlertTriangle;
      case 'connection_flooding':
        return Globe;
      case 'suspicious_port_access':
        return Lock;
      default:
        return Shield;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-400 bg-red-900';
      case 'high':
        return 'text-orange-400 bg-orange-900';
      case 'medium':
        return 'text-yellow-400 bg-yellow-900';
      default:
        return 'text-blue-400 bg-blue-900';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No recent security events</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {events.map((event) => {
        const Icon = getEventIcon(event.type);
        
        return (
          <div key={event.id} className="flex items-start space-x-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-650 transition-colors">
            <div className={`p-2 rounded-lg ${getSeverityColor(event.severity)}`}>
              <Icon className="h-4 w-4" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-white truncate">
                  {event.description}
                </p>
                <span className="text-xs text-gray-400 ml-2">
                  {formatTime(event.timestamp)}
                </span>
              </div>
              
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(event.severity)}`}>
                  {event.severity.toUpperCase()}
                </span>
                <span className="text-xs text-gray-500">
                  {event.type.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RecentEvents;