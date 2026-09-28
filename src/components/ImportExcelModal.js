// ImportExcelModal Component for Fishermen
import { store } from '../state/store.js';
import { showToast } from './Toast.js';

export function openImportExcelModal(onSuccess = null) {
  const container = document.getElementById('modal-root');
  if (!container) return;

  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'import-excel-modal';
  modalOverlay.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary-container/60 backdrop-blur-sm animate-fade-in';

  modalOverlay.innerHTML = `
    <div class="bg-surface-container-lowest w-full max-w-lg rounded-xl border border-outline-variant shadow-2xl p-space-lg animate-slide-up flex flex-col gap-space-md">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-outline-variant/60 pb-3">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-secondary text-[22px]">upload_file</span>
          <h2 class="font-title-lg text-title-lg text-primary font-bold">Import Fishermen</h2>
        </div>
        <button id="close-import-btn" class="p-1 rounded-md text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      <!-- Sample Template Download -->
      <div class="flex items-center justify-between p-3 bg-surface-container-low rounded-lg border border-outline-variant/40">
        <div class="flex items-center gap-2 text-xs text-on-surface">
          <span class="material-symbols-outlined text-secondary-marine text-[18px]">table_view</span>
          <span>Standard format: <b>Name, Country Code, Mobile Number, Boat</b></span>
        </div>
        <button id="download-template-btn" class="text-xs text-secondary-marine font-semibold hover:underline flex items-center gap-1">
          <span class="material-symbols-outlined text-[14px]">download</span>
          Download Template
        </button>
      </div>

      <!-- Drop Zone -->
      <div id="drop-zone" class="border-2 border-dashed border-outline-variant hover:border-secondary-marine rounded-xl p-8 flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition-colors bg-surface-container-low/40">
        <span class="material-symbols-outlined text-[40px] text-secondary">cloud_upload</span>
        <p class="text-sm font-semibold text-primary">Drag & drop your Excel or CSV file here</p>
        <p class="text-xs text-outline">Supports .xlsx, .xls, .csv files up to 5MB</p>
        <label class="mt-2 px-4 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-primary cursor-pointer border border-outline-variant">
          Browse File
          <input type="file" id="file-input" accept=".csv,.xlsx,.xls" class="hidden" />
        </label>
      </div>

      <!-- File Status Preview (Hidden until file selected) -->
      <div id="file-preview-card" class="hidden flex flex-col gap-2 p-3 bg-secondary-container/20 border border-secondary/30 rounded-lg">
        <div class="flex items-center justify-between text-xs">
          <span class="font-semibold text-primary" id="preview-filename">fishermen_list_2026.csv</span>
          <span class="text-secondary font-bold" id="preview-record-count">12 Records Detected</span>
        </div>
        <div class="grid grid-cols-4 gap-2 pt-1 text-center text-[11px]">
          <div class="p-1 rounded bg-white border border-outline-variant">
            <span class="block text-outline">Total</span>
            <span class="font-bold text-primary" id="stat-total">12</span>
          </div>
          <div class="p-1 rounded bg-profit-bg border border-profit/30">
            <span class="block text-profit">Ready</span>
            <span class="font-bold text-profit" id="stat-ready">12</span>
          </div>
          <div class="p-1 rounded bg-warning-bg border border-warning/30">
            <span class="block text-warning">Updated</span>
            <span class="font-bold text-warning" id="stat-updated">0</span>
          </div>
          <div class="p-1 rounded bg-hazard-bg border border-hazard/30">
            <span class="block text-hazard">Skipped</span>
            <span class="font-bold text-hazard" id="stat-skipped">0</span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/60">
        <button id="cancel-import-btn" class="px-4 py-2 rounded-lg border border-outline-variant text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors">
          Cancel
        </button>
        <button id="execute-import-btn" disabled class="px-5 py-2 rounded-lg bg-primary-container text-on-primary opacity-50 cursor-not-allowed text-sm font-semibold shadow-sm transition-all">
          Import Records
        </button>
      </div>
    </div>
  `;

  container.appendChild(modalOverlay);

  const close = () => modalOverlay.remove();
  modalOverlay.querySelector('#close-import-btn').addEventListener('click', close);
  modalOverlay.querySelector('#cancel-import-btn').addEventListener('click', close);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) close();
  });

  // Template download trigger
  modalOverlay.querySelector('#download-template-btn').addEventListener('click', () => {
    const csvContent = "data:text/csv;charset=utf-8,Name,CountryCode,MobileNumber,BoatName\nMurugan M.,+91,9840123456,TN-02-F-4412\nAntony Doss,+91,9840234567,TN-02-F-8819\nKumaravel K.,+91,9840345678,TN-01-F-1204\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Marlin_Fishermen_Sample_Template.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast("Sample CSV template downloaded.");
  });

  // File Select Simulation
  const fileInput = modalOverlay.querySelector('#file-input');
  const previewCard = modalOverlay.querySelector('#file-preview-card');
  const executeBtn = modalOverlay.querySelector('#execute-import-btn');

  const mockLoadedList = [
    { name: 'Kasinathan T.', countryCode: '+91', mobile: '9840611223', boatName: 'TN-02-F-1102 (Vallam)' },
    { name: 'Susaipillai M.', countryCode: '+91', mobile: '9840622334', boatName: 'TN-02-F-5541 (Fiber)' },
    { name: 'Manickam V.', countryCode: '+91', mobile: '9840633445', boatName: 'TN-01-F-9090 (Trawler)' },
    { name: 'Francis Xavier', countryCode: '+91', mobile: '9840644556', boatName: 'TN-02-F-7712 (Country)' },
    { name: 'Baskaran R.', countryCode: '+91', mobile: '9840655667', boatName: 'TN-02-F-3321 (Vallam)' }
  ];

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      modalOverlay.querySelector('#preview-filename').textContent = file.name;
      modalOverlay.querySelector('#preview-record-count').textContent = `${mockLoadedList.length} Valid Records`;
      modalOverlay.querySelector('#stat-total').textContent = mockLoadedList.length;
      modalOverlay.querySelector('#stat-ready').textContent = mockLoadedList.length;
      previewCard.classList.remove('hidden');
      executeBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      executeBtn.removeAttribute('disabled');
      executeBtn.classList.add('hover:bg-primary', 'active:scale-95');
    }
  });

  executeBtn.addEventListener('click', () => {
    const importedCount = store.importFishermen(mockLoadedList);
    showToast(`Successfully imported ${importedCount} fishermen into registry.`);
    close();
    if (onSuccess) onSuccess();
  });
}
