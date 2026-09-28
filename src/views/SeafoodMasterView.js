// SeafoodMasterView Component - Species Catalog & Master Rates
import { store } from '../state/store.js';
import { showToast } from '../components/Toast.js';

export function renderSeafoodMasterView() {
  const state = store.getState();

  return `
    <div class="flex flex-col gap-space-md w-full max-w-[1720px] mx-auto pb-24 animate-fade-in select-none">
      
      <!-- Top Action Strip -->
      <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div>
          <h1 class="font-headline-md text-headline-md text-primary font-bold tracking-tight">Seafood Species Master</h1>
          <p class="text-xs text-on-surface-variant">
            Commercial classification, grades, scientific nomenclature, and inventory benchmarks.
          </p>
        </div>

        <button id="add-species-btn" class="px-4 py-2 rounded-lg bg-primary text-white font-semibold text-xs shadow-sm hover:bg-primary-container active:scale-95 transition-all flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[18px] text-secondary-fixed">add</span>
          <span>+ Add Seafood Species</span>
        </button>
      </div>

      <!-- Species Card Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-space-md">
        ${state.seafoodCatalog.map(s => `
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm overflow-hidden flex flex-col justify-between group hover:border-secondary-marine/50 transition-all">
            <!-- Image & Badge Header -->
            <div class="relative h-44 w-full bg-surface-container overflow-hidden">
              <img src="${s.image}" alt="${s.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div class="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm ${
                s.status === 'Healthy' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
              }">
                ${s.status}
              </div>
              <div class="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded bg-primary/80 backdrop-blur-sm text-white font-mono text-[10px] tracking-wider uppercase">
                ${s.category}
              </div>
            </div>

            <!-- Content Body -->
            <div class="p-space-md flex flex-col gap-2 flex-1">
              <div>
                <h3 class="font-title-lg text-title-lg text-primary font-bold leading-tight">${s.name}</h3>
                <p class="text-[11px] text-outline font-sans italic">${s.scientific}</p>
                <p class="text-[11px] text-secondary font-medium mt-0.5">${s.vernacular}</p>
              </div>

              <!-- Rates & Stock Matrix -->
              <div class="grid grid-cols-2 gap-2 p-2 bg-surface-container-low rounded-lg text-xs mt-2">
                <div>
                  <span class="text-[10px] text-outline uppercase font-semibold block">Dock Purchase</span>
                  <span class="font-mono font-bold text-primary text-sm tabular-nums">₹${s.gradeA} / ${s.unit}</span>
                </div>
                <div>
                  <span class="text-[10px] text-outline uppercase font-semibold block">Export Spot</span>
                  <span class="font-mono font-bold text-secondary-marine text-sm tabular-nums">₹${s.exportRate} / ${s.unit}</span>
                </div>
              </div>

              <div class="flex items-center justify-between text-xs pt-1 text-on-surface-variant">
                <span>Cold Storage Stock:</span>
                <span class="font-mono font-bold text-primary tabular-nums">${s.stock.toFixed(1)} ${s.unit}</span>
              </div>
            </div>

            <!-- Card Footer Action -->
            <div class="p-space-sm bg-surface-container-low border-t border-outline-variant/60 flex items-center justify-between">
              <span class="text-[10px] text-outline font-mono">ID: ${s.id.toUpperCase()}</span>
              <button 
                data-nav="daily-rates" 
                class="px-2.5 py-1 rounded bg-white hover:bg-secondary-marine hover:text-white text-primary text-xs font-semibold border border-outline-variant transition-colors"
              >
                Edit Daily Rates
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

export function bindSeafoodMasterEvents() {
  const container = document.getElementById('app');
  if (!container) return;

  const addBtn = container.querySelector('#add-species-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const name = prompt("Enter new Seafood Species Name (e.g. Red Snapper / Sankara):");
      if (name) {
        showToast(`Species "${name}" added to master catalog.`, 'success');
      }
    });
  }
}
