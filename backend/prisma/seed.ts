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
