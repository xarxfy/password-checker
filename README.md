# michi-tool

Eine Node.js-App zum Üben von Passwörtern. Passwörter werden gehasht (bcrypt) in einer lokalen SQLite-Datenbank gespeichert.

## Features

- **Login** – Zugriff nur nach Authentifizierung
- **Verwalten** – Passwörter benennen, speichern und löschen
- **Üben** – Passwörter tippen und sofortiges Feedback erhalten

## Voraussetzungen

- Node.js v22 oder höher (v24 empfohlen)

## Installation

```bash
npm install
```

## Starten

```bash
npm start
```

Beim ersten Start unter `http://localhost:3000/setup` einen Account anlegen.

## Seiten

| URL | Beschreibung |
|---|---|
| `/setup` | Account anlegen (nur beim ersten Start) |
| `/login` | Einloggen |
| `/manage` | Passwörter verwalten |
| `/practice` | Passwörter üben |

## Technik

- **Express 5** – Webserver
- **node:sqlite** – Eingebautes SQLite (kein nativer Build nötig)
- **bcrypt** – Passwort-Hashing
- **express-session** – Session-Management
