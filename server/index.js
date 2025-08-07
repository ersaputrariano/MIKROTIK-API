import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import cron from 'node-cron';
import { MikroTikAPI } from './mikrotik-api.js';
import { SecurityMonitor } from './security-monitor.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Initialize MikroTik API connections
const mikrotikDevices = new Map();
const securityMonitor = new SecurityMonitor();

// WebSocket server for real-time updates
const wss = new WebSocketServer({ port: 3002 });

// Broadcast to all connected clients
function broadcast(data) {
  wss.clients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(JSON.stringify(data));
    }
  });
}

// Routes
app.get('/api/devices', (req, res) => {
  const devices = Array.from(mikrotikDevices.values()).map(device => ({
    id: device.id,
    name: device.name,
    host: device.host,
    status: device.status,
    lastSeen: device.lastSeen,
    version: device.version,
    uptime: device.uptime
  }));
  res.json(devices);
});

app.post('/api/devices', async (req, res) => {
  const { name, host, username, password } = req.body;
  
  try {
    const device = new MikroTikAPI({
      name,
      host,
      username,
      password
    });
    
    await device.connect();
    mikrotikDevices.set(device.id, device);
    
    res.json({ 
      success: true, 
      message: 'Device added successfully',
      device: {
        id: device.id,
        name: device.name,
        host: device.host,
        status: device.status
      }
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
});

app.get('/api/devices/:id/status', async (req, res) => {
  const device = mikrotikDevices.get(req.params.id);
  if (!device) {
    return res.status(404).json({ message: 'Device not found' });
  }
  
  try {
    const status = await device.getSystemStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/devices/:id/connections', async (req, res) => {
  const device = mikrotikDevices.get(req.params.id);
  if (!device) {
    return res.status(404).json({ message: 'Device not found' });
  }
  
  try {
    const connections = await device.getActiveConnections();
    res.json(connections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/devices/:id/firewall', async (req, res) => {
  const device = mikrotikDevices.get(req.params.id);
  if (!device) {
    return res.status(404).json({ message: 'Device not found' });
  }
  
  try {
    const rules = await device.getFirewallRules();
    res.json(rules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/security/events', (req, res) => {
  const events = securityMonitor.getRecentEvents();
  res.json(events);
});

app.get('/api/security/alerts', (req, res) => {
  const alerts = securityMonitor.getActiveAlerts();
  res.json(alerts);
});

app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const stats = {
      totalDevices: mikrotikDevices.size,
      activeDevices: Array.from(mikrotikDevices.values()).filter(d => d.status === 'connected').length,
      totalAlerts: securityMonitor.getActiveAlerts().length,
      criticalAlerts: securityMonitor.getActiveAlerts().filter(a => a.severity === 'critical').length,
      recentEvents: securityMonitor.getRecentEvents().slice(0, 5),
      networkTraffic: await generateTrafficData()
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate mock traffic data
async function generateTrafficData() {
  const now = new Date();
  const data = [];
  
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    data.push({
      time: time.toISOString(),
      inbound: Math.random() * 100 + 50,
      outbound: Math.random() * 80 + 30
    });
  }
  
  return data;
}

// Periodic monitoring
cron.schedule('*/30 * * * * *', async () => {
  for (const device of mikrotikDevices.values()) {
    try {
      const status = await device.getSystemStatus();
      const connections = await device.getActiveConnections();
      
      // Check for security events
      securityMonitor.analyzeConnections(device.id, connections);
      
      // Broadcast updates
      broadcast({
        type: 'device_update',
        deviceId: device.id,
        status,
        connections: connections.slice(0, 10) // Limit for performance
      });
    } catch (error) {
      console.error(`Error monitoring device ${device.id}:`, error.message);
    }
  }
});

app.listen(PORT, () => {
  console.log(`MikroTik Security Monitor API running on port ${PORT}`);
});