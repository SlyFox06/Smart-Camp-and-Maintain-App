import { Request, Response } from 'express';
import { supabase } from '../db/supabase';
import queries from '../db/queries';
import { toCamelCase } from '../utils/format';
import * as notificationService from '../services/notificationService';
import { calculatePriority } from '../services/priorityService';

const notify = async (userId: string, type: string, title: string, message: string, complaintId: string) => {
    await notificationService.createNotification(userId, type, title, message, complaintId);
};

export const createComplaint = async (req: Request, res: Response) => {
    const { assetId, title, description, images, video } = req.body;
    const studentId = (req as any).user.id;
    const complaintTitle = String(title);

    try {
        const existingComplaint = await queries.hasActiveComplaint(assetId);

        if (existingComplaint) {
            return res.status(400).json({ message: 'An active complaint already exists for this asset.' });
        }

        const { data: asset } = await supabase.from('assets').select('*').eq('id', assetId).single();
        if (!asset) return res.status(404).json({ message: 'Asset not found' });

        const calculatedSeverity = calculatePriority(title, description, asset.type);
        const finalSeverity = calculatedSeverity;

        const { data: complaint, error } = await supabase
            .from('complaints')
            .insert({
                asset_id: assetId,
                student_id: studentId,
                title,
                description,
                severity: finalSeverity,
                status: 'reported',
                images: JSON.stringify(images || []),
                video,
            })
            .select()
            .single();

        if (error) throw error;

        await supabase.from('audit_logs').insert({
            user_id: studentId,
            action: 'COMPLAINT_CREATED',
            details: `Complaint ${complaint.id} created. Priority: ${finalSeverity}. Status: Pending Approval.`
        });

        await supabase.from('status_history').insert({
            complaint_id: complaint.id,
            status: 'reported',
            message: `Complaint reported. Waiting for Admin approval.`
        });

        // Notifications
        await notify(
            studentId,
            'complaint_created',
            'Complaint Reported',
            `Your complaint "${complaintTitle}" has been submitted and is pending admin approval.`,
            complaint.id
        );

        const { data: admins } = await supabase.from('users').select('id').eq('role', 'admin');
        if (admins) {
            for (const admin of admins) {
                await notify(
                    admin.id,
                    'new_complaint_pending',
                    'New Complaint Pending Approval',
                    `New ${finalSeverity} priority complaint needs review: "${complaintTitle}" at ${asset.building} ${asset.room}.`,
                    complaint.id
                );
            }
        }

        res.status(201).json(toCamelCase(complaint));
    } catch (error: any) {
        res.status(500).json({ message: 'Complaint registration failed', error: error.message });
    }
};

