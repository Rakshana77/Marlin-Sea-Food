// Main Application Entry & Dynamic Router
import { store } from './state/store.js';
import { renderSidebar } from './components/Sidebar.js';
import { renderHeader } from './components/Header.js';
import { renderMobileNav } from './components/MobileNav.js';
import { openOmniSearchModal } from './components/OmniSearchModal.js';
import { showToast } from './components/Toast.js';

// Views
import { renderDashboardView, bindDashboardEvents } from './views/DashboardView.js';
import { renderPurchaseBillingView, bindPurchaseBillingEvents } from './views/PurchaseBillingView.js';
import { renderExportBillingView, bindExportBillingEvents } from './views/ExportBillingView.js';
import { renderDailyRatesView, bindDailyRatesEvents } from './views/DailyRatesView.js';
import { renderFishermenView, bindFishermenEvents } from './views/FishermenView.js';
import { renderSeafoodMasterView, bindSeafoodMasterEvents } from './views/SeafoodMasterView.js';
import { renderStockView } from './views/StockView.js';
import { renderExpensesView, bindExpensesEvents } from './views/ExpensesView.js';
import { renderProfitAndLossView } from './views/ProfitAndLossView.js';
import { renderDayEndView, bindDayEndEvents } from './views/DayEndView.js';
import { renderMonthEndView, bindMonthEndEvents } from './views/MonthEndView.js';
import { renderReportsView, bindReportsEvents } from './views/ReportsView.js';
import { renderCustomersView, bindCustomersEvents } from './views/CustomersView.js';
import { renderExportCompaniesView, bindExportCompaniesEvents } from './views/ExportCompaniesView.js';
import { renderSettingsView, bindSettingsEvents } from './views/SettingsView.js';
import { renderPosView, bindPosEvents } from './views/PosView.js';

