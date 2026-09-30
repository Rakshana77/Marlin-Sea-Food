import { prisma } from '../lib/prisma';
import { PurchaseBillRepository, PurchaseBillWithRelations } from '../repositories/purchaseBill.repository';
import { AppError } from '../utils/appError';
import { generatePurchaseBillNumber } from '../utils/billNumber';
import { DailyRateService } from './dailyRate.service';
import { Prisma, PurchaseBillStatus, PaymentMethod, PaymentStatus, MasterStatus } from '@prisma/client';

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
    const { fishermanId, billDate, items, discount = '0.00', payment, notes } = input;

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
        // 1. Validate fisherman
        const fisherman = await tx.fisherman.findFirst({
          where: { id: fishermanId, deletedAt: null }
        });

        if (!fisherman) {
          throw AppError.notFound('Fisherman not found', 'FISHERMAN_NOT_FOUND');
        }

        if (fisherman.status !== MasterStatus.ACTIVE) {
          throw AppError.badRequest('Fisherman is inactive', 'FISHERMAN_INACTIVE');
        }

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

          const rateSnapshot = new Prisma.Decimal(dailyRate.purchaseRate);
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

        // 4. Calculate grand total
        const grandTotal = calculatedSubtotal.sub(discountDecimal);

        // 5. Payment and outstanding balance logic
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

        if (requestedAmount.greaterThan(grandTotal)) {
          throw AppError.badRequest(
            'Payment amount cannot exceed grand total',
            'INVALID_PAYMENT_AMOUNT'
          );
        }

        let paidAmount = new Prisma.Decimal(0);
        let outstandingAmount = grandTotal;
        let paymentStatus: PaymentStatus = PaymentStatus.PENDING;

        if (paymentMethod === PaymentMethod.CREDIT) {
          if (requestedAmount.greaterThan(0)) {
            paidAmount = requestedAmount;
            outstandingAmount = grandTotal.sub(paidAmount);
            if (paidAmount.equals(grandTotal)) {
              paymentStatus = PaymentStatus.PAID;
            } else {
              paymentStatus = PaymentStatus.PARTIALLY_PAID;
            }
          } else {
            paidAmount = new Prisma.Decimal(0);
            outstandingAmount = grandTotal;
            paymentStatus = PaymentStatus.PENDING;
          }
        } else {
          // CASH, UPI, BANK_TRANSFER
          paidAmount = requestedAmount;
          outstandingAmount = grandTotal.sub(paidAmount);
          if (paidAmount.equals(grandTotal)) {
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

        // 9. Create Payment record if paidAmount > 0 or if explicitly logged
        if (payment) {
          await tx.payment.create({
            data: {
              purchaseBillId: purchaseBill.id,
              amount: paidAmount,
              paymentMethod,
              paymentStatus,
              paymentDate: new Date(),
              referenceNumber: referenceNumber || null,
              notes: paymentNotes || null,
              createdById: userId || null
            }
          });
        }

        // 10. Update Stock and create StockMovement for each purchased item
        for (const item of validatedItems) {
          // Check if Stock record exists
          const existingStock = await tx.stock.findUnique({
            where: {
              seafoodId_gradeId: {
                seafoodId: item.seafoodId,
                gradeId: item.gradeId
              }
            }
          });

          let balanceBefore = new Prisma.Decimal('0.00');
          let balanceAfter = item.quantityKg;
          let stockId: string;

          if (existingStock) {
            balanceBefore = new Prisma.Decimal(existingStock.quantityKg);
            balanceAfter = balanceBefore.add(item.quantityKg);
            stockId = existingStock.id;

            await tx.stock.update({
              where: { id: existingStock.id },
              data: { quantityKg: balanceAfter }
            });
          } else {
            const newStock = await tx.stock.create({
              data: {
                seafoodId: item.seafoodId,
                gradeId: item.gradeId,
                quantityKg: item.quantityKg
              }
            });
            stockId = newStock.id;
          }

          // Create positive StockMovement of type PURCHASE
          await tx.stockMovement.create({
            data: {
              stockId,
              seafoodId: item.seafoodId,
              gradeId: item.gradeId,
              movementType: 'PURCHASE',
              quantityKg: item.quantityKg,
              balanceBefore,
              balanceAfter,
              referenceType: 'PURCHASE_BILL',
              referenceId: purchaseBill.id,
              movementDate: new Date(),
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
}
