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
  const [notifications, setNotifications] = useState<string[]>([]);

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
    const connectWebSocket = () => {
      const ws = new WebSocket('ws://localhost:3002');
    
      ws.onopen = () => {
        setConnectionStatus('connected');
        setWsConnection(ws);
        console.log('WebSocket connected');
      };
    
      ws.onclose = () => {
        setConnectionStatus('disconnected');
        setWsConnection(null);
        console.log('WebSocket disconnected');
        
        // Attempt to reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };
    
      ws.onerror = (error) => {
        setConnectionStatus('error');
        console.error('WebSocket error:', error);
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        // Handle different message types
        switch (data.type) {
          case 'device_added':
            setNotifications(prev => [...prev, `Device "${data.device.name}" added successfully`]);
            break;
          case 'device_removed':
            setNotifications(prev => [...prev, `Device removed from monitoring`]);
            break;
          case 'security_scan_complete':
            setNotifications(prev => [...prev, `Security scan completed - ${data.results.vulnerabilities} vulnerabilities found`]);
            break;
          case 'alert_dismissed':
            setNotifications(prev => [...prev, `Security alert dismissed`]);
            break;
        }
      };
      
      return ws;
    };
    
    const ws = connectWebSocket();
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  // Clear notifications after 5 seconds
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications(prev => prev.slice(1));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

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
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.slice(0, 3).map((notification, index) => (
            <div
              key={index}
              className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg animate-slide-in-right"
            >
              {notification}
            </div>
          ))}
        </div>
      )}
      
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
              } ${connectionStatus === 'connected' ? 'animate-pulse' : ''}`}></div>
              <span className="capitalize">{connectionStatus}</span>
            </div>
            
            <div className="text-sm text-gray-400">
              {new Date().toLocaleTimeString()}
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