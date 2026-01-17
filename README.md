# Share Your Thing

A full-stack file sharing web application built with Express.js and React.

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

## Building for Production*
**This will later be replaced with docker*

Build both frontend and backend:
```bash
npm run build
```

This will:
1. Install all dependencies
2. Install frontend dependencies
3. Build the frontend for production

## Production Deployment

Run the production server:
```bash
npm start
```

The server will serve the built frontend files and run the API on the configured PORT.