export const approveComplaint = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { action, notes } = req.body;

    try {
        const { data: complaint } = await supabase
            .from('complaints')
            .select(`*, asset:assets(*)`)
            .eq('id', id)
            .single();

        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
        if (complaint.status !== 'reported') return res.status(400).json({ message: 'Complaint is not in reported status' });

        if (action === 'reject') {
            const { data: updatedComplaint } = await supabase
                .from('complaints')
                .update({
                    status: 'rejected',
                    rejection_reason: notes
                })
                .eq('id', id)
                .select()
                .single();

            await supabase.from('status_history').insert({
                complaint_id: id,
                status: 'rejected',
                message: String(notes || 'Complaint rejected by admin.')
            });

            await notify(
                complaint.student_id,
                'complaint_rejected',
                'Complaint Rejected',
                `Your complaint "${complaint.title}" was rejected. Reason: ${notes || 'No reason provided.'}`,
                complaint.id
            );

            return res.json(toCamelCase(updatedComplaint));
        }

        if (action === 'accept') {
            const finalSeverity = complaint.severity;
            const asset = complaint.asset;

            let { data: candidates } = await supabase
                .from('users')
                .select(`id, name, department, technicians!inner(is_available)`)
                .eq('role', 'technician')
                .eq('department', asset.department || 'Maintenance'); // Fallback

            candidates = (candidates || []).filter((c: any) => c.technicians?.[0]?.is_available);

            let technician = candidates?.[0];

            const { data: updatedComplaint } = await supabase
                .from('complaints')
                .update({
                    status: technician ? 'assigned' : 'in_progress',
                    technician_id: technician?.id || null,
                    assigned_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            await supabase
                .from('assets')
                .update({ status: 'under_maintenance' })
                .eq('id', asset.id);

            await supabase.from('status_history').insert({
                complaint_id: id,
                status: 'assigned',
                message: `Approved by admin. Assigned to ${technician?.name || 'Unassigned'}. ${notes ? `Admin notes: ${notes}` : ''}`
            });

            await notify(
                complaint.student_id,
                'complaint_approved',
                'Complaint Approved',
                `Your complaint has been approved and assigned to a technician.`,
                complaint.id
            );

            if (technician) {
                await notify(
                    technician.id,
                    'complaint_assigned',
                    'New Assignment',
                    `New Assignment: "${complaint.title}" at ${asset.building}. Priority: ${finalSeverity}.`,
                    complaint.id
                );
            }

            return res.json(toCamelCase(updatedComplaint));
        }

        res.status(400).json({ message: 'Invalid action' });
    } catch (error: any) {
        res.status(500).json({ message: 'Approval process failed', error: error.message });
    }
};

export const updateComplaintStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, notes, repairEvidence, severity } = req.body;

    try {
        const { data: complaint } = await supabase.from('complaints').select('*').eq('id', id).single();
        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

        let otp = complaint.otp;
        let resolvedAt = complaint.resolved_at;

        if (status === 'resolved' && !complaint.otp) {
            otp = Math.floor(1000 + Math.random() * 9000).toString();
            resolvedAt = new Date().toISOString();
        }

        const updateData: any = { status };
        if (repairEvidence) updateData.images = repairEvidence;
        if (severity) updateData.severity = severity;
        if (otp) updateData.otp = otp;
        if (resolvedAt) updateData.resolved_at = resolvedAt;

        const { data: updatedComplaint, error } = await supabase
            .from('complaints')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        await supabase.from('status_history').insert({
            complaint_id: id,
            status,
            message: notes
        });

        await notify(
            complaint.student_id,
            'status_updated',
            'Complaint Status Updated',
            `Status changed to ${status}. ${notes ? `Notes: ${notes}` : ''}`,
            complaint.id
        );

        if (status === 'resolved') {
            await notify(
                complaint.student_id,
                'complaint_resolved',
                'Issue Resolved',
                `Your complaint has been resolved. Use OTP ${otp} to verify and close.`,
                complaint.id
            );
        }

        res.json(toCamelCase(updatedComplaint));
    } catch (error: any) {
        res.status(500).json({ message: 'Status update failed', error: error.message });
    }
};

export const verifyOTP = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { otp } = req.body;

    try {
        const { data: complaint } = await supabase.from('complaints').select('*').eq('id', id).single();
        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

        if (complaint.otp === otp) {
            const { data: updated } = await supabase
                .from('complaints')
                .update({
                    status: 'closed',
                    otp_verified: true,
                })
                .eq('id', id)
                .select()
                .single();

            await supabase
                .from('assets')
                .update({ status: 'operational' })
                .eq('id', complaint.asset_id);

            await notify(
                complaint.student_id,
                'complaint_closed',
                'Complaint Closed',
                `Your complaint has been successfully verified, closed, and asset marked as Operational.`,
                complaint.id
            );

            res.json({ message: 'Complaint verified and closed', complaint: toCamelCase(updated) });
        } else {
            res.status(400).json({ message: 'Invalid OTP' });
        }
    } catch (error: any) {
        res.status(500).json({ message: 'Verification failed', error: error.message });
    }
};

export const getAnalytics = async (req: Request, res: Response) => {
    try {
        const analytics = await queries.getAdminAnalytics();
        res.json(analytics);
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch analytics', error: error.message });
    }
};

export const getStudentComplaints = async (req: Request, res: Response) => {
    const studentId = (req as any).user.id;
    try {
        const result = await queries.getStudentDashboard(studentId);
        res.json(result.complaints);
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch complaints', error: error.message });
    }
};

export const getTechnicianComplaints = async (req: Request, res: Response) => {
    const technicianId = (req as any).user.id;
    try {
        const result = await queries.getTechnicianWorkload(technicianId);
        res.json(result.complaints);
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch complaints', error: error.message });
    }
};

export const getAllComplaints = async (req: Request, res: Response) => {
    try {
        const { data } = await supabase
            .from('complaints')
            .select(`
                *,
                asset:assets(*),
                student:users!student_id(*),
                technician:users!technician_id(*)
            `)
            .order('created_at', { ascending: false });

        const transformed = (data || []).map((c: any) => ({
            ...c,
            images: c.images ? JSON.parse(c.images) : []
        }));

        res.json(toCamelCase(transformed));
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch complaints', error: error.message });
    }
};
