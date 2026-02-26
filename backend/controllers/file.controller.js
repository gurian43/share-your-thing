import File from '../models/file.model.js';
import User from '../models/user.model.js';
import fs from 'fs';
import path from 'path';
import Bcrypt from 'bcrypt';
import { encryptFile, createDecipherStream } from '../services/encryptionService.js';

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

        if (file.expires_at && new Date(file.expires_at) < new Date()) {
            file.active = false;
            await file.save();
        }

        file.shared_with_count = file.shared_with.length;

        if (file.visibility === 'private') {
            const isOwner = file.owner._id.toString() === req.session.userId?.toString();
            const isSharedWith = file.shared_with.some(id => id.toString() === req.session.userId?.toString());
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

export const downloadFile = async (req, res) => {
    try {
        const { fileId } = req.params;

        if (!fileId) {
            return res.status(400).json({ status: 400, message: 'File ID is required' });
        }

        const file = await File.findById(fileId);

        if (!file) {
            return res.status(404).json({ status: 404, message: 'File not found' });
        }

        if (!file.active) {
            return res.status(410).json({ status: 410, message: 'File is no longer active' });
        }

        // Check visibility and access permissions
        if (file.visibility === 'private') {
            const isOwner = file.owner.toString() === req.session.userId?.toString();
            const isSharedWith = file.shared_with.some(id => id.toString() === req.session.userId?.toString());
            if (!req.session.userId || (!isOwner && !isSharedWith)) {
                return res.status(403).json({ status: 403, message: 'Access denied' });
            }
        }

        if (file.password) {
            const suppliedPassword = req.body?.password || req.headers['x-file-password'];

            if (!suppliedPassword) {
                return res.status(401).json({
                    status: 401,
                    message: 'Password required',
                    requiresPassword: true
                });
            }

            const passwordMatches = await Bcrypt.compare(String(suppliedPassword), file.password);
            if (!passwordMatches) {
                return res.status(401).json({
                    status: 401,
                    message: 'Incorrect password'
                });
            }
        }

        if (file.max_downloads && file.download_count >= file.max_downloads) {
            file.active = false;
            await file.save();
            return res.status(410).json({ status: 410, message: 'Maximum downloads reached' });
        }

        // absolute file path
        const uploadsRoot = path.resolve(process.cwd(), 'uploads');
        const absolutePath = path.resolve(uploadsRoot, file.file_path);

        if (!fs.existsSync(absolutePath)) {
            return res.status(404).json({ status: 404, message: 'File not found on server' });
        }

        file.download_count += 1;
        
        if (file.max_downloads && file.download_count >= file.max_downloads) {
            file.active = false;
        }
        
        await file.save();

        // Decrypt and pipe the file
        try {
            const decipher = createDecipherStream(file.encryption_iv);
            res.setHeader('Content-Disposition', `attachment; filename="${file.file_name}"`);
            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('Content-Length', file.file_size);
            
            const readStream = fs.createReadStream(absolutePath);
            readStream.pipe(decipher).pipe(res);

            readStream.on('error', (err) => {
                console.error('Error reading encrypted file:', err);
                if (!res.headersSent) {
                    return res.status(500).json({ status: 500, message: 'Error downloading file' });
                }
            });

            decipher.on('error', (err) => {
                console.error('Error decrypting file:', err);
                if (!res.headersSent) {
                    return res.status(500).json({ status: 500, message: 'Error decrypting file' });
                }
            });
        } catch (err) {
            console.error('Error in file download:', err);
            if (!res.headersSent) {
                return res.status(500).json({ status: 500, message: 'Error downloading file' });
            }
        }
    } catch (err) {
        console.error('Error in downloadFile:', err);
        return res.status(500).json({ status: 500, message: 'Internal server error' });
    }
};

export const getUploadStatus = async (req, res) => {
    try {
        const { uploadId } = req.query;
        const userId = req.session.userId;

        if (!uploadId) {
            return res.status(400).json({ status: 400, message: 'Upload ID is required' });
        }

        const uploadsRoot = path.resolve(process.cwd(), 'uploads');
        const userKey = String(userId);
        const tempDir = path.join(uploadsRoot, userKey, '.temp', uploadId);

        // Check if temp directory exists
        if (!fs.existsSync(tempDir)) {
            return res.status(200).json({ 
                status: 200, 
                uploadedChunks: []
            });
        }

        // Get list of uploaded chunks
        const files = await fs.promises.readdir(tempDir);
        const chunkIndices = files
            .filter(f => f.startsWith('chunk-'))
            .map(f => parseInt(f.replace('chunk-', '')))
            .sort((a, b) => a - b);

        return res.status(200).json({ 
            status: 200, 
            uploadedChunks: chunkIndices
        });
    } catch (err) {
        console.error('Error checking upload status:', err);
        return res.status(500).json({ status: 500, message: 'Internal server error' });
    }
};

export const uploadChunk = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: 400, message: 'No chunk uploaded' });
        }

        const { uploadId, chunkIndex, totalChunks, fileName } = req.body;
        const userId = req.session.userId;

        if (!uploadId || chunkIndex === undefined || !totalChunks || !fileName) {
            return res.status(400).json({ status: 400, message: 'Missing required fields' });
        }

        // Create temp directory for this upload
        const uploadsRoot = path.resolve(process.cwd(), 'uploads');
        const userKey = String(userId);
        const tempDir = path.join(uploadsRoot, userKey, '.temp', uploadId);

        try {
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
        } catch (err) {
            console.error('Error creating temp directory:', err);
            return res.status(500).json({ status: 500, message: 'Failed to create temp directory' });
        }

        // Move chunk to temp directory
        const chunkPath = path.join(tempDir, `chunk-${chunkIndex}`);
        try {
            await fs.promises.rename(req.file.path, chunkPath);
        } catch (err) {
            console.error('Error saving chunk:', err);
            return res.status(500).json({ status: 500, message: 'Failed to save chunk' });
        }

        return res.status(200).json({ 
            status: 200, 
            message: 'Chunk uploaded successfully',
            chunkIndex: parseInt(chunkIndex),
            totalChunks: parseInt(totalChunks)
        });
    } catch (err) {
        console.error('Error uploading chunk:', err);
        return res.status(500).json({ status: 500, message: 'Internal server error' });
    }
};

