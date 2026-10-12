import { prisma } from '../lib/prisma';
import { PurchaseBillRepository, PurchaseBillWithRelations } from '../repositories/purchaseBill.repository';
import { AppError } from '../utils/appError';
import { generatePurchaseBillNumber } from '../utils/billNumber';
import { getMonotonicDate } from '../utils/monotonicDate';
import { assertBusinessDateOpen } from '../utils/dayEnd';
import { DailyRateService } from './dailyRate.service';
import {
  Prisma,
  PurchaseBillStatus,
  PaymentMethod,
  PaymentStatus,
  MasterStatus,
  AdvanceEntryType,
  AdvanceStatus,
  LedgerDirection
} from '@prisma/client';

export interface CreatePurchaseBillItemInput {
  seafoodId: string;
  gradeId: string;
  quantityKg: string;
  purchaseRate?: string;
}

export interface CreatePurchaseBillInput {
  fishermanId: string;
  billDate: string;
  items: CreatePurchaseBillItemInput[];
  discount?: string;
  advanceDeducted?: string | number;
  payment?: {
    amount?: string;
    method: PaymentMethod;
    referenceNumber?: string;
    notes?: string;
  };
  notes?: string | null;
}

export interface FormattedPurchaseBillItem {
  id: string;
  seafoodId: string;
  gradeId: string;
  quantityKg: string;
  purchaseRate: string;
  amount: string;
  seafood: {
    id: string;
    name: string;
    unit: string;
    category?: {
      id: string;
      name: string;
    };
  };
  grade: {
    id: string;
    name: string;
    description: string | null;
  };
}

export interface FormattedPurchaseBill {
  id: string;
  billNumber: string;
  billDate: string;
  fishermanId: string;
  fisherman: {
    id: string;
    name: string;
    countryCode: string;
    mobileNumber: string;
  };
  items: FormattedPurchaseBillItem[];
  totalKg: string;
  subtotal: string;
  discount: string;
  grandTotal: string;
  advanceDeducted: string;
  netPayableCash: string;
  paidAmount: string;
  outstandingAmount: string;
  paymentStatus: PaymentStatus;
  status: PurchaseBillStatus;
  notes: string | null;
  payments: Array<{
    id: string;
    amount: string;
    paymentMethod: string;
    paymentStatus: string;
    paymentDate: string;
    referenceNumber: string | null;
    notes: string | null;
  }>;
  createdAt: string;
  updatedAt: string;
}

export class PurchaseBillService {
  private readonly repo = new PurchaseBillRepository();

  public static formatBill(bill: PurchaseBillWithRelations): FormattedPurchaseBill {
    return {
      id: bill.id,
      billNumber: bill.billNumber,
      billDate: DailyRateService.formatDate(bill.billDate),
      fishermanId: bill.fishermanId,
      fisherman: bill.fisherman,
      items: bill.items.map((item) => ({
        id: item.id,
        seafoodId: item.seafoodId,
        gradeId: item.gradeId,
        quantityKg: new Prisma.Decimal(item.quantityKg).toFixed(2),
        purchaseRate: new Prisma.Decimal(item.purchaseRate).toFixed(2),
        amount: new Prisma.Decimal(item.amount).toFixed(2),
        seafood: item.seafood,
        grade: item.grade
      })),
      totalKg: new Prisma.Decimal(bill.totalKg).toFixed(2),
      subtotal: new Prisma.Decimal(bill.subtotal).toFixed(2),
      discount: new Prisma.Decimal(bill.discount).toFixed(2),
      grandTotal: new Prisma.Decimal(bill.grandTotal).toFixed(2),
      advanceDeducted: new Prisma.Decimal(bill.advanceDeducted ?? 0).toFixed(2),
      netPayableCash: new Prisma.Decimal(bill.netPayableCash ?? 0).toFixed(2),
      paidAmount: new Prisma.Decimal(bill.paidAmount).toFixed(2),
      outstandingAmount: new Prisma.Decimal(bill.outstandingAmount).toFixed(2),
      paymentStatus: bill.paymentStatus,
      status: bill.status,
      notes: bill.notes,
      payments: bill.payments.map((p) => ({
        id: p.id,
        amount: new Prisma.Decimal(p.amount).toFixed(2),
        paymentMethod: p.paymentMethod,
        paymentStatus: p.paymentStatus,
        paymentDate: p.paymentDate.toISOString(),
        referenceNumber: p.referenceNumber,
        notes: p.notes
      })),
      createdAt: bill.createdAt.toISOString(),
      updatedAt: bill.updatedAt.toISOString()
    };
  }

