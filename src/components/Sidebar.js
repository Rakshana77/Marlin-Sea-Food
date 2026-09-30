// AppSidebar Component - Fixed Command Dock
import { store } from '../state/store.js';

export function renderSidebar(currentRoute) {
  const state = store.getState();

  const navItems = [
    { section: 'Operations Terminal', items: [
      { id: 'pos', label: 'Point of Sale', icon: 'point_of_sale' },
      { id: 'dashboard', label: 'Dashboard', icon: 'grid_view' }
    ]},
    { section: 'Billing & Trade', items: [
      { id: 'purchase-bills', label: 'Purchase Bills', icon: 'receipt_long' },
      { id: 'export-bills', label: 'Export Bills', icon: 'local_shipping' }
    ]},
    { section: 'Seafood Inventory', items: [
      { id: 'seafood-master', label: 'Seafood Master', icon: 'set_meal' },
      { id: 'daily-rates', label: 'Daily Rates', icon: 'show_chart' },
      { id: 'stock', label: 'Stock & Cold Store', icon: 'inventory_2' }
    ]},
    { section: 'People Registry', items: [
      { id: 'fishermen', label: 'Fishermen', icon: 'sailing' },
      { id: 'customers', label: 'Customers', icon: 'storefront' },
      { id: 'export-companies', label: 'Export Companies', icon: 'apartment' }
    ]},
    { section: 'Financial Ledger', items: [
      { id: 'expenses', label: 'Expenses', icon: 'payments' },
      { id: 'profit-and-loss', label: 'Profit & Loss', icon: 'query_stats' },
      { id: 'day-end', label: 'Day End Closing', icon: 'lock_clock' },
      { id: 'month-end', label: 'Month End Summary', icon: 'calendar_month' }
    ]},
    { section: 'Analytics & System', items: [
      { id: 'reports', label: 'Reports Hub', icon: 'bar_chart' },
      { id: 'settings', label: 'Settings', icon: 'settings' }
    ]}
  ];

  return `
    <aside class="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-primary-container z-40 flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.18)] select-none">
      <!-- Top Brand Header & Online Indicator -->
      <div class="flex flex-col flex-1 min-h-0">
        <div class="h-16 px-space-lg flex items-center gap-space-sm bg-primary border-b border-primary/40 shrink-0">
          <svg class="h-8 w-8 shrink-0" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="48" rx="8" fill="#0A2540"/>
            <path d="M12 28C16 18 26 14 36 20C30 22 26 27 24 34C20 32 16 32 12 28Z" fill="#14B8A6"/>
            <path d="M22 22C28 16 35 15 40 18C36 21 34 26 33 32C29 28 25 25 22 22Z" fill="#38BDF8" opacity="0.8"/>
            <circle cx="28" cy="22" r="2" fill="#FFFFFF"/>
            <path d="M14 36C20 34 28 36 34 32" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <div class="flex flex-col min-w-0">
            <span class="font-title-md text-title-md text-on-primary font-bold tracking-tight truncate">MARLIN SEA FOOD</span>
            <span class="font-label-caps text-label-caps text-secondary-fixed uppercase tracking-wider">Harbor Terminal ERP</span>
          </div>
        </div>

        <!-- Terminal Status Strip -->
        <div class="px-space-md py-space-sm">
          <div class="flex items-center justify-between px-space-sm py-1.5 bg-surface-container-lowest/10 rounded-md">
            <div class="flex items-center gap-space-xs">
              <span class="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse"></span>
              <span class="font-label-caps text-label-caps text-on-primary">${state.terminal}</span>
            </div>
            <span class="font-label-caps text-label-caps text-secondary-fixed font-bold">${state.cloudSync}</span>
          </div>
        </div>

        <!-- Scrollable Navigation Tree -->
        <nav class="flex-1 overflow-y-auto px-space-md py-space-xs flex flex-col gap-0.5">
          ${navItems.map(group => `
            ${group.section ? `
              <div class="pt-space-sm pb-1 px-space-sm">
                <span class="font-label-caps text-label-caps uppercase text-on-primary-container tracking-wider">${group.section}</span>
              </div>
            ` : ''}
            ${group.items.map(item => {
              const isActive = currentRoute === item.id;
              return `
                <button 
                  data-nav="${item.id}"
                  class="w-full flex items-center gap-space-md px-space-md py-2 rounded-lg transition-all text-left text-sm font-medium ${
                    isActive 
                      ? 'bg-primary text-secondary-fixed shadow-sm font-semibold' 
                      : 'text-primary-fixed-dim hover:bg-primary/50 hover:text-on-primary'
                  }"
                >
                  <span class="material-symbols-outlined text-[19px] shrink-0 ${isActive ? 'text-secondary-fixed' : 'text-primary-fixed-dim'}">${item.icon}</span>
                  <span class="truncate">${item.label}</span>
                </button>
              `;
            }).join('')}
          `).join('')}
        </nav>
      </div>

      <!-- Bottom User Profile & Shift Controls -->
      <div class="p-space-md bg-primary border-t border-primary/40 shrink-0">
        <div class="flex items-center justify-between p-space-sm bg-surface-container-lowest/5 rounded-lg mb-2">
          <div class="flex items-center gap-space-xs">
            <span class="material-symbols-outlined text-secondary-fixed text-[16px]">cloud_done</span>
            <span class="font-body-sm text-body-sm text-primary-fixed">Auto-Cloud Sync</span>
          </div>
          <span class="font-label-caps text-label-caps text-secondary-fixed">LIVE</span>
        </div>
        
        <div class="flex items-center justify-between pt-1">
          <div class="flex items-center gap-space-sm min-w-0">
            <div class="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-on-secondary text-[18px]">person</span>
            </div>
            <div class="flex flex-col min-w-0">
              <span class="font-title-md text-title-md text-on-primary truncate leading-tight">${state.user.name}</span>
              <span class="font-body-sm text-body-sm text-on-primary-container truncate">${state.user.role}</span>
            </div>
          </div>
          <button 
            data-action="logout-modal"
            class="p-1.5 text-primary-fixed-dim hover:text-error hover:bg-primary-container rounded-lg transition-colors shrink-0" 
            title="Logout / Change Shift"
          >
            <span class="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </div>
    </aside>
  `;
}
