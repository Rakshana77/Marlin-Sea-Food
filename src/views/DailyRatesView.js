// DailyRatesView Component - Fast Rate Benchmark Hub
import { store } from '../state/store.js';
import { showToast } from '../components/Toast.js';

export function renderDailyRatesView() {
  const state = store.getState();

  const categories = ['All', 'Squid & Cuttlefish', 'Crab', 'Prawn', 'Fish', 'Lobster', 'Octopus'];

  return `
    <div class="flex flex-col gap-space-md w-full max-w-[1720px] mx-auto pb-24 animate-fade-in select-none">
      
      <!-- Operational Header Strip -->
      <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-space-md">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <h1 class="font-headline-md text-headline-md text-primary font-bold tracking-tight">Daily Seafood Rates</h1>
            <div class="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs">
              <span class="h-2 w-2 rounded-full bg-secondary animate-pulse"></span>
              <span class="font-label-caps font-bold tracking-wider uppercase">Morning Auction Active</span>
            </div>
          </div>
          <p class="text-xs text-on-surface-variant">
            Dockside intake benchmarks, tier grades (A/B/C), and international export quotes.
          </p>
        </div>

        <!-- Date Navigator & Batch CTAs -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- Date Controller -->
          <div class="flex items-center rounded-lg bg-surface-container-low border border-outline-variant/60 p-1 text-xs">
            <button id="rate-prev-day" class="p-1 rounded hover:bg-white text-outline hover:text-primary transition-colors" title="Previous Day">
              <span class="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>
            <div class="px-2 flex items-center gap-1.5 cursor-pointer">
              <span class="material-symbols-outlined text-secondary text-[15px]">event</span>
              <span class="font-mono font-bold text-primary">${state.date}</span>
              <span class="font-label-caps px-1 py-0.2 rounded bg-surface-container text-on-surface-variant text-[9px]">TODAY</span>
            </div>
            <button id="rate-next-day" class="p-1 rounded hover:bg-white text-outline hover:text-primary transition-colors" title="Next Day">
              <span class="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>

          <!-- Batch Action Buttons -->
          <button 
            id="rate-bulk-adjust-btn"
            class="px-3 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-semibold text-xs border border-outline-variant flex items-center gap-1 transition-colors"
          >
            <span class="material-symbols-outlined text-[16px] text-secondary">tune</span>
            <span>% Adjust</span>
          </button>

          <button 
            id="rate-copy-yesterday-btn"
            class="px-3 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-semibold text-xs border border-outline-variant flex items-center gap-1 transition-colors"
          >
            <span class="material-symbols-outlined text-[16px] text-outline">content_copy</span>
            <span>Copy Yesterday</span>
          </button>

          <button 
            id="rate-publish-all-btn"
            class="px-4 py-2 rounded-lg bg-secondary-marine text-white font-semibold text-xs shadow-sm hover:opacity-95 active:scale-95 transition-all flex items-center gap-1"
          >
            <span class="material-symbols-outlined text-[16px]">cloud_done</span>
            <span>Publish & Lock</span>
          </button>
        </div>
      </div>

      <!-- Category Filter Tabs -->
      <div class="flex items-center gap-1 overflow-x-auto pb-1">
        ${categories.map((cat, idx) => `
          <button 
            class="rate-cat-tab px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              idx === 0 
                ? 'bg-primary text-white shadow-xs' 
                : 'bg-surface-container-lowest hover:bg-surface-container text-on-surface border border-outline-variant/50'
            }"
            data-category="${cat}"
          >
            ${cat}
          </button>
        `).join('')}
      </div>

      <!-- Rate Master High-Density ERP Table -->
      <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-surface-container-low border-b border-outline-variant/60 text-outline font-label-caps uppercase tracking-wider">
                <th class="py-3 px-4">Seafood Species</th>
                <th class="py-3 px-3 text-right">Grade A (Dock)</th>
                <th class="py-3 px-3 text-right">Grade B (Dock)</th>
                <th class="py-3 px-3 text-right">Grade C (Dock)</th>
                <th class="py-3 px-3 text-right">Export Quote</th>
                <th class="py-3 px-3 text-right">Spread Margin</th>
                <th class="py-3 px-3 text-center">Cold Stock</th>
                <th class="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant/40" id="rate-table-body">
              ${state.seafoodCatalog.map(species => {
                const spread = species.exportRate - species.gradeA;
                return `
                  <tr class="hover:bg-surface-container-low/30 transition-colors" data-species-id="${species.id}">
                    <!-- Species Name & Image -->
                    <td class="py-2.5 px-4">
                      <div class="flex items-center gap-3">
                        <img src="${species.image}" alt="${species.name}" class="w-9 h-9 rounded-lg object-cover bg-surface-container shrink-0 border border-outline-variant/60" />
                        <div class="flex flex-col min-w-0">
                          <span class="font-bold text-primary text-sm truncate">${species.name}</span>
                          <span class="text-[11px] text-outline font-sans">${species.vernacular} • ${species.category}</span>
                        </div>
                      </div>
                    </td>

                    <!-- Grade A -->
                    <td class="py-2.5 px-3 text-right">
                      <div class="relative inline-flex items-center">
                        <span class="absolute left-2 text-[11px] text-outline font-mono">₹</span>
                        <input 
                          type="number" 
                          data-field="gradeA" 
                          value="${species.gradeA}" 
                          class="rate-cell-input w-24 h-9 pl-5 pr-2 text-right bg-surface-container-low border border-outline-variant/60 rounded-md font-mono font-bold text-primary focus:bg-white focus:ring-2 focus:ring-secondary-marine focus:outline-none tabular-nums" 
                        />
                      </div>
                    </td>

                    <!-- Grade B -->
                    <td class="py-2.5 px-3 text-right">
                      <div class="relative inline-flex items-center">
                        <span class="absolute left-2 text-[11px] text-outline font-mono">₹</span>
                        <input 
                          type="number" 
                          data-field="gradeB" 
                          value="${species.gradeB}" 
                          class="rate-cell-input w-24 h-9 pl-5 pr-2 text-right bg-surface-container-low border border-outline-variant/60 rounded-md font-mono font-bold text-on-surface focus:bg-white focus:ring-2 focus:ring-secondary-marine focus:outline-none tabular-nums" 
                        />
                      </div>
                    </td>

                    <!-- Grade C -->
                    <td class="py-2.5 px-3 text-right">
                      <div class="relative inline-flex items-center">
                        <span class="absolute left-2 text-[11px] text-outline font-mono">₹</span>
                        <input 
                          type="number" 
                          data-field="gradeC" 
                          value="${species.gradeC}" 
                          class="rate-cell-input w-24 h-9 pl-5 pr-2 text-right bg-surface-container-low border border-outline-variant/60 rounded-md font-mono font-bold text-on-surface-variant focus:bg-white focus:ring-2 focus:ring-secondary-marine focus:outline-none tabular-nums" 
                        />
                      </div>
                    </td>

                    <!-- Export Quote -->
                    <td class="py-2.5 px-3 text-right">
                      <div class="relative inline-flex items-center">
                        <span class="absolute left-2 text-[11px] text-outline font-mono">₹</span>
                        <input 
                          type="number" 
                          data-field="exportRate" 
                          value="${species.exportRate}" 
                          class="rate-cell-input w-24 h-9 pl-5 pr-2 text-right bg-secondary-container/20 border border-secondary/40 rounded-md font-mono font-bold text-secondary-marine focus:bg-white focus:ring-2 focus:ring-secondary-marine focus:outline-none tabular-nums" 
                        />
                      </div>
                    </td>

                    <!-- Spread Margin -->
                    <td class="py-2.5 px-3 text-right font-mono font-bold ${spread >= 0 ? 'text-profit' : 'text-error'} tabular-nums">
                      +₹${spread}/kg
                    </td>

                    <!-- Stock Status -->
                    <td class="py-2.5 px-3 text-center">
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[11px] font-semibold ${
                        species.status === 'Healthy' ? 'bg-profit-bg text-profit' : 'bg-warning-bg text-warning'
                      }">
                        ${species.stock.toFixed(1)} KG
                      </span>
                    </td>

                    <!-- Inline Action -->
                    <td class="py-2.5 px-3 text-center">
                      <button 
                        class="save-single-rate-btn px-2.5 py-1 rounded bg-surface-container hover:bg-secondary-marine hover:text-white text-xs font-semibold text-primary transition-colors"
                        data-id="${species.id}"
                      >
                        Save
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

