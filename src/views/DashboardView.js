// DashboardView Component
import { store } from '../state/store.js';
import { openThermalReceiptModal } from '../components/ThermalReceiptModal.js';
import { openWhatsAppModal } from '../components/WhatsAppPreviewModal.js';
import { openAddFishermanModal } from '../components/AddFishermanModal.js';
import { openDayEndCloseModal } from '../components/DayEndCloseModal.js';
import { showToast } from '../components/Toast.js';

export function renderDashboardView() {
  const state = store.getState();
  const summary = store.getFinancialSummary();
  const flow = store.getDailySeafoodFlow();
  const flowSum = flow.summary;
  const buyerOutstanding = state.customers.reduce((acc, c) => acc + (c.outstanding || 0), 0);

  return `
    <div class="flex flex-col gap-space-lg w-full max-w-[1720px] mx-auto pb-24 animate-fade-in">
      
      <!-- Operational Context Header Bar -->
      <div class="relative overflow-hidden rounded-xl bg-surface-container-lowest border border-outline-variant/60 p-space-md lg:p-space-lg shadow-sm">
        <div class="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-secondary/5 blur-3xl pointer-events-none"></div>
        <div class="absolute right-48 -bottom-20 w-64 h-64 rounded-full bg-primary/5 blur-2xl pointer-events-none"></div>
        
        <div class="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-space-md">
          <div>
            <div class="flex flex-wrap items-center gap-2 text-outline mb-1 text-xs">
              <span class="font-label-caps uppercase tracking-wider text-secondary font-bold">Terminal Gate 04</span>
              <span>•</span>
              <span class="text-on-surface-variant">${state.date} (${state.shift})</span>
              <span>•</span>
              <span class="inline-flex items-center gap-1.5 text-secondary font-medium">
                <span class="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                Harbor Weighbridge Live
              </span>
            </div>
            <div class="flex items-baseline gap-2">
              <h1 class="font-headline-lg text-headline-lg text-primary tracking-tight">Marine Seafoods Operations</h1>
              <span class="font-label-caps px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-mono">${state.terminal}</span>
            </div>
          </div>

          <!-- Quick Action CTAs -->
          <div class="flex flex-wrap items-center gap-2">
            <button 
              data-nav="purchase-bills"
              class="inline-flex items-center gap-1.5 px-4 py-2 bg-secondary-marine text-white rounded-lg font-title-md text-sm shadow-sm hover:opacity-95 active:scale-95 transition-all"
            >
              <span class="material-symbols-outlined text-[18px]">receipt_long</span>
              <span>+ Record Collection</span>
            </button>

            <button 
              data-nav="export-bills"
              class="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg font-title-md text-sm shadow-sm hover:bg-primary-container active:scale-95 transition-all"
            >
              <span class="material-symbols-outlined text-[18px]">local_shipping</span>
              <span>+ Export Bill</span>
            </button>

            <button 
              id="dash-add-fisherman-btn"
              class="inline-flex items-center gap-1.5 px-3 py-2 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-lg text-sm font-medium border border-outline-variant/60 transition-colors"
            >
              <span class="material-symbols-outlined text-[18px] text-secondary">sailing</span>
              <span>+ Fisherman</span>
            </button>

            <button 
              data-nav="expenses"
              class="inline-flex items-center gap-1.5 px-3 py-2 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-lg text-sm font-medium border border-outline-variant/60 transition-colors"
            >
              <span class="material-symbols-outlined text-[18px] text-error">receipt_long</span>
              <span>+ Expense</span>
            </button>

            <button 
              id="dash-close-day-btn"
              class="inline-flex items-center gap-1.5 px-3 py-2 bg-surface-container-high hover:bg-surface-container-highest text-primary font-semibold text-sm rounded-lg border border-outline-variant transition-colors"
            >
              <span class="material-symbols-outlined text-[18px] text-primary">lock_clock</span>
              <span>Day Out</span>
            </button>
          </div>
        </div>
      </div>

      <!-- TODAY'S SEAFOOD FLOW (Section 5 Requirement) -->
      <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm flex flex-col gap-3">
        <div class="flex items-center justify-between border-b border-outline-variant/60 pb-2">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-secondary text-xl">cyclone</span>
            <h3 class="font-title-md font-bold text-primary">Today's Seafood Daily Cycle Flow</h3>
          </div>
          <button data-nav="stock" class="text-xs text-primary font-bold hover:underline flex items-center gap-1">
            <span>Manage Daily Stock Ledger</span>
            <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div class="bg-surface-container-low/70 p-3 rounded-lg border border-outline-variant/40 flex flex-col justify-between">
            <span class="text-[10px] font-bold uppercase tracking-wider text-outline">Opening Daily Stock</span>
            <div class="mt-2">
              <span class="text-2xl font-black font-mono text-primary">0.0</span>
              <span class="text-xs text-outline font-semibold">KG</span>
            </div>
            <span class="text-[10px] text-outline mt-1">Starts at 0 KG</span>
          </div>

          <div class="bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/20 flex flex-col justify-between">
            <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Received Today</span>
            <div class="mt-2">
              <span class="text-2xl font-black font-mono text-emerald-600">+${flowSum.receivedKg.toFixed(1)}</span>
              <span class="text-xs text-emerald-700 font-semibold">KG</span>
            </div>
            <span class="text-[10px] text-emerald-700 mt-1">Landed catch</span>
          </div>

          <div class="bg-blue-500/5 p-3 rounded-lg border border-blue-500/20 flex flex-col justify-between">
            <span class="text-[10px] font-bold uppercase tracking-wider text-blue-700">Sold Today</span>
            <div class="mt-2">
              <span class="text-2xl font-black font-mono text-blue-600">-${flowSum.soldKg.toFixed(1)}</span>
              <span class="text-xs text-blue-700 font-semibold">KG</span>
            </div>
            <span class="text-[10px] text-blue-700 mt-1">Export & wholesale</span>
          </div>

          <div class="bg-rose-500/5 p-3 rounded-lg border border-rose-500/20 flex flex-col justify-between">
            <span class="text-[10px] font-bold uppercase tracking-wider text-rose-700">Wastage Today</span>
            <div class="mt-2">
              <span class="text-2xl font-black font-mono text-rose-600">-${flowSum.wastageKg.toFixed(1)}</span>
              <span class="text-xs text-rose-700 font-semibold">KG</span>
            </div>
            <span class="text-[10px] text-rose-700 mt-1">Recorded spoilage</span>
          </div>

          <div class="col-span-2 md:col-span-1 p-3 rounded-lg border-2 ${
            flowSum.closingKg === 0 
              ? 'bg-emerald-500/10 border-emerald-500/50' 
              : 'bg-primary/5 border-primary/30'
          } flex flex-col justify-between">
            <span class="text-[10px] font-bold uppercase tracking-wider ${flowSum.closingKg === 0 ? 'text-emerald-800' : 'text-primary'}">
              Available / Closing Today
            </span>
            <div class="mt-2">
              <span class="text-2xl font-black font-mono ${flowSum.closingKg === 0 ? 'text-emerald-700' : 'text-primary'}">
                ${flowSum.closingKg.toFixed(1)}
              </span>
              <span class="text-xs font-semibold ${flowSum.closingKg === 0 ? 'text-emerald-800' : 'text-primary'}">KG</span>
            </div>
            <span class="text-[10px] ${flowSum.closingKg === 0 ? 'text-emerald-700' : 'text-outline'} mt-1">
              ${flowSum.closingKg === 0 ? '✓ Day Fully Reconciled' : 'In Cold Storage'}
            </span>
          </div>
        </div>
      </div>

      <!-- Primary Seafood Operations 8-KPI Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-sm lg:gap-space-md">
        <!-- 1. Today's Collection -->
        <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm flex flex-col justify-between">
          <div class="flex items-center justify-between text-outline mb-1">
            <span class="font-label-caps uppercase tracking-wider">Today's Collection</span>
            <span class="material-symbols-outlined text-secondary text-[18px]">scale</span>
          </div>
          <div>
            <div class="font-headline-md text-headline-md text-primary font-bold tabular-nums">
              ${summary.totalPurchasedKg.toFixed(1)} <span class="text-sm font-normal text-outline">KG</span>
            </div>
            <div class="flex items-center gap-1 text-[11px] text-on-surface-variant font-medium mt-1">
              <span>${state.purchaseBills.length} Inward Lots Landed</span>
            </div>
          </div>
        </div>

        <!-- 2. Today's Procurement -->
        <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm flex flex-col justify-between">
          <div class="flex items-center justify-between text-outline mb-1">
            <span class="font-label-caps uppercase tracking-wider">Today's Procurement</span>
            <span class="material-symbols-outlined text-procure text-[18px]">receipt_long</span>
          </div>
          <div>
            <div class="font-headline-md text-headline-md text-primary font-bold tabular-nums">
              ₹${summary.todayPurchases.toLocaleString('en-IN')}
            </div>
            <div class="flex items-center gap-1 text-[11px] text-on-surface-variant font-medium mt-1">
              <span>Procurement Outlay</span>
            </div>
          </div>
        </div>

        <!-- 3. Available Seafood (Section 5 Requirement) -->
        <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm flex flex-col justify-between">
          <div class="flex items-center justify-between text-outline mb-1">
            <span class="font-label-caps uppercase tracking-wider">Available Today</span>
            <span class="material-symbols-outlined text-secondary text-[18px]">inventory_2</span>
          </div>
          <div>
            <div class="font-headline-md text-headline-md text-primary font-bold tabular-nums">
              ${flowSum.closingKg.toFixed(1)} <span class="text-sm font-normal text-outline">KG</span>
            </div>
            <div class="flex items-center gap-1 text-[11px] text-on-surface-variant font-medium mt-1">
              <span>Rcvd: ${flowSum.receivedKg.toFixed(0)} | Sold: ${flowSum.soldKg.toFixed(0)} | Waste: ${flowSum.wastageKg.toFixed(0)}</span>
            </div>
          </div>
        </div>

        <!-- 4. Wholesale Sales -->
        <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm flex flex-col justify-between">
          <div class="flex items-center justify-between text-outline mb-1">
            <span class="font-label-caps uppercase tracking-wider">Wholesale Sales</span>
            <span class="material-symbols-outlined text-secondary text-[18px]">payments</span>
          </div>
          <div>
            <div class="font-headline-md text-headline-md text-primary font-bold tabular-nums">
              ₹${summary.todaySales.toLocaleString('en-IN')}
            </div>
            <div class="flex items-center gap-1 text-[11px] text-profit font-medium mt-1">
              <span class="material-symbols-outlined text-[14px]">trending_up</span>
              <span>Wholesale & Export</span>
            </div>
          </div>
        </div>

        <!-- 5. Dispatched Quantity -->
        <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm flex flex-col justify-between">
          <div class="flex items-center justify-between text-outline mb-1">
            <span class="font-label-caps uppercase tracking-wider">Dispatched Quantity</span>
            <span class="material-symbols-outlined text-tertiary text-[18px]">local_shipping</span>
          </div>
          <div>
            <div class="font-headline-md text-headline-md text-primary font-bold tabular-nums">
              ${summary.totalExportedKg.toFixed(1)} <span class="text-sm font-normal text-outline">KG</span>
            </div>
            <div class="text-[11px] text-secondary font-medium mt-1">
              Reefer & Truck Dispatches
            </div>
          </div>
        </div>

        <!-- 6. Supplier Payable -->
        <div class="bg-surface-container-lowest p-space-md rounded-xl border border-warning/30 shadow-sm flex flex-col justify-between">
          <div class="flex items-center justify-between text-warning mb-1">
            <span class="font-label-caps uppercase tracking-wider font-bold">Supplier Payable</span>
            <span class="material-symbols-outlined text-[18px]">sailing</span>
          </div>
          <div>
            <div class="font-headline-md text-headline-md text-warning font-bold tabular-nums">
              ₹${summary.totalOutstanding.toLocaleString('en-IN')}
            </div>
            <div class="text-[11px] text-on-surface-variant mt-1">
              Fishermen Settlements Due
            </div>
          </div>
        </div>

        <!-- 7. Buyer Outstanding -->
        <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm flex flex-col justify-between">
          <div class="flex items-center justify-between text-outline mb-1">
            <span class="font-label-caps uppercase tracking-wider font-bold">Buyer Outstanding</span>
            <span class="material-symbols-outlined text-secondary text-[18px]">account_balance</span>
          </div>
          <div>
            <div class="font-headline-md text-headline-md text-primary font-bold tabular-nums">
              ₹${buyerOutstanding.toLocaleString('en-IN')}
            </div>
            <div class="text-[11px] text-on-surface-variant mt-1">
              Wholesale Receivables
            </div>
          </div>
        </div>

        <!-- 8. Operational Margin -->
        <div class="bg-surface-container-lowest p-space-md rounded-xl border border-profit/30 bg-profit-bg/20 shadow-sm flex flex-col justify-between">
          <div class="flex items-center justify-between text-profit mb-1">
            <span class="font-label-caps uppercase tracking-wider font-bold">Operational Margin</span>
            <span class="material-symbols-outlined text-[18px]">query_stats</span>
          </div>
          <div>
            <div class="font-headline-md text-headline-md text-profit font-bold tabular-nums">
              ₹${summary.netProfit.toLocaleString('en-IN')}
            </div>
            <div class="flex items-center gap-1 text-[11px] text-profit font-medium mt-1">
              <span>Realized Operating Spread</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 2-Column Split: Catch Intake Ledger (Left) vs Rates & Cold Store (Right) -->
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-space-md lg:gap-space-lg">
        
        <!-- LEFT 8 COLUMNS: Recent Inward Collections Table -->
        <div class="xl:col-span-8 flex flex-col gap-space-md">
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm overflow-hidden">
            <div class="p-space-md flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/60 bg-white">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-secondary text-[20px]">sailing</span>
                <h3 class="font-title-md text-title-md text-primary font-bold">Today's Collection Ledger</h3>
                <span class="px-2 py-0.5 rounded bg-surface-container text-xs font-mono text-outline font-semibold">Live Weighbridge</span>
              </div>
              <button 
                data-nav="purchase-bills" 
                class="text-xs text-secondary-marine font-semibold hover:underline flex items-center gap-1"
              >
                <span>View All Collection Records</span>
                <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>

            <!-- Table -->
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="bg-surface-container-low border-b border-outline-variant/60 text-outline font-label-caps uppercase tracking-wider">
                    <th class="py-2.5 px-space-md">Record No</th>
                    <th class="py-2.5 px-space-md">Fisherman / Supplier</th>
                    <th class="py-2.5 px-space-md">Seafood Species</th>
                    <th class="py-2.5 px-space-md text-right">Net KG</th>
                    <th class="py-2.5 px-space-md text-right">Total (₹)</th>
                    <th class="py-2.5 px-space-md">Status</th>
                    <th class="py-2.5 px-space-md text-center">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-outline-variant/40">
                  ${state.purchaseBills.slice(0, 5).map(b => `
                    <tr class="hover:bg-surface-container-low/40 transition-colors">
                      <td class="py-2.5 px-space-md font-mono font-semibold text-primary">${b.id}</td>
                      <td class="py-2.5 px-space-md">
                        <div class="font-semibold text-on-surface">${b.fishermanName}</div>
                        <div class="text-[11px] text-outline">${b.boatName}</div>
                      </td>
                      <td class="py-2.5 px-space-md text-on-surface-variant truncate max-w-[140px]">
                        ${b.items.map(i => i.speciesName).join(', ')}
                      </td>
                      <td class="py-2.5 px-space-md text-right font-mono font-bold text-on-surface tabular-nums">
                        ${b.totalKg.toFixed(1)} KG
                      </td>
                      <td class="py-2.5 px-space-md text-right font-mono font-bold text-primary tabular-nums">
                        ₹${b.grandTotal.toLocaleString('en-IN')}
                      </td>
                      <td class="py-2.5 px-space-md">
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-profit-bg text-profit">
                          ${b.status}
                        </span>
                      </td>
                      <td class="py-2.5 px-space-md text-center">
                        <div class="flex items-center justify-center gap-1">
                          <button 
                            class="action-view-slip p-1 text-outline hover:text-primary hover:bg-surface-container rounded transition-colors"
                            data-bill-id="${b.id}"
                            title="Print / View Thermal Slip"
                          >
                            <span class="material-symbols-outlined text-[16px]">receipt</span>
                          </button>
                          <button 
                            class="action-wa-slip p-1 text-outline hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                            data-bill-id="${b.id}"
                            title="Send WhatsApp"
                          >
                            <span class="material-symbols-outlined text-[16px]">chat</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Charts Card: Sales vs Purchase (Interactive Canvas / Clean SVG) -->
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm p-space-md flex flex-col gap-space-sm">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/60 pb-2">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-secondary text-[20px]">analytics</span>
                <h3 class="font-title-md text-title-md text-primary font-bold">Harbor Financial Volume (Last 7 Days)</h3>
              </div>
              <div class="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg text-[11px] font-medium text-outline">
                <span class="px-2 py-0.5 rounded bg-white text-primary font-bold shadow-xs">7 Days</span>
                <span class="px-2 py-0.5 hover:text-primary cursor-pointer">1 Month</span>
                <span class="px-2 py-0.5 hover:text-primary cursor-pointer">This Year</span>
              </div>
            </div>

            <!-- Clean High-Density SVG Trend Chart -->
            <div class="relative w-full h-48 flex items-end pt-6 pb-2 px-2">
              <!-- Visual Mock Bars for 7 Days -->
              <div class="w-full flex items-end justify-between gap-3 h-36">
                ${[
                  { day: '01 Sep', sales: 94000, purch: 78000 },
                  { day: '02 Sep', sales: 112000, purch: 88000 },
                  { day: '03 Sep', sales: 86000, purch: 72000 },
                  { day: '04 Sep', sales: 134000, purch: 104000 },
                  { day: '05 Sep', sales: 105000, purch: 89000 },
                  { day: '06 Sep', sales: 142000, purch: 110000 },
                  { day: 'Today', sales: 125400, purch: 98500 }
                ].map(item => `
                  <div class="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <div class="w-full flex items-end justify-center gap-1 h-28">
                      <!-- Purchase Bar -->
                      <div 
                        class="w-3 sm:w-4 rounded-t bg-procure/80 hover:bg-procure transition-all" 
                        style="height: ${(item.purch / 150000) * 100}%"
                        title="Purchase: ₹${item.purch.toLocaleString('en-IN')}"
                      ></div>
                      <!-- Sales Bar -->
                      <div 
                        class="w-3 sm:w-4 rounded-t bg-secondary-marine hover:opacity-90 transition-all" 
                        style="height: ${(item.sales / 150000) * 100}%"
                        title="Sales: ₹${item.sales.toLocaleString('en-IN')}"
                      ></div>
                    </div>
                    <span class="text-[10px] text-outline font-mono truncate">${item.day}</span>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Legend -->
            <div class="flex items-center justify-center gap-6 pt-2 border-t border-outline-variant/40 text-xs">
              <div class="flex items-center gap-1.5">
                <span class="w-3 h-3 rounded-xs bg-procure"></span>
                <span class="text-on-surface-variant font-medium">Procurement Cost</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-3 h-3 rounded-xs bg-secondary-marine"></span>
                <span class="text-on-surface-variant font-medium">Export & Wholesale Sales</span>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT 4 COLUMNS: Daily Rates & Cold Storage Gauges -->
        <div class="xl:col-span-4 flex flex-col gap-space-md">
          
          <!-- Live Seafood Rate Board -->
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm p-space-md flex flex-col gap-space-sm">
            <div class="flex items-center justify-between border-b border-outline-variant/60 pb-2">
              <div class="flex items-center gap-1.5">
                <span class="material-symbols-outlined text-secondary text-[20px]">show_chart</span>
                <h3 class="font-title-md text-title-md text-primary font-bold">Daily Seafood Rates</h3>
              </div>
              <button data-nav="daily-rates" class="text-xs text-secondary-marine font-semibold hover:underline">
                Market Rates →
              </button>
            </div>

            <div class="flex flex-col divide-y divide-outline-variant/40 text-xs">
              ${state.seafoodCatalog.slice(0, 5).map(s => `
                <div class="py-2 flex items-center justify-between">
                  <div class="flex flex-col min-w-0">
                    <span class="font-semibold text-primary truncate">${s.name}</span>
                    <span class="text-[10px] text-outline">${s.vernacular}</span>
                  </div>
                  <div class="flex items-center gap-3 text-right">
                    <div class="flex flex-col">
                      <span class="font-bold text-on-surface tabular-nums">₹${s.gradeA}</span>
                      <span class="text-[10px] text-outline">Procure / KG</span>
                    </div>
                    <div class="flex flex-col">
                      <span class="font-bold text-secondary-marine tabular-nums">₹${s.exportRate}</span>
                      <span class="text-[10px] text-outline">Wholesale / KG</span>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Cold Storage Health & Capacity -->
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm p-space-md flex flex-col gap-space-sm">
            <div class="flex items-center justify-between border-b border-outline-variant/60 pb-2">
              <div class="flex items-center gap-1.5">
                <span class="material-symbols-outlined text-tertiary text-[20px]">ac_unit</span>
                <h3 class="font-title-md text-title-md text-primary font-bold">Cold Storage Chambers</h3>
              </div>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-warning-bg text-warning">82% Load</span>
            </div>

            <!-- Freezers -->
            <div class="flex flex-col gap-2.5 pt-1 text-xs">
              <div>
                <div class="flex justify-between mb-1">
                  <span class="font-medium text-on-surface">Blast Freezer Unit #01</span>
                  <span class="font-mono text-secondary font-bold">-18.4°C</span>
                </div>
                <div class="w-full bg-surface-container-low rounded-full h-2 overflow-hidden">
                  <div class="bg-secondary-marine h-2 rounded-full" style="width: 76%"></div>
                </div>
                <div class="flex justify-between text-[10px] text-outline mt-0.5">
                  <span>9.5 MT Stored</span>
                  <span>Max 12.5 MT</span>
                </div>
              </div>

              <div>
                <div class="flex justify-between mb-1">
                  <span class="font-medium text-on-surface">Chilled Pre-cooling Bay #02</span>
                  <span class="font-mono text-warning font-bold">-2.1°C</span>
                </div>
                <div class="w-full bg-surface-container-low rounded-full h-2 overflow-hidden">
                  <div class="bg-warning h-2 rounded-full" style="width: 88%"></div>
                </div>
                <div class="flex justify-between text-[10px] text-outline mt-0.5">
                  <span>4.4 MT Stored</span>
                  <span>Approaching Limit (5.0 MT)</span>
                </div>
              </div>

              <div>
                <div class="flex justify-between mb-1">
                  <span class="font-medium text-on-surface">Crab Live Aeration Tank</span>
                  <span class="font-mono text-profit font-bold">14.0°C</span>
                </div>
                <div class="w-full bg-surface-container-low rounded-full h-2 overflow-hidden">
                  <div class="bg-profit h-2 rounded-full" style="width: 45%"></div>
                </div>
                <div class="flex justify-between text-[10px] text-outline mt-0.5">
                  <span>85 KG Active</span>
                  <span>Optimal Aeration</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `;
}

export function bindDashboardEvents() {
  const container = document.getElementById('app');
  if (!container) return;

  // Add Fisherman trigger
  const addFishBtn = container.querySelector('#dash-add-fisherman-btn');
  if (addFishBtn) {
    addFishBtn.addEventListener('click', () => openAddFishermanModal());
  }

  // Close Day trigger
  const closeDayBtn = container.querySelector('#dash-close-day-btn');
  if (closeDayBtn) {
    closeDayBtn.addEventListener('click', () => openDayEndCloseModal());
  }

  // Thermal Slip and WhatsApp triggers on rows
  container.querySelectorAll('.action-view-slip').forEach(btn => {
    btn.addEventListener('click', () => {
      const billId = btn.dataset.billId;
      const bill = store.getState().purchaseBills.find(b => b.id === billId);
      if (bill) openThermalReceiptModal(bill);
    });
  });

  container.querySelectorAll('.action-wa-slip').forEach(btn => {
    btn.addEventListener('click', () => {
      const billId = btn.dataset.billId;
      const bill = store.getState().purchaseBills.find(b => b.id === billId);
      if (bill) {
        openWhatsAppModal({
          name: bill.fishermanName,
          phone: bill.mobile,
          billId: bill.id,
          date: bill.date,
          items: bill.items,
          totalKg: bill.totalKg,
          grandTotal: bill.grandTotal,
          type: 'Purchase'
        });
      }
    });
  });
}
