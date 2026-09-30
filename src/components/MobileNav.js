// MobileBottomNav Component - Sticky Bottom Navigation & FAB
export function renderMobileNav(currentRoute) {
  const tabs = [
    { id: 'pos', label: 'POS', icon: 'point_of_sale' },
    { id: 'dashboard', label: 'Dashboard', icon: 'grid_view' },
    { id: 'purchase-bills', label: 'Billing', icon: 'receipt_long' },
    { id: 'daily-rates', label: 'Rates', icon: 'show_chart' },
    { id: 'more', label: 'More', icon: 'apps' }
  ];

  return `
    <!-- Floating Action Button (FAB) for Mobile -->
    <div class="lg:hidden fixed bottom-18 right-4 z-40">
      <button 
        data-action="open-create-bill-sheet"
        class="flex items-center gap-2 px-4 py-3 rounded-full bg-secondary-marine text-white font-title-md shadow-lg hover:opacity-95 active:scale-95 transition-all"
      >
        <span class="material-symbols-outlined text-[20px]">add</span>
        <span class="text-sm font-semibold tracking-wide">+ Create Bill</span>
      </button>
    </div>

    <!-- Fixed Bottom Navigation Bar -->
    <nav class="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface-container-lowest border-t border-outline-variant shadow-[0_-2px_10px_rgba(0,0,0,0.06)] z-30 flex items-center justify-around px-2 select-none">
      ${tabs.map(tab => {
        const isActive = currentRoute === tab.id || (tab.id === 'more' && ['fishermen', 'customers', 'export-companies', 'expenses', 'profit-and-loss', 'day-end', 'reports', 'settings'].includes(currentRoute));
        return `
          <button 
            data-nav="${tab.id}"
            class="flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
              isActive ? 'text-secondary-marine font-bold' : 'text-outline hover:text-on-surface'
            }"
          >
            <span class="material-symbols-outlined text-[22px]">${tab.icon}</span>
            <span class="text-[11px] mt-0.5 tracking-tight">${tab.label}</span>
          </button>
        `;
      }).join('')}
    </nav>
  `;
}
