const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Session data (in-memory storage)
const sessions = new Map();

// Helper function to generate session token
function generateToken() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Login endpoint
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  const correctPassword = process.env.MANUS_PASSWORD;

  if (!correctPassword) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if (password === correctPassword) {
    const token = generateToken();
    sessions.set(token, { authenticated: true, createdAt: Date.now() });
    return res.json({ success: true, token });
  } else {
    return res.status(401).json({ success: false, error: 'Invalid password' });
  }
});

// Middleware to check authentication
function checkAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
}

// API endpoints
app.get('/api/chat-history', checkAuth, (req, res) => {
  res.json({
    conversations: [
      { id: 1, title: 'First Conversation', date: '2024-03-07' },
      { id: 2, title: 'Second Conversation', date: '2024-03-06' }
    ]
  });
});

app.post('/api/execute', checkAuth, (req, res) => {
  const { command } = req.body;
  
  // Simulate command execution
  res.json({
    success: true,
    output: `Executing: ${command}`,
    logs: [
      'Step 1: Analyzing command...',
      'Step 2: Processing request...',
      'Step 3: Generating response...'
    ]
  });
});

app.get('/api/status', checkAuth, (req, res) => {
  res.json({ status: 'online', version: '1.0.0' });
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Manus Web Interface running on http://localhost:${PORT}`);
});
