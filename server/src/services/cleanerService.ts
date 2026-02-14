
import prisma from '../db/prisma';

export const generateDailyCleaningTasks = async (date: Date = new Date()) => {
    try {
        const today = new Date(date);
        today.setHours(0, 0, 0, 0);

        // 1. Get all Hostel Cleaners (Active & Available)
        const cleaners = await prisma.cleaner.findMany({
            where: {
                isAvailable: true,
                user: {
                    isActive: true,
                    accessScope: { in: ['hostel', 'both'] }
                }
            },
            include: { user: true }
        });

        if (cleaners.length === 0) {
            return { success: false, message: 'No available hostel cleaners found.' };
        }

        // 2. Get all Hostel Rooms (Operational)
        const rooms = await prisma.room.findMany({
            where: { status: 'operational' },
            orderBy: [{ block: 'asc' }, { floor: 'asc' }, { roomNumber: 'asc' }]
        });

        if (rooms.length === 0) {
            return { success: false, message: 'No hostel rooms found to clean.' };
        }

        // 3. Check for existing tasks today to avoid duplicates
        const existingTasks = await prisma.cleaningTask.findMany({
            where: {
                scheduledDate: { gte: today },
                roomId: { not: null }
            },
            select: { roomId: true }
        });
        const existingRoomIds = new Set(existingTasks.map(t => t.roomId));
        const roomsToAssign = rooms.filter(r => !existingRoomIds.has(r.id));

        if (roomsToAssign.length === 0) {
            return { success: true, message: 'All rooms already have cleaning tasks for today.', tasksCreated: 0 };
        }

        // 4. Distribute Rooms
        const tasksToCreate: any[] = [];
        const roomsByBlock: Record<string, typeof rooms> = {};
        const unassignedRooms: typeof rooms = [];

        // Normalize helper
        const normalize = (s: string | null) => (s || 'UNASSIGNED').toUpperCase().trim();

        // Group rooms
        roomsToAssign.forEach(room => {
            const block = normalize(room.block || 'GENERAL');
            if (!roomsByBlock[block]) roomsByBlock[block] = [];
            roomsByBlock[block].push(room);
        });

        // Group cleaners
        const cleanersByBlock: Record<string, typeof cleaners> = {};
        cleaners.forEach(cleaner => {
            const area = normalize(cleaner.assignedArea || 'GENERAL');
            if (!cleanersByBlock[area]) cleanersByBlock[area] = [];
            cleanersByBlock[area].push(cleaner);
        });

        console.log(`[TaskGen] processing ${roomsToAssign.length} rooms and ${cleaners.length} cleaners.`);
        console.log(`[TaskGen] Room Blocks: ${Object.keys(roomsByBlock).join(', ')}`);
        console.log(`[TaskGen] Cleaner Areas: ${Object.keys(cleanersByBlock).join(', ')}`);

        // Processing
        for (const block in roomsByBlock) {
            const blockRooms = roomsByBlock[block];
            // Try to find cleaners for this specific block, or fallback to ANY cleaner if none found
            let blockCleaners = cleanersByBlock[block];

            if (!blockCleaners || blockCleaners.length === 0) {
                console.warn(`No specific cleaners for block ${block}. Will use global pool.`);
                unassignedRooms.push(...blockRooms);
                continue;
            }

            // Distribute among block specific cleaners
            distribute(blockRooms, blockCleaners, tasksToCreate, today);
        }

        // Handle rooms with no specific block cleaner (distribute among ALL available cleaners)
        if (unassignedRooms.length > 0) {
            console.log(`Assigning ${unassignedRooms.length} rooms from unmatched blocks to global pool.`);
            distribute(unassignedRooms, cleaners, tasksToCreate, today);
        }

        function distribute(targetRooms: typeof rooms, targetCleaners: typeof cleaners, tasksList: any[], taskDate: Date) {
            const totalRooms = targetRooms.length;
            const totalCleaners = targetCleaners.length;
            if (totalCleaners === 0) return;

            let roomIdx = 0;
            // Round robin
            while (roomIdx < totalRooms) {
                for (const cleaner of targetCleaners) {
                    if (roomIdx >= totalRooms) break;

                    tasksList.push({
                        roomId: targetRooms[roomIdx].id,
                        cleanerId: cleaner.id,
                        scheduledDate: taskDate,
                        status: 'assigned',
                        assignedAt: new Date() // Ideally use taskDate if future, but created now
                    });
                    roomIdx++;
                }
            }
        }

        if (tasksToCreate.length > 0) {
            await prisma.cleaningTask.createMany({ data: tasksToCreate });
        }

        return {
            success: true,
            message: `Successfully generated ${tasksToCreate.length} cleaning tasks for ${roomsToAssign.length} rooms.`,
            tasksCreated: tasksToCreate.length,
            cleanersActive: cleaners.length,
            details: `Distributed among ${cleaners.length} cleaners across ${Object.keys(roomsByBlock).length} blocks.`
        };

    } catch (error: any) {
        console.error('Generate tasks error:', error);
        return { success: false, message: 'Failed to generate tasks', error: error.message };
    }
};
