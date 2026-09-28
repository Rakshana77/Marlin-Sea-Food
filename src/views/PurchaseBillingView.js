// PurchaseBillingView Component - Fast POS Procurement Screen (7:5 Split)
import { store } from '../state/store.js';
import { openAddFishermanModal } from '../components/AddFishermanModal.js';
import { openThermalReceiptModal } from '../components/ThermalReceiptModal.js';
import { showToast } from '../components/Toast.js';

export function renderPurchaseBillingView() {
  const state = store.getState();
  const nextNum = state.purchaseBills.length + 893;
  const billId = `PB-2026-0${nextNum}`;
  const defaultFisherman = state.fishermen[0];

  return `
    <div class="flex flex-col gap-space-md w-full max-w-[1720px] mx-auto pb-24 animate-fade-in select-none">
      
      <!-- Top Command Bar: Title, Bill Number & Scale Indicator -->
      <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-on-primary shrink-0">
            <span class="material-symbols-outlined text-[24px]">anchor</span>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="font-headline-md text-headline-md text-primary font-bold tracking-tight">New Purchase Bill</h1>
              <span class="px-2 py-0.5 rounded bg-surface-container-high text-primary font-mono text-xs font-bold tracking-wide">${billId}</span>
            </div>
            <p class="text-xs text-on-surface-variant flex items-center gap-1.5 mt-0.5">
              <span class="material-symbols-outlined text-[14px] text-secondary">schedule</span>
              <span>${state.date}, 06:45 AM</span>
              <span class="text-outline">•</span>
              <span class="text-secondary font-medium">Weigh Station #3 (Slipway North)</span>
            </p>
          </div>
        </div>

        <!-- Live Digital Scale Indicator -->
        <div class="flex items-center gap-3 bg-surface-container-low px-4 py-2 rounded-lg border border-outline-variant/50">
          <div class="flex flex-col text-right">
            <span class="font-label-caps text-outline uppercase font-semibold">Digital Scale #02</span>
            <span id="scale-weight-display" class="font-headline-md text-headline-md text-secondary-marine tabular-nums font-bold">READY (0.00 KG)</span>
          </div>
          <span class="relative flex h-3 w-3">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-fixed opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-secondary-marine"></span>
          </span>
        </div>
      </div>

      <!-- 7:5 POS Layout -->
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-space-md lg:gap-space-lg">
        
        <!-- LEFT 8 COLUMNS: Lot Intake Matrix & Fisherman Selection -->
        <div class="xl:col-span-8 flex flex-col gap-space-md">
          
          <!-- Fisherman Selector Dossier Card -->
          <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm flex flex-col gap-space-sm">
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div class="relative flex-1">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">sailing</span>
                <select 
                  id="billing-fisherman-select" 
                  class="w-full h-11 pl-9 pr-10 rounded-lg bg-surface-container-low border border-outline-variant text-sm font-semibold text-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary-marine transition-all"
                >
                  ${state.fishermen.map(f => `
                    <option value="${f.id}" ${f.id === defaultFisherman.id ? 'selected' : ''}>
                      ${f.name} — ${f.boatName} (${f.mobile})
                    </option>
                  `).join('')}
                </select>
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-outline uppercase">F2 KEY</span>
              </div>

              <button 
                id="billing-add-fisherman-btn"
                type="button"
                class="h-11 px-4 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-semibold text-xs border border-outline-variant flex items-center justify-center gap-1.5 transition-colors shrink-0"
              >
                <span class="material-symbols-outlined text-[16px] text-secondary">person_add</span>
                <span>+ New Fisherman</span>
              </button>
            </div>

            <!-- Selected Fisherman Quick Dossier Strip -->
            <div id="fisherman-dossier-strip" class="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-surface-container-low/60 rounded-lg text-xs">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-secondary text-[18px]">directions_boat</span>
                <div>
                  <span class="font-bold text-primary" id="dossier-name">${defaultFisherman.name}</span>
                  <span class="text-outline font-mono text-[11px] ml-1" id="dossier-boat">(${defaultFisherman.boatName})</span>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <div>
                  <span class="text-outline">Advance Balance:</span>
                  <span class="font-bold text-warning ml-1 tabular-nums" id="dossier-advance">₹${defaultFisherman.outstanding.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span class="text-outline">Historical Bills:</span>
                  <span class="font-bold text-primary ml-1 tabular-nums" id="dossier-bills">${defaultFisherman.totalBills}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Dynamic Lot Intake Rows -->
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm overflow-hidden flex flex-col">
            <div class="p-space-md border-b border-outline-variant/60 bg-white flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-secondary text-[20px]">set_meal</span>
                <h3 class="font-title-md text-title-md text-primary font-bold">Catch Lots & Weighment Table</h3>
              </div>
              <div class="text-xs text-outline font-mono">
                Formula: (Gross - Tare) × Rate = Total
              </div>
            </div>

            <!-- Table Container -->
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="bg-surface-container-low border-b border-outline-variant/60 text-outline font-label-caps uppercase tracking-wider">
                    <th class="py-2.5 px-3 w-44">Species</th>
                    <th class="py-2.5 px-2 text-center w-20">Crates</th>
                    <th class="py-2.5 px-2 text-right w-24">Gross KG</th>
                    <th class="py-2.5 px-2 text-right w-20">Tare KG</th>
                    <th class="py-2.5 px-2 text-right w-24">Net KG</th>
                    <th class="py-2.5 px-2 text-right w-24">Rate (₹/KG)</th>
                    <th class="py-2.5 px-3 text-right w-28">Amount</th>
                    <th class="py-2.5 px-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody id="billing-items-body" class="divide-y divide-outline-variant/40">
                  <!-- Row 1 -->
                  <tr class="lot-row bg-white hover:bg-surface-container-low/30 transition-colors">
                    <td class="p-2">
                      <select class="item-species w-full h-9 px-2 bg-surface-container-low border border-outline-variant/60 rounded-md font-semibold text-primary focus:bg-white focus:ring-1 focus:ring-secondary-marine focus:outline-none">
                        ${state.seafoodCatalog.map(s => `<option value="${s.id}" data-rate="${s.gradeA}" ${s.id === 'squid' ? 'selected' : ''}>${s.name}</option>`).join('')}
                      </select>
                    </td>
                    <td class="p-2 text-center">
                      <input type="number" min="0" value="2" class="item-crates w-14 h-9 text-center bg-surface-container-low border border-outline-variant/60 rounded-md font-bold focus:bg-white focus:ring-1 focus:ring-secondary-marine focus:outline-none tabular-nums" />
                    </td>
                    <td class="p-2 text-right">
                      <input type="number" step="0.1" value="27.5" class="item-gross w-20 h-9 text-right px-2 bg-surface-container-low border border-outline-variant/60 rounded-md font-bold text-primary focus:bg-white focus:ring-1 focus:ring-secondary-marine focus:outline-none tabular-nums" />
                    </td>
                    <td class="p-2 text-right">
                      <input type="number" step="0.1" value="2.5" class="item-tare w-16 h-9 text-right px-2 bg-surface-container-low border border-outline-variant/60 rounded-md font-medium text-outline focus:bg-white focus:ring-1 focus:ring-secondary-marine focus:outline-none tabular-nums" />
                    </td>
                    <td class="p-2 text-right">
                      <span class="item-net font-bold text-on-surface text-sm tabular-nums">25.0</span>
                    </td>
                    <td class="p-2 text-right">
                      <input type="number" value="420" class="item-rate w-20 h-9 text-right px-2 bg-surface-container-low border border-outline-variant/60 rounded-md font-bold text-secondary-marine focus:bg-white focus:ring-1 focus:ring-secondary-marine focus:outline-none tabular-nums" />
                    </td>
                    <td class="p-2 text-right">
                      <span class="item-amount font-bold text-primary text-sm tabular-nums">₹10,500</span>
                    </td>
                    <td class="p-2 text-center">
                      <button class="remove-row-btn p-1 text-outline hover:text-error rounded transition-colors" title="Delete Row">
                        <span class="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </td>
                  </tr>

                  <!-- Row 2 -->
                  <tr class="lot-row bg-white hover:bg-surface-container-low/30 transition-colors">
                    <td class="p-2">
                      <select class="item-species w-full h-9 px-2 bg-surface-container-low border border-outline-variant/60 rounded-md font-semibold text-primary focus:bg-white focus:ring-1 focus:ring-secondary-marine focus:outline-none">
                        ${state.seafoodCatalog.map(s => `<option value="${s.id}" data-rate="${s.gradeA}" ${s.id === 'crab' ? 'selected' : ''}>${s.name}</option>`).join('')}
                      </select>
                    </td>
                    <td class="p-2 text-center">
                      <input type="number" min="0" value="1" class="item-crates w-14 h-9 text-center bg-surface-container-low border border-outline-variant/60 rounded-md font-bold focus:bg-white focus:ring-1 focus:ring-secondary-marine focus:outline-none tabular-nums" />
                    </td>
                    <td class="p-2 text-right">
                      <input type="number" step="0.1" value="11.5" class="item-gross w-20 h-9 text-right px-2 bg-surface-container-low border border-outline-variant/60 rounded-md font-bold text-primary focus:bg-white focus:ring-1 focus:ring-secondary-marine focus:outline-none tabular-nums" />
                    </td>
                    <td class="p-2 text-right">
                      <input type="number" step="0.1" value="1.5" class="item-tare w-16 h-9 text-right px-2 bg-surface-container-low border border-outline-variant/60 rounded-md font-medium text-outline focus:bg-white focus:ring-1 focus:ring-secondary-marine focus:outline-none tabular-nums" />
                    </td>
                    <td class="p-2 text-right">
                      <span class="item-net font-bold text-on-surface text-sm tabular-nums">10.0</span>
                    </td>
                    <td class="p-2 text-right">
                      <input type="number" value="620" class="item-rate w-20 h-9 text-right px-2 bg-surface-container-low border border-outline-variant/60 rounded-md font-bold text-secondary-marine focus:bg-white focus:ring-1 focus:ring-secondary-marine focus:outline-none tabular-nums" />
                    </td>
                    <td class="p-2 text-right">
                      <span class="item-amount font-bold text-primary text-sm tabular-nums">₹6,200</span>
                    </td>
                    <td class="p-2 text-center">
                      <button class="remove-row-btn p-1 text-outline hover:text-error rounded transition-colors" title="Delete Row">
                        <span class="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Table Footer Actions -->
            <div class="p-space-md bg-surface-container-low border-t border-outline-variant/60 flex flex-wrap items-center justify-between gap-2">
              <button 
                id="billing-add-row-btn"
                type="button"
                class="px-4 py-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-primary font-semibold text-xs border border-outline-variant shadow-xs flex items-center gap-1.5 transition-all"
              >
                <span class="material-symbols-outlined text-[18px] text-secondary">add_circle</span>
                <span>+ Add Seafood Row (F4)</span>
              </button>

              <div class="flex items-center gap-3 text-xs text-on-surface-variant font-mono">
                <span>Tab: Next field</span>
                <span>•</span>
                <span>Ctrl+Enter: Save Bill</span>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT 4 COLUMNS: Sticky Financial Settlement Slate -->
        <div class="xl:col-span-4 flex flex-col gap-space-md">
          <div class="bg-surface-container-lowest p-space-lg rounded-xl border border-outline-variant/60 shadow-sm flex flex-col gap-space-md sticky top-20">
            <div class="border-b border-outline-variant/60 pb-3">
              <span class="font-label-caps uppercase text-outline tracking-wider font-semibold">Harbor Procurement Audit</span>
              <h2 class="font-headline-md text-headline-md text-primary font-bold">Settlement Summary</h2>
            </div>

            <!-- Financial Recap -->
            <div class="bg-surface-container-low p-space-md rounded-lg flex flex-col gap-2.5 text-xs">
              <div class="flex justify-between items-center">
                <span class="text-on-surface-variant">Total Net Catch:</span>
                <span id="settle-total-kg" class="font-headline-md text-headline-md text-primary font-bold tabular-nums">35.0 KG</span>
              </div>

              <div class="flex justify-between items-center">
                <span class="text-on-surface-variant">Gross Catch Value:</span>
                <span id="settle-subtotal" class="font-title-lg text-title-lg text-primary font-bold tabular-nums">₹16,700</span>
              </div>

              <div class="flex justify-between items-center text-on-surface-variant">
                <span>Plastic Crate Deduction:</span>
                <div class="flex items-center gap-1">
                  <span>-₹</span>
                  <input type="number" id="settle-crate-deduction" value="300" class="w-16 h-7 text-right px-1 bg-white border border-outline-variant rounded font-mono font-bold text-xs" />
                </div>
              </div>

              <div class="flex justify-between items-center text-on-surface-variant">
                <span>Diesel / Cash Advance Adj:</span>
                <div class="flex items-center gap-1">
                  <span>-₹</span>
                  <input type="number" id="settle-advance-deduction" value="2000" class="w-16 h-7 text-right px-1 bg-white border border-outline-variant rounded font-mono font-bold text-xs" />
                </div>
              </div>

              <!-- Net Payable Hero -->
              <div class="border-t border-outline-variant pt-2 mt-1 flex justify-between items-baseline">
                <span class="font-bold text-sm text-primary">NET PAYABLE:</span>
                <span id="settle-grand-total" class="font-headline-lg text-headline-lg text-profit font-bold tabular-nums">₹14,400</span>
              </div>
            </div>

            <!-- Payment Mode Selector -->
            <div>
              <label class="block text-xs font-semibold text-on-surface mb-1.5">Disbursement Method</label>
              <div class="grid grid-cols-4 gap-1.5" id="payment-mode-group">
                <button type="button" data-method="Cash" class="pay-mode-btn py-2 text-xs rounded-lg font-bold border border-secondary-marine bg-secondary-marine text-white shadow-xs">Cash</button>
                <button type="button" data-method="UPI" class="pay-mode-btn py-2 text-xs rounded-lg font-semibold border border-outline-variant bg-surface-container-low text-on-surface hover:bg-surface-container">UPI</button>
                <button type="button" data-method="Bank" class="pay-mode-btn py-2 text-xs rounded-lg font-semibold border border-outline-variant bg-surface-container-low text-on-surface hover:bg-surface-container">Bank</button>
                <button type="button" data-method="Credit" class="pay-mode-btn py-2 text-xs rounded-lg font-semibold border border-outline-variant bg-surface-container-low text-on-surface hover:bg-surface-container">Credit</button>
              </div>
            </div>

            <!-- Large Save Primary Button -->
            <button 
              id="billing-save-btn"
              type="button"
              class="w-full py-3.5 rounded-lg bg-primary text-white font-title-lg text-base font-bold shadow-md hover:bg-primary-container active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span class="material-symbols-outlined text-[20px] text-secondary-fixed">save</span>
              <span>SAVE & PRINT BILL [Ctrl+Enter]</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  `;
}

