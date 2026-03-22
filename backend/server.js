require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initialize } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.JWT_SECRET) {
  console.error('Missing required environment variable: JWT_SECRET');
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files from parent directory
app.use(express.static(path.join(__dirname, '..')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/destinations', require('./routes/destinations'));
app.use('/api/subscribers', require('./routes/subscribers'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/bookings', require('./routes/bookings'));

app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Atlas API is running' });
});

// Fallback: serve index.html for non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize database and start server
initialize();

app.listen(PORT, () => {
  console.log(`Atlas server running on http://localhost:${PORT}`);
});
