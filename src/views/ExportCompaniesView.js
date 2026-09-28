// ExportCompaniesView Component - Corporate Seafood Exporter Accounts
import { store } from '../state/store.js';
import { openWhatsAppModal } from '../components/WhatsAppPreviewModal.js';
import { showToast } from '../components/Toast.js';

export function renderExportCompaniesView() {
  const state = store.getState();

  return `
    <div class="flex flex-col gap-space-md w-full max-w-[1720px] mx-auto pb-24 animate-fade-in select-none">
      
      <!-- Top Action Strip -->
      <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="font-headline-md text-headline-md text-primary font-bold tracking-tight">Export Companies & Processors</h1>
            <span class="px-2 py-0.5 rounded-full bg-surface-container text-xs font-mono font-bold text-primary">
              ${state.exportCompanies.length} Corporate Clients
            </span>
          </div>
          <p class="text-xs text-on-surface-variant">
            International reefer container shipments, blast freezer processors, and factoring accounts.
          </p>
        </div>

        <button id="add-exporter-btn" class="px-4 py-2 rounded-lg bg-primary text-white font-semibold text-xs shadow-sm hover:bg-primary-container active:scale-95 transition-all flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[18px] text-secondary-fixed">add_business</span>
          <span>+ Add Exporter</span>
        </button>
      </div>

      <!-- Exporter Accounts Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-space-md">
        ${state.exportCompanies.map(e => `
          <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm flex flex-col justify-between hover:border-secondary-marine/50 transition-all">
            <div>
              <div class="flex items-start justify-between">
                <div>
                  <h3 class="font-title-lg text-title-lg text-primary font-bold leading-tight">${e.name}</h3>
                  <span class="text-xs text-outline font-medium block mt-0.5">${e.contact} &bull; ${e.phone}</span>
                </div>
                <div class="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold text-xs shrink-0">
                  <span class="material-symbols-outlined text-[18px]">apartment</span>
                </div>
              </div>

              <div class="text-[11px] text-outline font-mono mt-1">
                GSTIN: ${e.gstin}
              </div>

              <!-- Stats Matrix -->
              <div class="grid grid-cols-2 gap-2 p-2 bg-surface-container-low rounded-lg text-xs mt-3">
                <div>
                  <span class="text-[10px] text-outline uppercase font-semibold block">Outstanding Due</span>
                  <span class="font-mono font-bold tabular-nums text-sm ${e.outstanding > 0 ? 'text-warning' : 'text-profit'}">
                    ₹${e.outstanding.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span class="text-[10px] text-outline uppercase font-semibold block">Lifetime Volume</span>
                  <span class="font-mono font-bold text-primary text-sm tabular-nums">${e.totalExportKg} KG</span>
                </div>
              </div>
            </div>

            <!-- Card Actions -->
            <div class="mt-4 pt-3 border-t border-outline-variant/60 flex items-center justify-between">
              <span class="text-[10px] text-outline font-mono">Last: ${e.lastInvoice}</span>
              <div class="flex items-center gap-1.5">
                <a href="tel:${e.phone}" class="p-1.5 rounded bg-surface-container-low hover:bg-surface-container text-primary transition-colors" title="Call">
                  <span class="material-symbols-outlined text-[16px]">call</span>
                </a>
                <button class="exporter-wa-btn p-1.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors" data-id="${e.id}" title="Send WhatsApp">
                  <span class="material-symbols-outlined text-[16px]">chat</span>
                </button>
                <button data-nav="export-bills" class="px-2.5 py-1 rounded bg-secondary-marine text-white font-semibold text-xs hover:opacity-90 active:scale-95 transition-all shadow-xs">
                  + Invoice
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

export function bindExportCompaniesEvents() {
  const container = document.getElementById('app');
  if (!container) return;

  const state = store.getState();

  const addBtn = container.querySelector('#add-exporter-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const name = prompt("Enter Exporter Company Name:");
      if (!name) return;
      const contact = prompt("Contact Person:");
      if (!contact) return;
      const phone = prompt("Mobile / Phone:");
      if (!phone) return;

      state.exportCompanies.unshift({
        id: `e-${state.exportCompanies.length + 1}`,
        name,
        contact,
        phone,
        gstin: '33AABCM9999F1Z9',
        outstanding: 0,
        totalExportKg: 0,
        totalExportAmount: 0,
        lastInvoice: 'New Account'
      });
      showToast(`Exporter "${name}" registered.`, 'success');
      store.notify();
    });
  }

  container.querySelectorAll('.exporter-wa-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const e = state.exportCompanies.find(item => item.id === btn.dataset.id);
      if (e) {
        openWhatsAppModal({
          name: e.name,
          phone: e.phone,
          billId: `STMT-${e.id}`,
          date: state.date,
          items: [],
          totalKg: e.totalExportKg,
          grandTotal: e.outstanding,
          type: 'Statement'
        });
      }
    });
  });
}
