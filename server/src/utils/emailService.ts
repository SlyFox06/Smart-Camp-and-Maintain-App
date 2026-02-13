
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const sendEmail = async (to: string, subject: string, html: string) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('⚠️ Email user/pass not configured. Skipping email send.');
            console.log(`To: ${to}, Subject: ${subject}`); // Log for dev
            return;
        }

        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to,
            subject,
            html
        });

        console.log(`📧 Email sent: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error('❌ Error sending email:', error);
        throw error;
    }
};

export const sendWelcomeEmail = async (email: string, name: string, password: string, role: string) => {
    const loginLink = process.env.FRONTEND_URL || 'http://localhost:5173/login';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to Smart Campus Maintenance!</h2>
            <p>Hello ${name},</p>
            <p>Your account has been created as a <strong>${role}</strong>.</p>
            <p>Below are your login credentials:</p>
            <ul>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Temporary Password:</strong> ${password}</li>
            </ul>
            <p>Please login and change your password immediately.</p>
            <a href="${loginLink}" style="display: inline-block; padding: 10px 20px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 5px;">Login Now</a>
        </div>
    `;
    await sendEmail(email, 'Welcome to Smart Campus - Your Credentials', html);
};

export const sendPasswordResetEmail = async (email: string, resetToken: string) => {
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>We received a request to reset your password.</p>
            <p>Click the link below to reset it (valid for 1 hour):</p>
            <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
            <p>If you didn't request this change, you can safely ignore this email.</p>
        </div>
    `;
    await sendEmail(email, 'Reset Your Password', html);
};
