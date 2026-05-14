import express from 'express';

import { deleteFileAsAdmin, deleteReport, getReports, updateReport } from '../controllers/admin.controller.js';
import requireAdmin from '../services/adminOnly.js';

const router = express.Router();

router.use(requireAdmin);

router.get('/reports', getReports);
router.patch('/reports/:reportId', updateReport);
router.delete('/reports/:reportId', deleteReport);
router.delete('/files/:fileId', deleteFileAsAdmin);

export default router;