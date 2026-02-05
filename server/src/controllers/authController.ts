import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma';
import { sendEmail, sendSMS, templates } from '../services/communication';
import * as crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';

export const register = async (req: Request, res: Response) => {
    const { email, password, name, role, department, phone } = req.body;

    try {
        if (role !== 'student') {
            return res.status(403).json({ message: 'Only students can self-register' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
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
            },
        });

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ user, token });
    } catch (error) {
        res.status(500).json({ message: 'Registration failed', error });
    }
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            user,
            token,
            requiresPasswordChange: user.requiresPasswordChange
        });
    } catch (error) {
        res.status(500).json({ message: 'Login failed', error });
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
                requiresPasswordChange: false // Mark as changed
            }
        });

        // Log action
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'PASSWORD_CHANGED',
                details: 'User changed password successfully'
            }
        });

        res.json({ message: 'Password changed successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Password change failed', error });
    }
};

// Admin only: create technician
export const createTechnician = async (req: Request, res: Response) => {
    const { email, name, phone, skillType, assignedArea } = req.body;
    const adminId = (req as any).user?.id;

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Generate temporary password
        const tempPassword = crypto.randomBytes(4).toString('hex'); // 8 chars
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const user = await prisma.$transaction(async (tx) => {
            // 1. Create user
            const newUser = await tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                    role: 'technician',
                    phone,
                    skillType,
                    assignedArea,
                    requiresPasswordChange: true, // Force change on first login
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
                },
            });

            // 2. Audit Log
            if (adminId) {
                await tx.auditLog.create({
                    data: {
                        userId: adminId,
                        action: 'TECHNICIAN_REGISTERED',
                        details: `Registered technician: ${name} (${email})`
                    }
                });
            }

            return newUser;
        });

        // 3. Send Credentials via Email & SMS
        const loginUrl = 'http://localhost:5173/login';

        // Non-blocking notifications (don't fail request if email fails)
        Promise.allSettled([
            sendEmail(
                email,
                'Technician Account Created - Action Required',
                templates.technicianWelcomeEmail(name, loginUrl, email, tempPassword)
            ),
            phone ? sendSMS(phone, templates.technicianWelcomeSMS(loginUrl, tempPassword)) : Promise.resolve()
        ]).then(results => {
            console.log('Credential delivery results:', results);
        });

        res.status(201).json({
            message: 'Technician registered successfully',
            technician: { id: user.id, email: user.email, name: user.name }
        });

    } catch (error) {
        res.status(500).json({ message: 'Technician registration failed', error });
    }
};

// Generic create user (kept for backward compatibility if needed)
export const createUser = async (req: Request, res: Response) => {
    const { email, password, name, role, department, phone } = req.body;

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
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
            },
        });

        res.status(201).json({ user });
    } catch (error) {
        res.status(500).json({ message: 'User creation failed', error });
    }
};
