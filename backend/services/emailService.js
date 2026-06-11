import nodemailer from 'nodemailer';

const APP_ENV = process.env.NODE_ENV || process.env.MODE || 'development';
const APP_URL = APP_ENV === 'development'
    ? 'http://localhost:5173'
    : `https://${process.env.HOSTNAME}`;

let transporter;

export const createTransporter = () => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('Missing email credentials: EMAIL_USER and EMAIL_PASS must be set');
        return;
    }

    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    transporter.verify((error, success) => {
        if (error) {
            console.error('Email transporter verification failed:', error);
        } else {
            console.log('Email transporter is ready');
        }
    });
}

const buildMailOptions = ({ to, subject, text, html }) => ({
    from: `"Share Your Thing" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html
});

export const sendTokenEmail = async (user_email, code) => {
    const verificationUrl = `${APP_URL}/register?token=${code}`;
    const mailOptions = buildMailOptions({
        to: user_email,
        subject: 'Please verify your account for Share Your Thing',
        text: `Please verify your account by visiting this link: ${verificationUrl}`,
        html: `
            <h1>Your Verification Link</h1>
            <p>Please verify your account by clicking the link below:</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            <p>If you did not request this, please ignore this email.</p>
        `
    });

    try {
        await transporter.sendMail(mailOptions);
        console.log('Token email sent successfully');
    } catch (error) {
        console.error('Failed to send token email:', error);
    }
};

export const sendResetEmail = async (user_email, code) => {
    const resetUrl = `${APP_URL}/reset-password/${code}`;
    const mailOptions = buildMailOptions({
        to: user_email,
        subject: 'Password Reset for Share Your Thing',
        text: `Reset your password by visiting this link: ${resetUrl}`,
        html: `
            <h1>Password Reset</h1>
            <p>Reset your password by clicking the link below:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>If you did not request this, please ignore this email.</p>
        `
    });

    try {
        await transporter.sendMail(mailOptions);
        console.log('Reset email sent successfully');
    } catch (error) {
        console.error('Failed to send reset email:', error);
    }
};