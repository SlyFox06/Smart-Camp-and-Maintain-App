import prisma from '../db/prisma';
import { createNotification } from '../services/notificationService';
import { isSLABreached } from '../services/priorityService';

const checkSLA = async () => {
    console.log('Running SLA Check...');

    try {
        const activeComplaints = await prisma.complaint.findMany({
            where: {
                status: {
                    notIn: ['resolved', 'closed']
                }
            },
            include: {
                technician: true
            }
        });

        if (!activeComplaints.length) return;

        for (const complaint of activeComplaints) {
            // complaint.createdAt is Date object in Prisma
            if (complaint.createdAt && isSLABreached(complaint.createdAt, complaint.severity || 'medium')) {
                console.log(`SLA Breach detected for Complaint ${complaint.id} (${complaint.severity})`);

                // Notify Admins
                const admins = await prisma.user.findMany({
                    where: { role: 'admin' },
                    select: { id: true }
                });

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
    }
};

checkSLA();
