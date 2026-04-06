import mongoose from 'mongoose';

import File from '../models/file.model.js';
import Report from '../models/report.model.js';

export const reportFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const { reason, description = '' } = req.body;
        const reporterId = req.session.userId;

        if (!reporterId) {
            return res.status(401).json({ status: 401, message: 'Authentication required' });
        }

        if (!fileId || !mongoose.Types.ObjectId.isValid(fileId)) {
            return res.status(400).json({ status: 400, message: 'Valid file ID is required' });
        }

        if (!reason) {
            return res.status(400).json({ status: 400, message: 'Reason is required' });
        }

        const allowedReasons = ['inappropriate', 'spam', 'other'];
        if (!allowedReasons.includes(reason)) {
            return res.status(400).json({ status: 400, message: 'Invalid report reason' });
        }

        const file = await File.findById(fileId).select('_id file_name');
        if (!file) {
            return res.status(404).json({ status: 404, message: 'File not found' });
        }

        const existingReport = await Report.findOne({ reporter_id: reporterId, file_id: fileId });
        if (existingReport) {
            return res.status(409).json({ status: 409, message: 'You have already reported this file' });
        }

        const report = new Report({
            reporter_id: reporterId,
            file_id: fileId,
            reason,
            description: typeof description === 'string' ? description.trim() : '',
        });

        await report.save();

        return res.status(201).json({
            status: 201,
            message: 'Report submitted successfully',
            report,
        });
    } catch (err) {
        console.error('Error reporting file:', err);
        return res.status(500).json({ status: 500, message: 'Internal server error' });
    }
};