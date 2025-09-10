
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import bcrypt from 'bcrypt';
import gptRouter from './gpt-api.js';
import { createBareServer } from '@tomphttp/bare-server-node';

// Environment variable validation
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Validate port
if (isNaN(PORT) || PORT < 1 || PORT > 65535) {
  console.error('Invalid PORT environment variable');
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// In-memory storage for demo purposes
const sessions = new Map();
const users = new Map();

// API Routes
app.post('/log', (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'];
    const { url } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Valid URL required' });
    }
    
    // Log the visit (in production, save to database)
    console.log(`Session ${sessionId} visited: ${url}`);
    
    res.json({ status: 'logged' });
  } catch (error) {
    console.error('Error logging visit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/heartbeat', (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'];
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }
    
    // Update session timestamp with expiration (24 hours)
    const expiration = Date.now() + (24 * 60 * 60 * 1000);
    sessions.set(sessionId, { 
      lastSeen: Date.now(),
      expires: expiration
    });
    
    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Error processing heartbeat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin credentials - require environment variables for security
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_2FA_SECRET = process.env.ADMIN_2FA_SECRET;

// Check if admin credentials are configured
const adminConfigured = ADMIN_PASSWORD && ADMIN_2FA_SECRET;

// Admin login endpoint
app.post('/login', async (req, res) => {
  try {
    // Check if admin is properly configured
    if (!adminConfigured) {
      return res.status(503).json({ 
        success: false, 
        message: 'Admin access not configured. Please set ADMIN_PASSWORD and ADMIN_2FA_SECRET environment variables.' 
      });
    }

    const { password, token } = req.body;
    
    if (!password || !token) {
      return res.status(400).json({ success: false, message: 'Password and 2FA token are required' });
    }
    
    // Validate admin password with rate limiting protection
    if (password !== ADMIN_PASSWORD) {
      // Add delay to prevent brute force attacks
      await new Promise(resolve => setTimeout(resolve, 2000));
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    // Validate 2FA token (improved validation)
    // In production, implement proper TOTP validation with time-based tokens
    if (token !== ADMIN_2FA_SECRET) {
      // Add a small delay to prevent brute force attacks
      await new Promise(resolve => setTimeout(resolve, 1000));
      return res.status(401).json({ success: false, message: 'Invalid 2FA token' });
    }
    
    res.json({ success: true, message: 'Admin login successful' });
  } catch (error) {
    console.error('Error during admin login:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Account endpoints
app.post('/acc/create-account', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    if (users.has(username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    // Server-side password validation
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }
    
    const numberCount = (password.match(/\d/g) || []).length;
    if (numberCount < 2) {
      return res.status(400).json({ error: 'Password must contain at least 2 numbers' });
    }
    
    // Hash password with bcrypt on server
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log(`Account created for ${username}`);
    
    users.set(username, { 
      password: hashedPassword, 
      referredCount: 0, 
      perkStatus: 0,
      generatedDomains: 0 
    });
    
    res.json({ message: 'Account created successfully' });
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/acc/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const user = users.get(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Compare password with hashed version
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    res.json({ message: 'Login successful' });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/acc/get-referral-stats', (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    const user = users.get(username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      referredCount: user.referredCount || 0,
      perkStatus: user.perkStatus || 0,
      referralLinks: [],
      generatedDomains: user.generatedDomains || 0,
      generatedLinks: []
    });
  } catch (error) {
    console.error('Error fetching referral stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/acc/generate-domain', (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    const user = users.get(username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Generate a new domain/link
    const domains = [
      'https://proxy1.example.com',
      'https://proxy2.example.com', 
      'https://proxy3.example.com',
      'https://secure-proxy.example.com',
      'https://fast-proxy.example.com',
      'https://reliable-proxy.example.com'
    ];
    
    // Increment generated domains count
    user.generatedDomains = (user.generatedDomains || 0) + 1;
    const generatedCount = user.generatedDomains;
    
    // Select a domain (round-robin style)
    const selectedDomain = domains[(generatedCount - 1) % domains.length];
    
    console.log(`Generated domain for ${username}: ${selectedDomain} (count: ${generatedCount})`);
    
    res.json({
      domain: selectedDomain,
      generatedCount: generatedCount
    });
  } catch (error) {
    console.error('Error generating domain:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/get-links', (req, res) => {
  try {
    // Return the same domains available for generation
    const links = [
      'https://proxy1.example.com',
      'https://proxy2.example.com', 
      'https://proxy3.example.com',
      'https://secure-proxy.example.com',
      'https://fast-proxy.example.com',
      'https://reliable-proxy.example.com'
    ];
    res.json(links);
  } catch (error) {
    console.error('Error fetching links:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mount GPT router
app.use('/gpt', gptRouter);

// Admin dashboard route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Catch-all for serving index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const port = PORT;

// Create and configure bare server for proxy functionality
const bareServer = createBareServer('/bare/');

// Create server with proper request handling
const server = createServer((req, res) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeRequest(req, res);
  } else {
    app(req, res);
  }
});

// WebSocket server
const wss = new WebSocketServer({ 
  noServer: true
});

// Handle bare server WebSocket upgrade
server.on('upgrade', (req, socket, head) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeRequest(req, socket, head);
  } else {
    // Handle our WebSocket upgrades
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  }
});

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  // Handle connection errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
  
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      
      if (msg.type === 'heartbeat') {
        // Handle heartbeat with validation
        if (msg.sessionId && typeof msg.sessionId === 'string') {
          const expiration = Date.now() + (24 * 60 * 60 * 1000);
          sessions.set(msg.sessionId, { 
            lastSeen: Date.now(),
            expires: expiration
          });
          ws.send(JSON.stringify({ type: 'heartbeat_ack', status: 'ok' }));
        } else {
          ws.send(JSON.stringify({ error: 'Invalid session ID' }));
        }
      } else {
        ws.send(JSON.stringify({ error: 'Unknown message type' }));
      }
    } catch (err) {
      console.error('Invalid WebSocket message:', err);
      try {
        ws.send(JSON.stringify({ error: 'Invalid message format' }));
      } catch (sendErr) {
        console.error('Error sending WebSocket error response:', sendErr);
      }
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// Clean up expired sessions every 30 minutes (more frequent cleanup)
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;
  for (const [sessionId, session] of sessions.entries()) {
    if (session.expires && session.expires < now) {
      sessions.delete(sessionId);
      cleanedCount++;
    }
  }
  if (cleanedCount > 0) {
    console.log(`Cleaned up ${cleanedCount} expired sessions`);
  }
}, 30 * 60 * 1000); // 30 minutes

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  if (NODE_ENV === 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  if (NODE_ENV === 'production') {
    process.exit(1);
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Total user accounts: ${users.size}`);
  console.log(`Active sessions: ${sessions.size}`);
});
