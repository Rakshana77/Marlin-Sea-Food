import React, { useState } from 'react';
import { createExpense } from '../../api/expenses';
import { ApiError } from '../../api/client';
import { X, Check, Receipt, AlertCircle, Loader2 } from 'lucide-react';

interface ExpenseModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  onSuccess,
  onClose,
}) => {
  const [category, setCategory] = useState<string>('ICE');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'BANK_TRANSFER'>('CASH');
  const [recipient, setRecipient] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amtNum = parseFloat(amount);
    if (!amtNum || amtNum <= 0) {
      setErrorMessage('Expense amount must be greater than ₹0');
      return;
    }
    if (!recipient.trim()) {
      setErrorMessage('Recipient or worker name is required');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const todayIso = new Date().toISOString().split('T')[0];

    try {
      await createExpense({
        category,
        amount: amtNum.toFixed(2),
        paymentMethod,
        recipient: recipient.trim(),
        reference: reference.trim() || null,
        notes: notes.trim() || null,
        expenseDate: todayIso,
      });

      onSuccess();
      onClose();
    } catch (err) {
      const apiErr = err as ApiError;
      setErrorMessage(apiErr.message || 'Failed to record expense');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base sm:text-lg">Record Operational Expense</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto flex-1 flex flex-col gap-3">
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Expense Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Expense Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="ICE">Ice & Cold Storage</option>
              <option value="DIESEL_FUEL">Diesel / Boat Fuel</option>
              <option value="COOLIE_WAGES">Coolie / Daily Labor Wages</option>
              <option value="WORKER_WAGE">Worker Shift Wage</option>
              <option value="PACKING">Packing & Crates</option>
              <option value="LOADING_UNLOADING">Loading & Dock Unloading</option>
              <option value="TRANSPORT">Wholesale Transport / Reefer Freight</option>
              <option value="ELECTRICITY">Electricity & Refrigeration Power</option>
              <option value="MAINTENANCE">Equipment Maintenance</option>
              <option value="OTHER">Other Operating Expense</option>
            </select>
          </div>

          {/* Amount & Payment Method */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Amount (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1500.00"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold font-tabular focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="CASH">Cash Drawer</option>
                <option value="UPI">UPI Digital</option>
                <option value="BANK_TRANSFER">Bank IMPS</option>
              </select>
            </div>
          </div>

          {/* Recipient / Worker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Paid To (Recipient / Worker Name) *
            </label>
            <input
              type="text"
              required
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="e.g. Ice Plant Vendor #02 or Kumar (Coolie)"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Reference */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Slip / Voucher / UPI Ref (Optional)
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. Voucher #V-882"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Operational Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 50 blocks of crushed ice for morning consignment"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Recording Expense...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Record Expense (₹{amount || '0.00'})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
