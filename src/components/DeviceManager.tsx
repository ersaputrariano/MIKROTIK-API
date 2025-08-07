import React, { useState, useEffect } from 'react';
import { Plus, Router, Wifi, WifiOff, Settings, Trash2, RefreshCw } from 'lucide-react';

interface Device {
  id: string;
  name: string;
  host: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSeen: string;
  version?: string;
  uptime?: string;
}

const DeviceManager: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    username: '',
    password: ''
  });
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/devices');
      const data = await response.json();
      setDevices(data);
    } catch (error) {
      console.error('Failed to fetch devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:3001/api/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchDevices();
        setShowAddForm(false);
        setFormData({ name: '', host: '', username: '', password: '' });
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('Failed to add device: ' + error);
    }
  };

  const deleteDevice = async (deviceId: string) => {
    if (confirm('Are you sure you want to remove this device?')) {
      try {
        // In a real implementation, this would call the API to delete the device
        setDevices(prev => prev.filter(device => device.id !== deviceId));
        alert('Device removed successfully');
      } catch (error) {
        alert('Failed to remove device: ' + error);
      }
    }
  };

  const viewDeviceDetails = (deviceId: string) => {
    setSelectedDevice(deviceId);
    // In a real implementation, this would open a modal or navigate to device details
    alert(`Viewing details for device: ${deviceId}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <Wifi className="h-5 w-5 text-green-400" />;
      case 'disconnected':
        return <WifiOff className="h-5 w-5 text-gray-400" />;
      default:
        return <WifiOff className="h-5 w-5 text-red-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      connected: 'bg-green-900 text-green-200 border-green-700',
      disconnected: 'bg-gray-900 text-gray-200 border-gray-700',
      error: 'bg-red-900 text-red-200 border-red-700'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${colors[status as keyof typeof colors]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Device Manager</h2>
          <p className="text-gray-400">Manage your MikroTik devices and monitor their status</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={fetchDevices}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Device</span>
          </button>
        </div>
      </div>

      {/* Add Device Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Add MikroTik Device</h3>
            
            <form onSubmit={handleAddDevice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Device Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="e.g., Main Router"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">IP Address</label>
                <input
                  type="text"
                  value={formData.host}
                  onChange={(e) => setFormData({...formData, host: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="192.168.1.1"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="admin"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
                >
                  Add Device
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Devices List */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : devices.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg">
          <Router className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No devices configured</h3>
          <p className="text-gray-400 mb-4">Add your first MikroTik device to start monitoring</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Add Device
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {devices.map((device) => (
            <div key={device.id} className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <Router className="h-6 w-6 text-blue-400" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-white">{device.name}</h3>
                    <p className="text-gray-400">{device.host}</p>
                    {device.version && (
                      <p className="text-sm text-gray-500">RouterOS {device.version}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    {getStatusBadge(device.status)}
                    <p className="text-sm text-gray-500 mt-1">
                      Last seen: {new Date(device.lastSeen).toLocaleString()}
                    </p>
                    {device.uptime && (
                      <p className="text-sm text-gray-500">Uptime: {device.uptime}</p>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    {getStatusIcon(device.status)}
                    
                    <button 
                      onClick={() => viewDeviceDetails(device.id)}
                      className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                      title="Device settings"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                    
                    <button 
                      onClick={() => deleteDevice(device.id)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      title="Remove device"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeviceManager;