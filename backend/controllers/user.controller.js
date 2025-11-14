import User from '../models/user.model.js';
import Activation from '../models/activation.model.js';
import Bcrypt from 'bcrypt';
import crypto from 'crypto';
import { verifyCaptcha } from '../services/reCaptcha.js';
import { sendNotificationEmail } from '../services/emailService.js';

export const registerUser = async (req, res) => {

    if(!req.body.password || !req.body.email || !req.body.username) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    if(process.env.mode !== "development") {
        const captchaResult = await verifyCaptcha(req.body.captchaToken, req.headers['x-forwarded-for'] || req.socket.remoteAddress);
    
        if(!captchaResult.success) {
            return res.status(captchaResult.code).json({ message: captchaResult.message });
        }
    }

    const existingUser = await User.findOne({ $or: [ { email: req.body.email }, { username: req.body.username } ] });

    if(existingUser) {
        return res.status(400).json({ message: 'Email or username already in use' });
    }

    const salt = await Bcrypt.genSalt(10);
    const hashedPassword = await Bcrypt.hash(req.body.password, salt);


    try {
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
        return res.status(201).json({ message: 'User registered successfully. Please check your email to activate your account.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
}

export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Missing fields' });
    }

    const user = await User.findOne({ email: email });

    if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.active) {
        return res.status(403).json({ message: 'Account not activated' });
    }

    const isMatch = await Bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    req.session.userId = user._id;
    return res.json({ message: 'Logged in successfully' });
}

export const logoutUser = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed' });
        }
        res.clearCookie('connect.sid');
        return res.json({ message: 'Logged out successfully' });
    });
}

export const activateUser = async (req, res) => {
    try {

        const activationToken = req.params.token;
        if (!activationToken) return res.status(400).json({ message: 'Missing activation token' });

        const activationRecord = await Activation.findOne({ activation_token: activationToken });
        if (!activationRecord) {
            return res.status(400).json({ message: 'Invalid activation token or user already activated' });
        }

        const user = await User.findById(activationRecord.user_id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.active = true;
        await user.save();
        await Activation.deleteOne({ _id: activationRecord._id });

        return res.json({ message: 'Account activated' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
};

export const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.json(user);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
};

export const deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.session.userId);
        req.session.destroy(err => {
            if (err) {
                return res.status(500).json({ message: 'Account deleted but logout failed' });
            }
            res.clearCookie('connect.sid');
            return res.json({ message: 'Account deleted successfully' });
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
}