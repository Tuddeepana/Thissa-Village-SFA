import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Beverages' },
      update: {},
      create: {
        name: 'Beverages',
        description: 'Soft drinks, juices, and beverages',
      },
    }),
    prisma.category.upsert({
      where: { name: 'Bakery' },
      update: {},
      create: {
        name: 'Bakery',
        description: 'Bread, cakes, and baked goods',
      },
    }),
    prisma.category.upsert({
      where: { name: 'Dairy' },
      update: {},
      create: {
        name: 'Dairy',
        description: 'Milk, cheese, and dairy products',
      },
    }),
    prisma.category.upsert({
      where: { name: 'Snacks' },
      update: {},
      create: {
        name: 'Snacks',
        description: 'Chips, cookies, and snacks',
      },
    }),
    prisma.category.upsert({
      where: { name: 'Food' },
      update: {},
      create: {
        name: 'Food',
        description: 'Rice, pasta, and food items',
      },
    }),
  ]);

  console.log('✅ Categories created');

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@vinopos.com' },
    update: {},
    create: {
      email: 'admin@vinopos.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'admin',
    },
  });

  console.log('✅ Admin user created');

  // Create sample products
  const beverageCategory = categories.find((c) => c.name === 'Beverages');
  const bakeryCategory = categories.find((c) => c.name === 'Bakery');
  const dairyCategory = categories.find((c) => c.name === 'Dairy');
  const snacksCategory = categories.find((c) => c.name === 'Snacks');
  const foodCategory = categories.find((c) => c.name === 'Food');

  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Coca Cola 500ml',
        description: 'Refreshing cola drink',
        barcode: '8901234567890',
        price: 150,
        cost: 100,
        stock: 45,
        minStock: 20,
        categoryId: beverageCategory!.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'White Bread',
        description: 'Fresh white bread',
        barcode: '8901234567895',
        price: 120,
        cost: 80,
        stock: 25,
        minStock: 15,
        categoryId: bakeryCategory!.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Fresh Milk 1L',
        description: 'Fresh full cream milk',
        barcode: '8901234567899',
        price: 280,
        cost: 210,
        stock: 40,
        minStock: 25,
        categoryId: dairyCategory!.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Potato Chips 100g',
        description: 'Crispy potato chips',
        barcode: '8901234567903',
        price: 120,
        cost: 80,
        stock: 55,
        minStock: 30,
        categoryId: snacksCategory!.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Basmati Rice 5kg',
        description: 'Premium basmati rice',
        barcode: '8901234567907',
        price: 1200,
        cost: 900,
        stock: 20,
        minStock: 10,
        categoryId: foodCategory!.id,
      },
    }),
  ]);

  console.log('✅ Sample products created');
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
