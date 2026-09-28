// ProfitAndLossView Component - Margin Analytics & Ledger Breakdown
import { store } from '../state/store.js';

export function renderProfitAndLossView() {
  const summary = store.getFinancialSummary();

  const speciesProfit = [
    { name: 'Squid (Loligo)', boughtKg: 120, boughtAmt: 50400, soldAmt: 58800, profit: 8400, margin: '14.3%' },
    { name: 'Blue Swimming Crab', boughtKg: 95, boughtAmt: 58900, soldAmt: 67450, profit: 8550, margin: '12.7%' },
    { name: 'Tiger Prawn (10/20)', boughtKg: 160, boughtAmt: 120000, soldAmt: 140800, profit: 20800, margin: '14.8%' },
    { name: 'Yellowfin Tuna', boughtKg: 85, boughtAmt: 28900, soldAmt: 34850, profit: 5950, margin: '17.1%' },
    { name: 'Kingfish (Surmai)', boughtKg: 50, boughtAmt: 39000, soldAmt: 46000, profit: 7000, margin: '15.2%' }
  ];

  return `
    <div class="flex flex-col gap-space-md w-full max-w-[1720px] mx-auto pb-24 animate-fade-in select-none">
      
      <!-- Top Action Strip -->
      <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-space-md">
        <div>
          <h1 class="font-headline-md text-headline-md text-primary font-bold tracking-tight">Profit & Loss Statement</h1>
          <p class="text-xs text-on-surface-variant">
            Net spread analysis, dock intake costs, export realizations, and operational deductions.
          </p>
        </div>

        <!-- Timeframe Filters -->
        <div class="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg text-xs font-semibold overflow-x-auto">
          <button class="px-3 py-1 rounded bg-white text-primary shadow-xs">Today</button>
          <button class="px-3 py-1 hover:text-primary text-outline">7 Days</button>
          <button class="px-3 py-1 hover:text-primary text-outline">This Month</button>
          <button class="px-3 py-1 hover:text-primary text-outline">Last Month</button>
          <button class="px-3 py-1 hover:text-primary text-outline">This Year</button>
        </div>
      </div>

      <!-- Financial Waterfall Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-sm lg:gap-space-md">
        <!-- Gross Sales -->
        <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm flex flex-col justify-between">
          <span class="text-outline font-label-caps uppercase tracking-wider font-bold">1. Total Sales</span>
          <div class="mt-2">
            <span class="font-headline-md text-headline-md text-primary font-bold tabular-nums">₹${summary.todaySales.toLocaleString('en-IN')}</span>
            <span class="text-[11px] text-profit block mt-0.5">Export & Counter</span>
          </div>
        </div>

        <!-- Total Purchases -->
        <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm flex flex-col justify-between">
          <span class="text-outline font-label-caps uppercase tracking-wider font-bold">2. Dock Purchases</span>
          <div class="mt-2">
            <span class="font-headline-md text-headline-md text-procure font-bold tabular-nums">₹${summary.todayPurchases.toLocaleString('en-IN')}</span>
            <span class="text-[11px] text-outline block mt-0.5">${summary.totalPurchasedKg} KG Landed</span>
          </div>
        </div>

        <!-- Gross Margin -->
        <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm flex flex-col justify-between">
          <span class="text-outline font-label-caps uppercase tracking-wider font-bold">3. Gross Margin</span>
          <div class="mt-2">
            <span class="font-headline-md text-headline-md text-secondary-marine font-bold tabular-nums">₹${summary.grossProfit.toLocaleString('en-IN')}</span>
            <span class="text-[11px] text-secondary font-medium block mt-0.5">Spread Income</span>
          </div>
        </div>

        <!-- Expenses -->
        <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm flex flex-col justify-between">
          <span class="text-outline font-label-caps uppercase tracking-wider font-bold">4. Overhead Expenses</span>
          <div class="mt-2">
            <span class="font-headline-md text-headline-md text-error font-bold tabular-nums">-₹${summary.todayExpenses.toLocaleString('en-IN')}</span>
            <span class="text-[11px] text-outline block mt-0.5">Ice, Diesel, Labour</span>
          </div>
        </div>

        <!-- Net Profit -->
        <div class="bg-profit-bg/30 p-space-md rounded-xl border border-profit/40 shadow-sm flex flex-col justify-between">
          <span class="text-profit font-label-caps uppercase tracking-wider font-bold">5. NET PROFIT</span>
          <div class="mt-2">
            <span class="font-headline-md text-headline-md text-profit font-bold tabular-nums">₹${summary.netProfit.toLocaleString('en-IN')}</span>
            <span class="text-[11px] text-profit font-bold block mt-0.5">14.6% Net Realization</span>
          </div>
        </div>
      </div>

      <!-- Seafood-Wise Profit Table -->
      <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm overflow-hidden flex flex-col">
        <div class="p-space-md border-b border-outline-variant/60 bg-white flex items-center justify-between">
          <h3 class="font-title-md text-title-md text-primary font-bold">Seafood-Wise Profit & Spread Breakdown</h3>
          <span class="text-xs text-outline font-mono">Species Margin Ranking</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-surface-container-low border-b border-outline-variant/60 text-outline font-label-caps uppercase tracking-wider">
                <th class="py-2.5 px-4">Seafood Variety</th>
                <th class="py-2.5 px-3 text-right">Volume (KG)</th>
                <th class="py-2.5 px-3 text-right">Procurement Cost</th>
                <th class="py-2.5 px-3 text-right">Realized Sales</th>
                <th class="py-2.5 px-3 text-right">Spread Margin</th>
                <th class="py-2.5 px-4 text-center">Margin %</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant/40">
              ${speciesProfit.map(p => `
                <tr class="hover:bg-surface-container-low/30 transition-colors">
                  <td class="py-2.5 px-4 font-bold text-primary">${p.name}</td>
                  <td class="py-2.5 px-3 text-right font-mono tabular-nums">${p.boughtKg} KG</td>
                  <td class="py-2.5 px-3 text-right font-mono tabular-nums text-procure">₹${p.boughtAmt.toLocaleString('en-IN')}</td>
                  <td class="py-2.5 px-3 text-right font-mono tabular-nums text-on-surface">₹${p.soldAmt.toLocaleString('en-IN')}</td>
                  <td class="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-profit">+₹${p.profit.toLocaleString('en-IN')}</td>
                  <td class="py-2.5 px-4 text-center">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-profit-bg text-profit">
                      ${p.margin}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}
