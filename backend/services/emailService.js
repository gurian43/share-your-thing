import nodemailer from 'nodemailer';

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

export const sendNotificationEmail = async (user_email, code) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user_email,
        subject: `Your Verification Code: ${code}`,
        html: `
            <h1>Your Verification Code</h1>
            <p>Your verification code is: <strong>${code}</strong></p>
            <p>Please use this code to complete your verification process.</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Notification email sent successfully');
    } catch (error) {
        console.error('Failed to send notification email:', error);
    }
};