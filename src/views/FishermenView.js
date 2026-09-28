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
            <span>Create Purchase Bill</span>
          </button>
        </div>
      </div>

      <!-- Financial Snapshot Bento -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm">
          <span class="text-xs font-semibold text-outline uppercase tracking-wider block mb-1">Outstanding Advance</span>
          <span class="font-headline-md text-headline-md text-warning font-bold tabular-nums">₹${fisherman.outstanding.toLocaleString('en-IN')}</span>
          <span class="text-[11px] text-outline block mt-1">Deducted per boat catch</span>
        </div>

        <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm">
          <span class="text-xs font-semibold text-outline uppercase tracking-wider block mb-1">Total Purchases Value</span>
          <span class="font-headline-md text-headline-md text-primary font-bold tabular-nums">₹${fisherman.totalPurchaseAmount.toLocaleString('en-IN')}</span>
          <span class="text-[11px] text-profit font-medium block mt-1">${fisherman.totalBills} Verified Bills</span>
        </div>

        <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm">
          <span class="text-xs font-semibold text-outline uppercase tracking-wider block mb-1">Total Catch Landed</span>
          <span class="font-headline-md text-headline-md text-primary font-bold tabular-nums">${fisherman.totalPurchaseKg} KG</span>
          <span class="text-[11px] text-outline block mt-1">Fiber Vallam Fleet</span>
        </div>

        <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm">
          <span class="text-xs font-semibold text-outline uppercase tracking-wider block mb-1">Last Transaction</span>
          <span class="font-title-lg text-title-lg text-primary font-bold block">${fisherman.lastPurchase}</span>
          <span class="text-[11px] text-secondary font-medium block mt-1">Weigh Station #3</span>
        </div>
      </div>

      <!-- Catch History Ledger Table -->
      <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm overflow-hidden">
        <div class="p-space-md border-b border-outline-variant/60 bg-white flex items-center justify-between">
          <h3 class="font-title-md text-title-md text-primary font-bold">Landing History & Advance Adjustments</h3>
          <span class="text-xs text-outline font-mono">${bills.length} Records</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-surface-container-low border-b border-outline-variant/60 text-outline font-label-caps uppercase tracking-wider">
                <th class="py-2.5 px-4">Bill ID</th>
                <th class="py-2.5 px-3">Date & Time</th>
                <th class="py-2.5 px-3">Catch Breakdown</th>
                <th class="py-2.5 px-3 text-right">Net Weight</th>
                <th class="py-2.5 px-3 text-right">Gross Amount</th>
                <th class="py-2.5 px-3 text-right">Advance Deducted</th>
                <th class="py-2.5 px-4 text-right">Net Cash Paid</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant/40">
              ${bills.map(b => `
                <tr class="hover:bg-surface-container-low/30 transition-colors">
                  <td class="py-2.5 px-4 font-mono font-bold text-primary">${b.id}</td>
                  <td class="py-2.5 px-3 text-outline">${b.date}, ${b.time}</td>
                  <td class="py-2.5 px-3 text-on-surface">${b.items.map(i => `${i.speciesName} (${i.netKg} KG)`).join(', ')}</td>
                  <td class="py-2.5 px-3 text-right font-mono font-bold">${b.totalKg.toFixed(1)} KG</td>
                  <td class="py-2.5 px-3 text-right font-mono">₹${b.subtotal.toLocaleString('en-IN')}</td>
                  <td class="py-2.5 px-3 text-right font-mono text-warning">-₹${b.advanceDeduction.toLocaleString('en-IN')}</td>
                  <td class="py-2.5 px-4 text-right font-mono font-bold text-profit">₹${b.grandTotal.toLocaleString('en-IN')}</td>
                </tr>
              `).join('')}
              ${bills.length === 0 ? `
                <tr><td colspan="7" class="p-6 text-center text-outline">No transactions recorded for this fisherman yet.</td></tr>
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
