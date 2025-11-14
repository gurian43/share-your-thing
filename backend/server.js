import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import MongoStore from 'connect-mongo';
import session from 'express-session';

import connectToDatabase from './config/db.js';
import { createTransporter } from './services/emailService.js';

import userRoutes from './routes/user.route.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors(
    {origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true}
));
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

app.get('/', (req, res) => {
    res.send('Share Your Thing API is running');
});

createTransporter();