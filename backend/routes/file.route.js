import express from 'express';
import { getFileById, getUserFiles, deleteFile, createDevFile } from '../controllers/file.controller.js';
import requireAuth from '../services/protectedRoute.js';

const router = express.Router();

router.get('/:fileId', getFileById);
router.get('/', requireAuth, getUserFiles);
router.post('/', requireAuth, createDevFile); // temporary for dev
router.delete('/:fileId', requireAuth, deleteFile);

export default router;
