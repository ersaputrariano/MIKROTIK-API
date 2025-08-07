import React, { useState, useEffect } from 'react';
import { Globe, Users, Activity, RefreshCw, Filter, Download } from 'lucide-react';

interface Connection {
  id: string;
  protocol: string;
  srcAddress: string;
  dstAddress: string;
  srcPort: number;
  dstPort: number;
  state: string;
  bytes: number;
  packets: number;
  risk: 'low' | 'medium' | 'high';
}

interface NetworkMonitorProps {
  wsConnection: WebSocket | null;
}

const NetworkMonitor: React.FC<NetworkMonitorProps> = ({ wsConnection }) => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<string>('all');
  const [protocolFilter, setProtocolFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');

  useEffect(() => {
    fetchConnections();
    
    const interval = setInterval(fetchConnections, 10000);
    return () => clearInterval(interval);
  }, [selectedDevice]);

  useEffect(() => {
    if (wsConnection) {
      wsConnection.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'device_update' && data.connections) {
          setConnections(data.connections);
        }
      };
    }
  }, [wsConnection]);

  const fetchConnections = async () => {
    try {
      // For demo, we'll use the first device or mock data
      const deviceResponse = await fetch('http://localhost:3001/api/devices');
      const devices = await deviceResponse.json();
      
      if (devices.length > 0) {
        const response = await fetch(`http://localhost:3001/api/devices/${devices[0].id}/connections`);
        const data = await response.json();
        setConnections(data);
      }
    } catch (error) {
      console.error('Failed to fetch connections:', error);
      // Generate mock data for demo
      setConnections(generateMockConnections());
    } finally {
      setLoading(false);
    }
  };

  const generateMockConnections = (): Connection[] => {
    const mockConnections: Connection[] = [];
    const protocols = ['tcp', 'udp', 'icmp'];
    const states = ['established', 'time-wait', 'syn-sent'];
    const risks = ['low', 'medium', 'high'];

    for (let i = 0; i < 25; i++) {
      mockConnections.push({
        id: `conn-${i}`,
        protocol: protocols[Math.floor(Math.random() * protocols.length)],
        srcAddress: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
        dstAddress: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        srcPort: Math.floor(Math.random() * 65535),
        dstPort: Math.floor(Math.random() * 65535),
        state: states[Math.floor(Math.random() * states.length)],
        bytes: Math.floor(Math.random() * 1000000),
        packets: Math.floor(Math.random() * 10000),
        risk: risks[Math.floor(Math.random() * risks.length)] as 'low' | 'medium' | 'high'
      });
    }

    return mockConnections;
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'text-red-400 bg-red-900';
      case 'medium':
        return 'text-yellow-400 bg-yellow-900';
      default:
        return 'text-green-400 bg-green-900';
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'established':
        return 'text-green-400';
      case 'time-wait':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const filteredConnections = connections.filter(conn => {
    if (protocolFilter !== 'all' && conn.protocol !== protocolFilter) return false;
    if (riskFilter !== 'all' && conn.risk !== riskFilter) return false;
    return true;
  });

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const exportConnections = () => {
    if (filteredConnections.length === 0) {
      alert('No connections to export');
      return;
    }
    
    const csvContent = [
      ['Protocol', 'Source', 'Destination', 'State', 'Bytes', 'Packets', 'Risk'],
      ...filteredConnections.map(conn => [
        conn.protocol,
        `${conn.srcAddress}:${conn.srcPort}`,
        `${conn.dstAddress}:${conn.dstPort}`,
        conn.state,
        conn.bytes.toString(),
        conn.packets.toString(),
        conn.risk
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `network-connections-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    alert(`Exported ${filteredConnections.length} connections to CSV file`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Network Monitor</h2>
          <p className="text-gray-400">Real-time network connection monitoring</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={fetchConnections}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          
          <button 
            onClick={exportConnections}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Active Connections</p>
              <p className="text-2xl font-bold text-white">{connections.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-green-600 p-2 rounded-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Unique IPs</p>
              <p className="text-2xl font-bold text-white">
                {new Set(connections.map(c => c.srcAddress)).size}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-red-600 p-2 rounded-lg">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-400">High Risk</p>
              <p className="text-2xl font-bold text-white">
                {connections.filter(c => c.risk === 'high').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-400">Filters:</span>
          </div>

          <select
            value={protocolFilter}
            onChange={(e) => setProtocolFilter(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Protocols</option>
            <option value="tcp">TCP</option>
            <option value="udp">UDP</option>
            <option value="icmp">ICMP</option>
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Risk Levels</option>
            <option value="high">High Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="low">Low Risk</option>
          </select>
        </div>
      </div>

      {/* Connections Table */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Protocol</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Source</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Destination</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">State</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Traffic</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredConnections.map((connection) => (
                  <tr key={connection.id} className="hover:bg-gray-750 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-600 text-gray-200 rounded uppercase">
                        {connection.protocol}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                      {connection.srcAddress}:{connection.srcPort}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                      {connection.dstAddress}:{connection.dstPort}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getStateColor(connection.state)}`}>
                        {connection.state}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                      <div>
                        <div>{formatBytes(connection.bytes)}</div>
                        <div className="text-xs text-gray-500">{connection.packets} packets</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(connection.risk)}`}>
                        {connection.risk.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkMonitor;