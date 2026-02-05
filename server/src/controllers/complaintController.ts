import { Request, Response } from 'express';
import { prisma } from '../db/prisma';

import { createNotification } from '../services/notificationService';

export const createComplaint = async (req: Request, res: Response) => {
    const { assetId, title, description, severity, images, video } = req.body;
    const studentId = (req as any).user.id;

    try {
        // 1. Check for active complaint on this asset
        const existingComplaint = await prisma.complaint.findFirst({
            where: {
                assetId,
                status: { notIn: ['resolved', 'closed'] }
            }
        });

        if (existingComplaint) {
            return res.status(400).json({ message: 'An active complaint already exists for this asset.' });
        }

        // 2. Fetch asset to get location/department for assignment
        const asset = await prisma.asset.findUnique({ where: { id: assetId } });
        if (!asset) return res.status(404).json({ message: 'Asset not found' });

        // 3. Find technician based on department/availability (Auto-assignment)
        // Basic logic: find available technician in the same department/building
        const technician = await prisma.user.findFirst({
            where: {
                role: 'technician',
                department: asset.department,
                // In a real app we'd check availability or task load
            },
            orderBy: { assignments: { _count: 'asc' } } // Load balancing
        });

        // 4. Create complaint
        const complaint = await prisma.complaint.create({
            data: {
                assetId,
                studentId,
                technicianId: technician?.id || null,
                title,
                description,
                severity: severity || 'medium',
                status: technician ? 'assigned' : 'reported',
                images: JSON.stringify(images || []),
                video,
            },
        });

        // 5. Create audit log
        await prisma.auditLog.create({
            data: {
                userId: studentId,
                action: 'COMPLAINT_CREATED',
                details: `Complaint ${complaint.id} created for asset ${assetId}. Auto-assigned to: ${technician?.name || 'None'}`
            }
        });

        // 6. Create initial status update
        await prisma.statusUpdate.create({
            data: {
                complaintId: complaint.id,
                status: complaint.status,
                updatedBy: (req as any).user.name || 'System',
                notes: 'Initial report submitted'
            }
        });

        // 7. Send Notifications
        // Notify Student
        await createNotification(
            studentId,
            'complaint_created',
            'Complaint Registered',
            `Your complaint "${title}" has been successfully registered.`,
            complaint.id
        );

        // Notify Technician if assigned
        if (technician) {
            await createNotification(
                technician.id,
                'complaint_assigned',
                'New Assignment',
                `You have been assigned a new complaint: "${title}" at ${asset?.building} ${asset?.room}`,
                complaint.id
            );
        }

        res.status(201).json(complaint);
    } catch (error) {
        res.status(500).json({ message: 'Complaint registration failed', error });
    }
};

export const updateComplaintStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, notes, repairEvidence } = req.body;
    const userId = (req as any).user.id;

    try {
        const complaint = await prisma.complaint.findUnique({ where: { id: id as string } });
        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

        // Status specific logic
        let otp = complaint.otp;
        if (status === 'resolved' && !complaint.otp) {
            otp = Math.floor(1000 + Math.random() * 9000).toString(); // Simple 4-digit OTP
        }

        const updatedComplaint = await prisma.complaint.update({
            where: { id: id as string },
            data: {
                status,
                repairEvidence: repairEvidence || complaint.repairEvidence,
                resolvedAt: status === 'resolved' ? new Date() : complaint.resolvedAt,
                otp
            },
        });

        // Create status history
        await prisma.statusUpdate.create({
            data: {
                complaintId: id as string,
                status,
                updatedBy: (req as any).user.name || 'Technician',
                notes
            }
        });

        // Notify user of status update
        await createNotification(
            complaint.studentId,
            'status_updated',
            'Complaint Status Updated',
            `Status changed to ${status}. ${notes ? `Notes: ${notes}` : ''}`,
            complaint.id
        );

        // Notify user if resolved
        if (status === 'resolved') {
            await createNotification(
                complaint.studentId,
                'complaint_resolved',
                'Issue Resolved',
                `Your complaint has been resolved. Use OTP ${otp} to verify and close.`,
                complaint.id
            );
        }

        res.json(updatedComplaint);
    } catch (error) {
        res.status(500).json({ message: 'Status update failed', error });
    }
};

export const verifyOTP = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { otp } = req.body;

    try {
        const complaint = await prisma.complaint.findUnique({ where: { id: id as string } });
        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

        if (complaint.otp === otp) {
            const updated = await prisma.complaint.update({
                where: { id: id as string },
                data: {
                    status: 'closed',
                    otpVerified: true,
                    closedAt: new Date()
                }
            });

            // Notify Student of closure
            await createNotification(
                complaint.studentId,
                'complaint_closed',
                'Complaint Closed',
                `Your complaint has been successfully verified and closed.`,
                complaint.id
            );

            res.json({ message: 'Complaint verified and closed', complaint: updated });
        } else {
            res.status(400).json({ message: 'Invalid OTP' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Verification failed', error });
    }
};

// ... more methods like getComplaintsByRole, getAnalytics
export const getAnalytics = async (req: Request, res: Response) => {
    try {
        const total = await prisma.complaint.count();
        const resolved = await prisma.complaint.count({ where: { status: 'resolved' } });
        const active = await prisma.complaint.count({ where: { status: { in: ['reported', 'assigned', 'in_progress'] } } });

        const statusCounts = await prisma.complaint.groupBy({
            by: ['status'],
            _count: true
        });

        const severityCounts = await prisma.complaint.groupBy({
            by: ['severity'],
            _count: true
        });

        const complaintsByStatus: any = {};
        statusCounts.forEach(item => {
            complaintsByStatus[item.status] = item._count;
        });

        const complaintsBySeverity: any = {};
        severityCounts.forEach(item => {
            complaintsBySeverity[item.severity] = item._count;
        });

        // Calculate average resolution time
        const resolvedComplaintsList = await prisma.complaint.findMany({
            where: { status: 'resolved', NOT: { resolvedAt: null } },
            select: { createdAt: true, resolvedAt: true }
        });

        let averageResolutionTime = 0;
        if (resolvedComplaintsList.length > 0) {
            const totalMs = resolvedComplaintsList.reduce((acc, c) => {
                return acc + (new Date(c.resolvedAt!).getTime() - new Date(c.createdAt!).getTime());
            }, 0);
            averageResolutionTime = Math.floor(totalMs / resolvedComplaintsList.length / 60000); // in minutes
        }

        res.json({
            totalComplaints: total,
            activeComplaints: active,
            resolvedComplaints: resolved,
            averageResolutionTime,
            complaintsByStatus,
            complaintsBySeverity
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch analytics', error });
    }
};

export const getStudentComplaints = async (req: Request, res: Response) => {
    const studentId = (req as any).user.id;
    try {
        const complaints = await prisma.complaint.findMany({
            where: { studentId },
            include: { asset: true, technician: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch complaints', error });
    }
};

export const getTechnicianComplaints = async (req: Request, res: Response) => {
    const technicianId = (req as any).user.id;
    try {
        const complaints = await prisma.complaint.findMany({
            where: { technicianId },
            include: { asset: true, student: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch complaints', error });
    }
};

export const getAllComplaints = async (req: Request, res: Response) => {
    try {
        const complaints = await prisma.complaint.findMany({
            include: { asset: true, student: true, technician: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch complaints', error });
    }
};
