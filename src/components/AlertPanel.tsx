import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Clock, CheckCircle } from 'lucide-react';

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  acknowledged: boolean;
  resolved: boolean;
}

const AlertPanel: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/security/alerts');
      const data = await response.json();
      setAlerts(data);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-900/20 text-red-400';
      case 'high':
        return 'border-orange-500 bg-orange-900/20 text-orange-400';
      case 'medium':
        return 'border-yellow-500 bg-yellow-900/20 text-yellow-400';
      default:
        return 'border-blue-500 bg-blue-900/20 text-blue-400';
    }
  };

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - alertTime.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return alertTime.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
        <p>No active alerts</p>
        <p className="text-sm">All systems are secure</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-80 overflow-y-auto">
      {alerts.slice(0, 5).map((alert) => (
        <div key={alert.id} className={`border-l-4 p-3 rounded-r-lg ${getSeverityColor(alert.severity)}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2 flex-1">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white">{alert.title}</p>
                <p className="text-xs text-gray-400 mt-1">{alert.description}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="inline-flex items-center space-x-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{formatTime(alert.timestamp)}</span>
                  </span>
                  <span className="text-xs font-medium uppercase tracking-wider">
                    {alert.severity}
                  </span>
                </div>
              </div>
            </div>
            
            <button className="text-gray-400 hover:text-white ml-2">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
      
      {alerts.length > 5 && (
        <div className="text-center py-2">
          <button className="text-blue-400 hover:text-blue-300 text-sm">
            View all {alerts.length} alerts →
          </button>
        </div>
      )}
    </div>
  );
};

export default AlertPanel;