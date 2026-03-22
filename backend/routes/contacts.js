const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Submit contact message (public)
router.post('/', (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }

  const id = uuidv4();
  getDb().prepare('INSERT INTO contacts (id, name, email, message) VALUES (?, ?, ?, ?)').run(id, name, email, message);

  res.status(201).json({ message: 'Message sent successfully' });
});

// List contacts (admin)
router.get('/', authenticate, requireAdmin, (req, res) => {
  const contacts = getDb().prepare('SELECT * FROM contacts ORDER BY created_at DESC').all();
  res.json({ contacts });
});

module.exports = router;
