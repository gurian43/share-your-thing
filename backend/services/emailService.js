import nodemailer from 'nodemailer';

const APP_ENV = process.env.NODE_ENV || process.env.MODE || 'development';

let transporter;

export const createTransporter = () => {
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
    console.log('Email transporter created');
}

export const sendTokenEmail = async (user_email, code) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user_email,
        subject: `Please verify your account for Share Your Thing`,
        html: `
            <h1>Your Verification Link</h1>
            <p>${APP_ENV === "development" ? "http://localhost:5173" : "https://" + process.env.HOSTNAME}/register?token=${code}</p>
            <p>Please use this link to complete your verification process.</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Token email sent successfully');
    } catch (error) {
        console.error('Failed to send token email:', error);
    }
};

export const sendResetEmail = async (user_email, code) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user_email,
        subject: `Password Reset for Share Your Thing`,
        html: `
            <h1>Password Reset</h1>
            <p>${APP_ENV === "development" ? "http://localhost:5173" : "https://" + process.env.HOSTNAME}/reset-password/${code}</p>
            <p>Please use this link to reset your password.</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Reset email sent successfully');
    } catch (error) {
        console.error('Failed to send reset email:', error);
    }
};