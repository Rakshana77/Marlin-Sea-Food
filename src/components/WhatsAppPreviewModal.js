// WhatsAppPreviewModal Component
import { showToast } from './Toast.js';

export function openWhatsAppModal(data) {
  const container = document.getElementById('modal-root');
  if (!container) return;

  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'whatsapp-modal';
  modalOverlay.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary-container/70 backdrop-blur-sm animate-fade-in';

  // Format pre-filled WhatsApp message text
  const cleanPhone = (data.phone || '9840123456').replace(/[^0-9]/g, '');
  const itemsText = data.items ? data.items.map(item => 
    `• ${item.speciesName}: ${item.netKg.toFixed(1)} KG @ ₹${item.rate} = ₹${item.amount.toLocaleString('en-IN')}`
  ).join('\n') : '';

  const messageText = `🐟 *MARLIN SEA FOOD — ${data.type === 'Export' ? 'EXPORT INVOICE' : 'PURCHASE RECEIPT'}*
────────────────────
📄 *Bill No:* ${data.billId}
📅 *Date:* ${data.date}
👤 *To:* ${data.name}

*CATCH & LOT DETAILS:*
${itemsText}
────────────────────
⚖️ *Total Net Weight:* ${data.totalKg.toFixed(1)} KG
💵 *GRAND TOTAL:* *₹${data.grandTotal.toLocaleString('en-IN')}*

_Thank you for trading with Marlin Sea Food!_
📍 Harbor Wharf Terminal 04, Chennai Fishing Harbour`;

  const encodedUrl = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${encodeURIComponent(messageText)}`;

  modalOverlay.innerHTML = `
    <div class="bg-surface-container-lowest w-full max-w-lg rounded-xl border border-outline-variant shadow-2xl p-space-lg animate-slide-up flex flex-col gap-space-md">
      <!-- Modal Header -->
      <div class="flex items-center justify-between border-b border-outline-variant/60 pb-3">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white">
            <span class="material-symbols-outlined text-[20px]">chat</span>
          </div>
          <div>
            <h2 class="font-title-lg text-title-lg text-primary font-bold">WhatsApp Dispatch</h2>
            <p class="text-xs text-on-surface-variant font-mono">Recipient: ${data.name} (${data.phone})</p>
          </div>
        </div>
        <button id="close-wa-btn" class="p-1 rounded-md text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      <!-- Message Text Area Preview -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-on-surface-variant flex items-center justify-between">
          <span>Pre-filled WhatsApp Message:</span>
          <button id="copy-wa-btn" class="text-secondary-marine hover:underline flex items-center gap-1 font-semibold text-xs">
            <span class="material-symbols-outlined text-[14px]">content_copy</span>
            Copy Text
          </button>
        </label>
        <textarea 
          id="wa-text-area"
          rows="10" 
          readonly 
          class="w-full p-3 bg-surface-container-low border border-outline-variant rounded-lg font-mono text-xs text-on-surface select-all focus:outline-none"
        >${messageText}</textarea>
      </div>

      <!-- Action Footer -->
      <div class="flex items-center justify-between pt-2 border-t border-outline-variant/60">
        <button id="cancel-wa-btn" class="px-4 py-2 rounded-lg border border-outline-variant text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors">
          Cancel
        </button>

        <a 
          id="send-wa-link"
          href="${encodedUrl}" 
          target="_blank" 
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition-all active:scale-95"
        >
          <span class="material-symbols-outlined text-[18px]">send</span>
          <span>Open WhatsApp Chat</span>
        </a>
      </div>
    </div>
  `;

  container.appendChild(modalOverlay);

  const close = () => modalOverlay.remove();
  modalOverlay.querySelector('#close-wa-btn').addEventListener('click', close);
  modalOverlay.querySelector('#cancel-wa-btn').addEventListener('click', close);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) close();
  });

  // Copy button
  modalOverlay.querySelector('#copy-wa-btn').addEventListener('click', () => {
    const text = modalOverlay.querySelector('#wa-text-area').value;
    navigator.clipboard.writeText(text);
    showToast("WhatsApp message copied to clipboard.");
  });

  modalOverlay.querySelector('#send-wa-link').addEventListener('click', () => {
    showToast("WhatsApp message prepared successfully.");
    setTimeout(close, 500);
  });
}