  async createPurchaseBill(
    input: CreatePurchaseBillInput,
    userId?: string
  ): Promise<FormattedPurchaseBill> {
    const {
      fishermanId,
      billDate,
      items,
      discount = '0.00',
      advanceDeducted = '0.00',
      payment,
      notes
    } = input;

    if (!items || items.length === 0) {
      throw AppError.badRequest('Purchase bill must contain at least one item', 'EMPTY_PURCHASE_ITEMS');
    }

    // Check for duplicate seafood + grade items
    const itemKeys = new Set<string>();
    for (const item of items) {
      const key = `${item.seafoodId}:${item.gradeId}`;
      if (itemKeys.has(key)) {
        throw AppError.badRequest(
          'Duplicate seafood and grade item found in purchase bill',
          'DUPLICATE_PURCHASE_ITEM'
        );
      }
      itemKeys.add(key);
    }

    const billDateObj = DailyRateService.parseDate(billDate);

    // Run the complete purchase flow in one atomic transaction
    const createdBill = await prisma.$transaction(
      async (tx) => {
        // 1. Validate fisherman and lock row FOR UPDATE to prevent race conditions on advances
        const lockedFishermen = await tx.$queryRaw<Array<{ id: string; name: string; status: MasterStatus }>>`
          SELECT id, name, status
          FROM "Fisherman"
          WHERE id = ${fishermanId} AND "deletedAt" IS NULL
          FOR UPDATE
        `;

        if (!lockedFishermen || lockedFishermen.length === 0) {
          throw AppError.notFound('Fisherman not found', 'FISHERMAN_NOT_FOUND');
        }

        if (lockedFishermen[0].status !== MasterStatus.ACTIVE) {
          throw AppError.badRequest('Fisherman is inactive', 'FISHERMAN_INACTIVE');
        }

        // Validate business date is not closed
        await assertBusinessDateOpen(tx, billDateObj);

        // Fetch current advance balance under the row lock
        const latestAdvanceEntry = await tx.fishermanAdvanceLedger.findFirst({
          where: { fishermanId },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
        });
        const currentAdvanceBalance = latestAdvanceEntry
          ? new Prisma.Decimal(latestAdvanceEntry.balanceAfter)
          : new Prisma.Decimal('0.00');

        // 2. Validate seafood, grades, quantities, and published daily rates
        let calculatedTotalKg = new Prisma.Decimal(0);
        let calculatedSubtotal = new Prisma.Decimal(0);

        const validatedItems: Array<{
          seafoodId: string;
          gradeId: string;
          quantityKg: Prisma.Decimal;
          purchaseRate: Prisma.Decimal;
          amount: Prisma.Decimal;
        }> = [];

        for (const item of items) {
          const quantity = new Prisma.Decimal(item.quantityKg);
          if (quantity.lessThanOrEqualTo(0)) {
            throw AppError.badRequest('Item quantity must be greater than zero', 'INVALID_QUANTITY');
          }

          // Validate seafood exists and is active
          const seafood = await tx.seafood.findFirst({
            where: { id: item.seafoodId, deletedAt: null }
          });
          if (!seafood) {
            throw AppError.notFound(`Seafood with id ${item.seafoodId} not found`, 'SEAFOOD_NOT_FOUND');
          }
          if (seafood.status !== MasterStatus.ACTIVE) {
            throw AppError.badRequest(`Seafood '${seafood.name}' is inactive`, 'SEAFOOD_INACTIVE');
          }

          // Validate grade exists
          const grade = await tx.seafoodGrade.findFirst({
            where: { id: item.gradeId, deletedAt: null }
          });
          if (!grade) {
            throw AppError.notFound(`Grade with id ${item.gradeId} not found`, 'GRADE_NOT_FOUND');
          }

          // Lookup PUBLISHED DailyRate for billDate, seafoodId, gradeId
          const dailyRate = await tx.dailyRate.findFirst({
            where: {
              rateDate: billDateObj,
              seafoodId: item.seafoodId,
              gradeId: item.gradeId,
              status: 'PUBLISHED',
              deletedAt: null
            },
            orderBy: { version: 'desc' }
          });

          if (!dailyRate) {
            throw AppError.badRequest(
              `Published daily rate not found for ${seafood.name} (${grade.name}) on ${billDate}`,
              'RATE_NOT_PUBLISHED'
            );
          }

          const rateSnapshot = item.purchaseRate !== undefined
            ? new Prisma.Decimal(item.purchaseRate)
            : new Prisma.Decimal(dailyRate.purchaseRate);
          if (rateSnapshot.lessThan(0)) {
            throw AppError.badRequest('Purchase rate cannot be negative', 'INVALID_RATE');
          }

          // Calculate item amount with 2 decimal places rounding
          const amount = quantity
            .mul(rateSnapshot)
            .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

          calculatedTotalKg = calculatedTotalKg.add(quantity);
          calculatedSubtotal = calculatedSubtotal.add(amount);

          validatedItems.push({
            seafoodId: item.seafoodId,
            gradeId: item.gradeId,
            quantityKg: quantity,
            purchaseRate: rateSnapshot,
            amount
          });
        }

        // 3. Validate discount
        const discountDecimal = new Prisma.Decimal(discount);
        if (discountDecimal.lessThan(0)) {
          throw AppError.badRequest('Discount cannot be negative', 'INVALID_DISCOUNT');
        }
        if (discountDecimal.greaterThan(calculatedSubtotal)) {
          throw AppError.badRequest('Discount cannot exceed subtotal', 'INVALID_DISCOUNT');
        }

        // 4. Calculate grand total, advance deduction, and net payable cash
        const grandTotal = calculatedSubtotal.sub(discountDecimal);

        const advanceDeductedDecimal = new Prisma.Decimal(advanceDeducted || '0.00');
        if (advanceDeductedDecimal.lessThan(0)) {
          throw AppError.badRequest('Advance deduction cannot be negative', 'INVALID_ADVANCE_DEDUCTION');
        }
        if (advanceDeductedDecimal.greaterThan(grandTotal)) {
          throw AppError.badRequest(
            `Advance deduction (₹${advanceDeductedDecimal.toFixed(2)}) cannot exceed grand total (₹${grandTotal.toFixed(2)})`,
            'EXCESSIVE_ADVANCE_DEDUCTION'
          );
        }
        if (advanceDeductedDecimal.greaterThan(currentAdvanceBalance)) {
          throw AppError.badRequest(
            `Advance deduction (₹${advanceDeductedDecimal.toFixed(2)}) cannot exceed fisherman's outstanding advance balance (₹${currentAdvanceBalance.toFixed(2)})`,
            'EXCESSIVE_ADVANCE_DEDUCTION'
          );
        }

        const netPayableCash = grandTotal.sub(advanceDeductedDecimal);

        // 5. Payment and outstanding balance logic against netPayableCash
        let paymentMethod: PaymentMethod = PaymentMethod.CREDIT;
        let requestedAmount = new Prisma.Decimal(0);
        let referenceNumber: string | undefined;
        let paymentNotes: string | undefined;

        if (payment) {
          paymentMethod = payment.method;
          requestedAmount = new Prisma.Decimal(payment.amount || '0.00');
          referenceNumber = payment.referenceNumber;
          paymentNotes = payment.notes;
        }

        if (requestedAmount.lessThan(0)) {
          throw AppError.badRequest('Payment amount cannot be negative', 'INVALID_PAYMENT_AMOUNT');
        }

        if (requestedAmount.greaterThan(netPayableCash)) {
          throw AppError.badRequest(
            `Payment amount (₹${requestedAmount.toFixed(2)}) cannot exceed net payable cash (₹${netPayableCash.toFixed(2)})`,
            'INVALID_PAYMENT_AMOUNT'
          );
        }

        let paidAmount = new Prisma.Decimal(0);
        let outstandingAmount = netPayableCash;
        let paymentStatus: PaymentStatus = PaymentStatus.PENDING;

        if (paymentMethod === PaymentMethod.CREDIT) {
          if (requestedAmount.greaterThan(0)) {
            paidAmount = requestedAmount;
            outstandingAmount = netPayableCash.sub(paidAmount);
            if (paidAmount.equals(netPayableCash)) {
              paymentStatus = PaymentStatus.PAID;
            } else {
              paymentStatus = PaymentStatus.PARTIALLY_PAID;
            }
          } else {
            paidAmount = new Prisma.Decimal(0);
            outstandingAmount = netPayableCash;
            paymentStatus = netPayableCash.isZero() ? PaymentStatus.PAID : PaymentStatus.PENDING;
          }
        } else {
          // CASH, UPI, BANK_TRANSFER
          paidAmount = requestedAmount;
          outstandingAmount = netPayableCash.sub(paidAmount);
          if (netPayableCash.isZero() || paidAmount.equals(netPayableCash)) {
            paymentStatus = PaymentStatus.PAID;
          } else if (paidAmount.greaterThan(0)) {
            paymentStatus = PaymentStatus.PARTIALLY_PAID;
          } else {
            paymentStatus = PaymentStatus.PENDING;
          }
        }

        // 6. Generate collision-safe sequential bill number
        const billNumber = await generatePurchaseBillNumber(tx, billDate);

        // 7. Create PurchaseBill
        const purchaseBill = await tx.purchaseBill.create({
          data: {
            billNumber,
            billDate: billDateObj,
            fishermanId,
            totalKg: calculatedTotalKg,
            subtotal: calculatedSubtotal,
            discount: discountDecimal,
            grandTotal,
            advanceDeducted: advanceDeductedDecimal,
            netPayableCash,
            paidAmount,
            outstandingAmount,
            paymentStatus,
            status: PurchaseBillStatus.POSTED,
            notes: notes || null,
            createdById: userId || null,
            updatedById: userId || null
          }
        });

        // 8. Create PurchaseBillItems
        for (const item of validatedItems) {
          await tx.purchaseBillItem.create({
            data: {
              purchaseBillId: purchaseBill.id,
              seafoodId: item.seafoodId,
              gradeId: item.gradeId,
              quantityKg: item.quantityKg,
              purchaseRate: item.purchaseRate,
              amount: item.amount
            }
          });
        }

        // 9. Create Payment record if payment was provided
        if (payment) {
          await tx.payment.create({
            data: {
              purchaseBillId: purchaseBill.id,
              amount: paidAmount,
              paymentMethod,
              paymentStatus,
              paymentDate: billDateObj,
              referenceNumber: referenceNumber || null,
              notes: paymentNotes || null,
              createdById: userId || null
            }
          });
        }

        // 10. Record advance recovery deduction in FishermanAdvanceLedger
        if (advanceDeductedDecimal.greaterThan(0)) {
          const newAdvanceBalance = currentAdvanceBalance
            .sub(advanceDeductedDecimal)
            .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

          await tx.fishermanAdvanceLedger.create({
            data: {
              fishermanId,
              advanceId: null,
              entryType: AdvanceEntryType.RECOVERY_DEDUCTION,
              direction: LedgerDirection.CREDIT,
              amount: advanceDeductedDecimal,
              balanceBefore: currentAdvanceBalance,
              balanceAfter: newAdvanceBalance,
              referenceType: 'PURCHASE_BILL_DEDUCTION',
              referenceId: purchaseBill.id,
              notes: `Catch bill advance deduction against Purchase Bill ${billNumber}`,
              createdById: userId || null,
              createdAt: getMonotonicDate()
            }
          });

          // If debt balance reaches zero, mark active advances as FULLY_RECOVERED
          if (newAdvanceBalance.isZero()) {
            await tx.fishermanAdvance.updateMany({
              where: { fishermanId, status: AdvanceStatus.ACTIVE },
              data: { status: AdvanceStatus.FULLY_RECOVERED }
            });
          }
        }

        // 10. Update Stock and create StockMovement with WAC calculation
        // Sort items deterministically by seafoodId and gradeId to prevent deadlocks
        const sortedItems = [...validatedItems].sort((a, b) => {
          const comp = a.seafoodId.localeCompare(b.seafoodId);
          return comp !== 0 ? comp : a.gradeId.localeCompare(b.gradeId);
        });

        for (const item of sortedItems) {
          // Lock the stock row FOR UPDATE
          const lockedRows = await tx.$queryRaw<Array<{
            id: string;
            quantityKg: string | number | Prisma.Decimal;
            averageCost: string | number | Prisma.Decimal;
            totalValue: string | number | Prisma.Decimal;
          }>>`
            SELECT id, "quantityKg", "averageCost", "totalValue"
            FROM "Stock"
            WHERE "seafoodId" = ${item.seafoodId} AND "gradeId" = ${item.gradeId}
            FOR UPDATE
          `;

          const qIn = item.quantityKg;
          const pIn = item.purchaseRate;
          const vIn = qIn.mul(pIn).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

          let stockId: string;
          let balanceBefore = new Prisma.Decimal('0.00');
          let balanceAfter = qIn;
          let newAverageCost = pIn;
          let newTotalValue = vIn;

          if (lockedRows && lockedRows.length > 0) {
            stockId = lockedRows[0].id;
            balanceBefore = new Prisma.Decimal(lockedRows[0].quantityKg);
            const oldAverageCost = new Prisma.Decimal(lockedRows[0].averageCost || 0);
            const oldTotalValue = new Prisma.Decimal(lockedRows[0].totalValue || 0);

            balanceAfter = balanceBefore.add(qIn);
            const combinedVal = oldTotalValue.add(vIn);

            if (balanceBefore.greaterThan(0) && oldAverageCost.greaterThan(0)) {
              newAverageCost = combinedVal.div(balanceAfter).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
            } else {
              newAverageCost = pIn;
            }
            newTotalValue = balanceAfter.mul(newAverageCost).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

            await tx.stock.update({
              where: { id: stockId },
              data: {
                quantityKg: balanceAfter,
                averageCost: newAverageCost,
                totalValue: newTotalValue
              }
            });
          } else {
            const newStock = await tx.stock.create({
              data: {
                seafoodId: item.seafoodId,
                gradeId: item.gradeId,
                quantityKg: balanceAfter,
                averageCost: newAverageCost,
                totalValue: newTotalValue
              }
            });
            stockId = newStock.id;
          }

          // Create positive StockMovement of type PURCHASE with authoritative unit and total cost
          await tx.stockMovement.create({
            data: {
              stockId,
              seafoodId: item.seafoodId,
              gradeId: item.gradeId,
              movementType: 'PURCHASE',
              quantityKg: qIn,
              balanceBefore,
              balanceAfter,
              unitCost: pIn,
              totalCost: vIn,
              referenceType: 'PURCHASE_BILL',
              referenceId: purchaseBill.id,
              movementDate: billDateObj,
              notes: `Purchase Bill ${billNumber}`,
              createdById: userId || null
            }
          });
        }

        // Return newly created bill with full relations
        const fullBill = await tx.purchaseBill.findUnique({
          where: { id: purchaseBill.id },
          include: {
            fisherman: {
              select: {
                id: true,
                name: true,
                countryCode: true,
                mobileNumber: true
              }
            },
            items: {
              include: {
                seafood: {
                  select: {
                    id: true,
                    name: true,
                    unit: true,
                    category: { select: { id: true, name: true } }
                  }
                },
                grade: {
                  select: {
                    id: true,
                    name: true,
                    description: true
                  }
                }
              }
            },
            payments: {
              select: {
                id: true,
                amount: true,
                paymentMethod: true,
                paymentStatus: true,
                paymentDate: true,
                referenceNumber: true,
                notes: true
              }
            },
            createdBy: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });

        return fullBill!;
      },
      {
        maxWait: 15000,
        timeout: 60000
      }
    );

    return PurchaseBillService.formatBill(createdBill as PurchaseBillWithRelations);
  }

  async getPurchaseBills(params: {
    page: number;
    limit: number;
    billDate?: string;
    fromDate?: string;
    toDate?: string;
    fishermanId?: string;
    status?: PurchaseBillStatus;
    paymentStatus?: PaymentStatus;
    search?: string;
  }): Promise<{ items: FormattedPurchaseBill[]; total: number; totalPages: number }> {
    const { page, limit, billDate, fromDate, toDate, fishermanId, status, paymentStatus, search } =
      params;
    const skip = (page - 1) * limit;

    const where: Prisma.PurchaseBillWhereInput = { deletedAt: null };

    if (billDate) {
      where.billDate = DailyRateService.parseDate(billDate);
    } else if (fromDate || toDate) {
      where.billDate = {};
      if (fromDate) where.billDate.gte = DailyRateService.parseDate(fromDate);
      if (toDate) where.billDate.lte = DailyRateService.parseDate(toDate);
    }

    if (fishermanId) where.fishermanId = fishermanId;
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    if (search) {
      where.OR = [
        { billNumber: { contains: search, mode: 'insensitive' } },
        { fisherman: { name: { contains: search, mode: 'insensitive' } } },
        { fisherman: { mobileNumber: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [items, total] = await Promise.all([
      this.repo.findMany({ skip, take: limit, where }),
      this.repo.count(where)
    ]);

    return {
      items: items.map(PurchaseBillService.formatBill),
      total,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getPurchaseBillById(id: string): Promise<FormattedPurchaseBill> {
    const bill = await this.repo.findById(id);
    if (!bill) {
      throw AppError.notFound('Purchase bill not found', 'PURCHASE_BILL_NOT_FOUND');
    }
    return PurchaseBillService.formatBill(bill);
  }

  async updatePurchaseBill(
    id: string,
    data: { notes?: string | null },
    userId?: string
  ): Promise<FormattedPurchaseBill> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw AppError.notFound('Purchase bill not found', 'PURCHASE_BILL_NOT_FOUND');
    }

    if (existing.status === PurchaseBillStatus.POSTED) {
      // POSTED bills are protected; only notes can be updated, financial items/rates/quantities cannot be mutated
      const updated = await prisma.purchaseBill.update({
        where: { id },
        data: {
          notes: data.notes !== undefined ? data.notes : existing.notes,
          updatedById: userId || null
        },
        include: {
          fisherman: {
            select: {
              id: true,
              name: true,
              countryCode: true,
              mobileNumber: true
            }
          },
          items: {
            include: {
              seafood: {
                select: {
                  id: true,
                  name: true,
                  unit: true,
                  category: { select: { id: true, name: true } }
                }
              },
              grade: {
                select: {
                  id: true,
                  name: true,
                  description: true
                }
              }
            }
          },
          payments: {
            select: {
              id: true,
              amount: true,
              paymentMethod: true,
              paymentStatus: true,
              paymentDate: true,
              referenceNumber: true,
              notes: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      return PurchaseBillService.formatBill(updated as PurchaseBillWithRelations);
    }

    if (existing.status === PurchaseBillStatus.CANCELLED) {
      throw AppError.badRequest('Cancelled purchase bills cannot be modified', 'PURCHASE_BILL_ALREADY_CANCELLED');
    }

    throw AppError.badRequest('Invalid purchase bill modification', 'INVALID_PURCHASE_OPERATION');
  }

  async cancelPurchaseBill(id: string, userId?: string): Promise<FormattedPurchaseBill> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw AppError.notFound('Purchase bill not found', 'PURCHASE_BILL_NOT_FOUND');
    }

    if (existing.status === PurchaseBillStatus.CANCELLED) {
      throw AppError.badRequest('Purchase bill is already cancelled', 'PURCHASE_BILL_ALREADY_CANCELLED');
    }

    await prisma.$transaction(async (tx) => {
      // Validate business date is not closed
      await assertBusinessDateOpen(tx, existing.billDate);
      await assertBusinessDateOpen(tx, new Date());

      // 1. Mark PurchaseBill as CANCELLED
      await tx.purchaseBill.update({
        where: { id },
        data: {
          status: PurchaseBillStatus.CANCELLED,
          paymentStatus: PaymentStatus.CANCELLED,
          updatedById: userId || null
        }
      });

      // 2. Mark Payments as CANCELLED
      await tx.payment.updateMany({
        where: { purchaseBillId: id },
        data: { paymentStatus: PaymentStatus.CANCELLED }
      });

      // 3. Compensating Advance Recovery Reversal if advance was deducted
      const advanceDeductedDec = new Prisma.Decimal(existing.advanceDeducted || 0);
      if (advanceDeductedDec.greaterThan(0)) {
        // Lock fisherman row FOR UPDATE before locking stock rows (deterministic lock hierarchy)
        await tx.$queryRaw`
          SELECT id, name
          FROM "Fisherman"
          WHERE id = ${existing.fishermanId}
          FOR UPDATE
        `;

        const latestAdvance = await tx.fishermanAdvanceLedger.findFirst({
          where: { fishermanId: existing.fishermanId },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
        });

        const balBefore = latestAdvance ? new Prisma.Decimal(latestAdvance.balanceAfter) : new Prisma.Decimal('0.00');
        const balAfter = balBefore.add(advanceDeductedDec).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

        await tx.fishermanAdvanceLedger.create({
          data: {
            fishermanId: existing.fishermanId,
            advanceId: null,
            entryType: AdvanceEntryType.RECOVERY_REVERSAL,
            direction: LedgerDirection.DEBIT,
            amount: advanceDeductedDec,
            balanceBefore: balBefore,
            balanceAfter: balAfter,
            referenceType: 'PURCHASE_CANCEL',
            referenceId: id,
            notes: `Compensating reversal of advance deduction from cancelled Purchase Bill ${existing.billNumber}`,
            createdById: userId || null,
            createdAt: getMonotonicDate()
          }
        });

        // Reopen any FULLY_RECOVERED advances back to ACTIVE since debt balance is restored
        await tx.fishermanAdvance.updateMany({
          where: { fishermanId: existing.fishermanId, status: AdvanceStatus.FULLY_RECOVERED },
          data: { status: AdvanceStatus.ACTIVE }
        });
      }

      // 4. Compensating Stock Reversals with strict quantity validation
      // Sort items deterministically to prevent deadlocks
      const sortedItems = [...existing.items].sort((a, b) => {
        const comp = a.seafoodId.localeCompare(b.seafoodId);
        return comp !== 0 ? comp : a.gradeId.localeCompare(b.gradeId);
      });

      for (const item of sortedItems) {
        const lockedRows = await tx.$queryRaw<Array<{
          id: string;
          quantityKg: string | number | Prisma.Decimal;
          averageCost: string | number | Prisma.Decimal;
          totalValue: string | number | Prisma.Decimal;
        }>>`
          SELECT id, "quantityKg", "averageCost", "totalValue"
          FROM "Stock"
          WHERE "seafoodId" = ${item.seafoodId} AND "gradeId" = ${item.gradeId}
          FOR UPDATE
        `;

        if (!lockedRows || lockedRows.length === 0) {
          throw AppError.badRequest(
            `Cannot cancel purchase bill: no stock record found for ${item.seafood.name}.`,
            'CANCELLATION_VIOLATION'
          );
        }

        const qAvail = new Prisma.Decimal(lockedRows[0].quantityKg);
        const qPurchase = new Prisma.Decimal(item.quantityKg);

        if (qAvail.lessThan(qPurchase)) {
          throw AppError.badRequest(
            `Cannot cancel purchase bill: available stock (${qAvail.toFixed(2)} KG) for ${item.seafood.name} is less than purchased quantity (${qPurchase.toFixed(2)} KG). Part of this catch has already been sold.`,
            'CANCELLATION_VIOLATION',
            { availableKg: qAvail.toFixed(2), purchasedKg: qPurchase.toFixed(2), seafood: item.seafood.name }
          );
        }

        const stockId = lockedRows[0].id;
        const balanceBefore = qAvail;
        const balanceAfter = balanceBefore.sub(qPurchase);

        const vPurchase = qPurchase.mul(new Prisma.Decimal(item.purchaseRate)).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
        const currentTotalVal = new Prisma.Decimal(lockedRows[0].totalValue || 0);
        let newTotalValue = currentTotalVal.sub(vPurchase);
        let newAverageCost = new Prisma.Decimal(lockedRows[0].averageCost || 0);

        if (balanceAfter.greaterThan(0)) {
          if (newTotalValue.greaterThan(0)) {
            newAverageCost = newTotalValue.div(balanceAfter).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
          }
          newTotalValue = balanceAfter.mul(newAverageCost).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
        } else {
          newAverageCost = new Prisma.Decimal('0.00');
          newTotalValue = new Prisma.Decimal('0.00');
        }

        await tx.stock.update({
          where: { id: stockId },
          data: {
            quantityKg: balanceAfter,
            averageCost: newAverageCost,
            totalValue: newTotalValue
          }
        });

        await tx.stockMovement.create({
          data: {
            stockId,
            seafoodId: item.seafoodId,
            gradeId: item.gradeId,
            movementType: 'ADJUSTMENT',
            quantityKg: qPurchase.negated(),
            balanceBefore,
            balanceAfter,
            unitCost: new Prisma.Decimal(item.purchaseRate),
            totalCost: vPurchase,
            referenceType: 'PURCHASE_CANCEL',
            referenceId: id,
            movementDate: existing.billDate,
            notes: `Compensating Stock Reversal for Cancelled Purchase Bill ${existing.billNumber}`,
            createdById: userId || null
          }
        });
      }
    }, {
      maxWait: 15000,
      timeout: 60000
    });

    const refreshed = await this.repo.findById(id);
    return PurchaseBillService.formatBill(refreshed!);
  }
}
