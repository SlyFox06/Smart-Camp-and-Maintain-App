import { Request, Response } from 'express';
import prisma from '../db/prisma';

export const getHostelDashboardStats = async (req: Request, res: Response) => {
    try {
        // Fetch stats strictly for hostel scope
        const complaints = await prisma.complaint.findMany({
            where: {
                scope: 'hostel'
            }
        });

        const total = complaints.length;
        const pendingApproval = complaints.filter(c => c.status === 'waiting_warden_approval').length;
        const active = complaints.filter(c => ['assigned', 'in_progress', 'approved'].includes(c.status || '')).length;
        const emergency = await prisma.emergency.count({
            where: {
                // Approximate filtering by location if possible, or assume all emergencies are serious
                // Ideally Emergency model has a scope or location type, but we can filter by description/type or just show all for safety
                status: { not: 'resolved' }
            }
        });

        // Occupancy / Room status (if we had student data linked to rooms)
        const faultyRooms = await prisma.room.count({ where: { status: 'under_maintenance' } });

        res.json({
            total,
            pendingApproval,
            active,
            emergency,
            faultyRooms
        });
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch hostel stats', error: error.message });
    }
};

export const getPredictiveInsights = async (req: Request, res: Response) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentComplaints = await prisma.complaint.findMany({
            where: {
                scope: 'hostel',
                createdAt: { gte: thirtyDaysAgo }
            },
            include: { room: true }
        });

        const insights: string[] = [];
        const floorCounts: Record<string, number> = {};
        const categoryCounts: Record<string, number> = {};

        recentComplaints.forEach(c => {
            if (c.room && c.room.floor) {
                const key = `${c.room.block || 'Unknown'}-${c.room.floor}`;
                floorCounts[key] = (floorCounts[key] || 0) + 1;
            }
            if (c.category) {
                categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
            }
        });

        // 1. Detect High Frequency Floors
        Object.entries(floorCounts).forEach(([location, count]) => {
            if (count >= 5) {
                insights.push(`🚨 High complaint volume detected in ${location} (${count} issues). Preventive maintenance recommended.`);
            }
        });

        // 2. Category Spikes
        if (categoryCounts['Electrical'] > 10) {
            insights.push(`⚡ Recurring electrical issues detected (${categoryCounts['Electrical']} this month). Inspect main distribution board.`);
        }
        if (categoryCounts['Plumbing'] > 10) {
            insights.push(`💧 Frequent plumbing failures (${categoryCounts['Plumbing']} this month). Check water pressure valves.`);
        }

        // 3. Time-based (mock logic as strictly querying time requires more complex DB grouping)
        // Assume late night issues if many reports created between 10PM and 6AM
        const lateNightIssues = recentComplaints.filter(c => {
            const hour = new Date(c.createdAt || '').getHours();
            return hour >= 22 || hour <= 6;
        }).length;

        if (lateNightIssues > 5) {
            insights.push(`🌙 ${lateNightIssues} complaints reported late night. Consider increasing night shift staff.`);
        }

        res.json({ insights, rawStats: { floorCounts, categoryCounts } });
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to generate insights', error: error.message });
    }
};

export const getStaffDistribution = async (req: Request, res: Response) => {
    try {
        // 1. Get Complaint Density by Block
        const complaints = await prisma.complaint.findMany({
            where: { scope: 'hostel', status: { in: ['assigned', 'in_progress', 'approved'] } },
            include: { room: true } // Assuming room has block info
        });

        const blockLoad: Record<string, number> = {};
        complaints.forEach(c => {
            const block = c.room?.block || 'General';
            blockLoad[block] = (blockLoad[block] || 0) + 1;
        });

        // 2. Get Active Staff by Area
        // Staff assignedArea likely matches Block names
        const techs = await prisma.technician.findMany({ where: { isAvailable: true } });
        const cleaners = await prisma.cleaner.findMany({ where: { isAvailable: true } });

        const staffDistribution: Record<string, number> = {};
        [...techs, ...cleaners].forEach(s => {
            const area = s.assignedArea || 'General';
            staffDistribution[area] = (staffDistribution[area] || 0) + 1;
        });

        // 3. Generate Recommendations
        const recommendations: string[] = [];
        Object.entries(blockLoad).forEach(([block, load]) => {
            const staffCount = staffDistribution[block] || 0;
            if (load > 5 && staffCount < 2) {
                recommendations.push(`⚠️ High load in ${block} (${load} active tasks) with low staff (${staffCount}). Reallocate staff immediately.`);
            }
        });

        res.json({ blockLoad, staffDistribution, recommendations });
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch staff distribution', error: error.message });
    }
};