function renderApp() {
  const app = document.getElementById('app');
  if (!app) return;

  const state = store.getState();
  const route = state.currentRoute;

  // View mapping
  const viewRenderers = {
    'pos': { render: renderPosView, bind: bindPosEvents },
    'pos-terminal': { render: renderPosView, bind: bindPosEvents },
    'dashboard': { render: renderDashboardView, bind: bindDashboardEvents },
    'purchase-bills': { render: renderPurchaseBillingView, bind: bindPurchaseBillingEvents },
    'export-bills': { render: renderExportBillingView, bind: bindExportBillingEvents },
    'daily-rates': { render: renderDailyRatesView, bind: bindDailyRatesEvents },
    'fishermen': { render: renderFishermenView, bind: bindFishermenEvents },
    'seafood-master': { render: renderSeafoodMasterView, bind: bindSeafoodMasterEvents },
    'stock': { render: renderStockView, bind: null },
    'expenses': { render: renderExpensesView, bind: bindExpensesEvents },
    'profit-and-loss': { render: renderProfitAndLossView, bind: null },
    'day-end': { render: renderDayEndView, bind: bindDayEndEvents },
    'month-end': { render: renderMonthEndView, bind: bindMonthEndEvents },
    'reports': { render: renderReportsView, bind: bindReportsEvents },
    'customers': { render: renderCustomersView, bind: bindCustomersEvents },
    'export-companies': { render: renderExportCompaniesView, bind: bindExportCompaniesEvents },
    'settings': { render: renderSettingsView, bind: bindSettingsEvents }
  };

  const activeRenderer = viewRenderers[route] || viewRenderers['dashboard'];

  app.innerHTML = `
    <!-- Desktop Left Sidebar -->
    ${renderSidebar(route)}

    <!-- Top Fixed Header -->
    ${renderHeader(route)}

    <!-- Mobile Slide-out Drawer Container -->
    <div id="mobile-drawer" class="fixed inset-0 z-50 bg-primary-container/80 backdrop-blur-sm hidden animate-fade-in lg:hidden">
      <div class="w-72 h-full bg-primary-container p-4 flex flex-col justify-between shadow-2xl">
        <div class="flex items-center justify-between pb-4 border-b border-primary/40">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-secondary-fixed text-[24px]">anchor</span>
            <span class="font-title-md text-white font-bold">Marlin Sea Food</span>
          </div>
          <button id="close-drawer-btn" class="p-1 text-primary-fixed-dim hover:text-white">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <nav class="flex-1 overflow-y-auto py-3 flex flex-col gap-1">
          <button data-nav="pos" class="w-full text-left py-2 px-3 rounded-lg text-sm text-secondary-fixed bg-primary font-bold flex items-center gap-2">
            <span class="material-symbols-outlined text-[18px]">point_of_sale</span>
            <span>Point of Sale</span>
          </button>
          <button data-nav="dashboard" class="w-full text-left py-2 px-3 rounded-lg text-sm text-primary-fixed-dim hover:text-white">Dashboard</button>
          <button data-nav="purchase-bills" class="w-full text-left py-2 px-3 rounded-lg text-sm text-primary-fixed-dim hover:text-white">Purchase Bills</button>
          <button data-nav="export-bills" class="w-full text-left py-2 px-3 rounded-lg text-sm text-primary-fixed-dim hover:text-white">Export Bills</button>
          <button data-nav="daily-rates" class="w-full text-left py-2 px-3 rounded-lg text-sm text-primary-fixed-dim hover:text-white">Daily Rates</button>
          <button data-nav="seafood-master" class="w-full text-left py-2 px-3 rounded-lg text-sm text-primary-fixed-dim hover:text-white">Seafood Master</button>
          <button data-nav="stock" class="w-full text-left py-2 px-3 rounded-lg text-sm text-primary-fixed-dim hover:text-white">Stock & Cold Store</button>
          <button data-nav="fishermen" class="w-full text-left py-2 px-3 rounded-lg text-sm text-primary-fixed-dim hover:text-white">Fishermen</button>
          <button data-nav="customers" class="w-full text-left py-2 px-3 rounded-lg text-sm text-primary-fixed-dim hover:text-white">Customers</button>
          <button data-nav="export-companies" class="w-full text-left py-2 px-3 rounded-lg text-sm text-primary-fixed-dim hover:text-white">Export Companies</button>
          <button data-nav="expenses" class="w-full text-left py-2 px-3 rounded-lg text-sm text-primary-fixed-dim hover:text-white">Expenses</button>
          <button data-nav="profit-and-loss" class="w-full text-left py-2 px-3 rounded-lg text-sm text-primary-fixed-dim hover:text-white">Profit & Loss</button>
          <button data-nav="day-end" class="w-full text-left py-2 px-3 rounded-lg text-sm text-primary-fixed-dim hover:text-white">Day End Closing</button>
          <button data-nav="reports" class="w-full text-left py-2 px-3 rounded-lg text-sm text-primary-fixed-dim hover:text-white">Reports</button>
          <button data-nav="settings" class="w-full text-left py-2 px-3 rounded-lg text-sm text-primary-fixed-dim hover:text-white">Settings</button>
        </nav>
        <div class="pt-3 border-t border-primary/40 text-xs text-primary-fixed-dim">
          ${state.terminal} &bull; ${state.date}
        </div>
      </div>
    </div>

    <!-- Main Workspace -->
    <main class="flex-1 lg:pl-64 pt-20 px-space-md lg:px-space-lg w-full min-h-screen bg-surface">
      ${activeRenderer.render()}
    </main>

    <!-- Mobile Fixed Bottom Navigation -->
    ${renderMobileNav(route)}
  `;

  // Bind active view events
  if (activeRenderer.bind) {
    activeRenderer.bind();
  }

  // Bind Global Navigation Clicks
  app.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const targetRoute = el.dataset.nav;
      if (targetRoute === 'more') {
        const drawer = document.getElementById('mobile-drawer');
        if (drawer) drawer.classList.remove('hidden');
      } else {
        const drawer = document.getElementById('mobile-drawer');
        if (drawer) drawer.classList.add('hidden');
        store.navigate(targetRoute);
      }
    });
  });

  // Mobile Drawer toggles
  const menuBtn = app.querySelector('#mobile-menu-btn');
  const drawer = app.querySelector('#mobile-drawer');
  const closeDrawerBtn = app.querySelector('#close-drawer-btn');

  if (menuBtn && drawer) {
    menuBtn.addEventListener('click', () => drawer.classList.remove('hidden'));
  }
  if (closeDrawerBtn && drawer) {
    closeDrawerBtn.addEventListener('click', () => drawer.classList.add('hidden'));
    drawer.addEventListener('click', (e) => {
      if (e.target === drawer) drawer.classList.add('hidden');
    });
  }

  // Global OmniSearch Trigger
  app.querySelectorAll('[data-action="open-omni-search"]').forEach(btn => {
    btn.addEventListener('click', () => openOmniSearchModal());
  });

  // Mobile FAB Create Bill Sheet
  app.querySelectorAll('[data-action="open-create-bill-sheet"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const choice = confirm("Create Purchase Bill? Click OK for Purchase Bill, or Cancel for Export Bill.");
      if (choice) {
        store.navigate('purchase-bills');
      } else {
        store.navigate('export-bills');
      }
    });
  });
}

// Global Keyboard Shortcuts
window.addEventListener('keydown', (e) => {
  // [⌘K] or [Ctrl+K] -> OmniSearch
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    openOmniSearchModal();
  }
  // [Esc] -> Close any modal
  if (e.key === 'Escape') {
    const modals = document.querySelectorAll('#modal-root > div, #mobile-drawer');
    modals.forEach(m => m.remove ? m.remove() : m.classList.add('hidden'));
  }
});

// Subscribe to store updates
store.subscribe(() => {
  renderApp();
});

// Initial boot
renderApp();
