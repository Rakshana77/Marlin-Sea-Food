// ExpensesView Component - Harbor Operational Accounting & Salary Ledger
import { store } from '../state/store.js';
import { showToast } from '../components/Toast.js';

const EXPENSE_CATEGORIES = [
  'Ice',
  'Fuel',
  'Labour',
  'Packing',
  'Transport',
  'Salary',
  'Cold Storage',
  'Loading / Unloading',
  'Market Fees',
  'Vehicle Maintenance',
  'Other'
];

export function renderExpensesView() {
  const state = store.getState();
  const totalExpenses = state.expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const salaryExpenses = state.expenses.filter(e => e.category === 'Salary').reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const operationalNonSalary = totalExpenses - salaryExpenses;

  return `
    <div class="flex flex-col gap-space-md w-full max-w-[1720px] mx-auto pb-24 animate-fade-in select-none">
      
      <!-- Top Action Strip -->
      <div class="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="font-headline-md text-headline-md text-primary font-bold tracking-tight">Harbor Operational Expenses</h1>
            <span class="px-2.5 py-0.5 rounded-full bg-error-container text-on-error-container text-xs font-mono font-bold tabular-nums">
              Total: ₹${totalExpenses.toLocaleString('en-IN')}
            </span>
            <span class="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 text-xs font-mono font-bold tabular-nums">
              Staff Salary: ₹${salaryExpenses.toLocaleString('en-IN')}
            </span>
          </div>
          <p class="text-xs text-on-surface-variant mt-1">
            Dock ice, diesel bunkering, loading coolie wages, transport, crate repairs, and staff salaries.
          </p>
        </div>

        <button 
          id="open-add-expense-btn"
          class="px-4 py-2.5 rounded-lg bg-primary text-white font-semibold text-xs shadow-sm hover:bg-primary-container active:scale-95 transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span class="material-symbols-outlined text-[18px] text-secondary-fixed">add_circle</span>
          <span>+ Record Harbor Expense</span>
        </button>
      </div>

      <!-- Business Accounting Banner -->
      <div class="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 flex items-center gap-3">
        <span class="material-symbols-outlined text-amber-600 text-2xl flex-shrink-0">account_balance_wallet</span>
        <div class="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
          <strong class="font-bold">Financial Rule:</strong> 
          Staff and worker salaries are strictly classified as <strong class="font-bold">Operating Expenses</strong>. 
          Salary payments affect harbor operational overheads and net profit, but do <strong class="font-bold">NOT</strong> affect seafood stock or inventory kilograms.
        </div>
      </div>

      <!-- Quick Category Summaries -->
      <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-space-sm">
        ${['Ice', 'Fuel', 'Labour', 'Salary', 'Packing', 'Transport'].map(cat => {
          const catTotal = state.expenses.filter(e => e.category === cat).reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
          const isSalary = cat === 'Salary';
          return `
            <div class="bg-surface-container-lowest p-3 rounded-lg border ${isSalary ? 'border-primary/40 bg-primary/5' : 'border-outline-variant/50'} shadow-xs flex flex-col">
              <div class="flex items-center justify-between">
                <span class="text-[10px] text-outline font-bold uppercase tracking-wider">${cat}</span>
                ${isSalary ? '<span class="material-symbols-outlined text-[14px] text-primary">badge</span>' : ''}
              </div>
              <span class="font-title-lg text-title-lg ${isSalary ? 'text-primary' : 'text-on-surface'} font-bold tabular-nums mt-0.5">₹${catTotal.toLocaleString('en-IN')}</span>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Expense Ledger Table -->
      <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm overflow-hidden flex flex-col">
        <div class="p-space-md border-b border-outline-variant/60 bg-white dark:bg-surface-container-low flex items-center justify-between">
          <div class="flex items-center gap-2">
            <h3 class="font-title-md text-title-md text-primary font-bold">Harbor Expense Ledger</h3>
            <span class="text-xs text-outline font-mono">(${state.expenses.length} Entries)</span>
          </div>
          <div class="text-xs text-outline font-mono">
            Operating: ₹${operationalNonSalary.toLocaleString('en-IN')} | Salaries: ₹${salaryExpenses.toLocaleString('en-IN')}
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-surface-container-low border-b border-outline-variant/60 text-outline font-label-caps uppercase tracking-wider">
                <th class="py-2.5 px-4">Date</th>
                <th class="py-2.5 px-3">Category</th>
                <th class="py-2.5 px-4">Description / Beneficiary</th>
                <th class="py-2.5 px-3 text-right">Amount (₹)</th>
                <th class="py-2.5 px-3 text-center">Payment Mode</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant/40">
              ${state.expenses.length === 0 ? `
                <tr>
                  <td colspan="5" class="py-8 text-center text-outline">No expenses recorded for today.</td>
                </tr>
              ` : state.expenses.map(e => {
                const isSalary = e.category === 'Salary';
                return `
                  <tr class="hover:bg-surface-container-low/30 transition-colors ${isSalary ? 'bg-primary/5 font-medium' : ''}">
                    <td class="py-2.5 px-4 font-mono text-outline">${e.date}</td>
                    <td class="py-2.5 px-3">
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        isSalary 
                          ? 'bg-primary text-white' 
                          : 'bg-surface-container text-primary'
                      }">
                        ${isSalary ? '<span class="material-symbols-outlined text-[11px]">badge</span>' : ''}
                        ${e.category}
                      </span>
                    </td>
                    <td class="py-2.5 px-4 font-medium text-primary">
                      ${e.description}
                      ${e.employeeName ? `<span class="block text-[11px] text-outline font-normal">Employee: ${e.employeeName}</span>` : ''}
                    </td>
                    <td class="py-2.5 px-3 text-right font-mono font-bold text-error tabular-nums">
                      ₹${Number(e.amount).toLocaleString('en-IN')}
                    </td>
                    <td class="py-2.5 px-3 text-center font-mono text-outline">
                      ${e.method || 'Cash'}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add Expense Modal Container -->
      <div id="expense-modal-container" class="hidden"></div>
    </div>
  `;
}

export function bindExpensesEvents() {
  const container = document.getElementById('app');
  if (!container) return;

  const addBtn = container.querySelector('#open-add-expense-btn');
  const modalContainer = container.querySelector('#expense-modal-container');

  if (addBtn && modalContainer) {
    addBtn.addEventListener('click', () => {
      openAddExpenseModal(modalContainer);
    });
  }
}

function openAddExpenseModal(modalContainer) {
  const todayDate = store.getState().date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  modalContainer.innerHTML = `
    <div class="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        
        <!-- Header -->
        <div class="p-4 border-b border-outline-variant/60 flex items-center justify-between bg-surface-container-low">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-xl">payments</span>
            <h3 class="font-title-md font-bold text-primary">Record Operational Expense</h3>
          </div>
          <button id="close-expense-modal" class="p-1 rounded-full hover:bg-surface-container text-outline">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Form Body -->
        <form id="expense-record-form" class="p-5 flex flex-col gap-4">
          
          <!-- Category -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Expense Category</label>
            <select id="expense-category-select" class="w-full px-3 py-2 text-sm rounded-lg border border-outline-variant/80 bg-white dark:bg-surface-container focus:border-primary outline-hidden" required>
              ${EXPENSE_CATEGORIES.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
            </select>
          </div>

          <!-- Dynamic Salary Employee Notice -->
          <div id="salary-notice" class="hidden p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs">
            <div class="flex items-center gap-1.5 font-bold mb-1">
              <span class="material-symbols-outlined text-[16px] text-blue-700">info</span>
              <span>Salary Accounting Rule</span>
            </div>
            Salary is recorded as an operational overhead expense. It does NOT affect seafood stock or inventory kilograms.
          </div>

          <!-- Employee Name (shown if Salary) -->
          <div id="employee-field-group" class="hidden flex flex-col gap-1.5">
            <label class="text-xs font-bold text-primary uppercase tracking-wider">Employee / Worker Name</label>
            <input 
              type="text" 
              id="expense-employee-name" 
              placeholder="e.g. Manikandan (Weighing Master) / Selvam (Driver)" 
              class="w-full px-3 py-2 text-sm rounded-lg border border-primary/50 bg-white dark:bg-surface-container focus:border-primary outline-hidden"
            />
          </div>

          <!-- Description / Vendor / Purpose -->
          <div class="flex flex-col gap-1.5">
            <label id="desc-label" class="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Description / Paid To</label>
            <input 
              type="text" 
              id="expense-description" 
              placeholder="e.g. Morning ice delivery (40 blocks) from Kasimedu Ice Plant" 
              class="w-full px-3 py-2 text-sm rounded-lg border border-outline-variant/80 bg-white dark:bg-surface-container focus:border-primary outline-hidden"
              required 
            />
          </div>

          <!-- Amount & Payment Method -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Amount (₹)</label>
              <input 
                type="number" 
                id="expense-amount" 
                min="1" 
                step="1" 
                placeholder="₹ 0" 
                class="w-full px-3 py-2 text-sm font-mono font-bold text-error rounded-lg border border-outline-variant/80 bg-white dark:bg-surface-container focus:border-primary outline-hidden"
                required 
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Payment Mode</label>
              <select id="expense-payment-mode" class="w-full px-3 py-2 text-sm rounded-lg border border-outline-variant/80 bg-white dark:bg-surface-container focus:border-primary outline-hidden">
                <option value="Cash">Cash</option>
                <option value="UPI">UPI / GPay</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          <!-- Date -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Transaction Date</label>
            <input 
              type="text" 
              id="expense-date" 
              value="${todayDate}" 
              class="w-full px-3 py-2 text-sm font-mono rounded-lg border border-outline-variant/80 bg-surface-container-low text-on-surface outline-hidden" 
              readonly 
            />
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/40 mt-1">
            <button 
              type="button" 
              id="cancel-expense-btn" 
              class="px-4 py-2 rounded-lg border border-outline-variant text-xs font-bold text-outline hover:bg-surface-container"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              id="save-expense-btn" 
              class="px-5 py-2 rounded-lg bg-primary text-white text-xs font-bold shadow-sm hover:bg-primary-container active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span class="material-symbols-outlined text-[16px]">check</span>
              <span id="save-expense-text">Save Expense</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  `;

  modalContainer.classList.remove('hidden');

  const categorySelect = modalContainer.querySelector('#expense-category-select');
  const employeeGroup = modalContainer.querySelector('#employee-field-group');
  const employeeInput = modalContainer.querySelector('#expense-employee-name');
  const salaryNotice = modalContainer.querySelector('#salary-notice');
  const descLabel = modalContainer.querySelector('#desc-label');
  const descInput = modalContainer.querySelector('#expense-description');
  const closeBtn = modalContainer.querySelector('#close-expense-modal');
  const cancelBtn = modalContainer.querySelector('#cancel-expense-btn');
  const form = modalContainer.querySelector('#expense-record-form');
  const submitBtn = modalContainer.querySelector('#save-expense-btn');
  const submitText = modalContainer.querySelector('#save-expense-text');

  const updateCategoryUI = () => {
    if (categorySelect.value === 'Salary') {
      employeeGroup.classList.remove('hidden');
      salaryNotice.classList.remove('hidden');
      employeeInput.setAttribute('required', 'true');
      descLabel.textContent = 'Designation / Month / Notes';
      descInput.placeholder = 'e.g. Month of September 2026 dock wage settlement';
    } else {
      employeeGroup.classList.add('hidden');
      salaryNotice.classList.add('hidden');
      employeeInput.removeAttribute('required');
      descLabel.textContent = 'Description / Paid To';
      descInput.placeholder = 'e.g. Morning ice delivery (40 blocks)';
    }
  };

  categorySelect.addEventListener('change', updateCategoryUI);

  const closeModal = () => {
    modalContainer.classList.add('hidden');
    modalContainer.innerHTML = '';
  };

  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const category = categorySelect.value;
    const amount = Number(modalContainer.querySelector('#expense-amount').value);
    const method = modalContainer.querySelector('#expense-payment-mode').value;
    const date = modalContainer.querySelector('#expense-date').value;
    const employeeName = employeeInput.value.trim();
    let description = descInput.value.trim();

    if (!amount || isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid expense amount.', 'error');
      return;
    }

    if (category === 'Salary' && !employeeName) {
      showToast('Please specify the employee name for salary expenses.', 'error');
      return;
    }

    if (category === 'Salary' && employeeName) {
      description = `Salary: ${employeeName} - ${description}`;
    }

    // Double submission protection
    submitBtn.disabled = true;
    submitText.textContent = 'Saving Expense...';

    setTimeout(() => {
      store.addExpense({
        category,
        description,
        amount,
        method,
        employeeName: category === 'Salary' ? employeeName : undefined,
        date
      });

      showToast(`Recorded ₹${amount.toLocaleString('en-IN')} under ${category}.`, 'success');
      closeModal();
      
      // Re-render
      const app = document.getElementById('app');
      if (app) {
        app.innerHTML = renderExpensesView();
        bindExpensesEvents();
      }
    }, 400);
  });
}
