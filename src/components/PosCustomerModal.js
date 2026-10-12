// PosCustomerModal Component - Fast Customer Switcher & Quick Registration for POS
import { store } from '../state/store.js';
import { showToast } from './Toast.js';
import { posApiFetch } from '../views/PosView.js';

export function openPosCustomerModal(optionsOrCurrentId, onSelectCustomer) {
  const container = document.getElementById('modal-root') || document.body;

  const existing = document.getElementById('pos-customer-modal');
  if (existing) existing.remove();

  let currentCustomerId = 'walk-in';
  let initialTab = 'search';

  if (typeof optionsOrCurrentId === 'object' && optionsOrCurrentId !== null) {
    currentCustomerId = optionsOrCurrentId.currentCustomerId || 'walk-in';
    initialTab = optionsOrCurrentId.initialTab || 'search';
  } else if (typeof optionsOrCurrentId === 'string') {
    currentCustomerId = optionsOrCurrentId;
  }

  const state = store.getState();
  const customers = [...(state.customers || [
    { id: 'walk-in', name: 'Walk-in Counter Customer', mobile: '0000000000', tier: 'Cash Retail Tier-1', outstanding: 0 }
  ])];

  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'pos-customer-modal';
  modalOverlay.className = 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-primary-container/80 backdrop-blur-sm animate-fade-in select-none';

  modalOverlay.innerHTML = `
    <div class="bg-surface-container-lowest w-full max-w-lg rounded-2xl border border-outline-variant shadow-2xl p-space-md animate-slide-up flex flex-col gap-space-sm max-h-[92vh] overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-outline-variant/60 pb-3">
        <div class="flex items-center gap-2.5">
          <span class="p-2 rounded-xl bg-primary text-secondary-fixed flex items-center justify-center shadow-sm">
            <span class="material-symbols-outlined text-[20px]">person_search</span>
          </span>
          <div>
            <h2 class="font-title-lg text-title-lg text-primary font-bold">Counter Customer Registry</h2>
            <p class="text-xs text-on-surface-variant">Switch account or quickly register a new customer</p>
          </div>
        </div>
        <button id="close-customer-modal-btn" class="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      <!-- Navigation Tabs: Search vs + New Customer -->
      <div class="flex border-b border-outline-variant/60 gap-4 text-xs font-semibold">
        <button id="tab-search-btn" class="pb-2 border-b-2 border-secondary text-secondary flex items-center gap-1.5 transition-colors">
          <span class="material-symbols-outlined text-[16px]">manage_search</span>
          <span>Select Customer</span>
        </button>
        <button id="tab-create-btn" class="pb-2 text-on-surface-variant hover:text-on-surface flex items-center gap-1.5 transition-colors">
          <span class="material-symbols-outlined text-[16px]">person_add</span>
          <span>+ New Customer</span>
        </button>
      </div>

      <!-- Tab 1: Search Registry -->
      <div id="customer-search-section" class="flex flex-col gap-3 flex-1 overflow-hidden">
        <div class="relative">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
          <input 
            type="text" 
            id="customer-search-input" 
            placeholder="Search by name, phone number... [ESC to cancel]" 
            class="w-full pl-9 pr-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest border border-outline-variant/60 shadow-inner"
            autofocus
          />
        </div>

        <!-- Walk-in Customer Selection Card -->
        <div id="select-walkin-card" class="p-3 rounded-xl bg-surface-container-low hover:bg-secondary-container/20 border border-secondary/30 flex items-center justify-between cursor-pointer transition-all shadow-sm">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white shrink-0">
              <span class="material-symbols-outlined text-[16px]">storefront</span>
            </div>
            <div class="flex flex-col">
              <span class="font-title-md text-sm text-primary font-bold">Walk-in Counter Customer</span>
              <span class="text-[11px] text-secondary font-medium">Standard Cash / UPI / Card Retail (No Credit)</span>
            </div>
          </div>
          <span class="px-2 py-0.5 rounded text-[10px] font-label-caps bg-secondary text-white font-bold">DEFAULT</span>
        </div>

        <!-- Customer List Container -->
        <div id="customer-list-container" class="flex-1 overflow-y-auto flex flex-col gap-2 max-h-64 pr-1">
          <!-- Rendered dynamically -->
        </div>
      </div>

      <!-- Tab 2: + New Customer Form (Directly accessible during billing) -->
      <div id="customer-create-section" class="hidden flex-col gap-3 flex-1 overflow-y-auto pr-1">
        <!-- Duplicate Warning Banner -->
        <div id="duplicate-customer-banner" class="hidden p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-2">
          <div class="flex items-center gap-2 text-amber-700">
            <span class="material-symbols-outlined text-[20px]">warning</span>
            <span class="text-xs font-bold uppercase tracking-wider">Customer Already Exists</span>
          </div>
          <div class="p-2 rounded-lg bg-surface-container-lowest border border-amber-500/20 flex items-center justify-between">
            <div class="flex flex-col">
              <span id="dup-cust-name" class="font-title-md text-sm font-bold text-on-surface">Rahul Kumar</span>
              <span id="dup-cust-phone" class="font-mono text-xs text-on-surface-variant font-medium">9876543210</span>
            </div>
            <button id="dup-select-btn" class="px-3 py-1.5 rounded-lg bg-secondary text-white text-xs font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all">
              SELECT CUSTOMER
            </button>
          </div>
        </div>

        <!-- Customer Name -->
        <div class="flex flex-col gap-1">
          <label class="font-label-caps text-outline uppercase text-[10px] font-semibold">Customer Name *</label>
          <input 
            type="text" 
            id="new-customer-name" 
            placeholder="e.g. Rahul Kumar or Hotel Saravana" 
            class="w-full px-3 py-2 bg-surface-container-low rounded-lg text-sm border border-outline-variant/60 focus:outline-none focus:bg-surface-container-lowest"
          />
        </div>

        <!-- Phone Number -->
        <div class="flex flex-col gap-1">
          <label class="font-label-caps text-outline uppercase text-[10px] font-semibold">Phone Number *</label>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-2 bg-surface-container-low rounded-lg text-xs font-mono font-bold text-on-surface-variant border border-outline-variant/50">+91</span>
            <input 
              type="tel" 
              id="new-customer-mobile" 
              placeholder="9876543210" 
              maxlength="10"
              class="w-full px-3 py-2 bg-surface-container-low rounded-lg text-sm border border-outline-variant/60 focus:outline-none focus:bg-surface-container-lowest font-mono"
            />
          </div>
          <span class="text-[10px] text-on-surface-variant">10-digit mobile number for invoice & order tracking</span>
        </div>

        <!-- Email (Optional) -->
        <div class="flex flex-col gap-1">
          <label class="font-label-caps text-outline uppercase text-[10px] font-semibold">Email (Optional)</label>
          <input 
            type="email" 
            id="new-customer-email" 
            placeholder="e.g. rahul@example.com" 
            class="w-full px-3 py-2 bg-surface-container-low rounded-lg text-sm border border-outline-variant/60 focus:outline-none focus:bg-surface-container-lowest"
          />
        </div>

        <!-- Address (Optional) -->
        <div class="flex flex-col gap-1">
          <label class="font-label-caps text-outline uppercase text-[10px] font-semibold">Address (Optional)</label>
          <input 
            type="text" 
            id="new-customer-address" 
            placeholder="e.g. Harbour Bay Road #04, Chennai" 
            class="w-full px-3 py-2 bg-surface-container-low rounded-lg text-sm border border-outline-variant/60 focus:outline-none focus:bg-surface-container-lowest"
          />
        </div>

        <!-- Notes (Optional) -->
        <div class="flex flex-col gap-1">
          <label class="font-label-caps text-outline uppercase text-[10px] font-semibold">Notes (Optional)</label>
          <input 
            type="text" 
            id="new-customer-notes" 
            placeholder="e.g. Daily wholesale buyer, preferred cut" 
            class="w-full px-3 py-2 bg-surface-container-low rounded-lg text-sm border border-outline-variant/60 focus:outline-none focus:bg-surface-container-lowest"
          />
        </div>

        <!-- Form Action Buttons -->
        <div class="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-outline-variant/40">
          <button 
            type="button" 
            id="cancel-create-customer-btn" 
            class="py-2.5 rounded-xl bg-surface-container text-on-surface font-title-md font-semibold text-xs hover:bg-surface-container-high transition-colors"
          >
            CANCEL
          </button>
          <button 
            type="button" 
            id="submit-create-customer-btn" 
            class="py-2.5 rounded-xl bg-secondary text-white font-title-md font-bold text-xs shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <span class="material-symbols-outlined text-[16px]">how_to_reg</span>
            <span>CREATE CUSTOMER</span>
          </button>
        </div>
      </div>
    </div>
  `;

  container.appendChild(modalOverlay);

  // Tab switching
  const searchSection = modalOverlay.querySelector('#customer-search-section');
  const createSection = modalOverlay.querySelector('#customer-create-section');
  const tabSearchBtn = modalOverlay.querySelector('#tab-search-btn');
  const tabCreateBtn = modalOverlay.querySelector('#tab-create-btn');

  function activateTab(tab) {
    if (tab === 'create') {
      tabCreateBtn.className = 'pb-2 border-b-2 border-secondary text-secondary flex items-center gap-1.5 font-bold transition-colors';
      tabSearchBtn.className = 'pb-2 text-on-surface-variant hover:text-on-surface flex items-center gap-1.5 transition-colors';
      createSection?.classList.remove('hidden');
      createSection?.classList.add('flex');
      searchSection?.classList.add('hidden');
      setTimeout(() => modalOverlay.querySelector('#new-customer-name')?.focus(), 50);
    } else {
      tabSearchBtn.className = 'pb-2 border-b-2 border-secondary text-secondary flex items-center gap-1.5 font-bold transition-colors';
      tabCreateBtn.className = 'pb-2 text-on-surface-variant hover:text-on-surface flex items-center gap-1.5 transition-colors';
      searchSection?.classList.remove('hidden');
      createSection?.classList.add('hidden');
      createSection?.classList.remove('flex');
      setTimeout(() => modalOverlay.querySelector('#customer-search-input')?.focus(), 50);
    }
  }

  tabSearchBtn?.addEventListener('click', () => activateTab('search'));
  tabCreateBtn?.addEventListener('click', () => activateTab('create'));

  if (initialTab === 'create') {
    activateTab('create');
  }

  // Render search results
  const listContainer = modalOverlay.querySelector('#customer-list-container');
  const searchInput = modalOverlay.querySelector('#customer-search-input');

  function renderList(query = '') {
    const q = query.toLowerCase().trim();
    const filtered = customers.filter(c => 
      c.id !== 'walk-in' && 
      (c.name.toLowerCase().includes(q) || (c.mobile && c.mobile.includes(q)) || (c.mobileNumber && c.mobileNumber.includes(q)))
    );

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div class="py-8 flex flex-col items-center justify-center text-center text-outline gap-2">
          <span class="material-symbols-outlined text-3xl text-outline-variant">person_off</span>
          <p class="text-xs font-medium">No customers found</p>
          <button id="empty-create-btn" class="mt-1 px-3 py-1.5 rounded-lg bg-secondary text-white text-xs font-bold hover:opacity-90 transition-opacity">
            + Create "${query || 'New Customer'}"
          </button>
        </div>
      `;
      listContainer.querySelector('#empty-create-btn')?.addEventListener('click', () => {
        activateTab('create');
        const nameInput = modalOverlay.querySelector('#new-customer-name');
        if (nameInput && query) nameInput.value = query;
      });
      return;
    }

    listContainer.innerHTML = filtered.map(c => {
      const isSelected = c.id === currentCustomerId;
      const phone = c.mobile || c.mobileNumber || '';
      const outstanding = typeof c.outstanding === 'number' ? c.outstanding : (parseFloat(c.outstanding || 0) || 0);

      return `
        <div 
          data-customer-id="${c.id}" 
          class="p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${isSelected ? 'bg-secondary/10 border-secondary shadow-sm' : 'bg-surface-container-low border-outline-variant/40 hover:bg-surface-container'}"
        >
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-full ${isSelected ? 'bg-secondary text-white' : 'bg-surface-container-highest text-on-surface'} flex items-center justify-center font-bold text-xs shrink-0">
              ${c.name.slice(0, 2).toUpperCase()}
            </div>
            <div class="flex flex-col">
              <span class="font-title-md text-sm text-primary font-bold">${c.name}</span>
              <span class="text-xs text-on-surface-variant font-mono font-medium">${phone ? `+91 ${phone}` : 'No phone recorded'}</span>
            </div>
          </div>
          <div class="flex flex-col items-end">
            <span class="text-[11px] font-semibold ${outstanding > 0 ? 'text-amber-700' : 'text-secondary'}">
              Outstanding: ₹${outstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            ${isSelected ? `
              <span class="px-1.5 py-0.5 rounded text-[9px] font-label-caps bg-secondary text-white font-bold">CURRENT</span>
            ` : `
              <span class="text-[10px] text-secondary font-bold hover:underline">SELECT</span>
            `}
          </div>
        </div>
      `;
    }).join('');

    // Attach row select listeners
    listContainer.querySelectorAll('[data-customer-id]').forEach(row => {
      row.addEventListener('click', () => {
        const id = row.getAttribute('data-customer-id');
        const target = customers.find(c => c.id === id);
        if (target) {
          onSelectCustomer(target);
          modalOverlay.remove();
          showToast(`Customer selected: ${target.name}`);
        }
      });
    });
  }

  renderList();

  // Fetch live database customers to ensure up-to-date registry
  posApiFetch('/api/customers?limit=100')
    .then(r => r.ok ? r.json() : null)
    .then(res => {
      const rawItems = Array.isArray(res?.data) ? res.data : res?.data?.items;
      if (rawItems && rawItems.length > 0) {
        for (const item of rawItems) {
          const idx = customers.findIndex(c => c.id === item.id || (item.mobileNumber && (c.mobile === item.mobileNumber || c.mobileNumber === item.mobileNumber)));
          const mapped = {
            id: item.id,
            name: item.name,
            mobile: item.mobileNumber,
            mobileNumber: item.mobileNumber,
            countryCode: item.countryCode || '+91',
            address: item.address,
            outstanding: item.outstanding || 0,
            tier: 'Registered Account'
          };
          if (idx >= 0) {
            customers[idx] = mapped;
          } else {
            customers.unshift(mapped);
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

  // Cancel button inside create form
  modalOverlay.querySelector('#cancel-create-customer-btn')?.addEventListener('click', () => {
    activateTab('search');
  });

  // Duplicate check on phone input
  const mobileInput = modalOverlay.querySelector('#new-customer-mobile');
  const duplicateBanner = modalOverlay.querySelector('#duplicate-customer-banner');
  const dupNameSpan = modalOverlay.querySelector('#dup-cust-name');
  const dupPhoneSpan = modalOverlay.querySelector('#dup-cust-phone');
  const dupSelectBtn = modalOverlay.querySelector('#dup-select-btn');
  let duplicateCustomerMatch = null;

  mobileInput?.addEventListener('input', async () => {
    const rawVal = mobileInput.value.replace(/\D/g, '');
    duplicateCustomerMatch = null;
    duplicateBanner?.classList.add('hidden');

    if (rawVal.length === 10) {
      // 1. Local list check
      const localExisting = customers.find(c => (c.mobile === rawVal || c.mobileNumber === rawVal) && c.id !== 'walk-in');
      if (localExisting) {
        duplicateCustomerMatch = localExisting;
        dupNameSpan.textContent = localExisting.name;
        dupPhoneSpan.textContent = `+91 ${localExisting.mobile || localExisting.mobileNumber}`;
        duplicateBanner?.classList.remove('hidden');
        return;
      }

      // 2. Real-time backend search check
      try {
        const resp = await posApiFetch(`/api/customers?search=${rawVal}&limit=5`);
        if (resp.ok) {
          const res = await resp.json();
          const serverList = Array.isArray(res?.data) ? res.data : res?.data?.items;
          const serverExisting = serverList?.find(c => c.mobileNumber === rawVal);
          if (serverExisting) {
            duplicateCustomerMatch = {
              id: serverExisting.id,
              name: serverExisting.name,
              mobile: serverExisting.mobileNumber,
              mobileNumber: serverExisting.mobileNumber,
              countryCode: serverExisting.countryCode || '+91',
              address: serverExisting.address,
              tier: 'Registered Account'
            };
            dupNameSpan.textContent = serverExisting.name;
            dupPhoneSpan.textContent = `+91 ${serverExisting.mobileNumber}`;
            duplicateBanner?.classList.remove('hidden');
          }
        }
      } catch (err) {
        // Ignore network errors in background search
      }
    }
  });

  dupSelectBtn?.addEventListener('click', () => {
    if (duplicateCustomerMatch) {
      onSelectCustomer(duplicateCustomerMatch);
      modalOverlay.remove();
      showToast(`Selected existing customer: ${duplicateCustomerMatch.name}`);
    }
  });

  // Create Customer Form Submission
  const submitBtn = modalOverlay.querySelector('#submit-create-customer-btn');
  submitBtn?.addEventListener('click', async () => {
    const name = modalOverlay.querySelector('#new-customer-name')?.value.trim();
    const mobile = modalOverlay.querySelector('#new-customer-mobile')?.value.replace(/\D/g, '').trim();
    const email = modalOverlay.querySelector('#new-customer-email')?.value.trim();
    const address = modalOverlay.querySelector('#new-customer-address')?.value.trim();
    const notes = modalOverlay.querySelector('#new-customer-notes')?.value.trim();

    if (!name || name.length < 2) {
      alert('Please enter a valid customer name (at least 2 characters)');
      return;
    }
    if (!mobile || mobile.length < 10) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }

    // 1. Client-side duplicate check
    const existing = duplicateCustomerMatch || customers.find(c => (c.mobile === mobile || c.mobileNumber === mobile) && c.id !== 'walk-in');
    if (existing) {
      duplicateCustomerMatch = existing;
      dupNameSpan.textContent = existing.name;
      dupPhoneSpan.textContent = `+91 ${existing.mobile || existing.mobileNumber}`;
      duplicateBanner?.classList.remove('hidden');
      alert(`Customer already exists with this phone number: ${existing.name}. Tap "SELECT CUSTOMER" to attach to bill.`);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="inline-block animate-spin mr-1">&#9696;</span> CREATING...';

    let createdCustomer = null;

    try {
      const resp = await posApiFetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          countryCode: '+91',
          mobileNumber: mobile,
          email: email || undefined,
          address: address || undefined
        })
      });

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        if (resp.status === 409 || errJson.code === 'CUSTOMER_ALREADY_EXISTS') {
          const dup = errJson.details?.existingCustomer || existing;
          if (dup) {
            duplicateCustomerMatch = dup;
            dupNameSpan.textContent = dup.name;
            dupPhoneSpan.textContent = `+91 ${dup.mobileNumber || dup.mobile}`;
            duplicateBanner?.classList.remove('hidden');
            alert(`Customer already exists: ${dup.name} (${dup.mobileNumber}).`);
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="material-symbols-outlined text-[16px]">how_to_reg</span><span>CREATE CUSTOMER</span>';
            return;
          }
        }
        throw new Error(errJson.message || 'Failed to create customer');
      }

      const json = await resp.json();
      if (!json?.data?.id) {
        throw new Error('Customer ID missing from server response');
      }

      createdCustomer = {
        id: json.data.id,
        name: json.data.name,
        mobile: json.data.mobileNumber,
        mobileNumber: json.data.mobileNumber,
        countryCode: json.data.countryCode || '+91',
        email: json.data.email,
        address: json.data.address,
        tier: 'Registered Account'
      };

    } catch (err) {
      console.error('Customer creation failed:', err);
      const msg = err.message || 'Failed to create customer';
      alert(`Customer Creation Error: ${msg}`);
      showToast(`Creation Error: ${msg}`, 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span class="material-symbols-outlined text-[16px]">how_to_reg</span><span>CREATE CUSTOMER</span>';
      // Do not clear cart, do not close modal on error
      return;
    }

    // Add to local customers list and store
    customers.unshift(createdCustomer);
    if (state.customers) {
      state.customers.unshift(createdCustomer);
    }

    // Automatically select the newly created customer and attach to bill
    onSelectCustomer(createdCustomer);
    modalOverlay.remove();
    showToast(`Customer "${name}" created and selected for bill!`);
  });

  // Close handlers
  modalOverlay.querySelector('#close-customer-modal-btn')?.addEventListener('click', () => modalOverlay.remove());
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) modalOverlay.remove();
  });
}