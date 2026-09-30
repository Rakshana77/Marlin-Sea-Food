// PosReceiptModal Component - 80mm ESC/POS Thermal Receipt for POS Sales
import { showToast } from './Toast.js';

export function openPosReceiptModal(sale, onNewSale) {
  const container = document.getElementById('modal-root') || document.body;

  // Remove existing receipt modal if present
  const existing = document.getElementById('pos-receipt-modal');
  if (existing) existing.remove();

  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'pos-receipt-modal';
  modalOverlay.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary-container/80 backdrop-blur-sm animate-fade-in select-none';

  const waText = encodeURIComponent(
    `*MARLIN SEA FOOD - RETAIL RECEIPT*\n` +
    `Invoice: ${sale.invoiceNumber}\n` +
    `Date: ${sale.saleDate}\n` +
    `Customer: ${sale.customer?.name || 'Walk-in Customer'}\n` +
    `--------------------------------\n` +
    sale.items.map(it => `${it.seafood?.name || 'Item'} (${it.grade?.name || 'A'}): ${it.quantityKg} KG @ ₹${it.sellingRate} = ₹${it.amount}`).join('\n') +
    `\n--------------------------------\n` +
    `Total Weight: ${sale.totalKg} KG\n` +
    `Gross Subtotal: ₹${sale.subtotal}\n` +
    (parseFloat(sale.discount) > 0 ? `Discount: -₹${sale.discount}\n` : '') +
    `*NET PAYABLE: ₹${sale.grandTotal}*\n` +
    `Payment: ${sale.payments?.[0]?.paymentMethod || 'CASH'} (${sale.paymentStatus})\n` +
    (parseFloat(sale.changeAmount) > 0 ? `Change Returned: ₹${sale.changeAmount}\n` : '') +
    `Thank you for shopping at Marlin Sea Food!`
  );

  const customerMobile = sale.customer?.mobileNumber && sale.customer.mobileNumber !== '0000000000'
    ? sale.customer.mobileNumber
    : '';

  const waUrl = customerMobile 
    ? `https://wa.me/91${customerMobile}?text=${waText}` 
    : `https://wa.me/?text=${waText}`;

  modalOverlay.innerHTML = `
    <div class="bg-surface-container-lowest w-full max-w-md rounded-2xl border border-outline-variant shadow-2xl p-space-md animate-slide-up flex flex-col gap-space-sm max-h-[92vh] overflow-y-auto">
      <!-- Modal Header -->
      <div class="flex items-center justify-between border-b border-outline-variant/60 pb-2">
        <div class="flex items-center gap-2">
          <span class="p-1.5 rounded-lg bg-secondary/15 text-secondary flex items-center justify-center">
            <span class="material-symbols-outlined text-[22px]">check_circle</span>
          </span>
          <div>
            <h2 class="font-title-lg text-title-lg text-primary font-bold">Sale Completed</h2>
            <p class="text-xs text-on-surface-variant font-mono font-medium">${sale.invoiceNumber} &bull; ${sale.saleDate}</p>
          </div>
        </div>
        <button id="close-pos-receipt-btn" class="p-1 rounded-md text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      <!-- Action Buttons -->
      <div class="grid grid-cols-3 gap-2">
        <button id="print-pos-slip-btn" class="flex flex-col items-center justify-center p-2 rounded-xl bg-primary text-white hover:bg-primary-container transition-all active:scale-95 shadow-sm">
          <span class="material-symbols-outlined text-[20px] text-secondary-fixed">print</span>
          <span class="text-xs font-semibold mt-0.5">Print Slip</span>
        </button>

        <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="flex flex-col items-center justify-center p-2 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 transition-all active:scale-95 shadow-sm text-center">
          <span class="material-symbols-outlined text-[20px]">chat</span>
          <span class="text-xs font-semibold mt-0.5">WhatsApp</span>
        </a>

        <button id="new-pos-sale-btn" class="flex flex-col items-center justify-center p-2 rounded-xl bg-secondary text-white hover:opacity-90 transition-all active:scale-95 shadow-sm">
          <span class="material-symbols-outlined text-[20px]">add_shopping_cart</span>
          <span class="text-xs font-semibold mt-0.5">New Sale</span>
        </button>
      </div>

      <!-- 80mm ESC/POS Thermal Paper Simulation -->
      <div class="bg-white border-2 border-dashed border-outline-variant/80 rounded-xl p-4 font-mono text-xs text-black shadow-inner flex flex-col items-center">
        <div id="pos-thermal-print-area" class="w-full max-w-[76mm] text-center">
          <div class="border-b border-black pb-2 mb-2">
            <h3 class="font-bold text-sm tracking-tight">MARLIN SEA FOOD</h3>
            <p class="text-[10px]">Harbor Terminal Retail Counter A</p>
            <p class="text-[10px]">North Slipway, Chennai Port</p>
            <p class="text-[10px]">Ph: +91 98401 22345 | Retail POS #01</p>
          </div>

          <div class="text-left text-[11px] mb-2 border-b border-black/40 pb-2 flex flex-col gap-0.5">
            <div class="flex justify-between">
              <span><b>INVOICE:</b> ${sale.invoiceNumber}</span>
              <span><b>DATE:</b> ${sale.saleDate}</span>
            </div>
            <div class="flex justify-between">
              <span><b>CUSTOMER:</b> ${sale.customer?.name || 'Walk-in Customer'}</span>
              <span><b>TIER:</b> Retail</span>
            </div>
            ${customerMobile ? `<div><span><b>MOBILE:</b> +91 ${customerMobile}</span></div>` : ''}
          </div>

          <!-- Items Table -->
          <table class="w-full text-[11px] text-left border-collapse mb-2">
            <thead>
              <tr class="border-b border-black text-[10px] uppercase font-bold">
                <th class="py-1">SPECIES & GRADE</th>
                <th class="py-1 text-center">KG</th>
                <th class="py-1 text-right">RATE</th>
                <th class="py-1 text-right">AMT</th>
              </tr>
            </thead>
            <tbody>
              ${sale.items.map(item => `
                <tr class="border-b border-black/10">
                  <td class="py-1 leading-tight">
                    <span class="font-bold">${item.seafood?.name || 'Seafood'}</span>
                    <span class="text-[9px] text-gray-700 block">${item.grade?.name || 'Grade A'}</span>
                  </td>
                  <td class="py-1 text-center font-bold">${item.quantityKg}</td>
                  <td class="py-1 text-right">₹${item.sellingRate}</td>
                  <td class="py-1 text-right font-bold">₹${item.amount}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Financial Calculation Breakdown -->
          <div class="text-[11px] border-t border-black pt-1 flex flex-col gap-1">
            <div class="flex justify-between">
              <span>Total Landed Weight:</span>
              <span class="font-bold">${sale.totalKg} KG</span>
            </div>
            <div class="flex justify-between">
              <span>Gross Subtotal:</span>
              <span>₹${sale.subtotal}</span>
            </div>
            ${parseFloat(sale.discount) > 0 ? `
              <div class="flex justify-between text-red-600">
                <span>Special Promo Discount:</span>
                <span>-₹${sale.discount}</span>
              </div>
            ` : ''}
            <div class="flex justify-between border-t border-black pt-1 font-bold text-sm">
              <span>NET PAYABLE:</span>
              <span>₹${sale.grandTotal}</span>
            </div>
            <div class="flex justify-between text-[10px] text-gray-700">
              <span>Settlement Method:</span>
              <span class="font-bold uppercase">${sale.payments?.[0]?.paymentMethod || 'CASH'} (${sale.paymentStatus})</span>
            </div>
            ${parseFloat(sale.paidAmount) > 0 ? `
              <div class="flex justify-between">
                <span>Amount Tendered:</span>
                <span>₹${(parseFloat(sale.paidAmount) + parseFloat(sale.changeAmount || 0)).toFixed(2)}</span>
              </div>
            ` : ''}
            ${parseFloat(sale.changeAmount) > 0 ? `
              <div class="flex justify-between border-t border-dashed border-black/30 pt-1 font-bold text-emerald-800">
                <span>CHANGE RETURNED:</span>
                <span>₹${sale.changeAmount}</span>
              </div>
            ` : ''}
          </div>

          <div class="border-t border-black mt-3 pt-2 text-[9px] text-center text-gray-600">
            <p>Thank you for choosing Marlin Sea Food!</p>
            <p>Fresh Harbour Catch Guaranteed &bull; GST Exempted</p>
          </div>
        </div>
      </div>
    </div>
  `;

  container.appendChild(modalOverlay);

  // Bind Events
  const closeBtn = modalOverlay.querySelector('#close-pos-receipt-btn');
  const printBtn = modalOverlay.querySelector('#print-pos-slip-btn');
  const newSaleBtn = modalOverlay.querySelector('#new-pos-sale-btn');

  closeBtn?.addEventListener('click', () => modalOverlay.remove());

  printBtn?.addEventListener('click', () => {
    window.print();
    showToast('Thermal slip sent to printer');
  });

  newSaleBtn?.addEventListener('click', () => {
    modalOverlay.remove();
    if (onNewSale) onNewSale();
  });

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) modalOverlay.remove();
  });
}