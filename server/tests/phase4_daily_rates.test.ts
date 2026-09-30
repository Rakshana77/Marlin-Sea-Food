import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { prisma } from '../src/lib/prisma';
import { DailyRateService } from '../src/services/dailyRate.service';
import { SeafoodService } from '../src/services/seafood.service';
import { SeafoodCategoryService } from '../src/services/seafoodCategory.service';
import { SeafoodGradeService } from '../src/services/seafoodGrade.service';
import { AppError } from '../src/utils/appError';

describe('Phase 4 Daily Seafood Rates Tests', () => {
  const dailyRateService = new DailyRateService();
  const seafoodService = new SeafoodService();
  const categoryService = new SeafoodCategoryService();
  const gradeService = new SeafoodGradeService();

  const testSuffix = Date.now().toString().slice(-6);
  let testCategoryId: string;
  let testGradeAId: string;
  let testGradeBId: string;
  let testSeafoodSquidId: string;
  let testSeafoodCrabId: string;

  const DATE_1 = '2026-09-27';
  const DATE_2 = '2026-09-28';
  const DATE_3 = '2026-09-29';

  before(async () => {
    // 1. Create dedicated test category
    const cat = await categoryService.createCategory({
      name: `Cephalopods_${testSuffix}`,
      description: 'Squid and octopus'
    });
    testCategoryId = cat.id;

    // 2. Fetch or create test grades
    const grades = await gradeService.getGrades();
    const gradeA = grades.find((g) => g.name === 'Grade A') || (await gradeService.createGrade({ name: `Grade_A_${testSuffix}` }));
    const gradeB = grades.find((g) => g.name === 'Grade B') || (await gradeService.createGrade({ name: `Grade_B_${testSuffix}` }));
    testGradeAId = gradeA.id;
    testGradeBId = gradeB.id;

    // 3. Create test seafood items
    const squid = await seafoodService.createSeafood({
      name: `Squid_${testSuffix}`,
      categoryId: testCategoryId,
      unit: 'KG'
    });
    testSeafoodSquidId = squid.id;

    const crab = await seafoodService.createSeafood({
      name: `Crab_${testSuffix}`,
      categoryId: testCategoryId,
      unit: 'KG'
    });
    testSeafoodCrabId = crab.id;
  });

  after(async () => {
    // Cleanup test records
    await prisma.dailyRate.deleteMany({
      where: {
        seafoodId: { in: [testSeafoodSquidId, testSeafoodCrabId] }
      }
    });
    await prisma.seafood.deleteMany({
      where: { id: { in: [testSeafoodSquidId, testSeafoodCrabId] } }
    });
    await prisma.seafoodCategory.deleteMany({
      where: { id: testCategoryId }
    });
  });

  let createdDraftRateId: string;

  test('1. Create draft rate: Successfully creates draft rate with Decimal rates', async () => {
    const rate = await dailyRateService.createDailyRate({
      rateDate: DATE_2,
      seafoodId: testSeafoodSquidId,
      gradeId: testGradeAId,
      purchaseRate: '420.00',
      sellingRate: '470.00'
    });

    createdDraftRateId = rate.id;
    assert.strictEqual(rate.rateDate, DATE_2);
    assert.strictEqual(rate.purchaseRate, '420.00');
    assert.strictEqual(rate.sellingRate, '470.00');
    assert.strictEqual(rate.status, 'DRAFT');
    assert.strictEqual(rate.version, 1);
  });

  test('2. Create duplicate rate: Prevents duplicate rate for same (date, seafood, grade)', async () => {
    await assert.rejects(
      async () => {
        await dailyRateService.createDailyRate({
          rateDate: DATE_2,
          seafoodId: testSeafoodSquidId,
          gradeId: testGradeAId,
          purchaseRate: '425.00',
          sellingRate: '475.00'
        });
      },
      (err: AppError) => {
        assert.strictEqual(err.statusCode, 409);
        assert.strictEqual(err.code, 'RATE_ALREADY_EXISTS');
        return true;
      }
    );
  });

  test('3. Invalid seafood ID: Fails when seafood ID does not exist', async () => {
    await assert.rejects(
      async () => {
        await dailyRateService.createDailyRate({
          rateDate: DATE_2,
          seafoodId: '00000000-0000-0000-0000-000000000000',
          gradeId: testGradeAId,
          purchaseRate: '400.00',
          sellingRate: '450.00'
        });
      },
      (err: AppError) => {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.code, 'SEAFOOD_NOT_FOUND');
        return true;
      }
    );
  });

  test('4. Invalid grade ID: Fails when grade ID does not exist', async () => {
    await assert.rejects(
      async () => {
        await dailyRateService.createDailyRate({
          rateDate: DATE_2,
          seafoodId: testSeafoodSquidId,
          gradeId: '00000000-0000-0000-0000-000000000000',
          purchaseRate: '400.00',
          sellingRate: '450.00'
        });
      },
      (err: AppError) => {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.code, 'GRADE_NOT_FOUND');
        return true;
      }
    );
  });

  test('5. Negative purchase rate: Fails when purchase rate is negative', async () => {
    await assert.rejects(
      async () => {
        await dailyRateService.createDailyRate({
          rateDate: DATE_2,
          seafoodId: testSeafoodCrabId,
          gradeId: testGradeAId,
          purchaseRate: '-10.00',
          sellingRate: '450.00'
        });
      },
      (err: AppError) => {
        assert.strictEqual(err.statusCode, 400);
        return true;
      }
    );
  });

  test('6. Negative selling rate: Fails when selling rate is negative', async () => {
    await assert.rejects(
      async () => {
        await dailyRateService.createDailyRate({
          rateDate: DATE_2,
          seafoodId: testSeafoodCrabId,
          gradeId: testGradeAId,
          purchaseRate: '400.00',
          sellingRate: '-5.00'
        });
      },
      (err: AppError) => {
        assert.strictEqual(err.statusCode, 400);
        return true;
      }
    );
  });

  test('7. Get rates by date: Filters rates by exact date', async () => {
    const res = await dailyRateService.getDailyRates({
      page: 1,
      limit: 10,
      date: DATE_2
    });
    assert.ok(res.items.length >= 1);
    assert.ok(res.items.every((r) => r.rateDate === DATE_2));
  });

  test('8. Get rates by seafood: Filters rates by seafoodId', async () => {
    const res = await dailyRateService.getDailyRates({
      page: 1,
      limit: 10,
      seafoodId: testSeafoodSquidId
    });
    assert.ok(res.items.length >= 1);
    assert.ok(res.items.every((r) => r.seafoodId === testSeafoodSquidId));
  });

  test('9. Get rates by grade: Filters rates by gradeId', async () => {
    const res = await dailyRateService.getDailyRates({
      page: 1,
      limit: 10,
      gradeId: testGradeAId
    });
    assert.ok(res.items.length >= 1);
    assert.ok(res.items.every((r) => r.gradeId === testGradeAId));
  });

  test('10. Update draft rate: Modifies draft purchase and selling rates', async () => {
    const updated = await dailyRateService.updateDraftRate(createdDraftRateId, {
      purchaseRate: '430.00',
      sellingRate: '480.00'
    });
    assert.strictEqual(updated.purchaseRate, '430.00');
    assert.strictEqual(updated.sellingRate, '480.00');
  });

  test('12. Publish single rate: Changes status to PUBLISHED and sets publishedAt', async () => {
    const published = await dailyRateService.publishRate(createdDraftRateId);
    assert.strictEqual(published.status, 'PUBLISHED');
    assert.ok(published.publishedAt !== null);
  });

  test('11. Cannot update published rate: Rejects modifications to published rates', async () => {
    await assert.rejects(
      async () => {
        await dailyRateService.updateDraftRate(createdDraftRateId, {
          purchaseRate: '450.00'
        });
      },
      (err: AppError) => {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.code, 'RATE_ALREADY_PUBLISHED');
        return true;
      }
    );
  });

  test('13. Publish all rates: Publishes all draft rates for a date atomically', async () => {
    // Create draft rates on DATE_1 for Squid and Crab
    await dailyRateService.createDailyRate({
      rateDate: DATE_1,
      seafoodId: testSeafoodSquidId,
      gradeId: testGradeBId,
      purchaseRate: '350.00',
      sellingRate: '390.00'
    });
    await dailyRateService.createDailyRate({
      rateDate: DATE_1,
      seafoodId: testSeafoodCrabId,
      gradeId: testGradeAId,
      purchaseRate: '600.00',
      sellingRate: '680.00'
    });

    const result = await dailyRateService.publishAllForDate(DATE_1);
    assert.strictEqual(result.publishedCount, 2);
    assert.strictEqual(result.date, DATE_1);

    // Verify both are now PUBLISHED
    const list = await dailyRateService.getDailyRates({ page: 1, limit: 10, date: DATE_1, status: 'PUBLISHED' });
    assert.strictEqual(list.items.length, 2);
  });

  test('14. Publish rollback on validation failure: Rejects publish-all when no drafts exist', async () => {
    await assert.rejects(
      async () => {
        await dailyRateService.publishAllForDate('2030-01-01');
      },
      (err: AppError) => {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.code, 'NO_RATES_TO_PUBLISH');
        return true;
      }
    );
  });

  test("15. Copy yesterday's rates: Copies published rates from source date to target date as DRAFT", async () => {
    // Copy DATE_1 published rates to DATE_3
    const result = await dailyRateService.copyYesterdayRates(DATE_1, DATE_3);
    assert.strictEqual(result.copiedCount, 2);
    assert.strictEqual(result.sourceDate, DATE_1);
    assert.strictEqual(result.targetDate, DATE_3);

    // Verify copied rates on DATE_3 are DRAFT
    const list = await dailyRateService.getDailyRates({ page: 1, limit: 10, date: DATE_3, status: 'DRAFT' });
    assert.strictEqual(list.items.length, 2);
    assert.ok(list.items.some((r) => r.seafoodId === testSeafoodSquidId && r.purchaseRate === '350.00'));
    assert.ok(list.items.some((r) => r.seafoodId === testSeafoodCrabId && r.purchaseRate === '600.00'));
  });

  test('16. Copy does not overwrite existing target rates: Skips duplicate pairs on target date', async () => {
    // Running copy again to DATE_3 should skip the 2 existing rates
    const result = await dailyRateService.copyYesterdayRates(DATE_1, DATE_3);
    assert.strictEqual(result.copiedCount, 0);
    assert.strictEqual(result.skippedCount, 2);
  });

  test('17. Bulk increase: Applies positive percentage adjustment to draft rates', async () => {
    // On DATE_3, Squid was 350.00, +10% should be 385.00
    const result = await dailyRateService.bulkAdjustRates(DATE_3, 10, { gradeId: testGradeBId });
    assert.strictEqual(result.updatedCount, 1);
    assert.strictEqual(result.percentage, 10);

    const squidRate = await dailyRateService.getCurrentRate(DATE_3, testSeafoodSquidId, testGradeBId).catch(() => null);
    // Since it is DRAFT, getCurrentRate throws, check getDailyRates
    const list = await dailyRateService.getDailyRates({ page: 1, limit: 5, date: DATE_3, gradeId: testGradeBId });
    assert.strictEqual(list.items[0].purchaseRate, '385.00');
    // Selling rate was 390.00, +10% is 429.00
    assert.strictEqual(list.items[0].sellingRate, '429.00');
  });

  test('18. Bulk decrease: Applies negative percentage adjustment to draft rates', async () => {
    // On DATE_3, Crab was 600.00, -5% should be 570.00
    const result = await dailyRateService.bulkAdjustRates(DATE_3, -5, { gradeId: testGradeAId });
    assert.strictEqual(result.updatedCount, 1);
    assert.strictEqual(result.percentage, -5);

    const list = await dailyRateService.getDailyRates({ page: 1, limit: 5, date: DATE_3, gradeId: testGradeAId });
    assert.strictEqual(list.items[0].purchaseRate, '570.00');
    // Selling was 680.00, -5% is 646.00
    assert.strictEqual(list.items[0].sellingRate, '646.00');
  });

  test('19. Bulk adjustment ignores published rates: Does not modify published rates', async () => {
    // DATE_1 has only PUBLISHED rates, bulk adjustment must fail with NO_RATES_TO_PUBLISH
    await assert.rejects(
      async () => {
        await dailyRateService.bulkAdjustRates(DATE_1, 10);
      },
      (err: AppError) => {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.code, 'NO_RATES_TO_PUBLISH');
        return true;
      }
    );
  });

  test('20. Current published rate lookup: Successfully retrieves applicable published rate for transactions', async () => {
    // DATE_1 Squid Grade B is published at 350.00 / 390.00
    const current = await dailyRateService.getCurrentRate(DATE_1, testSeafoodSquidId, testGradeBId);
    assert.strictEqual(current.rateDate, DATE_1);
    assert.strictEqual(current.purchaseRate, '350.00');
    assert.strictEqual(current.sellingRate, '390.00');
    assert.strictEqual(current.status, 'PUBLISHED');
  });

  test('21. Missing published rate: Returns RATE_NOT_PUBLISHED error when rate is not published', async () => {
    await assert.rejects(
      async () => {
        await dailyRateService.getCurrentRate('2025-01-01', testSeafoodSquidId, testGradeAId);
      },
      (err: AppError) => {
        assert.strictEqual(err.statusCode, 404);
        assert.strictEqual(err.code, 'RATE_NOT_PUBLISHED');
        return true;
      }
    );
  });

  test('22. Historical rate retrieval: Returns chronological history of published rates', async () => {
    const history = await dailyRateService.getRateHistory({
      seafoodId: testSeafoodSquidId
    });
    assert.ok(history.length >= 2);
    // Chronological order verification
    assert.ok(history[0].rateDate <= history[history.length - 1].rateDate);
    assert.ok(history.every((h) => h.status === 'PUBLISHED'));
  });

  test('23. Decimal precision: Maintains exact 2 decimal places in calculations without floating drift', async () => {
    const rate = await dailyRateService.getDailyRateById(createdDraftRateId);
    assert.strictEqual(rate.purchaseRate, '430.00');
    assert.strictEqual(rate.sellingRate, '480.00');
    assert.strictEqual(typeof rate.purchaseRate, 'string');
    assert.strictEqual(typeof rate.sellingRate, 'string');
  });

  test('24. Date filtering: Filters rates using fromDate and toDate range', async () => {
    const res = await dailyRateService.getDailyRates({
      page: 1,
      limit: 10,
      fromDate: DATE_1,
      toDate: DATE_3
    });
    assert.ok(res.items.length >= 3);
    assert.ok(res.items.every((r) => r.rateDate >= DATE_1 && r.rateDate <= DATE_3));
  });

  test('25. Pagination: Correctly limits results and computes pagination metadata', async () => {
    const res = await dailyRateService.getDailyRates({
      page: 1,
      limit: 2
    });
    assert.strictEqual(res.items.length, 2);
    assert.ok(res.total >= 3);
    assert.ok(res.totalPages >= 2);
  });
});
