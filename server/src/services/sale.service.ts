import { prisma } from '../lib/prisma';
import { SaleRepository, SaleWithRelations } from '../repositories/sale.repository';
import { AppError } from '../utils/appError';
import { generateSaleInvoiceNumber } from '../utils/billNumber';
import { DailyRateService } from './dailyRate.service';
import { Prisma, SaleStatus, PaymentMethod, PaymentStatus, MasterStatus } from '@prisma/client';

export interface CreateSaleItemInput {
  seafoodId: string;
  gradeId: string;
  quantityKg: string;
}

export interface CreateSaleInput {
  customerId?: string;
  saleDate: string;
  items: CreateSaleItemInput[];
  discount?: string;
  payment?: {
    method: PaymentMethod;
    amount?: string;
    referenceNumber?: string;
    notes?: string;
  };
  notes?: string | null;
  idempotencyKey?: string;
}

export interface FormattedSaleItem {
  id: string;
  seafoodId: string;
  gradeId: string;
  quantityKg: string;
  sellingRate: string;
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

export interface FormattedSale {
  id: string;
  invoiceNumber: string;
  idempotencyKey?: string | null;
  saleDate: string;
  customerId: string;
  customer: {
    id: string;
    name: string;
    countryCode: string;
    mobileNumber: string;
    email: string | null;
    address: string | null;
  };
  items: FormattedSaleItem[];
  totalKg: string;
  subtotal: string;
  discount: string;
  grandTotal: string;
  paidAmount: string;
  changeAmount: string;
  paymentStatus: PaymentStatus;
  status: SaleStatus;
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

export class SaleService {
  private readonly repo = new SaleRepository();

  public static formatSale(sale: SaleWithRelations): FormattedSale {
    return {
      id: sale.id,
      invoiceNumber: sale.invoiceNumber,
      idempotencyKey: sale.idempotencyKey,
      saleDate: DailyRateService.formatDate(sale.saleDate),
      customerId: sale.customerId,
      customer: sale.customer,
      items: sale.items.map((item) => ({
        id: item.id,
        seafoodId: item.seafoodId,
        gradeId: item.gradeId,
        quantityKg: new Prisma.Decimal(item.quantityKg).toFixed(3),
        sellingRate: new Prisma.Decimal(item.sellingRate).toFixed(2),
        amount: new Prisma.Decimal(item.amount).toFixed(2),
        seafood: item.seafood,
        grade: item.grade
      })),
      totalKg: new Prisma.Decimal(sale.totalKg).toFixed(3),
      subtotal: new Prisma.Decimal(sale.subtotal).toFixed(2),
      discount: new Prisma.Decimal(sale.discount).toFixed(2),
      grandTotal: new Prisma.Decimal(sale.grandTotal).toFixed(2),
      paidAmount: new Prisma.Decimal(sale.paidAmount).toFixed(2),
      changeAmount: new Prisma.Decimal(sale.changeAmount).toFixed(2),
      paymentStatus: sale.paymentStatus,
      status: sale.status,
      notes: sale.notes,
      payments: sale.payments.map((p) => ({
        id: p.id,
        amount: new Prisma.Decimal(p.amount).toFixed(2),
        paymentMethod: p.paymentMethod,
        paymentStatus: p.paymentStatus,
        paymentDate: p.paymentDate.toISOString(),
        referenceNumber: p.referenceNumber,
        notes: p.notes
      })),
      createdAt: sale.createdAt.toISOString(),
      updatedAt: sale.updatedAt.toISOString()
    };
  }

  /**
   * Retrieves or creates the designated system Walk-in customer safely without duplicates.
   */
  async getOrCreateWalkInCustomer(tx?: Prisma.TransactionClient): Promise<{ id: string; name: string }> {
    const client = tx || prisma;
    const walkInMobile = '0000000000';
    let walkIn = await client.customer.findFirst({
      where: {
        mobileNumber: walkInMobile,
        deletedAt: null
      }
    });

    if (!walkIn) {
      walkIn = await client.customer.create({
        data: {
          name: 'Walk-in Counter Customer',
          countryCode: '+91',
          mobileNumber: walkInMobile,
          address: 'Counter Retail Tier-1',
          status: MasterStatus.ACTIVE
        }
      });
    }

    return walkIn;
  }

