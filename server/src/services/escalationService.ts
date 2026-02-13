import prisma from '../db/prisma';
import { createNotification } from './notificationService';

export const checkEscalations = async () => {
    try {
        const thresholdDate = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago

        // Find triggered emergencies older than threshold that haven't been responded to
        const pendingEmergencies = await prisma.emergency.findMany({
            where: {
                status: 'triggered',
                reportedAt: { lt: thresholdDate },
                escalationLevel: 0 // Only escalate if not already escalated (or implement multi-level)
            },
            include: { reporter: true, assignedTo: true }
        });

        for (const em of pendingEmergencies) {
            console.log(`[Escalation] Escalating Emergency ${em.id}`);

            // 1. Increase Escalation Level
            await prisma.emergency.update({
                where: { id: em.id },
                data: { escalationLevel: 1 }
            });

            // 2. Notify Admins & Wardens and get one for audit
            const admins = await prisma.user.findMany({ where: { role: { in: ['admin', 'warden'] } } });
            const systemActor = admins.find(a => a.role === 'admin') || admins[0];

            for (const admin of admins) {
                await createNotification(
                    admin.id,
                    '🔥 EMERGENCY ESCALATED',
                    `Unresponded ${em.type} Emergency at ${getLocationText(em.location)} has been escalated!`,
                    'emergency_escalated',
                    em.id,
                    'emergency'
                );
            }

            // 3. Log Audit
            if (systemActor) {
                await prisma.auditLog.create({
                    data: {
                        userId: systemActor.id, // Using an admin as system actor
                        action: 'EMERGENCY_ESCALATED',
                        details: `Emergency ${em.id} escalated to Level 1 due to no response in 5 mins.`
                    }
                });
            }
        }
    } catch (error) {
        console.error('Escalation check failed:', error);
    }
};

const getLocationText = (loc: string) => {
    try {
        if (loc.startsWith('{')) {
            const l = JSON.parse(loc);
            return l.text || 'GPS Location';
        }
        return loc;
    } catch { return loc; }
};
