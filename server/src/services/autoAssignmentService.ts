import prisma from '../db/prisma';

// Map issue categories to staff skills
const CATEGORY_TO_SKILL_MAP: { [key: string]: string } = {
    'Electrical': 'Electrician',
    'Plumbing': 'Plumber',
    'Furniture': 'Maintenance Technician',
    'IT/Network': 'IT Technician',
    'IT / Network': 'IT Technician', // Handle variation
    'Wifi': 'IT Technician',
    'Cleanliness': 'Cleaner',
    'Other': 'Maintenance Technician'
};

// Map categories to staff roles
const CATEGORY_TO_ROLE_MAP: { [key: string]: 'technician' | 'cleaner' } = {
    'Electrical': 'technician',
    'Plumbing': 'technician',
    'Furniture': 'technician',
    'IT/Network': 'technician',
    'IT / Network': 'technician',
    'Wifi': 'technician',
    'Cleanliness': 'cleaner',
    'Other': 'technician'
};

interface AutoAssignmentResult {
    success: boolean;
    assigned: boolean;
    message: string;
    assignedTo?: string;
    staffName?: string;
}

/**
 * Auto-assign complaint to appropriate staff based on skill match
 */
export const autoAssignComplaint = async (complaintId: string): Promise<AutoAssignmentResult> => {
    try {
        // Fetch complaint details
        const complaint = await prisma.complaint.findUnique({
            where: { id: complaintId },
            include: {
                asset: true,
                room: true,
                classroom: true,
                student: true
            }
        });

        if (!complaint) {
            return {
                success: false,
                assigned: false,
                message: 'Complaint not found'
            };
        }

        // Only auto-assign approved complaints
        if (complaint.status !== 'approved') {
            return {
                success: false,
                assigned: false,
                message: 'Complaint must be approved before assignment'
            };
        }

        // Get category from complaint
        const category = complaint.category;
        if (!category) {
            return {
                success: false,
                assigned: false,
                message: 'Complaint has no category'
            };
        }

        // Map category to required skill
        const requiredSkill = CATEGORY_TO_SKILL_MAP[category];
        const requiredRole = CATEGORY_TO_ROLE_MAP[category];

        if (!requiredSkill || !requiredRole) {
            return {
                success: false,
                assigned: false,
                message: `No skill mapping found for category: ${category}`
            };
        }

        // Get building/area from complaint location
        let building: string | undefined;
        if (complaint.asset) {
            building = complaint.asset.building;
        } else if (complaint.room) {
            building = complaint.room.block;
        } else if (complaint.classroom) {
            building = complaint.classroom.building;
        }

        // Find appropriate staff based on role
        let assignedStaffId: string | null = null;
        let assignedStaffName: string | null = null;

        if (requiredRole === 'technician') {
            // Find available technician with matching skill
            const matchingTechnicians = await prisma.technician.findMany({
                where: {
                    skillType: requiredSkill,
                    isAvailable: true,
                    user: {
                        isActive: true
                    }
                },
                include: {
                    user: true
                },
                orderBy: {
                    createdAt: 'asc' // First available technician
                }
            });

            // Prioritize technicians from the same building/area
            let selectedTechnician = null;
            if (building) {
                selectedTechnician = matchingTechnicians.find(
                    tech => tech.assignedArea === building
                );
            }

            // If no local technician, pick any available
            if (!selectedTechnician && matchingTechnicians.length > 0) {
                selectedTechnician = matchingTechnicians[0];
            }

            if (selectedTechnician) {
                assignedStaffId = selectedTechnician.userId;
                assignedStaffName = selectedTechnician.user.name;
            }

        } else if (requiredRole === 'cleaner') {
            // Find available cleaner
            const matchingCleaners = await prisma.cleaner.findMany({
                where: {
                    isAvailable: true,
                    user: {
                        isActive: true
                    }
                },
                include: {
                    user: true
                },
                orderBy: {
                    lastAvailabilityUpdate: 'asc' // Longest available cleaner
                }
            });

            // Prioritize cleaners from the same building/area
            let selectedCleaner = null;
            if (building) {
                selectedCleaner = matchingCleaners.find(
                    cleaner => cleaner.assignedArea === building
                );
            }

            // If no local cleaner, pick any available
            if (!selectedCleaner && matchingCleaners.length > 0) {
                selectedCleaner = matchingCleaners[0];
            }

            if (selectedCleaner) {
                assignedStaffId = selectedCleaner.userId;
                assignedStaffName = selectedCleaner.user.name;
            }
        }

        // If no staff available, mark as waiting
        if (!assignedStaffId) {
            await prisma.complaint.update({
                where: { id: complaintId },
                data: {
                    status: 'waiting_for_skilled_staff'
                }
            });

            // Create notification for admin
            const admins = await prisma.user.findMany({
                where: { role: 'admin', isActive: true }
            });

            for (const admin of admins) {
                await prisma.notification.create({
                    data: {
                        userId: admin.id,
                        title: 'No Staff Available',
                        message: `Complaint #${complaint.id.substring(0, 8)} (${category}) is waiting for skilled staff`,
                        type: 'warning',
                        relatedComplaintId: complaintId
                    }
                });
            }

            return {
                success: true,
                assigned: false,
                message: `No available ${requiredSkill} staff found. Complaint marked as waiting.`
            };
        }

        // Assign complaint to staff
        await prisma.complaint.update({
            where: { id: complaintId },
            data: {
                technicianId: assignedStaffId,
                status: 'assigned',
                assignedAt: new Date()
            }
        });

        // Create notification for assigned staff
        await prisma.notification.create({
            data: {
                userId: assignedStaffId,
                title: 'New Complaint Assigned',
                message: `You have been assigned a new ${category} complaint`,
                type: 'assignment',
                relatedComplaintId: complaintId
            }
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId: assignedStaffId,
                action: 'COMPLAINT_AUTO_ASSIGNED',
                details: `Complaint ${complaint.id} auto-assigned to ${assignedStaffName} (Skill: ${requiredSkill})`
            }
        });

        console.log(`✅ Auto-assigned complaint ${complaintId} to ${assignedStaffName} (${requiredSkill})`);

        return {
            success: true,
            assigned: true,
            message: `Complaint assigned to ${assignedStaffName}`,
            assignedTo: assignedStaffId || undefined,
            staffName: assignedStaffName || undefined
        };

    } catch (error: any) {
        console.error('Auto-assignment error:', error);
        return {
            success: false,
            assigned: false,
            message: error.message || 'Auto-assignment failed'
        };
    }
};

