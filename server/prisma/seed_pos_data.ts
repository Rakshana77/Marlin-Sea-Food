import { PrismaClient, DailyRateStatus, MasterStatus } from '@prisma/client';
import { logger } from '../src/lib/logger';

const prisma = new PrismaClient();

async function seedPosData() {
  logger.info('🐟 Seeding POS Seafood Catalog for Squid, Crab, and Fish with Grades...');

  // 1. Categories
  const categories = [
    { name: 'Squid', description: 'Squid, Cuttlefish, and Cephalopods' },
    { name: 'Crab', description: 'Sea Crabs, Mud Crabs, and Shellfish' },
    { name: 'Fish', description: 'Freshwater and Marine Fin Fishes' }
  ];

  const catMap: Record<string, string> = {};
  for (const c of categories) {
    const record = await prisma.seafoodCategory.upsert({
      where: { name: c.name },
      update: { description: c.description, active: true },
      create: { name: c.name, description: c.description, active: true }
    });
    catMap[c.name] = record.id;
  }

  // 2. Grades
  const grades = [
    { name: 'Grade A', description: 'Export quality, top freshness tier' },
    { name: 'Grade B', description: 'Standard market quality tier' },
    { name: 'Grade C', description: 'Commercial / local tier' }
  ];

  const gradeMap: Record<string, string> = {};
  for (const g of grades) {
    const record = await prisma.seafoodGrade.upsert({
      where: { name: g.name },
      update: { description: g.description, active: true },
      create: { name: g.name, description: g.description, active: true }
    });
    gradeMap[g.name] = record.id;
  }

  // 3. Catalog items
  const catalog = [
    // SQUID
    {
      name: 'Squid (Grade A)',
      catName: 'Squid',
      rates: { 'Grade A': '470.00', 'Grade B': '390.00', 'Grade C': '310.00' },
      stock: { 'Grade A': '45.000', 'Grade B': '30.000', 'Grade C': '18.000' }
    },
    {
      name: 'Cuttlefish (Sepia)',
      catName: 'Squid',
      rates: { 'Grade A': '410.00', 'Grade B': '340.00', 'Grade C': '270.00' },
      stock: { 'Grade A': '35.000', 'Grade B': '22.000', 'Grade C': '14.000' }
    },
    {
      name: 'Octopus (Baby Whole)',
      catName: 'Squid',
      rates: { 'Grade A': '350.00', 'Grade B': '290.00', 'Grade C': '220.00' },
      stock: { 'Grade A': '25.000', 'Grade B': '15.000', 'Grade C': '10.000' }
    },

    // CRAB
    {
      name: 'Blue Sea Crab (Live)',
      catName: 'Crab',
      rates: { 'Grade A': '700.00', 'Grade B': '560.00', 'Grade C': '420.00' },
      stock: { 'Grade A': '38.000', 'Grade B': '24.000', 'Grade C': '15.000' }
    },
    {
      name: 'Mud Crab (Live)',
      catName: 'Crab',
      rates: { 'Grade A': '760.00', 'Grade B': '620.00', 'Grade C': '480.00' },
      stock: { 'Grade A': '28.000', 'Grade B': '18.000', 'Grade C': '12.000' }
    },
    {
      name: 'Three Spot Crab',
      catName: 'Crab',
      rates: { 'Grade A': '520.00', 'Grade B': '420.00', 'Grade C': '320.00' },
      stock: { 'Grade A': '22.000', 'Grade B': '14.000', 'Grade C': '8.000' }
    },

    // FISH
    {
      name: 'King Fish / Surmai',
      catName: 'Fish',
      rates: { 'Grade A': '850.00', 'Grade B': '720.00', 'Grade C': '580.00' },
      stock: { 'Grade A': '42.000', 'Grade B': '26.000', 'Grade C': '16.000' }
    },
    {
      name: 'Seer Fish (Vanjaram)',
      catName: 'Fish',
      rates: { 'Grade A': '950.00', 'Grade B': '810.00', 'Grade C': '660.00' },
      stock: { 'Grade A': '32.000', 'Grade B': '20.000', 'Grade C': '12.000' }
    },
    {
      name: 'White Pomfret',
      catName: 'Fish',
      rates: { 'Grade A': '820.00', 'Grade B': '690.00', 'Grade C': '540.00' },
      stock: { 'Grade A': '28.000', 'Grade B': '18.000', 'Grade C': '10.000' }
    },
    {
      name: 'Black Pomfret',
      catName: 'Fish',
      rates: { 'Grade A': '640.00', 'Grade B': '530.00', 'Grade C': '410.00' },
      stock: { 'Grade A': '24.000', 'Grade B': '16.000', 'Grade C': '9.000' }
    }
  ];

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (const item of catalog) {
    const categoryId = catMap[item.catName];

    let sf = await prisma.seafood.findFirst({
      where: { name: item.name }
    });

    if (!sf) {
      sf = await prisma.seafood.create({
        data: {
          name: item.name,
          categoryId,
          unit: 'KG',
          status: MasterStatus.ACTIVE
        }
      });
      logger.info(`Created Seafood: ${item.name}`);
    } else {
      sf = await prisma.seafood.update({
        where: { id: sf.id },
        data: {
          categoryId,
          unit: 'KG',
          status: MasterStatus.ACTIVE
        }
      });
    }

    // Seed Rates & Stock for each grade
    for (const [gradeName, rateStr] of Object.entries(item.rates)) {
      const gradeId = gradeMap[gradeName];
      if (!gradeId) continue;

      const stockKg = item.stock[gradeName as keyof typeof item.stock] || '20.000';

      // Upsert Stock
      await prisma.stock.upsert({
        where: {
          seafoodId_gradeId: {
            seafoodId: sf.id,
            gradeId
          }
        },
        update: { quantityKg: stockKg },
        create: {
          seafoodId: sf.id,
          gradeId,
          quantityKg: stockKg
        }
      });

      // Upsert Daily Rate
      const existingRate = await prisma.dailyRate.findFirst({
        where: {
          seafoodId: sf.id,
          gradeId,
          rateDate: today
        }
      });

      if (!existingRate) {
        await prisma.dailyRate.create({
          data: {
            seafoodId: sf.id,
            gradeId,
            rateDate: today,
            sellingRate: rateStr,
            purchaseRate: (parseFloat(rateStr) * 0.82).toFixed(2),
            status: DailyRateStatus.PUBLISHED
          }
        });
      } else {
        await prisma.dailyRate.update({
          where: { id: existingRate.id },
          data: {
            sellingRate: rateStr,
            purchaseRate: (parseFloat(rateStr) * 0.82).toFixed(2),
            status: DailyRateStatus.PUBLISHED
          }
        });
      }
    }
  }

  logger.info('✅ Clean POS Seed Data complete with Squid, Crab, and Fish!');
}

seedPosData()
  .catch((e) => {
    logger.error({ err: e }, 'Error seeding POS data');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
