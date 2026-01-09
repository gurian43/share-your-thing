import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getFileById, getUserFiles, deleteFile, uploadFile } from '../controllers/file.controller.js';
import requireAuth from '../services/protectedRoute.js';

const router = express.Router();

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		const userId = req.session?.userId;
			if (!userId) return cb(new Error('User session missing for upload'));
			const userKey = String(userId);
		const uploadsRoot = path.resolve(process.cwd(), 'uploads');
		const userDir = path.join(uploadsRoot, userKey);
		try {
			if (!fs.existsSync(userDir)) {
				fs.mkdirSync(userDir, { recursive: true });
			}
		} catch (e) {
			return cb(e);
		}
		cb(null, userDir);
	},
	filename: (req, file, cb) => {
		const timestamp = Date.now();
		const sanitizedOriginal = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
		cb(null, `${timestamp}-${sanitizedOriginal}`);
	}
});

const upload = multer({ storage });

router.get('/:fileId', getFileById);
router.get('/', requireAuth, getUserFiles);
router.post('/upload', requireAuth, upload.single('file'), uploadFile);
router.delete('/:fileId', requireAuth, deleteFile);

export default router;
