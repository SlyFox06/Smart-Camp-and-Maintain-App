import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import prisma from './src/db/prisma';

const seedDatabase = async () => {
    try {
        console.log('🌱 Seeding database with demo data...\n');

        // 1. Create Technicians
        console.log('Creating technicians...');
        const tech1Password = await bcrypt.hash('tech123', 10);
        const tech2Password = await bcrypt.hash('tech123', 10);

        const tech1 = await prisma.user.create({
            data: {
                name: 'Rajesh Kumar',
                email: 'rajesh@campus.edu',
                password: tech1Password,
                role: 'technician',
                department: 'Maintenance',
                phone: '+91 9876543210',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rajesh',
                isFirstLogin: false
            }
        });

        await prisma.technician.create({
            data: {
                userId: tech1.id,
                skillType: 'Electrical',
                assignedArea: 'Building A',
                isAvailable: true
            }
        });

        const tech2 = await prisma.user.create({
            data: {
                name: 'Priya Singh',
                email: 'priya@campus.edu',
                password: tech2Password,
                role: 'technician',
                department: 'Maintenance',
                phone: '+91 9876543211',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya',
                isFirstLogin: false
            }
        });

        await prisma.technician.create({
            data: {
                userId: tech2.id,
                skillType: 'Plumbing',
                assignedArea: 'Building B',
                isAvailable: true
            }
        });

        console.log('✅ Created 2 technicians\n');

        // 2. Get existing student and assets
        const student = await prisma.user.findFirst({ where: { role: 'student' } });
        const assets = await prisma.asset.findMany();

        if (!student) {
            console.log('⚠️ No student found, skipping complaints');
            return;
        }

        // 3. Create Complaints
        console.log('Creating complaints...');

        // Complaint 1: Reported
        const complaint1 = await prisma.complaint.create({
            data: {
                title: 'AC not cooling properly',
                description: 'The AC in room 101 is making noise and not cooling the room effectively.',
                status: 'reported',
                severity: 'high',
                images: 'https://images.unsplash.com/photo-1631545806609-f7c4a5fb3e6f?w=400',
                studentId: student.id,
                assetId: assets[0].id
            }
        });

        // Complaint 2: Assigned
        const complaint2 = await prisma.complaint.create({
            data: {
                title: 'Projector display issue',
                description: 'The projector screen appears blurry and has lines across it.',
                status: 'assigned',
                severity: 'medium',
                studentId: student.id,
                technicianId: tech1.id,
                assetId: assets[2].id,
                assignedAt: new Date()
            }
        });

        await prisma.statusHistory.create({
            data: {
                complaintId: complaint2.id,
                status: 'assigned',
                message: 'Assigned to Rajesh Kumar for resolution'
            }
        });

        // Complaint 3: In Progress
        const complaint3 = await prisma.complaint.create({
            data: {
                title: 'Fan making loud noise',
                description: 'The ceiling fan is wobbling and making grinding noise.',
                status: 'in_progress',
                severity: 'low',
                studentId: student.id,
                technicianId: tech2.id,
                assetId: assets[3].id,
                assignedAt: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
            }
        });

        await prisma.statusHistory.createMany({
            data: [
                {
                    complaintId: complaint3.id,
                    status: 'assigned',
                    message: 'Assigned to Priya Singh'
                },
                {
                    complaintId: complaint3.id,
                    status: 'in_progress',
                    message: 'Technician has started working on the issue'
                }
            ]
        });

        // Complaint 4: Resolved
        const complaint4 = await prisma.complaint.create({
            data: {
                title: 'AC filter replacement needed',
                description: 'The AC filter needs cleaning or replacement.',
                status: 'resolved',
                severity: 'low',
                studentId: student.id,
                technicianId: tech1.id,
                assetId: assets[1].id,
                assignedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
                resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
            }
        });

        await prisma.statusHistory.createMany({
            data: [
                {
                    complaintId: complaint4.id,
                    status: 'assigned',
                    message: 'Assigned to Rajesh Kumar'
                },
                {
                    complaintId: complaint4.id,
                    status: 'in_progress',
                    message: 'Filter cleaning started'
                },
                {
                    complaintId: complaint4.id,
                    status: 'resolved',
                    message: 'Filter cleaned and AC is working properly now'
                }
            ]
        });

        console.log('✅ Created 4 complaints\n');

        // 4. Create Notifications
        console.log('Creating notifications...');
        await prisma.notification.createMany({
            data: [
                {
                    userId: student.id,
                    title: 'Complaint Assigned',
                    message: 'Your complaint about projector has been assigned to Rajesh Kumar',
                    type: 'complaint_assigned',
                    relatedComplaintId: complaint2.id
                },
                {
                    userId: tech1.id,
                    title: 'New Complaint Assigned',
                    message: 'You have been assigned a new complaint: Projector display issue',
                    type: 'complaint_assigned',
                    relatedComplaintId: complaint2.id
                },
                {
                    userId: student.id,
                    title: 'Complaint Resolved',
                    message: 'Your complaint about AC filter has been resolved',
                    type: 'complaint_resolved',
                    relatedComplaintId: complaint4.id,
                    isRead: true
                }
            ]
        });

        console.log('✅ Created notifications\n');

        console.log('🎉 Database seeded successfully!\n');
        console.log('📊 Summary:');
        console.log('   - 2 Technicians (rajesh@campus.edu, priya@campus.edu, password: tech123)');
        console.log('   - 4 Complaints (1 reported, 1 assigned, 1 in progress, 1 resolved)');
        console.log('   - Notifications and status history added\n');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
    } finally {
        await prisma.$disconnect();
    }
};

seedDatabase();
