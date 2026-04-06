import express from 'express';
import multer from 'multer';
import { getFileById, getUserFiles, deleteFile, uploadChunk, finalizeUpload, getUploadStatus, downloadFile } from '../controllers/file.controller.js';
import { reportFile } from '../controllers/report.controller.js';
import requireAuth from '../services/protectedRoute.js';
import os from 'os';

const router = express.Router();

const chunkStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		const userId = req.session?.userId;
        if (!userId) return cb(new Error('User session missing for upload'));
        cb(null, os.tmpdir());
	},
	filename: (req, file, cb) => {
		const uniqueId = Math.random().toString(36).substring(2, 15);
		cb(null, `chunk-${uniqueId}`);
	}
});

const chunkUpload = multer({ storage: chunkStorage, limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/upload/status', requireAuth, getUploadStatus);
router.post('/upload/chunk', requireAuth, chunkUpload.single('chunk'), uploadChunk);
router.post('/upload/finalize', requireAuth, finalizeUpload);
router.get('/', requireAuth, getUserFiles);
router.post('/:fileId/report', requireAuth, reportFile);
router.post('/:fileId/download', downloadFile);
router.get('/:fileId', getFileById);
router.delete('/:fileId', requireAuth, deleteFile);

export default router;