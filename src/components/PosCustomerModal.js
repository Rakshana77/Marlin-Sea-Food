// PosCustomerModal Component - Fast Customer Switcher & Quick Registration for POS
import { store } from '../state/store.js';
import { showToast } from './Toast.js';
import { posApiFetch } from '../views/PosView.js';

export function openPosCustomerModal(currentCustomerId, onSelectCustomer) {
  const container = document.getElementById('modal-root') || document.body;

  const existing = document.getElementById('pos-customer-modal');
  if (existing) existing.remove();

  const state = store.getState();
  const customers = [...(state.customers || [
    { id: 'walk-in', name: 'Walk-in Counter Customer', mobile: '0000000000', tier: 'Cash Retail Tier-1' }
  ])];

  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'pos-customer-modal';
  modalOverlay.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary-container/80 backdrop-blur-sm animate-fade-in select-none';

  modalOverlay.innerHTML = `
    <div class="bg-surface-container-lowest w-full max-w-lg rounded-2xl border border-outline-variant shadow-2xl p-space-md animate-slide-up flex flex-col gap-space-sm max-h-[90vh]">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-outline-variant/60 pb-3">
        <div class="flex items-center gap-2">
          <span class="p-2 rounded-xl bg-primary text-secondary-fixed flex items-center justify-center">
            <span class="material-symbols-outlined text-[20px]">person_search</span>
          </span>
          <div>
            <h2 class="font-title-lg text-title-lg text-primary font-bold">Select Counter Customer</h2>
            <p class="text-xs text-on-surface-variant">Quick search or register a new customer profile</p>
          </div>
        </div>
        <button id="close-customer-modal-btn" class="p-1 rounded-md text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      <!-- Tabs: Search vs Quick Create -->
      <div class="flex border-b border-outline-variant/60 gap-4 text-xs font-semibold">
        <button id="tab-search-btn" class="pb-2 border-b-2 border-secondary text-secondary flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[16px]">manage_search</span>
          <span>Search Registry</span>
        </button>
        <button id="tab-create-btn" class="pb-2 text-on-surface-variant hover:text-on-surface flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[16px]">person_add</span>
          <span>+ Quick Create</span>
        </button>
      </div>

      <!-- Tab 1: Search Existing -->
      <div id="customer-search-section" class="flex flex-col gap-3 flex-1 overflow-hidden">
        <div class="relative">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
          <input 
            type="text" 
            id="customer-search-input" 
            placeholder="Search by name, mobile number... [ESC to cancel]" 
            class="w-full pl-9 pr-4 py-2 bg-surface-container-low rounded-lg text-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest border border-outline-variant/60"
            autofocus
          />
        </div>

        <!-- Quick Walk-in Shortcut Card -->
        <div id="select-walkin-card" class="p-2.5 rounded-xl bg-surface-container-low hover:bg-secondary-container/20 border border-secondary/30 flex items-center justify-between cursor-pointer transition-all">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white shrink-0">
              <span class="material-symbols-outlined text-[16px]">storefront</span>
            </div>
            <div class="flex flex-col">
              <span class="font-title-md text-sm text-primary font-bold">Walk-in Counter Customer</span>
              <span class="text-[11px] text-secondary font-medium">Standard Cash / UPI Retail (No Credit)</span>
            </div>
          </div>
          <span class="px-2 py-0.5 rounded text-[10px] font-label-caps bg-secondary text-white font-bold">DEFAULT</span>
        </div>

        <!-- Customer List Container -->
        <div id="customer-list-container" class="flex-1 overflow-y-auto flex flex-col gap-1.5 max-h-60 pr-1">
          <!-- Rendered dynamically -->
        </div>
      </div>

      <!-- Tab 2: Quick Create -->
      <div id="customer-create-section" class="hidden flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="font-label-caps text-outline uppercase text-[10px]">Customer Full Name *</label>
          <input 
            type="text" 
            id="new-customer-name" 
            placeholder="e.g. Anandha Bhavan Restaurant" 
            class="w-full px-3 py-2 bg-surface-container-low rounded-lg text-sm border border-outline-variant/60 focus:outline-none"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="font-label-caps text-outline uppercase text-[10px]">Mobile Number *</label>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-2 bg-surface-container-low rounded-lg text-xs font-mono font-bold text-on-surface-variant">+91</span>
            <input 
              type="tel" 
              id="new-customer-mobile" 
              placeholder="98401 23456" 
              maxlength="10"
              class="w-full px-3 py-2 bg-surface-container-low rounded-lg text-sm border border-outline-variant/60 focus:outline-none"
            />
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <label class="font-label-caps text-outline uppercase text-[10px]">Delivery / Counter Notes (Optional)</label>
          <input 
            type="text" 
            id="new-customer-address" 
            placeholder="e.g. Kasimedu Stall #12 or Marina Beach" 
            class="w-full px-3 py-2 bg-surface-container-low rounded-lg text-sm border border-outline-variant/60 focus:outline-none"
          />
        </div>

        <button 
          id="submit-create-customer-btn" 
          class="w-full py-2.5 rounded-xl bg-secondary text-white font-title-md font-semibold text-sm shadow hover:opacity-90 active:scale-95 transition-all mt-1 flex items-center justify-center gap-2"
        >
          <span class="material-symbols-outlined text-[18px]">how_to_reg</span>
          <span>Register & Select for Order</span>
        </button>
      </div>
    </div>
  `;

  container.appendChild(modalOverlay);

  // Tab switching
  const searchSection = modalOverlay.querySelector('#customer-search-section');
  const createSection = modalOverlay.querySelector('#customer-create-section');
  const tabSearchBtn = modalOverlay.querySelector('#tab-search-btn');
  const tabCreateBtn = modalOverlay.querySelector('#tab-create-btn');

  tabSearchBtn?.addEventListener('click', () => {
    tabSearchBtn.className = 'pb-2 border-b-2 border-secondary text-secondary flex items-center gap-1.5';
    tabCreateBtn.className = 'pb-2 text-on-surface-variant hover:text-on-surface flex items-center gap-1.5';
    searchSection?.classList.remove('hidden');
    createSection?.classList.add('hidden');
  });

  tabCreateBtn?.addEventListener('click', () => {
    tabCreateBtn.className = 'pb-2 border-b-2 border-secondary text-secondary flex items-center gap-1.5';
    tabSearchBtn.className = 'pb-2 text-on-surface-variant hover:text-on-surface flex items-center gap-1.5';
    createSection?.classList.remove('hidden');
    searchSection?.classList.add('hidden');
  });

  // Render search results
  const listContainer = modalOverlay.querySelector('#customer-list-container');
  const searchInput = modalOverlay.querySelector('#customer-search-input');

  function renderList(query = '') {
    const q = query.toLowerCase().trim();
    const filtered = customers.filter(c => 
      c.id !== 'walk-in' && 
      (c.name.toLowerCase().includes(q) || (c.mobile && c.mobile.includes(q)))
    );

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div class="py-6 text-center text-xs text-outline">
          No registered customer found for "${query}"
        </div>
      `;
      return;
    }

    listContainer.innerHTML = filtered.map(c => `
      <div 
        data-select-id="${c.id}"
        class="p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/40 flex items-center justify-between cursor-pointer transition-colors"
      >
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
            ${c.name.charAt(0)}
          </div>
          <div class="flex flex-col">
            <span class="font-title-md text-xs font-semibold text-primary">${c.name}</span>
            <span class="text-[11px] text-outline font-mono">+91 ${c.mobile || c.mobileNumber || ''}</span>
          </div>
        </div>
        <button class="px-2 py-1 rounded bg-secondary text-white text-[11px] font-semibold hover:opacity-90">
          Select
        </button>
      </div>
    `).join('');

    listContainer.querySelectorAll('[data-select-id]').forEach(el => {
      el.addEventListener('click', () => {
        const selected = customers.find(c => c.id === el.dataset.selectId);
        if (selected) {
          onSelectCustomer(selected);
          modalOverlay.remove();
          showToast(`Customer set to ${selected.name}`);
        }
      });
    });
  }

  renderList();

  // Fetch live database customers
  posApiFetch('/api/customers?limit=100')
    .then(r => r.ok ? r.json() : null)
    .then(res => {
      if (res?.data?.items && res.data.items.length > 0) {
        for (const item of res.data.items) {
          if (!customers.find(c => c.id === item.id)) {
            customers.unshift({
              id: item.id,
              name: item.name,
              mobile: item.mobileNumber,
              mobileNumber: item.mobileNumber,
              countryCode: item.countryCode,
              address: item.address,
              tier: 'Registered Account'
            });
          }
        }
        renderList(searchInput?.value || '');
      }
    })
    .catch(() => null);

  searchInput?.addEventListener('input', (e) => {
    renderList(e.target.value);
  });

  // Walk-in Select
  modalOverlay.querySelector('#select-walkin-card')?.addEventListener('click', () => {
    onSelectCustomer({
      id: 'walk-in',
      name: 'Walk-in Counter Customer',
      mobile: '0000000000',
      tier: 'Cash Retail Tier-1'
    });
    modalOverlay.remove();
    showToast('Customer set to Walk-in');
  });

  // Create Customer Form Submission
  const submitBtn = modalOverlay.querySelector('#submit-create-customer-btn');
  submitBtn?.addEventListener('click', async () => {
    const name = modalOverlay.querySelector('#new-customer-name')?.value.trim();
    const mobile = modalOverlay.querySelector('#new-customer-mobile')?.value.trim();
    const address = modalOverlay.querySelector('#new-customer-address')?.value.trim();

    if (!name || name.length < 2) {
      alert('Please enter a valid customer name');
      return;
    }
    if (!mobile || mobile.length < 10) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="inline-block animate-spin mr-1">&#9696;</span> Registering...';

    let newCust = {
      id: `cust-${Date.now()}`,
      name,
      mobile,
      mobileNumber: mobile,
      countryCode: '+91',
      address,
      tier: 'Registered Retail'
    };

    try {
      const resp = await posApiFetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          countryCode: '+91',
          mobileNumber: mobile,
          address: address || undefined
        })
      });

      if (resp.ok) {
        const json = await resp.json();
        if (json?.data?.id) {
          newCust = {
            id: json.data.id,
            name: json.data.name,
            mobile: json.data.mobileNumber,
            mobileNumber: json.data.mobileNumber,
            countryCode: json.data.countryCode,
            address: json.data.address,
            tier: 'Registered Account'
          };
        }
      }
    } catch (err) {
      console.warn('Could not register customer via API:', err);
    }

    // Add to store
    if (state.customers) {
      state.customers.push(newCust);
    }

    onSelectCustomer(newCust);
    modalOverlay.remove();
    showToast(`Registered and selected ${name}`);
  });

  // Close handlers
  modalOverlay.querySelector('#close-customer-modal-btn')?.addEventListener('click', () => modalOverlay.remove());
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) modalOverlay.remove();
  });
}