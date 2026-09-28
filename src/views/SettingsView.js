// SettingsView Component - Hardware, Harbor Terminal & Company Profile
import { store } from '../state/store.js';
import { showToast } from '../components/Toast.js';

export function renderSettingsView() {
  const state = store.getState();
  const s = state.settings;

  return `
    <div class="flex flex-col gap-space-md w-full max-w-[1200px] mx-auto pb-24 animate-fade-in select-none">
      
      <!-- Top Header -->
      <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div>
          <h1 class="font-headline-md text-headline-md text-primary font-bold tracking-tight">System & Hardware Configuration</h1>
          <p class="text-xs text-on-surface-variant font-mono">
            Terminal #WS-409 • Slipway Weigh Station 03 • Harbor Profile
          </p>
        </div>

        <button id="save-settings-btn" class="px-5 py-2 rounded-lg bg-primary text-white font-semibold text-xs shadow-sm hover:bg-primary-container active:scale-95 transition-all flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[16px] text-secondary-fixed">save</span>
          <span>Save Settings</span>
        </button>
      </div>

      <!-- Settings Sections Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-space-md">
        
        <!-- Business Profile -->
        <div class="bg-surface-container-lowest p-space-lg rounded-xl border border-outline-variant/60 shadow-sm flex flex-col gap-space-sm">
          <h3 class="font-title-md text-title-md text-primary font-bold border-b border-outline-variant/60 pb-2">Business Profile & Tax</h3>
          
          <div>
            <label class="block text-xs font-semibold text-on-surface mb-1">Company Trading Name</label>
            <input type="text" value="${s.companyName}" class="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant text-sm font-semibold text-primary" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-on-surface mb-1">Tagline / Subheading</label>
            <input type="text" value="${s.tagline}" class="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant text-xs text-on-surface" />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs font-semibold text-on-surface mb-1">GSTIN Number</label>
              <input type="text" value="${s.gstin}" class="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant text-xs font-mono font-bold text-primary" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-on-surface mb-1">FSSAI License</label>
              <input type="text" value="${s.fssai}" class="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant text-xs font-mono text-primary" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-on-surface mb-1">Wharf Station Address</label>
            <input type="text" value="${s.wharfStation}, ${s.harborCity}" class="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant text-xs text-on-surface" />
          </div>
        </div>

        <!-- Terminal & Hardware -->
        <div class="bg-surface-container-lowest p-space-lg rounded-xl border border-outline-variant/60 shadow-sm flex flex-col gap-space-sm">
          <h3 class="font-title-md text-title-md text-primary font-bold border-b border-outline-variant/60 pb-2">Counter Hardware & Scales</h3>

          <div>
            <label class="block text-xs font-semibold text-on-surface mb-1">Thermal Receipt Printer Format</label>
            <select class="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant text-xs font-semibold text-primary">
              <option value="80mm" selected>80mm ESC/POS Thermal Paper Roll (Standard)</option>
              <option value="58mm">58mm Mobile Bluetooth Thermal Slip</option>
              <option value="A4">Standard A4 Laser Voucher</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-on-surface mb-1">Digital Weigh Scale Interface</label>
            <div class="flex items-center gap-2">
              <input type="text" value="${s.scalePort}" class="flex-1 h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant text-xs font-mono font-bold text-primary" />
              <button type="button" class="px-3 h-10 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-primary border border-outline-variant">
                Test Ping
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs font-semibold text-on-surface mb-1">Default Currency</label>
              <input type="text" value="${s.currency} Indian Rupee" readonly class="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant text-xs font-semibold text-primary" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-on-surface mb-1">Weight Unit</label>
              <input type="text" value="${s.weightUnit} Metric Kilogram" readonly class="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant text-xs font-semibold text-primary" />
            </div>
          </div>

          <div class="pt-2">
            <div class="p-3 bg-profit-bg/40 border border-profit/30 rounded-lg flex items-center justify-between text-xs">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-profit text-[18px]">cloud_sync</span>
                <span class="font-medium text-profit">Auto-Cloud Synchronization</span>
              </div>
              <span class="font-mono text-profit font-bold">ACTIVE (0.4s sync)</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;
}

export function bindSettingsEvents() {
  const container = document.getElementById('app');
  if (!container) return;

  const saveBtn = container.querySelector('#save-settings-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      showToast("Terminal configuration saved successfully.", "success");
    });
  }
}
