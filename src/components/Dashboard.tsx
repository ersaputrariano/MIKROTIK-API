import React, { useState, useEffect } from 'react';
import { Shield, Router, AlertTriangle, Activity, TrendingUp, Users, Globe, Zap } from 'lucide-react';
import StatsCard from './StatsCard';
import TrafficChart from './TrafficChart';
import RecentEvents from './RecentEvents';
import AlertPanel from './AlertPanel';

interface DashboardProps {
  wsConnection: WebSocket | null;
}

interface DashboardStats {
  totalDevices: number;
  activeDevices: number;
  totalAlerts: number;
  criticalAlerts: number;
  recentEvents: any[];
  networkTraffic: any[];
}

const Dashboard: React.FC<DashboardProps> = ({ wsConnection }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
    
    // Set up periodic refresh
    const interval = setInterval(fetchDashboardStats, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (wsConnection) {
      wsConnection.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'stats_update') {
          setStats(data.stats);
        }
      };
    }
  }, [wsConnection]);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/dashboard/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Security Dashboard</h2>
        <p className="text-gray-400">Real-time network security monitoring and analytics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Devices"
          value={stats?.totalDevices || 0}
          icon={Router}
          trend={'+2 from last week'}
          color="blue"
        />
        <StatsCard
          title="Active Devices"
          value={stats?.activeDevices || 0}
          icon={Activity}
          trend="All systems operational"
          color="green"
        />
        <StatsCard
          title="Security Alerts"
          value={stats?.totalAlerts || 0}
          icon={AlertTriangle}
          trend={`${stats?.criticalAlerts || 0} critical`}
          color="red"
        />
        <StatsCard
          title="Uptime"
          value="99.9%"
          icon={Zap}
          trend="Last 30 days"
          color="purple"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Network Traffic Chart */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Network Traffic</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Globe className="h-4 w-4" />
              <span>Last 24 Hours</span>
            </div>
          </div>
          <TrafficChart data={stats?.networkTraffic || []} />
        </div>

        {/* Active Alerts */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Active Alerts</h3>
            <div className="flex items-center space-x-2 text-sm text-red-400">
              <AlertTriangle className="h-4 w-4" />
              <span>{stats?.criticalAlerts || 0} Critical</span>
            </div>
          </div>
          <AlertPanel />
        </div>
      </div>

      {/* Recent Events */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Recent Security Events</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Shield className="h-4 w-4" />
            <span>Last 1 Hour</span>
          </div>
        </div>
        <RecentEvents events={stats?.recentEvents || []} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button 
          onClick={() => window.location.hash = '#devices'}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg transition-colors"
        >
          <Router className="h-6 w-6 mb-2" />
          <div className="text-left">
            <div className="font-semibold">Add Device</div>
            <div className="text-sm opacity-80">Connect new MikroTik router</div>
          </div>
        </button>
        
        <button 
          onClick={() => {
            alert('Security scan initiated! This will analyze all connected devices for vulnerabilities.');
            // In a real implementation, this would trigger a security scan
          }}
          className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg transition-colors"
        >
          <Shield className="h-6 w-6 mb-2" />
          <div className="text-left">
            <div className="font-semibold">Security Scan</div>
            <div className="text-sm opacity-80">Run comprehensive scan</div>
          </div>
        </button>
        
        <button 
          onClick={() => {
            const reportData = {
              timestamp: new Date().toISOString(),
              devices: stats?.totalDevices || 0,
              alerts: stats?.totalAlerts || 0,
              events: stats?.recentEvents?.length || 0
            };
            const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `security-report-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg transition-colors"
        >
          <TrendingUp className="h-6 w-6 mb-2" />
          <div className="text-left">
            <div className="font-semibold">Generate Report</div>
            <div className="text-sm opacity-80">Export security report</div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Dashboard;