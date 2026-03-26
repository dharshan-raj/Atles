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

// Get single contact (admin)
router.get('/:id', authenticate, requireAdmin, (req, res) => {
  const contact = getDb().prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
  if (!contact) {
    return res.status(404).json({ error: 'Contact not found' });
  }
  res.json({ contact });
});

// Update contact (admin)
router.put('/:id', authenticate, requireAdmin, (req, res) => {
  const existing = getDb().prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Contact not found' });
  }

  const name = typeof req.body.name === 'string' ? req.body.name.trim() : existing.name;
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : existing.email;
  const message = typeof req.body.message === 'string' ? req.body.message.trim() : existing.message;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }

  getDb().prepare('UPDATE contacts SET name = ?, email = ?, message = ? WHERE id = ?').run(name, email, message, req.params.id);

  const contact = getDb().prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
  res.json({ message: 'Contact updated', contact });
});

// Delete contact (admin)
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  const existing = getDb().prepare('SELECT id FROM contacts WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Contact not found' });
  }

  getDb().prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);
  res.json({ message: 'Contact deleted' });
});

module.exports = router;
