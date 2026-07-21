import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.roomType.findFirst({
    where: { type: 'Normal' },
  });

  if (!existing) {
    await prisma.roomType.create({
      data: {
        type: 'Normal',
        price_full_day: 5000,
        price_short_time: 5000,
        description: 'Default Normal Room Type',
      },
    });
    console.log('✅ Created default Room Type: Normal (FullDay: 5000, Short Time: 5000)');
  } else {
    console.log('ℹ️ Default Room Type already exists.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
