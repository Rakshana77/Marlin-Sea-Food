// PosView Component - Marlin Sea Food Operational POS Terminal (Stitch Design Single Source of Truth)
import { store } from '../state/store.js';
import { openPosReceiptModal } from '../components/PosReceiptModal.js';
import { openPosCustomerModal } from '../components/PosCustomerModal.js';
import { showToast } from '../components/Toast.js';

// Robust API fetch helper: tries /api first, falls back to port 5000 if dev proxy is inactive
export async function posApiFetch(url, options = {}) {
  let path = url;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const parsed = new URL(url);
      path = parsed.pathname + parsed.search;
    } catch (e) {
      path = url;
    }
  }

  try {
    const res = await fetch(url, options);
    // If Vite dev server returned 404 or an HTML page, fall back to direct port 5000
    if (res.status !== 404 && !res.headers.get('content-type')?.includes('text/html')) {
      return res;
    }
  } catch (err) {
    // Relative fetch failed or network error
  }

  const directUrl = `http://localhost:5000${path.startsWith('/') ? '' : '/'}${path}`;
  return await fetch(directUrl, options);
}

// Local temporary POS state
let posState = {
  orderNumber: 'ORD-8821',
  searchQuery: '',
  selectedCategory: 'all',
  activeItem: null,
  activeWeight: '2.750',
  manifest: [
    {
      id: 'item-1',
      seafoodId: 'b01930bf-6a18-4cfb-b1d1-3ce759f90eff',
      seafoodName: 'Squid (Grade A)',
      gradeId: 'a1ba4960-e047-4ed7-8ed4-393c470aeb59',
      gradeName: 'Grade A',
      quantityKg: '2.750',
      sellingRate: '470.00',
      amount: '1292.50'
    },
    {
      id: 'item-2',
      seafoodId: '5fce3e40-c261-4895-a93f-4819ffbde7d0',
      seafoodName: 'Blue Sea Crab (Live)',
      gradeId: 'a1ba4960-e047-4ed7-8ed4-393c470aeb59',
      gradeName: 'Grade A Live',
      quantityKg: '1.500',
      sellingRate: '700.00',
      amount: '1050.00'
    }
  ],
  customer: {
    id: 'walk-in',
    name: 'Walk-in Counter Customer',
    tier: 'Cash Retail Tier-1',
    mobile: ''
  },
  discount: '100.00',
  paymentMethod: 'CASH',
  tenderedCashPreset: '2500.00',
  customCashReceived: '2500.00',
  isSubmitting: false,
  autoCutSlip: true,
  autoWhatsApp: true,
  // Telemetry aggregates
  todaySales: 42850.00,
  billedVolume: 94.200,
  ticketsCount: 18
};

// Default catalog based on Stitch design specifications
const defaultCatalog = [
  {
    id: 'squid-a',
    seafoodId: 'squid',
    name: 'Squid (Grade A)',
    scientific: 'Loligo Vulgaris',
    category: 'squid',
    lot: 'SQ-901',
    grade: 'Grade A',
    availableKg: '125.0',
    sellingRate: '470.00',
    status: 'AVAILABLE'
  },
  {
    id: 'crab-a',
    seafoodId: 'crab',
    name: 'Blue Sea Crab (Live)',
    scientific: 'Portunus pelagicus',
    category: 'crab',
    lot: 'CR-04',
    grade: 'Grade A Tank',
    availableKg: '42.5',
    sellingRate: '700.00',
    status: 'AVAILABLE'
  },
  {
    id: 'prawn-tiger',
    seafoodId: 'prawn',
    name: 'Tiger Prawn (10/20)',
    scientific: 'Penaeus monodon',
    category: 'prawn',
    lot: 'TP-10',
    grade: 'Deep Sea Catch',
    availableKg: '8.2',
    sellingRate: '650.00',
    status: 'LOW_STOCK'
  },
  {
    id: 'kingfish-surmai',
    seafoodId: 'kingfish',
    name: 'King Fish / Surmai',
    scientific: 'Scomberomorus commerson',
    category: 'fish',
    lot: 'KF-12',
    grade: 'Steak Cut Whole',
    availableKg: '31.0',
    sellingRate: '850.00',
    status: 'AVAILABLE'
  },
  {
    id: 'white-prawn',
    seafoodId: 'white-prawn',
    name: 'White Prawn (Vannamei)',
    scientific: 'Litopenaeus vannamei',
    category: 'prawn',
    lot: 'WP-02',
    grade: 'Medium 40/50',
    availableKg: '64.0',
    sellingRate: '440.00',
    status: 'AVAILABLE'
  },
  {
    id: 'lobster',
    seafoodId: 'lobster',
    name: 'Rock Lobster (Prime)',
    scientific: 'Panulirus homarus',
    category: 'crab',
    lot: 'RL-01',
    grade: 'Harbor Reserve',
    availableKg: '0.0',
    sellingRate: '1700.00',
    status: 'SOLD_OUT'
  },
  {
    id: 'octopus',
    seafoodId: 'octopus',
    name: 'Octopus (Baby Whole)',
    scientific: 'Octopus vulgaris',
    category: 'squid',
    lot: 'OC-09',
    grade: 'Cured Fresh',
    availableKg: '18.5',
    sellingRate: '330.00',
    status: 'AVAILABLE'
  },
  {
    id: 'cuttlefish',
    seafoodId: 'cuttlefish',
    name: 'Cuttlefish (Sepia)',
    scientific: 'Sepia officinalis',
    category: 'squid',
    lot: 'CF-16',
    grade: 'Cleaned White',
    availableKg: '22.0',
    sellingRate: '410.00',
    status: 'AVAILABLE'
  }
];

if (!posState.activeItem) {
  posState.activeItem = defaultCatalog[0];
}

let hasSyncedLiveCatalog = false;

