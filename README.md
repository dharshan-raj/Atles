# Atlas Travel Website + Backend API

This project implements all required database rubric items shown in your table:

1. Database Creation
2. Insert/Delete Operation
3. Update/Retrieve Operation
4. Execution

## Rubric Mapping (Implemented)

### 1) Database Creation
Implemented in [backend/db/database.js](backend/db/database.js):
- Creates SQLite database file: `backend/db/atlas.db`
- Creates tables with `CREATE TABLE IF NOT EXISTS`:
  - `users`
  - `destinations`
  - `subscribers`
  - `contacts`
  - `bookings`
- Enables DB pragmas:
  - `journal_mode = WAL`
  - `foreign_keys = ON`
- Seeds initial destinations and admin user

Code snippet:
```js
const DB_PATH = path.join(__dirname, 'atlas.db');

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS destinations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL
  );
`);
```

### 2) Insert/Delete Operation
Implemented via API routes:
- Insert (examples):
  - `POST /api/auth/register` (create user)
  - `POST /api/destinations` (create destination, admin)
  - `POST /api/subscribers` (create subscriber)
  - `POST /api/contacts` (create contact)
  - `POST /api/bookings` (create booking)
- Delete (examples):
  - `DELETE /api/destinations/:id` (admin)
  - `DELETE /api/subscribers/:id` (admin)
  - `DELETE /api/contacts/:id` (admin)
  - `DELETE /api/bookings/:id` (owner/admin)

Code snippets:
```js
// INSERT example: create destination
getDb().prepare(`
  INSERT INTO destinations (id, name, location, description, image, tag, tag_emoji, rating)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`).run(id, name, location, description, image, tag, tag_emoji, rating || 0);
```

```js
// DELETE example: delete destination
getDb().prepare('DELETE FROM destinations WHERE id = ?').run(req.params.id);
```

### 3) Update/Retrieve Operation
Implemented via API routes:
- Update (examples):
  - `PUT /api/destinations/:id` (admin)
  - `PUT /api/subscribers/:id` (admin)
  - `PUT /api/contacts/:id` (admin)
  - `PUT /api/bookings/:id/status` (admin)
- Retrieve (examples):
  - `GET /api/destinations` and `GET /api/destinations/:id`
  - `GET /api/subscribers` (admin)
  - `GET /api/contacts` and `GET /api/contacts/:id` (admin)
  - `GET /api/bookings`, `GET /api/bookings/:id`, `GET /api/bookings/all`
  - `GET /api/auth/profile`

Code snippets:
```js
// UPDATE example: destination update
getDb().prepare(`
  UPDATE destinations
  SET name = ?, location = ?, description = ?, image = ?, tag = ?, tag_emoji = ?, rating = ?
  WHERE id = ?
`).run(name, location, description, image, tag, tag_emoji, rating, req.params.id);
```

```js
// RETRIEVE example: get all destinations
const destinations = getDb()
  .prepare('SELECT * FROM destinations ORDER BY created_at DESC')
  .all();
res.json({ destinations });
```

### 4) Execution
Implemented and runnable from [backend/package.json](backend/package.json):
- `npm start` -> runs `node server.js`
- `npm run dev` -> runs `node --watch server.js`

Health endpoint:
- `GET /api/health`

Code snippet:
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  }
}
```

## How To Run

1. Open terminal in the `backend` folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create environment file:
   ```bash
   cp .env.example .env
   ```
4. Set `JWT_SECRET` in `.env`.
5. Start server:
   ```bash
   npm start
   ```
6. Open:
   - Frontend: `http://localhost:3000`
   - API health: `http://localhost:3000/api/health`

### Example .env

```env
JWT_SECRET=9f7c2a0d5b8e4f1c3a6d9e2b7c1f4a8d0e5f9b2c7a1d4e8f
PORT=3000
```

Use any strong random JWT secret. You can generate one with:

```bash
openssl rand -hex 32
```

## Where To See Operations Happening

### 1) Browser Network Tab (live API activity)

1. Open the site at `http://localhost:3000`.
2. Open DevTools -> Network.
3. Filter with `/api`.
4. Trigger actions from UI:
   - Newsletter submit -> `POST /api/subscribers`
   - Contact form submit -> `POST /api/contacts`
   - Booking submit -> `POST /api/bookings`

You will see method, payload, status code, and response JSON for each request.

### 2) Backend Route Files (operation code)

- Destinations CRUD: `backend/routes/destinations.js`
- Contacts CRUD: `backend/routes/contacts.js`
- Subscribers CRUD: `backend/routes/subscribers.js`
- Bookings CRUD: `backend/routes/bookings.js`
- Auth register/login/profile: `backend/routes/auth.js`

### 3) SQLite Database File (saved data)

- Database file: `backend/db/atlas.db`
- Schema creation code: `backend/db/database.js`

If sqlite3 is installed, inspect data with:

```bash
sqlite3 backend/db/atlas.db
.tables
SELECT * FROM contacts;
SELECT * FROM subscribers;
SELECT * FROM bookings;
```

## Quick API Verification (Optional)

Run these while server is running:

```bash
curl http://localhost:3000/api/health
```

```bash
curl -X POST http://localhost:3000/api/contacts \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","message":"hello"}'
```

```bash
curl -X POST http://localhost:3000/api/subscribers \
  -H "Content-Type: application/json" \
  -d '{"email":"sub@example.com"}'
```

## Troubleshooting

- Cannot see `.env` in Finder:
  - Dotfiles are hidden by default.
  - In Finder, press `Cmd + Shift + .` to toggle hidden files.
  - Or run `ls -la backend` in terminal.
- Server exits with JWT error:
  - Ensure `.env` exists in `backend` and contains `JWT_SECRET=...`
- Port already in use:
  - Change `PORT` in `.env` to another free port.

## Default Seeded Admin

Created automatically on first run:
- Email: `admin@atlas.com`
- Password: `admin123`

Change this in production.

## Notes

- Backend uses `better-sqlite3` with a local SQLite database.
- Frontend is served statically by Express from the project root.
- Authentication uses JWT bearer tokens for protected routes.
