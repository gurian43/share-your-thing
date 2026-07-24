import express from 'express';

import { deleteFileAsAdmin, deleteReport, getSiteSettings, getReports, updateSiteSettings, updateReport } from '../controllers/admin.controller.js';
import requireAdmin from '../services/adminOnly.js';

const router = express.Router();

router.use(requireAdmin);

router.get('/site-settings', getSiteSettings);
router.patch('/site-settings', updateSiteSettings);
router.get('/reports', getReports);
router.patch('/reports/:reportId', updateReport);
router.delete('/reports/:reportId', deleteReport);
router.delete('/files/:fileId', deleteFileAsAdmin);

export default router;