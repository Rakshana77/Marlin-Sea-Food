// DayEndCloseModal Component - Register Lock Confirmation
import { store } from '../state/store.js';
import { showToast } from './Toast.js';

export function openDayEndCloseModal() {
  const container = document.getElementById('modal-root');
  if (!container) return;

  const state = store.getState();
  const summary = store.getFinancialSummary();

  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'day-end-modal';
  modalOverlay.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary-container/70 backdrop-blur-sm animate-fade-in';

  modalOverlay.innerHTML = `
    <div class="bg-surface-container-lowest w-full max-w-md rounded-xl border border-outline-variant shadow-2xl p-space-lg animate-slide-up flex flex-col gap-space-md">
      <!-- Header -->
      <div class="flex items-center gap-3 text-warning border-b border-outline-variant/60 pb-3">
        <div class="w-10 h-10 rounded-full bg-warning-bg flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-[24px] text-warning">lock</span>
        </div>
        <div>
          <h2 class="font-title-lg text-title-lg text-primary font-bold">Lock Daily Register?</h2>
          <p class="text-xs text-outline font-mono">Shift: 07 Sep 2026 • Terminal #WS-409</p>
        </div>
      </div>

      <!-- Financial Snapshot -->
      <div class="bg-surface-container-low rounded-lg p-3 flex flex-col gap-2 text-xs">
        <div class="flex justify-between">
          <span class="text-on-surface-variant">Total Catch Procurement:</span>
          <span class="font-bold text-primary tabular-nums">₹${summary.todayPurchases.toLocaleString('en-IN')} (${summary.totalPurchasedKg} KG)</span>
        </div>
        <div class="flex justify-between">
          <span class="text-on-surface-variant">Export Consignments:</span>
          <span class="font-bold text-primary tabular-nums">₹${summary.todaySales.toLocaleString('en-IN')} (${summary.totalExportedKg} KG)</span>
        </div>
        <div class="flex justify-between">
          <span class="text-on-surface-variant">Total Operating Expenses:</span>
          <span class="font-bold text-error tabular-nums">-₹${summary.todayExpenses.toLocaleString('en-IN')}</span>
        </div>
        <div class="flex justify-between border-t border-outline-variant pt-1 font-semibold text-sm">
          <span>Net Estimated Profit:</span>
          <span class="text-profit tabular-nums font-bold">₹${summary.netProfit.toLocaleString('en-IN')}</span>
        </div>
      </div>

      <p class="text-xs text-on-surface-variant">
        Closing the day locks today's rate master and finalizes the physical cash drawer tally. New purchase bills for 07 Sep will require supervisor authorization.
      </p>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/60">
        <button id="cancel-lock-btn" class="px-4 py-2 rounded-lg border border-outline-variant text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors">
          Keep Shift Open
        </button>
        <button id="confirm-lock-btn" class="px-5 py-2 rounded-lg bg-primary text-white hover:bg-primary-container text-sm font-semibold shadow-md transition-all active:scale-95">
          Close Day & Lock Register
        </button>
      </div>
    </div>
  `;

  container.appendChild(modalOverlay);

  const close = () => modalOverlay.remove();
  modalOverlay.querySelector('#cancel-lock-btn').addEventListener('click', close);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) close();
  });

  modalOverlay.querySelector('#confirm-lock-btn').addEventListener('click', () => {
    store.closeDay();
    showToast("Day End Closing complete. Register successfully locked.", "success");
    close();
  });
}
