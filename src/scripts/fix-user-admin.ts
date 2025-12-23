import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixUserAdminAssignment() {
    try {
        console.log('🔍 Checking for users with null createdBy...\n');

        // Find all users with null createdBy
        const usersWithoutAdmin = await prisma.user.findMany({
            where: {
                createdBy: null,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
            },
        });

        if (usersWithoutAdmin.length === 0) {
            console.log('✅ All users already have an assigned admin. No action needed.');
            return;
        }

        console.log(`Found ${usersWithoutAdmin.length} user(s) without an assigned admin:`);
        usersWithoutAdmin.forEach(user => {
            console.log(`  - ID: ${user.id}, Email: ${user.email}, Name: ${user.firstName} ${user.lastName}`);
        });
        console.log('');

        // Find the first admin
        const firstAdmin = await prisma.admin.findFirst({
            orderBy: {
                id: 'asc',
            },
        });

        if (!firstAdmin) {
            console.error('❌ Error: No admin found in the database. Please create an admin first.');
            return;
        }

        console.log(`📌 Assigning all users to admin: ${firstAdmin.email} (ID: ${firstAdmin.id})\n`);

        // Update all users with null createdBy
        const result = await prisma.user.updateMany({
            where: {
                createdBy: null,
            },
            data: {
                createdBy: firstAdmin.id,
            },
        });

        console.log(`✅ Successfully updated ${result.count} user(s)!`);
        console.log(`\nAll users are now assigned to admin: ${firstAdmin.email} (ID: ${firstAdmin.id})`);

    } catch (error) {
        console.error('❌ Error fixing user-admin assignment:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the script
fixUserAdminAssignment()
    .then(() => {
        console.log('\n✨ Script completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Script failed:', error);
        process.exit(1);
    });
