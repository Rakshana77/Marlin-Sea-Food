// ThermalReceiptModal Component - 80mm ESC/POS Thermal Receipt Slip & PDF
import { openWhatsAppModal } from './WhatsAppPreviewModal.js';
import { showToast } from './Toast.js';

export function openThermalReceiptModal(bill) {
  const container = document.getElementById('modal-root');
  if (!container) return;

  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'thermal-receipt-modal';
  modalOverlay.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary-container/70 backdrop-blur-sm animate-fade-in';

  modalOverlay.innerHTML = `
    <div class="bg-surface-container-lowest w-full max-w-lg rounded-xl border border-outline-variant shadow-2xl p-space-lg animate-slide-up flex flex-col gap-space-md max-h-[92vh] overflow-y-auto">
      <!-- Modal Header -->
      <div class="flex items-center justify-between border-b border-outline-variant/60 pb-3">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-secondary text-[24px]">receipt_long</span>
          <div>
            <h2 class="font-title-lg text-title-lg text-primary font-bold">Procurement Bill Saved</h2>
            <p class="text-xs text-on-surface-variant font-mono">${bill.id} • ${bill.date}</p>
          </div>
        </div>
        <button id="close-receipt-btn" class="p-1 rounded-md text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      <!-- Action Hub Bar -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button id="print-slip-btn" class="flex flex-col items-center justify-center p-2.5 rounded-lg bg-primary text-white hover:bg-primary-container transition-all active:scale-95 shadow-sm">
          <span class="material-symbols-outlined text-[20px] text-secondary-fixed">print</span>
          <span class="text-xs font-semibold mt-1">Print Slip</span>
        </button>

        <button id="whatsapp-slip-btn" class="flex flex-col items-center justify-center p-2.5 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition-all active:scale-95 shadow-sm">
          <span class="material-symbols-outlined text-[20px]">chat</span>
          <span class="text-xs font-semibold mt-1">WhatsApp</span>
        </button>

        <button id="pdf-slip-btn" class="flex flex-col items-center justify-center p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant transition-colors">
          <span class="material-symbols-outlined text-[20px] text-secondary">picture_as_pdf</span>
          <span class="text-xs font-semibold mt-1">PDF Download</span>
        </button>

        <a href="tel:${bill.mobile || ''}" class="flex flex-col items-center justify-center p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant transition-colors">
          <span class="material-symbols-outlined text-[20px] text-primary">call</span>
          <span class="text-xs font-semibold mt-1">Call Boat</span>
        </a>
      </div>

      <!-- Thermal Paper Receipt Simulation (80mm Width) -->
      <div class="bg-white border-2 border-dashed border-outline-variant/80 rounded-lg p-5 font-mono text-xs text-black shadow-inner flex flex-col items-center">
        <!-- Printable Area -->
        <div id="thermal-receipt-print-area" class="w-full max-w-[76mm] text-center">
          <div class="border-b border-black pb-2 mb-2">
            <h3 class="font-bold text-base tracking-tight">MARLIN SEA FOOD</h3>
            <p class="text-[10px]">Harbor Wholesale Terminal 04</p>
            <p class="text-[10px]">North Slipway, Chennai Harbour</p>
            <p class="text-[10px]">Ph: +91 98401 00000 | GST: 33AABCM9012F1Z4</p>
          </div>

          <div class="text-left text-[11px] mb-2 border-b border-black/40 pb-2 flex flex-col gap-0.5">
            <div class="flex justify-between">
              <span><b>BILL:</b> ${bill.id}</span>
              <span><b>DATE:</b> ${bill.date}</span>
            </div>
            <div class="flex justify-between">
              <span><b>TIME:</b> ${bill.time || '06:45 AM'}</span>
              <span><b>TYPE:</b> PROCUREMENT</span>
            </div>
            <div><b>FISHERMAN:</b> ${bill.fishermanName}</div>
            <div><b>VESSEL / REG:</b> ${bill.boatName}</div>
            <div><b>CONTACT:</b> ${bill.mobile || '+91 98401 23456'}</div>
          </div>

          <!-- Items Table -->
          <table class="w-full text-left text-[10px] mb-2 border-b border-black pb-2">
            <thead>
              <tr class="border-b border-black">
                <th class="py-1">SPECIES</th>
                <th class="py-1 text-right">NET KG</th>
                <th class="py-1 text-right">RATE</th>
                <th class="py-1 text-right">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              ${bill.items.map(item => `
                <tr>
                  <td class="py-0.5 truncate max-w-[80px]">${item.speciesName}</td>
                  <td class="py-0.5 text-right tabular-nums">${item.netKg.toFixed(1)}</td>
                  <td class="py-0.5 text-right tabular-nums">₹${item.rate}</td>
                  <td class="py-0.5 text-right tabular-nums font-bold">₹${item.amount.toLocaleString('en-IN')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Financial Breakdown -->
          <div class="text-right text-[11px] flex flex-col gap-0.5 border-b border-black pb-2 mb-2">
            <div class="flex justify-between">
              <span>TOTAL NET CATCH:</span>
              <span class="font-bold">${bill.totalKg.toFixed(1)} KG</span>
            </div>
            <div class="flex justify-between">
              <span>CATCH VALUE:</span>
              <span>₹${bill.subtotal.toLocaleString('en-IN')}</span>
            </div>
            ${bill.crateDeduction > 0 ? `
              <div class="flex justify-between text-black/80">
                <span>CRATE DEDUCTION (${bill.totalCrates || 4}):</span>
                <span>-₹${bill.crateDeduction.toLocaleString('en-IN')}</span>
              </div>
            ` : ''}
            ${bill.advanceDeduction > 0 ? `
              <div class="flex justify-between text-black/80">
                <span>DIESEL / CASH ADVANCE:</span>
                <span>-₹${bill.advanceDeduction.toLocaleString('en-IN')}</span>
              </div>
            ` : ''}
            <div class="flex justify-between font-bold text-sm pt-1 border-t border-black/40">
              <span>NET CASH PAID:</span>
              <span>₹${bill.grandTotal.toLocaleString('en-IN')}</span>
            </div>
            <div class="text-[10px] text-left text-black/70 mt-1">
              Method: ${bill.paymentMethod} • Status: ${bill.status}
            </div>
          </div>

          <!-- Footer Signature -->
          <div class="pt-2 text-[10px] flex flex-col items-center gap-4">
            <div class="w-full flex justify-between pt-4">
              <span>Counter Cashier</span>
              <span>Boat Master / Fisherman</span>
            </div>
            <p class="text-[9px] uppercase tracking-wider italic">Marlin Sea Food Harbor System &bull; Keep Dock Clean</p>
          </div>
        </div>
      </div>

      <!-- Close Action -->
      <div class="flex items-center justify-end pt-2">
        <button id="dismiss-modal-btn" class="w-full py-2.5 rounded-lg bg-primary-container text-white font-semibold text-sm hover:bg-primary transition-all">
          Done / Next Bill
        </button>
      </div>
    </div>
  `;

  container.appendChild(modalOverlay);

  const close = () => modalOverlay.remove();
  modalOverlay.querySelector('#close-receipt-btn').addEventListener('click', close);
  modalOverlay.querySelector('#dismiss-modal-btn').addEventListener('click', close);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) close();
  });

  // Print button
  modalOverlay.querySelector('#print-slip-btn').addEventListener('click', () => {
    window.print();
  });

  // WhatsApp button
  modalOverlay.querySelector('#whatsapp-slip-btn').addEventListener('click', () => {
    close();
    openWhatsAppModal({
      name: bill.fishermanName,
      phone: bill.mobile || '+91 98401 23456',
      billId: bill.id,
      date: bill.date,
      items: bill.items,
      totalKg: bill.totalKg,
      grandTotal: bill.grandTotal,
      type: 'Purchase'
    });
  });

  // PDF download simulation
  modalOverlay.querySelector('#pdf-slip-btn').addEventListener('click', () => {
    showToast(`PDF for ${bill.id} generated and sent to downloads.`);
  });
}
