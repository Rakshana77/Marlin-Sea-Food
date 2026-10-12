import { z } from 'zod';
import { DailyRateService } from '../services/dailyRate.service';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const dailyPnlQuerySchema = z.object({
  date: z
    .string()
    .regex(dateRegex, 'date must be formatted as YYYY-MM-DD')
    .optional()
});

export const dateRangePnlQuerySchema = z
  .object({
    startDate: z.string().regex(dateRegex, 'startDate must be formatted as YYYY-MM-DD').optional(),
    endDate: z.string().regex(dateRegex, 'endDate must be formatted as YYYY-MM-DD').optional(),
    fromDate: z.string().regex(dateRegex, 'fromDate must be formatted as YYYY-MM-DD').optional(),
    toDate: z.string().regex(dateRegex, 'toDate must be formatted as YYYY-MM-DD').optional(),
    date: z.string().regex(dateRegex, 'date must be formatted as YYYY-MM-DD').optional()
  })
  .transform((data): { startDate: string; endDate: string } => {
    const today = DailyRateService.formatDate(new Date());
    const start = data.startDate || data.fromDate || data.date || today;
    const end = data.endDate || data.toDate || data.date || start;

    return {
      startDate: start,
      endDate: end
    };
  })
  .refine(
    (data) => {
      return data.startDate <= data.endDate;
    },
    {
      message: 'startDate must be less than or equal to endDate',
      path: ['startDate']
    }
  );

export type DailyPnlQuery = z.infer<typeof dailyPnlQuerySchema>;
export type DateRangePnlQuery = z.infer<typeof dateRangePnlQuerySchema>;
