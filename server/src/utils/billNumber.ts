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