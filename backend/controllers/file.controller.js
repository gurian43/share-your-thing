import File from '../models/file.model.js';
import User from '../models/user.model.js';

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

export const createDevFile = async (req, res) => {
    try {
        if (process.env.NODE_ENV !== 'development') {
            return res.status(403).json({ status: 403, message: 'Forbidden' });
        }

        const { owner,
            file_name,
            file_size,
            visibility,
            password,
            description,
            checksum,
            download_count,
            max_downloads,
            shared_with,
            expires_at,
            uploaded_at
        } = req.body;

        const newFile = new File({
            owner,
            file_name,
            file_path: `/${owner}/files/${file_name}`,
            file_size,
            visibility,
            password,
            description,
            checksum,
            download_count,
            max_downloads,
            shared_with,
            expires_at,
            uploaded_at
        });

        await newFile.save();

        await User.findByIdAndUpdate(owner, {
            $inc: { current_storage: file_size }
        });

        return res.status(201).json({ status: 201, message: 'File created successfully', file: newFile });
    } catch (err) {
        console.error('Error creating file:', err);
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

        if (file.owner.toString() !== req.session.userId) {
            return res.status(403).json({ status: 403, message: 'Access denied' });
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