const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all destinations (public)
router.get('/', (req, res) => {
  const destinations = getDb().prepare('SELECT * FROM destinations ORDER BY created_at DESC').all();
  res.json({ destinations });
});

// Get single destination (public)
router.get('/:id', (req, res) => {
  const destination = getDb().prepare('SELECT * FROM destinations WHERE id = ?').get(req.params.id);
  if (!destination) {
    return res.status(404).json({ error: 'Destination not found' });
  }
  res.json({ destination });
});

// Create destination (admin)
router.post('/', authenticate, requireAdmin, (req, res) => {
  const { name, location, description, image, tag, tag_emoji, rating } = req.body;

  if (!name || !location || !description || !image || !tag || !tag_emoji) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const id = uuidv4();
  getDb().prepare(`
    INSERT INTO destinations (id, name, location, description, image, tag, tag_emoji, rating)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, location, description, image, tag, tag_emoji, rating || 0);

  const destination = getDb().prepare('SELECT * FROM destinations WHERE id = ?').get(id);
  res.status(201).json({ message: 'Destination created', destination });
});

// Update destination (admin)
router.put('/:id', authenticate, requireAdmin, (req, res) => {
  const { name, location, description, image, tag, tag_emoji, rating } = req.body;
  const existing = getDb().prepare('SELECT * FROM destinations WHERE id = ?').get(req.params.id);

  if (!existing) {
    return res.status(404).json({ error: 'Destination not found' });
  }

  getDb().prepare(`
    UPDATE destinations SET name = ?, location = ?, description = ?, image = ?, tag = ?, tag_emoji = ?, rating = ?
    WHERE id = ?
  `).run(
    name || existing.name,
    location || existing.location,
    description || existing.description,
    image || existing.image,
    tag || existing.tag,
    tag_emoji || existing.tag_emoji,
    rating ?? existing.rating,
    req.params.id
  );

  const destination = getDb().prepare('SELECT * FROM destinations WHERE id = ?').get(req.params.id);
  res.json({ message: 'Destination updated', destination });
});

// Delete destination (admin)
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  const existing = getDb().prepare('SELECT * FROM destinations WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Destination not found' });
  }

  getDb().prepare('DELETE FROM destinations WHERE id = ?').run(req.params.id);
  res.json({ message: 'Destination deleted' });
});

module.exports = router;
