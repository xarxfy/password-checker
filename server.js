const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const SALT_ROUNDS = 12;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'michi-tool-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 },
}));

// Auth middleware
function requireAuth(req, res, next) {
  if (req.session.userId) return next();
  if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Nicht eingeloggt.' });
  res.redirect('/login');
}

// ── Auth routes (public) ──────────────────────────────────────────────────────

app.get('/login', (req, res) => {
  if (req.session.userId) return res.redirect('/manage');
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// First-run setup: only accessible when no user exists yet
app.get('/setup', (req, res) => {
  if (db.userCount() > 0) return res.redirect('/login');
  res.sendFile(path.join(__dirname, 'public', 'setup.html'));
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Felder ausfüllen.' });
  const user = db.getUser(username);
  if (!user || !(await bcrypt.compare(password, user.hash))) {
    return res.status(401).json({ error: 'Falscher Benutzername oder Passwort.' });
  }
  req.session.userId = user.id;
  req.session.username = user.username;
  res.json({ ok: true });
});

app.post('/api/auth/setup', async (req, res) => {
  if (db.userCount() > 0) return res.status(403).json({ error: 'Setup bereits abgeschlossen.' });
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Felder ausfüllen.' });
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  db.createUser(username.trim(), hash);
  req.session.userId = db.getUser(username.trim()).id;
  req.session.username = username.trim();
  res.json({ ok: true });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// Redirect root based on state
app.get('/', (req, res) => {
  if (db.userCount() === 0) return res.redirect('/setup');
  if (!req.session.userId) return res.redirect('/login');
  res.redirect('/manage');
});

// ── Protected routes ──────────────────────────────────────────────────────────

app.get('/manage', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'manage.html'));
});
app.get('/practice', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'practice.html'));
});

app.get('/api/passwords', requireAuth, (req, res) => {
  res.json(db.listPasswords());
});

app.post('/api/passwords', requireAuth, async (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) {
    return res.status(400).json({ error: 'Name und Passwort sind erforderlich.' });
  }
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    db.createPassword(name.trim(), hash);
    res.status(201).json({ ok: true });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Dieser Name existiert bereits.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Interner Fehler.' });
  }
});

app.delete('/api/passwords/:id', requireAuth, (req, res) => {
  db.deletePassword(Number(req.params.id));
  res.json({ ok: true });
});

app.post('/api/passwords/:id/check', requireAuth, async (req, res) => {
  const { attempt } = req.body;
  if (attempt === undefined) {
    return res.status(400).json({ error: 'Kein Versuch übermittelt.' });
  }
  const hash = db.getHash(Number(req.params.id));
  if (!hash) {
    return res.status(404).json({ error: 'Passwort nicht gefunden.' });
  }
  const correct = await bcrypt.compare(attempt, hash);
  res.json({ correct });
});

app.listen(PORT, () => {
  const firstRun = db.userCount() === 0;
  console.log(`Server läuft auf http://localhost:${PORT}`);
  if (firstRun) {
    console.log(`  Erster Start → Account anlegen: http://localhost:${PORT}/setup`);
  } else {
    console.log(`  Login:      http://localhost:${PORT}/login`);
    console.log(`  Verwaltung: http://localhost:${PORT}/manage`);
    console.log(`  Üben:       http://localhost:${PORT}/practice`);
  }
});
