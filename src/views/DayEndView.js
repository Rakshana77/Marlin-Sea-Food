// DayEndView Component - Daily Operational & Seafood Flow Reconciliation
import { store } from '../state/store.js';
import { openDayEndCloseModal } from '../components/DayEndCloseModal.js';
import { showToast } from '../components/Toast.js';

export function renderDayEndView() {
  const state = store.getState();
  const summary = store.getFinancialSummary();
  const flow = store.getDailySeafoodFlow();
  const flowSum = flow.summary;

  const totalExpenses = state.expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const salaryExpenses = state.expenses.filter(e => e.category === 'Salary').reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const operationalExpenses = totalExpenses - salaryExpenses;

  const isReconciled = flowSum.closingKg === 0;

  return `
    <div class="flex flex-col gap-space-md w-full max-w-[1720px] mx-auto pb-24 animate-fade-in select-none">
      
      <!-- Top Action Strip -->
      <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="font-headline-md text-headline-md text-primary font-bold tracking-tight">Daily Operational Reconciliation</h1>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
              state.isDayClosed ? 'bg-primary text-white' : 'bg-secondary-container text-on-secondary-container'
            }">
              ${state.isDayClosed ? 'DAY CLOSED & LOCKED' : 'SHIFT ACTIVE'}
            </span>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
              isReconciled ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900 animate-pulse'
            }">
              ${isReconciled ? '✓ STOCK FULLY RECONCILED (0 KG)' : `⚠️ ${flowSum.closingKg.toFixed(1)} KG UNRECONCILED`}
            </span>
          </div>
          <p class="text-xs text-on-surface-variant font-mono mt-0.5">
            ${state.date} • ${state.shift} • Terminal Gate #WS-409 • Currency: ₹ (INR)
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button id="day-end-print-btn" class="px-3.5 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-semibold text-xs border border-outline-variant flex items-center gap-1.5 transition-colors">
            <span class="material-symbols-outlined text-[16px]">print</span>
            <span>Print Statement</span>
          </button>

          <button id="day-end-pdf-btn" class="px-3.5 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-semibold text-xs border border-outline-variant flex items-center gap-1.5 transition-colors">
            <span class="material-symbols-outlined text-[16px]">picture_as_pdf</span>
            <span>Download Audit PDF</span>
          </button>

          <button 
            id="day-end-close-action-btn"
            ${state.isDayClosed ? 'disabled' : ''}
            class="px-5 py-2 rounded-lg ${
              state.isDayClosed 
                ? 'bg-outline text-white cursor-not-allowed' 
                : isReconciled
                  ? 'bg-primary text-white hover:bg-primary-container active:scale-95 shadow-sm'
                  : 'bg-amber-600 text-white hover:bg-amber-700 active:scale-95 shadow-sm'
            } font-semibold text-xs transition-all flex items-center gap-1.5"
          >
            <span class="material-symbols-outlined text-[16px] text-secondary-fixed">lock</span>
            <span>${state.isDayClosed ? 'Day Already Locked' : isReconciled ? 'Close Day & Lock' : 'Reconcile & Close Day'}</span>
          </button>
        </div>
      </div>

      <!-- Unreconciled Warning Banner (if closingKg > 0) -->
      ${!isReconciled ? `
        <div class="bg-amber-500/10 border-2 border-amber-500/40 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
          <div class="flex items-start gap-3">
            <span class="material-symbols-outlined text-amber-600 text-2xl shrink-0 mt-0.5">warning</span>
            <div>
              <h4 class="text-sm font-bold text-amber-900 dark:text-amber-200">
                Action Required: ${flowSum.closingKg.toFixed(1)} KG Seafood Remains Unreconciled
              </h4>
              <p class="text-xs text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                Under Marine Seafoods daily inventory flow, daily opening is 0 KG and expected closing is 0 KG. 
                Remaining seafood must be accounted for via Wholesale/Export sale, Wastage/Damage recording, or verified adjustment before clean day closure.
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button id="day-end-nav-stock-btn" class="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-xs">
              <span class="material-symbols-outlined text-[15px]">inventory_2</span>
              <span>Resolve in Stock Ledger</span>
            </button>
          </div>
        </div>
      ` : `
        <div class="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 flex items-center gap-3">
          <span class="material-symbols-outlined text-emerald-600 text-2xl shrink-0">verified</span>
          <div class="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
            <strong class="font-bold">Perfect Seafood Balance:</strong> All landed seafood has been accounted for: 
            <span class="font-mono font-bold">${flowSum.receivedKg.toFixed(1)} KG</span> received − 
            <span class="font-mono font-bold">${flowSum.soldKg.toFixed(1)} KG</span> sold − 
            <span class="font-mono font-bold">${flowSum.wastageKg.toFixed(1)} KG</span> wastage = 
            <span class="font-mono font-bold">0.0 KG</span> closing.
          </div>
        </div>
      `}

      <!-- Seafood Flow Reconciler (5-Phase Hero) -->
      <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm flex flex-col gap-3">
        <div class="flex items-center justify-between border-b border-outline-variant/60 pb-2">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-xl">sync_alt</span>
            <h3 class="font-title-md font-bold text-primary">Daily Seafood Physical Flow</h3>
          </div>
          <span class="text-xs font-mono text-outline">Target Closing: 0.0 KG</span>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
          <!-- Opening -->
          <div class="bg-surface-container-low/70 p-3 rounded-xl border border-outline-variant/40 flex flex-col justify-between">
            <div>
              <span class="text-[11px] font-bold uppercase tracking-wider text-outline">1. Opening Daily Stock</span>
              <p class="text-[10px] text-outline mt-0.5">Mandatory zero start</p>
            </div>
            <div class="mt-3">
              <span class="text-2xl font-black font-mono text-primary">0.0</span>
              <span class="text-xs text-outline font-semibold">KG</span>
            </div>
          </div>

          <!-- Received -->
          <div class="bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/20 flex flex-col justify-between">
            <div>
              <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-700">2. Fishermen Collections</span>
              <p class="text-[10px] text-outline mt-0.5">Landed catches</p>
            </div>
            <div class="mt-3">
              <span class="text-2xl font-black font-mono text-emerald-600">+${flowSum.receivedKg.toFixed(1)}</span>
              <span class="text-xs text-emerald-700 font-semibold">KG</span>
            </div>
          </div>

          <!-- Sold -->
          <div class="bg-blue-500/5 p-3 rounded-xl border border-blue-500/20 flex flex-col justify-between">
            <div>
              <span class="text-[11px] font-bold uppercase tracking-wider text-blue-700">3. Wholesale & Export Sold</span>
              <p class="text-[10px] text-outline mt-0.5">Dispatched lots</p>
            </div>
            <div class="mt-3">
              <span class="text-2xl font-black font-mono text-blue-600">-${flowSum.soldKg.toFixed(1)}</span>
              <span class="text-xs text-blue-700 font-semibold">KG</span>
            </div>
          </div>

          <!-- Wastage -->
          <div class="bg-rose-500/5 p-3 rounded-xl border border-rose-500/20 flex flex-col justify-between">
            <div>
              <span class="text-[11px] font-bold uppercase tracking-wider text-rose-700">4. Wastage & Loss</span>
              <p class="text-[10px] text-outline mt-0.5">Spoilage / Handling</p>
            </div>
            <div class="mt-3">
              <span class="text-2xl font-black font-mono text-rose-600">-${flowSum.wastageKg.toFixed(1)}</span>
              <span class="text-xs text-rose-700 font-semibold">KG</span>
            </div>
          </div>

          <!-- Closing Balance -->
          <div class="col-span-2 md:col-span-1 p-3 rounded-xl border-2 ${
            isReconciled 
              ? 'bg-emerald-500/10 border-emerald-500/50' 
              : 'bg-amber-500/10 border-amber-500/60 animate-pulse'
          } flex flex-col justify-between">
            <div>
              <span class="text-[11px] font-bold uppercase tracking-wider ${isReconciled ? 'text-emerald-800' : 'text-amber-900'}">
                5. Closing Stock
              </span>
              <p class="text-[10px] text-outline mt-0.5">Reconciled balance</p>
            </div>
            <div class="mt-3">
              <span class="text-2xl font-black font-mono ${isReconciled ? 'text-emerald-700' : 'text-amber-800'}">
                ${flowSum.closingKg.toFixed(1)}
              </span>
              <span class="text-xs font-semibold ${isReconciled ? 'text-emerald-800' : 'text-amber-900'}">KG</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Financial Reconciliation Flow Bento -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-md">
        
        <!-- Procurement -->
        <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm flex flex-col justify-between">
          <div>
            <span class="text-xs font-semibold text-outline uppercase tracking-wider block mb-1">Catch Procurement</span>
            <span class="font-headline-md text-headline-md text-primary font-bold tabular-nums">₹${summary.todayPurchases.toLocaleString('en-IN')}</span>
          </div>
          <span class="text-xs text-on-surface-variant block mt-2">${summary.totalPurchasedKg} KG Landed</span>
        </div>

        <!-- Sales -->
        <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm flex flex-col justify-between">
          <div>
            <span class="text-xs font-semibold text-outline uppercase tracking-wider block mb-1">Wholesale & Export Sales</span>
            <span class="font-headline-md text-headline-md text-primary font-bold tabular-nums">₹${summary.todaySales.toLocaleString('en-IN')}</span>
          </div>
          <span class="text-xs text-on-surface-variant block mt-2">${summary.totalExportedKg} KG Dispatched</span>
        </div>

        <!-- Wastage Value Loss -->
        <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm flex flex-col justify-between">
          <div>
            <span class="text-xs font-semibold text-outline uppercase tracking-wider block mb-1">Wastage / Loss Value</span>
            <span class="font-headline-md text-headline-md text-rose-600 font-bold tabular-nums">₹${flowSum.totalWastageValue.toLocaleString('en-IN')}</span>
          </div>
          <span class="text-xs text-rose-700 block mt-2">At procurement rate</span>
        </div>

        <!-- Operating Expenses & Salary -->
        <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm flex flex-col justify-between">
          <div>
            <span class="text-xs font-semibold text-outline uppercase tracking-wider block mb-1">Operational & Salaries</span>
            <span class="font-headline-md text-headline-md text-error font-bold tabular-nums">₹${totalExpenses.toLocaleString('en-IN')}</span>
          </div>
          <span class="text-[11px] text-outline block mt-2 font-mono">
            Ops: ₹${operationalExpenses.toLocaleString('en-IN')} | Salaries: ₹${salaryExpenses.toLocaleString('en-IN')}
          </span>
        </div>

        <!-- Net Daily Realized -->
        <div class="bg-profit-bg/40 p-space-md rounded-xl border border-profit/40 shadow-sm flex flex-col justify-between">
          <div>
            <span class="text-xs font-bold text-profit uppercase tracking-wider block mb-1">Net Realized Result</span>
            <span class="font-headline-md text-headline-md text-profit font-bold tabular-nums">₹${summary.netProfit.toLocaleString('en-IN')}</span>
          </div>
          <span class="text-xs text-profit font-medium block mt-2">Sales − Catches − Expenses</span>
        </div>

      </div>

      <!-- Species Level Reconciliation Ledger Table -->
      <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm overflow-hidden flex flex-col">
        <div class="p-space-md border-b border-outline-variant/60 bg-white dark:bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <h3 class="font-title-md text-title-md text-primary font-bold">Species Daily Flow Ledger</h3>
            <span class="text-xs text-outline font-mono">(${flow.items.length} Species)</span>
          </div>
          <span class="text-xs text-outline">
            Audit Formula: Opening (0) + Received − Sold − Wastage = Closing (0 KG Target)
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-surface-container-low border-b border-outline-variant/60 text-outline font-label-caps uppercase tracking-wider">
                <th class="py-2.5 px-4">Seafood Species</th>
                <th class="py-2.5 px-3 text-right">Opening</th>
                <th class="py-2.5 px-3 text-right">Received (KG)</th>
                <th class="py-2.5 px-3 text-right">Sold (KG)</th>
                <th class="py-2.5 px-3 text-right">Wastage (KG)</th>
                <th class="py-2.5 px-3 text-right">Closing (KG)</th>
                <th class="py-2.5 px-3 text-right">Wastage Loss (₹)</th>
                <th class="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant/40">
              ${flow.items.map(item => `
                <tr class="hover:bg-surface-container-low/30 transition-colors">
                  <td class="py-2.5 px-4 font-medium text-primary">
                    ${item.name}
                    <span class="text-[10px] text-outline block uppercase tracking-wider font-normal">${item.category}</span>
                  </td>
                  <td class="py-2.5 px-3 text-right font-mono text-outline tabular-nums">0.0</td>
                  <td class="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 tabular-nums">
                    +${item.receivedKg.toFixed(1)}
                  </td>
                  <td class="py-2.5 px-3 text-right font-mono font-bold text-blue-600 tabular-nums">
                    -${item.soldKg.toFixed(1)}
                  </td>
                  <td class="py-2.5 px-3 text-right font-mono font-bold text-rose-600 tabular-nums">
                    ${item.wastageKg > 0 ? `-${item.wastageKg.toFixed(1)}` : '0.0'}
                  </td>
                  <td class="py-2.5 px-3 text-right font-mono font-black ${item.remainingKg === 0 ? 'text-primary' : 'text-amber-700'} tabular-nums">
                    ${item.remainingKg.toFixed(1)}
                  </td>
                  <td class="py-2.5 px-3 text-right font-mono text-rose-600 font-semibold tabular-nums">
                    ₹${item.wastageLoss.toLocaleString('en-IN')}
                  </td>
                  <td class="py-2.5 px-4 text-center">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.remainingKg === 0 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-amber-100 text-amber-900'
                    }">
                      ${item.remainingKg === 0 ? '✓ Balanced' : `⚠️ ${item.remainingKg.toFixed(1)} KG Pending`}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Cash Float & Electronic Tenders Balancing -->
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
              <span class="text-outline">Outward Fisherman Settlement Cash:</span>
              <span class="font-mono font-bold text-error tabular-nums">-₹54,000</span>
            </div>
            <div class="flex justify-between">
              <span class="text-outline">Direct Cash Operational Expenses:</span>
              <span class="font-mono font-bold text-error tabular-nums">-₹${totalExpenses.toLocaleString('en-IN')}</span>
            </div>
            <div class="border-t border-outline-variant pt-2 flex justify-between font-bold text-sm">
              <span class="text-primary">EXPECTED PHYSICAL DRAWER CASH:</span>
              <span class="text-secondary-marine font-mono text-base tabular-nums">₹${Math.max(0, 20000 + 75000 - 54000 - totalExpenses).toLocaleString('en-IN')}</span>
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
              <span class="text-outline">NEFT / RTGS Exporter Bank Credits:</span>
              <span class="font-mono font-bold text-primary tabular-nums">₹18,000</span>
            </div>
            <div class="flex justify-between">
              <span class="text-outline">Fishermen Credit Advances Disbursed:</span>
              <span class="font-mono font-bold text-warning tabular-nums">₹15,000</span>
            </div>
            <div class="border-t border-outline-variant pt-2 flex justify-between font-bold text-sm">
              <span class="text-primary">TOTAL DIGITAL RECORDED VOLUME:</span>
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

  const navStockBtn = container.querySelector('#day-end-nav-stock-btn');
  if (navStockBtn) {
    navStockBtn.addEventListener('click', () => {
      store.navigate('stock');
    });
  }

  const printBtn = container.querySelector('#day-end-print-btn');
  if (printBtn) {
    printBtn.addEventListener('click', () => window.print());
  }

  const pdfBtn = container.querySelector('#day-end-pdf-btn');
  if (pdfBtn) {
    pdfBtn.addEventListener('click', () => {
      showToast("Daily Operational Audit Statement PDF downloaded.", "success");
    });
  }
}
