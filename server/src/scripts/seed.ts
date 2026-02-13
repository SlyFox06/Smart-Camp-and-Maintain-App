import prisma from '../db/prisma';
import bcrypt from 'bcryptjs';

async function seed() {
    console.log('🌱 Starting database seed...');

    try {
        // Hash password for all users
        const hashedPassword = await bcrypt.hash('password123', 10);

        // 1. Create Admin User
        console.log('Creating admin user...');
        const admin = await prisma.user.upsert({
            where: { email: 'admin@campus.edu' },
            update: {},
            create: {
                name: 'Admin User',
                email: 'admin@campus.edu',
                password: hashedPassword,
                role: 'admin',
                department: 'Administration',
                phone: '1234567890',
                isActive: true,
                isFirstLogin: false,
                accessScope: 'both'
            }
        });
        console.log('✅ Admin user created');

        // 2. Create Warden User
        console.log('Creating warden user...');
        const warden = await prisma.user.upsert({
            where: { email: 'warden@campus.edu' },
            update: {},
            create: {
                name: 'Hostel Warden',
                email: 'warden@campus.edu',
                password: hashedPassword,
                role: 'warden',
                department: 'Hostel Administration',
                phone: '1234567891',
                isActive: true,
                isFirstLogin: false,
                accessScope: 'hostel'
            }
        });
        console.log('✅ Warden user created');

        // 3. Create Student Users
        console.log('Creating student users...');
        const students = [];

        const atharva = await prisma.user.upsert({
            where: { email: 'atharva@campus.edu' },
            update: {},
            create: {
                name: 'Atharva',
                email: 'atharva@campus.edu',
                password: hashedPassword,
                role: 'student',
                department: 'Computer Science',
                phone: '9876543210',
                isActive: true,
                isFirstLogin: false,
                accessScope: 'both'
            }
        });
        students.push(atharva);

        const john = await prisma.user.upsert({
            where: { email: 'john@campus.edu' },
            update: {},
            create: {
                name: 'John Doe',
                email: 'john@campus.edu',
                password: hashedPassword,
                role: 'student',
                department: 'Computer Science',
                phone: '9876543211',
                isActive: true,
                isFirstLogin: false,
                accessScope: 'college'
            }
        });
        students.push(john);

        console.log(`✅ Created ${students.length} student users`);

        // 4. Create Technician Users
        console.log('Creating technician users...');
        const techData = [
            { name: 'Raj Kumar', email: 'raj@campus.edu', skillType: 'Electrical', area: 'Main Building' },
            { name: 'Amit Singh', email: 'amit@campus.edu', skillType: 'Plumbing', area: 'Hostel Block A' },
            { name: 'Suresh Patel', email: 'suresh@campus.edu', skillType: 'Computer', area: 'Computer Lab' },
        ];

        for (const tech of techData) {
            const user = await prisma.user.upsert({
                where: { email: tech.email },
                update: {},
                create: {
                    name: tech.name,
                    email: tech.email,
                    password: hashedPassword,
                    role: 'technician',
                    department: 'Maintenance',
                    phone: '9876543212',
                    isActive: true,
                    isFirstLogin: false,
                    accessScope: tech.area.includes('Hostel') ? 'hostel' : 'college'
                }
            });

            await prisma.technician.upsert({
                where: { userId: user.id },
                update: {},
                create: {
                    userId: user.id,
                    skillType: tech.skillType,
                    assignedArea: tech.area,
                    isAvailable: true
                }
            });
        }
        console.log(`✅ Created ${techData.length} technician users`);

        // 5. Create Sample Assets (College)
        console.log('Creating sample college assets...');
        const assets = [];

        const projector = await prisma.asset.upsert({
            where: { id: '00000000-0000-0000-0000-000000000001' },
            update: {},
            create: {
                id: '00000000-0000-0000-0000-000000000001',
                name: 'Projector Lab 1',
                type: 'projector',
                building: 'Main Building',
                floor: '2nd',
                room: '204',
                department: 'Computer Science',
                status: 'operational'
            }
        });
        assets.push(projector);

        const ac = await prisma.asset.upsert({
            where: { id: '00000000-0000-0000-0000-000000000002' },
            update: {},
            create: {
                id: '00000000-0000-0000-0000-000000000002',
                name: 'AC Unit 1',
                type: 'ac',
                building: 'Main Building',
                floor: '1st',
                room: '101',
                department: 'Computer Science',
                status: 'operational'
            }
        });
        assets.push(ac);

        console.log(`✅ Created ${assets.length} sample assets`);

        // 6. Create Sample Rooms (Hostel)
        console.log('Creating sample hostel rooms...');
        const rooms = [];

        const room201 = await prisma.room.upsert({
            where: { id: '00000000-0000-0000-0000-000000000101' },
            update: {},
            create: {
                id: '00000000-0000-0000-0000-000000000101',
                roomNumber: '201',
                block: 'Block A',
                floor: '2nd',
                hostelName: 'Boys Hostel 1',
                capacity: 2,
                status: 'operational'
            }
        });
        rooms.push(room201);

        const room202 = await prisma.room.upsert({
            where: { id: '00000000-0000-0000-0000-000000000102' },
            update: {},
            create: {
                id: '00000000-0000-0000-0000-000000000102',
                roomNumber: '202',
                block: 'Block A',
                floor: '2nd',
                hostelName: 'Boys Hostel 1',
                capacity: 3,
                status: 'operational'
            }
        });
        rooms.push(room202);

        console.log(`✅ Created ${rooms.length} sample rooms`);

        // 7. Create Sample Classrooms
        console.log('Creating sample classrooms...');
        const classrooms = [];

        const computerLab1 = await prisma.classroom.upsert({
            where: { id: '00000000-0000-0000-0000-000000000201' },
            update: {},
            create: {
                id: '00000000-0000-0000-0000-000000000201',
                name: 'Computer Lab 1',
                building: 'A-Block',
                floor: '2nd',
                roomNumber: '204',
                department: 'Computer Science',
                capacity: 60,
                type: 'lab',
                status: 'operational'
            }
        });
        classrooms.push(computerLab1);

        const lectureHall = await prisma.classroom.upsert({
            where: { id: '00000000-0000-0000-0000-000000000202' },
            update: {},
            create: {
                id: '00000000-0000-0000-0000-000000000202',
                name: 'Lecture Hall A',
                building: 'B-Block',
                floor: '1st',
                roomNumber: '101',
                department: 'General',
                capacity: 120,
                type: 'lecture_hall',
                status: 'operational'
            }
        });
        classrooms.push(lectureHall);

        const physicsLab = await prisma.classroom.upsert({
            where: { id: '00000000-0000-0000-0000-000000000203' },
            update: {},
            create: {
                id: '00000000-0000-0000-0000-000000000203',
                name: 'Physics Lab',
                building: 'Science Block',
                floor: '3rd',
                roomNumber: '305',
                department: 'Physics',
                capacity: 40,
                type: 'lab',
                status: 'operational'
            }
        });
        classrooms.push(physicsLab);

        console.log(`✅ Created ${classrooms.length} sample classrooms`);

        // 8. Create Cleaner Users and Profiles
        console.log('Creating cleaner users...');
        const cleanerData = [
            { name: 'Ramesh Kumar', email: 'ramesh@campus.edu', area: 'A-Block' },
            { name: 'Sunita Devi', email: 'sunita@campus.edu', area: 'B-Block' },
            { name: 'Mohan Lal', email: 'mohan@campus.edu', area: 'Science Block' },
        ];

        for (const cleanerInfo of cleanerData) {
            const user = await prisma.user.upsert({
                where: { email: cleanerInfo.email },
                update: {},
                create: {
                    name: cleanerInfo.name,
                    email: cleanerInfo.email,
                    password: hashedPassword,
                    role: 'cleaner',
                    department: 'Housekeeping',
                    phone: '9876543220',
                    isActive: true,
                    isFirstLogin: false,
                    accessScope: 'college'
                }
            });

            await prisma.cleaner.upsert({
                where: { userId: user.id },
                update: {},
                create: {
                    userId: user.id,
                    assignedArea: cleanerInfo.area,
                    isAvailable: true
                }
            });
        }
        console.log(`✅ Created ${cleanerData.length} cleaner users`);

        console.log('\n🎉 Database seeding completed successfully!');
        console.log('\n📋 Login Credentials:');
        console.log('Admin: admin@campus.edu / password123');
        console.log('Warden: warden@campus.edu / password123');
        console.log('Student: atharva@campus.edu / password123');
        console.log('Student: john@campus.edu / password123');
        console.log('Technician: raj@campus.edu / password123');
        console.log('Technician: amit@campus.edu / password123');
        console.log('Technician: suresh@campus.edu / password123');
        console.log('Cleaner: ramesh@campus.edu / password123');
        console.log('Cleaner: sunita@campus.edu / password123');
        console.log('Cleaner: mohan@campus.edu / password123');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seed();
