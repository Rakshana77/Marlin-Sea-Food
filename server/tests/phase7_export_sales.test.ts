import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import { prisma } from '../src/lib/prisma';
import { createApp } from '../src/app';
import { SaleService } from '../src/services/sale.service';
import { ExportCompanyService } from '../src/services/exportCompany.service';
import { DailyRateService } from '../src/services/dailyRate.service';
import { SeafoodService } from '../src/services/seafood.service';
import { SeafoodCategoryService } from '../src/services/seafoodCategory.service';
import { SeafoodGradeService } from '../src/services/seafoodGrade.service';
import { DayEndService } from '../src/services/dayEnd.service';
import { PnlService } from '../src/services/pnl.service';
import { AppError } from '../src/utils/appError';
import { signToken } from '../src/utils/jwt';
import { Prisma, PaymentMethod, PaymentStatus, SaleStatus, DayEndStatus, StockMovementType } from '@prisma/client';

describe('Phase 7 Export Billing & Export Sales Integration Tests', () => {
  let server: http.Server;
  const PORT = 5098;
  const BASE_URL = `http://localhost:${PORT}`;

  const saleService = new SaleService();
  const exportCompanyService = new ExportCompanyService();
  const seafoodService = new SeafoodService();
  const categoryService = new SeafoodCategoryService();
  const gradeService = new SeafoodGradeService();
  const dayEndService = new DayEndService();
  const pnlService = new PnlService();

  const testSuffix = Date.now().toString().slice(-6);

  let adminUser: any;
  let workerUser: any;
  let adminToken: string;
  let workerToken: string;

  let categoryId: string;
  let gradeAId: string;
  let gradeBId: string;
  let seafoodPrawnId: string;
  let seafoodSquidId: string;
  let seafoodCrabId: string;
  let seafoodInactiveId: string;

  let exportCompanyAlphaId: string;
  let exportCompanyBetaId: string;
  let exportCompanyInactiveId: string;

  const BUSINESS_DATE = '2026-10-06';
  const CLOSED_DATE = '2026-10-05';

  const getStock = async (seafoodId: string, gradeId: string) => {
    return prisma.stock.findUniqueOrThrow({
      where: { seafoodId_gradeId: { seafoodId, gradeId } }
    });
  };

  const seedStock = async (seafoodId: string, gradeId: string, quantityKg: number, averageCost: number) => {
    return prisma.stock.upsert({
      where: { seafoodId_gradeId: { seafoodId, gradeId } },
      create: {
        seafoodId,
        gradeId,
        quantityKg: new Prisma.Decimal(quantityKg.toString()),
        averageCost: new Prisma.Decimal(averageCost.toString()),
        totalValue: new Prisma.Decimal((quantityKg * averageCost).toString())
      },
      update: {
        quantityKg: new Prisma.Decimal(quantityKg.toString()),
        averageCost: new Prisma.Decimal(averageCost.toString()),
        totalValue: new Prisma.Decimal((quantityKg * averageCost).toString())
      }
    });
  };

  before(async () => {
    // 1. Start HTTP Server
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(PORT, () => resolve());
    });

    // 2. Fetch or create roles & users
    let adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
    if (!adminRole) {
      adminRole = await prisma.role.create({ data: { name: 'ADMIN', description: 'Admin' } });
    }
    let workerRole = await prisma.role.findUnique({ where: { name: 'WORKER' } });
    if (!workerRole) {
      workerRole = await prisma.role.create({ data: { name: 'WORKER', description: 'Worker' } });
    }

    adminUser = await prisma.user.create({
      data: {
        name: `Admin_Exp_${testSuffix}`,
        email: `admin_exp_${testSuffix}@marineseafoods.com`,
        passwordHash: 'dummyhash',
        roleId: adminRole.id
      }
    });

    workerUser = await prisma.user.create({
      data: {
        name: `Worker_Exp_${testSuffix}`,
        email: `worker_exp_${testSuffix}@marineseafoods.com`,
        passwordHash: 'dummyhash',
        roleId: workerRole.id
      }
    });

    adminToken = signToken({ id: adminUser.id, email: adminUser.email, role: 'ADMIN', name: adminUser.name });
    workerToken = signToken({ id: workerUser.id, email: workerUser.email, role: 'WORKER', name: workerUser.name });

    // 3. Setup Category & Grades
    const cat = await categoryService.createCategory({
      name: `Shellfish_Exp_${testSuffix}`,
      description: 'Export Grade Shellfish'
    });
    categoryId = cat.id;

    const grades = await gradeService.getGrades();
    const gradeA = grades.find((g) => g.name === 'Grade A') || (await gradeService.createGrade({ name: `Grade_A_Exp_${testSuffix}` }));
    const gradeB = grades.find((g) => g.name === 'Grade B') || (await gradeService.createGrade({ name: `Grade_B_Exp_${testSuffix}` }));
    gradeAId = gradeA.id;
    gradeBId = gradeB.id;

    // 4. Create Seafood Items
    const prawn = await seafoodService.createSeafood({
      name: `Tiger_Prawn_Exp_${testSuffix}`,
      categoryId,
      unit: 'KG'
    });
    seafoodPrawnId = prawn.id;

    const squid = await seafoodService.createSeafood({
      name: `Loligo_Squid_Exp_${testSuffix}`,
      categoryId,
      unit: 'KG'
    });
    seafoodSquidId = squid.id;

    const crab = await seafoodService.createSeafood({
      name: `Mud_Crab_Exp_${testSuffix}`,
      categoryId,
      unit: 'KG'
    });
    seafoodCrabId = crab.id;

    const inactiveSf = await seafoodService.createSeafood({
      name: `Inactive_Sf_Exp_${testSuffix}`,
      categoryId,
      unit: 'KG'
    });
    await prisma.seafood.update({
      where: { id: inactiveSf.id },
      data: { status: 'INACTIVE' }
    });
    seafoodInactiveId = inactiveSf.id;

    // 5. Seed stock with known quantities and WAC
    // Prawn: 1000 kg @ ₹400/kg
    await seedStock(seafoodPrawnId, gradeAId, 1000, 400);

    // Squid: 500 kg @ ₹250/kg
    await seedStock(seafoodSquidId, gradeAId, 500, 250);

    // Crab: 200 kg @ ₹300/kg
    await seedStock(seafoodCrabId, gradeBId, 200, 300);

    // 6. Setup Export Companies
    const compAlpha = await exportCompanyService.createExportCompany({
      companyName: `Global Marine Trading LLC ${testSuffix}`,
      contactPerson: 'Mr. John Davis',
      countryCode: '+971',
      mobileNumber: '501234567',
      email: `alpha_${testSuffix}@globalmarine.com`,
      address: 'Port Rashid, Wharf 4',
      taxNumber: 'TRN-10023456789'
    });
    exportCompanyAlphaId = compAlpha.id;

    const compBeta = await exportCompanyService.createExportCompany({
      companyName: `Oceanic Nippon Foods KK ${testSuffix}`,
      contactPerson: 'Kenji Sato',
      countryCode: '+81',
      mobileNumber: '355551234',
      email: `beta_${testSuffix}@oceanicnippon.jp`,
      address: 'Tsukiji Outer Market, Chuo-ku',
      taxNumber: 'JP-987654321'
    });
    exportCompanyBetaId = compBeta.id;

    const compInactive = await exportCompanyService.createExportCompany({
      companyName: `Inactive Export Corp ${testSuffix}`,
      contactPerson: 'Jane Doe',
      countryCode: '+1',
      mobileNumber: '4155552671',
      email: `inactive_${testSuffix}@exportcorp.com`
    });
    const updatedInactive = await exportCompanyService.updateExportCompany(compInactive.id, {
      status: 'INACTIVE'
    });
    exportCompanyInactiveId = updatedInactive.id;

    // 7. Seed Day End closing for CLOSED_DATE
    const closedDateObj = DailyRateService.parseDate(CLOSED_DATE);
    await prisma.dayEndClosing.upsert({
      where: { businessDate: closedDateObj },
      update: { closingStatus: DayEndStatus.CLOSED },
      create: {
        businessDate: closedDateObj,
        closingStatus: DayEndStatus.CLOSED,
        openingStockKg: 0,
        totalReceivedKg: 0,
        totalSoldKg: 0,
        totalWastageKg: 0,
        totalAdjustedKg: 0,
        expectedClosingStockKg: 0,
        actualPhysicalStockKg: 0,
        stockVarianceKg: 0,
        openingCash: 0,
        cashReceivedSales: 0,
        cashPaidPurchases: 0,
        cashPaidAdvances: 0,
        cashPaidExpenses: 0,
        expectedClosingCash: 0,
        actualPhysicalCash: 0,
        cashVariance: 0,
        closedById: adminUser.id,
        closedAt: new Date()
      }
    });
  });

  after(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  // =========================================================================
  // SECTION 1: Export Company Master Data
  // =========================================================================
  describe('Export Company Master Data Management', () => {
    test('1.1 Should list export companies with pagination', async () => {
      const res = await exportCompanyService.getExportCompanies({ limit: 10 });
      assert.ok(res.items.length >= 3);
      assert.ok(res.total >= 3);
      const foundAlpha = res.items.find((c) => c.id === exportCompanyAlphaId);
      assert.ok(foundAlpha);
      assert.strictEqual(foundAlpha.countryCode, '+971');
      assert.strictEqual(foundAlpha.status, 'ACTIVE');
    });

    test('1.2 Should prevent duplicate export company name', async () => {
      await assert.rejects(
        async () => {
          await exportCompanyService.createExportCompany({
            companyName: `Global Marine Trading LLC ${testSuffix}`,
            countryCode: '+971'
          });
        },
        (err: any) => {
          assert.strictEqual(err.statusCode, 409);
          assert.strictEqual(err.code, 'DUPLICATE_EXPORT_COMPANY');
          return true;
        }
      );
    });

    test('1.3 Should update export company details', async () => {
      const updated = await exportCompanyService.updateExportCompany(exportCompanyAlphaId, {
        contactPerson: 'Mr. Tariq Al-Mansoor',
        mobileNumber: '509998877'
      });
      assert.strictEqual(updated.contactPerson, 'Mr. Tariq Al-Mansoor');
      assert.strictEqual(updated.mobileNumber, '509998877');
    });

    test('1.4 Should prevent renaming export company to another existing company name', async () => {
      await assert.rejects(
        async () => {
          await exportCompanyService.updateExportCompany(exportCompanyAlphaId, {
            companyName: `Oceanic Nippon Foods KK ${testSuffix}`
          });
        },
        (err: any) => {
          assert.strictEqual(err.statusCode, 409);
          assert.strictEqual(err.code, 'DUPLICATE_EXPORT_COMPANY');
          return true;
        }
      );
    });

    test('1.5 Should reject soft/hard delete of company with historical sales', async () => {
      // Create a test company and a sale referencing it
      const tempCompany = await exportCompanyService.createExportCompany({
        companyName: `Temp Deletion Test LLC ${testSuffix}`,
        countryCode: '+65'
      });

      // Create an export sale referencing tempCompany
      await saleService.createSale({
        saleType: 'EXPORT',
        exportCompanyId: tempCompany.id,
        saleDate: BUSINESS_DATE,
        items: [
          {
            seafoodId: seafoodPrawnId,
            gradeId: gradeAId,
            quantityKg: 10,
            unitPrice: 500
          }
        ],
        payments: [
          {
            paymentMethod: PaymentMethod.BANK_TRANSFER,
            amount: 5000
          }
        ]
      }, adminUser.id);

      // Attempt to delete company -> must be rejected with 409 EXPORT_COMPANY_HAS_SALES
      await assert.rejects(
        async () => {
          await exportCompanyService.deleteExportCompany(tempCompany.id);
        },
        (err: any) => {
          assert.strictEqual(err.statusCode, 409);
          assert.strictEqual(err.code, 'EXPORT_COMPANY_HAS_SALES');
          return true;
        }
      );
    });
  });

  // =========================================================================
  // SECTION 2: Export Sale Creation, Stock Deduction & WAC COGS Snapshot
  // =========================================================================
  describe('Export Sale Creation, Multi-Item & WAC Engine Integration', () => {
    test('2.1 Successfully creates multi-item export sale with stock deduction and WAC COGS snapshot', async () => {
      const stockPrawnBefore = await getStock(seafoodPrawnId, gradeAId);
      const stockSquidBefore = await getStock(seafoodSquidId, gradeAId);

      const sale = await saleService.createSale({
        saleType: 'EXPORT',
        exportCompanyId: exportCompanyAlphaId,
        exportRef: `EXP-CONTAINER-01-${testSuffix}`,
        dispatchDate: '2026-10-10',
        destinationPort: 'Jebel Ali, Dubai',
        saleDate: BUSINESS_DATE,
        items: [
          {
            seafoodId: seafoodPrawnId,
            gradeId: gradeAId,
            quantityKg: 100, // 100 kg @ ₹600 = ₹60,000 (COGS @ 400 = ₹40,000)
            unitPrice: 600
          },
          {
            seafoodId: seafoodSquidId,
            gradeId: gradeAId,
            quantityKg: 50,  // 50 kg @ ₹350 = ₹17,500 (COGS @ 250 = ₹12,500)
            unitPrice: 350
          }
        ],
        payments: [
          {
            paymentMethod: PaymentMethod.BANK_TRANSFER,
            amount: 77500 // Full payment ₹77,500
          }
        ]
      }, adminUser.id);

      // Assert Sale Metadata
      assert.strictEqual(sale.saleType, 'EXPORT');
      assert.strictEqual(sale.exportCompanyId, exportCompanyAlphaId);
      assert.strictEqual(sale.exportCompany?.companyName, `Global Marine Trading LLC ${testSuffix}`);
      assert.strictEqual(sale.status, SaleStatus.COMPLETED);
      assert.strictEqual(sale.paymentStatus, PaymentStatus.PAID);
      assert.strictEqual(sale.totalKg, '150.000');
      assert.strictEqual(sale.grandTotal, '77500.00');
      assert.strictEqual(sale.amountPaid, '77500.00');
      assert.strictEqual(sale.outstandingAmount, '0.00');
      assert.strictEqual(sale.exportRef, `EXP-CONTAINER-01-${testSuffix}`);
      assert.strictEqual(sale.destinationPort, 'Jebel Ali, Dubai');

      // Assert COGS & Profit
      // Total COGS = 40,000 + 12,500 = 52,500
      assert.strictEqual(sale.totalCogs, '52500.00');
      // Gross Profit = 77,500 - 52,500 = 25,000
      assert.strictEqual(sale.totalGrossProfit, '25000.00');

      // Assert Item level COGS snapshots
      assert.strictEqual(sale.items.length, 2);
      const prawnItem = sale.items.find((i) => i.seafoodId === seafoodPrawnId)!;
      assert.strictEqual(prawnItem.quantityKg, '100.000');
      assert.strictEqual(prawnItem.cogsPerKg, '400.00');
      assert.strictEqual(prawnItem.cogsAmount, '40000.00');
      assert.strictEqual(prawnItem.grossProfit, '20000.00');

      const squidItem = sale.items.find((i) => i.seafoodId === seafoodSquidId)!;
      assert.strictEqual(squidItem.quantityKg, '50.000');
      assert.strictEqual(squidItem.cogsPerKg, '250.00');
      assert.strictEqual(squidItem.cogsAmount, '12500.00');
      assert.strictEqual(squidItem.grossProfit, '5000.00');

      // Verify Stock Reduction
      const stockPrawnAfter = await getStock(seafoodPrawnId, gradeAId);
      const stockSquidAfter = await getStock(seafoodSquidId, gradeAId);

      const expectedPrawnKg = new Prisma.Decimal(stockPrawnBefore.quantityKg).sub(100).toFixed(3);
      const expectedSquidKg = new Prisma.Decimal(stockSquidBefore.quantityKg).sub(50).toFixed(3);
      assert.strictEqual(new Prisma.Decimal(stockPrawnAfter.quantityKg).toFixed(3), expectedPrawnKg);
      assert.strictEqual(new Prisma.Decimal(stockSquidAfter.quantityKg).toFixed(3), expectedSquidKg);

      // Verify StockMovement records
      const prawnMovements = await prisma.stockMovement.findMany({
        where: {
          referenceId: sale.id,
          seafoodId: seafoodPrawnId
        }
      });
      assert.strictEqual(prawnMovements.length, 1);
      assert.strictEqual(prawnMovements[0].movementType, StockMovementType.EXPORT);
      assert.strictEqual(new Prisma.Decimal(prawnMovements[0].quantityKg).toFixed(3), '-100.000');
      assert.strictEqual(new Prisma.Decimal(prawnMovements[0].unitCost || 0).toFixed(2), '400.00');
    });

    test('2.2 Historical COGS snapshot remains immutable even if current WAC changes later', async () => {
      // 1. Create export sale capturing current WAC (₹400/kg)
      const sale = await saleService.createSale({
        saleType: 'EXPORT',
        exportCompanyId: exportCompanyAlphaId,
        saleDate: BUSINESS_DATE,
        items: [
          {
            seafoodId: seafoodPrawnId,
            gradeId: gradeAId,
            quantityKg: 20,
            unitPrice: 650
          }
        ]
      }, adminUser.id);

      const itemSnapshot = sale.items[0];
      assert.strictEqual(itemSnapshot.cogsPerKg, '400.00');
      assert.strictEqual(itemSnapshot.cogsAmount, '8000.00');

      // 2. Change WAC drastically via expensive intake (e.g., 500 kg @ ₹800/kg)
      await seedStock(seafoodPrawnId, gradeAId, 1500, 800);

      // 3. Current stock WAC has increased
      const updatedStock = await getStock(seafoodPrawnId, gradeAId);
      assert.ok(parseFloat(new Prisma.Decimal(updatedStock.averageCost || 0).toString()) > 400);

      // 4. Reload historical sale — COGS snapshot must remain strictly 400.00!
      const reloadedSale = await saleService.getSaleById(sale.id);
      assert.strictEqual(reloadedSale.items[0].cogsPerKg, '400.00');
      assert.strictEqual(reloadedSale.items[0].cogsAmount, '8000.00');
      assert.strictEqual(reloadedSale.totalCogs, '8000.00');
    });
  });

  // =========================================================================
  // SECTION 3: Validation, Negative Stock Prevention & Guard Rails
  // =========================================================================
  describe('Export Sale Validation & Atomicity Guard Rails', () => {
    test('3.1 Rejects export sale with insufficient stock and performs complete atomic rollback', async () => {
      const stockCrabBefore = await getStock(seafoodCrabId, gradeBId);
      const crabAvailable = parseFloat(stockCrabBefore.quantityKg.toString());

      // Attempt to sell 500 kg when only ~200 kg is available
      await assert.rejects(
        async () => {
          await saleService.createSale({
            saleType: 'EXPORT',
            exportCompanyId: exportCompanyAlphaId,
            saleDate: BUSINESS_DATE,
            items: [
              {
                seafoodId: seafoodCrabId,
                gradeId: gradeBId,
                quantityKg: crabAvailable + 100,
                unitPrice: 500
              }
            ]
          }, adminUser.id);
        },
        (err: any) => {
          assert.strictEqual(err.statusCode, 400);
          assert.strictEqual(err.code, 'INSUFFICIENT_STOCK');
          return true;
        }
      );

      // Verify stock was not touched
      const stockCrabAfter = await getStock(seafoodCrabId, gradeBId);
      assert.strictEqual(stockCrabAfter.quantityKg.toString(), stockCrabBefore.quantityKg.toString());
    });

    test('3.2 Rejects export sale with inactive export company', async () => {
      await assert.rejects(
        async () => {
          await saleService.createSale({
            saleType: 'EXPORT',
            exportCompanyId: exportCompanyInactiveId,
            saleDate: BUSINESS_DATE,
            items: [
              {
                seafoodId: seafoodPrawnId,
                gradeId: gradeAId,
                quantityKg: 10,
                unitPrice: 600
              }
            ]
          }, adminUser.id);
        },
        (err: any) => {
          assert.strictEqual(err.statusCode, 400);
          assert.strictEqual(err.code, 'EXPORT_COMPANY_INACTIVE');
          return true;
        }
      );
    });

    test('3.3 Rejects export sale with inactive seafood item', async () => {
      await assert.rejects(
        async () => {
          await saleService.createSale({
            saleType: 'EXPORT',
            exportCompanyId: exportCompanyAlphaId,
            saleDate: BUSINESS_DATE,
            items: [
              {
                seafoodId: seafoodInactiveId,
                gradeId: gradeAId,
                quantityKg: 10,
                unitPrice: 600
              }
            ]
          }, adminUser.id);
        },
        (err: any) => {
          assert.strictEqual(err.statusCode, 400);
          assert.strictEqual(err.code, 'SEAFOOD_INACTIVE');
          return true;
        }
      );
    });

    test('3.4 Rejects export sale on closed business date (Phase 5 integration)', async () => {
      await assert.rejects(
        async () => {
          await saleService.createSale({
            saleType: 'EXPORT',
            exportCompanyId: exportCompanyAlphaId,
            saleDate: CLOSED_DATE,
            items: [
              {
                seafoodId: seafoodPrawnId,
                gradeId: gradeAId,
                quantityKg: 10,
                unitPrice: 600
              }
            ]
          }, adminUser.id);
        },
        (err: any) => {
          assert.strictEqual(err.statusCode, 400);
          assert.strictEqual(err.code, 'DAY_ALREADY_CLOSED');
          return true;
        }
      );
    });

    test('3.5 Rejects export sale with zero or negative quantity', async () => {
      await assert.rejects(
        async () => {
          await saleService.createSale({
            saleType: 'EXPORT',
            exportCompanyId: exportCompanyAlphaId,
            saleDate: BUSINESS_DATE,
            items: [
              {
                seafoodId: seafoodPrawnId,
                gradeId: gradeAId,
                quantityKg: 0,
                unitPrice: 600
              }
            ]
          }, adminUser.id);
        },
        (err: any) => {
          assert.strictEqual(err.statusCode, 400);
          return true;
        }
      );
    });
  });

  // =========================================================================
  // SECTION 4: Credit, Partial Payments & Outstanding Receivables
  // =========================================================================
  describe('Export Payment & Outstanding Receivables', () => {
    test('4.1 Supports credit export sale (unpaid) with full outstanding balance', async () => {
      const sale = await saleService.createSale({
        saleType: 'EXPORT',
        exportCompanyId: exportCompanyBetaId,
        saleDate: BUSINESS_DATE,
        items: [
          {
            seafoodId: seafoodSquidId,
            gradeId: gradeAId,
            quantityKg: 20,
            unitPrice: 400 // Total ₹8,000
          }
        ],
        payments: [] // Pure credit sale
      }, adminUser.id);

      assert.strictEqual(sale.paymentStatus, PaymentStatus.UNPAID);
      assert.strictEqual(sale.grandTotal, '8000.00');
      assert.strictEqual(sale.amountPaid, '0.00');
      assert.strictEqual(sale.outstandingAmount, '8000.00');
    });

    test('4.2 Supports partial payment on export sale with accurate remaining outstanding', async () => {
      const sale = await saleService.createSale({
        saleType: 'EXPORT',
        exportCompanyId: exportCompanyBetaId,
        saleDate: BUSINESS_DATE,
        items: [
          {
            seafoodId: seafoodSquidId,
            gradeId: gradeAId,
            quantityKg: 25,
            unitPrice: 400 // Total ₹10,000
          }
        ],
        payments: [
          {
            paymentMethod: PaymentMethod.BANK_TRANSFER,
            amount: 4000 // Partial payment of ₹4,000
          }
        ]
      }, adminUser.id);

      assert.strictEqual(sale.paymentStatus, PaymentStatus.PARTIALLY_PAID);
      assert.strictEqual(sale.grandTotal, '10000.00');
      assert.strictEqual(sale.amountPaid, '4000.00');
      assert.strictEqual(sale.outstandingAmount, '6000.00');
    });
  });

  // =========================================================================
  // SECTION 5: Idempotency & Concurrent Stock Safety
  // =========================================================================
  describe('Idempotency & Concurrent Stock Safety', () => {
    test('5.1 Idempotency key retry returns existing sale without duplicate records or double stock deduction', async () => {
      const idempotencyKey = `EXP-IDEMPOTENCY-${Date.now()}`;
      const stockBefore = await getStock(seafoodCrabId, gradeBId);

      const payload = {
        saleType: 'EXPORT' as const,
        exportCompanyId: exportCompanyAlphaId,
        saleDate: BUSINESS_DATE,
        idempotencyKey,
        items: [
          {
            seafoodId: seafoodCrabId,
            gradeId: gradeBId,
            quantityKg: 15,
            unitPrice: 450
          }
        ]
      };

      // Request 1
      const sale1 = await saleService.createSale(payload, adminUser.id);

      // Request 2 with same idempotencyKey (simulating mobile retry / network timeout)
      const sale2 = await saleService.createSale(payload, adminUser.id);

      assert.strictEqual(sale1.id, sale2.id, 'Must return the identical sale record');
      assert.strictEqual(sale1.invoiceNumber, sale2.invoiceNumber);

      // Verify stock was reduced ONLY once (15 kg, not 30 kg)
      const stockAfter = await getStock(seafoodCrabId, gradeBId);
      const expectedKg = new Prisma.Decimal(stockBefore.quantityKg).sub(15).toFixed(3);
      assert.strictEqual(new Prisma.Decimal(stockAfter.quantityKg).toFixed(3), expectedKg);
    });

    test('5.2 Two concurrent export sales cannot overdraw stock', async () => {
      // 1. Create a dedicated seafood item with exactly 100 kg stock
      const tempSeafood = await seafoodService.createSeafood({
        name: `Concurrent_Sf_${testSuffix}`,
        categoryId,
        unit: 'KG'
      });
      await seedStock(tempSeafood.id, gradeAId, 100, 200);

      // Request A requests 80 kg, Request B requests 50 kg concurrently (Total 130 kg > 100 kg)
      const payloadA = {
        saleType: 'EXPORT' as const,
        exportCompanyId: exportCompanyAlphaId,
        saleDate: BUSINESS_DATE,
        items: [{ seafoodId: tempSeafood.id, gradeId: gradeAId, quantityKg: 80, unitPrice: 300 }]
      };
      const payloadB = {
        saleType: 'EXPORT' as const,
        exportCompanyId: exportCompanyAlphaId,
        saleDate: BUSINESS_DATE,
        items: [{ seafoodId: tempSeafood.id, gradeId: gradeAId, quantityKg: 50, unitPrice: 300 }]
      };

      const results = await Promise.allSettled([
        saleService.createSale(payloadA, adminUser.id),
        saleService.createSale(payloadB, adminUser.id)
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      // Exactly one must succeed and one must be rejected with INSUFFICIENT_STOCK
      assert.strictEqual(fulfilled.length, 1, 'Exactly one concurrent sale must succeed');
      assert.strictEqual(rejected.length, 1, 'The other concurrent sale must fail due to insufficient stock');

      const failedReason: any = (rejected[0] as PromiseRejectedResult).reason;
      assert.strictEqual(failedReason.code, 'INSUFFICIENT_STOCK');

      // Stock must remain positive and equal to 100 - winning quantity (either 20 kg or 50 kg)
      const finalStock = await getStock(tempSeafood.id, gradeAId);
      const finalQty = parseFloat(finalStock.quantityKg.toString());
      assert.ok(finalQty >= 0, 'Stock must never become negative');
      assert.ok([20, 50].includes(finalQty));
    });
  });

  // =========================================================================
  // SECTION 6: Export Sale Cancellation & Reversal
  // =========================================================================
  describe('Export Sale Cancellation & Stock Reversal', () => {
    test('6.1 Canceling an export sale restores stock and creates RETURN StockMovement', async () => {
      // 1. Create export sale of 30 kg
      const stockBefore = await getStock(seafoodCrabId, gradeBId);
      const sale = await saleService.createSale({
        saleType: 'EXPORT',
        exportCompanyId: exportCompanyAlphaId,
        saleDate: BUSINESS_DATE,
        items: [
          {
            seafoodId: seafoodCrabId,
            gradeId: gradeBId,
            quantityKg: 30,
            unitPrice: 500
          }
        ],
        payments: [
          {
            paymentMethod: PaymentMethod.BANK_TRANSFER,
            amount: 15000
          }
        ]
      }, adminUser.id);

      // Verify stock was reduced
      const stockAfterSale = await getStock(seafoodCrabId, gradeBId);
      assert.strictEqual(
        new Prisma.Decimal(stockAfterSale.quantityKg).toFixed(3),
        new Prisma.Decimal(stockBefore.quantityKg).sub(30).toFixed(3)
      );

      // 2. Cancel export sale
      const cancelledSale = await saleService.cancelSale(sale.id, adminUser.id);
      assert.strictEqual(cancelledSale.status, SaleStatus.CANCELLED);

      // 3. Verify stock was restored to original quantity
      const stockAfterCancel = await getStock(seafoodCrabId, gradeBId);
      assert.strictEqual(
        new Prisma.Decimal(stockAfterCancel.quantityKg).toFixed(3),
        new Prisma.Decimal(stockBefore.quantityKg).toFixed(3)
      );

      // 4. Verify reversal StockMovement
      const returnMovements = await prisma.stockMovement.findMany({
        where: {
          referenceId: sale.id,
          movementType: StockMovementType.RETURN
        }
      });
      assert.strictEqual(returnMovements.length, 1);
      assert.strictEqual(new Prisma.Decimal(returnMovements[0].quantityKg).toFixed(3), '30.000');
    });
  });

  // =========================================================================
  // SECTION 7: P&L Engine and Day-End Reporting Integration
  // =========================================================================
  describe('P&L Engine & Day-End Reporting Integration', () => {
    test('7.1 Export sales automatically flow into P&L revenue, COGS and breakdowns without double counting', async () => {
      const pnl = await pnlService.getDailyPnl(BUSINESS_DATE);

      // Net revenue, COGS, and GP must include completed export sales
      assert.ok(parseFloat(pnl.revenue.netRevenue) > 0);
      assert.ok(parseFloat(pnl.cogs.totalCogs) > 0);
      assert.ok(parseFloat(pnl.grossProfit.grossProfit) > 0);

      // Verify byExportCompany breakdown
      assert.ok(pnl.breakdowns?.byExportCompany);
      const alphaBreakdown = pnl.breakdowns.byExportCompany.find(
        (e) => e.exportCompanyId === exportCompanyAlphaId
      );
      assert.ok(alphaBreakdown, 'P&L must include alpha export company breakdown');
      assert.ok(parseFloat(alphaBreakdown.revenue) > 0);
      assert.ok(parseFloat(alphaBreakdown.cogs) > 0);
      assert.ok(parseFloat(alphaBreakdown.grossProfit) > 0);

      // Verify bySaleType breakdown
      assert.ok(pnl.breakdowns?.bySaleType);
      const exportTypeBreakdown = pnl.breakdowns.bySaleType.find((s) => s.saleType === 'EXPORT');
      assert.ok(exportTypeBreakdown, 'P&L must include EXPORT sale type breakdown');
      assert.ok(parseFloat(exportTypeBreakdown.revenue) > 0);
      assert.ok(parseFloat(exportTypeBreakdown.cogs) > 0);
    });

    test('7.2 Day End preview distinguishes domestic sales vs export sales', async () => {
      const dayEnd = await dayEndService.getDayEndPreview(BUSINESS_DATE);

      assert.ok(dayEnd.salesSummary);
      assert.ok(parseFloat(dayEnd.salesSummary.grossSales) > 0);
      assert.ok(typeof dayEnd.salesSummary.domesticSales === 'string');
      assert.ok(typeof dayEnd.salesSummary.exportSales === 'string');
      assert.ok(parseFloat(dayEnd.salesSummary.exportSales) > 0);

      // Total gross sales equals domestic + export sales
      const sum = new Prisma.Decimal(dayEnd.salesSummary.domesticSales)
        .add(dayEnd.salesSummary.exportSales)
        .toFixed(2);
      assert.strictEqual(sum, dayEnd.salesSummary.grossSales);
    });
  });

  // =========================================================================
  // SECTION 8: RBAC & HTTP REST API Security
  // =========================================================================
  describe('RBAC & HTTP REST API Verification', () => {
    test('8.1 Worker is forbidden (403) from creating or deleting export companies', async () => {
      // POST /api/export-companies
      const createRes = await fetch(`${BASE_URL}/api/export-companies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${workerToken}`
        },
        body: JSON.stringify({
          companyName: `Forbidden LLC ${testSuffix}`,
          countryCode: '+44'
        })
      });
      assert.strictEqual(createRes.status, 403, 'Worker role must receive 403 Forbidden for company creation');

      // DELETE /api/export-companies/:id
      const deleteRes = await fetch(`${BASE_URL}/api/export-companies/${exportCompanyAlphaId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${workerToken}` }
      });
      assert.strictEqual(deleteRes.status, 403, 'Worker role must receive 403 Forbidden for company deletion');
    });

    test('8.2 Admin successfully creates export company via HTTP REST API (201)', async () => {
      const res = await fetch(`${BASE_URL}/api/export-companies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          companyName: `Pacific Rim Trading Corp ${testSuffix}`,
          contactPerson: 'David Chen',
          countryCode: '+852',
          mobileNumber: '91234567',
          email: `chen_${testSuffix}@pacificrim.hk`
        })
      });
      assert.strictEqual(res.status, 201);
      const json = (await res.json()) as any;
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.data.companyName, `Pacific Rim Trading Corp ${testSuffix}`);
      assert.strictEqual(json.data.countryCode, '+852');
    });

    test('8.3 Both Admin and Worker can query export companies list (200)', async () => {
      const workerRes = await fetch(`${BASE_URL}/api/export-companies`, {
        headers: { Authorization: `Bearer ${workerToken}` }
      });
      assert.strictEqual(workerRes.status, 200);
      const workerJson = (await workerRes.json()) as any;
      assert.strictEqual(workerJson.success, true);
      assert.ok(workerJson.data.length > 0);

      const adminRes = await fetch(`${BASE_URL}/api/export-companies`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(adminRes.status, 200);
    });

    test('8.4 Admin creates and filters export sale via HTTP REST API', async () => {
      const res = await fetch(`${BASE_URL}/api/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          saleType: 'EXPORT',
          exportCompanyId: exportCompanyAlphaId,
          saleDate: BUSINESS_DATE,
          destinationPort: 'Singapore Port',
          items: [
            {
              seafoodId: seafoodPrawnId,
              gradeId: gradeAId,
              quantityKg: 20,
              unitPrice: 620
            }
          ]
        })
      });
      assert.strictEqual(res.status, 201);
      const json = (await res.json()) as any;
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.data.saleType, 'EXPORT');
      assert.strictEqual(json.data.destinationPort, 'Singapore Port');

      // Query sales list filtering by saleType=EXPORT
      const listRes = await fetch(`${BASE_URL}/api/sales?saleType=EXPORT&limit=10`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(listRes.status, 200);
      const listJson = (await listRes.json()) as any;
      assert.strictEqual(listJson.success, true);
      assert.ok(listJson.data.length > 0);
      for (const s of listJson.data) {
        assert.strictEqual(s.saleType, 'EXPORT');
      }
    });

    test('8.5 Unauthenticated request returns 401 Unauthorized', async () => {
      const res = await fetch(`${BASE_URL}/api/export-companies`);
      assert.strictEqual(res.status, 401);
    });
  });
});
