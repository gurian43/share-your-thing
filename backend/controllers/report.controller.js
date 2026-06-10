import mongoose from 'mongoose';

import File from '../models/file.model.js';
import Report from '../models/report.model.js';

const logInfo = (fn, msg) => console.log(`[${fn}] ${msg}`);
const logWarn = (fn, msg) => console.warn(`[${fn}] ${msg}`);
const logError = (fn, err, extra = '') => {
    console.error(`[${fn}] ${extra}`.trim(), err);
};

export const reportFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const { reason, description = '' } = req.body;
        const reporterId = req.session.userId;
        logInfo('reportFile', `Request received reporterId=${reporterId}, fileId=${fileId}`);

        if (!reporterId) {
            logWarn('reportFile', 'Authentication required');
            return res.status(401).json({ status: 401, message: 'Authentication required' });
        }

        if (!fileId || !mongoose.Types.ObjectId.isValid(fileId)) {
            logWarn('reportFile', `Invalid fileId=${fileId}`);
            return res.status(400).json({ status: 400, message: 'Valid file ID is required' });
        }

        if (!reason) {
            logWarn('reportFile', 'Reason is required');
            return res.status(400).json({ status: 400, message: 'Reason is required' });
        } 

        const allowedReasons = ['inappropriate', 'spam', 'other'];
        if (!allowedReasons.includes(reason)) {
            logWarn('reportFile', `Invalid report reason=${reason}`);
            return res.status(400).json({ status: 400, message: 'Invalid report reason' });
        }

        const file = await File.findById(fileId).select('_id file_name owner');
        if (!file) {
            logWarn('reportFile', `File not found fileId=${fileId}`);
            return res.status(404).json({ status: 404, message: 'File not found' });
        }

        if (file.owner && file.owner.toString() === reporterId.toString()) {
            return res.status(403).json({ status: 403, message: 'You cannot report your own file' });
        }

        const existingReport = await Report.findOne({ reporter_id: reporterId, file_id: fileId });
        if (existingReport) {
            logWarn('reportFile', `Duplicate report detected reporterId=${reporterId}, fileId=${fileId}`);
            return res.status(409).json({ status: 409, message: 'You have already reported this file' });
        }

        const report = new Report({
            reporter_id: reporterId,
            file_id: fileId,
            reason,
            description: typeof description === 'string' ? description.trim() : '',
        });

        await report.save();
        logInfo('reportFile', `Report submitted successfully reportId=${report._id}, reporterId=${reporterId}, fileId=${fileId}`);

        return res.status(201).json({
            status: 201,
            message: 'Report submitted successfully',
            report,
        });
    } catch (err) {
        logError('reportFile', err, 'Error reporting file:');
        return res.status(500).json({ status: 500, message: 'Internal server error' });
    }
};