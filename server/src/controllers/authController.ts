import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../db/prisma';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../utils/emailService';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';

// ... (register and login functions remain unchanged - I will match the original code for context in Apply)

export const register = async (req: Request, res: Response) => {
    // ... code matching original register function ...
    console.log('Register request received:', req.body.email);
    const { password, name, role, department, phone } = req.body;
    const email = req.body.email?.toLowerCase().trim();

    try {
        if (role !== 'student') {
            return res.status(403).json({ message: 'Only students can self-register' });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role,
                department,
                phone,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
                isFirstLogin: true
            }
        });

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        // Optionally send welcome email for self-registration too? 
        // Request said "created by user of tech and student", implying Admin creation. 
        // I will stick to admin creation sending emails for now unless requested.

        res.status(201).json({ user, token });
    } catch (error: any) {
        console.error('Registration failed:', error);
        res.status(500).json({ message: 'Registration failed', error: error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    // ... code matching original login function ...
    const { password } = req.body;
    const email = req.body.email?.toLowerCase().trim();
    console.log(`🔍 [LOGIN DEBUG] Attempt for: "${email}"`);

    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: { technician: true }
        });

        if (!user) {
            console.log(`❌ [LOGIN DEBUG] User NOT FOUND: "${email}"`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        console.log(`✅ [LOGIN DEBUG] User found: "${user.email}". comparing passwords...`);
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            console.log(`❌ [LOGIN DEBUG] Password MISMATCH for: "${email}"`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        console.log(`🚀 [LOGIN DEBUG] Login SUCCESS for: "${email}"`);
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        console.log('Login successful. Role:', user.role);

        res.json({
            user,
            token,
            requiresPasswordChange: user.isFirstLogin
        });
    } catch (error: any) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed', error: error.message });
    }
};

export const updateAvailability = async (req: Request, res: Response) => {
    // ... original code ...
    const userId = (req as any).user?.id;
    const { isAvailable } = req.body;

    try {
        const technician = await prisma.technician.update({
            where: { userId },
            data: { isAvailable }
        });

        if (isAvailable) {
            // Trigger retry for waiting assignments
            const { retryWaitingAssignments } = require('../services/autoAssignmentService');
            // Assuming we don't await this to keep response fast, or we await it. 
            // It's better to await to catch errors, but logging inside function handles it.
            // Let's await it.
            await retryWaitingAssignments(userId, 'technician');
        }

        res.json({ message: 'Availability updated', isAvailable: technician.isAvailable });
    } catch (error: any) {
        console.error('Update availability failed:', error);
        res.status(500).json({ message: 'Failed to update availability', error: error.message });
    }
};

export const changePassword = async (req: Request, res: Response) => {
    // ... original code ...
    const { newPassword } = req.body;
    const userId = (req as any).user?.id;

    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                isFirstLogin: false
            }
        });

        await prisma.auditLog.create({
            data: {
                userId,
                action: 'PASSWORD_CHANGED',
                details: 'User changed password successfully'
            }
        });

        res.json({ message: 'Password changed successfully', user });
    } catch (error: any) {
        console.error('Change password failed:', error);
        res.status(500).json({ message: 'Password change failed', error: error.message });
    }
};

export const createTechnician = async (req: Request, res: Response) => {
    const { email, name, phone, skillType, assignedArea, password, accessScope } = req.body;
    const adminId = (req as any).user?.id;

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const tempPassword = password || crypto.randomBytes(4).toString('hex');
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: 'technician',
                phone,
                department: 'Maintenance',
                isFirstLogin: true,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
                accessScope: accessScope || 'college'
            }
        });

        await prisma.technician.create({
            data: {
                userId: newUser.id,
                skillType,
                assignedArea,
                temporaryPassword: tempPassword,
                isAvailable: true
            }
        });

        // AUDIT LOG
        if (adminId) {
            await prisma.auditLog.create({
                data: {
                    userId: adminId,
                    action: 'TECHNICIAN_REGISTERED',
                    details: `Registered technician: ${name} (${email}) - Scope: ${accessScope || 'college'}`
                }
            });
        }

        // SEND EMAIL
        await sendWelcomeEmail(email, name, tempPassword, 'Technician');

        res.status(201).json({
            message: 'Technician registered successfully and credentials sent to email',
            technician: { id: newUser.id, email: newUser.email, name: newUser.name }
        });

    } catch (error: any) {
        console.error('Create technician failed:', error);
        res.status(500).json({ message: 'Technician registration failed', error: error.message });
    }
};


export const createCleaner = async (req: Request, res: Response) => {
    const { email, name, phone, assignedArea, password, accessScope } = req.body;
    const adminId = (req as any).user?.id;

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const tempPassword = password || crypto.randomBytes(4).toString('hex');
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: 'cleaner',
                phone,
                department: 'Housekeeping',
                isFirstLogin: true,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
                accessScope: accessScope || 'college'
            }
        });

        await prisma.cleaner.create({
            data: {
                userId: newUser.id,
                assignedArea,
                isAvailable: true
            }
        });

        // AUDIT LOG
        if (adminId) {
            await prisma.auditLog.create({
                data: {
                    userId: adminId,
                    action: 'CLEANER_REGISTERED',
                    details: `Registered cleaner: ${name} (${email})`
                }
            });
        }

        // SEND EMAIL
        await sendWelcomeEmail(email, name, tempPassword, 'Cleaner');

        res.status(201).json({
            message: 'Cleaner registered successfully and credentials sent to email',
            cleaner: { id: newUser.id, email: newUser.email, name: newUser.name }
        });

    } catch (error: any) {
        console.error('Create cleaner failed:', error);
        res.status(500).json({ message: 'Cleaner registration failed', error: error.message });
    }
};

export const createUser = async (req: Request, res: Response) => {
    const { email, name, role, department, phone, password, accessScope } = req.body;
    // If password provided, use it. If not, generate one.
    // Assuming if password is provided, we should send that. 
    // If not, we generate random.

    // For manual creation, often admins might not provide password.
    let finalPassword = password;
    if (!finalPassword) {
        finalPassword = crypto.randomBytes(4).toString('hex');
    }

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(finalPassword, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role,
                department,
                phone,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
                isFirstLogin: true,
                accessScope: accessScope || 'college'
            }
        });

        // SEND EMAIL
        await sendWelcomeEmail(email, name, finalPassword, role);

        res.status(201).json({ user, message: 'User created and credentials emailed' });
    } catch (error: any) {
        console.error('Create user failed:', error);
        res.status(500).json({ message: 'User creation failed', error: error.message });
    }
};

export const forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetPasswordToken: resetToken,
                resetPasswordExpires
            }
        });

        await sendPasswordResetEmail(email, resetToken);

        res.json({ message: 'Password reset link sent to email' });
    } catch (error: any) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Failed to process request', error: error.message });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;

    try {
        const user = await prisma.user.findFirst({
            where: {
                resetPasswordToken: token,
                resetPasswordExpires: { gt: new Date() }
            }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpires: null,
                isFirstLogin: false
            }
        });

        res.json({ message: 'Password has been reset successfully' });
    } catch (error: any) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Failed to reset password', error: error.message });
    }
};
