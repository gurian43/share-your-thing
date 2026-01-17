import File from '../models/file.model.js';
import User from '../models/user.model.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export const getFileById = async (req, res) => {
    try {
        const { fileId } = req.params;

        if (!fileId) {
            return res.status(400).json({ status: 400, message: 'File ID is required' });
        }

        const file = await File.findById(fileId).populate('owner', 'email username');

        if (!file) {
            return res.status(404).json({ status: 404, message: 'File not found' });
        }

        file.shared_with_count = file.shared_with.length;

        if (file.visibility === 'private') {
            const isOwner = file.owner._id.toString() === req.session.userId;
            const isSharedWith = file.shared_with.some(id => id.toString() === req.session.userId);
            if (!req.session.userId || (!isOwner && !isSharedWith)) {
                return res.status(403).json({ status: 403, message: 'Access denied' });
            }
        }

        return res.status(200).json({ status: 200, file });
    } catch (err) {
        console.error('Error fetching file:', err);
        return res.status(500).json({ status: 500, message: 'Internal server error' });
    }
};

export const getUserFiles = async (req, res) => {
    try {
        const files = await File.find({ owner: req.session.userId })
            .sort({ uploaded_at: -1 })
            .lean();

        return res.status(200).json({ status: 200, files });
    } catch (err) {
        console.error('Error fetching user files:', err);
        return res.status(500).json({ status: 500, message: 'Internal server error' });
    }
};

export const deleteFile = async (req, res) => {
    try {
        const { fileId } = req.params;

        if (!fileId) {
            return res.status(400).json({ status: 400, message: 'File ID is required' });
        }

        const file = await File.findById(fileId);

        if (!file) {
            return res.status(404).json({ status: 404, message: 'File not found' });
        }

        const ownerId = file.owner.toString();
        const sessionUserId = req.session.userId ? req.session.userId.toString() : '';
        if (ownerId !== sessionUserId) {
            return res.status(403).json({ status: 403, message: 'Access denied' });
        }

        const uploadsRoot = path.resolve(process.cwd(), 'uploads');
        const absolutePath = path.resolve(uploadsRoot, file.file_path);
        try {
            await fs.promises.unlink(absolutePath);
        } catch (err) {
            console.error('Error deleting file from disk:', err);
            return res.status(500).json({ status: 500, message: 'Failed to delete file from storage' });
        }

        await User.findByIdAndUpdate(req.session.userId, {
            $inc: { current_storage: -file.file_size }
        });

        await File.findByIdAndDelete(fileId);

        return res.status(200).json({ status: 200, message: 'File deleted successfully' });
    } catch (err) {
        console.error('Error deleting file:', err);
        return res.status(500).json({ status: 500, message: 'Internal server error' });
    }
};

export const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: 400, message: 'No file uploaded' });
        }

        const userId = req.session.userId;
        const {
            visibility = 'unlisted',
            password = null,
            description = '',
            max_downloads = null,
            expires_at = null
        } = req.body || {};

        //TODO  add checksum later
        const checksum = "example_checksum";
        
        const absolutePath = req.file.path;
        const uploadsRoot = path.resolve(process.cwd(), 'uploads');
        const storedRelPath = path
            .relative(uploadsRoot, absolutePath)
            .split(path.sep)
            .join('/');

        const allowedVis = ['private', 'unlisted', 'public'];
        const safeVisibility = allowedVis.includes(visibility) ? visibility : 'unlisted';

        const parsedMax = max_downloads ? Number(max_downloads) : null;
        const parsedExpires = expires_at ? new Date(expires_at) : null;

        const newFile = new File({
            owner: userId,
            file_name: req.file.originalname,
            file_path: storedRelPath,
            file_size: req.file.size,
            visibility: safeVisibility,
            password: password || null,
            description: description || '',
            checksum,
            max_downloads: Number.isFinite(parsedMax) && parsedMax > 0 ? parsedMax : null,
            expires_at: parsedExpires && !isNaN(parsedExpires.valueOf()) ? parsedExpires : null,
        });

        await newFile.save();

        await User.findByIdAndUpdate(userId, {
            $inc: { current_storage: req.file.size }
        });

        return res.status(201).json({ status: 201, message: 'File uploaded successfully', file: newFile });
    } catch (err) {
        console.error('Error uploading file:', err);
        return res.status(500).json({ status: 500, message: 'Internal server error' });
    }
};