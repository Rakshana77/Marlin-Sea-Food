import { Prisma } from '@prisma/client';

/**
 * Generates an atomic, sequential, collision-safe purchase bill number.
 * Format: PUR-YYYYMMDD-XXXX (e.g. PUR-20260928-0001)
 */
export async function generatePurchaseBillNumber(
  tx: Prisma.TransactionClient,
  dateStr: string
): Promise<string> {
  const compactDate = dateStr.replace(/-/g, '');
  const prefix = `PUR-${compactDate}-`;

  // Transaction-level advisory lock serializes number generation per prefix to prevent race conditions
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${prefix}))`;

  const latestBill = await tx.purchaseBill.findFirst({
    where: {
      billNumber: {
        startsWith: prefix
      }
    },
    orderBy: {
      billNumber: 'desc'
    },
    select: {
      billNumber: true
    }
  });

  let nextSequence = 1;
  if (latestBill?.billNumber) {
    const parts = latestBill.billNumber.split('-');
    if (parts.length === 3) {
      const parsed = parseInt(parts[2], 10);
      if (!isNaN(parsed)) {
        nextSequence = parsed + 1;
      }
    }
  }

  const paddedSequence = nextSequence.toString().padStart(4, '0');
  return `${prefix}${paddedSequence}`;
}

/**
 * Generates an atomic, sequential, collision-safe sale invoice number.
 * Format: INV-YYYYMMDD-XXXX (e.g. INV-20260930-0001)
 */
export async function generateSaleInvoiceNumber(
  tx: Prisma.TransactionClient,
  dateStr: string
): Promise<string> {
  const compactDate = dateStr.replace(/-/g, '');
  const prefix = `INV-${compactDate}-`;

  // Transaction-level advisory lock serializes number generation per prefix to prevent race conditions
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${prefix}))`;

  const latestSale = await tx.sale.findFirst({
    where: {
      invoiceNumber: {
        startsWith: prefix
      }
    },
    orderBy: {
      invoiceNumber: 'desc'
    },
    select: {
      invoiceNumber: true
    }
  });

  let nextSequence = 1;
  if (latestSale?.invoiceNumber) {
    const parts = latestSale.invoiceNumber.split('-');
    if (parts.length === 3) {
      const parsed = parseInt(parts[2], 10);
      if (!isNaN(parsed)) {
        nextSequence = parsed + 1;
      }
    }
  }

  const paddedSequence = nextSequence.toString().padStart(4, '0');
  return `${prefix}${paddedSequence}`;
}

/**
 * Generates an atomic, sequential, collision-safe fisherman advance number.
 * Format: ADV-YYYYMMDD-XXXX (e.g. ADV-20261001-0001)
 */
export async function generateAdvanceNumber(
  tx: Prisma.TransactionClient,
  dateStr: string
): Promise<string> {
  const compactDate = dateStr.replace(/-/g, '');
  const prefix = `ADV-${compactDate}-`;

  // Transaction-level advisory lock serializes number generation per prefix to prevent race conditions
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${prefix}))`;

  const latestAdvance = await tx.fishermanAdvance.findFirst({
    where: {
      advanceNumber: {
        startsWith: prefix
      }
    },
    orderBy: {
      advanceNumber: 'desc'
    },
    select: {
      advanceNumber: true
    }
  });

  let nextSequence = 1;
  if (latestAdvance?.advanceNumber) {
    const parts = latestAdvance.advanceNumber.split('-');
    if (parts.length === 3) {
      const parsed = parseInt(parts[2], 10);
      if (!isNaN(parsed)) {
        nextSequence = parsed + 1;
      }
    }
  }

  const paddedSequence = nextSequence.toString().padStart(4, '0');
  return `${prefix}${paddedSequence}`;
}

/**
 * Generates an atomic, sequential, collision-safe expense number.
 * Format: EXP-YYYYMMDD-XXXX (e.g. EXP-20261004-0001)
 */
export async function generateExpenseNumber(
  tx: Prisma.TransactionClient,
  dateStr: string
): Promise<string> {
  const compactDate = dateStr.replace(/-/g, '');
  const prefix = `EXP-${compactDate}-`;

  // Transaction-level advisory lock serializes number generation per prefix to prevent race conditions
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${prefix}))`;

  const latestExpense = await tx.expense.findFirst({
    where: {
      expenseNumber: {
        startsWith: prefix
      }
    },
    orderBy: {
      expenseNumber: 'desc'
    },
    select: {
      expenseNumber: true
    }
  });

  let nextSequence = 1;
  if (latestExpense?.expenseNumber) {
    const parts = latestExpense.expenseNumber.split('-');
    if (parts.length === 3) {
      const parsed = parseInt(parts[2], 10);
      if (!isNaN(parsed)) {
        nextSequence = parsed + 1;
      }
    }
  }

  const paddedSequence = nextSequence.toString().padStart(4, '0');
  return `${prefix}${paddedSequence}`;
}