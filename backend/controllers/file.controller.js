import File from '../models/file.model.js';
import User from '../models/user.model.js';
import Vote from '../models/vote.model.js';
import fs from 'fs';
import path from 'path';
import Bcrypt from 'bcrypt';
import { encryptFile, createDecipherStream } from '../services/encryptionService.js';

const getVoteSummary = async (fileId, userId) => {
    const [upvotes, downvotes] = await Promise.all([
        Vote.countDocuments({ file_id: fileId, value: 1 }),
        Vote.countDocuments({ file_id: fileId, value: -1 }),
    ]);

    let userVote = 0;
    if (userId) {
        const vote = await Vote.findOne({ file_id: fileId, user_id: userId }).select('value').lean();
        userVote = vote?.value || 0;
    }

    return {
        score: upvotes - downvotes,
        userVote,
    };
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const validateUploadFileName = (rawName) => {
    const name = String(rawName || '').trim();

    if (!name) {
        return { valid: false, message: 'File name is required' };
    }

    if (name.length > 120) {
        return { valid: false, message: `File name must be 120 characters or less` };
    }

    if (!/^[a-zA-Z0-9 ._\-()[\]&',+]+$/.test(name)) {
        return {
            valid: false,
            message: "File name contains invalid characters. Allowed: letters, numbers, spaces, . _ - ( ) [ ] & ' , +",
        };
    }

    return { valid: true, value: name };
};

const getStorageLimitBytes = (user) => {
    if (!user) return 0;
    if (user.admin || user.role === 'admin') return Infinity;
    return Number(user.max_storage) || 0;
};

const getRemainingStorageBytes = (user) => {
    const storageLimitBytes = getStorageLimitBytes(user);
    if (storageLimitBytes === Infinity) return Infinity;
    return Math.max(storageLimitBytes - (Number(user?.current_storage) || 0), 0);
};

const removeUploadArtifacts = async (tempDir, chunkPath) => {
    if (chunkPath) {
        await fs.promises.unlink(chunkPath).catch(() => {});
    }

    if (tempDir && fs.existsSync(tempDir)) {
        await fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
};

const moveFileAcrossDevices = async (srcPath, destPath) => {
    await fs.promises.copyFile(srcPath, destPath);
    await fs.promises.unlink(srcPath).catch(() => {});
};

export const getFileById = async (req, res) => {
    try {
        const { fileId } = req.params;

        if (!fileId) {
            return res.status(400).json({ status: 400, message: 'File ID is required' });
        }

        const file = await File.findById(fileId).populate('owner', '_id email username profile');

        if (!file) {
            return res.status(404).json({ status: 404, message: 'File not found' });
        }

        if (file.expires_at && new Date(file.expires_at) < new Date()) {
            file.active = false;
            await file.save();
        }

        const fileData = file.toObject();
        fileData.shared_with_count = Array.isArray(file.shared_with_emails)
            ? file.shared_with_emails.length
            : 0;

        if (fileData.visibility === 'private') {
            const isOwner = fileData.owner._id.toString() === req.session.userId?.toString();
            const isSharedWith = fileData.shared_with.some(id => id.toString() === req.session.userId?.toString());
            if (!req.session.userId || (!isOwner && !isSharedWith)) {
                return res.status(403).json({ status: 403, message: 'Access denied' });
            }
        }

        const voteSummary = await getVoteSummary(fileData._id, req.session.userId);
        fileData.score = voteSummary.score;
        fileData.user_vote = voteSummary.userVote;

        return res.status(200).json({ status: 200, file: fileData });
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

        const filesWithShareMeta = files.map((file) => ({
            ...file,
            shared_with_count: Array.isArray(file.shared_with_emails) ? file.shared_with_emails.length : 0,
            shared_with_emails: Array.isArray(file.shared_with_emails) ? file.shared_with_emails : [],
        }));

        return res.status(200).json({ status: 200, files: filesWithShareMeta });
    } catch (err) {
        console.error('Error fetching user files:', err);
        return res.status(500).json({ status: 500, message: 'Internal server error' });
    }
};

export const updateFileShareSettings = async (req, res) => {
    try {
        const { fileId } = req.params;
        const userId = req.session.userId;
        const { visibility, sharedWithEmails = [] } = req.body || {};

        if (!fileId) {
            return res.status(400).json({ status: 400, message: 'File ID is required' });
        }

        const allowedVisibility = ['private', 'unlisted', 'public'];
        if (!allowedVisibility.includes(visibility)) {
            return res.status(400).json({ status: 400, message: 'Invalid visibility value' });
        }

        if (!Array.isArray(sharedWithEmails)) {
            return res.status(400).json({ status: 400, message: 'sharedWithEmails must be an array' });
        }

        const file = await File.findById(fileId).select('_id owner visibility shared_with shared_with_emails');
        if (!file) {
            return res.status(404).json({ status: 404, message: 'File not found' });
        }

        if (file.owner.toString() !== userId.toString()) {
            return res.status(403).json({ status: 403, message: 'Access denied' });
        }

        let normalizedEmails = [];
        let sharedWithUserIds = [];
        if (visibility === 'private') {
            normalizedEmails = [...new Set(
                sharedWithEmails
                    .map(normalizeEmail)
                    .filter(Boolean)
            )];

            const invalidEmail = normalizedEmails.find((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
            if (invalidEmail) {
                return res.status(400).json({ status: 400, message: `Invalid email: ${invalidEmail}` });
            }

            if (normalizedEmails.length > 0) {
                const users = await User.find({ email: { $in: normalizedEmails }, active: true })
                    .select('_id email')
                    .lean();

                const foundEmails = new Set(users.map((user) => normalizeEmail(user.email)));
                const missingEmails = normalizedEmails.filter((email) => !foundEmails.has(email));
                if (missingEmails.length > 0) {
                    return res.status(400).json({
                        status: 400,
                        message: `Users not found or inactive: ${missingEmails.join(', ')}`,
                    });
                }

                sharedWithUserIds = users
                    .map((user) => user._id)
                    .filter((id) => id.toString() !== userId.toString());
            }
        }

        file.visibility = visibility;
        file.shared_with = visibility === 'private' ? sharedWithUserIds : [];
        file.shared_with_emails = visibility === 'private' ? normalizedEmails : [];
        await file.save();

        const populatedFile = await File.findById(file._id)
            .select('_id visibility shared_with_emails')
            .lean();

        return res.status(200).json({
            status: 200,
            message: 'Share settings updated',
            file: {
                id: populatedFile._id,
                visibility: populatedFile.visibility,
                shared_with_count: Array.isArray(populatedFile.shared_with_emails)
                    ? populatedFile.shared_with_emails.length
                    : 0,
                shared_with_emails: Array.isArray(populatedFile.shared_with_emails)
                    ? populatedFile.shared_with_emails
                    : [],
            },
        });
    } catch (err) {
        console.error('Error updating share settings:', err);
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

export const cancelUpload = async (req, res) => {
    try {
        const { uploadId } = req.body || {};
        const userId = req.session.userId;

        if (!uploadId) {
            return res.status(400).json({ status: 400, message: 'Upload ID is required' });
        }

        const uploadsRoot = path.resolve(process.cwd(), 'uploads');
        const userKey = String(userId);
        const tempDir = path.join(uploadsRoot, userKey, '.temp', String(uploadId));

        if (!fs.existsSync(tempDir)) {
            return res.status(200).json({ status: 200, message: 'Upload already cleared' });
        }

        await fs.promises.rm(tempDir, { recursive: true, force: true });

        return res.status(200).json({ status: 200, message: 'Upload cancelled and temporary chunks deleted' });
    } catch (err) {
        console.error('Error cancelling upload:', err);
        return res.status(500).json({ status: 500, message: 'Internal server error' });
    }
};

export const uploadChunk = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: 400, message: 'No chunk uploaded' });
        }

        const { uploadId, chunkIndex, totalChunks, fileName, fileSize } = req.body;
        const userId = req.session.userId;
        const user = await User.findById(userId).select('_id current_storage max_storage role admin');

        if (!user) {
            await fs.promises.unlink(req.file.path).catch(() => {});
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        if (!uploadId || chunkIndex === undefined || !totalChunks || !fileName) {
            await fs.promises.unlink(req.file.path).catch(() => {});
            return res.status(400).json({ status: 400, message: 'Missing required fields' });
        }

        const parsedFileSize = Number(fileSize);
        if (!Number.isFinite(parsedFileSize) || parsedFileSize <= 0) {
            await fs.promises.unlink(req.file.path).catch(() => {});
            return res.status(400).json({ status: 400, message: 'Invalid file size' });
        }

        const remainingStorageBytes = getRemainingStorageBytes(user);
        if (remainingStorageBytes !== Infinity && parsedFileSize > remainingStorageBytes) {
            const uploadsRoot = path.resolve(process.cwd(), 'uploads');
            const userKey = String(userId);
            const tempDir = path.join(uploadsRoot, userKey, '.temp', String(uploadId));
            await removeUploadArtifacts(tempDir, req.file.path);

            return res.status(413).json({
                status: 413,
                message: 'File is too large for your storage limit',
            });
        }

        const fileNameValidation = validateUploadFileName(fileName);
        if (!fileNameValidation.valid) {
            await fs.promises.unlink(req.file.path).catch(() => {});
            return res.status(400).json({ status: 400, message: fileNameValidation.message });
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
            await fs.promises.unlink(req.file.path).catch(() => {});
            return res.status(500).json({ status: 500, message: 'Failed to create temp directory' });
        }

        // Move chunk to temp directory
        const chunkPath = path.join(tempDir, `chunk-${chunkIndex}`);
        try {
            await moveFileAcrossDevices(req.file.path, chunkPath);
        } catch (err) {
            console.error('Error saving chunk:', err);
            await removeUploadArtifacts(tempDir, req.file.path);
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
            sharedWithEmails = [],
            password = null,
            max_downloads = null,
            expires_at = null,
        } = req.body;

        if (password && password.length > 32) {
            return res.status(400).json({ status: 400, message: 'Password must be 32 characters or less' });
        }

        const userId = req.session.userId;
        const user = await User.findById(userId).select('_id current_storage max_storage role admin');

        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        if (!uploadId || !fileName || !totalChunks || !checksum) {
            return res.status(400).json({ status: 400, message: 'Missing required fields' });
        }

        const parsedFileSize = Number(fileSize);
        if (!Number.isFinite(parsedFileSize) || parsedFileSize <= 0) {
            return res.status(400).json({ status: 400, message: 'Invalid file size' });
        }

        const remainingStorageBytes = getRemainingStorageBytes(user);
        if (remainingStorageBytes !== Infinity && parsedFileSize > remainingStorageBytes) {
            return res.status(413).json({
                status: 413,
                message: 'File is too large for your storage limit',
            });
        }

        const fileNameValidation = validateUploadFileName(fileName);
        if (!fileNameValidation.valid) {
            return res.status(400).json({ status: 400, message: fileNameValidation.message });
        }
        const safeFileName = fileNameValidation.value;
        const originalFileName = String(req.body?.originalFileName || '').trim() || safeFileName;

        if (!Array.isArray(sharedWithEmails)) {
            return res.status(400).json({ status: 400, message: 'sharedWithEmails must be an array' });
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
        const sanitizedOriginal = safeFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
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

            let normalizedEmails = [];
            let sharedWithUserIds = [];
            if (safeVisibility === 'private') {
                normalizedEmails = [...new Set(
                    sharedWithEmails
                        .map(normalizeEmail)
                        .filter(Boolean)
                )];

                const invalidEmail = normalizedEmails.find((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
                if (invalidEmail) {
                    return res.status(400).json({ status: 400, message: `Invalid email: ${invalidEmail}` });
                }

                if (normalizedEmails.length > 0) {
                    const users = await User.find({ email: { $in: normalizedEmails }, active: true })
                        .select('_id email')
                        .lean();

                    const foundEmails = new Set(users.map((user) => normalizeEmail(user.email)));
                    const missingEmails = normalizedEmails.filter((email) => !foundEmails.has(email));
                    if (missingEmails.length > 0) {
                        return res.status(400).json({
                            status: 400,
                            message: `Users not found or inactive: ${missingEmails.join(', ')}`,
                        });
                    }

                    sharedWithUserIds = users
                        .map((user) => user._id)
                        .filter((id) => id.toString() !== userId.toString());
                }
            }

            const newFile = new File({
                owner: userId,
                file_name: safeFileName,
                original_file_name: originalFileName,
                file_path: storedRelPath,
                file_size: fileSize,
                visibility: safeVisibility,
                shared_with: safeVisibility === 'private' ? sharedWithUserIds : [],
                shared_with_emails: safeVisibility === 'private' ? normalizedEmails : [],
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

export const voteFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const userId = req.session.userId;
        const parsedValue = Number(req.body?.value);

        if (!fileId) {
            return res.status(400).json({ status: 400, message: 'File ID is required' });
        }

        if (!userId) {
            return res.status(401).json({ status: 401, message: 'Unauthorized' });
        }

        if (![1, -1].includes(parsedValue)) {
            return res.status(400).json({ status: 400, message: 'Vote value must be 1 or -1' });
        }

        const file = await File.findById(fileId).select('_id visibility owner shared_with');
        if (!file) {
            return res.status(404).json({ status: 404, message: 'File not found' });
        }

        if (file.visibility === 'private') {
            const isOwner = file.owner.toString() === userId.toString();
            const isSharedWith = file.shared_with.some(id => id.toString() === userId.toString());
            if (!isOwner && !isSharedWith) {
                return res.status(403).json({ status: 403, message: 'Access denied' });
            }
        }

        if (file.owner.toString() === userId.toString()) {
            return res.status(403).json({ status: 403, message: 'You cannot vote on your own file' });
        }

        const existingVote = await Vote.findOne({ file_id: fileId, user_id: userId });

        if (!existingVote) {
            await Vote.create({ file_id: fileId, user_id: userId, value: parsedValue });
        } else if (existingVote.value === parsedValue) {
            await Vote.findByIdAndDelete(existingVote._id);
        } else {
            existingVote.value = parsedValue;
            await existingVote.save();
        }

        const voteSummary = await getVoteSummary(fileId, userId);

        return res.status(200).json({
            status: 200,
            message: 'Vote updated',
            vote: {
                user_vote: voteSummary.userVote,
                score: voteSummary.score,
            },
        });
    } catch (err) {
        console.error('Error voting file:', err);
        return res.status(500).json({ status: 500, message: 'Internal server error' });
    }
};

export const getPublicFiles = async (req, res) => {
    try {
        const search = String(req.query?.search || '').trim();
        const sortBy = String(req.query?.sortBy || 'date').toLowerCase();
        const sortOrder = String(req.query?.sortOrder || 'desc').toLowerCase() === 'asc' ? 1 : -1;
        const passwordFilterRaw = String(req.query?.passwordFilter || '').trim().toLowerCase();
        const passwordFilter = passwordFilterRaw === '+'
            ? 'protected'
            : passwordFilterRaw === '-'
                ? 'unprotected'
                : passwordFilterRaw;
        const page = Math.max(parseInt(req.query?.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query?.limit, 10) || 12, 1), 50);

        const sortFieldMap = {
            date: 'uploaded_at',
            score: 'score',
            size: 'file_size',
        };
        const sortField = sortFieldMap[sortBy] || 'uploaded_at';

        const match = {
            visibility: 'public',
            active: true,
            $or: [
                { expires_at: null },
                { expires_at: { $gt: new Date() } },
            ],
        };

        if (search) {
            match.file_name = { $regex: search, $options: 'i' };
        }

        if (passwordFilter === 'protected') {
            match.password = { $ne: null };
        } else if (passwordFilter === 'unprotected') {
            match.password = null;
        }

        const skip = (page - 1) * limit;

        const sortStage = sortField === 'uploaded_at'
            ? { uploaded_at: sortOrder, _id: sortOrder }
            : { [sortField]: sortOrder, uploaded_at: -1, _id: -1 };

        const results = await File.aggregate([
            { $match: match },
            {
                $lookup: {
                    from: 'votes',
                    localField: '_id',
                    foreignField: 'file_id',
                    as: 'votes',
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'owner',
                    foreignField: '_id',
                    as: 'owner_data',
                },
            },
            {
                $addFields: {
                    score: { $sum: '$votes.value' },
                    owner_data: { $arrayElemAt: ['$owner_data', 0] },
                },
            },
            { $sort: sortStage },
            {
                $facet: {
                    data: [
                        { $skip: skip },
                        { $limit: limit },
                        {
                            $project: {
                                _id: 1,
                                file_name: 1,
                                file_size: 1,
                                uploaded_at: 1,
                                download_count: 1,
                                password: 1,
                                description: 1,
                                score: 1,
                                owner: {
                                    _id: '$owner_data._id',
                                    username: '$owner_data.username',
                                },
                            },
                        },
                    ],
                    meta: [{ $count: 'total' }],
                },
            },
        ]);

        const files = results[0]?.data || [];
        const total = results[0]?.meta?.[0]?.total || 0;
        const totalPages = Math.max(Math.ceil(total / limit), 1);

        return res.status(200).json({
            status: 200,
            files,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
            sort: {
                sortBy: sortField === 'uploaded_at' ? 'date' : sortBy,
                sortOrder: sortOrder === 1 ? 'asc' : 'desc',
            },
            filters: {
                search,
                passwordFilter: passwordFilterRaw || 'all',
            },
        });
    } catch (err) {
        console.error('Error fetching public files:', err);
        return res.status(500).json({ status: 500, message: 'Internal server error' });
    }
};

export const changeFilePassword = async (req, res) => {
    try {
        const { fileId } = req.params;
        const userId = req.session.userId;
        const { password } = req.body || {};

        if (!userId) {
            return res.status(401).json({ status: 401, message: 'Authentication required' });
        }

        if (!fileId) {
            return res.status(400).json({ status: 400, message: 'File ID is required' });
        }

        const file = await File.findById(fileId).select('_id owner file_size password');
        if (!file) {
            return res.status(404).json({ status: 404, message: 'File not found' });
        }

        if (file.owner.toString() !== userId.toString()) {
            return res.status(403).json({ status: 403, message: 'Access denied' });
        }

        if (!password) {
            // remove password protection
            file.password = null;
            await file.save();
            return res.status(200).json({ status: 200, message: 'File password removed' });
        }

        if (typeof password !== 'string' || password.length < 1 || password.length > 32) {
            return res.status(400).json({ status: 400, message: 'Password must be 1-32 characters' });
        }

        const salt = await Bcrypt.genSalt(10);
        const hashedPassword = await Bcrypt.hash(String(password), salt);

        file.password = hashedPassword;
        await file.save();

        return res.status(200).json({ status: 200, message: 'File password updated' });
    } catch (err) {
        console.error('Error changing file password:', err);
        return res.status(500).json({ status: 500, message: 'Internal server error' });
    }
};

export const updateFileMetadata = async (req, res) => {
    try {
        const { fileId } = req.params;
        const userId = req.session.userId;
        const {
            file_name,
            description,
            max_downloads,
            expires_at,
            visibility,
            sharedWithEmails,
        } = req.body || {};

        if (!fileId) {
            return res.status(400).json({ status: 400, message: 'File ID is required' });
        }

        const file = await File.findById(fileId).select('_id owner file_name description max_downloads expires_at file_size visibility shared_with shared_with_emails');
        if (!file) {
            return res.status(404).json({ status: 404, message: 'File not found' });
        }

        if (!userId || file.owner.toString() !== userId.toString()) {
            return res.status(403).json({ status: 403, message: 'Access denied' });
        }

        if (file_name) {
            if (typeof file_name !== 'string' || file_name.trim().length === 0 || file_name.length > 120) {
                return res.status(400).json({ status: 400, message: 'Invalid file name' });
            }
            file.file_name = file_name.trim();
        }

        if (typeof description === 'string') {
            file.description = description;
        }

        if (typeof max_downloads !== 'undefined') {
            const parsed = Number(max_downloads);
            file.max_downloads = Number.isFinite(parsed) && parsed > 0 ? parsed : null;
        }

        if (typeof expires_at !== 'undefined') {
            const date = expires_at ? new Date(expires_at) : null;
            file.expires_at = date && !isNaN(date.valueOf()) ? date : null;
        }

        const allowedVisibility = ['private', 'unlisted', 'public'];
        if (typeof visibility !== 'undefined' && !allowedVisibility.includes(visibility)) {
            return res.status(400).json({ status: 400, message: 'Invalid visibility value' });
        }

        if (typeof sharedWithEmails !== 'undefined' && !Array.isArray(sharedWithEmails)) {
            return res.status(400).json({ status: 400, message: 'sharedWithEmails must be an array' });
        }

        const nextVisibility = typeof visibility !== 'undefined' ? visibility : file.visibility;
        const nextSharedEmails = nextVisibility === 'private'
            ? (Array.isArray(sharedWithEmails) ? sharedWithEmails : (file.shared_with_emails || []))
            : [];

        if (nextVisibility === 'private') {
            const normalizedEmails = [...new Set(
                nextSharedEmails
                    .map(normalizeEmail)
                    .filter(Boolean)
            )];

            const invalidEmail = normalizedEmails.find((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
            if (invalidEmail) {
                return res.status(400).json({ status: 400, message: `Invalid email: ${invalidEmail}` });
            }

            let sharedWithUserIds = [];
            if (normalizedEmails.length > 0) {
                const users = await User.find({ email: { $in: normalizedEmails }, active: true })
                    .select('_id email')
                    .lean();

                const foundEmails = new Set(users.map((user) => normalizeEmail(user.email)));
                const missingEmails = normalizedEmails.filter((email) => !foundEmails.has(email));
                if (missingEmails.length > 0) {
                    return res.status(400).json({
                        status: 400,
                        message: `Users not found or inactive: ${missingEmails.join(', ')}`,
                    });
                }

                sharedWithUserIds = users
                    .map((user) => user._id)
                    .filter((id) => id.toString() !== userId.toString());
            }

            file.visibility = nextVisibility;
            file.shared_with = sharedWithUserIds;
            file.shared_with_emails = normalizedEmails;
        } else if (typeof visibility !== 'undefined') {
            file.visibility = nextVisibility;
            file.shared_with = [];
            file.shared_with_emails = [];
        }

        await file.save();

        return res.status(200).json({ status: 200, message: 'File updated', file: {
            id: file._id,
            file_name: file.file_name,
            description: file.description,
            max_downloads: file.max_downloads,
            expires_at: file.expires_at,
            visibility: file.visibility,
            shared_with_count: Array.isArray(file.shared_with_emails) ? file.shared_with_emails.length : 0,
            shared_with_emails: file.shared_with_emails || [],
        }});
    } catch (err) {
        console.error('Error updating file metadata:', err);
        return res.status(500).json({ status: 500, message: 'Internal server error' });
    }
};