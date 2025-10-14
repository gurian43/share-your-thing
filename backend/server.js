import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

import connectToDatabase from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.listen(PORT, () => {
    connectToDatabase();
    console.log(`Server is running on port ${PORT}`);
});