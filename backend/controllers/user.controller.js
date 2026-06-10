import User from '../models/user.model.js';
import Activation from '../models/activation.model.js';
import File from '../models/file.model.js';
import Vote from '../models/vote.model.js';
import Pwdreset from '../models/pwdreset.model.js';
import Bcrypt from 'bcrypt';
import crypto from 'crypto';
import { verifyCaptcha } from '../services/turnstile.js';
import { sendResetEmail as sendPasswordResetEmail, sendTokenEmail } from '../services/emailService.js'

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const APP_ENV = process.env.NODE_ENV || process.env.MODE || process.env.mode || 'development';

const invalidateUserSessions = async (userId, currentSessionId = null) => {
    const sessionQuery = {
        $or: [
            { 'session.userId': String(userId) },
            { 'session.userId': userId }
        ]
    };

    if (currentSessionId) {
        sessionQuery._id = { $ne: currentSessionId };
    }

    await User.db.collection('sessions').deleteMany(sessionQuery);
};

const verifyPasswordStrength = (password) => {
    if (password.length < 8 || password.length > 64) {
        return { valid: false, message: 'Password must be between 8 and 64 characters' };
    }
    if (!/\d/.test(password)) {
        return { valid: false, message: 'Password must contain at least one number' };
    }
    return { valid: true };
}

export const registerUser = async (req, res) => {
    try {
        if(!req.body.password || !req.body.email || !req.body.username) {
            return res.status(400).json({ status: 400, message: 'Missing required fields' });
        }

        if(APP_ENV !== "development") {
            const captchaResult = await verifyCaptcha(
                req.body.captchaToken,
                req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress
            );
        
            if(!captchaResult || !captchaResult.success) {
                const statusCode = captchaResult?.code || 400;
                return res.status(statusCode).json({ status: statusCode, message: captchaResult?.message || 'Captcha verification failed' });
            }
        }

        const existingUser = await User.findOne({ $or: [ { email: req.body.email }, { username: req.body.username } ] });

        if(existingUser) {
            return res.status(400).json({ status: 400, message: 'Email or username already in use' });
        }

        const passwordValidation = verifyPasswordStrength(req.body.password);

        if (!passwordValidation.valid) {
            return res.status(400).json({ status: 400, message: passwordValidation.message });
        }

        if(req.body.username.length > 32) {
            return res.status(400).json({ status: 400, message: 'Username must be 32 characters or less' });
        }

        if(!/^[a-zA-Z0-9_]+$/.test(req.body.username)) {
            return res.status(400).json({ status: 400, message: 'Username can only contain letters, numbers, and underscores' });
        }

        if(req.body.email.length > 64) {
            return res.status(400).json({ status: 400, message: 'Email must be 64 characters or less' });
        }

        if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) {
            return res.status(400).json({ status: 400, message: 'Invalid email format' });
        }

        const salt = await Bcrypt.genSalt(10);
        const hashedPassword = await Bcrypt.hash(req.body.password, salt);

        const newUser = new User({
            username: req.body.username,
            email: req.body.email,
            passwordHash: hashedPassword,
            badges: [{ title: 'Early Tester', date_awarded: new Date(), color: 'blue' }],
            active: false,
        });

        await newUser.save();

        const rawActivationToken = crypto.randomBytes(16).toString('hex');
        const newActivation = new Activation({
            user_id: newUser._id,
            activation_token_hash: hashToken(rawActivationToken)
        });
        await newActivation.save();

        await sendTokenEmail(newUser.email, rawActivationToken);
        return res.status(201).json({ status: 201, message: 'User registered successfully. Please check your email to activate your account.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 500, message: 'Server error' });
    }
}

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ status: 400, message: 'Missing fields' });
        }

        if(APP_ENV !== "development") {
            const captchaResult = await verifyCaptcha(
                req.body.captchaToken,
                req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress
            );

            if(!captchaResult || !captchaResult.success) {
                const statusCode = captchaResult?.code || 400;
                return res.status(statusCode).json({ status: statusCode, message: captchaResult?.message || 'Captcha verification failed' });
            }
        }

        const user = await User.findOne({ email: email });

        if (!user) {
            return res.status(400).json({ status: 400, message: 'Invalid credentials' });
        }

        const isMatch = await Bcrypt.compare(password, user.passwordHash);

        if (!isMatch) {
            return res.status(400).json({ status: 400, message: 'Invalid credentials' });
        }

        if (!user.active) {
            return res.status(403).json({ status: 403, message: 'Account not activated', email: user.email });
        }

        req.session.userId = user._id.toString();
        
        const userResponse = {
            _id: user._id,
            username: user.username,
            email: user.email,
            active: user.active,
            admin: user.admin,
            role: user.role,
            current_storage: user.current_storage,
            max_storage: user.max_storage,
            badges: user.badges,
            profile: user.profile
        };
        
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ status: 500, message: 'Session save failed' });
            }
            return res.json({ status: 200, message: 'Logged in successfully', user: userResponse });
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 500, message: 'Server error' });
    }
}

