// AppHeader Component
import { store } from '../state/store.js';

export function renderHeader(currentRoute) {
  const state = store.getState();
  
  const routeTitles = {
    'dashboard': 'Executive & Operations Dashboard',
    'purchase-bills': 'Purchase Billing & Lot Intake',
    'export-bills': 'Export Invoicing & Consignments',
    'seafood-master': 'Seafood Species Master Catalog',
    'daily-rates': 'Daily Seafood Rates Master',
    'stock': 'Stock & Cold Storage Telemetry',
    'fishermen': 'Fishermen Registry & Ledger',
    'customers': 'Wholesale Buyers Directory',
    'export-companies': 'Export Companies Directory',
    'expenses': 'Operational Harbor Expenses',
    'profit-and-loss': 'Profit & Loss Statement',
    'day-end': 'Day End Register Closing',
    'month-end': 'Month End Financial Audit',
    'reports': 'Reports Hub & Analytics',
    'settings': 'Terminal Settings & Profile'
  };

  const pageTitle = routeTitles[currentRoute] || 'Harbor Ledger Hub';

  return `
    <header class="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant/60 shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-30 px-space-md lg:px-space-lg flex items-center justify-between gap-space-md select-none">
      <!-- Left: Mobile Menu & Breadcrumbs -->
      <div class="flex items-center gap-space-md min-w-0">
        <button 
          id="mobile-menu-btn"
          class="lg:hidden p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-lg transition-colors"
          aria-label="Open navigation menu"
        >
          <span class="material-symbols-outlined text-[24px]">menu</span>
        </button>

        <div class="flex items-center gap-1.5 text-on-surface-variant text-sm truncate">
          <span class="material-symbols-outlined text-secondary text-[18px] shrink-0">anchor</span>
          <span class="font-body-sm text-outline hidden sm:inline">Wharf Station</span>
          <span class="text-outline hidden sm:inline">/</span>
          <span class="font-title-md text-title-md text-on-surface font-semibold truncate">${pageTitle}</span>
        </div>
      </div>

      <!-- Center: Omni Search Trigger [⌘K] -->
      <div class="hidden md:flex items-center flex-1 max-w-xs lg:max-w-md">
        <button 
          data-action="open-omni-search"
          class="w-full h-9 px-space-md bg-surface-container-low hover:bg-surface-container border border-outline-variant/40 rounded-lg flex items-center justify-between text-outline text-body-sm transition-all focus:outline-none"
        >
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[18px]">search</span>
            <span>Search fishermen, bills, rates, seafood...</span>
          </div>
          <span class="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-mono text-[10px] tracking-wider">⌘K</span>
        </button>
      </div>

      <!-- Right: Quick Actions, Date & Notifications -->
      <div class="flex items-center gap-space-sm sm:gap-space-md shrink-0">
        <!-- Quick Action CTAs (Hidden on mobile) -->
        <div class="hidden xl:flex items-center gap-1.5">
          <button 
            data-nav="purchase-bills"
            class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-container text-on-primary hover:bg-primary font-medium text-xs transition-colors shadow-sm"
          >
            <span class="material-symbols-outlined text-[15px]">add</span>
            <span>+ Purchase Bill</span>
          </button>
          
          <button 
            data-nav="export-bills"
            class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-on-secondary hover:bg-on-secondary-container font-medium text-xs transition-colors shadow-sm"
          >
            <span class="material-symbols-outlined text-[15px]">send</span>
            <span>+ Export Bill</span>
          </button>
          
          <button 
            data-nav="daily-rates"
            class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-medium text-xs transition-colors border border-outline-variant/50"
          >
            <span class="material-symbols-outlined text-[15px] text-secondary">bolt</span>
            <span>Rates</span>
          </button>
        </div>

        <!-- Shift & Date Pill -->
        <div class="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-low rounded-lg border border-outline-variant/30 text-xs">
          <span class="material-symbols-outlined text-secondary text-[15px]">calendar_today</span>
          <span class="font-mono text-on-surface font-medium">${state.date}</span>
        </div>

        <!-- Search Icon for Mobile -->
        <button 
          data-action="open-omni-search"
          class="md:hidden p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-lg transition-colors"
          title="Search"
        >
          <span class="material-symbols-outlined text-[20px]">search</span>
        </button>

        <!-- Notifications Bell -->
        <button 
          id="notifications-btn"
          class="relative p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-lg transition-colors"
          title="Notifications"
        >
          <span class="material-symbols-outlined text-[20px]">notifications</span>
          <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error ring-2 ring-surface-container-lowest"></span>
        </button>

        <!-- User Profile Avatar -->
        <div class="flex items-center gap-2 pl-1 border-l border-outline-variant/60">
          <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-xs shadow-sm">
            <span>AW</span>
          </div>
        </div>
      </div>
    </header>
  `;
}
