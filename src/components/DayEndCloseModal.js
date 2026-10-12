// DayEndCloseModal Component - Register Lock & Stock Reconciliation Confirmation
import { store } from '../state/store.js';
import { showToast } from './Toast.js';

export function openDayEndCloseModal() {
  const container = document.getElementById('modal-root');
  if (!container) return;

  const state = store.getState();
  const summary = store.getFinancialSummary();
  const flow = store.getDailySeafoodFlow();
  const flowSum = flow.summary;
  const isReconciled = flowSum.closingKg === 0;

  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'day-end-modal';
  modalOverlay.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary-container/70 backdrop-blur-sm animate-fade-in';

  modalOverlay.innerHTML = `
    <div class="bg-surface-container-lowest w-full max-w-lg rounded-2xl border border-outline-variant shadow-2xl p-space-lg animate-slide-up flex flex-col gap-4">
      
      <!-- Header -->
      <div class="flex items-center gap-3 ${isReconciled ? 'text-primary' : 'text-amber-600'} border-b border-outline-variant/60 pb-3">
        <div class="w-10 h-10 rounded-full ${isReconciled ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-700'} flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-[24px]">${isReconciled ? 'lock' : 'warning'}</span>
        </div>
        <div>
          <h2 class="font-title-lg text-title-lg text-primary font-bold">Lock Daily Register & Terminal?</h2>
          <p class="text-xs text-outline font-mono">Date: ${state.date} • Terminal #WS-409</p>
        </div>
      </div>

      <!-- Seafood Reconciliation Status Banner -->
      <div class="rounded-xl p-3 text-xs flex flex-col gap-1.5 ${
        isReconciled 
          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-950' 
          : 'bg-amber-500/10 border border-amber-500/30 text-amber-950'
      }">
        <div class="flex items-center justify-between font-bold">
          <span>Seafood Inventory Flow</span>
          <span class="font-mono ${isReconciled ? 'text-emerald-700' : 'text-amber-800'}">
            ${isReconciled ? '✓ RECONCILED (0.0 KG)' : `⚠️ UNRECONCILED: ${flowSum.closingKg.toFixed(1)} KG`}
          </span>
        </div>
        <div class="grid grid-cols-4 gap-1 text-[11px] font-mono mt-1 text-center">
          <div class="bg-white/60 dark:bg-black/20 p-1 rounded">
            <span class="text-outline block text-[9px]">OPEN</span>
            <strong>0 KG</strong>
          </div>
          <div class="bg-white/60 dark:bg-black/20 p-1 rounded">
            <span class="text-emerald-700 block text-[9px]">RCVD</span>
            <strong>+${flowSum.receivedKg.toFixed(1)}</strong>
          </div>
          <div class="bg-white/60 dark:bg-black/20 p-1 rounded">
            <span class="text-blue-700 block text-[9px]">SOLD</span>
            <strong>-${flowSum.soldKg.toFixed(1)}</strong>
          </div>
          <div class="bg-white/60 dark:bg-black/20 p-1 rounded">
            <span class="text-rose-700 block text-[9px]">WASTE</span>
            <strong>-${flowSum.wastageKg.toFixed(1)}</strong>
          </div>
        </div>
      </div>

      <!-- Financial Snapshot -->
      <div class="bg-surface-container-low rounded-xl p-3 flex flex-col gap-2 text-xs">
        <div class="flex justify-between">
          <span class="text-on-surface-variant">Landed Catch Procurement:</span>
          <span class="font-bold text-primary tabular-nums">₹${summary.todayPurchases.toLocaleString('en-IN')}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-on-surface-variant">Wholesale & Export Sales:</span>
          <span class="font-bold text-primary tabular-nums">₹${summary.todaySales.toLocaleString('en-IN')}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-on-surface-variant">Recorded Wastage Cost Loss:</span>
          <span class="font-bold text-rose-600 tabular-nums">-₹${flowSum.totalWastageValue.toLocaleString('en-IN')}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-on-surface-variant">Operational & Staff Salary Expenses:</span>
          <span class="font-bold text-error tabular-nums">-₹${summary.todayExpenses.toLocaleString('en-IN')}</span>
        </div>
        <div class="flex justify-between border-t border-outline-variant pt-1.5 font-semibold text-sm">
          <span>Net Operational Result:</span>
          <span class="text-profit tabular-nums font-bold">₹${summary.netProfit.toLocaleString('en-IN')}</span>
        </div>
      </div>

      <!-- If unreconciled, require manager justification -->
      ${!isReconciled ? `
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-bold text-amber-900 dark:text-amber-200">
            Manager Override Justification <span class="text-error">*</span>
          </label>
          <input 
            type="text" 
            id="close-override-reason" 
            placeholder="Explain reason for ${flowSum.closingKg.toFixed(1)} KG pending stock (e.g. Cold room carryover per GM approval)" 
            class="w-full px-3 py-2 text-xs rounded-lg border border-amber-500/50 bg-white dark:bg-surface-container focus:border-amber-600 outline-hidden"
            required
          />
          <span class="text-[10px] text-outline">
            Note: Marine Seafoods standard policy requires 0 KG closing stock. Closing with unreconciled stock will be recorded in the audit log.
          </span>
        </div>
      ` : `
        <p class="text-xs text-on-surface-variant leading-relaxed">
          Closing the business day locks today's rate sheets, freezes daily stock movements, and finalizes financial ledgers for audit.
        </p>
      `}

      <!-- Actions -->
      <div class="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/60">
        <button id="cancel-lock-btn" class="px-4 py-2 rounded-lg border border-outline-variant text-xs font-bold text-outline hover:bg-surface-container-low transition-colors">
          Keep Shift Open
        </button>
        <button 
          id="confirm-lock-btn" 
          class="px-5 py-2.5 rounded-lg bg-primary text-white hover:bg-primary-container text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5"
        >
          <span class="material-symbols-outlined text-[16px]">lock</span>
          <span id="confirm-lock-text">Close Day & Lock Terminal</span>
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

  const confirmBtn = modalOverlay.querySelector('#confirm-lock-btn');
  const confirmText = modalOverlay.querySelector('#confirm-lock-text');

  confirmBtn.addEventListener('click', () => {
    if (!isReconciled) {
      const reasonInput = modalOverlay.querySelector('#close-override-reason');
      const reason = reasonInput ? reasonInput.value.trim() : '';
      if (!reason) {
        showToast('Please provide a manager override explanation for unreconciled stock.', 'error');
        if (reasonInput) reasonInput.focus();
        return;
      }
    }

    // Double submission protection
    confirmBtn.disabled = true;
    confirmText.textContent = 'Closing & Locking Day...';

    setTimeout(() => {
      store.closeDay();
      showToast("Day closed successfully. All daily ledgers locked.", "success");
      close();
      store.navigate('day-end');
    }, 500);
  });
}