export const logoutUser = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ status: 500, message: 'Logout failed' });
        }
        res.clearCookie('connect.sid');
        return res.json({ status: 200, message: 'Logged out successfully' });
    });
}

export const activateUser = async (req, res) => {
    try {

        const activationToken = req.params.token;
        if (!activationToken) return res.status(400).json({ status: 400, message: 'Missing activation token' });

        const activationRecord = await Activation.findOne({ activation_token_hash: hashToken(activationToken) });
        if (!activationRecord) {
            return res.status(400).json({ status: 400, message: 'Invalid activation token or user already activated' });
        }

        const user = await User.findById(activationRecord.user_id);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        user.active = true;
        await user.save();
        await Activation.deleteOne({ _id: activationRecord._id });

        return res.json({ status: 200, message: 'Account activated' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 500, message: 'Server error' });
    }
};

export const resendActivation = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ status: 400, message: 'Missing email' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ status: 200, message: 'If an account exists, a new activation link has been sent.' });
        }

        if (user.active) {
            return res.json({ status: 200, message: 'Account already activated.' });
        }

        await Activation.deleteMany({ user_id: user._id });

        const rawActivationToken = crypto.randomBytes(16).toString('hex');
        const newActivation = new Activation({
            user_id: user._id,
            activation_token_hash: hashToken(rawActivationToken)
        });
        await newActivation.save();

        await sendTokenEmail(user.email, rawActivationToken);
        return res.json({ status: 200, message: 'If an account exists, a new activation link has been sent.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 500, message: 'Server error' });
    }
};

export const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }
        return res.json({ status: 200, user, session: { userId: req.session.userId } });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 500, message: 'Server error' });
    }
};

export const deleteUser = async (req, res) => {
    try {
        await File.deleteMany({ owner: req.session.userId });
        await User.findByIdAndDelete(req.session.userId);
        
        req.session.destroy(err => {
            if (err) {
                return res.status(500).json({ status: 500, message: 'Account deleted but logout failed' });
            }
            res.clearCookie('connect.sid');
            return res.json({ status: 200, message: 'Account deleted successfully' });
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 500, message: 'Server error' });
    }
}

