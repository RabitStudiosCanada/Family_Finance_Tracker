# Deployment Guide

This document walks through deploying the Family Finance Tracker on a fresh Ubuntu 22.04 LTS server using the built-in SQLite database. The same steps apply to other Linux distributions with minor adjustments (package manager commands, service units, etc.).

## 1. Prerequisites

- Ubuntu 22.04 LTS server (or equivalent) with sudo access.
- A domain name (optional but recommended for HTTPS).
- Node.js 20.x and npm 10.x.
- Git.
- A reverse proxy/web server (Nginx in the example below).

> ℹ️ PostgreSQL is optional. The application uses SQLite by default. If you prefer PostgreSQL, provision a database and update `DATABASE_CLIENT`/`DATABASE_URL` in `backend/.env` accordingly.

### Install system packages

```bash
sudo apt update
sudo apt install -y curl git nginx
```

### Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version
```

## 2. Clone the repository

Choose an installation directory (e.g. `/opt/family-finance-tracker`).

```bash
sudo mkdir -p /opt/family-finance-tracker
sudo chown $USER:$USER /opt/family-finance-tracker
cd /opt/family-finance-tracker
git clone https://github.com/<your-org>/family_finance_tracker.git .
```

## 3. Install dependencies

```bash
npm install
```

This command installs the root tooling plus workspace dependencies for both `backend` and `frontend`.

## 4. Configure environment variables

Copy the provided template and edit it with production values.

```bash
cp backend/.env.example backend/.env
nano backend/.env
```

At minimum, set:

- `NODE_ENV=production`
- `PORT` (default `4000` is fine if unused)
- `CORS_ORIGIN=https://app.yourdomain.com` (or comma-separated list)
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` to strong random strings

If you run PostgreSQL, also set `DATABASE_CLIENT=pg` and `DATABASE_URL=postgres://user:password@host:5432/familyfinance`.

## 5. Prepare the database

Run database migrations (and optional seed data) from the repository root:

```bash
npm run migrate --workspace backend
# Optional demo data
# npm run seed --workspace backend
```

SQLite database files are stored under `backend/db`. Back up this directory regularly if you rely on SQLite in production.

## 6. Build the frontend

```bash
npm run build --workspace frontend
```

The production-ready assets live in `frontend/dist/`.

## 7. Run the backend API

You can use your preferred process manager. The example below creates a `systemd` service unit.

Create `/etc/systemd/system/family-finance-api.service` with the following contents:

```ini
[Unit]
Description=Family Finance Tracker API
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/family-finance-tracker
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run start --workspace backend
Restart=on-failure
User=www-data
Group=www-data
EnvironmentFile=/opt/family-finance-tracker/backend/.env

[Install]
WantedBy=multi-user.target
```

Adjust the `User`/`Group` if you prefer a dedicated system user. Load and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now family-finance-api.service
sudo systemctl status family-finance-api.service
```

## 8. Serve the frontend

One option is to let Nginx serve the static files and proxy API requests to the backend. Create `/etc/nginx/sites-available/family-finance.conf`:

```nginx
server {
    listen 80;
    server_name app.yourdomain.com;

    root /opt/family-finance-tracker/frontend/dist;
    index index.html;

    access_log /var/log/nginx/family-finance.access.log;
    error_log /var/log/nginx/family-finance.error.log;

    location /api/ {
        proxy_pass http://127.0.0.1:4000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable the site and reload Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/family-finance.conf /etc/nginx/sites-enabled/family-finance.conf
sudo nginx -t
sudo systemctl reload nginx
```

Configure HTTPS using Certbot or another TLS solution once DNS records point to the server.

## 9. Maintenance

- **Updating code:**
  ```bash
  cd /opt/family-finance-tracker
  git pull
  npm install
  npm run build --workspace frontend
  npm run migrate --workspace backend
  sudo systemctl restart family-finance-api.service
  sudo systemctl reload nginx
  ```
- **Backups:** Archive `backend/db` (for SQLite) and `backend/.env` regularly.
- **Logs:** Backend logs appear in `journalctl -u family-finance-api`. Nginx logs are under `/var/log/nginx/`.

---

For custom infrastructure (Docker, Kubernetes, etc.), reuse the same steps inside your orchestrator: install dependencies, supply environment variables, run migrations, build the frontend, and serve it alongside the API.
