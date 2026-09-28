// ReportsView Component - 10 Standard Business Reports Hub
import { showToast } from '../components/Toast.js';

export function renderReportsView() {
  const reports = [
    { id: 'rep-sales', title: 'Sales & Revenue Report', icon: 'payments', desc: 'Daily wholesale buyers and export company invoice realizations.' },
    { id: 'rep-purch', title: 'Procurement & Weighbridge Report', icon: 'receipt_long', desc: 'Landing volumes, gross vs tare deductions, and dock payment disbursements.' },
    { id: 'rep-export', title: 'Export Consignment Manifests', icon: 'local_shipping', desc: 'Reefer container tonnage, customs compliance, and factory deliveries.' },
    { id: 'rep-exp', title: 'Harbor Expense Ledger', icon: 'account_balance_wallet', desc: 'Diesel bunkering, flake ice purchases, crate packaging, and coolie labour.' },
    { id: 'rep-profit', title: 'Gross & Net Profit Statement', icon: 'query_stats', desc: 'Day-by-day and species-by-species spread margin performance.' },
    { id: 'rep-fish', title: 'Fishermen Advance & Catch Audit', icon: 'sailing', desc: 'Outstanding balances, reliability ratings, and landing history per boat.' },
    { id: 'rep-cust', title: 'Customer & Buyer Ledger', icon: 'storefront', desc: 'Wholesale client orders, credit terms, and payment receipts.' },
    { id: 'rep-species', title: 'Species Yield & Shrinkage Report', icon: 'set_meal', desc: 'Catch weight variance between dock weigh-in and cold chamber export.' },
    { id: 'rep-pay', title: 'Payment Modes Reconciliation', icon: 'credit_card', desc: 'Cash drawer float, UPI, and bank transfer split summary.' },
    { id: 'rep-stock', title: 'Cold Chain Inventory Balance', icon: 'ac_unit', desc: 'Batch freshness, blast freezer allocations, and current KG balances.' }
  ];

  return `
    <div class="flex flex-col gap-space-md w-full max-w-[1720px] mx-auto pb-24 animate-fade-in select-none">
      
      <!-- Top Action Strip -->
      <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div>
          <h1 class="font-headline-md text-headline-md text-primary font-bold tracking-tight">Harbor Reports Hub</h1>
          <p class="text-xs text-on-surface-variant">
            Export official tax manifests, harbor weighbridge summaries, and auditor balance sheets.
          </p>
        </div>

        <div class="flex items-center gap-1.5 bg-surface-container-low p-1 rounded-lg text-xs font-semibold">
          <button class="px-3 py-1 rounded bg-white text-primary shadow-xs">Today</button>
          <button class="px-3 py-1 text-outline hover:text-primary">7 Days</button>
          <button class="px-3 py-1 text-outline hover:text-primary">1 Month</button>
          <button class="px-3 py-1 text-outline hover:text-primary">Custom</button>
        </div>
      </div>

      <!-- 10 Report Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-space-md">
        ${reports.map(r => `
          <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm flex flex-col justify-between hover:border-secondary-marine/50 transition-all">
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-secondary shrink-0">
                <span class="material-symbols-outlined text-[22px]">${r.icon}</span>
              </div>
              <div class="flex flex-col min-w-0">
                <h3 class="font-title-md text-title-md text-primary font-bold leading-tight">${r.title}</h3>
                <p class="text-xs text-outline mt-1 leading-normal">${r.desc}</p>
              </div>
            </div>

            <!-- Export Actions Bar -->
            <div class="mt-4 pt-3 border-t border-outline-variant/60 flex items-center justify-between">
              <span class="text-[10px] text-outline font-mono uppercase">Formats Available</span>
              <div class="flex items-center gap-1.5">
                <button class="report-export-btn px-2.5 py-1 rounded bg-surface-container-low hover:bg-secondary-marine hover:text-white text-[11px] font-bold text-primary transition-colors" data-type="PDF" data-title="${r.title}">
                  PDF
                </button>
                <button class="report-export-btn px-2.5 py-1 rounded bg-surface-container-low hover:bg-profit hover:text-white text-[11px] font-bold text-primary transition-colors" data-type="Excel" data-title="${r.title}">
                  Excel
                </button>
                <button class="report-export-btn px-2.5 py-1 rounded bg-surface-container-low hover:bg-tertiary hover:text-white text-[11px] font-bold text-primary transition-colors" data-type="CSV" data-title="${r.title}">
                  CSV
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

export function bindReportsEvents() {
  const container = document.getElementById('app');
  if (!container) return;

  container.querySelectorAll('.report-export-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      const title = btn.dataset.title;
      showToast(`Generating ${type} report for "${title}"...`, 'info');
      setTimeout(() => {
        showToast(`${title} (${type}) downloaded successfully.`, 'success');
      }, 700);
    });
  });
}
