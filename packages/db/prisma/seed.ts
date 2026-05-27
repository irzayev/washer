import { PrismaClient, UserRole, VatMode } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const branch = await prisma.branch.upsert({
    where: { code: 'MAIN' },
    update: {},
    create: {
      code: 'MAIN',
      name: 'Главный филиал',
      address: 'Baku, Azerbaijan',
      timezone: 'Asia/Baku',
      vatMode: VatMode.INCLUDED,
      vatRate: 18,
      currency: 'AZN',
    },
  });

  await prisma.box.createMany({
    data: [
      { branchId: branch.id, name: 'Бокс 1' },
      { branchId: branch.id, name: 'Бокс 2' },
      { branchId: branch.id, name: 'Бокс 3' },
    ],
    skipDuplicates: true,
  });

  const passwordHash = await argon2.hash('Admin123!', { type: argon2.argon2id });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@washer.local' },
    update: {},
    create: {
      email: 'admin@washer.local',
      phone: '+994500000001',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      branchId: branch.id,
    },
  });

  const managerHash = await argon2.hash('Manager123!', { type: argon2.argon2id });
  await prisma.user.upsert({
    where: { email: 'manager@washer.local' },
    update: {},
    create: {
      email: 'manager@washer.local',
      phone: '+994500000002',
      passwordHash: managerHash,
      firstName: 'Manager',
      lastName: 'User',
      role: UserRole.MANAGER,
      branchId: branch.id,
    },
  });

  const categories = [
    { name: 'Мойка', slug: 'wash' },
    { name: 'Полировка', slug: 'polish' },
    { name: 'Химчистка', slug: 'detailing' },
    { name: 'Керамика', slug: 'ceramic' },
    { name: 'Антидождь', slug: 'rain-repellent' },
  ];

  for (const c of categories) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
  }

  const wash = await prisma.category.findUnique({ where: { slug: 'wash' } });
  const polish = await prisma.category.findUnique({ where: { slug: 'polish' } });

  if (wash) {
    await prisma.service.createMany({
      data: [
        { branchId: branch.id, categoryId: wash.id, name: 'Экспресс-мойка', basePrice: 15, durationMin: 20 },
        { branchId: branch.id, categoryId: wash.id, name: 'Стандарт мойка', basePrice: 25, durationMin: 40 },
        { branchId: branch.id, categoryId: wash.id, name: 'Premium Wash', basePrice: 45, durationMin: 60 },
      ],
      skipDuplicates: true,
    });
  }

  if (polish) {
    await prisma.service.createMany({
      data: [
        { branchId: branch.id, categoryId: polish.id, name: 'Полировка кузова', basePrice: 180, durationMin: 240 },
        { branchId: branch.id, categoryId: polish.id, name: 'Полировка фар', basePrice: 35, durationMin: 60 },
      ],
      skipDuplicates: true,
    });
  }

  await prisma.inventoryItem.createMany({
    data: [
      { branchId: branch.id, sku: 'SHAMPOO-1', name: 'Шампунь для мойки', unit: 'ml', stockQty: 50000, minStock: 5000, costAvg: 0.02 },
      { branchId: branch.id, sku: 'WAX-1', name: 'Воск', unit: 'ml', stockQty: 10000, minStock: 1000, costAvg: 0.08 },
      { branchId: branch.id, sku: 'CLOTH-1', name: 'Микрофибра', unit: 'pcs', stockQty: 200, minStock: 20, costAvg: 1.5 },
    ],
    skipDuplicates: true,
  });

  console.log('Seed done.');
  console.log('Admin login:   admin@washer.local / Admin123!');
  console.log('Manager login: manager@washer.local / Manager123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
