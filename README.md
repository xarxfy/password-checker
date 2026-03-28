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

## Deployment auf Proxmox LXC

### 1. LXC Container erstellen

Ubuntu 22.04/24.04 Template, mindestens 512 MB RAM.

### 2. Node.js installieren

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs git
```

### 3. App clonen & installieren

```bash
git clone https://github.com/xarxfy/password-checker.git /opt/password-checker
cd /opt/password-checker
npm install
```

### 4. Systemuser anlegen & Rechte setzen

```bash
useradd -r -s /bin/false admin
chown -R admin:admin /opt/password-checker
```

### 5. Systemdienst einrichten

```bash
nano /etc/systemd/system/password-checker.service
```

```ini
[Unit]
Description=password-checker
After=network.target

[Service]
WorkingDirectory=/opt/password-checker
ExecStart=/usr/bin/node --experimental-sqlite server.js
Restart=always
User=admin
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=SESSION_SECRET=dein-geheimer-zufallsstring

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl enable --now password-checker
```

`SESSION_SECRET` durch einen zufälligen String ersetzen:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 6. Status prüfen

```bash
systemctl status password-checker
journalctl -u password-checker -f
```

Beim ersten Aufruf von `http://<LXC-IP>:3000` wird automatisch auf `/setup` weitergeleitet.

## Technik

- **Express 5** – Webserver
- **node:sqlite** – Eingebautes SQLite (kein nativer Build nötig)
- **bcrypt** – Passwort-Hashing
- **express-session** – Session-Management