export async function syncLivePosData(onUpdate) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [seafoodRes, ratesRes, stockRes, salesRes] = await Promise.all([
      posApiFetch('/api/seafood?limit=100').then(r => r.ok ? r.json() : null).catch(() => null),
      posApiFetch(`/api/daily-rates?status=PUBLISHED&limit=100`).then(r => r.ok ? r.json() : null).catch(() => null),
      posApiFetch('/api/stock?limit=100').then(r => r.ok ? r.json() : null).catch(() => null),
      posApiFetch(`/api/sales?date=${today}&limit=100`).then(r => r.ok ? r.json() : null).catch(() => null)
    ]);

    if (salesRes?.data?.items && salesRes.data.items.length > 0) {
      let salesSum = 0;
      let volSum = 0;
      for (const s of salesRes.data.items) {
        salesSum += parseFloat(s.grandTotal || 0);
        volSum += parseFloat(s.totalKg || 0);
      }
      posState.todaySales = salesSum;
      posState.billedVolume = volSum;
      posState.ticketsCount = salesRes.data.total || salesRes.data.items.length;
    }

    if (seafoodRes?.data && seafoodRes.data.length > 0 && ratesRes?.data?.items) {
      const ratesList = ratesRes.data.items;
      const stockList = stockRes?.data?.items || [];

      const newCatalog = [];
      for (const sf of seafoodRes.data) {
        const matchingRates = ratesList.filter(r => r.seafoodId === sf.id);
        if (matchingRates.length === 0) {
          const stockObj = stockList.find(s => s.seafoodId === sf.id);
          const available = stockObj ? parseFloat(stockObj.quantityKg) : 0;
          newCatalog.push({
            id: `${sf.id}-none`,
            seafoodId: sf.id,
            name: sf.name,
            scientific: sf.category?.name || 'Seafood',
            category: (sf.category?.name || 'fish').toLowerCase().includes('prawn') ? 'prawn' :
                      (sf.category?.name || '').toLowerCase().includes('crab') ? 'crab' :
                      (sf.category?.name || '').toLowerCase().includes('squid') ? 'squid' : 'fish',
            lot: `LOT-${sf.name.slice(0, 2).toUpperCase()}-01`,
            grade: 'Grade A',
            gradeId: '',
            availableKg: available.toFixed(1),
            sellingRate: null,
            status: 'RATE_UNAVAILABLE'
          });
        } else {
          for (const rateObj of matchingRates) {
            const stockObj = stockList.find(s => s.seafoodId === sf.id && s.gradeId === rateObj.gradeId);
            const available = stockObj ? parseFloat(stockObj.quantityKg) : 0;
            let status = 'AVAILABLE';
            if (available <= 0) {
              status = 'SOLD_OUT';
            } else if (available < 10) {
              status = 'LOW_STOCK';
            }

            newCatalog.push({
              id: `${sf.id}-${rateObj.gradeId}`,
              seafoodId: sf.id,
              name: `${sf.name}`,
              scientific: sf.category?.name || 'Seafood',
              category: (sf.category?.name || 'fish').toLowerCase().includes('prawn') ? 'prawn' :
                        (sf.category?.name || '').toLowerCase().includes('crab') ? 'crab' :
                        (sf.category?.name || '').toLowerCase().includes('squid') ? 'squid' : 'fish',
              lot: `LOT-${sf.name.slice(0, 2).toUpperCase()}-01`,
              grade: rateObj.grade?.name || 'Grade A',
              gradeId: rateObj.gradeId,
              availableKg: available.toFixed(1),
              sellingRate: parseFloat(rateObj.sellingRate).toFixed(2),
              status
            });
          }
        }
      }

      if (newCatalog.length > 0) {
        defaultCatalog.length = 0;
        defaultCatalog.push(...newCatalog);
        if (!posState.activeItem || !defaultCatalog.find(i => i.id === posState.activeItem.id)) {
          posState.activeItem = defaultCatalog.find(i => i.status !== 'SOLD_OUT' && i.status !== 'RATE_UNAVAILABLE') || defaultCatalog[0];
        }

        // Keep manifest items synchronized with live catalog UUIDs & rates
        posState.manifest = posState.manifest.map(m => {
          const matched = newCatalog.find(c => 
            c.seafoodId === m.seafoodId ||
            c.name.toLowerCase().includes((m.seafoodName || '').toLowerCase().split(' ')[0])
          );
          if (matched && matched.sellingRate) {
            const qty = parseFloat(m.quantityKg) || 1;
            const rate = parseFloat(matched.sellingRate);
            return {
              ...m,
              seafoodId: matched.seafoodId,
              gradeId: matched.gradeId,
              seafoodName: matched.name,
              sellingRate: rate.toFixed(2),
              amount: (qty * rate).toFixed(2)
            };
          }
          return m;
        });

        if (onUpdate) onUpdate();
      }
    }
  } catch (err) {
    console.warn('Could not sync live POS catalog:', err);
  }
}

// Helpers
function calculateTotals() {
  let subtotal = 0;
  let totalKg = 0;

  for (const item of posState.manifest) {
    subtotal += parseFloat(item.amount || 0);
    totalKg += parseFloat(item.quantityKg || 0);
  }

  const discount = Math.min(parseFloat(posState.discount || 0), subtotal);
  const netPayable = Math.max(0, subtotal - discount);

  return {
    subtotal: subtotal.toFixed(2),
    totalKg: totalKg.toFixed(3),
    discount: discount.toFixed(2),
    netPayable: netPayable.toFixed(2)
  };
}

