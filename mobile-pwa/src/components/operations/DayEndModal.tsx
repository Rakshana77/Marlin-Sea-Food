import React, { useState, useEffect } from 'react';
import { DayEndPreview } from '../../types/models';
import { getDayEndPreview, closeBusinessDay } from '../../api/dayEnd';
import { ApiError } from '../../api/client';
import { X, Check, Lock, AlertCircle, Loader2, DollarSign, Package } from 'lucide-react';

interface DayEndModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

export const DayEndModal: React.FC<DayEndModalProps> = ({
  onSuccess,
  onClose,
}) => {
  const todayIso = new Date().toISOString().split('T')[0];
  const [date] = useState<string>(todayIso);
  const [preview, setPreview] = useState<DayEndPreview | null>(null);

  const [actualPhysicalCash, setActualPhysicalCash] = useState<string>('');
  const [actualPhysicalStockKg, setActualPhysicalStockKg] = useState<string>('');
  const [varianceReason, setVarianceReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getDayEndPreview(date)
      .then((data) => {
        if (active) {
          setPreview(data);
          setActualPhysicalCash(data.cash.expectedCash);
          setActualPhysicalStockKg(data.stock.expectedClosingStockKg);
        }
      })
      .catch((err) => {
        if (active) {
          const apiErr = err as ApiError;
          setErrorMessage(apiErr.message || 'Failed to fetch day-end preview');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [date]);

  const expectedCashNum = parseFloat(preview?.cash?.expectedCash || '0');
  const actualCashNum = parseFloat(actualPhysicalCash) || expectedCashNum;
  const cashVariance = (actualCashNum - expectedCashNum).toFixed(2);

  const expectedStockNum = parseFloat(preview?.stock?.expectedClosingStockKg || '0');
  const actualStockNum = parseFloat(actualPhysicalStockKg) || expectedStockNum;
  const stockVariance = (actualStockNum - expectedStockNum).toFixed(3);

  const handleCloseDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm('Are you sure you want to CLOSE the business day? Once closed, further financial mutations for today will be locked.')) {
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      await closeBusinessDay(date, {
        actualPhysicalCash: actualCashNum.toFixed(2),
        actualPhysicalStockKg: actualStockNum.toFixed(3),
        varianceReason: varianceReason.trim() || null,
        notes: notes.trim() || null,
      });

      onSuccess();
      onClose();
    } catch (err) {
      const apiErr = err as ApiError;
      setErrorMessage(apiErr.message || 'Failed to close business day');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base sm:text-lg">Day End Preview & Close ({date})</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleCloseDay} className="p-4 overflow-y-auto flex-1 flex flex-col gap-3">
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex items-center justify-center text-slate-400 text-xs">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading authoritative day-end preview...
            </div>
          ) : !preview ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No preview data available for {date}.
            </div>
          ) : (
            <>
              {preview.isClosed && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-800 font-semibold flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-600" />
                  <span>Business day is already closed. Mutations are locked.</span>
                </div>
              )}

              {/* Day Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 font-medium block">Total Sales</span>
                  <span className="font-bold font-tabular text-sm text-slate-900 block mt-0.5">
                    ₹{preview.sales.totalSalesAmount}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {preview.sales.totalSalesKg} kg • {preview.sales.totalSalesCount} bills
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 font-medium block">Total Procurement</span>
                  <span className="font-bold font-tabular text-sm text-slate-900 block mt-0.5">
                    ₹{preview.purchases.totalPurchasesAmount}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {preview.purchases.totalPurchasesKg} kg • {preview.purchases.totalPurchasesCount} bills
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 font-medium block">Wastage / Losses</span>
                  <span className="font-bold font-tabular text-sm text-rose-700 block mt-0.5">
                    {preview.wastage.totalWastageKg} kg
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Est. Cost: ₹{preview.wastage.estimatedWastageCost}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 font-medium block">Expenses & Wages</span>
                  <span className="font-bold font-tabular text-sm text-slate-900 block mt-0.5">
                    ₹{preview.expenses.totalExpensesAmount}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {preview.expenses.totalExpensesCount} vouchers
                  </span>
                </div>
              </div>

              {/* Cash Reconciliation */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Cash Drawer Reconciliation</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Expected Cash</span>
                    <span className="font-bold font-tabular text-slate-800">
                      ₹{preview.cash.expectedCash}
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Actual Physical Cash *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={actualPhysicalCash}
                      onChange={(e) => setActualPhysicalCash(e.target.value)}
                      className="w-full px-2 py-1 rounded border border-slate-300 font-bold font-tabular text-xs"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-500 block">Difference</span>
                    <span className={`font-bold font-tabular ${
                      parseFloat(cashVariance) < 0 ? 'text-rose-600' : 'text-emerald-700'
                    }`}>
                      {parseFloat(cashVariance) >= 0 ? '+' : ''}₹{cashVariance}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stock Reconciliation */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span>Seafood Stock Reconciliation</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Expected Stock</span>
                    <span className="font-bold font-tabular text-slate-800">
                      {preview.stock.expectedClosingStockKg} kg
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Actual Physical Stock *
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      required
                      value={actualPhysicalStockKg}
                      onChange={(e) => setActualPhysicalStockKg(e.target.value)}
                      className="w-full px-2 py-1 rounded border border-slate-300 font-bold font-tabular text-xs"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-500 block">Difference</span>
                    <span className={`font-bold font-tabular ${
                      parseFloat(stockVariance) < 0 ? 'text-rose-600' : 'text-emerald-700'
                    }`}>
                      {parseFloat(stockVariance) >= 0 ? '+' : ''}{stockVariance} kg
                    </span>
                  </div>
                </div>
              </div>

              {/* Variance Reason if discrepancy exists */}
              {(parseFloat(cashVariance) !== 0 || parseFloat(stockVariance) !== 0) && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Discrepancy / Variance Explanation
                  </label>
                  <input
                    type="text"
                    value={varianceReason}
                    onChange={(e) => setVarianceReason(e.target.value)}
                    placeholder="e.g. Minor scale calibration difference, unrecorded ice tare"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}

              {/* Close Button */}
              {!preview.isClosed && (
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 transition-all"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Closing Business Day...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-amber-400" />
                        <span>Confirm & Close Business Day</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </form>
      </div>
    </div>
  );
};
