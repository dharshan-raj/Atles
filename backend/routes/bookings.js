const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Create booking (authenticated)
router.post('/', authenticate, (req, res) => {
  const { destination_id, travel_date, guests, notes } = req.body;
  const parsedGuests = Number.isInteger(guests) ? guests : parseInt(guests, 10);

  if (!destination_id || !travel_date) {
    return res.status(400).json({ error: 'Destination and travel date are required' });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(travel_date)) {
    return res.status(400).json({ error: 'Travel date must be in YYYY-MM-DD format' });
  }

  if (!Number.isInteger(parsedGuests) || parsedGuests < 1 || parsedGuests > 20) {
    return res.status(400).json({ error: 'Guests must be an integer between 1 and 20' });
  }

  const destination = getDb().prepare('SELECT id FROM destinations WHERE id = ?').get(destination_id);
  if (!destination) {
    return res.status(404).json({ error: 'Destination not found' });
  }

  const id = uuidv4();
  getDb().prepare(`
    INSERT INTO bookings (id, user_id, destination_id, travel_date, guests, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, req.user.id, destination_id, travel_date, parsedGuests, notes || null);

  const booking = getDb().prepare(`
    SELECT b.*, d.name as destination_name
    FROM bookings b JOIN destinations d ON b.destination_id = d.id
    WHERE b.id = ?
  `).get(id);

  res.status(201).json({ message: 'Booking created', booking });
});

// Get user's bookings (authenticated)
router.get('/', authenticate, (req, res) => {
  const bookings = getDb().prepare(`
    SELECT b.*, d.name as destination_name, d.image as destination_image
    FROM bookings b JOIN destinations d ON b.destination_id = d.id
    WHERE b.user_id = ?
    ORDER BY b.created_at DESC
  `).all(req.user.id);

  res.json({ bookings });
});

// Get single booking (authenticated)
router.get('/:id', authenticate, (req, res) => {
  const booking = getDb().prepare(`
    SELECT b.*, d.name as destination_name, d.image as destination_image
    FROM bookings b
    JOIN destinations d ON b.destination_id = d.id
    WHERE b.id = ?
  `).get(req.params.id);

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  if (req.user.role !== 'admin' && booking.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json({ booking });
});

// Get all bookings (admin)
router.get('/all', authenticate, requireAdmin, (req, res) => {
  const bookings = getDb().prepare(`
    SELECT b.*, d.name as destination_name, u.name as user_name, u.email as user_email
    FROM bookings b
    JOIN destinations d ON b.destination_id = d.id
    JOIN users u ON b.user_id = u.id
    ORDER BY b.created_at DESC
  `).all();

  res.json({ bookings });
});

// Update booking status (admin)
router.put('/:id/status', authenticate, requireAdmin, (req, res) => {
  const { status } = req.body;

  if (!status || !['pending', 'confirmed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Valid status is required (pending, confirmed, cancelled)' });
  }

  const existing = getDb().prepare('SELECT id FROM bookings WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  getDb().prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, req.params.id);

  res.json({ message: `Booking ${status}` });
});

// Delete booking (authenticated owner or admin)
router.delete('/:id', authenticate, (req, res) => {
  const booking = getDb().prepare('SELECT id, user_id FROM bookings WHERE id = ?').get(req.params.id);

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  if (req.user.role !== 'admin' && booking.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  getDb().prepare('DELETE FROM bookings WHERE id = ?').run(req.params.id);
  res.json({ message: 'Booking deleted' });
});

module.exports = router;
