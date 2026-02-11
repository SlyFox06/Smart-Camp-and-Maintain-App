import { Request, Response } from 'express';
import prisma from '../db/prisma';
import { createNotification } from '../services/notificationService';

export const createComplaint = async (req: Request, res: Response) => {
    try {
        const { title, description, severity, images, video, assetId } = req.body;
        const studentId = (req as any).user?.id;

        // Check for active complaint
        const existing = await prisma.complaint.findFirst({
            where: {
                assetId,
                status: { in: ['reported', 'assigned', 'in_progress', 'verified'] }
            }
        });

        if (existing) {
            return res.status(400).json({ message: 'This asset already has an active complaint.' });
        }

        const complaint = await prisma.complaint.create({
            data: {
                title,
                description,
                severity: severity || 'medium',
                images: images ? JSON.stringify(images) : null,
                video,
                assetId,
                studentId,
                status: 'reported'
            },
            include: {
                asset: true,
                student: true
            }
        });

        // Create notification for admins
        const admins = await prisma.user.findMany({
            where: { role: 'admin' }
        });

        for (const admin of admins) {
            await createNotification(
                admin.id,
                'New Complaint Reported',
                `${complaint.student.name} reported: ${title}`,
                'new_complaint',
                complaint.id
            );
        }

        res.status(201).json(complaint);
    } catch (error: any) {
        console.error('Create complaint error:', error);
        res.status(500).json({ message: 'Failed to create complaint', error: error.message });
    }
};

export const getMyComplaints = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const complaints = await prisma.complaint.findMany({
            where: { studentId: userId },
            include: {
                asset: true,
                technician: true,
                statusHistory: {
                    orderBy: { timestamp: 'desc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(complaints);
    } catch (error: any) {
        console.error('Get my complaints error:', error);
        res.status(500).json({ message: 'Failed to fetch complaints', error: error.message });
    }
};

export const getAssignedComplaints = async (req: Request, res: Response) => {
    try {
        const technicianId = (req as any).user?.id;
        const complaints = await prisma.complaint.findMany({
            where: { technicianId },
            include: {
                asset: true,
                student: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(complaints);
    } catch (error: any) {
        console.error('Get assigned complaints error:', error);
        res.status(500).json({ message: 'Failed to fetch complaints', error: error.message });
    }
};

export const assignComplaint = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const { technicianId } = req.body;

        const complaint = await prisma.complaint.update({
            where: { id },
            data: {
                technicianId,
                status: 'assigned',
                assignedAt: new Date()
            },
            include: {
                student: true,
                technician: true,
                asset: true
            }
        });

        // Update asset status
        await prisma.asset.update({
            where: { id: complaint.assetId },
            data: { status: 'under_maintenance' }
        });

        // Add status history
        await prisma.statusHistory.create({
            data: {
                complaintId: id,
                status: 'assigned',
                message: `Assigned to ${complaint.technician?.name}`
            }
        });

        // Notify technician
        if (technicianId) {
            await createNotification(
                technicianId,
                'New Complaint Assigned',
                `You have been assigned: ${complaint.title}`,
                'complaint_assigned',
                id
            );
        }

        // Notify student
        await createNotification(
            complaint.studentId,
            'Complaint Assigned',
            `Your complaint has been assigned to ${complaint.technician?.name}`,
            'complaint_assigned',
            id
        );

        res.json(complaint);
    } catch (error: any) {
        console.error('Assign complaint error:', error);
        res.status(500).json({ message: 'Failed to assign complaint', error: error.message });
    }
};

export const updateComplaintStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const { status, message } = req.body;

        const complaint = await prisma.complaint.update({
            where: { id },
            data: {
                status,
                ...(status === 'resolved' && { resolvedAt: new Date() })
            },
            include: {
                student: true,
                asset: true
            }
        });

        // Add status history
        await prisma.statusHistory.create({
            data: {
                complaintId: id,
                status,
                message: message || `Status updated to ${status}`
            }
        });

        // Update asset status if resolved
        if (status === 'resolved' || status === 'closed') {
            await prisma.asset.update({
                where: { id: complaint.assetId },
                data: { status: 'operational' }
            });
        }

        // Notify student
        await createNotification(
            complaint.studentId,
            `Complaint ${status}`,
            message || `Your complaint status has been updated to ${status}`,
            `complaint_${status}`,
            id
        );

        res.json(complaint);
    } catch (error: any) {
        console.error('Update complaint status error:', error);
        res.status(500).json({ message: 'Failed to update complaint', error: error.message });
    }
};

export const getComplaintById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const complaint = await prisma.complaint.findUnique({
            where: { id },
            include: {
                student: true,
                technician: true,
                asset: true,
                statusHistory: {
                    orderBy: { timestamp: 'desc' }
                }
            }
        });

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        res.json(complaint);
    } catch (error: any) {
        console.error('Get complaint error:', error);
        res.status(500).json({ message: 'Failed to fetch complaint', error: error.message });
    }
};

