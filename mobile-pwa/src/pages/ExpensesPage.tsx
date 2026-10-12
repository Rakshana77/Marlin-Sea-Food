import React, { useState, useEffect } from 'react';
import { getExpenses, createExpense, createWorkerWage, cancelExpense } from '../api/expenses';
import { Expense } from '../types/models';
import { useAuth } from '../hooks/useAuth';
import { 
  Receipt, 
  Plus, 
  Search, 
  Calendar, 
  RefreshCw, 
  Loader2, 
  X, 
  Check, 
  AlertCircle,
  Users,
  DollarSign,
  Fuel,
  Truck,
  Box,
  Ban
} from 'lucide-react';

export const ExpensesPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [modalMode, setModalMode] = useState<'expense' | 'wage' | null>(null);
  const [cancellingExpenseId, setCancellingExpenseId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // General Expense Form States
  const [formCategory, setFormCategory] = useState<string>('ICE');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formPaymentMethod, setFormPaymentMethod] = useState<'CASH' | 'UPI' | 'BANK_TRANSFER'>('CASH');
  const [formRecipient, setFormRecipient] = useState<string>('');
  const [formReference, setFormReference] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Worker Wage Form State
  const [wageWorkerName, setWageWorkerName] = useState<string>('');

  const loadExpenses = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    try {
      const data = await getExpenses({
        date: selectedDate || undefined,
        category: categoryFilter || undefined,
        limit: 100,
      });
      setExpenses(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load expense vouchers');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [selectedDate, categoryFilter]);

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(formAmount);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!formRecipient.trim()) {
      setError('Recipient name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await createExpense({
        category: formCategory,
        amount: amt.toFixed(2),
        paymentMethod: formPaymentMethod,
        recipient: formRecipient.trim(),
        reference: formReference.trim() || undefined,
        notes: formNotes.trim() || undefined,
        expenseDate: formDate,
      });
      setSuccessMsg(`Expense voucher recorded for ₹${amt.toFixed(2)} (${formCategory})`);
      setModalMode(null);
      resetForms();
      loadExpenses(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to record expense voucher');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(formAmount);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!wageWorkerName.trim()) {
      setError('Worker name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await createWorkerWage({
        workerName: wageWorkerName.trim(),
        amount: amt.toFixed(2),
        paymentMethod: formPaymentMethod,
        notes: formNotes.trim() || undefined,
        expenseDate: formDate,
      });
      setSuccessMsg(`Worker wage recorded for ₹${amt.toFixed(2)} (${wageWorkerName})`);
      setModalMode(null);
      resetForms();
      loadExpenses(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to record wage voucher');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelExpense = async (id: string) => {
    const reason = window.prompt('Please provide a cancellation reason:');
    if (reason === null) return;
    setCancellingExpenseId(id);
    setError(null);
    try {
      await cancelExpense(id, reason || 'Mistaken voucher entry');
      setSuccessMsg('Expense voucher cancelled successfully');
      loadExpenses(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to cancel expense');
    } finally {
      setCancellingExpenseId(null);
    }
  };

  const resetForms = () => {
    setFormAmount('');
    setFormRecipient('');
    setFormReference('');
    setFormNotes('');
    setWageWorkerName('');
  };

  // Summaries
  const activeExpenses = expenses.filter(e => e.status !== 'CANCELLED');
  const totalOpex = activeExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const workerWagesTotal = activeExpenses
    .filter(e => e.category === 'WORKER_WAGE' || e.category === 'COOLIE_WAGES' || e.category === 'SALARY')
    .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const cashOpexTotal = activeExpenses
    .filter(e => e.paymentMethod === 'CASH')
    .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const upiBankOpexTotal = totalOpex - cashOpexTotal;

  const filteredExpenses = expenses.filter(e => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      e.recipient?.toLowerCase().includes(q) ||
      e.expenseNumber?.toLowerCase().includes(q) ||
      e.category?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-24 md:pb-8 flex flex-col gap-4">
      {/* Top Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Operational Expenditures
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Operating Expenses & Worker Wages
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Issue vouchers for dock ice, fuel, coolie wages, transport freight, and packing materials
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-xl px-3 py-1.5 border border-slate-200 text-xs font-semibold text-slate-700">
            <Calendar className="w-4 h-4 text-slate-500 mr-2" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => loadExpenses(true)}
            disabled={isRefreshing}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors"
            title="Refresh Expenses"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`} />
          </button>

          {isAdmin && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => { resetForms(); setModalMode('wage'); }}
                className="px-3.5 py-2.5 bg-indigo-700 hover:bg-indigo-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Users className="w-4 h-4" />
                <span>+ Worker Wage</span>
              </button>

              <button
                onClick={() => { resetForms(); setModalMode('expense'); }}
                className="px-3.5 py-2.5 bg-amber-700 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Record Opex</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Operating Outflow</span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1">
            ₹{totalOpex.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">{activeExpenses.length} active vouchers</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-800">Worker Wages Paid</span>
          <div className="text-xl sm:text-2xl font-black text-indigo-900 font-mono mt-1">
            ₹{workerWagesTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-indigo-600 mt-0.5">Coolie, cutting & wharf wages</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Cash Petty Outflow</span>
          <div className="text-xl sm:text-2xl font-black text-emerald-900 font-mono mt-1">
            ₹{cashOpexTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-emerald-600 mt-0.5">Deducted from daily drawer cash</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-800">UPI / Bank Transfers</span>
          <div className="text-xl sm:text-2xl font-black text-blue-900 font-mono mt-1">
            ₹{upiBankOpexTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-blue-600 mt-0.5">Electronic payments</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: '', label: 'All Categories' },
            { id: 'WORKER_WAGE', label: 'Worker Wages' },
            { id: 'ICE', label: 'Ice' },
            { id: 'DIESEL_FUEL', label: 'Diesel / Fuel' },
            { id: 'COOLIE_WAGES', label: 'Coolie' },
            { id: 'TRANSPORT', label: 'Transport' },
            { id: 'PACKING', label: 'Packaging' },
            { id: 'MAINTENANCE', label: 'Maintenance' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                categoryFilter === cat.id
                  ? 'bg-amber-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search recipient or voucher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
          />
        </div>
      </div>

      {/* Vouchers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            <span className="text-xs font-semibold">Loading expense vouchers...</span>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No expenses found for {selectedDate}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Voucher #</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Recipient / Worker</th>
                  <th className="py-3 px-3">Payment Mode</th>
                  <th className="py-3 px-3 text-right">Amount (₹)</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((exp) => {
                  const isCancelled = exp.status === 'CANCELLED';

                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {exp.expenseNumber}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold border border-amber-200 text-[11px]">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {exp.recipient}
                        {exp.notes && (
                          <span className="block text-[11px] text-slate-400 font-normal truncate max-w-xs">{exp.notes}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-600">
                        {exp.paymentMethod}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-slate-900 text-sm">
                        ₹{parseFloat(exp.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          isCancelled
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {exp.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isAdmin && !isCancelled && (
                          <button
                            onClick={() => handleCancelExpense(exp.id)}
                            disabled={cancellingExpenseId === exp.id}
                            className="px-2.5 py-1 text-[11px] text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg font-bold transition-colors disabled:opacity-50"
                          >
                            {cancellingExpenseId === exp.id ? 'Voiding...' : 'Void'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Record General Expense */}
      {modalMode === 'expense' && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Issue Operating Expense Voucher</h3>
              <button onClick={() => setModalMode(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleExpenseSubmit} className="p-5 flex flex-col gap-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Expense Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold bg-white"
                  >
                    <option value="ICE">ICE</option>
                    <option value="DIESEL_FUEL">DIESEL / FUEL</option>
                    <option value="COOLIE_WAGES">COOLIE WAGES</option>
                    <option value="PACKING">PACKING / CRATES</option>
                    <option value="ELECTRICITY">ELECTRICITY</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="TRANSPORT">TRANSPORT FREIGHT</option>
                    <option value="OTHER">OTHER OPEX</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Recipient / Supplier / Vendor <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formRecipient}
                  onChange={(e) => setFormRecipient(e.target.value)}
                  placeholder="e.g. Ramesh Ice Plant / Dock Fuel Station"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold bg-white"
                  >
                    <option value="CASH">CASH (Drawer)</option>
                    <option value="UPI">UPI / QR</option>
                    <option value="BANK_TRANSFER">BANK TRANSFER</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Voucher Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Bill / Reference Number</label>
                <input
                  type="text"
                  value={formReference}
                  onChange={(e) => setFormReference(e.target.value)}
                  placeholder="Vendor Bill #4092"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="15 blocks of ice for reefer precooling..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-700 hover:bg-amber-600 active:scale-95 text-white font-bold shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Issue Voucher</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Worker Wage */}
      {modalMode === 'wage' && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Record Worker Wage Voucher</h3>
              <button onClick={() => setModalMode(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleWageSubmit} className="p-5 flex flex-col gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Worker / Coolie Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={wageWorkerName}
                  onChange={(e) => setWageWorkerName(e.target.value)}
                  placeholder="e.g. Murugan (Wharf Porter)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Wage Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold bg-white"
                  >
                    <option value="CASH">CASH (Daily Cash)</option>
                    <option value="UPI">UPI</option>
                    <option value="BANK_TRANSFER">BANK TRANSFER</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Work Description / Shift</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Dock unloading shift, crab grading, reefer packing coolie..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-600 active:scale-95 text-white font-bold shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Issue Wage Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
