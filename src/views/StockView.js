// StockView Component - Cold Chain & Daily Seafood Flow Ledger
import { store } from '../state/store.js';
import { showToast } from '../components/Toast.js';

export function renderStockView() {
  const state = store.getState();
  const flow = store.getDailySeafoodFlow();
  const summary = flow.summary;

  return `
    <div class="flex flex-col gap-space-md w-full max-w-[1720px] mx-auto pb-24 animate-fade-in select-none">
      
      <!-- Top Action Strip -->
      <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="font-headline-md text-headline-md text-primary font-bold tracking-tight">Daily Seafood Flow & Cold Storage</h1>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${summary.isReconciled ? 'bg-profit-bg text-profit border border-profit/30' : 'bg-warning-bg text-warning border border-warning/30'}">
              ${summary.isReconciled ? 'TARGET RECONCILED (0 KG)' : `${summary.closingKg} KG IN ROTATION`}
            </span>
          </div>
          <p class="text-xs text-on-surface-variant font-medium mt-0.5">
            Daily cycle: Opening (0 KG) &bull; Landings Received &bull; Wholesale Dispatched &bull; Wastage Accounted &bull; Day End Target (0 KG)
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button 
            id="open-wastage-modal-btn"
            class="px-3.5 py-2 rounded-lg bg-error text-white font-bold text-xs shadow-xs hover:bg-red-700 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <span class="material-symbols-outlined text-[16px]">delete_sweep</span>
            <span>+ Record Wastage / Loss</span>
          </button>

          <button 
            id="open-adjust-modal-btn"
            class="px-3.5 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-semibold text-xs border border-outline-variant flex items-center gap-1.5 transition-colors"
          >
            <span class="material-symbols-outlined text-[16px]">tune</span>
            <span>+ Stock Adjustment</span>
          </button>
        </div>
      </div>

      <!-- TODAY'S SEAFOOD FLOW BENTO HERO -->
      <div class="bg-gradient-to-r from-primary via-primary-container to-[#001f3b] text-white p-5 rounded-2xl shadow-md border border-primary/40 flex flex-col gap-4">
        <div class="flex items-center justify-between border-b border-white/10 pb-3">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-secondary-fixed text-[22px]">swap_horiz</span>
            <span class="font-title-md font-bold text-white tracking-wide">TODAY'S SEAFOOD FLOW RECONCILIATION</span>
          </div>
          <span class="text-xs font-mono text-primary-fixed-dim">${state.date} &bull; ${state.shift}</span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <!-- Opening -->
          <div class="bg-white/5 backdrop-blur-xs p-3 rounded-xl border border-white/10">
            <span class="text-[11px] uppercase tracking-wider text-primary-fixed-dim font-bold block mb-1">1. Opening Daily Stock</span>
            <span class="font-headline-md font-bold font-mono text-white">0.0 KG</span>
            <span class="text-[10px] text-primary-fixed-dim block mt-0.5">Flow starts at zero</span>
          </div>

          <!-- Received -->
          <div class="bg-white/5 backdrop-blur-xs p-3 rounded-xl border border-white/10">
            <span class="text-[11px] uppercase tracking-wider text-emerald-300 font-bold block mb-1">2. Received Landings</span>
            <span class="font-headline-md font-bold font-mono text-emerald-300">+${summary.receivedKg.toFixed(1)} KG</span>
            <span class="text-[10px] text-emerald-200 block mt-0.5">Fishermen catch</span>
          </div>

          <!-- Sold -->
          <div class="bg-white/5 backdrop-blur-xs p-3 rounded-xl border border-white/10">
            <span class="text-[11px] uppercase tracking-wider text-sky-300 font-bold block mb-1">3. Wholesale & Export</span>
            <span class="font-headline-md font-bold font-mono text-sky-300">-${summary.soldKg.toFixed(1)} KG</span>
            <span class="text-[10px] text-sky-200 block mt-0.5">Buyer dispatches</span>
          </div>

          <!-- Wastage -->
          <div class="bg-white/5 backdrop-blur-xs p-3 rounded-xl border border-white/10">
            <span class="text-[11px] uppercase tracking-wider text-red-300 font-bold block mb-1">4. Wastage & Spoilage</span>
            <span class="font-headline-md font-bold font-mono text-red-300">-${summary.wastageKg.toFixed(1)} KG</span>
            <span class="text-[10px] text-red-200 block mt-0.5">₹${summary.totalWastageValue.toLocaleString('en-IN')} Loss Value</span>
          </div>

          <!-- Closing / Available -->
          <div class="col-span-2 sm:col-span-1 bg-secondary-fixed/20 backdrop-blur-xs p-3 rounded-xl border border-secondary-fixed/40">
            <span class="text-[11px] uppercase tracking-wider text-secondary-fixed font-bold block mb-1">5. Available Today</span>
            <span class="font-headline-md font-bold font-mono text-secondary-fixed">${summary.closingKg.toFixed(1)} KG</span>
            <span class="text-[10px] text-secondary-fixed-dim block mt-0.5">Target at Day Close: 0 KG</span>
          </div>
        </div>
      </div>

      <!-- Species Inventory Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-space-sm">
        ${flow.items.map(s => `
          <div class="bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant/60 shadow-sm flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-[10px] font-bold uppercase tracking-wider text-outline truncate">${s.category}</span>
                <span class="w-2.5 h-2.5 rounded-full ${s.remainingKg === 0 ? 'bg-profit' : s.remainingKg > 50 ? 'bg-secondary-marine' : 'bg-warning'}"></span>
              </div>
              <h3 class="font-title-md text-title-md text-primary font-bold truncate leading-tight">${s.name}</h3>
            </div>

            <div class="mt-3 pt-2 border-t border-outline-variant/40 flex flex-col gap-1 text-xs">
              <div class="flex justify-between items-center text-outline text-[11px]">
                <span>Received:</span>
                <span class="font-mono font-bold text-procure">+${s.receivedKg} KG</span>
              </div>
              <div class="flex justify-between items-center text-outline text-[11px]">
                <span>Sold:</span>
                <span class="font-mono font-bold text-primary">-${s.soldKg} KG</span>
              </div>
              <div class="flex justify-between items-center text-outline text-[11px]">
                <span>Wastage:</span>
                <span class="font-mono font-bold text-error">-${s.wastageKg} KG</span>
              </div>
              <div class="flex justify-between items-baseline pt-1 border-t border-outline-variant/30 font-bold">
                <span class="text-primary text-[11px]">Available:</span>
                <span class="font-mono text-sm ${s.remainingKg === 0 ? 'text-profit' : 'text-primary'}">${s.remainingKg} KG</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Wastage Ledger Table -->
      <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm overflow-hidden flex flex-col">
        <div class="p-space-md border-b border-outline-variant/60 bg-white flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-error text-[20px]">delete_sweep</span>
            <h3 class="font-title-md text-title-md text-primary font-bold">Recorded Wastage & Loss Audit Trail</h3>
          </div>
          <span class="text-xs text-outline font-mono">${state.wastageRecords.length} Audited Losses</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-surface-container-low border-b border-outline-variant/60 text-outline font-label-caps uppercase tracking-wider">
                <th class="py-2.5 px-4">Audit ID</th>
                <th class="py-2.5 px-3">Date & Time</th>
                <th class="py-2.5 px-4">Seafood Species</th>
                <th class="py-2.5 px-3 text-right">Wasted Weight</th>
                <th class="py-2.5 px-3">Reason Category</th>
                <th class="py-2.5 px-4">Inspection Notes</th>
                <th class="py-2.5 px-4 text-right">Estimated Cost Loss</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant/40">
              ${state.wastageRecords.map(w => `
                <tr class="hover:bg-surface-container-low/30 transition-colors">
                  <td class="py-2.5 px-4 font-mono font-bold text-outline">${w.id}</td>
                  <td class="py-2.5 px-3 text-outline font-mono">${w.date}, ${w.time}</td>
                  <td class="py-2.5 px-4 font-bold text-primary">${w.speciesName}</td>
                  <td class="py-2.5 px-3 text-right font-mono font-bold text-error tabular-nums">
                    -${w.quantityKg.toFixed(1)} KG
                  </td>
                  <td class="py-2.5 px-3">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-error-container text-on-error-container">
                      ${w.reason}
                    </span>
                  </td>
                  <td class="py-2.5 px-4 text-on-surface-variant">${w.notes || '—'}</td>
                  <td class="py-2.5 px-4 text-right font-mono font-bold text-error tabular-nums">
                    ₹${w.estimatedLoss.toLocaleString('en-IN')}
                  </td>
                </tr>
              `).join('')}
              ${state.wastageRecords.length === 0 ? `
                <tr><td colspan="7" class="p-6 text-center text-outline">No wastage recorded today.</td></tr>
              ` : ''}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Stock Movement Audit Ledger Table -->
      <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm overflow-hidden flex flex-col">
        <div class="p-space-md border-b border-outline-variant/60 bg-white flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-secondary text-[20px]">history</span>
            <h3 class="font-title-md text-title-md text-primary font-bold">Unified Stock Movements Ledger</h3>
          </div>
          <span class="text-xs text-outline font-mono">Permanent Audit Trail</span>
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
                      m.type.includes('Inward') || m.type === 'PURCHASE' ? 'bg-procure-bg text-procure' :
                      m.type.includes('Wastage') || m.type === 'WASTE' ? 'bg-error-container text-on-error-container font-bold' :
                      'bg-secondary-container/40 text-secondary-marine'
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

export function bindStockEvents() {
  const container = document.getElementById('app');
  if (!container) return;

  const state = store.getState();

  // Record Wastage Modal
  const openWastageBtn = container.querySelector('#open-wastage-modal-btn');
  if (openWastageBtn) {
    openWastageBtn.addEventListener('click', () => {
      openWastageModal();
    });
  }

  // Stock Adjustment Modal
  const openAdjustBtn = container.querySelector('#open-adjust-modal-btn');
  if (openAdjustBtn) {
    openAdjustBtn.addEventListener('click', () => {
      openAdjustmentModal();
    });
  }
}

export function openWastageModal() {
  const state = store.getState();
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  const modalHtml = `
    <div id="wastage-modal-overlay" class="fixed inset-0 z-50 bg-primary/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in select-none">
      <div class="bg-surface-container-lowest w-full max-w-md rounded-2xl border border-outline-variant/60 shadow-2xl p-6 flex flex-col gap-4">
        
        <div class="flex items-center justify-between pb-3 border-b border-outline-variant/60">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-error text-[24px]">delete_sweep</span>
            <h3 class="font-title-lg text-primary font-bold">Record Seafood Wastage / Loss</h3>
          </div>
          <button id="close-wastage-modal-btn" class="p-1 text-outline hover:text-primary">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form id="wastage-form" class="flex flex-col gap-3.5 text-xs">
          <div>
            <label class="block font-semibold text-primary mb-1">Seafood Species</label>
            <select id="wastage-species" required class="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg text-primary font-medium focus:ring-2 focus:ring-secondary-marine">
              ${state.seafoodCatalog.map(s => `
                <option value="${s.id}">${s.name} (Available: ${s.stock} KG)</option>
              `).join('')}
            </select>
          </div>

          <div>
            <label class="block font-semibold text-primary mb-1">Wastage Quantity (KG)</label>
            <input type="number" id="wastage-qty" step="0.1" min="0.1" required placeholder="e.g. 5.5" class="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg font-mono font-bold text-error focus:ring-2 focus:ring-secondary-marine" />
          </div>

          <div>
            <label class="block font-semibold text-primary mb-1">Reason for Loss</label>
            <select id="wastage-reason" required class="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg text-primary font-medium">
              <option value="Spoilage / Quality Deterioration">Spoilage / Quality Deterioration</option>
              <option value="Handling & Transit Damage">Handling & Transit Damage</option>
              <option value="Quality Rejection by Buyer">Quality Rejection by Buyer</option>
              <option value="Crushed Ice Melting Loss">Crushed Ice Melting Loss</option>
              <option value="Dehydration & Weight Loss">Dehydration & Weight Loss</option>
              <option value="Cold Storage Malfunction">Cold Storage Malfunction</option>
              <option value="Other Wastage">Other Wastage</option>
            </select>
          </div>

          <div>
            <label class="block font-semibold text-primary mb-1">Inspector Notes</label>
            <textarea id="wastage-notes" rows="2" placeholder="e.g. Broken container ice melted on slipway" class="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-primary placeholder:text-outline focus:ring-2 focus:ring-secondary-marine"></textarea>
          </div>

          <div class="bg-error-container/20 p-3 rounded-lg border border-error/30 text-error flex items-start gap-2">
            <span class="material-symbols-outlined text-[18px] shrink-0">info</span>
            <span class="text-[11px]">
              Wastage deducts available stock immediately and logs an audited procurement cost loss in the daily financial statement.
            </span>
          </div>

          <div class="flex items-center gap-2 pt-2">
            <button type="button" id="cancel-wastage-modal-btn" class="flex-1 py-2.5 rounded-lg border border-outline-variant bg-surface hover:bg-surface-container font-semibold text-outline text-xs">
              Cancel
            </button>
            <button type="submit" id="save-wastage-btn" class="flex-1 py-2.5 rounded-lg bg-error hover:bg-red-700 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5">
              <span class="material-symbols-outlined text-[16px]">save</span>
              <span id="save-wastage-text">Record Wastage</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  `;

  modalRoot.innerHTML = modalHtml;

  const overlay = document.getElementById('wastage-modal-overlay');
  const closeBtn = document.getElementById('close-wastage-modal-btn');
  const cancelBtn = document.getElementById('cancel-wastage-modal-btn');
  const form = document.getElementById('wastage-form');
  const submitBtn = document.getElementById('save-wastage-btn');
  const submitText = document.getElementById('save-wastage-text');

  const close = () => { if (modalRoot) modalRoot.innerHTML = ''; };
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (cancelBtn) cancelBtn.addEventListener('click', close);

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const speciesId = document.getElementById('wastage-species').value;
      const quantityKg = parseFloat(document.getElementById('wastage-qty').value);
      const reason = document.getElementById('wastage-reason').value;
      const notes = document.getElementById('wastage-notes').value.trim();

      if (!quantityKg || quantityKg <= 0) {
        alert("Please enter a valid wastage quantity.");
        return;
      }

      // Duplicate submission protection
      submitBtn.disabled = true;
      submitBtn.classList.add('opacity-75', 'cursor-not-allowed');
      submitText.textContent = 'Recording Loss...';

      const result = store.recordWastage({ speciesId, quantityKg, reason, notes });
      if (result) {
        showToast(`Recorded ${quantityKg} KG wastage under ${reason}. (Est. Loss: ₹${result.estimatedLoss.toLocaleString('en-IN')})`, 'success');
      }
      close();
    });
  }
}

