import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        // Delete all related data first (though Cascade should handle it, explicit is safer sometimes)
        // status_history and notifications linked to complaints should be deleted by cascade if configured

        console.log('Deleting all complaints...');
        const result = await prisma.complaint.deleteMany({});

        console.log(`Deleted ${result.count} complaints.`);

        // reset assets status to 'operational'
        console.log('Resetting all assets to operational...');
        await prisma.asset.updateMany({
            data: {
                status: 'operational'
            }
        });

        console.log('✅ Fresh start successful!');
    } catch (error) {
        console.error('Error clearing data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
