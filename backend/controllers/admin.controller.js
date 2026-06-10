import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

import File from '../models/file.model.js';
import Report from '../models/report.model.js';
import User from '../models/user.model.js';

const logInfo = (fn, msg) => console.log(`[${fn}] ${msg}`);
const logWarn = (fn, msg) => console.warn(`[${fn}] ${msg}`);
const logError = (fn, err, extra = '') => {
    console.error(`[${fn}] ${extra}`.trim(), err);
};

const mapReport = (report) => ({
    id: report._id,
    resolved: report.resolved,
    reason: report.reason,
    description: report.description || '',
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    reporter: report.reporter_id
        ? {
            id: report.reporter_id._id,
            username: report.reporter_id.username || '',
            email: report.reporter_id.email || '',
        }
        : null,
    file: report.file_id
        ? {
            id: report.file_id._id,
            name: report.file_id.file_name || '',
            size: report.file_id.file_size || 0,
            visibility: report.file_id.visibility || 'unlisted',
            active: Boolean(report.file_id.active),
            uploadedAt: report.file_id.uploaded_at,
            owner: report.file_id.owner
                ? {
                    id: report.file_id.owner._id,
                    username: report.file_id.owner.username || '',
                    email: report.file_id.owner.email || '',
                }
                : null,
        }
        : null,
});

const deleteFileFromDisk = async (file) => {
    const uploadsRoot = path.resolve(process.cwd(), 'uploads');
    const absolutePath = path.resolve(uploadsRoot, file.file_path);
    await fs.promises.unlink(absolutePath);
};

export const getReports = async (req, res) => {
    try {
        const reports = await Report.find()
            .sort({ createdAt: -1 })
            .populate({
                path: 'reporter_id',
                select: '_id username email',
            })
            .populate({
                path: 'file_id',
                select: '_id file_name file_size visibility active uploaded_at owner file_path',
                populate: {
                    path: 'owner',
                    select: '_id username email',
                },
            })
            .lean();

        return res.status(200).json({
            status: 200,
            reports: reports.map(mapReport),
        });
    } catch (err) {
        console.error('Error loading admin reports:', err);
        return res.status(500).json({ status: 500, message: 'Internal server error' });
    }
};

export const updateReport = async (req, res) => {
    try {
        const { reportId } = req.params;
        const { resolved } = req.body || {};
        logInfo('updateReport', `Request received reportId=${reportId}, resolved=${resolved}`);

        if (!reportId || !mongoose.Types.ObjectId.isValid(reportId)) {
            logWarn('updateReport', `Invalid reportId=${reportId}`);
            return res.status(400).json({ status: 400, message: 'Valid report ID is required' });
        }

        const report = await Report.findById(reportId);
        if (!report) {
            return res.status(404).json({ status: 404, message: 'Report not found' });
        }

        report.resolved = typeof resolved === 'boolean' ? resolved : !report.resolved;
        await report.save();
        logInfo('updateReport', `Report updated reportId=${report._id}, resolved=${report.resolved}`);

        return res.status(200).json({
            status: 200,
            message: report.resolved ? 'Report marked as resolved' : 'Report reopened',
            report: {
                id: report._id,
                resolved: report.resolved,
            },
        });
    } catch (err) {
        logError('updateReport', err, 'Error updating report:');
        return res.status(500).json({ status: 500, message: 'Internal server error' });
    }
};

export const deleteReport = async (req, res) => {
    try {
        const { reportId } = req.params;
        logInfo('deleteReport', `Request received reportId=${reportId}`);

        if (!reportId || !mongoose.Types.ObjectId.isValid(reportId)) {
            logWarn('deleteReport', `Invalid reportId=${reportId}`);
            return res.status(400).json({ status: 400, message: 'Valid report ID is required' });
        }

        const deletedReport = await Report.findByIdAndDelete(reportId);
        if (!deletedReport) {
            logWarn('deleteReport', `Report not found reportId=${reportId}`);
            return res.status(404).json({ status: 404, message: 'Report not found' });
        }

        logInfo('deleteReport', `Report deleted reportId=${reportId}`);
        return res.status(200).json({ status: 200, message: 'Report deleted successfully' });
    } catch (err) {
        logError('deleteReport', err, 'Error deleting report:');
        return res.status(500).json({ status: 500, message: 'Internal server error' });
    }
};

export const deleteFileAsAdmin = async (req, res) => {
    try {
        const { fileId } = req.params;
        logInfo('deleteFileAsAdmin', `Request received fileId=${fileId}`);

        if (!fileId || !mongoose.Types.ObjectId.isValid(fileId)) {
            logWarn('deleteFileAsAdmin', `Invalid fileId=${fileId}`);
            return res.status(400).json({ status: 400, message: 'Valid file ID is required' });
        }

        const file = await File.findById(fileId);
        if (!file) {
            return res.status(404).json({ status: 404, message: 'File not found' });
        }

        try {
            await deleteFileFromDisk(file);
        } catch (err) {
            logError('deleteFileAsAdmin', err, 'Error deleting file from disk:');
            return res.status(500).json({ status: 500, message: 'Failed to delete file from storage' });
        }

        if (file.owner) {
            await User.findByIdAndUpdate(file.owner, {
                $inc: { current_storage: -file.file_size },
            });
        }

        await Report.deleteMany({ file_id: file._id });
        await File.findByIdAndDelete(fileId);
        logInfo('deleteFileAsAdmin', `File deleted as admin fileId=${fileId}`);

        return res.status(200).json({ status: 200, message: 'File deleted successfully' });
    } catch (err) {
        console.error('Error deleting file as admin:', err);
        return res.status(500).json({ status: 500, message: 'Internal server error' });
    }
};