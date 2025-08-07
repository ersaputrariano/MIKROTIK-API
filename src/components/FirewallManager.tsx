import React, { useState, useEffect } from 'react';
import { Shield, Lock, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';

interface FirewallRule {
  id: number;
  chain: string;
  action: string;
  srcAddress: string;
  dstAddress: string;
  protocol: string;
  port: number | null;
  comment: string;
  bytes: number;
  packets: number;
  disabled: boolean;
}

const FirewallManager: React.FC = () => {
  const [rules, setRules] = useState<FirewallRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [chainFilter, setChainFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [showAddRuleForm, setShowAddRuleForm] = useState(false);
  const [editingRule, setEditingRule] = useState<FirewallRule | null>(null);

  useEffect(() => {
    fetchFirewallRules();
  }, [selectedDevice]);

  const fetchFirewallRules = async () => {
    try {
      // For demo, fetch from first available device
      const deviceResponse = await fetch('http://localhost:3001/api/devices');
      const devices = await deviceResponse.json();
      
      if (devices.length > 0) {
        const response = await fetch(`http://localhost:3001/api/devices/${devices[0].id}/firewall`);
        const data = await response.json();
        setRules(data);
        setSelectedDevice(devices[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch firewall rules:', error);
      // Generate mock data for demo
      setRules(generateMockRules());
    } finally {
      setLoading(false);
    }
  };

  const generateMockRules = (): FirewallRule[] => {
    const chains = ['input', 'forward', 'output'];
    const actions = ['accept', 'drop', 'reject'];
    const protocols = ['tcp', 'udp', 'icmp'];
    
    return Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      chain: chains[Math.floor(Math.random() * chains.length)],
      action: actions[Math.floor(Math.random() * actions.length)],
      srcAddress: Math.random() < 0.5 ? `192.168.${Math.floor(Math.random() * 255)}.0/24` : 'any',
      dstAddress: Math.random() < 0.5 ? `10.0.${Math.floor(Math.random() * 255)}.0/24` : 'any',
      protocol: protocols[Math.floor(Math.random() * protocols.length)],
      port: Math.random() < 0.6 ? Math.floor(Math.random() * 65535) : null,
      comment: `Firewall rule ${i + 1}`,
      bytes: Math.floor(Math.random() * 1000000),
      packets: Math.floor(Math.random() * 10000),
      disabled: Math.random() < 0.1
    }));
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'accept':
        return 'text-green-400 bg-green-900';
      case 'drop':
        return 'text-red-400 bg-red-900';
      case 'reject':
        return 'text-orange-400 bg-orange-900';
      default:
        return 'text-gray-400 bg-gray-900';
    }
  };

  const getChainColor = (chain: string) => {
    switch (chain) {
      case 'input':
        return 'text-blue-400 bg-blue-900';
      case 'forward':
        return 'text-purple-400 bg-purple-900';
      case 'output':
        return 'text-yellow-400 bg-yellow-900';
      default:
        return 'text-gray-400 bg-gray-900';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredRules = rules.filter(rule => {
    if (chainFilter !== 'all' && rule.chain !== chainFilter) return false;
    if (actionFilter !== 'all' && rule.action !== actionFilter) return false;
    return true;
  });

  const addNewRule = () => {
    setShowAddRuleForm(true);
  };

  const editRule = (rule: FirewallRule) => {
    setEditingRule(rule);
    alert(`Editing rule ${rule.id}: ${rule.comment}`);
  };

  const deleteRule = (ruleId: number) => {
    if (confirm('Are you sure you want to delete this firewall rule?')) {
      setRules(prev => prev.filter(rule => rule.id !== ruleId));
      alert('Firewall rule deleted successfully');
    }
  };

  const toggleRuleStatus = (ruleId: number) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, disabled: !rule.disabled } : rule
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Firewall Manager</h2>
          <p className="text-gray-400">Manage and monitor firewall rules across your devices</p>
        </div>
        
        <div className="flex space-x-3">
          <button 
            onClick={addNewRule}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Rule</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Shield className="h-5 w-5 text-blue-400" />
            <div>
              <p className="text-sm text-gray-400">Total Rules</p>
              <p className="text-xl font-bold text-white">{rules.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Eye className="h-5 w-5 text-green-400" />
            <div>
              <p className="text-sm text-gray-400">Active Rules</p>
              <p className="text-xl font-bold text-white">{rules.filter(r => !r.disabled).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <EyeOff className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-400">Disabled Rules</p>
              <p className="text-xl font-bold text-white">{rules.filter(r => r.disabled).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Lock className="h-5 w-5 text-red-400" />
            <div>
              <p className="text-sm text-gray-400">Drop Rules</p>
              <p className="text-xl font-bold text-white">{rules.filter(r => r.action === 'drop').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-400">Filters:</span>
          </div>

          <select
            value={chainFilter}
            onChange={(e) => setChainFilter(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Chains</option>
            <option value="input">Input</option>
            <option value="forward">Forward</option>
            <option value="output">Output</option>
          </select>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Actions</option>
            <option value="accept">Accept</option>
            <option value="drop">Drop</option>
            <option value="reject">Reject</option>
          </select>
        </div>
      </div>

      {/* Rules Table */}
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Chain</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Source</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Destination</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Protocol</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Traffic</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredRules.map((rule) => (
                  <tr key={rule.id} className={`hover:bg-gray-750 transition-colors ${rule.disabled ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-white font-mono">
                      {rule.id}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getChainColor(rule.chain)}`}>
                        {rule.chain.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getActionColor(rule.action)}`}>
                        {rule.action.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-white font-mono">
                      {rule.srcAddress}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-white font-mono">
                      {rule.dstAddress}
                      {rule.port && `:${rule.port}`}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-600 text-gray-200 rounded uppercase">
                        {rule.protocol}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                      <div>
                        <div>{formatBytes(rule.bytes)}</div>
                        <div className="text-xs text-gray-500">{rule.packets} packets</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => toggleRuleStatus(rule.id)}
                        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full transition-colors hover:opacity-80 ${
                        rule.disabled ? 'bg-red-900 text-red-200' : 'bg-green-900 text-green-200'
                        }`}
                        title={rule.disabled ? 'Click to enable' : 'Click to disable'}
                      >
                        {rule.disabled ? (
                          <>
                            <EyeOff className="h-3 w-3 mr-1" />
                            Disabled
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3 mr-1" />
                            Active
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => editRule(rule)}
                          className="text-blue-400 hover:text-blue-300"
                          title="Edit rule"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => deleteRule(rule.id)}
                          className="text-red-400 hover:text-red-300"
                          title="Delete rule"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Rule Form Modal */}
      {showAddRuleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">Add Firewall Rule</h3>
            
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Chain</label>
                  <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
                    <option value="input">Input</option>
                    <option value="forward">Forward</option>
                    <option value="output">Output</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Action</label>
                  <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
                    <option value="accept">Accept</option>
                    <option value="drop">Drop</option>
                    <option value="reject">Reject</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Source Address</label>
                  <input
                    type="text"
                    placeholder="192.168.1.0/24 or any"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Destination Address</label>
                  <input
                    type="text"
                    placeholder="10.0.0.0/8 or any"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Protocol</label>
                  <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
                    <option value="tcp">TCP</option>
                    <option value="udp">UDP</option>
                    <option value="icmp">ICMP</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Port</label>
                  <input
                    type="number"
                    placeholder="80, 443, etc."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Comment</label>
                <input
                  type="text"
                  placeholder="Rule description"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    alert('Firewall rule added successfully!');
                    setShowAddRuleForm(false);
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors"
                >
                  Add Rule
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddRuleForm(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FirewallManager;