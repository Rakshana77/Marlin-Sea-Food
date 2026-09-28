// ExportBillingView Component
import { store } from '../state/store.js';
import { openWhatsAppModal } from '../components/WhatsAppPreviewModal.js';
import { showToast } from '../components/Toast.js';

export function renderExportBillingView() {
  const state = store.getState();
  const nextNum = state.exportBills.length + 413;
  const billId = `EXP-2026-0${nextNum}`;
  const defaultExporter = state.exportCompanies[0];

  return `
    <div class="flex flex-col gap-space-md w-full max-w-[1720px] mx-auto pb-24 animate-fade-in select-none">
      
      <!-- Top Command Bar -->
      <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-secondary-marine flex items-center justify-center text-white shrink-0">
            <span class="material-symbols-outlined text-[24px]">local_shipping</span>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="font-headline-md text-headline-md text-primary font-bold tracking-tight">New Export Invoice</h1>
              <span class="px-2 py-0.5 rounded bg-surface-container-high text-primary font-mono text-xs font-bold">${billId}</span>
            </div>
            <p class="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
              <span>${state.date}</span>
              <span class="text-outline">•</span>
              <span class="text-secondary font-medium">Reefer Container & Factory Consignments</span>
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/50 text-xs">
          <span class="material-symbols-outlined text-secondary text-[16px]">verified</span>
          <span class="text-on-surface font-medium">Customs Clearance Standard &bull; FSSAI Licensed</span>
        </div>
      </div>

      <!-- 7:5 Split POS Layout -->
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-space-md lg:gap-space-lg">
        
        <!-- Left 8 Columns -->
        <div class="xl:col-span-8 flex flex-col gap-space-md">
          
          <!-- Exporter Selector -->
          <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm flex flex-col gap-space-sm">
            <label class="text-xs font-semibold text-primary">Select Export Processor / Corporate Client</label>
            <div class="relative">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">apartment</span>
              <select 
                id="export-company-select"
                class="w-full h-11 pl-9 pr-3 rounded-lg bg-surface-container-low border border-outline-variant text-sm font-semibold text-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary-marine"
              >
                ${state.exportCompanies.map(e => `
                  <option value="${e.id}" ${e.id === defaultExporter.id ? 'selected' : ''}>
                    ${e.name} — GSTIN: ${e.gstin} (${e.contact})
                  </option>
                `).join('')}
              </select>
            </div>
          </div>

          <!-- Consignment Lot Table -->
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm overflow-hidden flex flex-col">
            <div class="p-space-md border-b border-outline-variant/60 bg-white flex items-center justify-between">
              <h3 class="font-title-md text-title-md text-primary font-bold">Consignment Packaging & Line Items</h3>
              <span class="text-xs text-outline font-mono">Net Tonnage Billing</span>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="bg-surface-container-low border-b border-outline-variant/60 text-outline font-label-caps uppercase tracking-wider">
                    <th class="py-2.5 px-3">Species & Packaging Type</th>
                    <th class="py-2.5 px-3 text-right">Net Weight (KG)</th>
                    <th class="py-2.5 px-3 text-right">Export Rate (₹/KG)</th>
                    <th class="py-2.5 px-3 text-right">Line Total (₹)</th>
                    <th class="py-2.5 px-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody id="export-items-body" class="divide-y divide-outline-variant/40">
                  <tr class="export-row bg-white hover:bg-surface-container-low/30 transition-colors">
                    <td class="p-2">
                      <select class="exp-species w-full h-9 px-2 bg-surface-container-low border border-outline-variant/60 rounded-md font-semibold text-primary">
                        ${state.seafoodCatalog.map(s => `<option value="${s.id}" data-rate="${s.exportRate}" ${s.id === 'squid' ? 'selected' : ''}>${s.name} (IQF Block)</option>`).join('')}
                      </select>
                    </td>
                    <td class="p-2 text-right">
                      <input type="number" step="0.5" value="120.0" class="exp-kg w-24 h-9 text-right px-2 bg-surface-container-low border border-outline-variant/60 rounded-md font-bold text-primary tabular-nums" />
                    </td>
                    <td class="p-2 text-right">
                      <input type="number" value="490" class="exp-rate w-24 h-9 text-right px-2 bg-surface-container-low border border-outline-variant/60 rounded-md font-bold text-secondary-marine tabular-nums" />
                    </td>
                    <td class="p-2 text-right font-bold text-primary text-sm tabular-nums exp-amount">
                      ₹58,800
                    </td>
                    <td class="p-2 text-center">
                      <button class="remove-exp-row p-1 text-outline hover:text-error rounded"><span class="material-symbols-outlined text-[16px]">close</span></button>
                    </td>
                  </tr>

                  <tr class="export-row bg-white hover:bg-surface-container-low/30 transition-colors">
                    <td class="p-2">
                      <select class="exp-species w-full h-9 px-2 bg-surface-container-low border border-outline-variant/60 rounded-md font-semibold text-primary">
                        ${state.seafoodCatalog.map(s => `<option value="${s.id}" data-rate="${s.exportRate}" ${s.id === 'prawn' ? 'selected' : ''}>${s.name} (Blast Frozen)</option>`).join('')}
                      </select>
                    </td>
                    <td class="p-2 text-right">
                      <input type="number" step="0.5" value="160.0" class="exp-kg w-24 h-9 text-right px-2 bg-surface-container-low border border-outline-variant/60 rounded-md font-bold text-primary tabular-nums" />
                    </td>
                    <td class="p-2 text-right">
                      <input type="number" value="880" class="exp-rate w-24 h-9 text-right px-2 bg-surface-container-low border border-outline-variant/60 rounded-md font-bold text-secondary-marine tabular-nums" />
                    </td>
                    <td class="p-2 text-right font-bold text-primary text-sm tabular-nums exp-amount">
                      ₹140,800
                    </td>
                    <td class="p-2 text-center">
                      <button class="remove-exp-row p-1 text-outline hover:text-error rounded"><span class="material-symbols-outlined text-[16px]">close</span></button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="p-space-md bg-surface-container-low border-t border-outline-variant/60 flex items-center justify-between">
              <button id="add-export-row-btn" class="px-3.5 py-1.5 rounded-lg bg-white border border-outline-variant hover:bg-surface-container text-xs font-semibold text-primary flex items-center gap-1 shadow-xs">
                <span class="material-symbols-outlined text-[16px] text-secondary">add_circle</span>
                <span>+ Add Export Lot</span>
              </button>
              <span class="text-xs text-outline">Zero-rated commercial export consignment</span>
            </div>
          </div>
        </div>

        <!-- Right 4 Columns: Settlement -->
        <div class="xl:col-span-4 flex flex-col gap-space-md">
          <div class="bg-surface-container-lowest p-space-lg rounded-xl border border-outline-variant/60 shadow-sm flex flex-col gap-space-md sticky top-20">
            <h2 class="font-headline-md text-headline-md text-primary font-bold border-b border-outline-variant/60 pb-3">Invoice Summary</h2>

            <div class="bg-surface-container-low p-space-md rounded-lg flex flex-col gap-2.5 text-xs">
              <div class="flex justify-between items-center">
                <span class="text-on-surface-variant">Consignment Net Tonnage:</span>
                <span id="exp-total-kg" class="font-headline-md text-headline-md text-primary font-bold tabular-nums">280.0 KG</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-on-surface-variant">Seafood Value Subtotal:</span>
                <span id="exp-subtotal" class="font-title-lg text-title-lg text-primary font-bold tabular-nums">₹199,600</span>
              </div>
              <div class="flex justify-between items-center text-on-surface-variant">
                <span>Reefer Freight / Transport:</span>
                <div class="flex items-center gap-1">
                  <span>+₹</span>
                  <input type="number" id="exp-transport" value="4500" class="w-16 h-7 text-right px-1 bg-white border border-outline-variant rounded font-mono font-bold text-xs" />
                </div>
              </div>
              <div class="flex justify-between items-center text-on-surface-variant">
                <span>Flake Ice & Master Cartons:</span>
                <div class="flex items-center gap-1">
                  <span>+₹</span>
                  <input type="number" id="exp-packing" value="2500" class="w-16 h-7 text-right px-1 bg-white border border-outline-variant rounded font-mono font-bold text-xs" />
                </div>
              </div>
              <div class="border-t border-outline-variant pt-2 mt-1 flex justify-between items-baseline">
                <span class="font-bold text-sm text-primary">GRAND TOTAL:</span>
                <span id="exp-grand-total" class="font-headline-lg text-headline-lg text-secondary-marine font-bold tabular-nums">₹206,600</span>
              </div>
            </div>

            <!-- Submit Button -->
            <button 
              id="generate-export-invoice-btn"
              class="w-full py-3.5 rounded-lg bg-secondary-marine text-white font-title-lg text-base font-bold shadow-md hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span class="material-symbols-outlined text-[20px]">send</span>
              <span>GENERATE EXPORT INVOICE</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  `;
}

