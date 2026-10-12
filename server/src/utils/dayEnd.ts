import { Prisma, DayEndStatus } from '@prisma/client';
import { AppError } from './appError';
import { DailyRateService } from '../services/dailyRate.service';

/**
 * Validates that a given business date has not been closed by day-end closing.
 * If closed, throws AppError with code DAY_ALREADY_CLOSED.
 */
export async function assertBusinessDateOpen(
  tx: Prisma.TransactionClient,
  date: Date | string
): Promise<void> {
  const dateObj = typeof date === 'string' ? DailyRateService.parseDate(date) : date;
  const dateOnly = new Date(Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate()));

  const closedDay = await tx.dayEndClosing.findFirst({
    where: {
      businessDate: dateOnly,
      closingStatus: DayEndStatus.CLOSED
    }
  });

  if (closedDay) {
    const formatted = typeof date === 'string' ? date : DailyRateService.formatDate(dateObj);
    throw AppError.badRequest(
      `Business date ${formatted} is already closed by day-end closing`,
      'DAY_ALREADY_CLOSED'
    );
  }
}
