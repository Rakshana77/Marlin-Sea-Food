// CustomersView Component - Wholesale Buyers Directory
import { store } from '../state/store.js';
import { openWhatsAppModal } from '../components/WhatsAppPreviewModal.js';
import { showToast } from '../components/Toast.js';

export function renderCustomersView() {
  const state = store.getState();

  return `
    <div class="flex flex-col gap-space-md w-full max-w-[1720px] mx-auto pb-24 animate-fade-in select-none">
      
      <!-- Top Action Strip -->
      <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="font-headline-md text-headline-md text-primary font-bold tracking-tight">Wholesale Buyers & Customers</h1>
            <span class="px-2 py-0.5 rounded-full bg-surface-container text-xs font-mono font-bold text-primary">
              ${state.customers.length} Accounts
            </span>
          </div>
          <p class="text-xs text-on-surface-variant">
            Hotels, commercial fishmongers, and local seafood distribution clients.
          </p>
        </div>

        <button id="add-customer-btn" class="px-4 py-2 rounded-lg bg-primary text-white font-semibold text-xs shadow-sm hover:bg-primary-container active:scale-95 transition-all flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[18px] text-secondary-fixed">person_add</span>
          <span>+ Add Customer</span>
        </button>
      </div>

      <!-- Customers Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-space-md">
        ${state.customers.map(c => `
          <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm flex flex-col justify-between">
            <div>
              <div class="flex items-start justify-between">
                <div>
                  <h3 class="font-title-lg text-title-lg text-primary font-bold leading-tight">${c.name}</h3>
                  <span class="text-xs text-outline font-medium block mt-0.5">${c.contact} &bull; ${c.phone}</span>
                </div>
                <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                  ${c.name.charAt(0)}
                </div>
              </div>

              <!-- Stats -->
              <div class="grid grid-cols-2 gap-2 p-2 bg-surface-container-low rounded-lg text-xs mt-3">
                <div>
                  <span class="text-[10px] text-outline uppercase font-semibold block">Outstanding Due</span>
                  <span class="font-mono font-bold tabular-nums text-sm ${c.outstanding > 0 ? 'text-warning' : 'text-profit'}">
                    ₹${c.outstanding.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span class="text-[10px] text-outline uppercase font-semibold block">Total Orders</span>
                  <span class="font-mono font-bold text-primary text-sm tabular-nums">${c.totalOrders} Orders</span>
                </div>
              </div>
            </div>

            <!-- Card Actions -->
            <div class="mt-4 pt-3 border-t border-outline-variant/60 flex items-center justify-between">
              <span class="text-[10px] text-outline font-mono">Last: ${c.lastOrder}</span>
              <div class="flex items-center gap-1.5">
                <a href="tel:${c.phone}" class="p-1.5 rounded bg-surface-container-low hover:bg-surface-container text-primary transition-colors" title="Call">
                  <span class="material-symbols-outlined text-[16px]">call</span>
                </a>
                <button class="customer-wa-btn p-1.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors" data-id="${c.id}" title="Send WhatsApp">
                  <span class="material-symbols-outlined text-[16px]">chat</span>
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

export function bindCustomersEvents() {
  const container = document.getElementById('app');
  if (!container) return;

  const state = store.getState();

  const addBtn = container.querySelector('#add-customer-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const name = prompt("Enter Customer / Hotel Name:");
      if (!name) return;
      const phone = prompt("Enter Mobile / Phone:");
      if (!phone) return;
      state.customers.unshift({
        id: `c-${state.customers.length + 1}`,
        name,
        contact: 'Manager',
        phone,
        outstanding: 0,
        totalOrders: 0,
        lastOrder: 'Just Added'
      });
      showToast(`Customer "${name}" created.`, 'success');
      store.notify();
    });
  }

  container.querySelectorAll('.customer-wa-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const c = state.customers.find(item => item.id === btn.dataset.id);
      if (c) {
        openWhatsAppModal({
          name: c.name,
          phone: c.phone,
          billId: `CUST-${c.id}`,
          date: state.date,
          items: [],
          totalKg: 0,
          grandTotal: c.outstanding,
          type: 'Statement'
        });
      }
    });
  });
}
