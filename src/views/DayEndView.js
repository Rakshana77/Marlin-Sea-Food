// DayEndView Component - Daily Shift Reconciliation Terminal
import { store } from '../state/store.js';
import { openDayEndCloseModal } from '../components/DayEndCloseModal.js';
import { showToast } from '../components/Toast.js';

export function renderDayEndView() {
  const state = store.getState();
  const summary = store.getFinancialSummary();

  return `
    <div class="flex flex-col gap-space-md w-full max-w-[1720px] mx-auto pb-24 animate-fade-in select-none">
      
      <!-- Top Action Strip -->
      <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="font-headline-md text-headline-md text-primary font-bold tracking-tight">Day End Terminal Closing</h1>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
              state.isDayClosed ? 'bg-primary text-white' : 'bg-secondary-container text-on-secondary-container'
            }">
              ${state.isDayClosed ? 'SHIFT LOCKED' : 'SHIFT ACTIVE'}
            </span>
          </div>
          <p class="text-xs text-on-surface-variant font-mono mt-0.5">
            ${state.date} • ${state.shift} • ${state.terminal}
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button id="day-end-print-btn" class="px-3.5 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-semibold text-xs border border-outline-variant flex items-center gap-1.5 transition-colors">
            <span class="material-symbols-outlined text-[16px]">print</span>
            <span>Print Day Summary</span>
          </button>

          <button id="day-end-pdf-btn" class="px-3.5 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-semibold text-xs border border-outline-variant flex items-center gap-1.5 transition-colors">
            <span class="material-symbols-outlined text-[16px]">picture_as_pdf</span>
            <span>Generate PDF</span>
          </button>

          <button 
            id="day-end-close-action-btn"
            ${state.isDayClosed ? 'disabled' : ''}
            class="px-5 py-2 rounded-lg ${
              state.isDayClosed 
                ? 'bg-outline text-white cursor-not-allowed' 
                : 'bg-primary text-white hover:bg-primary-container active:scale-95 shadow-sm'
            } font-semibold text-xs transition-all flex items-center gap-1.5"
          >
            <span class="material-symbols-outlined text-[16px] text-secondary-fixed">lock</span>
            <span>${state.isDayClosed ? 'Register Locked' : 'Close Day & Lock'}</span>
          </button>
        </div>
      </div>

      <!-- Financial Tally Bento -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm">
          <span class="text-xs font-semibold text-outline uppercase tracking-wider block mb-1">Total Procurement</span>
          <span class="font-headline-md text-headline-md text-primary font-bold tabular-nums">₹${summary.todayPurchases.toLocaleString('en-IN')}</span>
          <span class="text-xs text-on-surface-variant block mt-1">${summary.totalPurchasedKg} KG Landed</span>
        </div>

        <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm">
          <span class="text-xs font-semibold text-outline uppercase tracking-wider block mb-1">Export Sales</span>
          <span class="font-headline-md text-headline-md text-primary font-bold tabular-nums">₹${summary.todaySales.toLocaleString('en-IN')}</span>
          <span class="text-xs text-on-surface-variant block mt-1">${summary.totalExportedKg} KG Dispatched</span>
        </div>

        <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm">
          <span class="text-xs font-semibold text-outline uppercase tracking-wider block mb-1">Operational Expenses</span>
          <span class="font-headline-md text-headline-md text-error font-bold tabular-nums">₹${summary.todayExpenses.toLocaleString('en-IN')}</span>
          <span class="text-xs text-on-surface-variant block mt-1">Ice, Diesel & Dock Coolie</span>
        </div>

        <div class="bg-profit-bg/40 p-space-md rounded-xl border border-profit/40 shadow-sm">
          <span class="text-xs font-bold text-profit uppercase tracking-wider block mb-1">Net Realized Profit</span>
          <span class="font-headline-md text-headline-md text-profit font-bold tabular-nums">₹${summary.netProfit.toLocaleString('en-IN')}</span>
          <span class="text-xs text-profit font-medium block mt-1">14.6% Margin</span>
        </div>
      </div>

      <!-- Cash Float & Tender Reconciliation Box -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-space-md">
        
        <!-- Physical Cash Drawer Balancing -->
        <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/60 p-space-md shadow-sm flex flex-col gap-3">
          <h3 class="font-title-md text-title-md text-primary font-bold border-b border-outline-variant/60 pb-2">Physical Cash Drawer Tally</h3>
          <div class="flex flex-col gap-2 text-xs">
            <div class="flex justify-between">
              <span class="text-outline">Opening Shift Float:</span>
              <span class="font-mono font-bold text-primary tabular-nums">₹20,000</span>
            </div>
            <div class="flex justify-between">
              <span class="text-outline">Inward Counter Cash:</span>
              <span class="font-mono font-bold text-profit tabular-nums">+₹75,000</span>
            </div>
            <div class="flex justify-between">
              <span class="text-outline">Outward Fisherman Cash:</span>
              <span class="font-mono font-bold text-error tabular-nums">-₹54,000</span>
            </div>
            <div class="flex justify-between">
              <span class="text-outline">Direct Cash Expenses:</span>
              <span class="font-mono font-bold text-error tabular-nums">-₹6,500</span>
            </div>
            <div class="border-t border-outline-variant pt-2 flex justify-between font-bold text-sm">
              <span class="text-primary">EXPECTED PHYSICAL CASH:</span>
              <span class="text-secondary-marine font-mono text-base tabular-nums">₹34,500</span>
            </div>
          </div>
        </div>

        <!-- Electronic Tenders -->
        <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/60 p-space-md shadow-sm flex flex-col gap-3">
          <h3 class="font-title-md text-title-md text-primary font-bold border-b border-outline-variant/60 pb-2">Digital & Bank Tenders</h3>
          <div class="flex flex-col gap-2 text-xs">
            <div class="flex justify-between">
              <span class="text-outline">UPI / GPay Transfers:</span>
              <span class="font-mono font-bold text-primary tabular-nums">₹45,000</span>
            </div>
            <div class="flex justify-between">
              <span class="text-outline">NEFT / RTGS Bank Credits:</span>
              <span class="font-mono font-bold text-primary tabular-nums">₹18,000</span>
            </div>
            <div class="flex justify-between">
              <span class="text-outline">Fishermen Credit Advances:</span>
              <span class="font-mono font-bold text-warning tabular-nums">₹15,000</span>
            </div>
            <div class="border-t border-outline-variant pt-2 flex justify-between font-bold text-sm">
              <span class="text-primary">TOTAL DIGITAL VOLUME:</span>
              <span class="text-primary font-mono text-base tabular-nums">₹78,000</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;
}

export function bindDayEndEvents() {
  const container = document.getElementById('app');
  if (!container) return;

  const closeBtn = container.querySelector('#day-end-close-action-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => openDayEndCloseModal());
  }

  const printBtn = container.querySelector('#day-end-print-btn');
  if (printBtn) {
    printBtn.addEventListener('click', () => window.print());
  }

  const pdfBtn = container.querySelector('#day-end-pdf-btn');
  if (pdfBtn) {
    pdfBtn.addEventListener('click', () => {
      showToast("Day End Statement PDF downloaded.", "success");
    });
  }
}
