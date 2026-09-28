// AddFishermanModal Component - Ultra-Fast 3-Field Entry
import { store } from '../state/store.js';
import { showToast } from './Toast.js';

export function openAddFishermanModal(onSuccess = null) {
  const container = document.getElementById('modal-root');
  if (!container) return;

  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'add-fisherman-modal';
  modalOverlay.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary-container/60 backdrop-blur-sm animate-fade-in';

  modalOverlay.innerHTML = `
    <div class="bg-surface-container-lowest w-full max-w-md rounded-xl border border-outline-variant shadow-2xl p-space-lg animate-slide-up flex flex-col gap-space-md">
      <!-- Modal Header -->
      <div class="flex items-center justify-between border-b border-outline-variant/60 pb-3">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-secondary text-[22px]">person_add</span>
          <h2 class="font-title-lg text-title-lg text-primary font-bold">Add Fisherman</h2>
        </div>
        <button id="close-modal-btn" class="p-1 rounded-md text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      <!-- Quick Fast Entry Notice -->
      <p class="text-xs text-on-surface-variant">
        Enter primary contact details for immediate procurement. Banking and identity documents can be added later.
      </p>

      <!-- Fast Form -->
      <form id="add-fisherman-form" class="flex flex-col gap-space-md">
        <div>
          <label class="block text-xs font-semibold text-on-surface mb-1" for="fisherman-name">
            Fisherman Name <span class="text-error">*</span>
          </label>
          <input 
            type="text" 
            id="fisherman-name" 
            required 
            placeholder="e.g. Murugan M." 
            class="w-full h-10 px-3 bg-surface-container-low focus:bg-white border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary-marine transition-all"
            autofocus
          />
        </div>

        <div class="grid grid-cols-3 gap-2">
          <div>
            <label class="block text-xs font-semibold text-on-surface mb-1" for="country-code">
              Code <span class="text-error">*</span>
            </label>
            <select 
              id="country-code" 
              class="w-full h-10 px-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary-marine transition-all"
            >
              <option value="+91" selected>+91 (IN)</option>
              <option value="+94">+94 (LK)</option>
              <option value="+960">+960 (MV)</option>
            </select>
          </div>
          <div class="col-span-2">
            <label class="block text-xs font-semibold text-on-surface mb-1" for="mobile-number">
              Mobile Number <span class="text-error">*</span>
            </label>
            <input 
              type="tel" 
              id="mobile-number" 
              required 
              placeholder="10-digit mobile" 
              pattern="[0-9]{10}"
              class="w-full h-10 px-3 bg-surface-container-low focus:bg-white border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary-marine transition-all"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-on-surface mb-1" for="boat-name">
            Boat Name / Registration No. <span class="text-outline font-normal">(Optional)</span>
          </label>
          <input 
            type="text" 
            id="boat-name" 
            placeholder="e.g. TN-02-F-4412 (Fiber Vallam)" 
            class="w-full h-10 px-3 bg-surface-container-low focus:bg-white border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary-marine transition-all"
          />
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/60">
          <button 
            type="button" 
            id="cancel-modal-btn"
            class="px-4 py-2 rounded-lg border border-outline-variant text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            class="px-5 py-2 rounded-lg bg-primary-container text-on-primary hover:bg-primary text-sm font-semibold shadow-sm transition-all active:scale-95"
          >
            Save Fisherman
          </button>
        </div>
      </form>
    </div>
  `;

  container.appendChild(modalOverlay);

  const close = () => modalOverlay.remove();
  modalOverlay.querySelector('#close-modal-btn').addEventListener('click', close);
  modalOverlay.querySelector('#cancel-modal-btn').addEventListener('click', close);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) close();
  });

  const form = modalOverlay.querySelector('#add-fisherman-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = modalOverlay.querySelector('#fisherman-name').value;
    const countryCode = modalOverlay.querySelector('#country-code').value;
    const mobile = modalOverlay.querySelector('#mobile-number').value;
    const boatName = modalOverlay.querySelector('#boat-name').value;

    const newFisherman = store.addFisherman({ name, countryCode, mobile, boatName });
    showToast(`Fisherman "${name}" registered successfully.`);
    close();
    if (onSuccess) onSuccess(newFisherman);
  });
}
