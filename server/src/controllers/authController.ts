import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';

export const register = async (req: Request, res: Response) => {
    console.log('Register request received:', req.body.email);
    const { email, password, name, role, department, phone } = req.body;

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

        res.status(201).json({ user, token });
    } catch (error: any) {
        console.error('Registration failed:', error);
        res.status(500).json({ message: 'Registration failed', error: error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    console.log('Login attempt for:', req.body.email);
    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            console.log('User not found:', email);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Password mismatch for user:', email);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

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

export const changePassword = async (req: Request, res: Response) => {
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
    const { email, name, phone, skillType, assignedArea } = req.body;
    const adminId = (req as any).user?.id;

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const crypto = await import('crypto');
        const tempPassword = crypto.randomBytes(4).toString('hex');
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

        if (adminId) {
            await prisma.auditLog.create({
                data: {
                    userId: adminId,
                    action: 'TECHNICIAN_REGISTERED',
                    details: `Registered technician: ${name} (${email})`
                }
            });
        }

        res.status(201).json({
            message: 'Technician registered successfully',
            technician: { id: newUser.id, email: newUser.email, name: newUser.name }
        });

    } catch (error: any) {
        console.error('Create technician failed:', error);
        res.status(500).json({ message: 'Technician registration failed', error: error.message });
    }
};

export const createUser = async (req: Request, res: Response) => {
    const { email, password, name, role, department, phone } = req.body;

    try {
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

        res.status(201).json({ user });
    } catch (error: any) {
        console.error('Create user failed:', error);
        res.status(500).json({ message: 'User creation failed', error: error.message });
    }
};
