import User from '../models/user.model.js';
import Activation from '../models/activation.model.js';
import Bcrypt from 'bcrypt';
import crypto from 'crypto';
import { verifyCaptcha } from '../services/turnstile.js';
import { sendNotificationEmail } from '../services/emailService.js';

export const registerUser = async (req, res) => {
    try {
        if(!req.body.password || !req.body.email || !req.body.username) {
            return res.status(400).json({ status: 400, message: 'Missing required fields' });
        }

        if(process.env.mode !== "development") {
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

        //in case people are stupid
        if(existingUser) {
            return res.status(400).json({ status: 400, message: 'Email or username already in use' });
        }

        if(req.body.password.length < 8 || req.body.password.length > 64) {
            return res.status(400).json({ status: 400, message: 'Password must be between 8 and 64 characters' });
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

        if(/\d/.test(req.body.password) === false) {
            return res.status(400).json({ status: 400, message: 'Password must contain at least one number' });
        }

        const salt = await Bcrypt.genSalt(10);
        const hashedPassword = await Bcrypt.hash(req.body.password, salt);
        const newUser = new User({
            username: req.body.username,
            email: req.body.email,
            passwordHash: hashedPassword,
            active: false,
        });
    
        await newUser.save();

        const newActivation = new Activation({
            user_id: newUser._id,
            activation_token: crypto.randomBytes(16).toString('hex')
        });
        await newActivation.save();

        await sendNotificationEmail(newUser.email, newActivation.activation_token);
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

        if(process.env.MODE !== "development") {
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

        if (!user.active) {
            return res.status(403).json({ status: 403, message: 'Account not activated' });
        }

        const isMatch = await Bcrypt.compare(password, user.passwordHash);

        if (!isMatch) {
            return res.status(400).json({ status: 400, message: 'Invalid credentials' });
        }

        req.session.userId = user._id;
        
        const userResponse = {
            _id: user._id,
            username: user.username,
            email: user.email,
            active: user.active
        };
        
        return res.json({ status: 200, message: 'Logged in successfully', user: userResponse });
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

        const activationRecord = await Activation.findOne({ activation_token: activationToken });
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