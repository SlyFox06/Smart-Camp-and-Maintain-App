import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase, handleSupabaseError } from '../db/supabase';
import { sendEmail, sendSMS, templates } from '../services/communication';
import * as crypto from 'crypto';
import { toCamelCase } from '../utils/format';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';

export const register = async (req: Request, res: Response) => {
    const { email, password, name, role, department, phone } = req.body;

    try {
        if (role !== 'student') {
            return res.status(403).json({ message: 'Only students can self-register' });
        }

        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const { data: user, error } = await supabase
            .from('users')
            .insert({
                email,
                password: hashedPassword,
                name,
                role,
                department,
                phone,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
                is_first_login: true
            })
            .select()
            .single();

        if (error) throw error;

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ user: toCamelCase(user), token });
    } catch (error: any) {
        res.status(500).json({ message: 'Registration failed', error: error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        // Map snake_case to camelCase for frontend compatibility
        const camelUser = toCamelCase(user);

        res.json({
            user: camelUser,
            token,
            requiresPasswordChange: camelUser.isFirstLogin // Mapped from is_first_login
        });
    } catch (error: any) {
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

        const { data: user, error } = await supabase
            .from('users')
            .update({
                password: hashedPassword,
                is_first_login: false
            })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        await supabase.from('audit_logs').insert({
            user_id: userId,
            action: 'PASSWORD_CHANGED',
            details: 'User changed password successfully'
        });

        res.json({ message: 'Password changed successfully', user: toCamelCase(user) });
    } catch (error: any) {
        res.status(500).json({ message: 'Password change failed', error: error.message });
    }
};

export const createTechnician = async (req: Request, res: Response) => {
    const { email, name, phone, skillType, assignedArea } = req.body;
    const adminId = (req as any).user?.id;

    try {
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const tempPassword = crypto.randomBytes(4).toString('hex');
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const { data: newUser, error: userError } = await supabase
            .from('users')
            .insert({
                email,
                password: hashedPassword,
                name,
                role: 'technician',
                phone,
                department: 'Maintenance',
                is_first_login: true,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
            })
            .select()
            .single();

        if (userError) throw userError;

        const { error: techError } = await supabase
            .from('technicians')
            .insert({
                user_id: newUser.id,
                skill_type: skillType,
                assigned_area: assignedArea,
                temporary_password: tempPassword,
                is_available: true
            });

        if (techError) {
            await supabase.from('users').delete().eq('id', newUser.id);
            throw techError;
        }

        if (adminId) {
            await supabase.from('audit_logs').insert({
                user_id: adminId,
                action: 'TECHNICIAN_REGISTERED',
                details: `Registered technician: ${name} (${email})`
            });
        }

        const loginUrl = 'http://localhost:5173/login';

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
            technician: { id: newUser.id, email: newUser.email, name: newUser.name }
        });

    } catch (error: any) {
        res.status(500).json({ message: 'Technician registration failed', error: error.message });
    }
};

export const createUser = async (req: Request, res: Response) => {
    const { email, password, name, role, department, phone } = req.body;

    try {
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const { data: user, error } = await supabase
            .from('users')
            .insert({
                email,
                password: hashedPassword,
                name,
                role,
                department,
                phone,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
                is_first_login: true
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ user: toCamelCase(user) });
    } catch (error: any) {
        res.status(500).json({ message: 'User creation failed', error: error.message });
    }
};
