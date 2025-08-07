import crypto from 'crypto';

export class SecurityMonitor {
  constructor() {
    this.events = [];
    this.alerts = [];
    this.suspiciousIPs = new Set();
    this.connectionThresholds = {
      maxConnectionsPerIP: 100,
      maxConnectionsPerPort: 50,
      suspiciousPortsThreshold: 10
    };
  }

  analyzeConnections(deviceId, connections) {
    const analysis = this.performConnectionAnalysis(connections);
    
    // Generate events based on analysis
    if (analysis.suspiciousActivity.length > 0) {
      analysis.suspiciousActivity.forEach(activity => {
        this.addSecurityEvent(deviceId, activity);
      });
    }
    
    // Check for alerts
    this.checkForAlerts(deviceId, analysis);
  }

  performConnectionAnalysis(connections) {
    const ipCounts = new Map();
    const portCounts = new Map();
    const suspiciousActivity = [];
    
    connections.forEach(conn => {
      // Count connections per IP
      const srcIP = conn.srcAddress;
      ipCounts.set(srcIP, (ipCounts.get(srcIP) || 0) + 1);
      
      // Count connections per port
      const port = conn.dstPort;
      portCounts.set(port, (portCounts.get(port) || 0) + 1);
      
      // Check for high-risk connections
      if (conn.risk === 'high') {
        suspiciousActivity.push({
          type: 'high_risk_connection',
          srcIP: conn.srcAddress,
          dstIP: conn.dstAddress,
          port: conn.dstPort,
          protocol: conn.protocol
        });
      }
      
      // Check for suspicious ports
      if (this.isSuspiciousPort(conn.dstPort)) {
        suspiciousActivity.push({
          type: 'suspicious_port_access',
          srcIP: conn.srcAddress,
          port: conn.dstPort,
          protocol: conn.protocol
        });
      }
    });
    
    // Check for connection flooding
    for (const [ip, count] of ipCounts.entries()) {
      if (count > this.connectionThresholds.maxConnectionsPerIP) {
        suspiciousActivity.push({
          type: 'connection_flooding',
          srcIP: ip,
          connectionCount: count
        });
        this.suspiciousIPs.add(ip);
      }
    }
    
    return {
      totalConnections: connections.length,
      uniqueIPs: ipCounts.size,
      topPorts: Array.from(portCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
      suspiciousActivity
    };
  }

  isSuspiciousPort(port) {
    const suspiciousPorts = [
      1433, 3389, 5432, 6379, // Database and remote access
      23, 135, 139, 445, // Legacy/vulnerable services
      4444, 5555, 6666, // Common backdoor ports
      31337, 12345 // Hacker ports
    ];
    return suspiciousPorts.includes(port);
  }

  addSecurityEvent(deviceId, activity) {
    const event = {
      id: crypto.randomUUID(),
      deviceId,
      timestamp: new Date().toISOString(),
      type: activity.type,
      severity: this.getSeverity(activity.type),
      description: this.getEventDescription(activity),
      details: activity,
      acknowledged: false
    };
    
    this.events.unshift(event);
    
    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events = this.events.slice(0, 1000);
    }
    
    // Create alert for critical events
    if (event.severity === 'critical') {
      this.createAlert(event);
    }
  }

  getSeverity(eventType) {
    const severityMap = {
      'high_risk_connection': 'critical',
      'connection_flooding': 'high',
      'suspicious_port_access': 'medium',
      'unusual_traffic_pattern': 'low'
    };
    return severityMap[eventType] || 'low';
  }

  getEventDescription(activity) {
    const descriptions = {
      'high_risk_connection': `High-risk connection detected from ${activity.srcIP} to ${activity.dstIP}:${activity.port}`,
      'connection_flooding': `Potential DDoS attack from ${activity.srcIP} with ${activity.connectionCount} connections`,
      'suspicious_port_access': `Suspicious port ${activity.port} accessed by ${activity.srcIP}`,
      'unusual_traffic_pattern': 'Unusual traffic pattern detected'
    };
    return descriptions[activity.type] || 'Security event detected';
  }

  createAlert(event) {
    const alert = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      severity: event.severity,
      title: `Security Alert: ${event.type.replace(/_/g, ' ').toUpperCase()}`,
      description: event.description,
      deviceId: event.deviceId,
      eventId: event.id,
      acknowledged: false,
      resolved: false
    };
    
    this.alerts.unshift(alert);
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(0, 100);
    }
  }

  getRecentEvents(limit = 50) {
    return this.events.slice(0, limit);
  }

  getActiveAlerts() {
    return this.alerts.filter(alert => !alert.resolved);
  }
}