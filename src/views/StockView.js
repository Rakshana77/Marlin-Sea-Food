// StockView Component - Cold Chain & Inventory Movements
import { store } from '../state/store.js';

export function renderStockView() {
  const state = store.getState();

  return `
    <div class="flex flex-col gap-space-md w-full max-w-[1720px] mx-auto pb-24 animate-fade-in select-none">
      
      <!-- Top Action Strip -->
      <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div>
          <h1 class="font-headline-md text-headline-md text-primary font-bold tracking-tight">Stock & Cold Storage Telemetry</h1>
          <p class="text-xs text-on-surface-variant">
            Live cold locker weights, batch landings, and export dispatch reconciliation.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <span class="px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/60 text-xs font-mono font-bold text-primary">
            Total Inventory: ${state.seafoodCatalog.reduce((acc, s) => acc + s.stock, 0).toFixed(1)} KG
          </span>
        </div>
      </div>

      <!-- Live Species Stock Cards Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-space-sm">
        ${state.seafoodCatalog.map(s => `
          <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-[10px] font-bold uppercase tracking-wider text-outline truncate">${s.category}</span>
                <span class="w-2 h-2 rounded-full ${s.status === 'Healthy' ? 'bg-profit' : 'bg-warning'}"></span>
              </div>
              <h3 class="font-title-md text-title-md text-primary font-bold truncate leading-tight">${s.name}</h3>
            </div>

            <div class="mt-3">
              <span class="font-headline-md text-headline-md text-primary font-bold tabular-nums block">${s.stock.toFixed(1)}</span>
              <span class="text-[11px] text-outline">KG in Cold Store</span>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Stock Movement Audit Ledger Table -->
      <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm overflow-hidden flex flex-col">
        <div class="p-space-md border-b border-outline-variant/60 bg-white flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-secondary text-[20px]">history</span>
            <h3 class="font-title-md text-title-md text-primary font-bold">Stock Movement Audit Trail</h3>
          </div>
          <span class="text-xs text-outline font-mono">Live Sync Inward / Outward</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-surface-container-low border-b border-outline-variant/60 text-outline font-label-caps uppercase tracking-wider">
                <th class="py-2.5 px-4">Date & Time</th>
                <th class="py-2.5 px-4">Seafood Species</th>
                <th class="py-2.5 px-3">Movement Type</th>
                <th class="py-2.5 px-3 text-right">Net Weight Change</th>
                <th class="py-2.5 px-3 text-right">Remaining Balance</th>
                <th class="py-2.5 px-4">Voucher Reference</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant/40">
              ${state.stockMovements.map(m => `
                <tr class="hover:bg-surface-container-low/30 transition-colors">
                  <td class="py-2.5 px-4 text-outline font-mono">${m.date}</td>
                  <td class="py-2.5 px-4 font-bold text-primary">${m.species}</td>
                  <td class="py-2.5 px-3">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      m.type.includes('Inward') ? 'bg-procure-bg text-procure' : 'bg-secondary-container/40 text-secondary-marine'
                    }">
                      ${m.type}
                    </span>
                  </td>
                  <td class="py-2.5 px-3 text-right font-mono font-bold tabular-nums ${
                    m.changeKg.startsWith('+') ? 'text-profit' : 'text-error'
                  }">
                    ${m.changeKg} KG
                  </td>
                  <td class="py-2.5 px-3 text-right font-mono font-bold text-primary tabular-nums">
                    ${m.balanceKg} KG
                  </td>
                  <td class="py-2.5 px-4 font-mono text-outline font-semibold">
                    ${m.ref}
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
