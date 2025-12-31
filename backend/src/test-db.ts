import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  console.log('🔍 Testing database connection...\n');

  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected successfully!\n');

    // Count records
    const usersCount = await prisma.user.count();
    const categoriesCount = await prisma.category.count();
    const productsCount = await prisma.product.count();
    const invoicesCount = await prisma.invoice.count();

    console.log('📊 Database Statistics:');
    console.log(`   Users: ${usersCount}`);
    console.log(`   Categories: ${categoriesCount}`);
    console.log(`   Products: ${productsCount}`);
    console.log(`   Invoices: ${invoicesCount}`);
    console.log('');

    // List categories
    if (categoriesCount > 0) {
      console.log('📁 Categories:');
      const categories = await prisma.category.findMany({
        include: {
          _count: {
            select: { products: true },
          },
        },
      });
      categories.forEach((cat) => {
        console.log(`   - ${cat.name} (${cat._count.products} products)`);
      });
      console.log('');
    }

    // List products
    if (productsCount > 0) {
      console.log('📦 Products:');
      const products = await prisma.product.findMany({
        include: { category: true },
        take: 5,
      });
      products.forEach((prod) => {
        // console.log(`   - ${prod.name} (${prod.category.name}) - Rs. ${prod.price} - Stock: ${prod.stock}`);
      });
      console.log('');
    }

    console.log('✨ Database is ready to use!\n');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.error('\nPlease check:');
    console.error('1. PostgreSQL is running');
    console.error('2. Database "vinopos_db" exists');
    console.error('3. .env DATABASE_URL is correct');
    console.error('4. Migrations have been run (npm run prisma:migrate)\n');
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
