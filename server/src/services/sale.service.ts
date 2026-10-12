import { prisma } from '../lib/prisma';
import { SaleRepository, SaleWithRelations } from '../repositories/sale.repository';
import { AppError } from '../utils/appError';
import { generateSaleInvoiceNumber } from '../utils/billNumber';
import { assertBusinessDateOpen } from '../utils/dayEnd';
import { DailyRateService } from './dailyRate.service';
import { Prisma, SaleStatus, PaymentMethod, PaymentStatus, MasterStatus, SaleType, StockMovementType } from '@prisma/client';

export interface CreateSaleItemInput {
  seafoodId: string;
  gradeId: string;
  quantityKg: string;
  sellingRate?: string;
  unitPrice?: string;
}

export interface CreateSaleInput {
  saleType?: SaleType;
  customerId?: string;
  exportCompanyId?: string | null;
  exportRef?: string | null;
  dispatchDate?: string | null;
  destinationPort?: string | null;
  saleDate: string;
  items: CreateSaleItemInput[];
  discount?: string;
  taxAmount?: string;
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
  costRate?: string;
  cogsAmount?: string;
  grossProfit?: string;
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
  saleType: SaleType;
  customerId: string | null;
  customer: {
    id: string;
    name: string;
    countryCode: string;
    mobileNumber: string;
    email: string | null;
    address: string | null;
  } | null;
  exportCompanyId: string | null;
  exportCompany: {
    id: string;
    companyName: string;
    contactPerson: string | null;
    countryCode: string;
    mobileNumber: string | null;
    email: string | null;
    address: string | null;
    taxNumber: string | null;
  } | null;
  items: FormattedSaleItem[];
  totalKg: string;
  subtotal: string;
  discount: string;
  taxAmount: string;
  grandTotal: string;
  totalCogs?: string;
  totalGrossProfit?: string;
  paidAmount: string;
  outstandingAmount: string;
  changeAmount: string;
  paymentStatus: PaymentStatus;
  status: SaleStatus;
  exportRef: string | null;
  dispatchDate: string | null;
  destinationPort: string | null;
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
      saleType: sale.saleType || SaleType.WHOLESALE,
      customerId: sale.customerId,
      customer: sale.customer,
      exportCompanyId: sale.exportCompanyId,
      exportCompany: sale.exportCompany,
      items: sale.items.map((item) => ({
        id: item.id,
        seafoodId: item.seafoodId,
        gradeId: item.gradeId,
        quantityKg: new Prisma.Decimal(item.quantityKg).toFixed(3),
        sellingRate: new Prisma.Decimal(item.sellingRate).toFixed(2),
        amount: new Prisma.Decimal(item.amount).toFixed(2),
        costRate: item.costRate != null ? new Prisma.Decimal(item.costRate).toFixed(2) : '0.00',
        cogsAmount: item.cogsAmount != null ? new Prisma.Decimal(item.cogsAmount).toFixed(2) : '0.00',
        grossProfit: item.grossProfit != null ? new Prisma.Decimal(item.grossProfit).toFixed(2) : '0.00',
        seafood: item.seafood,
        grade: item.grade
      })),
      totalKg: new Prisma.Decimal(sale.totalKg).toFixed(3),
      subtotal: new Prisma.Decimal(sale.subtotal).toFixed(2),
      discount: new Prisma.Decimal(sale.discount).toFixed(2),
      taxAmount: sale.taxAmount != null ? new Prisma.Decimal(sale.taxAmount).toFixed(2) : '0.00',
      grandTotal: new Prisma.Decimal(sale.grandTotal).toFixed(2),
      totalCogs: sale.totalCogs != null ? new Prisma.Decimal(sale.totalCogs).toFixed(2) : '0.00',
      totalGrossProfit: sale.totalGrossProfit != null ? new Prisma.Decimal(sale.totalGrossProfit).toFixed(2) : '0.00',
      paidAmount: new Prisma.Decimal(sale.paidAmount).toFixed(2),
      outstandingAmount: new Prisma.Decimal(sale.grandTotal).sub(new Prisma.Decimal(sale.paidAmount)).toFixed(2),
      changeAmount: new Prisma.Decimal(sale.changeAmount).toFixed(2),
      paymentStatus: sale.paymentStatus,
      status: sale.status,
      exportRef: sale.exportRef,
      dispatchDate: sale.dispatchDate ? sale.dispatchDate.toISOString() : null,
      destinationPort: sale.destinationPort,
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
  /**
   * Completes a seafood sale inside one atomic transaction with concurrency protection.
   * Supports both WHOLESALE and EXPORT billing.
   */
  async createSale(input: CreateSaleInput, userId?: string): Promise<FormattedSale> {
    const {
      saleType: requestedSaleType,
      customerId,
      exportCompanyId,
      exportRef,
      dispatchDate,
      destinationPort,
      saleDate,
      items,
      discount = '0.00',
      taxAmount = '0.00',
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

    // Determine saleType: explicitly requested, or inferred from exportCompanyId
    const isExport = requestedSaleType === SaleType.EXPORT || (!requestedSaleType && Boolean(exportCompanyId));
    const saleType = isExport ? SaleType.EXPORT : SaleType.WHOLESALE;

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
        // Validate business date is open
        await assertBusinessDateOpen(tx, saleDateObj);
        await assertBusinessDateOpen(tx, new Date());

        let targetCustomerId: string | null = null;
        let targetExportCompany: { id: string; companyName: string } | null = null;
        let isWalkIn = false;

        if (isExport) {
          // EXPORT SALE: Export Company is mandatory and authoritative
          if (!exportCompanyId) {
            throw AppError.badRequest('exportCompanyId is required for export sales', 'EXPORT_COMPANY_REQUIRED');
          }

          const expCo = await tx.exportCompany.findFirst({
            where: { id: exportCompanyId, deletedAt: null }
          });

          if (!expCo) {
            throw AppError.notFound('Export company not found', 'EXPORT_COMPANY_NOT_FOUND');
          }

          if (expCo.status !== MasterStatus.ACTIVE) {
            throw AppError.badRequest('Export company is inactive', 'EXPORT_COMPANY_INACTIVE');
          }

          targetExportCompany = expCo;

          // If optional customerId is provided, validate it if present
          if (customerId && customerId.toLowerCase() !== 'walk-in') {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (uuidRegex.test(customerId)) {
              const cust = await tx.customer.findFirst({ where: { id: customerId, deletedAt: null } });
              if (cust && cust.status === MasterStatus.ACTIVE) {
                targetCustomerId = cust.id;
              }
            }
          }
        } else {
          // WHOLESALE SALE: Customer resolution
          const effectiveCustId = customerId || 'walk-in';
          if (effectiveCustId.toLowerCase() === 'walk-in') {
            const walkIn = await this.getOrCreateWalkInCustomer(tx);
            targetCustomerId = walkIn.id;
            isWalkIn = true;
          } else {
            let customer = null;
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (uuidRegex.test(effectiveCustId)) {
              customer = await tx.customer.findFirst({
                where: { id: effectiveCustId, deletedAt: null }
              });
            } else {
              const demoMap: Record<string, { name: string; mobile: string }> = {
                'c-1': { name: 'Marina Grand Hotel & Resorts', mobile: '9841011223' },
                'c-2': { name: 'Ocean Grill Seafood Restaurant', mobile: '9841122334' },
                'c-3': { name: 'Chettinad Fish Mart (Retail)', mobile: '9841233445' }
              };
              const target = demoMap[effectiveCustId] || { name: effectiveCustId, mobile: '98410' + Math.floor(10000 + Math.random() * 90000) };
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

          // Rate resolution: Allow custom price if passed, else require published DailyRate
          let rateSnapshot: Prisma.Decimal;
          const customRate = item.sellingRate || item.unitPrice;
          if (customRate !== undefined && customRate !== null && customRate !== '') {
            rateSnapshot = new Prisma.Decimal(customRate);
            if (rateSnapshot.lessThan(0)) {
              throw AppError.badRequest('Selling rate cannot be negative', 'INVALID_RATE');
            }
          } else {
            const dailyRate = rateMap.get(`${item.seafoodId}:${item.gradeId}`);
            if (!dailyRate) {
              throw AppError.badRequest(
                `Published daily selling rate not found for ${seafood.name} (${grade.name}) on ${saleDate}`,
                'RATE_NOT_PUBLISHED'
              );
            }

            rateSnapshot = new Prisma.Decimal(dailyRate.sellingRate);
            if (rateSnapshot.lessThan(0)) {
              throw AppError.badRequest('Selling rate cannot be negative', 'INVALID_RATE');
            }
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

        // 3. Validate Discount & Tax
        const discountDecimal = new Prisma.Decimal(discount);
        if (discountDecimal.lessThan(0)) {
          throw AppError.badRequest('Discount cannot be negative', 'INVALID_DISCOUNT');
        }
        if (discountDecimal.greaterThan(calculatedSubtotal)) {
          throw AppError.badRequest('Discount cannot exceed subtotal', 'INVALID_DISCOUNT');
        }

        const taxDecimal = new Prisma.Decimal(taxAmount);
        if (taxDecimal.lessThan(0)) {
          throw AppError.badRequest('Tax amount cannot be negative', 'INVALID_TAX_AMOUNT');
        }

        // 4. Calculate Grand Total
        const grandTotal = calculatedSubtotal.sub(discountDecimal).add(taxDecimal);

        // 5. Payment Tender & Change Calculation
        const paymentMethod = payment.method || PaymentMethod.CASH;
        let paidAmount = new Prisma.Decimal(0);
        let changeAmount = new Prisma.Decimal(0);
        let paymentStatus: PaymentStatus = PaymentStatus.PENDING;

        if (paymentMethod === PaymentMethod.CASH) {
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

        // 6. Concurrency Protection, WAC Costing & Stock Deductions
        // Sort items deterministically by seafoodId and gradeId to eliminate deadlock risk
        const sortedSaleItems = [...validatedItems].sort((a, b) => {
          const comp = a.seafoodId.localeCompare(b.seafoodId);
          return comp !== 0 ? comp : a.gradeId.localeCompare(b.gradeId);
        });

        const stockUpdates: Array<{
          stockId: string;
          seafoodId: string;
          gradeId: string;
          quantityKg: Prisma.Decimal;
          sellingRate: Prisma.Decimal;
          amount: Prisma.Decimal;
          costRate: Prisma.Decimal;
          cogsAmount: Prisma.Decimal;
          grossProfit: Prisma.Decimal;
          balanceBefore: Prisma.Decimal;
          balanceAfter: Prisma.Decimal;
        }> = [];

        let calculatedTotalCogs = new Prisma.Decimal(0);

        for (const item of sortedSaleItems) {
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

          // Authoritative WAC cost rate resolution
          let costRate = new Prisma.Decimal(lockedRows[0].averageCost || 0);

          if (costRate.isZero()) {
            const dailyRate = rateMap.get(`${item.seafoodId}:${item.gradeId}`);
            if (dailyRate) {
              costRate = new Prisma.Decimal(dailyRate.purchaseRate);
            }
          }

          const cogsAmount = item.quantityKg.mul(costRate).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
          const grossProfit = item.amount.sub(cogsAmount).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
          calculatedTotalCogs = calculatedTotalCogs.add(cogsAmount);

          // Remaining stock valuation
          const stockAvgCost = new Prisma.Decimal(lockedRows[0].averageCost || costRate);
          const remainingTotalValue = balanceAfter.mul(stockAvgCost).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

          // Atomic conditional update guaranteeing quantityKg >= item.quantityKg
          const updateCount = await tx.stock.updateMany({
            where: {
              id: lockedRows[0].id,
              quantityKg: { gte: item.quantityKg }
            },
            data: {
              quantityKg: balanceAfter,
              totalValue: remainingTotalValue
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
            sellingRate: item.sellingRate,
            amount: item.amount,
            costRate,
            cogsAmount,
            grossProfit,
            balanceBefore,
            balanceAfter
          });
        }

        const calculatedTotalGrossProfit = grandTotal.sub(calculatedTotalCogs).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

        // 7. Generate Collision-Safe Sequential Sale Invoice Number
        const invoiceNumber = await generateSaleInvoiceNumber(tx, saleDate);

        // Map computed costs by seafoodId:gradeId to preserve original manifest line item order
        const costMap = new Map<string, { costRate: Prisma.Decimal; cogsAmount: Prisma.Decimal; grossProfit: Prisma.Decimal }>();
        for (const update of stockUpdates) {
          costMap.set(`${update.seafoodId}:${update.gradeId}`, {
            costRate: update.costRate,
            cogsAmount: update.cogsAmount,
            grossProfit: update.grossProfit
          });
        }

        // 8. Create Sale Record with Snapshot of Total COGS & Margin
        const sale = await tx.sale.create({
          data: {
            invoiceNumber,
            idempotencyKey: idempotencyKey || null,
            saleDate: saleDateObj,
            saleType,
            customerId: targetCustomerId,
            exportCompanyId: isExport ? targetExportCompany!.id : null,
            exportRef: exportRef || null,
            dispatchDate: dispatchDate ? new Date(dispatchDate) : null,
            destinationPort: destinationPort || null,
            totalKg: calculatedTotalKg,
            subtotal: calculatedSubtotal,
            discount: discountDecimal,
            taxAmount: taxDecimal,
            grandTotal,
            totalCogs: calculatedTotalCogs,
            totalGrossProfit: calculatedTotalGrossProfit,
            paidAmount,
            changeAmount,
            paymentStatus,
            status: SaleStatus.COMPLETED,
            notes: notes || null,
            createdById: userId || null,
            updatedById: userId || null
          }
        });

        // 9. Create SaleItems with Permanent Valuation Snapshots (costRate, cogsAmount, grossProfit)
        // Preserving original manifest item ordering
        await tx.saleItem.createMany({
          data: validatedItems.map((item) => {
            const cost = costMap.get(`${item.seafoodId}:${item.gradeId}`)!;
            return {
              saleId: sale.id,
              seafoodId: item.seafoodId,
              gradeId: item.gradeId,
              quantityKg: item.quantityKg,
              sellingRate: item.sellingRate,
              amount: item.amount,
              costRate: cost.costRate,
              cogsAmount: cost.cogsAmount,
              grossProfit: cost.grossProfit
            };
          })
        });

        // 10. Record Payment
        await tx.payment.create({
          data: {
            saleId: sale.id,
            amount: paidAmount,
            paymentMethod,
            paymentStatus,
            paymentDate: saleDateObj,
            referenceNumber: payment.referenceNumber || null,
            notes: payment.notes || null,
            createdById: userId || null
          }
        });

        // 11. Create StockMovement Records for Every Item with Snapshotted Unit Cost & COGS
        const movementType = isExport ? StockMovementType.EXPORT : StockMovementType.SALE;
        const movementNotes = isExport
          ? `Export Sale ${invoiceNumber} - ${targetExportCompany!.companyName}`
          : `POS Retail Sale ${invoiceNumber}`;

        await tx.stockMovement.createMany({
          data: stockUpdates.map((update) => ({
            stockId: update.stockId,
            seafoodId: update.seafoodId,
            gradeId: update.gradeId,
            movementType,
            quantityKg: update.quantityKg.negated(), // Negative movement e.g. -2.750
            balanceBefore: update.balanceBefore,
            balanceAfter: update.balanceAfter,
            unitCost: update.costRate,
            totalCost: update.cogsAmount,
            referenceType: 'SALE',
            referenceId: sale.id,
            movementDate: saleDateObj,
            notes: movementNotes,
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
            exportCompany: {
              select: {
                id: true,
                companyName: true,
                contactPerson: true,
                countryCode: true,
                mobileNumber: true,
                email: true,
                address: true,
                taxNumber: true
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
    exportCompanyId?: string;
    type?: SaleType | 'WHOLESALE' | 'EXPORT';
    saleType?: SaleType | 'WHOLESALE' | 'EXPORT';
    seafoodId?: string;
    gradeId?: string;
    paymentStatus?: PaymentStatus;
    status?: SaleStatus;
    invoiceNumber?: string;
    billNumber?: string;
    search?: string;
  }): Promise<{ items: FormattedSale[]; total: number; totalPages: number }> {
    const {
      page,
      limit,
      date,
      fromDate,
      toDate,
      customerId,
      exportCompanyId,
      type,
      saleType,
      seafoodId,
      gradeId,
      paymentStatus,
      status,
      invoiceNumber,
      billNumber,
      search
    } = params;
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
    if (exportCompanyId) where.exportCompanyId = exportCompanyId;

    const targetSaleType = type || saleType;
    if (targetSaleType) {
      where.saleType = targetSaleType as SaleType;
    }

    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (status) where.status = status;

    const targetNumber = invoiceNumber || billNumber;
    if (targetNumber) {
      where.invoiceNumber = { contains: targetNumber, mode: 'insensitive' };
    }

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
        { customer: { mobileNumber: { contains: search } } },
        { exportCompany: { companyName: { contains: search, mode: 'insensitive' } } },
        { exportRef: { contains: search, mode: 'insensitive' } }
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
      // Validate business date is open
      await assertBusinessDateOpen(tx, existing.saleDate);
      await assertBusinessDateOpen(tx, new Date());

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
      // Deterministic ordering to prevent deadlocks
      const sortedItems = [...existing.items].sort((a, b) =>
        a.seafoodId.localeCompare(b.seafoodId) || a.gradeId.localeCompare(b.gradeId)
      );

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

        let balanceBefore = new Prisma.Decimal(0);
        let stockId: string;
        let vOld = new Prisma.Decimal(0);
        let cOld = new Prisma.Decimal(0);

        if (lockedRows && lockedRows.length > 0) {
          stockId = lockedRows[0].id;
          balanceBefore = new Prisma.Decimal(lockedRows[0].quantityKg);
          vOld = new Prisma.Decimal(lockedRows[0].totalValue);
          cOld = new Prisma.Decimal(lockedRows[0].averageCost);
        } else {
          const newStock = await tx.stock.create({
            data: {
              seafoodId: item.seafoodId,
              gradeId: item.gradeId,
              quantityKg: new Prisma.Decimal(0),
              averageCost: new Prisma.Decimal(0),
              totalValue: new Prisma.Decimal(0)
            }
          });
          stockId = newStock.id;
          balanceBefore = new Prisma.Decimal(0);
        }

        const qReturned = new Prisma.Decimal(item.quantityKg);
        const itemCostRate = new Prisma.Decimal(item.costRate ?? 0);
        const cogsReturned = item.cogsAmount != null && !new Prisma.Decimal(item.cogsAmount).isZero()
          ? new Prisma.Decimal(item.cogsAmount)
          : qReturned.mul(itemCostRate).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

        const balanceAfter = balanceBefore.add(qReturned);
        const vNew = vOld.add(cogsReturned);

        let cNew: Prisma.Decimal;
        if (balanceAfter.gt(0)) {
          cNew = vNew.div(balanceAfter).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
        } else {
          cNew = cOld;
        }
        const totalValue = balanceAfter.mul(cNew).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

        await tx.stock.update({
          where: { id: stockId },
          data: {
            quantityKg: balanceAfter,
            averageCost: cNew,
            totalValue: totalValue
          }
        });

        await tx.stockMovement.create({
          data: {
            stockId,
            seafoodId: item.seafoodId,
            gradeId: item.gradeId,
            movementType: 'RETURN',
            quantityKg: qReturned, // Positive reversal
            balanceBefore,
            balanceAfter,
            unitCost: itemCostRate,
            totalCost: cogsReturned,
            referenceType: 'SALE_CANCEL',
            referenceId: id,
            movementDate: existing.saleDate,
            notes: `Compensating Stock Reversal for Cancelled Sale ${existing.invoiceNumber}`,
            createdById: userId || null
          }
        });
      }

    }, {
      maxWait: 30000,
      timeout: 60000
    });

    const refreshedSale = await this.repo.findById(id);
    return SaleService.formatSale(refreshedSale!);
  }
}