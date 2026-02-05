import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma';
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';

export const register = async (req: Request, res: Response) => {
    const { email, password, name, role, department, phone } = req.body;

    try {
        // Only student role can self-register
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

        res.json({ user, token });
    } catch (error) {
        res.status(500).json({ message: 'Login failed', error });
    }
};

export const createUser = async (req: Request, res: Response) => {
    const { email, password, name, role, department, phone } = req.body;

    try {
        // Any role can be created by admin (used for technicians and secondary admins)
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