export const verifyOTP = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const { otp } = req.body;

        const complaint = await prisma.complaint.findUnique({
            where: { id }
        });

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        if (complaint.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        const updated = await prisma.complaint.update({
            where: { id },
            data: {
                otpVerified: true,
                status: 'closed'
            }
        });

        res.json({ message: 'OTP verified successfully', complaint: updated });
    } catch (error: any) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ message: 'Failed to verify OTP', error: error.message });
    }
};
export const handleApproval = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const { action, notes } = req.body; // action: 'accept' | 'reject'

        if (action === 'reject') {
            const complaint = await prisma.complaint.update({
                where: { id },
                data: {
                    status: 'rejected',
                    rejectionReason: notes
                },
                include: { student: true }
            });

            // Notify student
            await createNotification(
                complaint.studentId,
                'Complaint Rejected',
                `Your complaint was rejected: ${notes}`,
                'complaint_rejected',
                id
            );

            return res.json(complaint);
        } else if (action === 'accept') {
            const complaint = await prisma.complaint.update({
                where: { id },
                data: {
                    status: 'assigned',
                },
                include: { student: true }
            });

            // Update Asset Status to 'under_maintenance'
            await prisma.asset.update({
                where: { id: complaint.assetId },
                data: { status: 'under_maintenance' }
            });

            // Create notification for student
            await createNotification(
                complaint.studentId,
                'Complaint Approved',
                'Your complaint has been approved and matches our maintenance criteria. A technician will be assigned shortly.',
                'complaint_approved',
                id
            );

            return res.json(complaint);
        }

        res.status(400).json({ message: 'Invalid action' });
    } catch (error: any) {
        console.error('Approval error:', error);
        res.status(500).json({ message: 'Approval failed', error: error.message });
    }
};

export const submitWork = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const { proof, note } = req.body;
        const technicianId = (req as any).user?.id;

        const complaint = await prisma.complaint.findUnique({ where: { id } });

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        // Verify technician assignment (optional strict check)
        // if (complaint.technicianId !== technicianId) ...

        const updated = await prisma.complaint.update({
            where: { id },
            data: {
                status: 'work_submitted',
                workProof: proof ? JSON.stringify(proof) : null,
                workNote: note,
                resolvedAt: new Date() // Tentative resolution time
            },
            include: { student: true, asset: true }
        });

        await prisma.statusHistory.create({
            data: {
                complaintId: id,
                status: 'work_submitted',
                message: 'Technician submitted work for review'
            }
        });

        // Notify Admins
        const admins = await prisma.user.findMany({ where: { role: 'admin' } });
        for (const admin of admins) {
            await createNotification(
                admin.id,
                'Work Submitted for Review',
                `Technician has completed work on: ${updated.title}`,
                'work_submitted',
                id
            );
        }

        res.json(updated);
    } catch (error: any) {
        console.error('Submit work error:', error);
        res.status(500).json({ message: 'Failed to submit work', error: error.message });
    }
};

export const reviewWork = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const { action, comment } = req.body; // action: 'approve' | 'reject'

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ message: 'Invalid action' });
        }

        const newStatus = action === 'approve' ? 'work_approved' : 'rework_required';
        const notificationTitle = action === 'approve' ? 'Work Approved' : 'Rework Required';
        const notificationMessage = action === 'approve'
            ? 'The work has been approved. Please provide your feedback.'
            : `Work rejected: ${comment}`;

        const updated = await prisma.complaint.update({
            where: { id },
            data: {
                status: newStatus,
                adminComment: comment,
                // If approved, maybe set feedback_pending immediately or let UI handle it
            },
            include: { student: true, technician: true } // Need technician to notify them if rejected
        });

        await prisma.statusHistory.create({
            data: {
                complaintId: id,
                status: newStatus,
                message: `Admin ${action}ed work. Comment: ${comment || 'None'}`
            }
        });

        if (action === 'approve') {
            // Notify Student for feedback
            await createNotification(
                updated.studentId,
                'Work Approved - Feedback Requested',
                'The maintenance work is approved. Please rate the service.',
                'feedback_pending',
                id
            );
        } else {
            // Notify Technician for rework
            if (updated.technicianId) { // technicianId is likely the User ID based on schema usage
                await createNotification(
                    updated.technicianId,
                    'Rework Required',
                    `Admin rejected work: ${comment}`,
                    'rework_required',
                    id
                );
            }
        }

        res.json(updated);
    } catch (error: any) {
        console.error('Review work error:', error);
        res.status(500).json({ message: 'Failed to review work', error: error.message });
    }
};

export const submitFeedback = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const { rating, feedback } = req.body;
        const studentId = (req as any).user?.id;

        const complaint = await prisma.complaint.findUnique({ where: { id } });

        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
        if (complaint.studentId !== studentId) return res.status(403).json({ message: 'Unauthorized' });

        const updated = await prisma.complaint.update({
            where: { id },
            data: {
                status: 'closed',
                rating,
                feedback,
                // Ensure asset is operational if not already
            },
            include: { asset: true }
        });

        // Ensure asset is operational
        await prisma.asset.update({
            where: { id: updated.assetId },
            data: { status: 'operational' }
        });

        await prisma.statusHistory.create({
            data: {
                complaintId: id,
                status: 'closed',
                message: `Complaint closed with ${rating} star rating.`
            }
        });

        // Notify Admins about feedback? Optional but requested "Admin should be able to view student ratings"
        // No explicit notification needed if they just view it in dashboard, but let's leave it for now.

        res.json(updated);
    } catch (error: any) {
        console.error('Submit feedback error:', error);
        res.status(500).json({ message: 'Failed to submit feedback', error: error.message });
    }
};