export const finalizeUpload = async (req, res) => {
    try {
        const {
            uploadId,
            fileName,
            fileSize,
            totalChunks,
            checksum,
            description = '',
            visibility = 'unlisted',
            password = null,
            max_downloads = null,
            expires_at = null,
        } = req.body;

        if (password && password.length > 32) {
            return res.status(400).json({ status: 400, message: 'Password must be 32 characters or less' });
        }

        const userId = req.session.userId;

        if (!uploadId || !fileName || !totalChunks || !checksum) {
            return res.status(400).json({ status: 400, message: 'Missing required fields' });
        }

        const uploadsRoot = path.resolve(process.cwd(), 'uploads');
        const userKey = String(userId);
        const tempDir = path.join(uploadsRoot, userKey, '.temp', uploadId);

        // Verify all chunks exist
        for (let i = 0; i < totalChunks; i++) {
            const chunkPath = path.join(tempDir, `chunk-${i}`);
            if (!fs.existsSync(chunkPath)) {
                return res.status(400).json({ 
                    status: 400, 
                    message: `Missing chunk ${i}` 
                });
            }
        }

        // Merge chunks
        const uniqueId = Math.random().toString(36).substring(2, 15);
        const sanitizedOriginal = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const finalFileName = `${sanitizedOriginal}-${uniqueId}`;
        const finalFilePath = path.join(uploadsRoot, userKey, finalFileName);

        try {
            const writeStream = fs.createWriteStream(finalFilePath);
            
            for (let i = 0; i < totalChunks; i++) {
                const chunkPath = path.join(tempDir, `chunk-${i}`);
                const data = await fs.promises.readFile(chunkPath);
                writeStream.write(data);
            }

            await new Promise((resolve, reject) => {
                writeStream.end(resolve);
                writeStream.on('error', reject);
            });

            // checksum
            const calculatedChecksum = checksum;

            // Encrypt the file
            let encryptionIv = null;
            const encryptedFilePath = `${finalFilePath}.enc`;
            try {
                encryptionIv = await encryptFile(finalFilePath, encryptedFilePath);
                await fs.promises.unlink(finalFilePath);
            } catch (encryptErr) {
                console.error('Error encrypting file:', encryptErr);
                try {
                    if (fs.existsSync(encryptedFilePath)) {
                        await fs.promises.unlink(encryptedFilePath);
                    }
                } catch (e) {
                    console.error('Error cleaning up encrypted file:', e);
                }
                throw new Error('Failed to encrypt file');
            }

            // clean up temp
            try {
                const files = await fs.promises.readdir(tempDir);
                for (const file of files) {
                    await fs.promises.unlink(path.join(tempDir, file));
                }
                await fs.promises.rmdir(tempDir);
            } catch (err) {
                console.warn('Warning: Failed to clean up temp directory:', err);
            }
           
            // create file record
            const storedRelPath = path
                .relative(uploadsRoot, encryptedFilePath)
                .split(path.sep)
                .join('/');

            const allowedVis = ['private', 'unlisted', 'public'];
            const safeVisibility = allowedVis.includes(visibility) ? visibility : 'unlisted';

            const parsedMax = max_downloads ? Number(max_downloads) : null;
            const parsedExpires = expires_at ? new Date(expires_at) : null;

            let hashedPassword = null;
            if (password) {
                const salt = await Bcrypt.genSalt(10);
                hashedPassword = await Bcrypt.hash(password, salt);
            }

            const newFile = new File({
                owner: userId,
                file_name: fileName,
                file_path: storedRelPath,
                file_size: fileSize,
                visibility: safeVisibility,
                password: hashedPassword,
                description: description || '',
                checksum: calculatedChecksum,
                encryption_iv: encryptionIv,
                max_downloads: Number.isFinite(parsedMax) && parsedMax > 0 ? parsedMax : null,
                active: parsedExpires && !isNaN(parsedExpires.valueOf()) ? (parsedExpires <= new Date() ? false : true) : true,
                expires_at: parsedExpires && !isNaN(parsedExpires.valueOf()) ? parsedExpires : null,
            });

            await newFile.save();

            await User.findByIdAndUpdate(userId, {
                $inc: { current_storage: fileSize }
            });

            return res.status(201).json({ 
                status: 201, 
                message: 'File uploaded successfully', 
                file: newFile
            });
        } catch (err) {
            try {
                if (fs.existsSync(finalFilePath)) {
                    await fs.promises.unlink(finalFilePath);
                }
                const encryptedFilePath = `${finalFilePath}.enc`;
                if (fs.existsSync(encryptedFilePath)) {
                    await fs.promises.unlink(encryptedFilePath);
                }
            } catch (e) {
                console.error('Error cleaning up failed upload:', e);
            }
            throw err;
        }
    } catch (err) {
        console.error('Error finalizing upload:', err);
        return res.status(500).json({ status: 500, message: err.message || 'Internal server error' });
    }
};