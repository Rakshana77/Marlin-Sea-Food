// OmniSearchModal Component - Keyboard-First Search [⌘K]
import { store } from '../state/store.js';

export function openOmniSearchModal() {
  const container = document.getElementById('modal-root');
  if (!container) return;

  const existing = document.getElementById('omni-search-modal');
  if (existing) existing.remove();

  const state = store.getState();

  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'omni-search-modal';
  modalOverlay.className = 'fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-primary-container/70 backdrop-blur-sm animate-fade-in';

  modalOverlay.innerHTML = `
    <div class="bg-surface-container-lowest w-full max-w-xl rounded-xl border border-outline-variant shadow-2xl overflow-hidden animate-slide-up flex flex-col">
      <!-- Search Input Bar -->
      <div class="h-14 px-4 flex items-center gap-3 border-b border-outline-variant/60 bg-white">
        <span class="material-symbols-outlined text-secondary text-[22px]">search</span>
        <input 
          id="omni-search-input"
          type="text" 
          placeholder="Search fishermen, boats, bills, rates, seafood, exporters..." 
          class="w-full bg-transparent text-sm text-primary placeholder:text-outline focus:outline-none"
          autofocus
        />
        <kbd class="px-2 py-0.5 rounded bg-surface-container text-outline text-[11px] font-mono">ESC</kbd>
      </div>

      <!-- Results List Container -->
      <div id="omni-results" class="max-h-96 overflow-y-auto p-2 flex flex-col gap-1">
        <!-- Initial Quick Links -->
        <div class="px-3 py-1.5 text-[11px] font-semibold text-outline uppercase tracking-wider">Quick Commands</div>
        <button data-goto="purchase-bills" class="omni-item flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-container text-left text-sm text-primary transition-colors">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-secondary text-[18px]">add_shopping_cart</span>
            <span>+ Create New Purchase Bill</span>
          </div>
          <span class="text-xs text-outline font-mono">[F4]</span>
        </button>
        <button data-goto="export-bills" class="omni-item flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-container text-left text-sm text-primary transition-colors">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-secondary text-[18px]">local_shipping</span>
            <span>+ Create New Export Invoice</span>
          </div>
        </button>
        <button data-goto="daily-rates" class="omni-item flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-container text-left text-sm text-primary transition-colors">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-secondary text-[18px]">trending_up</span>
            <span>Update Daily Seafood Rates</span>
          </div>
        </button>
        <button data-goto="day-end" class="omni-item flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-container text-left text-sm text-primary transition-colors">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-secondary text-[18px]">lock_clock</span>
            <span>Day End Financial Closing</span>
          </div>
        </button>
      </div>

      <!-- Footer Help -->
      <div class="px-4 py-2 bg-surface-container-low border-t border-outline-variant/60 flex items-center justify-between text-xs text-outline">
        <span>Use keywords or numbers (e.g. "Murugan", "Squid", "PB-", "98401")</span>
        <div class="flex items-center gap-2">
          <span>Jump: ↵</span>
          <span>Close: Esc</span>
        </div>
      </div>
    </div>
  `;

  container.appendChild(modalOverlay);

  const close = () => modalOverlay.remove();
  const input = modalOverlay.querySelector('#omni-search-input');
  const resultsContainer = modalOverlay.querySelector('#omni-results');

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) close();
  });

  // Handle Query Changes
  input.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
      // Revert to quick commands
      resultsContainer.innerHTML = `
        <div class="px-3 py-1.5 text-[11px] font-semibold text-outline uppercase tracking-wider">Quick Commands</div>
        <button data-goto="purchase-bills" class="omni-item flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-container text-left text-sm text-primary transition-colors">
          <div class="flex items-center gap-2"><span class="material-symbols-outlined text-secondary text-[18px]">add_shopping_cart</span><span>+ Create New Purchase Bill</span></div>
        </button>
        <button data-goto="daily-rates" class="omni-item flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-container text-left text-sm text-primary transition-colors">
          <div class="flex items-center gap-2"><span class="material-symbols-outlined text-secondary text-[18px]">trending_up</span><span>Update Daily Seafood Rates</span></div>
        </button>
      `;
      bindItems();
      return;
    }

    const matches = [];

    // Match Fishermen
    state.fishermen.forEach(f => {
      if (f.name.toLowerCase().includes(query) || f.boatName.toLowerCase().includes(query) || f.mobile.includes(query)) {
        matches.push({
          type: 'Fisherman',
          icon: 'sailing',
          title: f.name,
          subtitle: `${f.boatName} • ${f.mobile} (Advance: ₹${f.outstanding})`,
          route: 'fishermen'
        });
      }
    });

    // Match Seafood
    state.seafoodCatalog.forEach(s => {
      if (s.name.toLowerCase().includes(query) || s.category.toLowerCase().includes(query) || s.vernacular.toLowerCase().includes(query)) {
        matches.push({
          type: 'Seafood Species',
          icon: 'set_meal',
          title: s.name,
          subtitle: `${s.category} • Dock Rate: ₹${s.gradeA}/kg (Stock: ${s.stock} KG)`,
          route: 'daily-rates'
        });
      }
    });

    // Match Bills
    state.purchaseBills.forEach(b => {
      if (b.id.toLowerCase().includes(query) || b.fishermanName.toLowerCase().includes(query)) {
        matches.push({
          type: 'Purchase Bill',
          icon: 'receipt_long',
          title: `${b.id} — ₹${b.grandTotal.toLocaleString('en-IN')}`,
          subtitle: `${b.fishermanName} • ${b.date} • ${b.totalKg} KG`,
          route: 'purchase-bills'
        });
      }
    });

    // Match Exporters
    state.exportCompanies.forEach(exp => {
      if (exp.name.toLowerCase().includes(query) || exp.contact.toLowerCase().includes(query)) {
        matches.push({
          type: 'Export Company',
          icon: 'apartment',
          title: exp.name,
          subtitle: `${exp.contact} • Outstanding: ₹${exp.outstanding.toLocaleString('en-IN')}`,
          route: 'export-companies'
        });
      }
    });

    if (matches.length === 0) {
      resultsContainer.innerHTML = `
        <div class="p-6 text-center text-outline text-sm">
          No records matching "<b>${query}</b>"
        </div>
      `;
    } else {
      resultsContainer.innerHTML = matches.map(m => `
        <button data-goto="${m.route}" class="omni-item w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-surface-container text-left transition-colors">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[18px] text-secondary">${m.icon}</span>
            </div>
            <div class="flex flex-col min-w-0">
              <span class="text-sm font-semibold text-primary truncate">${m.title}</span>
              <span class="text-xs text-outline truncate">${m.subtitle}</span>
            </div>
          </div>
          <span class="px-2 py-0.5 rounded bg-surface-container text-[10px] text-on-surface-variant shrink-0 font-medium">${m.type}</span>
        </button>
      `).join('');
      bindItems();
    }
  });

  function bindItems() {
    modalOverlay.querySelectorAll('.omni-item').forEach(item => {
      item.addEventListener('click', () => {
        const route = item.dataset.goto;
        if (route) {
          store.navigate(route);
          close();
        }
      });
    });
  }

  bindItems();
}
