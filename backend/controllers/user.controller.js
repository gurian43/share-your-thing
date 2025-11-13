import User from '../models/user.model.js';
import Activation from '../models/activation.model.js';
import Bcrypt from 'bcrypt';
import { verifyCaptcha } from '../services/reCaptcha.js';
import { sendNotificationEmail } from '../services/emailService.js';

export const registerUser = async (req, res) => {

    if(!req.body.password || !req.body.email || !req.body.username) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const captchaResult = await verifyCaptcha(req.body.captchaToken, req.headers['x-forwarded-for'] || req.socket.remoteAddress);

    if(!captchaResult.success) {
        return res.status(captchaResult.code).json({ message: captchaResult.message });
    }

    const existingUser = await User.findOne({ $or: [ { email: req.body.email }, { username: req.body.username } ] });

    if(existingUser) {
        return res.status(400).json({ message: 'Email or username already in use' });
    }

    if(req.body.password !== req.body.confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    if(req.body.password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    if(!req.body.termsAccepted) {
        return res.status(400).json({ message: 'You must accept the terms and conditions' });
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
            activation_code: Math.floor(100000 + Math.random() * 900000).toString()
        });
        await newActivation.save();

        await sendNotificationEmail(newUser.email, newActivation.activation_code);
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
        const activationCode = req.body.activationCode;
        if (!activationCode) return res.status(400).json({ message: 'Missing activation code' });

        const user = await User.findOne({ _id: req.user_id, active: false });

        if (!user) return res.status(404).json({ message: 'User not found or already activated' });
        if (await Activation.findOne({ user_id: user._id, activation_code: activationCode }) == null) {
            return res.status(400).json({ message: 'Invalid activation code' });
        }

        user.active = true;
        await user.save();

        return res.json({ message: 'Account activated' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
};