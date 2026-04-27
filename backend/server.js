import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import MongoStore from 'connect-mongo';
import session from 'express-session';
import helmet from 'helmet';
import path from 'path';

import connectToDatabase from './config/db.js';
import { createTransporter } from './services/emailService.js';
import { startCleanupService } from './services/cleanupService.js';
import { limiter } from './services/rateLimiter.js';

import userRoutes from './routes/user.route.js';
import fileRoutes from './routes/file.route.js';

dotenv.config();

const APP_ENV = process.env.NODE_ENV || process.env.MODE || 'development';

const IS_PRODUCTION = APP_ENV === 'production';

const __dirname = path.resolve();

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);

app.use(cors(
    {origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true}
));

// CSP for Cloudflare Turnstile
app.use(helmet({
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            "default-src": ["'self'"],
            "script-src": [
                "'self'", 
                "https://challenges.cloudflare.com", 
                "'wasm-unsafe-eval'"
            ],
            "frame-src": ["'self'", "https://challenges.cloudflare.com"],
            "style-src": ["'self'", "'unsafe-inline'"],
            "font-src": ["'self'", "data:", "https://challenges.cloudflare.com"],
            "img-src": ["'self'", "data:", "https://challenges.cloudflare.com"],
            "connect-src": ["'self'", "https://challenges.cloudflare.com"]
        }
    }
}));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(express.json({ limit: '2mb' }));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        databaseName: "share-your-thing",
        collectionName: "sessions",
        touchAfter: 24 * 3600,
        stringify: false
    }),
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24, // 1 day
        path: '/'
    }
}));

app.use(limiter);

app.use('/api/user', userRoutes);
app.use('/api/file', fileRoutes);

app.listen(PORT, () => {
    connectToDatabase();
    startCleanupService();
    console.log(`Server is running on port ${PORT}`);
});

if (IS_PRODUCTION) {
    app.use(express.static(path.resolve(__dirname, 'frontend', 'dist')));

    app.get(/^(?!\/api\/)..*/, (req, res) => {
        res.sendFile(path.resolve(__dirname, 'frontend', 'dist', 'index.html'));
    });
} else {
    app.get("/", (req, res) => {
        res.send(`API is running... in ${APP_ENV} mode PORT ${PORT} | <a href="http://localhost:5173">http://localhost:5173</a>`);
    });
}

createTransporter();