export function renderPosView() {
  const totals = calculateTotals();
  const activeRate = parseFloat(posState.activeItem?.sellingRate || 0);
  const activeWeight = parseFloat(posState.activeWeight || 0);
  const activeComputedVal = (activeWeight * activeRate).toFixed(2);

  const cashReceived = parseFloat(posState.customCashReceived || totals.netPayable);
  const changeToReturn = Math.max(0, cashReceived - parseFloat(totals.netPayable)).toFixed(2);

  // Filter catalog
  const filteredCatalog = defaultCatalog.filter(item => {
    const matchesCat = posState.selectedCategory === 'all' || item.category === posState.selectedCategory;
    const matchesSearch = !posState.searchQuery || 
      item.name.toLowerCase().includes(posState.searchQuery.toLowerCase()) ||
      item.lot.toLowerCase().includes(posState.searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(posState.searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return `
    <div class="flex flex-col w-full select-none pb-20 lg:pb-6">
      
      <!-- Operational Sub-Header: Fast Function Keys & Real-Time Telemetry Bar -->
      <section class="w-full bg-surface-container-low px-gutter py-space-xs flex flex-wrap items-center justify-between gap-space-sm shadow-sm select-none rounded-xl mb-3">
        <!-- Function Hotkeys HUD -->
        <div class="flex items-center flex-wrap gap-space-xs">
          <span class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider mr-1">HOTKEYS:</span>
          <div class="inline-flex items-center gap-1 px-space-xs py-0.5 rounded bg-surface-container-lowest shadow-sm cursor-pointer" data-hotkey="F2">
            <kbd class="font-label-numeric text-[11px] font-bold text-on-primary bg-primary px-1.5 py-0.2 rounded">F2</kbd>
            <span class="font-body-sm text-body-sm text-on-surface font-medium">Search Item</span>
          </div>
          <div class="inline-flex items-center gap-1 px-space-xs py-0.5 rounded bg-surface-container-lowest shadow-sm cursor-pointer" data-hotkey="F4">
            <kbd class="font-label-numeric text-[11px] font-bold text-on-secondary-container bg-secondary-container px-1.5 py-0.2 rounded">F4</kbd>
            <span class="font-body-sm text-body-sm text-on-surface font-medium">Scale Capture</span>
          </div>
          <div class="inline-flex items-center gap-1 px-space-xs py-0.5 rounded bg-surface-container-lowest shadow-sm cursor-pointer" data-hotkey="F8">
            <kbd class="font-label-numeric text-[11px] font-bold text-on-surface bg-surface-container-highest px-1.5 py-0.2 rounded">F8</kbd>
            <span class="font-body-sm text-body-sm text-on-surface font-medium">Customer</span>
          </div>
          <div class="inline-flex items-center gap-1 px-space-xs py-0.5 rounded bg-surface-container-lowest shadow-sm cursor-pointer" data-hotkey="F9">
            <kbd class="font-label-numeric text-[11px] font-bold text-on-surface bg-surface-container-highest px-1.5 py-0.2 rounded">F9</kbd>
            <span class="font-body-sm text-body-sm text-on-surface font-medium">Discount</span>
          </div>
          <div class="inline-flex items-center gap-1 px-space-xs py-0.5 rounded bg-surface-container-lowest shadow-sm cursor-pointer" data-hotkey="F10">
            <kbd class="font-label-numeric text-[11px] font-bold text-on-primary bg-secondary px-1.5 py-0.2 rounded">F10</kbd>
            <span class="font-body-sm text-body-sm text-secondary font-semibold">Complete Sale</span>
          </div>
        </div>

        <!-- Telemetry Chips -->
        <div class="flex items-center gap-space-sm flex-wrap">
          <div class="flex items-center gap-space-xs px-space-sm py-1 rounded bg-surface-container-lowest shadow-sm">
            <span class="font-label-caps text-label-caps text-on-surface-variant uppercase">Today's Sales</span>
            <span class="font-title-md text-title-md text-on-surface font-semibold">₹${posState.todaySales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div class="flex items-center gap-space-xs px-space-sm py-1 rounded bg-surface-container-lowest shadow-sm">
            <span class="font-label-caps text-label-caps text-on-surface-variant uppercase">Billed Volume</span>
            <span class="font-title-md text-title-md text-secondary font-semibold">${posState.billedVolume.toFixed(3)} <span class="text-[11px]">KG</span></span>
          </div>
          <div class="flex items-center gap-space-xs px-space-sm py-1 rounded bg-surface-container-lowest shadow-sm">
            <span class="font-label-caps text-label-caps text-on-surface-variant uppercase">Tickets</span>
            <span class="font-title-md text-title-md text-on-surface font-semibold">${posState.ticketsCount}</span>
          </div>
          <div class="flex items-center gap-space-xs px-space-sm py-1 rounded bg-primary-container text-on-primary shadow-sm">
            <span class="material-symbols-outlined text-secondary-fixed text-[16px] animate-pulse">balance</span>
            <span class="font-label-caps text-label-caps text-primary-fixed uppercase tracking-wider">Mettler-Toledo #02:</span>
            <span class="font-title-md text-title-md text-secondary-fixed font-bold tracking-tight">${posState.activeWeight} KG</span>
            <span class="px-1 py-0.5 text-[9px] rounded font-label-caps bg-secondary text-on-secondary uppercase">Stabilized</span>
          </div>
        </div>
      </section>

      <!-- Main 3-Column POS Terminal Cockpit (42% / 30% / 28%) -->
      <div class="w-full grid grid-cols-1 xl:grid-cols-12 gap-gutter items-start">
        
        <!-- ========================================================================= -->
        <!-- COLUMN 1 (~42% -> 5 cols xl): Live Catalog & Scale Entry Instrument Hub  -->
        <!-- ========================================================================= -->
        <section class="xl:col-span-5 flex flex-col gap-space-sm">
          
          <!-- Instant Search & Quick Category Filters -->
          <div class="p-space-sm bg-surface-container-lowest rounded-xl shadow-sm flex flex-col gap-space-xs border border-outline-variant/50">
            <div class="relative w-full flex items-center">
              <span class="material-symbols-outlined absolute left-3 text-on-surface-variant text-[20px]">search</span>
              <input 
                id="catalogSearch" 
                type="text" 
                placeholder="Search seafood species, grade, or lot... [Ctrl+K / F2]" 
                value="${posState.searchQuery}"
                class="w-full pl-10 pr-20 py-2.5 bg-surface-container-low rounded-lg text-on-surface font-title-md text-title-md placeholder:text-on-surface-variant focus:outline-none focus:bg-surface-container-lowest shadow-inner"
              />
              <div class="absolute right-2.5 flex items-center gap-1">
                <button id="clear-search-btn" class="px-1.5 py-0.5 rounded text-[10px] font-label-caps bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest">
                  ESC: CLEAR
                </button>
              </div>
            </div>

            <!-- Filter Chips -->
            <div class="flex items-center gap-1 overflow-x-auto py-1 text-on-surface-variant">
              <button data-cat="all" class="px-space-sm py-1 rounded-full font-label-caps text-label-caps uppercase transition-colors whitespace-nowrap shadow-sm ${posState.selectedCategory === 'all' ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'}">
                All (8)
              </button>
              <button data-cat="fish" class="px-space-sm py-1 rounded-full font-label-caps text-label-caps uppercase transition-colors whitespace-nowrap ${posState.selectedCategory === 'fish' ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'}">
                Fish (1)
              </button>
              <button data-cat="prawn" class="px-space-sm py-1 rounded-full font-label-caps text-label-caps uppercase transition-colors whitespace-nowrap ${posState.selectedCategory === 'prawn' ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'}">
                Prawn & Shrimp (2)
              </button>
              <button data-cat="crab" class="px-space-sm py-1 rounded-full font-label-caps text-label-caps uppercase transition-colors whitespace-nowrap ${posState.selectedCategory === 'crab' ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'}">
                Crab (2)
              </button>
              <button data-cat="squid" class="px-space-sm py-1 rounded-full font-label-caps text-label-caps uppercase transition-colors whitespace-nowrap ${posState.selectedCategory === 'squid' ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'}">
                Squid & Cuttle (3)
              </button>
            </div>
          </div>

          <!-- ACTIVE WEIGHT CAPTURE INSTRUMENT PANEL (SELECTED ITEM) -->
          <div class="p-space-md bg-surface-container-lowest rounded-xl shadow-md flex flex-col gap-space-sm relative overflow-hidden border border-outline-variant/60">
            <div class="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-2xl pointer-events-none"></div>
            
            <!-- Target Item Header -->
            <div class="flex items-start justify-between gap-space-sm">
              <div class="flex flex-col">
                <div class="flex items-center gap-space-xs">
                  <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-label-caps bg-secondary-container text-on-secondary-container">ACTIVE WEIGH FOCUS</span>
                  <span class="font-label-caps text-label-caps text-secondary font-bold">LOT #${posState.activeItem?.lot || 'SQ-901'}</span>
                </div>
                <h3 class="font-headline-md text-headline-md text-on-surface mt-0.5">
                  ${posState.activeItem?.name || 'Squid (Loligo Vulgaris) — Grade A'}
                </h3>
                <span class="font-body-sm text-body-sm text-on-surface-variant">Live Dock Sorting | Fresh Catch Cold Well #03</span>
              </div>
              <div class="flex flex-col items-end">
                <span class="font-label-caps text-label-caps text-on-surface-variant uppercase">Selling Rate</span>
                <span class="font-headline-md text-headline-md text-secondary font-bold tabular-nums">
                  ₹${posState.activeItem?.sellingRate || '470.00'} <span class="font-body-sm text-body-sm text-on-surface-variant font-normal">/ KG</span>
                </span>
              </div>
            </div>

            <!-- High-Precision Digital Terminal Instrument Display -->
            <div class="p-space-md bg-primary-container text-on-primary rounded-xl flex items-center justify-between shadow-inner">
              <div class="flex flex-col">
                <div class="flex items-center gap-1.5 text-secondary-fixed">
                  <span class="material-symbols-outlined text-[18px]">scale</span>
                  <span class="font-label-caps text-label-caps uppercase tracking-wider">Live Scale Reading (KG)</span>
                </div>
                <div class="flex items-baseline gap-2 mt-1">
                  <input 
                    id="live-weight-input" 
                    type="number" 
                    step="0.05"
                    min="0.05"
                    value="${posState.activeWeight}" 
                    class="font-headline-xl text-headline-xl text-surface-bright font-bold tracking-tight tabular-nums bg-transparent w-36 focus:outline-none focus:border-b-2 focus:border-secondary-fixed"
                  />
                  <span class="font-headline-md text-headline-md text-secondary-fixed font-semibold">KG</span>
                </div>
                <span class="font-body-sm text-body-sm text-on-primary-container">Captured via Digital Scale RS-232</span>
              </div>

              <div class="flex flex-col items-end justify-center pl-space-md bg-primary/40 p-space-sm rounded-lg min-w-[160px]">
                <span class="font-label-caps text-label-caps text-primary-fixed uppercase tracking-wider">Computed Value</span>
                <span class="font-headline-lg text-headline-lg text-secondary-fixed font-bold tabular-nums" id="activeComputedVal">
                  ₹${activeComputedVal}
                </span>
                <span class="font-label-numeric text-[11px] text-primary-fixed-dim" id="activeFormula">
                  ${posState.activeWeight} KG × ₹${posState.activeItem?.sellingRate || '470.00'}
                </span>
              </div>
            </div>

            <!-- Scale Controls & Weight Calibration Chips -->
            <div class="flex flex-col gap-space-xs">
              <div class="grid grid-cols-2 gap-space-xs">
                <button id="auto-capture-scale-btn" class="py-2 px-space-sm rounded-lg bg-secondary text-on-secondary font-title-md text-title-md flex items-center justify-center gap-1.5 shadow-sm hover:opacity-90 active:scale-[0.99] transition-transform">
                  <span class="material-symbols-outlined text-[18px]">bolt</span>
                  <span>Auto Capture Scale (F4)</span>
                </button>
                <button id="tare-scale-btn" class="py-2 px-space-sm rounded-lg bg-surface-container text-on-surface font-title-md text-title-md flex items-center justify-center gap-1.5 hover:bg-surface-container-high transition-colors">
                  <span class="material-symbols-outlined text-[18px]">restart_alt</span>
                  <span>Tare / Zero Out</span>
                </button>
              </div>

              <!-- Quick Presets -->
              <div class="flex items-center justify-between gap-1 flex-wrap pt-1">
                <span class="font-label-caps text-label-caps text-on-surface-variant uppercase">Quick Tares:</span>
                <div class="flex items-center gap-1 flex-wrap">
                  <button data-quick-wt="0.250" class="px-2 py-1 rounded bg-surface-container text-on-surface font-label-numeric text-label-numeric hover:bg-secondary hover:text-on-secondary transition-colors">250g</button>
                  <button data-quick-wt="0.500" class="px-2 py-1 rounded bg-surface-container text-on-surface font-label-numeric text-label-numeric hover:bg-secondary hover:text-on-secondary transition-colors">500g</button>
                  <button data-quick-wt="0.750" class="px-2 py-1 rounded bg-surface-container text-on-surface font-label-numeric text-label-numeric hover:bg-secondary hover:text-on-secondary transition-colors">750g</button>
                  <button data-quick-wt="1.000" class="px-2 py-1 rounded bg-surface-container text-on-surface font-label-numeric text-label-numeric hover:bg-secondary hover:text-on-secondary transition-colors">1.0 KG</button>
                  <button data-quick-wt="2.000" class="px-2 py-1 rounded bg-surface-container text-on-surface font-label-numeric text-label-numeric hover:bg-secondary hover:text-on-secondary transition-colors">2.0 KG</button>
                  <button data-quick-wt="5.000" class="px-2 py-1 rounded bg-surface-container text-on-surface font-label-numeric text-label-numeric hover:bg-secondary hover:text-on-secondary transition-colors">5.0 KG</button>
                  <button data-quick-wt="10.000" class="px-2 py-1 rounded bg-surface-container text-on-surface font-label-numeric text-label-numeric hover:bg-secondary hover:text-on-secondary transition-colors">10 KG</button>
                </div>
              </div>
            </div>

            <!-- Add To Cart Execution Trigger -->
            <button id="add-to-manifest-btn" class="w-full py-2.5 rounded-lg bg-primary text-on-primary font-headline-md text-headline-md tracking-tight flex items-center justify-center gap-2 shadow hover:bg-primary-container transition-colors">
              <span class="material-symbols-outlined text-[20px]">add_shopping_cart</span>
              <span>Add to Sale Manifest [ENTER]</span>
            </button>
          </div>

          <!-- High-Density Species Catalog Grid -->
          <div class="flex flex-col gap-space-xs">
            <div class="flex items-center justify-between px-space-xs">
              <span class="font-label-caps text-label-caps text-on-surface-variant uppercase">Species Catalog (Selling Rates)</span>
              <span class="font-label-caps text-label-caps text-secondary font-medium">${filteredCatalog.length} Fresh Varieties Available</span>
            </div>

            <div class="grid grid-cols-2 gap-space-xs max-h-[460px] overflow-y-auto pr-1">
              ${filteredCatalog.map(item => {
                const isSelected = posState.activeItem?.id === item.id;
                const isSoldOut = item.status === 'SOLD_OUT';
                const isRateUnavailable = item.status === 'RATE_UNAVAILABLE' || !item.sellingRate;
                
                if (isSoldOut) {
                  return `
                    <div class="p-space-sm bg-surface-container-low rounded-lg opacity-60 flex flex-col justify-between gap-space-xs cursor-not-allowed select-none border border-outline-variant/30">
                      <div class="flex items-start justify-between">
                        <span class="font-title-md text-title-md text-on-surface-variant line-through leading-tight">${item.name}</span>
                        <span class="px-1.5 py-0.5 rounded text-[10px] font-label-caps bg-error-container text-on-error-container font-bold">SOLD OUT</span>
                      </div>
                      <div class="flex items-center justify-between font-label-numeric text-label-numeric text-on-surface-variant">
                        <span>${item.grade}</span>
                        <span class="text-error font-semibold">0.0 KG</span>
                      </div>
                      <div class="flex items-center justify-between pt-1">
                        <span class="font-title-md text-title-md text-on-surface-variant tabular-nums">₹${item.sellingRate || '0.00'} <span class="font-body-sm text-body-sm font-normal">/KG</span></span>
                        <span class="font-label-caps text-label-caps text-on-surface-variant uppercase text-[10px]">Unavailable</span>
                      </div>
                    </div>
                  `;
                }

                if (isRateUnavailable) {
                  return `
                    <div class="p-space-sm bg-surface-container-low rounded-lg opacity-70 flex flex-col justify-between gap-space-xs cursor-not-allowed select-none border border-outline-variant/30">
                      <div class="flex items-start justify-between">
                        <span class="font-title-md text-title-md text-on-surface leading-tight">${item.name}</span>
                        <span class="px-1.5 py-0.5 rounded text-[10px] font-label-caps bg-surface-container-high text-on-surface-variant font-bold">NO RATE</span>
                      </div>
                      <div class="flex items-center justify-between font-label-numeric text-label-numeric text-on-surface-variant">
                        <span>${item.grade}</span>
                        <span class="text-secondary font-semibold">${item.availableKg} KG Live</span>
                      </div>
                      <div class="flex items-center justify-between pt-1">
                        <span class="text-xs text-error font-medium">Today's rate unavailable</span>
                        <span class="font-label-caps text-label-caps text-on-surface-variant uppercase text-[10px]">Disabled</span>
                      </div>
                    </div>
                  `;
                }

                return `
                  <div 
                    data-select-catalog-id="${item.id}"
                    class="p-space-sm bg-surface-container-lowest rounded-lg shadow-sm flex flex-col justify-between gap-space-xs cursor-pointer transition-all border ${
                      isSelected ? 'border-secondary bg-gradient-to-r from-secondary/10 to-transparent shadow' : 'border-outline-variant/40 hover:bg-surface-container-low'
                    }"
                  >
                    <div class="flex items-start justify-between">
                      <span class="font-title-md text-title-md text-on-surface font-bold leading-tight">${item.name}</span>
                      ${isSelected ? `
                        <span class="px-1.5 py-0.5 rounded text-[10px] font-label-caps bg-secondary text-on-secondary">SELECTED</span>
                      ` : `
                        <span class="px-1.5 py-0.5 rounded text-[10px] font-label-caps ${item.status === 'LOW_STOCK' ? 'bg-surface-container-high text-error font-bold' : 'bg-surface-container text-on-surface-variant'}">
                          ${item.status === 'LOW_STOCK' ? `LOW: ${item.availableKg} KG` : item.lot}
                        </span>
                      `}
                    </div>
                    <div class="flex items-center justify-between font-label-numeric text-label-numeric text-on-surface-variant">
                      <span>${item.grade}</span>
                      <span class="text-secondary font-semibold">${item.availableKg} KG Live</span>
                    </div>
                    <div class="flex items-center justify-between pt-1">
                      <span class="font-title-md text-title-md text-on-surface font-bold tabular-nums">
                        ₹${item.sellingRate} <span class="font-body-sm text-body-sm font-normal text-on-surface-variant">/KG</span>
                      </span>
                      ${isSelected ? `
                        <span class="p-1 rounded bg-secondary text-on-secondary flex items-center"><span class="material-symbols-outlined text-[16px]">check</span></span>
                      ` : `
                        <button data-quick-add-id="${item.id}" class="px-2 py-0.5 rounded bg-surface-container text-on-surface font-label-caps text-label-caps hover:bg-primary hover:text-on-primary transition-colors">
                          + ADD
                        </button>
                      `}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </section>

        <!-- ========================================================================= -->
        <!-- COLUMN 2 (~30% -> 4 cols xl): Live Sale Order Manifest & Weight Verifier  -->
        <!-- ========================================================================= -->
        <section class="xl:col-span-4 flex flex-col gap-space-sm">
          
          <!-- Current Sale Cockpit Banner -->
          <div class="p-space-sm bg-surface-container-lowest rounded-xl shadow-sm flex flex-col gap-space-xs border border-outline-variant/50">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-space-xs">
                <span class="material-symbols-outlined text-secondary text-[20px]">receipt_long</span>
                <h2 class="font-title-lg text-title-lg text-on-surface font-bold">Current Sale Manifest</h2>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-label-numeric text-label-numeric font-bold">#${posState.orderNumber}</span>
                <span class="px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-caps text-label-caps">ACTIVE</span>
              </div>
            </div>

            <!-- Customer Identity Selector -->
            <div class="p-space-xs bg-surface-container-low rounded-lg flex items-center justify-between border border-outline-variant/40">
              <div class="flex items-center gap-space-xs">
                <div class="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-on-primary">
                  <span class="material-symbols-outlined text-[15px]">person</span>
                </div>
                <div class="flex flex-col">
                  <span class="font-title-md text-title-md text-on-surface font-semibold leading-tight">${posState.customer.name}</span>
                  <span class="font-body-sm text-body-sm text-on-surface-variant">${posState.customer.tier || 'Retail Tier-1'}</span>
                </div>
              </div>
              <button id="change-customer-btn" class="px-space-xs py-1 rounded bg-surface-container-lowest text-secondary font-title-md text-title-md shadow-sm hover:bg-secondary hover:text-on-secondary transition-colors">
                + Change (F8)
              </button>
            </div>
          </div>

          <!-- Manifest Items List -->
          <div class="bg-surface-container-lowest rounded-xl shadow-sm p-space-sm flex flex-col gap-space-xs border border-outline-variant/50 min-h-[380px]">
            <div class="flex items-center justify-between text-on-surface-variant font-label-caps text-label-caps px-space-xs pb-1 border-b border-outline-variant/30">
              <span>ITEM & WEIGHED SPECIFICATION</span>
              <span>SUBTOTAL (INR)</span>
            </div>

            <!-- Items Loop -->
            <div class="flex flex-col gap-2 overflow-y-auto max-h-[340px] pr-1">
              ${posState.manifest.length === 0 ? `
                <div class="py-12 flex flex-col items-center justify-center text-center text-outline gap-2">
                  <span class="material-symbols-outlined text-4xl text-outline-variant">add_shopping_cart</span>
                  <p class="text-sm font-medium">Manifest is empty</p>
                  <p class="text-xs">Select species from catalog and click Add to Sale Manifest</p>
                </div>
              ` : posState.manifest.map((item, idx) => `
                <div class="p-space-sm bg-surface-container-low rounded-lg flex flex-col gap-space-xs border border-outline-variant/40">
                  <div class="flex items-start justify-between">
                    <div class="flex flex-col">
                      <span class="font-title-md text-title-md text-on-surface font-bold">${item.seafoodName} (${item.gradeName})</span>
                      <span class="font-label-numeric text-label-numeric text-on-surface-variant">Selling Rate: ₹${item.sellingRate} / KG</span>
                    </div>
                    <span class="font-title-lg text-title-lg text-on-surface font-bold tabular-nums">₹${item.amount}</span>
                  </div>

                  <div class="flex items-center justify-between pt-1">
                    <!-- Fine Weight Adjuster Controls -->
                    <div class="flex items-center gap-1 bg-surface-container-lowest rounded-lg p-0.5 shadow-sm border border-outline-variant/30">
                      <button data-wt-adjust="${idx}" data-delta="-0.250" class="w-6 h-6 rounded bg-surface-container flex items-center justify-center text-on-surface font-bold hover:bg-surface-container-high transition-colors">-</button>
                      <div class="px-2 font-label-numeric text-label-numeric font-bold text-secondary tabular-nums">${item.quantityKg} KG</div>
                      <button data-wt-adjust="${idx}" data-delta="0.250" class="w-6 h-6 rounded bg-surface-container flex items-center justify-center text-on-surface font-bold hover:bg-surface-container-high transition-colors">+</button>
                    </div>

                    <div class="flex items-center gap-2">
                      <button data-edit-manifest-idx="${idx}" class="p-1 rounded text-on-surface-variant hover:text-secondary transition-colors" title="Edit Weight Manually">
                        <span class="material-symbols-outlined text-[18px]">edit_note</span>
                      </button>
                      <button data-delete-manifest-idx="${idx}" class="p-1 rounded text-error hover:bg-error-container transition-colors" title="Remove Line Item">
                        <span class="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Real-Time Cold Room Live Stock Verification Guarantee Callout -->
            <div class="p-space-xs px-space-sm rounded-lg bg-secondary-container/30 flex items-center gap-space-xs mt-1 border border-secondary/20">
              <span class="material-symbols-outlined text-secondary text-[16px]">verified</span>
              <span class="font-body-sm text-body-sm text-on-secondary-container font-medium">All manifest lots verified against live cold store scale</span>
            </div>

            <!-- Compact Manifest Aggregates Bar -->
            <div class="p-space-sm bg-surface-container-high rounded-lg flex items-center justify-between mt-space-xs">
              <div class="flex flex-col">
                <span class="font-label-caps text-label-caps text-on-surface-variant uppercase">Landed Weight</span>
                <span class="font-title-lg text-title-lg text-on-surface font-bold tabular-nums">${totals.totalKg} <span class="text-xs font-normal">KG</span></span>
              </div>
              <div class="flex flex-col">
                <span class="font-label-caps text-label-caps text-on-surface-variant uppercase">Total Species</span>
                <span class="font-title-lg text-title-lg text-on-surface font-bold tabular-nums">${posState.manifest.length} Lots</span>
              </div>
              <div class="flex flex-col items-end">
                <span class="font-label-caps text-label-caps text-on-surface-variant uppercase">Gross Subtotal</span>
                <span class="font-title-lg text-title-lg text-on-surface font-bold tabular-nums">₹${totals.subtotal}</span>
              </div>
            </div>

            <!-- Quick Receipt Preview Stamp -->
            <div class="p-space-xs bg-surface-container-low rounded flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
              <span>Harbor Wharf Terminal #01</span>
              <span class="font-label-numeric text-label-numeric">Clerk: Rayan K.</span>
            </div>
          </div>
        </section>

        <!-- ========================================================================= -->
        <!-- COLUMN 3 (~28% -> 3 cols xl): Settlement Cockpit & Multi-Tender Payment  -->
        <!-- ========================================================================= -->
        <section class="xl:col-span-3 flex flex-col gap-space-sm">
          
          <!-- Grand Financial Net Payable Card -->
          <div class="p-space-md bg-surface-container-lowest rounded-xl shadow-md flex flex-col gap-space-xs border border-outline-variant/60">
            <div class="flex items-center justify-between pb-1">
              <span class="font-title-md text-title-md text-on-surface font-semibold">Bill Summary</span>
              <span class="font-label-caps text-label-caps text-secondary font-bold">GST INCL. (0%)</span>
            </div>
            
            <div class="flex items-center justify-between text-on-surface-variant font-body-md text-body-md">
              <span>Gross Subtotal</span>
              <span class="font-title-md text-title-md text-on-surface tabular-nums">₹${totals.subtotal}</span>
            </div>

            <div class="flex items-center justify-between text-on-surface-variant font-body-md text-body-md cursor-pointer" id="discount-trigger-row">
              <div class="flex items-center gap-1">
                <span>Special Discount (F9)</span>
                <span class="px-1 rounded bg-secondary-container text-on-secondary-container font-label-caps text-[9px]">PROMO</span>
              </div>
              <span class="font-title-md text-title-md text-error tabular-nums">-₹${totals.discount}</span>
            </div>

            <!-- Massive High-Impact Total Container -->
            <div class="mt-space-xs p-space-md rounded-xl bg-primary text-on-primary flex flex-col gap-1 shadow-lg relative overflow-hidden">
              <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-secondary-container/20 rounded-full blur-xl pointer-events-none"></div>
              <span class="font-label-caps text-label-caps text-primary-fixed uppercase tracking-widest">NET AMOUNT PAYABLE</span>
              <div class="flex items-baseline justify-between mt-1">
                <span class="font-headline-xl text-headline-xl text-secondary-fixed font-bold tracking-tight tabular-nums">
                  ₹${totals.netPayable}
                </span>
                <span class="font-label-caps text-label-caps text-primary-fixed-dim">INR EXACT</span>
              </div>
            </div>
          </div>

          <!-- Multi-Tender Selector Tabs -->
          <div class="bg-surface-container-lowest rounded-xl shadow-sm p-space-sm flex flex-col gap-space-sm border border-outline-variant/60">
            <span class="font-label-caps text-label-caps text-on-surface-variant uppercase">Payment Settlement Tender</span>
            <div class="grid grid-cols-2 gap-space-xs">
              <button data-tender-method="CASH" class="py-2.5 px-space-xs rounded-lg font-title-md text-title-md flex items-center justify-center gap-1.5 transition-all shadow-sm ${posState.paymentMethod === 'CASH' ? 'bg-secondary text-on-secondary font-bold' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'}">
                <span class="material-symbols-outlined text-[18px]">payments</span>
                <span>Cash Tender</span>
              </button>
              <button data-tender-method="UPI" class="py-2.5 px-space-xs rounded-lg font-title-md text-title-md flex items-center justify-center gap-1.5 transition-all shadow-sm ${posState.paymentMethod === 'UPI' ? 'bg-secondary text-on-secondary font-bold' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'}">
                <span class="material-symbols-outlined text-[18px]">qr_code_2</span>
                <span>UPI Instant</span>
              </button>
              <button data-tender-method="BANK_TRANSFER" class="py-2.5 px-space-xs rounded-lg font-title-md text-title-md flex items-center justify-center gap-1.5 transition-all shadow-sm ${posState.paymentMethod === 'BANK_TRANSFER' ? 'bg-secondary text-on-secondary font-bold' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'}">
                <span class="material-symbols-outlined text-[18px]">account_balance</span>
                <span>Bank / NEFT</span>
              </button>
              <button data-tender-method="CREDIT" class="py-2.5 px-space-xs rounded-lg font-title-md text-title-md flex items-center justify-center gap-1.5 transition-all shadow-sm ${posState.paymentMethod === 'CREDIT' ? 'bg-secondary text-on-secondary font-bold' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'}">
                <span class="material-symbols-outlined text-[18px]">credit_card</span>
                <span>Store Credit</span>
              </button>
            </div>

            <!-- Cash Operational Instrument Panel -->
            ${posState.paymentMethod === 'CASH' ? `
              <div class="p-space-sm bg-surface-container-low rounded-xl flex flex-col gap-space-xs border border-outline-variant/40">
                <span class="font-label-caps text-label-caps text-on-surface-variant uppercase">Tendered Cash Presets</span>
                <div class="grid grid-cols-2 gap-1.5">
                  <button data-cash-preset="exact" class="py-1.5 px-2 rounded font-label-numeric text-label-numeric font-bold transition-colors shadow-sm tabular-nums ${posState.tenderedCashPreset === 'exact' ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest text-on-surface hover:bg-secondary hover:text-on-secondary'}">
                    Exact (₹${totals.netPayable})
                  </button>
                  <button data-cash-preset="2300.00" class="py-1.5 px-2 rounded font-label-numeric text-label-numeric font-bold transition-colors shadow-sm tabular-nums ${posState.tenderedCashPreset === '2300.00' ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest text-on-surface hover:bg-secondary hover:text-on-secondary'}">
                    ₹2,300.00
                  </button>
                  <button data-cash-preset="2500.00" class="py-1.5 px-2 rounded font-label-numeric text-label-numeric font-bold transition-colors shadow-sm tabular-nums ${posState.tenderedCashPreset === '2500.00' ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest text-on-surface hover:bg-secondary hover:text-on-secondary'}">
                    ₹2,500.00 (Active)
                  </button>
                  <button data-cash-preset="3000.00" class="py-1.5 px-2 rounded font-label-numeric text-label-numeric font-bold transition-colors shadow-sm tabular-nums ${posState.tenderedCashPreset === '3000.00' ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest text-on-surface hover:bg-secondary hover:text-on-secondary'}">
                    ₹3,000.00
                  </button>
                </div>

                <div class="flex items-center justify-between mt-1 pt-1">
                  <span class="font-body-md text-body-md text-on-surface font-medium">Cash Received:</span>
                  <div class="flex items-center gap-1">
                    <span class="text-sm font-bold text-on-surface">₹</span>
                    <input 
                      id="cash-received-input" 
                      type="number" 
                      step="10"
                      value="${posState.customCashReceived}" 
                      class="w-24 px-2 py-0.5 rounded font-title-lg text-title-lg text-right font-bold text-on-surface bg-surface-container-lowest border border-outline-variant/60 focus:outline-none focus:border-secondary tabular-nums"
                    />
                  </div>
                </div>

                <!-- Highlight Change Due Display Box -->
                <div class="p-space-sm rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-between shadow-sm">
                  <div class="flex flex-col">
                    <span class="font-label-caps text-label-caps uppercase font-bold tracking-wider">CHANGE TO RETURN</span>
                    <span class="font-body-sm text-body-sm">Balance to Customer</span>
                  </div>
                  <span class="font-headline-lg text-headline-lg font-bold tabular-nums" id="change-due-display">
                    ₹${changeToReturn}
                  </span>
                </div>
              </div>
            ` : `
              <div class="p-space-sm bg-surface-container-low rounded-xl flex flex-col gap-2 border border-outline-variant/40">
                <span class="font-label-caps text-label-caps text-on-surface-variant uppercase">
                  ${posState.paymentMethod === 'UPI' ? 'UPI Instant Settlement' : posState.paymentMethod === 'BANK_TRANSFER' ? 'NEFT / RTGS Transfer Details' : 'Customer Ledger Store Credit'}
                </span>
                <div class="flex flex-col gap-1">
                  <label class="text-[10px] uppercase font-semibold text-outline">Reference Number / UTR</label>
                  <input 
                    id="non-cash-ref-input" 
                    type="text" 
                    placeholder="${posState.paymentMethod === 'UPI' ? 'UPI Txn ID (e.g. 32901923)' : posState.paymentMethod === 'BANK_TRANSFER' ? 'NEFT UTR Number' : 'Credit Authorization Note'}" 
                    class="w-full px-3 py-1.5 rounded-lg bg-surface-container-lowest text-xs font-mono border border-outline-variant/60 focus:outline-none"
                  />
                </div>
                ${posState.paymentMethod === 'CREDIT' && posState.customer.id === 'walk-in' ? `
                  <div class="p-2 rounded bg-error-container text-on-error-container text-xs flex items-center gap-1.5 font-medium">
                    <span class="material-symbols-outlined text-[16px]">warning</span>
                    <span>Store Credit requires registered customer. Walk-in not permitted.</span>
                  </div>
                ` : ''}
              </div>
            `}

            <!-- Primary Execution Action Button -->
            <button 
              id="complete-sale-btn" 
              ${posState.isSubmitting ? 'disabled' : ''}
              class="w-full py-4 rounded-xl bg-secondary text-on-secondary font-headline-md text-headline-md tracking-tight flex items-center justify-center gap-2 shadow-lg hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span class="material-symbols-outlined text-[24px]">print</span>
              <span>${posState.isSubmitting ? 'Completing sale...' : 'COMPLETE SALE & PRINT (F10)'}</span>
            </button>

            <!-- Automation Checkboxes & Secondary Reset -->
            <div class="flex flex-col gap-1.5 pt-1 px-1">
              <label class="flex items-center gap-2 cursor-pointer select-none">
                <input id="autocut-toggle" type="checkbox" ${posState.autoCutSlip ? 'checked' : ''} class="w-4 h-4 rounded text-secondary focus:ring-0 accent-secondary" />
                <span class="font-body-sm text-body-sm text-on-surface">Auto-cut 3" Thermal Slip to Epson TM-88</span>
              </label>

              <label class="flex items-center gap-2 cursor-pointer select-none">
                <input id="whatsapp-toggle" type="checkbox" ${posState.autoWhatsApp ? 'checked' : ''} class="w-4 h-4 rounded text-secondary focus:ring-0 accent-secondary" />
                <span class="font-body-sm text-body-sm text-on-surface">WhatsApp Receipt to <span class="font-label-numeric font-medium">+91 98401 22345</span></span>
              </label>
            </div>

            <button id="discard-manifest-btn" class="w-full py-1.5 mt-1 rounded text-on-surface-variant font-label-caps text-label-caps hover:text-error hover:bg-error-container/40 transition-colors uppercase">
              Discard Draft Order [Esc]
            </button>
          </div>

          <!-- Quick Port Shift Indicator -->
          <div class="p-space-xs rounded-lg bg-surface-container text-on-surface-variant flex items-center justify-between font-label-numeric text-label-numeric">
            <span class="flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-secondary"></span> Port Terminal #01 Online</span>
            <span>Paper: 88% OK</span>
          </div>
        </section>

      </div>
    </div>
  `;
}

export function bindPosEvents() {
  const container = document.querySelector('main');
  if (!container) return;

  function reRender() {
    container.innerHTML = renderPosView();
    bindPosEvents();
  }

  if (!hasSyncedLiveCatalog) {
    hasSyncedLiveCatalog = true;
    syncLivePosData(() => {
      reRender();
    });
  }

  // 1. Search filter
  const searchInput = container.querySelector('#catalogSearch');
  searchInput?.addEventListener('input', (e) => {
    posState.searchQuery = e.target.value;
    reRender();
  });

  container.querySelector('#clear-search-btn')?.addEventListener('click', () => {
    posState.searchQuery = '';
    reRender();
  });

  // 2. Category Filter Chips
  container.querySelectorAll('[data-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      posState.selectedCategory = btn.dataset.cat;
      reRender();
    });
  });

  // 3. Select Species Card for Weighing
  container.querySelectorAll('[data-select-catalog-id]').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('[data-quick-add-id]')) return;
      const itemId = card.dataset.selectCatalogId;
      const found = defaultCatalog.find(i => i.id === itemId);
      if (found && found.status !== 'SOLD_OUT') {
        posState.activeItem = found;
        reRender();
      }
    });
  });

  // 4. Quick Add from Card
  container.querySelectorAll('[data-quick-add-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const itemId = btn.dataset.quickAddId;
      const found = defaultCatalog.find(i => i.id === itemId);
      if (!found || found.status === 'SOLD_OUT') {
        showToast('Item is sold out', 'error');
        return;
      }
      if (!found.sellingRate || found.status === 'RATE_UNAVAILABLE') {
        alert("Today's rate unavailable. Cannot add to manifest.");
        showToast("Today's rate unavailable", 'error');
        return;
      }

      const wt = parseFloat(posState.activeWeight || '1.000');
      const available = parseFloat(found.availableKg || 0);
      const existing = posState.manifest.find(m => m.seafoodId === found.seafoodId);
      const totalRequested = (existing ? parseFloat(existing.quantityKg) : 0) + wt;

      if (totalRequested > available) {
        alert(`Insufficient stock for ${found.name}. Available: ${available.toFixed(3)} KG, Requested: ${totalRequested.toFixed(3)} KG.`);
        showToast(`Insufficient stock (${available.toFixed(3)} KG available)`, 'error');
        return;
      }

      const rate = parseFloat(found.sellingRate);
      const amount = (wt * rate).toFixed(2);

      if (existing) {
        const newWt = (parseFloat(existing.quantityKg) + wt).toFixed(3);
        existing.quantityKg = newWt;
        existing.amount = (parseFloat(newWt) * rate).toFixed(2);
      } else {
        posState.manifest.push({
          id: `item-${Date.now()}`,
          seafoodId: found.seafoodId,
          seafoodName: found.name,
          gradeId: found.gradeId || 'grade-a',
          gradeName: found.grade,
          quantityKg: wt.toFixed(3),
          sellingRate: found.sellingRate,
          amount
        });
      }
      showToast(`Added ${found.name} to manifest`);
      reRender();
    });
  });

  // 5. Weight Presets in Active Weigh Panel
  container.querySelectorAll('[data-quick-wt]').forEach(btn => {
    btn.addEventListener('click', () => {
      posState.activeWeight = btn.dataset.quickWt;
      reRender();
    });
  });

  // Live weight input
  const liveWtInput = container.querySelector('#live-weight-input');
  liveWtInput?.addEventListener('input', (e) => {
    posState.activeWeight = parseFloat(e.target.value || 0).toFixed(3);
    const rate = parseFloat(posState.activeItem?.sellingRate || 0);
    const computed = (parseFloat(posState.activeWeight) * rate).toFixed(2);
    const disp = container.querySelector('#activeComputedVal');
    const form = container.querySelector('#activeFormula');
    if (disp) disp.textContent = `₹${computed}`;
    if (form) form.textContent = `${posState.activeWeight} KG × ₹${posState.activeItem?.sellingRate || '470.00'}`;
  });

  // Auto capture scale
  container.querySelector('#auto-capture-scale-btn')?.addEventListener('click', () => {
    const randomWts = ['1.250', '2.750', '3.500', '0.850', '4.200'];
    const chosen = randomWts[Math.floor(Math.random() * randomWts.length)];
    posState.activeWeight = chosen;
    showToast(`Scale locked at ${chosen} KG`);
    reRender();
  });

  // Tare scale
  container.querySelector('#tare-scale-btn')?.addEventListener('click', () => {
    posState.activeWeight = '0.000';
    showToast('Scale zeroed out / Tared');
    reRender();
  });

  // Add to Manifest [ENTER]
  container.querySelector('#add-to-manifest-btn')?.addEventListener('click', () => {
    const item = posState.activeItem;
    if (!item || item.status === 'SOLD_OUT') {
      showToast('Please select an available species first', 'error');
      return;
    }
    if (!item.sellingRate || item.status === 'RATE_UNAVAILABLE') {
      alert("Today's rate unavailable. Cannot add to manifest.");
      showToast("Today's rate unavailable", 'error');
      return;
    }
    const wt = parseFloat(posState.activeWeight || 0);
    if (wt <= 0) {
      alert('Weighed quantity must be greater than zero');
      return;
    }

    const available = parseFloat(item.availableKg || 0);
    const existing = posState.manifest.find(m => m.seafoodId === item.seafoodId);
    const totalRequested = (existing ? parseFloat(existing.quantityKg) : 0) + wt;

    if (totalRequested > available) {
      alert(`Insufficient stock for ${item.name}. Available: ${available.toFixed(3)} KG, Requested: ${totalRequested.toFixed(3)} KG.`);
      showToast(`Insufficient stock (${available.toFixed(3)} KG available)`, 'error');
      return;
    }

    const rate = parseFloat(item.sellingRate);
    const amount = (wt * rate).toFixed(2);

    if (existing) {
      const newWt = (parseFloat(existing.quantityKg) + wt).toFixed(3);
      existing.quantityKg = newWt;
      existing.amount = (parseFloat(newWt) * rate).toFixed(2);
    } else {
      posState.manifest.push({
        id: `item-${Date.now()}`,
        seafoodId: item.seafoodId,
        seafoodName: item.name,
        gradeId: item.gradeId || 'grade-a',
        gradeName: item.grade,
        quantityKg: wt.toFixed(3),
        sellingRate: item.sellingRate,
        amount
      });
    }

    showToast(`Added ${wt} KG ${item.name} to manifest`);
    reRender();
  });

  // 6. Manifest Line Item Stepper (-/+)
  container.querySelectorAll('[data-wt-adjust]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.wtAdjust, 10);
      const delta = parseFloat(btn.dataset.delta);
      const item = posState.manifest[idx];
      if (!item) return;

      const current = parseFloat(item.quantityKg);
      const newWt = Math.max(0.250, current + delta);
      const catalogItem = defaultCatalog.find(c => c.seafoodId === item.seafoodId);
      if (catalogItem && delta > 0) {
        const available = parseFloat(catalogItem.availableKg || 0);
        if (newWt > available) {
          alert(`Insufficient stock for ${item.seafoodName}. Available: ${available.toFixed(3)} KG, Requested: ${newWt.toFixed(3)} KG.`);
          showToast(`Insufficient stock: max ${available.toFixed(3)} KG`, 'error');
          return;
        }
      }
      item.quantityKg = newWt.toFixed(3);
      item.amount = (newWt * parseFloat(item.sellingRate)).toFixed(2);
      reRender();
    });
  });

  // Edit weight manually
  container.querySelectorAll('[data-edit-manifest-idx]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.editManifestIdx, 10);
      const item = posState.manifest[idx];
      if (!item) return;

      const input = prompt(`Enter weighed KG for ${item.seafoodName}:`, item.quantityKg);
      if (input !== null) {
        const val = parseFloat(input);
        if (!isNaN(val) && val > 0) {
          item.quantityKg = val.toFixed(3);
          item.amount = (val * parseFloat(item.sellingRate)).toFixed(2);
          reRender();
        } else {
          alert('Invalid weight quantity');
        }
      }
    });
  });

  // Delete line item
  container.querySelectorAll('[data-delete-manifest-idx]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.deleteManifestIdx, 10);
      posState.manifest.splice(idx, 1);
      showToast('Item removed from manifest');
      reRender();
    });
  });

  // 7. Customer Selector Modal
  container.querySelector('#change-customer-btn')?.addEventListener('click', () => {
    openPosCustomerModal(posState.customer.id, (cust) => {
      posState.customer = cust;
      reRender();
    });
  });

  // 8. Discount F9
  container.querySelector('#discount-trigger-row')?.addEventListener('click', () => {
    const input = prompt('Enter Discount Amount (₹):', posState.discount);
    if (input !== null) {
      const val = parseFloat(input);
      if (!isNaN(val) && val >= 0) {
        posState.discount = val.toFixed(2);
        reRender();
      } else {
        alert('Invalid discount amount');
      }
    }
  });

  // 9. Payment Method Tenders
  container.querySelectorAll('[data-tender-method]').forEach(btn => {
    btn.addEventListener('click', () => {
      posState.paymentMethod = btn.dataset.tenderMethod;
      reRender();
    });
  });

  // 10. Cash Presets
  container.querySelectorAll('[data-cash-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.dataset.cashPreset;
      const totals = calculateTotals();
      posState.tenderedCashPreset = preset;
      if (preset === 'exact') {
        posState.customCashReceived = totals.netPayable;
      } else {
        posState.customCashReceived = preset;
      }
      reRender();
    });
  });

  // Custom cash input
  const cashInput = container.querySelector('#cash-received-input');
  cashInput?.addEventListener('input', (e) => {
    posState.customCashReceived = e.target.value;
    const totals = calculateTotals();
    const cashVal = parseFloat(e.target.value || 0);
    const netVal = parseFloat(totals.netPayable);
    const change = Math.max(0, cashVal - netVal).toFixed(2);
    const changeDisp = container.querySelector('#change-due-display');
    if (changeDisp) changeDisp.textContent = `₹${change}`;
  });

  // Discard Draft
  container.querySelector('#discard-manifest-btn')?.addEventListener('click', () => {
    if (confirm('Discard current sale draft? All manifest lots will be cleared.')) {
      posState.manifest = [];
      posState.discount = '0.00';
      showToast('Sale manifest cleared');
      reRender();
    }
  });

  // COMPLETE SALE (F10)
  const completeBtn = container.querySelector('#complete-sale-btn');
  completeBtn?.addEventListener('click', async () => {
    if (posState.isSubmitting) return;

    if (posState.manifest.length === 0) {
      alert('Sale manifest is empty! Please add seafood lots before checkout.');
      return;
    }

    if (posState.paymentMethod === 'CREDIT' && posState.customer.id === 'walk-in') {
      alert('Walk-in Customer cannot buy on credit! Please change customer (F8) to an account customer.');
      return;
    }

    const totals = calculateTotals();

    posState.isSubmitting = true;
    completeBtn.disabled = true;
    completeBtn.innerHTML = `
      <span class="inline-block animate-spin mr-2">&#9696;</span>
      <span>Completing sale...</span>
    `;

    const salePayload = {
      customerId: posState.customer.id === 'walk-in' ? undefined : posState.customer.id,
      saleDate: new Date().toISOString().split('T')[0],
      items: posState.manifest.map(m => ({
        seafoodId: m.seafoodId,
        gradeId: m.gradeId,
        quantityKg: m.quantityKg
      })),
      discount: totals.discount,
      payment: {
        method: posState.paymentMethod,
        amount: posState.paymentMethod === 'CASH' ? posState.customCashReceived : totals.netPayable,
        referenceNumber: container.querySelector('#non-cash-ref-input')?.value || undefined
      },
      idempotencyKey: `pos-tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    };

    try {
      const resp = await posApiFetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(salePayload)
      });

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        let errorMsg = errJson.message || 'Sale completion failed';
        if (errJson.details) {
          if (errJson.details.availableKg && errJson.details.requestedKg) {
            errorMsg = `Insufficient stock for ${errJson.details.seafood || 'seafood'}. Available: ${errJson.details.availableKg} KG, Requested: ${errJson.details.requestedKg} KG.`;
          } else {
            errorMsg += `: ${JSON.stringify(errJson.details)}`;
          }
        }
        alert(errorMsg);
        showToast(errorMsg, 'error');
        posState.isSubmitting = false;
        completeBtn.disabled = false;
        completeBtn.innerHTML = `
          <span class="material-symbols-outlined text-[24px]">print</span>
          <span>COMPLETE SALE &amp; PRINT (F10)</span>
        `;
        return;
      }

      const json = await resp.json();
      const result = json.data;

      posState.todaySales += parseFloat(result.grandTotal || totals.netPayable);
      posState.billedVolume += parseFloat(result.totalKg || totals.totalKg);
      posState.ticketsCount += 1;

      openPosReceiptModal(result, () => {
        posState.manifest = [];
        posState.discount = '0.00';
        posState.orderNumber = `ORD-${Math.floor(Math.random()*8999)+1000}`;
        posState.isSubmitting = false;
        reRender();
      });

      if (posState.autoCutSlip) {
        setTimeout(() => {
          window.print();
        }, 300);
      }

      showToast(`Sale completed! Invoice ${result.invoiceNumber}`);

    } catch (err) {
      console.error('POS sale transaction failed:', err);
      const msg = err.message || 'Network connection failed during sale completion';
      alert(`Sale Error: ${msg}`);
      showToast(`Sale Error: ${msg}`, 'error');
    } finally {
      posState.isSubmitting = false;
      if (completeBtn) {
        completeBtn.disabled = false;
        completeBtn.innerHTML = `
          <span class="material-symbols-outlined text-[24px]">print</span>
          <span>COMPLETE SALE &amp; PRINT (F10)</span>
        `;
      }
    }
  });

  // Global Keyboard Shortcuts
  window.onkeydown = (e) => {
    if (e.key === 'F2') {
      e.preventDefault();
      container.querySelector('#catalogSearch')?.focus();
    } else if (e.key === 'F4') {
      e.preventDefault();
      container.querySelector('#auto-capture-scale-btn')?.click();
    } else if (e.key === 'F8') {
      e.preventDefault();
      container.querySelector('#change-customer-btn')?.click();
    } else if (e.key === 'F9') {
      e.preventDefault();
      container.querySelector('#discount-trigger-row')?.click();
    } else if (e.key === 'F10') {
      e.preventDefault();
      container.querySelector('#complete-sale-btn')?.click();
    } else if (e.key === 'Escape') {
      posState.searchQuery = '';
      reRender();
    }
  };
}