  /**
   * Completes a seafood sale inside one atomic transaction with concurrency protection.
   */
  async createSale(input: CreateSaleInput, userId?: string): Promise<FormattedSale> {
    const {
      customerId = 'walk-in',
      saleDate,
      items,
      discount = '0.00',
      payment = { method: PaymentMethod.CASH },
      notes,
      idempotencyKey
    } = input;

    // Idempotency duplicate check
    if (idempotencyKey) {
      const existing = await this.repo.findByIdempotencyKey(idempotencyKey);
      if (existing) {
        return SaleService.formatSale(existing);
      }
    }

    if (!items || items.length === 0) {
      throw AppError.badRequest('Sale must contain at least one item', 'EMPTY_SALE_ITEMS');
    }

    // Check for duplicate seafood + grade items
    const itemKeys = new Set<string>();
    for (const item of items) {
      const key = `${item.seafoodId}:${item.gradeId}`;
      if (itemKeys.has(key)) {
        throw AppError.badRequest(
          'Duplicate seafood and grade item found in sale manifest',
          'DUPLICATE_SALE_ITEM'
        );
      }
      itemKeys.add(key);
    }

    const saleDateObj = DailyRateService.parseDate(saleDate);

    // Run complete sale flow inside one atomic transaction
    const createdSale = await prisma.$transaction(
      async (tx) => {
        // 1. Resolve & Validate Customer
        let targetCustomerId: string;
        let isWalkIn = false;

        if (!customerId || customerId.toLowerCase() === 'walk-in') {
          const walkIn = await this.getOrCreateWalkInCustomer(tx);
          targetCustomerId = walkIn.id;
          isWalkIn = true;
        } else {
          let customer = null;
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (uuidRegex.test(customerId)) {
            customer = await tx.customer.findFirst({
              where: { id: customerId, deletedAt: null }
            });
          } else {
            const demoMap: Record<string, { name: string; mobile: string }> = {
              'c-1': { name: 'Marina Grand Hotel & Resorts', mobile: '9841011223' },
              'c-2': { name: 'Ocean Grill Seafood Restaurant', mobile: '9841122334' },
              'c-3': { name: 'Chettinad Fish Mart (Retail)', mobile: '9841233445' }
            };
            const target = demoMap[customerId] || { name: customerId, mobile: '98410' + Math.floor(10000 + Math.random() * 90000) };
            customer = await tx.customer.findFirst({
              where: { name: { contains: target.name, mode: 'insensitive' }, deletedAt: null }
            });
            if (!customer) {
              customer = await tx.customer.create({
                data: {
                  name: target.name,
                  mobileNumber: target.mobile,
                  countryCode: '+91',
                  address: 'Counter Retail Account'
                }
              });
            }
          }

          if (!customer) {
            throw AppError.notFound('Customer not found', 'CUSTOMER_NOT_FOUND');
          }

          if (customer.status !== MasterStatus.ACTIVE) {
            throw AppError.badRequest('Customer is inactive', 'CUSTOMER_INACTIVE');
          }

          targetCustomerId = customer.id;
          isWalkIn = customer.mobileNumber === '0000000000';
        }

        // Credit sale validation: Walk-in customers cannot buy on credit
        if (isWalkIn && payment.method === PaymentMethod.CREDIT) {
          throw AppError.badRequest(
            'Credit sales require an identifiable customer record. Walk-in credit is not permitted.',
            'WALK_IN_CREDIT_NOT_ALLOWED'
          );
        }

        // 2. Validate Items, Published Selling Rates, and Quantities
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        const normalizedItems: Array<typeof items[0]> = [];

        for (const item of items) {
          let sId = item.seafoodId;
          let gId = item.gradeId;

          if (!uuidRegex.test(sId)) {
            const match = await tx.seafood.findFirst({
              where: {
                name: { contains: sId, mode: 'insensitive' },
                deletedAt: null
              }
            });
            if (match) sId = match.id;
          }

          if (!uuidRegex.test(gId)) {
            let targetGrade = 'Grade A';
            if (gId.toLowerCase().includes('b')) targetGrade = 'Grade B';
            if (gId.toLowerCase().includes('c')) targetGrade = 'Grade C';

            const matchG = await tx.seafoodGrade.findFirst({
              where: { name: targetGrade, deletedAt: null }
            });
            if (matchG) gId = matchG.id;
          }

          normalizedItems.push({
            ...item,
            seafoodId: sId,
            gradeId: gId
          });
        }

        const seafoodIds = [...new Set(normalizedItems.map((i) => i.seafoodId).filter((id) => uuidRegex.test(id)))];
        const gradeIds = [...new Set(normalizedItems.map((i) => i.gradeId).filter((id) => uuidRegex.test(id)))];

        const [seafoodList, gradeList, rateList] = await Promise.all([
          tx.seafood.findMany({
            where: { id: { in: seafoodIds }, deletedAt: null }
          }),
          tx.seafoodGrade.findMany({
            where: { id: { in: gradeIds }, deletedAt: null }
          }),
          tx.dailyRate.findMany({
            where: {
              rateDate: saleDateObj,
              seafoodId: { in: seafoodIds },
              gradeId: { in: gradeIds },
              status: 'PUBLISHED',
              deletedAt: null
            },
            orderBy: { version: 'desc' }
          })
        ]);

        const seafoodMap = new Map(seafoodList.map((s) => [s.id, s]));
        const gradeMap = new Map(gradeList.map((g) => [g.id, g]));
        const rateMap = new Map<string, (typeof rateList)[0]>();
        for (const r of rateList) {
          const k = `${r.seafoodId}:${r.gradeId}`;
          if (!rateMap.has(k)) {
            rateMap.set(k, r);
          }
        }

        let calculatedTotalKg = new Prisma.Decimal(0);
        let calculatedSubtotal = new Prisma.Decimal(0);

        const validatedItems: Array<{
          seafoodId: string;
          gradeId: string;
          quantityKg: Prisma.Decimal;
          sellingRate: Prisma.Decimal;
          amount: Prisma.Decimal;
          seafoodName: string;
          gradeName: string;
        }> = [];

        for (const item of normalizedItems) {
          const quantity = new Prisma.Decimal(item.quantityKg);
          if (quantity.lessThanOrEqualTo(0)) {
            throw AppError.badRequest('Item quantity must be greater than zero', 'INVALID_QUANTITY');
          }

          // Validate seafood exists and is active
          const seafood = seafoodMap.get(item.seafoodId);
          if (!seafood) {
            throw AppError.notFound(`Seafood with id ${item.seafoodId} not found`, 'SEAFOOD_NOT_FOUND');
          }
          if (seafood.status !== MasterStatus.ACTIVE) {
            throw AppError.badRequest(`Seafood '${seafood.name}' is inactive`, 'SEAFOOD_INACTIVE');
          }

          // Validate grade exists
          const grade = gradeMap.get(item.gradeId);
          if (!grade) {
            throw AppError.notFound(`Grade with id ${item.gradeId} not found`, 'GRADE_NOT_FOUND');
          }

          // Lookup PUBLISHED DailyRate for saleDate, seafoodId, gradeId
          const dailyRate = rateMap.get(`${item.seafoodId}:${item.gradeId}`);
          if (!dailyRate) {
            throw AppError.badRequest(
              `Published daily selling rate not found for ${seafood.name} (${grade.name}) on ${saleDate}`,
              'RATE_NOT_PUBLISHED'
            );
          }

          const rateSnapshot = new Prisma.Decimal(dailyRate.sellingRate);
          if (rateSnapshot.lessThan(0)) {
            throw AppError.badRequest('Selling rate cannot be negative', 'INVALID_RATE');
          }

          // Authoritative server-side amount calculation
          const amount = quantity
            .mul(rateSnapshot)
            .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

          calculatedTotalKg = calculatedTotalKg.add(quantity);
          calculatedSubtotal = calculatedSubtotal.add(amount);

          validatedItems.push({
            seafoodId: item.seafoodId,
            gradeId: item.gradeId,
            quantityKg: quantity,
            sellingRate: rateSnapshot,
            amount,
            seafoodName: seafood.name,
            gradeName: grade.name
          });
        }

        // 3. Validate Discount
        const discountDecimal = new Prisma.Decimal(discount);
        if (discountDecimal.lessThan(0)) {
          throw AppError.badRequest('Discount cannot be negative', 'INVALID_DISCOUNT');
        }
        if (discountDecimal.greaterThan(calculatedSubtotal)) {
          throw AppError.badRequest('Discount cannot exceed subtotal', 'INVALID_DISCOUNT');
        }

        // 4. Calculate Grand Total
        const grandTotal = calculatedSubtotal.sub(discountDecimal);

        // 5. Payment Tender & Change Calculation
        const paymentMethod = payment.method || PaymentMethod.CASH;
        let paidAmount = new Prisma.Decimal(0);
        let changeAmount = new Prisma.Decimal(0);
        let paymentStatus: PaymentStatus = PaymentStatus.PENDING;

        if (paymentMethod === PaymentMethod.CASH) {
          // If cash amount was not explicitly passed, assume exact cash tender
          const cashReceived = payment.amount
            ? new Prisma.Decimal(payment.amount)
            : grandTotal;

          if (cashReceived.lessThan(0)) {
            throw AppError.badRequest('Cash received cannot be negative', 'INVALID_PAYMENT');
          }

          if (cashReceived.greaterThanOrEqualTo(grandTotal)) {
            paidAmount = grandTotal;
            changeAmount = cashReceived.sub(grandTotal);
            paymentStatus = PaymentStatus.PAID;
          } else {
            // Partial cash payment
            paidAmount = cashReceived;
            changeAmount = new Prisma.Decimal(0);
            paymentStatus = paidAmount.greaterThan(0) ? PaymentStatus.PARTIALLY_PAID : PaymentStatus.PENDING;
          }
        } else if (paymentMethod === PaymentMethod.UPI || paymentMethod === PaymentMethod.BANK_TRANSFER) {
          const received = payment.amount ? new Prisma.Decimal(payment.amount) : grandTotal;

          if (received.lessThan(0)) {
            throw AppError.badRequest('Payment amount cannot be negative', 'INVALID_PAYMENT');
          }
          if (received.greaterThan(grandTotal)) {
            throw AppError.badRequest('Payment amount cannot exceed grand total', 'INVALID_PAYMENT');
          }

          paidAmount = received;
          changeAmount = new Prisma.Decimal(0);

          if (paidAmount.equals(grandTotal)) {
            paymentStatus = PaymentStatus.PAID;
          } else if (paidAmount.greaterThan(0)) {
            paymentStatus = PaymentStatus.PARTIALLY_PAID;
          } else {
            paymentStatus = PaymentStatus.PENDING;
          }
        } else if (paymentMethod === PaymentMethod.CREDIT) {
          const received = payment.amount ? new Prisma.Decimal(payment.amount) : new Prisma.Decimal(0);

          if (received.lessThan(0)) {
            throw AppError.badRequest('Credit payment deposit cannot be negative', 'INVALID_PAYMENT');
          }
          if (received.greaterThan(grandTotal)) {
            throw AppError.badRequest('Payment amount cannot exceed grand total', 'INVALID_PAYMENT');
          }

          paidAmount = received;
          changeAmount = new Prisma.Decimal(0);

          if (paidAmount.equals(grandTotal)) {
            paymentStatus = PaymentStatus.PAID;
          } else if (paidAmount.greaterThan(0)) {
            paymentStatus = PaymentStatus.PARTIALLY_PAID;
          } else {
            paymentStatus = PaymentStatus.PENDING;
          }
        }

        // 6. Concurrency Protection & Stock Deductions
        // Lock stock rows with FOR UPDATE to prevent race conditions & overselling
        const stockUpdates: Array<{
          stockId: string;
          seafoodId: string;
          gradeId: string;
          quantityKg: Prisma.Decimal;
          balanceBefore: Prisma.Decimal;
          balanceAfter: Prisma.Decimal;
        }> = [];

        for (const item of validatedItems) {
          const lockedRows = await tx.$queryRaw<Array<{ id: string; quantityKg: string | number | Prisma.Decimal }>>`
            SELECT id, "quantityKg"
            FROM "Stock"
            WHERE "seafoodId" = ${item.seafoodId} AND "gradeId" = ${item.gradeId}
            FOR UPDATE
          `;

          if (!lockedRows || lockedRows.length === 0) {
            throw AppError.badRequest(
              `Insufficient stock for ${item.seafoodName} (${item.gradeName}).`,
              'INSUFFICIENT_STOCK',
              {
                availableKg: '0.000',
                requestedKg: item.quantityKg.toFixed(3),
                seafood: item.seafoodName,
                grade: item.gradeName
              }
            );
          }

          const currentStockDec = new Prisma.Decimal(lockedRows[0].quantityKg);
          if (currentStockDec.lessThan(item.quantityKg)) {
            throw AppError.badRequest(
              `Insufficient stock for ${item.seafoodName} (${item.gradeName}).`,
              'INSUFFICIENT_STOCK',
              {
                availableKg: currentStockDec.toFixed(3),
                requestedKg: item.quantityKg.toFixed(3),
                seafood: item.seafoodName,
                grade: item.gradeName
              }
            );
          }

          const balanceBefore = currentStockDec;
          const balanceAfter = balanceBefore.sub(item.quantityKg);

          // Atomic conditional update guaranteeing quantityKg >= item.quantityKg
          const updateCount = await tx.stock.updateMany({
            where: {
              id: lockedRows[0].id,
              quantityKg: { gte: item.quantityKg }
            },
            data: {
              quantityKg: balanceAfter
            }
          });

          if (updateCount.count === 0) {
            throw AppError.badRequest(
              `Insufficient stock for ${item.seafoodName} (${item.gradeName}).`,
              'INSUFFICIENT_STOCK',
              {
                availableKg: currentStockDec.toFixed(3),
                requestedKg: item.quantityKg.toFixed(3),
                seafood: item.seafoodName,
                grade: item.gradeName
              }
            );
          }

          stockUpdates.push({
            stockId: lockedRows[0].id,
            seafoodId: item.seafoodId,
            gradeId: item.gradeId,
            quantityKg: item.quantityKg,
            balanceBefore,
            balanceAfter
          });
        }

        // 7. Generate Collision-Safe Sequential Sale Invoice Number
        const invoiceNumber = await generateSaleInvoiceNumber(tx, saleDate);

        // 8. Create Sale Record
        const sale = await tx.sale.create({
          data: {
            invoiceNumber,
            idempotencyKey: idempotencyKey || null,
            saleDate: saleDateObj,
            customerId: targetCustomerId,
            totalKg: calculatedTotalKg,
            subtotal: calculatedSubtotal,
            discount: discountDecimal,
            grandTotal,
            paidAmount,
            changeAmount,
            paymentStatus,
            status: SaleStatus.COMPLETED,
            notes: notes || null,
            createdById: userId || null,
            updatedById: userId || null
          }
        });

        // 9. Create SaleItems (Rate Snapshots) in batch
        await tx.saleItem.createMany({
          data: validatedItems.map((item) => ({
            saleId: sale.id,
            seafoodId: item.seafoodId,
            gradeId: item.gradeId,
            quantityKg: item.quantityKg,
            sellingRate: item.sellingRate,
            amount: item.amount
          }))
        });

        // 10. Record Payment
        await tx.payment.create({
          data: {
            saleId: sale.id,
            amount: paidAmount,
            paymentMethod,
            paymentStatus,
            paymentDate: new Date(),
            referenceNumber: payment.referenceNumber || null,
            notes: payment.notes || null,
            createdById: userId || null
          }
        });

        // 11. Create StockMovement Records for Every Item (Type SALE, Negative Quantity) in batch
        await tx.stockMovement.createMany({
          data: stockUpdates.map((update) => ({
            stockId: update.stockId,
            seafoodId: update.seafoodId,
            gradeId: update.gradeId,
            movementType: 'SALE',
            quantityKg: update.quantityKg.negated(), // Negative movement e.g. -2.750
            balanceBefore: update.balanceBefore,
            balanceAfter: update.balanceAfter,
            referenceType: 'SALE',
            referenceId: sale.id,
            movementDate: new Date(),
            notes: `POS Retail Sale ${invoiceNumber}`,
            createdById: userId || null
          }))
        });

        // Return sale with full relations
        const fullSale = await tx.sale.findUnique({
          where: { id: sale.id },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                countryCode: true,
                mobileNumber: true,
                email: true,
                address: true
              }
            },
            items: {
              include: {
                seafood: {
                  select: {
                    id: true,
                    name: true,
                    unit: true,
                    category: {
                      select: {
                        id: true,
                        name: true
                      }
                    }
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
            }
          }
        });

        return fullSale!;
      },
      {
        maxWait: 15000,
        timeout: 60000
      }
    );

    return SaleService.formatSale(createdSale as SaleWithRelations);
  }