export function openAdjustmentModal() {
  const state = store.getState();
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  const modalHtml = `
    <div id="adj-modal-overlay" class="fixed inset-0 z-50 bg-primary/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in select-none">
      <div class="bg-surface-container-lowest w-full max-w-md rounded-2xl border border-outline-variant/60 shadow-2xl p-6 flex flex-col gap-4">
        
        <div class="flex items-center justify-between pb-3 border-b border-outline-variant/60">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-secondary-marine text-[24px]">tune</span>
            <h3 class="font-title-lg text-primary font-bold">Record Stock Adjustment</h3>
          </div>
          <button id="close-adj-modal-btn" class="p-1 text-outline hover:text-primary">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form id="adj-form" class="flex flex-col gap-3.5 text-xs">
          <div>
            <label class="block font-semibold text-primary mb-1">Seafood Species</label>
            <select id="adj-species" required class="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg text-primary font-medium focus:ring-2 focus:ring-secondary-marine">
              ${state.seafoodCatalog.map(s => `
                <option value="${s.id}">${s.name} (Current: ${s.stock} KG)</option>
              `).join('')}
            </select>
          </div>

          <div>
            <label class="block font-semibold text-primary mb-1">Adjustment Weight (KG)</label>
            <input type="number" id="adj-qty" step="0.1" required placeholder="e.g. +5.0 or -3.5" class="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg font-mono font-bold text-primary focus:ring-2 focus:ring-secondary-marine" />
            <span class="text-[10px] text-outline mt-0.5 block">Use positive value for unrecorded landings, negative for inventory count correction.</span>
          </div>

          <div>
            <label class="block font-semibold text-primary mb-1">Reason for Adjustment</label>
            <input type="text" id="adj-reason" required placeholder="e.g. Weigh station recalibration variance" class="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg text-primary focus:ring-2 focus:ring-secondary-marine" />
          </div>

          <div>
            <label class="block font-semibold text-primary mb-1">Supervisor Notes</label>
            <textarea id="adj-notes" rows="2" placeholder="e.g. Audit variance approved by Dock Master" class="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-primary placeholder:text-outline focus:ring-2 focus:ring-secondary-marine"></textarea>
          </div>

          <div class="flex items-center gap-2 pt-2">
            <button type="button" id="cancel-adj-modal-btn" class="flex-1 py-2.5 rounded-lg border border-outline-variant bg-surface hover:bg-surface-container font-semibold text-outline text-xs">
              Cancel
            </button>
            <button type="submit" id="save-adj-btn" class="flex-1 py-2.5 rounded-lg bg-primary hover:bg-primary-container text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5">
              <span class="material-symbols-outlined text-[16px]">save</span>
              <span id="save-adj-text">Save Adjustment</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  `;

  modalRoot.innerHTML = modalHtml;

  const closeBtn = document.getElementById('close-adj-modal-btn');
  const cancelBtn = document.getElementById('cancel-adj-modal-btn');
  const form = document.getElementById('adj-form');
  const submitBtn = document.getElementById('save-adj-btn');
  const submitText = document.getElementById('save-adj-text');

  const close = () => { if (modalRoot) modalRoot.innerHTML = ''; };
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (cancelBtn) cancelBtn.addEventListener('click', close);

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const speciesId = document.getElementById('adj-species').value;
      const quantityKg = parseFloat(document.getElementById('adj-qty').value);
      const reason = document.getElementById('adj-reason').value.trim();
      const notes = document.getElementById('adj-notes').value.trim();

      if (isNaN(quantityKg) || quantityKg === 0) {
        alert("Please enter a valid non-zero adjustment quantity.");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.classList.add('opacity-75', 'cursor-not-allowed');
      submitText.textContent = 'Saving...';

      const result = store.recordStockAdjustment({ speciesId, quantityKg, reason, notes });
      if (result) {
        showToast(`Stock adjusted by ${quantityKg > 0 ? '+' : ''}${quantityKg} KG under ref ${result.ref}.`, 'success');
      }
      close();
    });
  }
}
