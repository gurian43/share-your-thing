import express from 'express';
import { registerUser, loginUser, logoutUser, activateUser, resendActivation, getUser, deleteUser, getPublicProfile, recalculateStorageUsage, sendResetEmail, resetPassword, validateResetToken, changePassword, updateProfile } from '../controllers/user.controller.js';
import { getUserFiles } from '../controllers/file.controller.js';

import requireAuth from '../services/protectedRoute.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/activate/resend', resendActivation);
router.get('/activate/:token', activateUser);
router.post('/password/reset/email', sendResetEmail);
router.get('/password/reset/validate/:token', validateResetToken);
router.post('/password/reset/:token', resetPassword);
router.post('/password/change', requireAuth, changePassword);
router.get('/me', requireAuth, getUser);
router.get('/profile/:userId', getPublicProfile);
router.put('/profile', requireAuth, updateProfile);
router.get('/files', requireAuth, getUserFiles);
router.delete('/delete', requireAuth, deleteUser);
router.post('/recalculate-storage', requireAuth, recalculateStorageUsage);

export default router;