// MonthEndView Component - Monthly Financial Consolidation
import { store } from '../state/store.js';
import { showToast } from '../components/Toast.js';

export function renderMonthEndView() {
  return `
    <div class="flex flex-col gap-space-md w-full max-w-[1720px] mx-auto pb-24 animate-fade-in select-none">
      
      <!-- Top Action Strip -->
      <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div>
          <h1 class="font-headline-md text-headline-md text-primary font-bold tracking-tight">Month End Financial Audit</h1>
          <p class="text-xs text-on-surface-variant font-mono">Period: September 2026 • 24 Working Fishing Days</p>
        </div>

        <div class="flex items-center gap-2">
          <button id="month-excel-btn" class="px-3.5 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-semibold text-xs border border-outline-variant flex items-center gap-1.5 transition-colors">
            <span class="material-symbols-outlined text-[16px] text-profit">table_view</span>
            <span>Excel Export</span>
          </button>

          <button id="month-pdf-btn" class="px-3.5 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-semibold text-xs border border-outline-variant flex items-center gap-1.5 transition-colors">
            <span class="material-symbols-outlined text-[16px] text-secondary">picture_as_pdf</span>
            <span>Audit PDF</span>
          </button>
        </div>
      </div>

      <!-- Monthly Summary KPIs -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm">
          <span class="text-xs font-semibold text-outline uppercase tracking-wider block mb-1">Monthly Gross Sales</span>
          <span class="font-headline-md text-headline-md text-primary font-bold tabular-nums">₹32,45,000</span>
          <span class="text-xs text-profit font-medium block mt-1">+18.5% vs August 2026</span>
        </div>

        <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm">
          <span class="text-xs font-semibold text-outline uppercase tracking-wider block mb-1">Monthly Catch Purchases</span>
          <span class="font-headline-md text-headline-md text-procure font-bold tabular-nums">₹25,10,000</span>
          <span class="text-xs text-outline block mt-1">8,450 KG Landed</span>
        </div>

        <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm">
          <span class="text-xs font-semibold text-outline uppercase tracking-wider block mb-1">Total Operating Expenses</span>
          <span class="font-headline-md text-headline-md text-error font-bold tabular-nums">₹2,15,000</span>
          <span class="text-xs text-outline block mt-1">Ice, Diesel & Wharf Labour</span>
        </div>

        <div class="bg-profit-bg/40 p-space-md rounded-xl border border-profit/40 shadow-sm">
          <span class="text-xs font-bold text-profit uppercase tracking-wider block mb-1">Net Monthly Profit</span>
          <span class="font-headline-md text-headline-md text-profit font-bold tabular-nums">₹5,20,000</span>
          <span class="text-xs text-profit font-bold block mt-1">16.0% Net Operating Yield</span>
        </div>
      </div>

      <!-- Exporter Performance Breakdown -->
      <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm overflow-hidden flex flex-col">
        <div class="p-space-md border-b border-outline-variant/60 bg-white flex items-center justify-between">
          <h3 class="font-title-md text-title-md text-primary font-bold">Exporter Performance & Tonnage Realization</h3>
          <span class="text-xs text-outline font-mono">Consignment Analysis</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-surface-container-low border-b border-outline-variant/60 text-outline font-label-caps uppercase tracking-wider">
                <th class="py-2.5 px-4">Export Company</th>
                <th class="py-2.5 px-3 text-right">Tonnage Handled (KG)</th>
                <th class="py-2.5 px-3 text-right">Total Invoiced (₹)</th>
                <th class="py-2.5 px-3 text-right">Average Rate / KG</th>
                <th class="py-2.5 px-4 text-center">Settlement Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant/40">
              <tr class="hover:bg-surface-container-low/30 transition-colors">
                <td class="py-3 px-4 font-bold text-primary">Apex Frozen Foods Ltd.</td>
                <td class="py-3 px-3 text-right font-mono tabular-nums">4,200 KG</td>
                <td class="py-3 px-3 text-right font-mono font-bold tabular-nums">₹24,50,000</td>
                <td class="py-3 px-3 text-right font-mono tabular-nums text-secondary-marine">₹583 / KG</td>
                <td class="py-3 px-4 text-center"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-profit-bg text-profit">Current</span></td>
              </tr>
              <tr class="hover:bg-surface-container-low/30 transition-colors">
                <td class="py-3 px-4 font-bold text-primary">Falcon Marine Exporters</td>
                <td class="py-3 px-3 text-right font-mono tabular-nums">2,850 KG</td>
                <td class="py-3 px-3 text-right font-mono font-bold tabular-nums">₹18,20,000</td>
                <td class="py-3 px-3 text-right font-mono tabular-nums text-secondary-marine">₹638 / KG</td>
                <td class="py-3 px-4 text-center"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-warning-bg text-warning">15 Days Due</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

export function bindMonthEndEvents() {
  const container = document.getElementById('app');
  if (!container) return;

  const excelBtn = container.querySelector('#month-excel-btn');
  if (excelBtn) {
    excelBtn.addEventListener('click', () => showToast("Monthly Financial Audit Excel file downloaded.", "success"));
  }

  const pdfBtn = container.querySelector('#month-pdf-btn');
  if (pdfBtn) {
    pdfBtn.addEventListener('click', () => showToast("Audit PDF report generated.", "success"));
  }
}
