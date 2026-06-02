# Share Your Thing

A full-stack file sharing web application built with Express.js and React.
This is a school project.

## Prerequisites

- Node.js (v16 or higher)
- MongoDB database
- SMTP email account (for email notifications)
- Cloudflare Turnstile account (for bot protection)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/gurian43/share-your-thing.git
cd share-your-thing
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=your_mongodb_connection_string

# Session
SESSION_SECRET=your_secure_session_secret

# Email Configuration
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password

# Cloudflare Turnstile
TURNSTILE_SECRET_KEY=your_turnstile_secret_key
TURNSTILE_SECRET_KEY_DEV=your_turnstile_dev_key

# CORS
CORS_ORIGIN=http://localhost:3000
```

4. Create a `.env` file in the `frontend` directory:
```env
VITE_TURNSTILE_SITE_KEY=your_turnstile_site_key
```

Alternatively, copy `frontend/.env.example` into `frontend/.env`.

## Development

Run the backend development server:
```bash
npm run dev
```

In a separate terminal, run the frontend development server:
```bash
cd frontend
npm run dev
```

The backend will run on `http://localhost:3000` and the frontend on `http://localhost:5173`.

## Docker (production) — quick guide

This repo includes a multi-stage `backend/Dockerfile` that builds the frontend and packages it into the backend image, and a `docker-compose.yml` to run MongoDB + backend.

1) Prepare host folders and env files

```bash
mkdir -p uploads data/db
```

Create a root `.env` file with the same structure shown above in this README. For production, set at least:

```env
NODE_ENV=production
PORT=3003
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_secure_session_secret
ENCRYPTION_KEY=your_32_byte_secret
CORS_ORIGIN=http://localhost:3000
TURNSTILE_SECRET_KEY=your_turnstile_secret_key
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
```

Create `frontend/.env` with your Vite Turnstile site key:

```env
VITE_TURNSTILE_SITE_KEY=your_turnstile_site_key
```

2) Build and start with docker-compose

```bash
docker compose build
docker compose up -d
```

By default the compose file maps `127.0.0.1:3003` on the host to the backend container port `3003`. Keep your nginx/cloudflared ingress proxying to `http://127.0.0.1:3003` (your existing setup uses that).

3) Nginx recommendations for chunked uploads

In your nginx site config, ensure these settings to support streaming uploads and larger files:

```
client_max_body_size 200M;
proxy_request_buffering off;
proxy_read_timeout 300s;
proxy_send_timeout 300s;
```

4) Notes

- The Docker build copies `frontend/dist` into `backend/frontend/dist` so Express will serve static files when `NODE_ENV=production`.
- Store secrets (`ENCRYPTION_KEY`, `SESSION_SECRET`) securely — prefer Docker secrets or a secret manager.
- `uploads/` and `data/db/` are mounted host volumes for persistence. `.gitignore` already ignores `uploads/` and `data/db/`.
