const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, 'passwords.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS passwords (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT    NOT NULL UNIQUE,
    hash TEXT    NOT NULL
  );
  CREATE TABLE IF NOT EXISTS users (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    hash TEXT    NOT NULL
  )
`);

function createPassword(name, hash) {
  const stmt = db.prepare('INSERT INTO passwords (name, hash) VALUES (?, ?)');
  stmt.run(name, hash);
}

function listPasswords() {
  return db.prepare('SELECT id, name FROM passwords ORDER BY name').all();
}

function getHash(id) {
  const row = db.prepare('SELECT hash FROM passwords WHERE id = ?').get(id);
  return row ? row.hash : null;
}

function deletePassword(id) {
  db.prepare('DELETE FROM passwords WHERE id = ?').run(id);
}

function createUser(username, hash) {
  db.prepare('INSERT INTO users (username, hash) VALUES (?, ?)').run(username, hash);
}

function getUser(username) {
  return db.prepare('SELECT id, username, hash FROM users WHERE username = ?').get(username);
}

function userCount() {
  return db.prepare('SELECT COUNT(*) as n FROM users').get().n;
}

module.exports = { createPassword, listPasswords, getHash, deletePassword, createUser, getUser, userCount };