/**
 * Retry assignment for all waiting complaints when staff becomes available
 */
export const retryWaitingAssignments = async (staffId: string, role: 'technician' | 'cleaner'): Promise<number> => {
    try {
        let skillType: string | null = null;

        // Get staff skill
        if (role === 'technician') {
            const technician = await prisma.technician.findUnique({
                where: { userId: staffId },
                select: { skillType: true }
            });
            skillType = technician?.skillType || null;
        } else if (role === 'cleaner') {
            skillType = 'Cleaner'; // Matching the map value
        }

        if (!skillType) {
            return 0;
        }

        // Find matching category for this skill
        const matchingCategories = Object.keys(CATEGORY_TO_SKILL_MAP).filter(
            cat => CATEGORY_TO_SKILL_MAP[cat] === skillType
        );

        if (matchingCategories.length === 0) {
            return 0;
        }

        // Find waiting complaints with matching category
        const waitingComplaints = await prisma.complaint.findMany({
            where: {
                status: 'waiting_for_skilled_staff',
                category: { in: matchingCategories }
            },
            orderBy: {
                createdAt: 'asc' // Oldest first
            }
        });

        let assignedCount = 0;

        for (const complaint of waitingComplaints) {
            const result = await autoAssignComplaint(complaint.id);
            if (result.assigned) {
                assignedCount++;
            }
        }

        console.log(`✅ Retry assignment: ${assignedCount} waiting complaints assigned`);
        return assignedCount;

    } catch (error) {
        console.error('Retry assignment error:', error);
        return 0;
    }
};

/**
 * Get complaints for a specific staff member based on their skill
 */
export const getComplaintsForStaff = async (staffId: string, role: 'technician' | 'cleaner') => {
    try {
        let skillType: string | null = null;

        // Get staff skill
        if (role === 'technician') {
            const technician = await prisma.technician.findUnique({
                where: { userId: staffId },
                select: { skillType: true }
            });
            skillType = technician?.skillType || null;
        } else if (role === 'cleaner') {
            skillType = 'Cleaner';
        }

        if (!skillType) {
            return [];
        }

        // Find matching categories for this skill
        const matchingCategories = Object.keys(CATEGORY_TO_SKILL_MAP).filter(
            cat => CATEGORY_TO_SKILL_MAP[cat] === skillType
        );

        // Get complaints assigned to this staff OR matching their skill
        const complaints = await prisma.complaint.findMany({
            where: {
                OR: [
                    { technicianId: staffId },
                    {
                        AND: [
                            { category: { in: matchingCategories } },
                            { status: { in: ['assigned', 'in_progress', 'work_submitted'] } }
                        ]
                    }
                ]
            },
            include: {
                student: {
                    select: { name: true, email: true }
                },
                asset: true,
                room: true,
                classroom: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return complaints;

    } catch (error) {
        console.error('Get complaints for staff error:', error);
        return [];
    }
};

export { CATEGORY_TO_SKILL_MAP, CATEGORY_TO_ROLE_MAP };
