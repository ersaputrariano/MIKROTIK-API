import React, { useState, useEffect } from 'react';
import { Shield, Router, AlertTriangle, Activity, TrendingUp, Users, Globe, Zap, RefreshCw, Download, Search } from 'lucide-react';
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
  const [refreshing, setRefreshing] = useState(false);
  const [scanInProgress, setScanInProgress] = useState(false);

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
        if (data.type === 'stats_update' || data.type === 'device_update') {
          setStats(data.stats);
        } else if (data.type === 'security_scan_complete') {
          setScanInProgress(false);
          alert(`Security scan completed!\n\nDevices scanned: ${data.results.devicesScanned}\nVulnerabilities found: ${data.results.vulnerabilities}\nThreats detected: ${data.results.threats}`);
        }
      };
    }
  }, [wsConnection]);

  const fetchDashboardStats = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('http://localhost:3001/api/dashboard/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      alert('Failed to refresh dashboard data. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const runSecurityScan = async () => {
    if (scanInProgress) return;
    
    const confirmed = confirm('This will run a comprehensive security scan on all connected devices. Continue?');
    if (!confirmed) return;
    
    setScanInProgress(true);
    
    try {
      const response = await fetch('http://localhost:3001/api/security/scan', {
        method: 'POST'
      });
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message);
      }
    } catch (error) {
      setScanInProgress(false);
      alert('Security scan failed: ' + error);
    }
  };

  const generateReport = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalDevices: stats?.totalDevices || 0,
        activeDevices: stats?.activeDevices || 0,
        totalAlerts: stats?.totalAlerts || 0,
        criticalAlerts: stats?.criticalAlerts || 0
      },
      recentEvents: stats?.recentEvents || [],
      networkTraffic: stats?.networkTraffic || [],
      generatedBy: 'MikroTik Security Monitor',
      version: '1.0.0'
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    alert('Security report downloaded successfully!');
  };

  const navigateToTab = (tabId: string) => {
    window.location.hash = `#${tabId}`;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="text-gray-400">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Security Dashboard</h2>
          <p className="text-gray-400">Real-time network security monitoring and analytics</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={fetchDashboardStats}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
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
          <AlertPanel onViewAll={() => {
            window.location.hash = '#security';
            window.dispatchEvent(new HashChangeEvent('hashchange'));
          }} />
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
          onClick={() => navigateToTab('devices')}
          className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg transition-all transform hover:scale-105 shadow-lg"
        >
          <div className="flex items-center space-x-3">
            <Router className="h-8 w-8" />
            <div className="text-left">
              <div className="font-semibold text-lg">Manage Devices</div>
              <div className="text-sm opacity-80">Add and configure MikroTik routers</div>
            </div>
          </div>
        </button>
        
        <button 
          onClick={runSecurityScan}
          disabled={scanInProgress}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white p-6 rounded-lg transition-all transform hover:scale-105 shadow-lg"
        >
          <div className="flex items-center space-x-3">
            <Shield className={`h-8 w-8 ${scanInProgress ? 'animate-pulse' : ''}`} />
            <div className="text-left">
              <div className="font-semibold text-lg">
                {scanInProgress ? 'Scanning...' : 'Security Scan'}
              </div>
              <div className="text-sm opacity-80">
                {scanInProgress ? 'Analyzing devices...' : 'Run comprehensive security analysis'}
              </div>
            </div>
          </div>
        </button>
        
        <button 
          onClick={generateReport}
          className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-lg transition-all transform hover:scale-105 shadow-lg"
        >
          <div className="flex items-center space-x-3">
            <Download className="h-8 w-8" />
            <div className="text-left">
              <div className="font-semibold text-lg">Export Report</div>
              <div className="text-sm opacity-80">Download comprehensive security report</div>
            </div>
          </div>
        </button>
      </div>
      
      {/* System Status */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-gray-300">API Server: Online</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-gray-300">WebSocket: Connected</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
            <span className="text-gray-300">Monitoring: Active</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
            <span className="text-gray-300">Last Update: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;