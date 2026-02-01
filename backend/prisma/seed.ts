import { PrismaClient } from '@prisma/client';
// @ts-ignore
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@vinopos.com' },
    update: {},
    create: {
      email: 'admin@vinopos.com',
      password: hashedPassword,
      name: 'Admin User',
      nic: '123456789V',
      role: 'ADMIN',
      status: 'Active',
    },
  });
  console.log('✅ Admin user created:', adminUser.email);

  // Create cashier user
  const cashierPassword = await bcrypt.hash('cashier123', 10);
  const cashierUser = await prisma.user.upsert({
    where: { email: 'cashier@vinopos.com' },
    update: {},
    create: {
      email: 'cashier@vinopos.com',
      password: cashierPassword,
      name: 'Cashier User',
      nic: '987654321V',
      role: 'CASHIER',
      status: 'Active',
    },
  });
  console.log('✅ Cashier user created:', cashierUser.email);

  // Create restaurant tables (9 tables: 2 VIP + 7 Normal)
  // Check and create tables 1-9 if they don't exist
  const tableNames = ['Table 1', 'Table 2', 'Table 3', 'Table 4', 'Table 5', 'Table 6', 'Table 7', 'Table 8', 'Table 9'];
  
  for (let i = 0; i < tableNames.length; i++) {
    const tableName = tableNames[i];
    const tableType = i < 2 ? 'VIP' : 'NORMAL'; // First 2 are VIP, rest are NORMAL
    
    const existingTable = await prisma.restaurantTable.findUnique({
      where: { name: tableName },
    });

    if (!existingTable) {
      await prisma.restaurantTable.create({
        data: {
          name: tableName,
          table_type: tableType,
          table_status: 'FREE',
          quantity: 1,
        },
      });
      console.log(`✅ Created ${tableName} (${tableType})`);
    } else {
      console.log(`ℹ️  ${tableName} already exists`);
    }
  }

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📝 Default credentials:');
  console.log('   Email: admin@vinopos.com');
  console.log('   Password: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