export function bindExportBillingEvents() {
  const container = document.getElementById('app');
  if (!container) return;

  const state = store.getState();

  function recalculate() {
    let totalKg = 0;
    let subtotal = 0;

    container.querySelectorAll('.export-row').forEach(row => {
      const kg = parseFloat(row.querySelector('.exp-kg').value) || 0;
      const rate = parseFloat(row.querySelector('.exp-rate').value) || 0;
      const amount = kg * rate;
      row.querySelector('.exp-amount').textContent = `₹${Math.round(amount).toLocaleString('en-IN')}`;
      totalKg += kg;
      subtotal += amount;
    });

    const transport = parseFloat(container.querySelector('#exp-transport').value) || 0;
    const packing = parseFloat(container.querySelector('#exp-packing').value) || 0;
    const grandTotal = subtotal + transport + packing;

    container.querySelector('#exp-total-kg').textContent = `${totalKg.toFixed(1)} KG`;
    container.querySelector('#exp-subtotal').textContent = `₹${Math.round(subtotal).toLocaleString('en-IN')}`;
    container.querySelector('#exp-grand-total').textContent = `₹${Math.round(grandTotal).toLocaleString('en-IN')}`;

    return { totalKg, subtotal, transport, packing, grandTotal };
  }

  container.querySelectorAll('.export-row input').forEach(input => {
    input.addEventListener('input', recalculate);
  });

  container.querySelector('#exp-transport').addEventListener('input', recalculate);
  container.querySelector('#exp-packing').addEventListener('input', recalculate);

  // Generate Invoice Trigger
  const genBtn = container.querySelector('#generate-export-invoice-btn');
  if (genBtn) {
    genBtn.addEventListener('click', () => {
      const calc = recalculate();
      const exporterSelect = container.querySelector('#export-company-select');
      const exporter = state.exportCompanies.find(e => e.id === exporterSelect.value) || state.exportCompanies[0];

      const items = [];
      container.querySelectorAll('.export-row').forEach(row => {
        const select = row.querySelector('.exp-species');
        const speciesName = select.options[select.selectedIndex].textContent;
        const netKg = parseFloat(row.querySelector('.exp-kg').value) || 0;
        const rate = parseFloat(row.querySelector('.exp-rate').value) || 0;
        const amount = netKg * rate;
        items.push({ speciesName, netKg, rate, amount });
      });

      const bill = store.addExportBill({
        exporterId: exporter.id,
        exporterName: exporter.name,
        contact: exporter.contact,
        phone: exporter.phone,
        items,
        totalKg: calc.totalKg,
        subtotal: calc.subtotal,
        transportCharges: calc.transport,
        packingCharges: calc.packing,
        tax: 0,
        grandTotal: calc.grandTotal,
        paymentStatus: 'Pending (15 Days)'
      });

      showToast(`Export Invoice ${bill.id} generated!`, 'success');

      openWhatsAppModal({
        name: exporter.name,
        phone: exporter.phone,
        billId: bill.id,
        date: bill.date,
        items: bill.items,
        totalKg: bill.totalKg,
        grandTotal: bill.grandTotal,
        type: 'Export'
      });
    });
  }
}
