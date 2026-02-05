import { prisma } from '../db/prisma';
import { createNotification } from '../services/notificationService';
import { isSLABreached } from '../services/priorityService';

const checkSLA = async () => {
    console.log('Running SLA Check...');

    try {
        const activeComplaints = await prisma.complaint.findMany({
            where: {
                status: { notIn: ['resolved', 'closed'] }
            },
            include: { asset: true, technician: true }
        });

        for (const complaint of activeComplaints) {
            if (isSLABreached(complaint.createdAt, complaint.severity)) {
                // Check if already escalated to avoid spamming (assuming we had an escalation flag, 
                // but since we don't, we might check last notification or just log)
                // For this MVP, we'll just log and maybe notify admin if it's the first breach check of the day

                console.log(`SLA Breach detected for Complaint ${complaint.id} (${complaint.severity})`);

                // Notify Admin
                const admins = await prisma.user.findMany({ where: { role: 'admin' } });
                for (const admin of admins) {
                    await createNotification(
                        admin.id,
                        'sla_breach',
                        'SLA Breach Alert',
                        `Complaint ${complaint.title} (${complaint.severity}) has exceeded its SLA time!`,
                        complaint.id
                    );
                }

                // Notify Technician
                if (complaint.technician) {
                    await createNotification(
                        complaint.technician.id,
                        'sla_breach',
                        'SLA Breach Alert',
                        `Your assignment "${complaint.title}" is overdue! Please resolve immediately.`,
                        complaint.id
                    );
                }
            }
        }
    } catch (error) {
        console.error('Error checking SLA:', error);
    } finally {
        await prisma.$disconnect();
    }
};

checkSLA();
