import React, { useState, useEffect } from 'react';
import { Filter, Search, AlertTriangle, Shield, Clock, Eye } from 'lucide-react';

interface SecurityEvent {
  id: string;
  deviceId: string;
  timestamp: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  details: any;
  acknowledged: boolean;
}

interface SecurityEventsProps {
  wsConnection: WebSocket | null;
}

const SecurityEvents: React.FC<SecurityEventsProps> = ({ wsConnection }) => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchEvents();
    
    const interval = setInterval(fetchEvents, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (wsConnection) {
      wsConnection.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'security_event') {
          setEvents(prev => [data.event, ...prev]);
        }
      };
    }
  }, [wsConnection]);

  useEffect(() => {
    let filtered = events;

    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter(event => event.severity === severityFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(event => event.type === typeFilter);
    }

    setFilteredEvents(filtered);
  }, [events, searchTerm, severityFilter, typeFilter]);

  const acknowledgeEvent = async (eventId: string) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId ? { ...event, acknowledged: true } : event
    ));
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/security/events');
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
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

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'high_risk_connection':
        return AlertTriangle;
      case 'connection_flooding':
        return Shield;
      default:
        return Eye;
    }
  };

  const eventTypes = [...new Set(events.map(e => e.type))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Security Events</h2>
        <p className="text-gray-400">Monitor and analyze security events across your network</p>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Types</option>
            {eventTypes.map(type => (
              <option key={type} value={type}>
                {type.replace(/_/g, ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg">
          <Shield className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No events found</h3>
          <p className="text-gray-400">Try adjusting your search filters</p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            {filteredEvents.map((event) => {
              const Icon = getEventTypeIcon(event.type);
              
              return (
                <div key={event.id} className="border-b border-gray-700 last:border-b-0 hover:bg-gray-750 transition-colors">
                  <div className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${getSeverityColor(event.severity)}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-white">
                            {event.description}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-gray-400">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(event.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3 mt-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(event.severity)}`}>
                            {event.severity.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500">
                            {event.type.replace(/_/g, ' ').toUpperCase()}
                          </span>
                          {event.details?.srcIP && (
                            <span className="text-xs text-gray-500">
                              Source: {event.details.srcIP}
                            </span>
                          )}
                        </div>
                        
                        {event.details && (
                          <div className="mt-2 p-2 bg-gray-900 rounded text-xs text-gray-400">
                            <pre className="whitespace-pre-wrap">
                              {JSON.stringify(event.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                      
                      {!event.acknowledged && (
                        <button 
                          onClick={() => acknowledgeEvent(event.id)}
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityEvents;