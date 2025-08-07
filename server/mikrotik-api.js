import axios from 'axios';
import crypto from 'crypto';

export class MikroTikAPI {
  constructor({ name, host, username, password }) {
    this.id = crypto.randomUUID();
    this.name = name;
    this.host = host;
    this.username = username;
    this.password = password;
    this.status = 'disconnected';
    this.lastSeen = null;
    this.version = null;
    this.uptime = null;
    this.sessionCookie = null;
  }

  async connect() {
    try {
      // Simulate MikroTik API connection (replace with actual RouterOS API calls)
      const response = await this.makeRequest('/rest/system/identity');
      this.status = 'connected';
      this.lastSeen = new Date().toISOString();
      this.version = '7.11.2'; // Mock version
      return true;
    } catch (error) {
      this.status = 'error';
      throw new Error(`Failed to connect to ${this.host}: ${error.message}`);
    }
  }

  async makeRequest(endpoint, method = 'GET', data = null) {
    // Mock API responses for demo purposes
    // In production, replace with actual MikroTik RouterOS API calls
    
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
    
    if (Math.random() < 0.1) { // 10% chance of connection error for demo
      throw new Error('Connection timeout');
    }

    switch (endpoint) {
      case '/rest/system/identity':
        return { name: this.name };
      case '/rest/system/resource':
        return this.generateSystemStatus();
      case '/rest/ip/firewall/connection':
        return this.generateConnections();
      case '/rest/ip/firewall/filter':
        return this.generateFirewallRules();
      default:
        return {};
    }
  }

  async getSystemStatus() {
    const data = await this.makeRequest('/rest/system/resource');
    this.uptime = data.uptime;
    return data;
  }

  generateSystemStatus() {
    const uptime = Math.floor(Math.random() * 86400 * 30); // Up to 30 days
    return {
      uptime: `${Math.floor(uptime / 86400)}d ${Math.floor((uptime % 86400) / 3600)}h`,
      cpuLoad: Math.floor(Math.random() * 100),
      memoryUsage: Math.floor(Math.random() * 100),
      diskUsage: Math.floor(Math.random() * 100),
      temperature: Math.floor(Math.random() * 20) + 40, // 40-60°C
      voltage: (Math.random() * 2 + 11).toFixed(1), // 11-13V
      totalMemory: '1024MB',
      freeMemory: `${1024 - Math.floor(Math.random() * 512)}MB`,
      architecture: 'arm64',
      boardName: 'RB4011iGS+',
      version: '7.11.2'
    };
  }

  async getActiveConnections() {
    return await this.makeRequest('/rest/ip/firewall/connection');
  }

  generateConnections() {
    const connections = [];
    const protocols = ['tcp', 'udp', 'icmp'];
    const commonPorts = [80, 443, 22, 21, 25, 53, 123, 993, 995];
    
    for (let i = 0; i < Math.floor(Math.random() * 50) + 10; i++) {
      const isExternal = Math.random() < 0.3;
      connections.push({
        id: crypto.randomUUID(),
        protocol: protocols[Math.floor(Math.random() * protocols.length)],
        srcAddress: isExternal ? this.generateExternalIP() : this.generateLocalIP(),
        dstAddress: isExternal ? this.generateLocalIP() : this.generateExternalIP(),
        srcPort: Math.floor(Math.random() * 65535),
        dstPort: commonPorts[Math.floor(Math.random() * commonPorts.length)],
        state: ['established', 'time-wait', 'syn-sent'][Math.floor(Math.random() * 3)],
        timeout: Math.floor(Math.random() * 3600),
        bytes: Math.floor(Math.random() * 1000000),
        packets: Math.floor(Math.random() * 1000),
        risk: Math.random() < 0.1 ? 'high' : Math.random() < 0.2 ? 'medium' : 'low'
      });
    }
    
    return connections;
  }

  generateLocalIP() {
    return `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  }

  generateExternalIP() {
    const ranges = ['8.8.8.', '1.1.1.', '208.67.222.', '94.140.14.'];
    const range = ranges[Math.floor(Math.random() * ranges.length)];
    return range + Math.floor(Math.random() * 255);
  }

  async getFirewallRules() {
    return await this.makeRequest('/rest/ip/firewall/filter');
  }

  generateFirewallRules() {
    const actions = ['accept', 'drop', 'reject'];
    const chains = ['input', 'forward', 'output'];
    
    const rules = [];
    for (let i = 0; i < 20; i++) {
      rules.push({
        id: i,
        chain: chains[Math.floor(Math.random() * chains.length)],
        action: actions[Math.floor(Math.random() * actions.length)],
        srcAddress: Math.random() < 0.5 ? this.generateLocalIP() + '/24' : 'any',
        dstAddress: Math.random() < 0.5 ? this.generateExternalIP() : 'any',
        protocol: Math.random() < 0.7 ? 'tcp' : 'udp',
        port: Math.random() < 0.6 ? Math.floor(Math.random() * 65535) : null,
        comment: `Rule ${i + 1}`,
        bytes: Math.floor(Math.random() * 1000000),
        packets: Math.floor(Math.random() * 10000),
        disabled: Math.random() < 0.1
      });
    }
    
    return rules;
  }
}