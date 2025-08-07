import React, { useState, useEffect } from 'react';
import { Shield, Router, Activity, AlertTriangle, Users, Lock, Globe, Server } from 'lucide-react';
import Dashboard from './components/Dashboard';
import DeviceManager from './components/DeviceManager';
import SecurityEvents from './components/SecurityEvents';
import NetworkMonitor from './components/NetworkMonitor';
import FirewallManager from './components/FirewallManager';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Handle navigation from hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && navigation.some(nav => nav.id === hash)) {
        setActiveTab(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Check initial hash

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    // Establish WebSocket connection for real-time updates
    const ws = new WebSocket('ws://localhost:3002');
    
    ws.onopen = () => {
      setConnectionStatus('connected');
      setWsConnection(ws);
    };
    
    ws.onclose = () => {
      setConnectionStatus('disconnected');
      setWsConnection(null);
    };
    
    ws.onerror = () => {
      setConnectionStatus('error');
    };
    
    return () => {
      ws.close();
    };
  }, []);

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: Activity },
    { id: 'devices', name: 'Device Manager', icon: Router },
    { id: 'security', name: 'Security Events', icon: Shield },
    { id: 'network', name: 'Network Monitor', icon: Globe },
    { id: 'firewall', name: 'Firewall Rules', icon: Lock },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard wsConnection={wsConnection} />;
      case 'devices':
        return <DeviceManager />;
      case 'security':
        return <SecurityEvents wsConnection={wsConnection} />;
      case 'network':
        return <NetworkMonitor wsConnection={wsConnection} />;
      case 'firewall':
        return <FirewallManager />;
      default:
        return <Dashboard wsConnection={wsConnection} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">MikroTik Security Monitor</h1>
              <p className="text-gray-400 text-sm">Network Security Management System</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              connectionStatus === 'connected' ? 'bg-green-900 text-green-200' :
              connectionStatus === 'error' ? 'bg-red-900 text-red-200' :
              'bg-gray-700 text-gray-300'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-400' :
                connectionStatus === 'error' ? 'bg-red-400' :
                'bg-gray-400'
              }`}></div>
              <span className="capitalize">{connectionStatus}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-gray-800 border-r border-gray-700 min-h-screen p-4">
          <div className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;