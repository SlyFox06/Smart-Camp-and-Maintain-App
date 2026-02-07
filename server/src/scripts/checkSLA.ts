import { supabase } from '../db/supabase';
import { createNotification } from '../services/notificationService';
import { isSLABreached } from '../services/priorityService';

const checkSLA = async () => {
    console.log('Running SLA Check...');

    try {
        const { data: activeComplaints, error } = await supabase
            .from('complaints')
            .select('*, technician:users!technician_id(*)')
            .not('status', 'in', '("resolved","closed")');

        if (error) throw error;
        if (!activeComplaints) return;

        for (const complaint of activeComplaints) {
            // Mapping keys if needed: created_at -> createdAt for 'isSLABreached' utility?
            // isSLABreached expects (Date, string).
            // Supabase returns string ISO dates.
            // new Date(complaint.created_at) works.

            if (isSLABreached(complaint.created_at, complaint.severity)) {
                console.log(`SLA Breach detected for Complaint ${complaint.id} (${complaint.severity})`);

                // Notify Admins
                const { data: admins } = await supabase.from('users').select('id').eq('role', 'admin');

                if (admins) {
                    for (const admin of admins) {
                        await createNotification(
                            admin.id,
                            'sla_breach',
                            'SLA Breach Alert',
                            `Complaint ${complaint.title} (${complaint.severity}) has exceeded its SLA time!`,
                            complaint.id
                        );
                    }
                }

                // Notify Technician
                if (complaint.technician) {
                    // complaint.technician is object or array? Single object due to !technician_id FK
                    // But Supabase JS might return array if one-to-many logic?
                    // No, single() not used on main query, but column select with !FK implies single object if relationship is correct.
                    // Assuming object.
                    const tech = Array.isArray(complaint.technician) ? complaint.technician[0] : complaint.technician;

                    if (tech) {
                        await createNotification(
                            tech.id,
                            'sla_breach',
                            'SLA Breach Alert',
                            `Your assignment "${complaint.title}" is overdue! Please resolve immediately.`,
                            complaint.id
                        );
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error checking SLA:', error);
    }
};

checkSLA();