  async getSalesList(params: {
    page: number;
    limit: number;
    date?: string;
    fromDate?: string;
    toDate?: string;
    customerId?: string;
    seafoodId?: string;
    gradeId?: string;
    paymentStatus?: PaymentStatus;
    status?: SaleStatus;
    search?: string;
  }): Promise<{ items: FormattedSale[]; total: number; totalPages: number }> {
    const { page, limit, date, fromDate, toDate, customerId, seafoodId, gradeId, paymentStatus, status, search } =
      params;
    const skip = (page - 1) * limit;

    const where: Prisma.SaleWhereInput = {};

    if (date) {
      where.saleDate = DailyRateService.parseDate(date);
    } else if (fromDate || toDate) {
      where.saleDate = {};
      if (fromDate) where.saleDate.gte = DailyRateService.parseDate(fromDate);
      if (toDate) where.saleDate.lte = DailyRateService.parseDate(toDate);
    }

    if (customerId) where.customerId = customerId;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (status) where.status = status;

    if (seafoodId || gradeId) {
      where.items = {
        some: {
          ...(seafoodId ? { seafoodId } : {}),
          ...(gradeId ? { gradeId } : {})
        }
      };
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { mobileNumber: { contains: search } } }
      ];
    }

    const [items, total] = await Promise.all([
      this.repo.findMany({ skip, take: limit, where }),
      this.repo.count(where)
    ]);

