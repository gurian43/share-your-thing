import express from 'express';
import { registerUser, loginUser, logoutUser, activateUser, getUser, deleteUser } from '../controllers/user.controller.js';

import requireAuth from '../services/protectedRoute.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/activate/:token', activateUser);
router.get('/me', requireAuth, getUser);
router.delete('/delete', requireAuth, deleteUser);

export default router;