export function bindDailyRatesEvents() {
  const container = document.getElementById('app');
  if (!container) return;

  // Category Tab filtering
  container.querySelectorAll('.rate-cat-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.rate-cat-tab').forEach(t => {
        t.className = 'rate-cat-tab px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors bg-surface-container-lowest hover:bg-surface-container text-on-surface border border-outline-variant/50';
      });
      tab.className = 'rate-cat-tab px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors bg-primary text-white shadow-xs';
      
      const cat = tab.dataset.category;
      const rows = container.querySelectorAll('#rate-table-body tr');
      rows.forEach(r => {
        const text = r.textContent;
        if (cat === 'All' || text.includes(cat)) {
          r.style.display = '';
        } else {
          r.style.display = 'none';
        }
      });
    });
  });

  // Cell edits listener
  container.querySelectorAll('.rate-cell-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const row = input.closest('tr');
      const speciesId = row.dataset.speciesId;
      const field = input.dataset.field;
      store.updateDailyRate(speciesId, field, e.target.value);
    });
  });

  // Single Save Button
  container.querySelectorAll('.save-single-rate-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = btn.closest('tr');
      const inputs = row.querySelectorAll('.rate-cell-input');
      const speciesId = btn.dataset.id;
      inputs.forEach(input => {
        store.updateDailyRate(speciesId, input.dataset.field, input.value);
      });
      showToast(`Rates for ${speciesId.toUpperCase()} updated.`, 'success');
    });
  });

  // Copy Yesterday
  const copyBtn = container.querySelector('#rate-copy-yesterday-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      showToast("Yesterday's dock auction rates loaded into rate master.", 'info');
    });
  }

  // Publish All
  const pubBtn = container.querySelector('#rate-publish-all-btn');
  if (pubBtn) {
    pubBtn.addEventListener('click', () => {
      showToast("Daily Rates published & locked across all 4 terminal counters!", 'success');
    });
  }

  // Bulk Adjust (% change)
  const bulkBtn = container.querySelector('#rate-bulk-adjust-btn');
  if (bulkBtn) {
    bulkBtn.addEventListener('click', () => {
      const percent = prompt("Enter percentage adjustment (e.g. 5 for +5%, -10 for -10%):", "5");
      if (percent !== null && !isNaN(percent)) {
        store.bulkAdjustRates(parseFloat(percent));
        showToast(`All seafood rates adjusted by ${percent}%.`, 'success');
        store.notify(); // Re-render
      }
    });
  }
}