export const getPublicProfile = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findOne({ _id: userId, active: true })
            .select('username badges profile createdAt');

        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const publicFilesCount = await File.countDocuments({
            owner: user._id,
            visibility: 'public'
        });

        const publicFiles = await File.find({
            owner: user._id,
            visibility: 'public'
        }).select('_id');

        const fileIds = publicFiles.map(file => file._id);

        const upvotes = await Vote.countDocuments({
            file_id: { $in: fileIds },
            value: 1
        });

        const downvotes = await Vote.countDocuments({
            file_id: { $in: fileIds },
            value: -1
        });

        const accountStanding = upvotes - downvotes;

        const profileData = {
            username: user.username,
            avatar_url: user.profile.avatar_url || '',
            bio: user.profile.bio || '',
            badges: user.badges || [],
            createdAt: user.createdAt,
            publicFilesCount,
            accountStanding
        };

        return res.status(200).json({ status: 200, data: profileData });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 500, message: 'Server error' });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const userId = req.session.userId;
        const avatarUrl = String(req.body?.avatar_url ?? '').trim();
        const bio = String(req.body?.bio ?? '').trim();

        if (avatarUrl.length > 2048) {
            return res.status(400).json({ status: 400, message: 'Avatar URL must be 2048 characters or less' });
        }

        if (bio.length > 500) {
            return res.status(400).json({ status: 400, message: 'Bio must be 500 characters or less' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        if (!user.profile) {
            user.profile = {};
        }

        user.profile.avatar_url = avatarUrl;
        user.profile.bio = bio;

        await user.save();

        return res.status(200).json({
            status: 200,
            message: 'Profile updated successfully',
            profile: {
                avatar_url: user.profile.avatar_url || '',
                bio: user.profile.bio || '',
            },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 500, message: 'Server error' });
    }
};

export const recalculateStorageUsage = async (req, res) => {
    const userId = req.session.userId;

    try {
        const totalStorage = await File.aggregate([
            { $match: { owner: userId } },
            { $group: { _id: null, totalSize: { $sum: "$file_size" } } }
        ]);
        const newStorageUsage = totalStorage.length > 0 ? totalStorage[0].totalSize : 0;

        await User.findByIdAndUpdate(userId, { current_storage: newStorageUsage });
        return res.status(200).json({ status: 200, message: 'Storage usage recalculated', current_storage: newStorageUsage });
    } catch (err) {
        console.error('Error recalculating storage usage for user', userId, err);
        return res.status(500).json({ status: 500, message: 'Server error' });
    }
};

export const sendResetEmail = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ status: 400, message: 'Missing email' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ status: 200, message: 'If an account exists, a password reset link has been sent.' });
        }

        await Pwdreset.deleteMany({ user_id: user._id });

        const rawResetToken = crypto.randomBytes(16).toString('hex');
        const newPwdreset = new Pwdreset({
            user_id: user._id,
            reset_token_hash: hashToken(rawResetToken)
        });
        await newPwdreset.save();
        await sendPasswordResetEmail(user.email, rawResetToken);
        return res.json({ status: 200, message: 'If an account exists, a password reset link has been sent.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 500, message: 'Server error' });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const resetToken = req.params.token || req.body.token;

        const { newPassword } = req.body;
        if (!resetToken || !newPassword) {
            return res.status(400).json({ status: 400, message: 'Missing token or new password' });
        }

        const pwdresetRecord = await Pwdreset.findOne({ reset_token_hash: hashToken(resetToken) });
        if (!pwdresetRecord) {
            return res.status(400).json({ status: 400, message: 'Invalid or expired reset token' });
        }

        const user = await User.findById(pwdresetRecord.user_id);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const passwordValidation = verifyPasswordStrength(newPassword);
        if (!passwordValidation.valid) {
            return res.status(400).json({ status: 400, message: passwordValidation.message });
        }

        const salt = await Bcrypt.genSalt(10);
        const hashedPassword = await Bcrypt.hash(newPassword, salt);
        user.passwordHash = hashedPassword;
        
        await user.save();
        await invalidateUserSessions(user._id);
        await Pwdreset.deleteOne({ _id: pwdresetRecord._id });

        return res.json({ status: 200, message: 'Password reset successful' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 500, message: 'Server error' });
    }
};

export const validateResetToken = async (req, res) => {
    try {
        const resetToken = req.params.token || req.body.token;

        if (!resetToken) {
            return res.status(400).json({ status: 400, message: 'Missing token' });
        }

        const pwdresetRecord = await Pwdreset.findOne({ reset_token_hash: hashToken(resetToken) });
        if (!pwdresetRecord) {
            return res.status(400).json({ status: 400, message: 'Invalid or expired reset token' });
        }

        return res.json({ status: 200, message: 'Reset token is valid' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 500, message: 'Server error' });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ status: 400, message: 'Missing current or new password' });
        }

        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const isCurrentPasswordValid = await Bcrypt.compare(currentPassword, user.passwordHash);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ status: 400, message: 'Current password is incorrect' });
        }

        const passwordValidation = verifyPasswordStrength(newPassword);
        if (!passwordValidation.valid) {
            return res.status(400).json({ status: 400, message: passwordValidation.message });
        }

        const isSamePassword = await Bcrypt.compare(newPassword, user.passwordHash);
        if (isSamePassword) {
            return res.status(400).json({ status: 400, message: 'New password must be different from current password' });
        }

        const salt = await Bcrypt.genSalt(10);
        const hashedPassword = await Bcrypt.hash(newPassword, salt);
        user.passwordHash = hashedPassword;

        await user.save();
        await invalidateUserSessions(user._id, req.sessionID);
        await Pwdreset.deleteMany({ user_id: user._id });

        return res.json({ status: 200, message: 'Password changed successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 500, message: 'Server error' });
    }
};