import { PrismaClient, DailyRateStatus } from '@prisma/client';
import { logger } from '../src/lib/logger';

const prisma = new PrismaClient();

async function seedPosData() {
  logger.info('🐟 Seeding POS Seafood Catalog, Daily Rates, and Stock...');

  // 1. Get or create Categories
  const categories = await prisma.seafoodCategory.findMany();
  const getCatId = (name: string) => categories.find(c => c.name.toLowerCase().includes(name.toLowerCase()))?.id || categories[0].id;

  // 2. Get Grades
  const grades = await prisma.seafoodGrade.findMany();
  const gradeA = grades.find(g => g.name === 'Grade A') || grades[0];
  const gradeB = grades.find(g => g.name === 'Grade B') || grades[1];

  // 3. Define Stitch catalog items
  const catalog = [
    {
      name: 'Squid (Grade A)',
      catName: 'Squid',
      unit: 'KG',
      rate: '470.00',
      stockKg: '125.000',
      gradeId: gradeA.id
    },
    {
      name: 'Blue Sea Crab (Live)',
      catName: 'Crab',
      unit: 'KG',
      rate: '700.00',
      stockKg: '42.500',
      gradeId: gradeA.id
    },
    {
      name: 'Tiger Prawn (10/20)',
      catName: 'Prawn',
      unit: 'KG',
      rate: '650.00',
      stockKg: '8.200',
      gradeId: gradeA.id
    },
    {
      name: 'King Fish / Surmai',
      catName: 'Fish',
      unit: 'KG',
      rate: '850.00',
      stockKg: '31.000',
      gradeId: gradeA.id
    },
    {
      name: 'White Prawn (Vannamei)',
      catName: 'Prawn',
      unit: 'KG',
      rate: '440.00',
      stockKg: '64.000',
      gradeId: gradeA.id
    },
    {
      name: 'Rock Lobster (Prime)',
      catName: 'Crab',
      unit: 'KG',
      rate: '1700.00',
      stockKg: '0.000',
      gradeId: gradeA.id
    },
    {
      name: 'Octopus (Baby Whole)',
      catName: 'Squid',
      unit: 'KG',
      rate: '330.00',
      stockKg: '18.500',
      gradeId: gradeA.id
    },
    {
      name: 'Cuttlefish (Sepia)',
      catName: 'Squid',
      unit: 'KG',
      rate: '410.00',
      stockKg: '22.000',
      gradeId: gradeA.id
    }
  ];

  const todayStr = '2026-09-30';
  const todayDate = new Date(`${todayStr}T00:00:00.000Z`);

  for (const item of catalog) {
    const categoryId = getCatId(item.catName);

    // Upsert Seafood
    let sf = await prisma.seafood.findFirst({
      where: { name: item.name }
    });

    if (!sf) {
      sf = await prisma.seafood.create({
        data: {
          name: item.name,
          categoryId,
          unit: item.unit
        }
      });
      logger.info(`Created Seafood: ${item.name} (${sf.id})`);
    }

    // Upsert DailyRate for today
    const existingRate = await prisma.dailyRate.findFirst({
      where: {
        seafoodId: sf.id,
        gradeId: item.gradeId,
        rateDate: todayDate
      }
    });

    if (!existingRate) {
      await prisma.dailyRate.create({
        data: {
          seafoodId: sf.id,
          gradeId: item.gradeId,
          rateDate: todayDate,
          purchaseRate: (parseFloat(item.rate) * 0.8).toFixed(2),
          sellingRate: item.rate,
          status: DailyRateStatus.PUBLISHED
        }
      });
      logger.info(`Published DailyRate for ${item.name}: ₹${item.rate}/KG`);
    } else if (existingRate.status !== DailyRateStatus.PUBLISHED) {
      await prisma.dailyRate.update({
        where: { id: existingRate.id },
        data: {
          sellingRate: item.rate,
          status: DailyRateStatus.PUBLISHED
        }
      });
    }

    // Upsert Stock
    const existingStock = await prisma.stock.findUnique({
      where: {
        seafoodId_gradeId: {
          seafoodId: sf.id,
          gradeId: item.gradeId
        }
      }
    });

    if (!existingStock) {
      await prisma.stock.create({
        data: {
          seafoodId: sf.id,
          gradeId: item.gradeId,
          quantityKg: item.stockKg
        }
      });
      logger.info(`Initialized Stock for ${item.name}: ${item.stockKg} KG`);
    } else {
      await prisma.stock.update({
        where: { id: existingStock.id },
        data: {
          quantityKg: item.stockKg
        }
      });
    }
  }

  logger.info('✅ POS Seed Data complete!');
}

seedPosData()
  .catch((e) => {
    logger.error({ err: e }, 'Error seeding POS data');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
