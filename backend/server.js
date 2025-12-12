import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import MongoStore from 'connect-mongo';
import session from 'express-session';
import helmet from 'helmet';
import path from 'path';

import connectToDatabase from './config/db.js';
import { createTransporter } from './services/emailService.js';

import userRoutes from './routes/user.route.js';

dotenv.config();

const __dirname = path.resolve();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors(
    {origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true}
));

// CSP for Cloudflare Turnstile
app.use(helmet({
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            "default-src": ["'self'"],
            "script-src": ["'self'", "https://challenges.cloudflare.com"],
            "frame-src": ["'self'", "https://challenges.cloudflare.com"],
            "style-src": ["'self'", "'unsafe-inline'"],
            "font-src": ["'self'", "data:", "https://challenges.cloudflare.com"],
            "img-src": ["'self'", "data:", "https://challenges.cloudflare.com"],
            "connect-src": ["'self'", "https://challenges.cloudflare.com"]
        }
    }
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        databaseName: "share-your-thing",
        collectionName: "sessions"
        
    }),
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));

app.use('/api/user', userRoutes);

app.listen(PORT, () => {
    connectToDatabase();
    console.log(`Server is running on port ${PORT}`);
});

if (process.env.MODE === 'production') {
    app.use((req, res, next) => {
        express.static(path.resolve(__dirname, 'frontend', 'dist'))(req, res, next);
    });

    app.get(/.*/, (req, res) => {
        res.sendFile(path.resolve(__dirname, 'frontend', 'dist', 'index.html'));
    });
} else {
    app.get("/", (req, res) => {
        res.send(`API is running... in development mode PORT ${PORT} | <a href="http://localhost:5173">http://localhost:5173</a>`);
    });
}

createTransporter();