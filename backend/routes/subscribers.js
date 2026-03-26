const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Subscribe (public)
router.post('/', (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM subscribers WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Email already subscribed' });
  }

  const id = uuidv4();
  db.prepare('INSERT INTO subscribers (id, email) VALUES (?, ?)').run(id, email);

  res.status(201).json({ message: 'Subscribed successfully' });
});

// List subscribers (admin)
router.get('/', authenticate, requireAdmin, (req, res) => {
  const subscribers = getDb().prepare('SELECT * FROM subscribers ORDER BY subscribed_at DESC').all();
  res.json({ subscribers });
});

// Update subscriber email (admin)
router.put('/:id', authenticate, requireAdmin, (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM subscribers WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Subscriber not found' });
  }

  const duplicate = db.prepare('SELECT id FROM subscribers WHERE email = ? AND id != ?').get(email, req.params.id);
  if (duplicate) {
    return res.status(409).json({ error: 'Email already subscribed' });
  }

  db.prepare('UPDATE subscribers SET email = ? WHERE id = ?').run(email, req.params.id);
  const subscriber = db.prepare('SELECT * FROM subscribers WHERE id = ?').get(req.params.id);

  res.json({ message: 'Subscriber updated', subscriber });
});

// Unsubscribe (admin)
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  const existing = getDb().prepare('SELECT id FROM subscribers WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Subscriber not found' });
  }

  getDb().prepare('DELETE FROM subscribers WHERE id = ?').run(req.params.id);
  res.json({ message: 'Unsubscribed successfully' });
});

module.exports = router;
