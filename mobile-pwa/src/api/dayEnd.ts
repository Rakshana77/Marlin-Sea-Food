import { apiClient } from './client';
import { DayEndPreview } from '../types/models';
import { CloseDayPayload } from '../types/api';

export async function getDayEndPreview(date: string): Promise<DayEndPreview> {
  const raw = await apiClient<any>(`/day-end/${date}/preview`, {
    method: 'GET',
  });

  const isClosed = raw?.status === 'CLOSED' || Boolean(raw?.storedClosing);

  return {
    ...raw,
    isClosed,
    cash: {
      openingCash: raw?.cashSummary?.openingCash || '0.00',
      cashReceivedSales: raw?.cashSummary?.cashReceivedSales || '0.00',
      cashPaidPurchases: raw?.cashSummary?.cashPaidPurchases || '0.00',
      cashPaidAdvances: raw?.cashSummary?.cashPaidAdvances || '0.00',
      cashPaidExpenses: raw?.cashSummary?.cashPaidExpenses || '0.00',
      expectedCash: raw?.cashSummary?.expectedClosingCash || '0.00',
    },
    stock: {
      openingStockKg: raw?.stockSummary?.openingStockKg || '0.000',
      totalReceivedKg: raw?.stockSummary?.totalReceivedKg || '0.000',
      totalSoldKg: raw?.stockSummary?.totalSoldKg || '0.000',
      totalWastageKg: raw?.stockSummary?.totalWastageKg || '0.000',
      totalAdjustedKg: raw?.stockSummary?.totalAdjustedKg || '0.000',
      expectedClosingStockKg: raw?.stockSummary?.expectedClosingStockKg || '0.000',
    },
    sales: {
      totalSalesCount: raw?.salesSummary?.totalSales || 0,
      totalSalesAmount: raw?.salesSummary?.grossSales || '0.00',
      totalSalesKg: raw?.stockSummary?.totalSoldKg || '0.000',
    },
    purchases: {
      totalPurchasesCount: raw?.collectionsSummary?.totalBills || 0,
      totalPurchasesAmount: raw?.collectionsSummary?.grossTotal || '0.00',
      totalPurchasesKg: raw?.stockSummary?.totalReceivedKg || '0.000',
    },
    wastage: {
      totalWastageKg: raw?.wastageSummary?.totalWastageKg || '0.000',
      estimatedWastageCost: raw?.wastageSummary?.totalWastageCost || '0.00',
    },
    expenses: {
      totalExpensesCount: raw?.expensesSummary?.byCategory?.length || 0,
      totalExpensesAmount: raw?.expensesSummary?.totalOpex || '0.00',
    },
    advances: {
      totalDisbursed: raw?.advancesSummary?.newAdvancesDisbursed || '0.00',
      totalRecovered: raw?.advancesSummary?.advancesRecovered || '0.00',
    },
  };
}

export async function closeBusinessDay(date: string, payload: CloseDayPayload = {}): Promise<any> {
  return await apiClient<any>(`/day-end/${date}/close`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function reopenBusinessDay(date: string, reason: string): Promise<any> {
  return await apiClient<any>(`/day-end/${date}/reopen`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}
