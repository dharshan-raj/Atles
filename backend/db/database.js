const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'atlas.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initialize() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS destinations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      description TEXT NOT NULL,
      image TEXT NOT NULL,
      tag TEXT NOT NULL,
      tag_emoji TEXT NOT NULL,
      rating REAL NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subscribers (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      subscribed_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      destination_id TEXT NOT NULL,
      travel_date TEXT NOT NULL,
      guests INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'cancelled')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (destination_id) REFERENCES destinations(id)
    );
  `);

  // Seed destinations if table is empty
  const count = db.prepare('SELECT COUNT(*) as count FROM destinations').get();
  if (count.count === 0) {
    const insert = db.prepare(`
      INSERT INTO destinations (id, name, location, description, image, tag, tag_emoji, rating)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(uuidv4(), 'Santorini, Greece', 'Greece', 'Experience the iconic white-washed buildings and stunning sunsets', 'assets/dest-1.jpg', 'Romantic', '🌅', 4.9);
    insert.run(uuidv4(), 'Kyoto, Japan', 'Japan', 'Immerse yourself in ancient temples and cherry blossom beauty', 'assets/dest-2.jpg', 'Cultural', '🏯', 4.8);
    insert.run(uuidv4(), 'African Safari', 'Africa', 'Witness majestic wildlife in their natural habitat', 'assets/dest-3.jpg', 'Adventure', '🦁', 5.0);
  }

  // Seed admin user if no users exist
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users (id, name, email, password, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(uuidv4(), 'Admin', 'admin@atlas.com', hashedPassword, 'admin');
  }

  console.log('Database initialized successfully');
}

module.exports = { getDb, initialize };
