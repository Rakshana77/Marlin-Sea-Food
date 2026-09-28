// ExpensesView Component - Harbor Operational Accounting
import { store } from '../state/store.js';
import { showToast } from '../components/Toast.js';

export function renderExpensesView() {
  const state = store.getState();
  const totalExpenses = state.expenses.reduce((acc, e) => acc + e.amount, 0);

  return `
    <div class="flex flex-col gap-space-md w-full max-w-[1720px] mx-auto pb-24 animate-fade-in select-none">
      
      <!-- Top Action Strip -->
      <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="font-headline-md text-headline-md text-primary font-bold tracking-tight">Harbor Expenses</h1>
            <span class="px-2 py-0.5 rounded-full bg-error-container text-on-error-container text-xs font-mono font-bold tabular-nums">
              Total: ₹${totalExpenses.toLocaleString('en-IN')}
            </span>
          </div>
          <p class="text-xs text-on-surface-variant">
            Dock ice, diesel bunkering, loading coolie wages, crate repairs, and daily operational overheads.
          </p>
        </div>

        <button 
          id="open-add-expense-btn"
          class="px-4 py-2 rounded-lg bg-primary text-white font-semibold text-xs shadow-sm hover:bg-primary-container active:scale-95 transition-all flex items-center gap-1.5"
        >
          <span class="material-symbols-outlined text-[18px] text-secondary-fixed">add</span>
          <span>+ Add Expense</span>
        </button>
      </div>

      <!-- Quick Category Summaries -->
      <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-space-sm">
        ${['Ice', 'Fuel', 'Labour', 'Packing', 'Electricity', 'Transport'].map(cat => {
          const catTotal = state.expenses.filter(e => e.category === cat).reduce((acc, e) => acc + e.amount, 0);
          return `
            <div class="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/50 shadow-xs flex flex-col">
              <span class="text-[10px] text-outline font-bold uppercase tracking-wider">${cat}</span>
              <span class="font-title-lg text-title-lg text-primary font-bold tabular-nums mt-0.5">₹${catTotal.toLocaleString('en-IN')}</span>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Expense Ledger Table -->
      <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm overflow-hidden flex flex-col">
        <div class="p-space-md border-b border-outline-variant/60 bg-white flex items-center justify-between">
          <h3 class="font-title-md text-title-md text-primary font-bold">Logged Expenditures</h3>
          <span class="text-xs text-outline font-mono">${state.expenses.length} Records</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-surface-container-low border-b border-outline-variant/60 text-outline font-label-caps uppercase tracking-wider">
                <th class="py-2.5 px-4">Date</th>
                <th class="py-2.5 px-3">Category</th>
                <th class="py-2.5 px-4">Description / Vendor</th>
                <th class="py-2.5 px-3 text-right">Amount (₹)</th>
                <th class="py-2.5 px-3 text-center">Payment Mode</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant/40">
              ${state.expenses.map(e => `
                <tr class="hover:bg-surface-container-low/30 transition-colors">
                  <td class="py-2.5 px-4 font-mono text-outline">${e.date}</td>
                  <td class="py-2.5 px-3">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-surface-container text-primary">
                      ${e.category}
                    </span>
                  </td>
                  <td class="py-2.5 px-4 font-medium text-primary">${e.description}</td>
                  <td class="py-2.5 px-3 text-right font-mono font-bold text-error tabular-nums">
                    ₹${e.amount.toLocaleString('en-IN')}
                  </td>
                  <td class="py-2.5 px-3 text-center font-mono text-outline">
                    ${e.method}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

export function bindExpensesEvents() {
  const container = document.getElementById('app');
  if (!container) return;

  const addBtn = container.querySelector('#open-add-expense-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const category = prompt("Expense Category (Ice, Fuel, Packing, Labour, Electricity, Transport, Other):", "Ice");
      if (!category) return;
      const description = prompt("Description / Paid to:");
      if (!description) return;
      const amount = prompt("Amount in ₹:");
      if (!amount || isNaN(amount)) return;

      store.addExpense({ category, description, amount });
      showToast(`Expense of ₹${amount} recorded under ${category}.`, 'success');
    });
  }
}