    return {
      items: items.map(SaleService.formatSale),
      total,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getSaleById(id: string): Promise<FormattedSale> {
    const sale = await this.repo.findById(id);
    if (!sale) {
      throw AppError.notFound('Sale not found', 'SALE_NOT_FOUND');
    }
    return SaleService.formatSale(sale);
  }

  async cancelSale(id: string, userId?: string): Promise<FormattedSale> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw AppError.notFound('Sale not found', 'SALE_NOT_FOUND');
    }

    if (existing.status === SaleStatus.CANCELLED) {
      throw AppError.badRequest('Sale is already cancelled', 'SALE_ALREADY_CANCELLED');
    }

    await prisma.$transaction(async (tx) => {
      // 1. Mark Sale as CANCELLED
      await tx.sale.update({
        where: { id },
        data: {
          status: SaleStatus.CANCELLED,
          paymentStatus: PaymentStatus.CANCELLED,
          updatedById: userId || null
        }
      });

      // 2. Mark Payments as CANCELLED
      await tx.payment.updateMany({
        where: { saleId: id },
        data: { paymentStatus: PaymentStatus.CANCELLED }
      });

      // 3. Compensating Stock Reversals for each SaleItem
      for (const item of existing.items) {
        const lockedRows = await tx.$queryRaw<Array<{ id: string; quantityKg: string | number | Prisma.Decimal }>>`
          SELECT id, "quantityKg"
          FROM "Stock"
          WHERE "seafoodId" = ${item.seafoodId} AND "gradeId" = ${item.gradeId}
          FOR UPDATE
        `;

        let balanceBefore = new Prisma.Decimal(0);
        let stockId: string;

        if (lockedRows && lockedRows.length > 0) {
          stockId = lockedRows[0].id;
          balanceBefore = new Prisma.Decimal(lockedRows[0].quantityKg);
          const balanceAfter = balanceBefore.add(item.quantityKg);

          await tx.stock.update({
            where: { id: stockId },
            data: { quantityKg: balanceAfter }
          });

          await tx.stockMovement.create({
            data: {
              stockId,
              seafoodId: item.seafoodId,
              gradeId: item.gradeId,
              movementType: 'RETURN',
              quantityKg: item.quantityKg, // Positive reversal
              balanceBefore,
              balanceAfter,
              referenceType: 'SALE_CANCEL',
              referenceId: id,
              movementDate: new Date(),
              notes: `Compensating Stock Reversal for Cancelled Sale ${existing.invoiceNumber}`,
              createdById: userId || null
            }
          });
        }
      }

    });

    const refreshedSale = await this.repo.findById(id);
    return SaleService.formatSale(refreshedSale!);
  }
}