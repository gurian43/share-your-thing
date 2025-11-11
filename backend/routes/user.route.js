import express from 'express';
import { registerUser, loginUser, logoutUser, activateUser, getUserProfile } from '../controllers/user.controller.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/activate', activateUser);
router.get('/profile', getUserProfile);

export default router;