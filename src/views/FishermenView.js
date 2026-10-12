// FishermenView Component - Fast Data Entry & Registry
import { store } from '../state/store.js';
import { openAddFishermanModal } from '../components/AddFishermanModal.js';
import { openImportExcelModal } from '../components/ImportExcelModal.js';
import { openWhatsAppModal } from '../components/WhatsAppPreviewModal.js';

export function renderFishermenView() {
  const state = store.getState();
  const selectedId = state.selectedFishermanId;
  const selectedFisherman = selectedId ? state.fishermen.find(f => f.id === selectedId) : null;

  // If a fisherman profile is selected, render the profile view
  if (selectedFisherman) {
    return renderFishermanProfile(selectedFisherman);
  }

  return `
    <div class="flex flex-col gap-space-md w-full max-w-[1720px] mx-auto pb-24 animate-fade-in select-none">
      
      <!-- Top Action Bar -->
      <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="font-headline-md text-headline-md text-primary font-bold tracking-tight">Fishermen Registry</h1>
            <span class="px-2 py-0.5 rounded-full bg-surface-container text-xs font-mono font-bold text-primary">
              ${state.fishermen.length} Registered Boats
            </span>
          </div>
          <p class="text-xs text-on-surface-variant">
            Fleet boat owners, daily advance ledgers, and catch landing history.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button 
            id="open-disburse-advance-btn"
            class="px-3.5 py-2 rounded-lg bg-warning hover:bg-amber-600 text-white font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
          >
            <span class="material-symbols-outlined text-[18px]">payments</span>
            <span>+ Issue Advance</span>
          </button>

          <button 
            id="open-import-excel-btn"
            class="px-3.5 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-semibold text-xs border border-outline-variant flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <span class="material-symbols-outlined text-[18px] text-secondary">upload_file</span>
            <span>Import Excel</span>
          </button>

          <button 
            id="open-add-fisherman-btn"
            class="px-4 py-2 rounded-lg bg-primary text-white font-semibold text-xs shadow-sm hover:bg-primary-container active:scale-95 transition-all flex items-center gap-1.5"
          >
            <span class="material-symbols-outlined text-[18px] text-secondary-fixed">person_add</span>
            <span>+ Add Fisherman</span>
          </button>
        </div>
      </div>

      <!-- Search & Filter Controls -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div class="relative flex-1 max-w-md">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
          <input 
            type="text" 
            id="fishermen-search"
            placeholder="Search by name, boat reg no, or mobile (e.g. Murugan, 98401...)" 
            class="w-full h-10 pl-9 pr-3 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-primary placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-secondary-marine"
          />
        </div>

        <div class="flex items-center gap-1 text-xs">
          <span class="text-outline text-xs mr-1">Filter:</span>
          <button class="fish-filter-tab px-3 py-1.5 rounded-lg bg-primary text-white font-semibold text-xs" data-filter="all">All Boats</button>
          <button class="fish-filter-tab px-3 py-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface border border-outline-variant text-xs" data-filter="due">With Advance Due</button>
          <button class="fish-filter-tab px-3 py-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface border border-outline-variant text-xs" data-filter="settled">Settled</button>
        </div>
      </div>

      <!-- Fishermen High-Density Table & Dossier Cards -->
      <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse" id="fishermen-table">
            <thead>
              <tr class="bg-surface-container-low border-b border-outline-variant/60 text-outline font-label-caps uppercase tracking-wider">
                <th class="py-3 px-4">Fisherman & Boat</th>
                <th class="py-3 px-3">Contact</th>
                <th class="py-3 px-3 text-right">Outstanding Advance</th>
                <th class="py-3 px-3 text-center">Total Bills</th>
                <th class="py-3 px-3 text-right">Total Purchased</th>
                <th class="py-3 px-3">Last Landing</th>
                <th class="py-3 px-4 text-center">Quick Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant/40" id="fishermen-table-body">
              ${state.fishermen.map(f => `
                <tr class="fish-row hover:bg-surface-container-low/30 transition-colors" data-id="${f.id}" data-name="${f.name.toLowerCase()}" data-boat="${f.boatName.toLowerCase()}" data-mobile="${f.mobile}" data-due="${f.outstanding}">
                  <!-- Name & Boat -->
                  <td class="py-3 px-4">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0 border border-primary/20">
                        ${f.name.charAt(0)}
                      </div>
                      <div class="flex flex-col min-w-0">
                        <button class="view-profile-link font-bold text-primary text-sm hover:underline text-left truncate" data-id="${f.id}">
                          ${f.name}
                        </button>
                        <span class="text-[11px] text-outline font-mono truncate">${f.boatName}</span>
                      </div>
                    </div>
                  </td>

                  <!-- Mobile -->
                  <td class="py-3 px-3 font-mono text-on-surface">
                    ${f.countryCode} ${f.mobile}
                  </td>

                  <!-- Outstanding Advance -->
                  <td class="py-3 px-3 text-right font-mono font-bold tabular-nums ${f.outstanding > 0 ? 'text-warning' : 'text-profit'}">
                    ₹${f.outstanding.toLocaleString('en-IN')}
                  </td>

                  <!-- Total Bills -->
                  <td class="py-3 px-3 text-center font-mono font-semibold text-primary tabular-nums">
                    ${f.totalBills}
                  </td>

                  <!-- Total Purchased -->
                  <td class="py-3 px-3 text-right font-mono tabular-nums text-on-surface">
                    <span class="font-bold">${f.totalPurchaseKg} KG</span>
                    <span class="text-[10px] text-outline block">₹${(f.totalPurchaseAmount / 1000).toFixed(0)}k Value</span>
                  </td>

                  <!-- Last Landing -->
                  <td class="py-3 px-3 text-outline text-[11px]">
                    ${f.lastPurchase}
                  </td>

                  <!-- Quick Actions -->
                  <td class="py-3 px-4 text-center">
                    <div class="flex items-center justify-center gap-1.5">
                      <a href="tel:${f.countryCode}${f.mobile}" class="p-1.5 rounded bg-surface-container-low hover:bg-surface-container text-primary transition-colors" title="Call Fisherman">
                        <span class="material-symbols-outlined text-[16px]">call</span>
                      </a>
                      <button class="fish-wa-btn p-1.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors" data-id="${f.id}" title="Send WhatsApp">
                        <span class="material-symbols-outlined text-[16px]">chat</span>
                      </button>
                      <button class="fish-bill-btn px-2.5 py-1 rounded bg-secondary-marine text-white font-semibold text-xs hover:opacity-90 active:scale-95 transition-all shadow-xs" data-id="${f.id}" title="Create Purchase Bill">
                        + Bill
                      </button>
                    </div>
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

// Sub-component: Fisherman Profile Dossier View
function renderFishermanProfile(fisherman) {
  const state = store.getState();
  const bills = state.purchaseBills.filter(b => b.fishermanId === fisherman.id);

  return `
    <div class="flex flex-col gap-space-md w-full max-w-[1720px] mx-auto pb-24 animate-fade-in select-none">
      <!-- Back Button & Profile Header -->
      <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div class="flex items-center gap-3">
          <button id="back-to-registry-btn" class="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary transition-colors">
            <span class="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-secondary-fixed text-xl font-bold">
              ${fisherman.name.charAt(0)}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h1 class="font-headline-md text-headline-md text-primary font-bold">${fisherman.name}</h1>
                <span class="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container text-[11px] font-bold">RELIABILITY: ${fisherman.reliability}%</span>
              </div>
              <p class="text-xs text-outline font-mono mt-0.5">${fisherman.boatName} • ${fisherman.countryCode} ${fisherman.mobile}</p>
            </div>
          </div>
        </div>

        <!-- Quick Dossier Triggers -->
        <div class="flex items-center gap-2">
          <button id="profile-advance-btn" data-id="${fisherman.id}" class="px-3.5 py-2 rounded-lg bg-warning hover:bg-amber-600 text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[16px]">payments</span>
            <span>+ Issue Advance</span>
          </button>
          <a href="tel:${fisherman.countryCode}${fisherman.mobile}" class="px-3 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary text-xs font-semibold border border-outline-variant flex items-center gap-1.5 transition-colors">
            <span class="material-symbols-outlined text-[16px]">call</span>
            <span>Call</span>
          </a>
          <button id="profile-wa-btn" class="px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-300 flex items-center gap-1.5 transition-colors">
            <span class="material-symbols-outlined text-[16px]">chat</span>
            <span>WhatsApp</span>
          </button>
          <button id="profile-new-bill-btn" class="px-4 py-2 rounded-lg bg-secondary-marine text-white font-semibold text-xs shadow-sm hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[16px]">add</span>
            <span>Record Catch Bill</span>
          </button>
        </div>
      </div>

      <!-- Financial Snapshot Bento -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm">
          <span class="text-xs font-semibold text-outline uppercase tracking-wider block mb-1">Active Advance Balance</span>
          <span class="font-headline-md text-headline-md text-warning font-bold tabular-nums">₹${fisherman.outstanding.toLocaleString('en-IN')}</span>
          <span class="text-[11px] text-outline block mt-1">Adjusted against daily catch bills</span>
        </div>

        <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm">
          <span class="text-xs font-semibold text-outline uppercase tracking-wider block mb-1">Total Catch Procured</span>
          <span class="font-headline-md text-headline-md text-primary font-bold tabular-nums">₹${fisherman.totalPurchaseAmount.toLocaleString('en-IN')}</span>
          <span class="text-[11px] text-profit font-medium block mt-1">${fisherman.totalBills} Verified Landings</span>
        </div>

        <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm">
          <span class="text-xs font-semibold text-outline uppercase tracking-wider block mb-1">Total Landed Weight</span>
          <span class="font-headline-md text-headline-md text-primary font-bold tabular-nums">${fisherman.totalPurchaseKg} KG</span>
          <span class="text-[11px] text-outline block mt-1">${fisherman.boatName}</span>
        </div>

        <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm">
          <span class="text-xs font-semibold text-outline uppercase tracking-wider block mb-1">Last Transaction</span>
          <span class="font-title-lg text-title-lg text-primary font-bold block">${fisherman.lastPurchase}</span>
          <span class="text-[11px] text-secondary font-medium block mt-1">Weigh Station #3</span>
        </div>
      </div>

      <!-- Unified Financial & Catch Ledger Table -->
      <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm overflow-hidden">
        <div class="p-space-md border-b border-outline-variant/60 bg-white flex items-center justify-between">
          <div>
            <h3 class="font-title-md text-title-md text-primary font-bold">Fisherman Financial & Catch Ledger</h3>
            <p class="text-[11px] text-outline">Traceable record of Collections, Advances Given, Advance Adjustments, and Net Cash Payouts.</p>
          </div>
          <span class="text-xs text-outline font-mono">${store.getFishermanLedger(fisherman.id).length} Ledger Transactions</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-surface-container-low border-b border-outline-variant/60 text-outline font-label-caps uppercase tracking-wider">
                <th class="py-2.5 px-4">Transaction Ref</th>
                <th class="py-2.5 px-3">Date & Time</th>
                <th class="py-2.5 px-3">Type</th>
                <th class="py-2.5 px-4">Transaction Details</th>
                <th class="py-2.5 px-4 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant/40">
              ${store.getFishermanLedger(fisherman.id).map(l => `
                <tr class="hover:bg-surface-container-low/30 transition-colors">
                  <td class="py-2.5 px-4 font-mono font-bold text-primary">${l.id}</td>
                  <td class="py-2.5 px-3 text-outline font-mono">${l.date}</td>
                  <td class="py-2.5 px-3">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                      l.type === 'Advance Given' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                      l.type === 'Catch Collection' ? 'bg-procure-bg text-procure' :
                      l.type === 'Advance Adjustment' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                      'bg-emerald-100 text-emerald-900'
                    }">
                      ${l.type}
                    </span>
                  </td>
                  <td class="py-2.5 px-4 text-on-surface">${l.notes}</td>
                  <td class="py-2.5 px-4 text-right font-mono font-bold tabular-nums ${
                    l.isCredit ? 'text-profit' : 'text-primary'
                  }">
                    ${l.isCredit ? '+' : '-'}₹${l.amount.toLocaleString('en-IN')}
                  </td>
                </tr>
              `).join('')}
              ${store.getFishermanLedger(fisherman.id).length === 0 ? `
                <tr><td colspan="5" class="p-6 text-center text-outline">No ledger transactions recorded for this fisherman yet.</td></tr>
              ` : ''}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

export function bindFishermenEvents() {
  const container = document.getElementById('app');
  if (!container) return;

  const state = store.getState();

  // Add Fisherman
  const addBtn = container.querySelector('#open-add-fisherman-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => openAddFishermanModal(() => store.notify()));
  }

  // Disburse Advance Modal
  const disburseBtn = container.querySelector('#open-disburse-advance-btn');
  if (disburseBtn) {
    disburseBtn.addEventListener('click', () => openDisburseAdvanceModal());
  }

  const profileAdvanceBtn = container.querySelector('#profile-advance-btn');
  if (profileAdvanceBtn) {
    profileAdvanceBtn.addEventListener('click', () => {
      openDisburseAdvanceModal(profileAdvanceBtn.dataset.id);
    });
  }

  // Import Excel
  const importBtn = container.querySelector('#open-import-excel-btn');
  if (importBtn) {
    importBtn.addEventListener('click', () => openImportExcelModal(() => store.notify()));
  }

  // Filter tabs
  container.querySelectorAll('.fish-filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.fish-filter-tab').forEach(t => {
        t.className = 'fish-filter-tab px-3 py-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface border border-outline-variant text-xs';
      });
      tab.className = 'fish-filter-tab px-3 py-1.5 rounded-lg bg-primary text-white font-semibold text-xs';

      const filter = tab.dataset.filter;
      container.querySelectorAll('.fish-row').forEach(row => {
        const due = parseFloat(row.dataset.due) || 0;
        if (filter === 'all') row.style.display = '';
        else if (filter === 'due') row.style.display = due > 0 ? '' : 'none';
        else if (filter === 'settled') row.style.display = due === 0 ? '' : 'none';
      });
    });
  });

  // Search input
  const searchInput = container.querySelector('#fishermen-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      container.querySelectorAll('.fish-row').forEach(row => {
        const match = row.dataset.name.includes(q) || row.dataset.boat.includes(q) || row.dataset.mobile.includes(q);
        row.style.display = match ? '' : 'none';
      });
    });
  }

  // View Profile Link
  container.querySelectorAll('.view-profile-link').forEach(btn => {
    btn.addEventListener('click', () => {
      store.state.selectedFishermanId = btn.dataset.id;
      store.notify();
    });
  });

  // Back to registry from profile
  const backBtn = container.querySelector('#back-to-registry-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      store.state.selectedFishermanId = null;
      store.notify();
    });
  }

  // Create Bill for this fisherman
  container.querySelectorAll('.fish-bill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      store.navigate('purchase-bills');
    });
  });

  const profileBillBtn = container.querySelector('#profile-new-bill-btn');
  if (profileBillBtn) {
    profileBillBtn.addEventListener('click', () => {
      store.state.selectedFishermanId = null;
      store.navigate('purchase-bills');
    });
  }

  // WhatsApp statements
  container.querySelectorAll('.fish-wa-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const f = state.fishermen.find(item => item.id === btn.dataset.id);
      if (f) {
        openWhatsAppModal({
          name: f.name,
          phone: f.mobile,
          billId: `STMT-${f.id}`,
          date: state.date,
          items: [],
          totalKg: f.totalPurchaseKg,
          grandTotal: f.outstanding,
          type: 'Statement'
        });
      }
    });
  });
}

export function openDisburseAdvanceModal(presetFishermanId = null) {
  const state = store.getState();
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  const initialFisherman = presetFishermanId 
    ? state.fishermen.find(f => f.id === presetFishermanId) || state.fishermen[0]
    : state.fishermen[0];

  const modalHtml = `
    <div id="advance-modal-overlay" class="fixed inset-0 z-50 bg-primary/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in select-none">
      <div class="bg-surface-container-lowest w-full max-w-md rounded-2xl border border-outline-variant/60 shadow-2xl p-6 flex flex-col gap-4">
        
        <div class="flex items-center justify-between pb-3 border-b border-outline-variant/60">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-warning text-[24px]">payments</span>
            <h3 class="font-title-lg text-primary font-bold">Issue Fisherman Advance</h3>
          </div>
          <button id="close-advance-modal-btn" class="p-1 text-outline hover:text-primary">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form id="advance-form" class="flex flex-col gap-3.5 text-xs">
          <div>
            <label class="block font-semibold text-primary mb-1">Select Fisherman / Fleet Owner</label>
            <select id="adv-fisherman-select" required class="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg text-primary font-medium focus:ring-2 focus:ring-secondary-marine">
              ${state.fishermen.map(f => `
                <option value="${f.id}" ${f.id === initialFisherman.id ? 'selected' : ''}>
                  ${f.name} — ${f.boatName} (Current Adv: ₹${f.outstanding.toLocaleString('en-IN')})
                </option>
              `).join('')}
            </select>
          </div>

          <div class="grid grid-cols-2 gap-2 p-3 rounded-lg bg-surface-container-low border border-outline-variant/50">
            <div>
              <span class="text-[10px] text-outline uppercase tracking-wider block font-bold">Current Advance</span>
              <span id="adv-current-display" class="font-mono text-sm font-bold text-warning tabular-nums">₹${initialFisherman.outstanding.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span class="text-[10px] text-outline uppercase tracking-wider block font-bold">Projected Total</span>
              <span id="adv-projected-display" class="font-mono text-sm font-bold text-primary tabular-nums">₹${initialFisherman.outstanding.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div>
            <label class="block font-semibold text-primary mb-1">New Advance Amount (₹)</label>
            <input type="number" id="adv-amount" min="100" step="100" required placeholder="e.g. 10000" class="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg font-mono font-bold text-base text-primary focus:ring-2 focus:ring-secondary-marine" />
          </div>

          <div>
            <label class="block font-semibold text-primary mb-1">Disbursement Method</label>
            <select id="adv-method" class="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg text-primary font-medium">
              <option value="Cash">Cash (Immediate Dock Cashier)</option>
              <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
              <option value="UPI">UPI / Digital Transfer</option>
            </select>
          </div>

          <div>
            <label class="block font-semibold text-primary mb-1">Purpose / Notes</label>
            <input type="text" id="adv-notes" placeholder="e.g. Diesel fuel bunkering, provisioning & net maintenance" class="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg text-primary focus:ring-2 focus:ring-secondary-marine" />
          </div>

          <div class="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-amber-900 flex items-start gap-2">
            <span class="material-symbols-outlined text-[18px] text-warning shrink-0">info</span>
            <span class="text-[11px]">
              This creates an audited financial disbursement ledger entry and adds to the boat's active advance balance. It is recovered during catch settlements.
            </span>
          </div>

          <div class="flex items-center gap-2 pt-2">
            <button type="button" id="cancel-adv-modal-btn" class="flex-1 py-2.5 rounded-lg border border-outline-variant bg-surface hover:bg-surface-container font-semibold text-outline text-xs">
              Cancel
            </button>
            <button type="submit" id="save-adv-btn" class="flex-1 py-2.5 rounded-lg bg-warning hover:bg-amber-600 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5">
              <span class="material-symbols-outlined text-[16px]">save</span>
              <span id="save-adv-text">Confirm Advance</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  `;

  modalRoot.innerHTML = modalHtml;

  const closeBtn = document.getElementById('close-advance-modal-btn');
  const cancelBtn = document.getElementById('cancel-adv-modal-btn');
  const form = document.getElementById('advance-form');
  const submitBtn = document.getElementById('save-adv-btn');
  const submitText = document.getElementById('save-adv-text');
  const selectElem = document.getElementById('adv-fisherman-select');
  const amountInput = document.getElementById('adv-amount');
  const currentDisplay = document.getElementById('adv-current-display');
  const projectedDisplay = document.getElementById('adv-projected-display');

  const updateProjected = () => {
    const fId = selectElem.value;
    const f = state.fishermen.find(item => item.id === fId);
    const curr = f ? f.outstanding : 0;
    const added = parseFloat(amountInput.value) || 0;
    currentDisplay.textContent = `₹${curr.toLocaleString('en-IN')}`;
    projectedDisplay.textContent = `₹${(curr + added).toLocaleString('en-IN')}`;
  };

  selectElem.addEventListener('change', updateProjected);
  amountInput.addEventListener('input', updateProjected);

  const close = () => { if (modalRoot) modalRoot.innerHTML = ''; };
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (cancelBtn) cancelBtn.addEventListener('click', close);

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fishermanId = selectElem.value;
      const amount = parseFloat(amountInput.value);
      const paymentMethod = document.getElementById('adv-method').value;
      const notes = document.getElementById('adv-notes').value.trim();

      if (!amount || amount <= 0) {
        alert("Please enter a valid advance amount.");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.classList.add('opacity-75', 'cursor-not-allowed');
      submitText.textContent = 'Recording Advance...';

      const entry = store.recordFishermanAdvance({ fishermanId, amount, paymentMethod, notes });
      if (entry) {
        showToast(`Advance of ₹${amount.toLocaleString('en-IN')} disbursed. Ref: ${entry.id}`, 'success');
      }
      close();
    });
  }
}