export function bindPurchaseBillingEvents() {
  const container = document.getElementById('app');
  if (!container) return;

  const state = store.getState();
  let selectedMethod = 'Cash';

  // Fisherman selection change
  const fishermanSelect = container.querySelector('#billing-fisherman-select');
  if (fishermanSelect) {
    fishermanSelect.addEventListener('change', (e) => {
      const f = state.fishermen.find(item => item.id === e.target.value);
      if (f) {
        container.querySelector('#dossier-name').textContent = f.name;
        container.querySelector('#dossier-boat').textContent = `(${f.boatName})`;
        container.querySelector('#dossier-advance').textContent = `₹${f.outstanding.toLocaleString('en-IN')}`;
        container.querySelector('#dossier-bills').textContent = f.totalBills;
      }
    });
  }

  // Quick add fisherman button
  const addFishBtn = container.querySelector('#billing-add-fisherman-btn');
  if (addFishBtn) {
    addFishBtn.addEventListener('click', () => {
      openAddFishermanModal((newF) => {
        // Append to dropdown and select
        const opt = document.createElement('option');
        opt.value = newF.id;
        opt.textContent = `${newF.name} — ${newF.boatName} (${newF.mobile})`;
        opt.selected = true;
        fishermanSelect.appendChild(opt);
        fishermanSelect.dispatchEvent(new Event('change'));
      });
    });
  }

  // Payment mode toggle
  container.querySelectorAll('.pay-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedMethod = btn.dataset.method;
      container.querySelectorAll('.pay-mode-btn').forEach(b => {
        b.className = 'pay-mode-btn py-2 text-xs rounded-lg font-semibold border border-outline-variant bg-surface-container-low text-on-surface hover:bg-surface-container';
      });
      btn.className = 'pay-mode-btn py-2 text-xs rounded-lg font-bold border border-secondary-marine bg-secondary-marine text-white shadow-xs';
    });
  });

  // Calculation Recalibrator
  function recalculate() {
    let totalKg = 0;
    let subtotal = 0;
    let totalCrates = 0;

    container.querySelectorAll('.lot-row').forEach(row => {
      const crates = parseFloat(row.querySelector('.item-crates').value) || 0;
      const gross = parseFloat(row.querySelector('.item-gross').value) || 0;
      const tare = parseFloat(row.querySelector('.item-tare').value) || 0;
      const rate = parseFloat(row.querySelector('.item-rate').value) || 0;

      const net = Math.max(0, gross - tare);
      const amount = net * rate;

      row.querySelector('.item-net').textContent = net.toFixed(1);
      row.querySelector('.item-amount').textContent = `₹${Math.round(amount).toLocaleString('en-IN')}`;

      totalKg += net;
      subtotal += amount;
      totalCrates += crates;
    });

    const crateDeduction = parseFloat(container.querySelector('#settle-crate-deduction').value) || 0;
    const advanceDeduction = parseFloat(container.querySelector('#settle-advance-deduction').value) || 0;
    const grandTotal = Math.max(0, subtotal - crateDeduction - advanceDeduction);

    container.querySelector('#settle-total-kg').textContent = `${totalKg.toFixed(1)} KG`;
    container.querySelector('#settle-subtotal').textContent = `₹${Math.round(subtotal).toLocaleString('en-IN')}`;
    container.querySelector('#settle-grand-total').textContent = `₹${Math.round(grandTotal).toLocaleString('en-IN')}`;

    return { totalKg, subtotal, crateDeduction, advanceDeduction, grandTotal, totalCrates };
  }

  // Row input listeners
  function bindRowEvents(row) {
    const inputs = row.querySelectorAll('input, select');
    inputs.forEach(input => {
      input.addEventListener('input', recalculate);
    });

    const speciesSelect = row.querySelector('.item-species');
    speciesSelect.addEventListener('change', () => {
      const selectedOption = speciesSelect.options[speciesSelect.selectedIndex];
      const rate = selectedOption.dataset.rate;
      if (rate) {
        row.querySelector('.item-rate').value = rate;
      }
      recalculate();
    });

    const removeBtn = row.querySelector('.remove-row-btn');
    removeBtn.addEventListener('click', () => {
      if (container.querySelectorAll('.lot-row').length > 1) {
        row.remove();
        recalculate();
      } else {
        showToast("Bill must contain at least one seafood item.", "warning");
      }
    });
  }

  container.querySelectorAll('.lot-row').forEach(bindRowEvents);

  container.querySelector('#settle-crate-deduction').addEventListener('input', recalculate);
  container.querySelector('#settle-advance-deduction').addEventListener('input', recalculate);

  // Add Row Button
  const addRowBtn = container.querySelector('#billing-add-row-btn');
  addRowBtn.addEventListener('click', () => {
    const tbody = container.querySelector('#billing-items-body');
    const tr = document.createElement('tr');
    tr.className = 'lot-row bg-white hover:bg-surface-container-low/30 transition-colors';
    tr.innerHTML = `
      <td class="p-2">
        <select class="item-species w-full h-9 px-2 bg-surface-container-low border border-outline-variant/60 rounded-md font-semibold text-primary focus:bg-white focus:ring-1 focus:ring-secondary-marine focus:outline-none">
          ${state.seafoodCatalog.map(s => `<option value="${s.id}" data-rate="${s.gradeA}">${s.name}</option>`).join('')}
        </select>
      </td>
      <td class="p-2 text-center">
        <input type="number" min="0" value="1" class="item-crates w-14 h-9 text-center bg-surface-container-low border border-outline-variant/60 rounded-md font-bold focus:bg-white focus:ring-1 focus:ring-secondary-marine focus:outline-none tabular-nums" />
      </td>
      <td class="p-2 text-right">
        <input type="number" step="0.1" value="10.0" class="item-gross w-20 h-9 text-right px-2 bg-surface-container-low border border-outline-variant/60 rounded-md font-bold text-primary focus:bg-white focus:ring-1 focus:ring-secondary-marine focus:outline-none tabular-nums" />
      </td>
      <td class="p-2 text-right">
        <input type="number" step="0.1" value="1.0" class="item-tare w-16 h-9 text-right px-2 bg-surface-container-low border border-outline-variant/60 rounded-md font-medium text-outline focus:bg-white focus:ring-1 focus:ring-secondary-marine focus:outline-none tabular-nums" />
      </td>
      <td class="p-2 text-right">
        <span class="item-net font-bold text-on-surface text-sm tabular-nums">9.0</span>
      </td>
      <td class="p-2 text-right">
        <input type="number" value="${state.seafoodCatalog[0].gradeA}" class="item-rate w-20 h-9 text-right px-2 bg-surface-container-low border border-outline-variant/60 rounded-md font-bold text-secondary-marine focus:bg-white focus:ring-1 focus:ring-secondary-marine focus:outline-none tabular-nums" />
      </td>
      <td class="p-2 text-right">
        <span class="item-amount font-bold text-primary text-sm tabular-nums">₹${Math.round(9 * state.seafoodCatalog[0].gradeA).toLocaleString('en-IN')}</span>
      </td>
      <td class="p-2 text-center">
        <button class="remove-row-btn p-1 text-outline hover:text-error rounded transition-colors" title="Delete Row">
          <span class="material-symbols-outlined text-[16px]">close</span>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
    bindRowEvents(tr);
    recalculate();
  });

  // Save Bill Action
  const saveBtn = container.querySelector('#billing-save-btn');
  const executeSave = () => {
    const calc = recalculate();
    const fishermanId = fishermanSelect.value;
    const fisherman = state.fishermen.find(f => f.id === fishermanId) || state.fishermen[0];

    const items = [];
    container.querySelectorAll('.lot-row').forEach(row => {
      const select = row.querySelector('.item-species');
      const speciesId = select.value;
      const speciesName = select.options[select.selectedIndex].textContent;
      const crates = parseFloat(row.querySelector('.item-crates').value) || 0;
      const grossKg = parseFloat(row.querySelector('.item-gross').value) || 0;
      const tareKg = parseFloat(row.querySelector('.item-tare').value) || 0;
      const netKg = parseFloat(row.querySelector('.item-net').textContent) || 0;
      const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
      const amount = netKg * rate;

      items.push({ speciesId, speciesName, crates, grossKg, tareKg, netKg, rate, amount });
    });

    const bill = store.addPurchaseBill({
      fishermanId: fisherman.id,
      fishermanName: fisherman.name,
      boatName: fisherman.boatName,
      mobile: fisherman.mobile,
      items,
      totalKg: calc.totalKg,
      totalCrates: calc.totalCrates,
      subtotal: calc.subtotal,
      crateDeduction: calc.crateDeduction,
      advanceDeduction: calc.advanceDeduction,
      grandTotal: calc.grandTotal,
      paymentMethod: selectedMethod
    });

    showToast(`Bill ${bill.id} saved successfully!`, 'success');
    openThermalReceiptModal(bill);
  };

  saveBtn.addEventListener('click', executeSave);

  // Keyboard shortcut listener on this view
  const keyHandler = (e) => {
    if (e.key === 'F2') {
      e.preventDefault();
      fishermanSelect.focus();
    } else if (e.key === 'F4') {
      e.preventDefault();
      addRowBtn.click();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      executeSave();
    }
  };

  window.addEventListener('keydown', keyHandler);
}
