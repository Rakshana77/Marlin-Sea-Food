import React, { useState, useEffect } from 'react';
import { getDayEndPreview, closeBusinessDay, reopenBusinessDay } from '../api/dayEnd';
import { apiClient } from '../api/client';
import { DayEndPreview } from '../types/models';
import { useAuth } from '../hooks/useAuth';
import { 
  Lock, 
  LockOpen, 
  Calendar, 
  RefreshCw, 
  Loader2, 
  Check, 
  AlertCircle, 
  DollarSign, 
  Boxes, 
  Scale, 
  ShoppingCart, 
  Receipt, 
  Trash2,
  FileCheck,
  X
} from 'lucide-react';

export const DayEndPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [preview, setPreview] = useState<DayEndPreview | null>(null);
  const [historicalRecords, setHistoricalRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Reconciliation Inputs
  const [actualCash, setActualCash] = useState<string>('');
  const [actualStockKg, setActualStockKg] = useState<string>('');
  const [varianceReason, setVarianceReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Modals & Action States
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showCloseModal, setShowCloseModal] = useState<boolean>(false);
  const [showReopenModal, setShowReopenModal] = useState<boolean>(false);
  const [reopenReason, setReopenReason] = useState<string>('');

  const loadData = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    try {
      const [previewData, history] = await Promise.all([
        getDayEndPreview(selectedDate),
        apiClient<any[]>('/day-end', { method: 'GET', params: { limit: 10 } }).catch(() => []),
      ]);
      setPreview(previewData);
      setHistoricalRecords(history || []);
      if (previewData) {
        setActualCash(previewData.cash?.expectedCash || '');
        setActualStockKg(previewData.stock?.expectedClosingStockKg || '');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load day end reconciliation preview');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  // Differences computation
  const expectedCashNum = parseFloat(preview?.cash?.expectedCash || '0');
  const actualCashNum = parseFloat(actualCash) || expectedCashNum;
  const cashDifference = actualCashNum - expectedCashNum;

  const expectedStockNum = parseFloat(preview?.stock?.expectedClosingStockKg || '0');
  const actualStockNum = parseFloat(actualStockKg) || expectedStockNum;
  const stockDifference = actualStockNum - expectedStockNum;

  const isClosed = preview?.isClosed || preview?.status === 'CLOSED';

  const handleCloseDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await closeBusinessDay(selectedDate, {
        actualPhysicalCash: actualCashNum.toFixed(2),
        actualPhysicalStockKg: actualStockNum.toFixed(3),
        varianceReason: varianceReason.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setSuccessMsg(`Business day ${selectedDate} closed and reconciled successfully!`);
      setShowCloseModal(false);
      loadData(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to close business day');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReopenDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!reopenReason.trim()) {
      setError('A justification reason is required to reopen a closed date');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await reopenBusinessDay(selectedDate, reopenReason.trim());
      setSuccessMsg(`Business day ${selectedDate} reopened for transaction adjustments.`);
      setShowReopenModal(false);
      setReopenReason('');
      loadData(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to reopen business day');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-24 md:pb-8 flex flex-col gap-4">
      {/* Top Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-300">
              Terminal Audit & Reconciliation
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Day End Closing & Reconciliation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Audit drawer cash counts, verify cold room weights, and lock daily business date mutations
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
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors"
            title="Refresh Preview"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-slate-800' : ''}`} />
          </button>
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

      {/* Day Status Strip */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm ${
        isClosed
          ? 'bg-amber-50/90 border-amber-300 text-amber-900'
          : 'bg-emerald-50/90 border-emerald-300 text-emerald-900'
      }`}>
        <div className="flex items-center gap-3">
          {isClosed ? (
            <Lock className="w-6 h-6 text-amber-700 shrink-0" />
          ) : (
            <LockOpen className="w-6 h-6 text-emerald-700 shrink-0" />
          )}
          <div>
            <span className="font-extrabold text-sm sm:text-base">
              Business Date {selectedDate}: {isClosed ? 'LOCKED & RECONCILED' : 'TRANSACTIONS ACTIVE'}
            </span>
            <p className="text-xs opacity-85 mt-0.5">
              {isClosed
                ? 'All financial mutations and stock movements for this date are locked. Perpetual inventory continues into the next business shift.'
                : 'Terminal is currently operating. Review draft transaction reconciliation below before performing day closing.'}
            </p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {isClosed ? (
              <button
                onClick={() => setShowReopenModal(true)}
                className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                Reopen Business Day
              </button>
            ) : (
              <button
                onClick={() => setShowCloseModal(true)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                Close & Lock Business Day
              </button>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="py-24 bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-slate-800" />
          <span className="text-xs font-semibold">Generating authoritative day-end preview...</span>
        </div>
      ) : preview && (
        <div className="flex flex-col gap-4">
          {/* Section 1: Dual Reconciliation Columns (Cash & Stock) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Cash Drawer Reconciliation */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2.5">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-extrabold text-sm text-slate-900">Cash Drawer Reconciliation</h3>
                </div>

                <div className="space-y-2 text-xs divide-y divide-slate-100">
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500 font-medium">Opening Terminal Cash:</span>
                    <span className="font-mono font-bold">₹{parseFloat(preview.cash?.openingCash || '0').toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 text-emerald-700">
                    <span className="font-medium">+ Retail Sales Cash Received:</span>
                    <span className="font-mono font-bold">+₹{parseFloat(preview.cash?.cashReceivedSales || '0').toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 text-blue-700">
                    <span className="font-medium">- Catch Procurement Paid in Cash:</span>
                    <span className="font-mono font-bold">-₹{parseFloat(preview.cash?.cashPaidPurchases || '0').toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 text-purple-700">
                    <span className="font-medium">- Cash Fisherman Advances Disbursed:</span>
                    <span className="font-mono font-bold">-₹{parseFloat(preview.cash?.cashPaidAdvances || '0').toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 text-amber-700">
                    <span className="font-medium">- Petty Cash Expenses & Wages Paid:</span>
                    <span className="font-mono font-bold">-₹{parseFloat(preview.cash?.cashPaidExpenses || '0').toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 text-sm font-black border-t-2 border-slate-200">
                    <span>Expected Cash in Drawer:</span>
                    <span className="font-mono text-slate-900">₹{expectedCashNum.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Physical Audit Verification */}
              <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-slate-700">Actual Physical Cash Count (₹):</label>
                  <input
                    type="number"
                    step="0.01"
                    disabled={isClosed}
                    value={actualCash}
                    onChange={(e) => setActualCash(e.target.value)}
                    className="w-32 px-2.5 py-1 text-right font-mono font-bold bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex items-center justify-between font-bold pt-2 border-t border-slate-200">
                  <span className="text-slate-600">Reconciliation Cash Difference:</span>
                  <span className={`font-mono text-sm ${
                    cashDifference === 0 ? 'text-emerald-600' : cashDifference > 0 ? 'text-blue-600' : 'text-rose-600'
                  }`}>
                    {cashDifference > 0 ? '+' : ''}₹{cashDifference.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Cold Storage Perpetual Stock Reconciliation */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2.5">
                  <Boxes className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-extrabold text-sm text-slate-900">Perpetual Stock Flow Reconciliation</h3>
                </div>

                <div className="space-y-2 text-xs divide-y divide-slate-100">
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500 font-medium">Opening Cold Room Stock:</span>
                    <span className="font-mono font-bold">{parseFloat(preview.stock?.openingStockKg || '0').toFixed(1)} KG</span>
                  </div>
                  <div className="flex justify-between py-1.5 text-blue-700">
                    <span className="font-medium">+ Today's Landed Catch Intake:</span>
                    <span className="font-mono font-bold">+{parseFloat(preview.stock?.totalReceivedKg || '0').toFixed(1)} KG</span>
                  </div>
                  <div className="flex justify-between py-1.5 text-emerald-700">
                    <span className="font-medium">- Domestic & Export Sales Shipped:</span>
                    <span className="font-mono font-bold">-{parseFloat(preview.stock?.totalSoldKg || '0').toFixed(1)} KG</span>
                  </div>
                  <div className="flex justify-between py-1.5 text-rose-700">
                    <span className="font-medium">- Spoilage & Wastage Loss Written Off:</span>
                    <span className="font-mono font-bold">-{parseFloat(preview.stock?.totalWastageKg || '0').toFixed(1)} KG</span>
                  </div>
                  <div className="flex justify-between py-1.5 text-purple-700">
                    <span className="font-medium">± Physical Audit Adjustments:</span>
                    <span className="font-mono font-bold">{parseFloat(preview.stock?.totalAdjustedKg || '0').toFixed(1)} KG</span>
                  </div>
                  <div className="flex justify-between py-2 text-sm font-black border-t-2 border-slate-200">
                    <span>Expected Closing Stock Balance:</span>
                    <span className="font-mono text-slate-900">{expectedStockNum.toFixed(1)} KG</span>
                  </div>
                </div>
              </div>

              {/* Physical Audit Verification */}
              <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-slate-700">Actual Physical Stock Audit (KG):</label>
                  <input
                    type="number"
                    step="0.001"
                    disabled={isClosed}
                    value={actualStockKg}
                    onChange={(e) => setActualStockKg(e.target.value)}
                    className="w-32 px-2.5 py-1 text-right font-mono font-bold bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex items-center justify-between font-bold pt-2 border-t border-slate-200">
                  <span className="text-slate-600">Stock Weight Difference:</span>
                  <span className={`font-mono text-sm ${
                    stockDifference === 0 ? 'text-emerald-600' : stockDifference > 0 ? 'text-blue-600' : 'text-rose-600'
                  }`}>
                    {stockDifference > 0 ? '+' : ''}{stockDifference.toFixed(1)} KG
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Daily Transaction Volume Summaries */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Retail Sales</span>
              <div className="text-lg sm:text-xl font-black text-slate-900 font-mono mt-1">
                ₹{parseFloat(preview.sales?.totalSalesAmount || '0').toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{preview.sales?.totalSalesCount} bills issued</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Catch Intake</span>
              <div className="text-lg sm:text-xl font-black text-slate-900 font-mono mt-1">
                ₹{parseFloat(preview.purchases?.totalPurchasesAmount || '0').toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{preview.purchases?.totalPurchasesCount} catch bills</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-purple-200 bg-purple-50/50 shadow-sm">
              <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">Advances Movement</span>
              <div className="text-lg sm:text-xl font-black text-purple-900 font-mono mt-1">
                ₹{parseFloat(preview.advances?.totalDisbursed || '0').toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <p className="text-[11px] text-purple-700 mt-0.5">₹{preview.advances?.totalRecovered} recovered</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/50 shadow-sm">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Opex Vouchers</span>
              <div className="text-lg sm:text-xl font-black text-amber-900 font-mono mt-1">
                ₹{parseFloat(preview.expenses?.totalExpensesAmount || '0').toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <p className="text-[11px] text-amber-700 mt-0.5">{preview.expenses?.totalExpensesCount} vouchers</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/50 shadow-sm">
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Spoilage Loss</span>
              <div className="text-lg sm:text-xl font-black text-rose-900 font-mono mt-1">
                {parseFloat(preview.wastage?.totalWastageKg || '0').toFixed(1)} KG
              </div>
              <p className="text-[11px] text-rose-700 mt-0.5">₹{preview.wastage?.estimatedWastageCost} loss</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Close Business Day Confirmation */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
              <h3 className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Confirm Day End Close ({selectedDate})</span>
              </h3>
              <button onClick={() => setShowCloseModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCloseDay} className="p-5 flex flex-col gap-3 text-xs">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 font-medium">
                Closing date <strong>{selectedDate}</strong> will freeze and lock all financial vouchers and stock deductions for this business day.
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono">
                <div className="p-2.5 bg-slate-50 rounded-xl border">
                  <span className="text-slate-500 block text-[10px] uppercase">Cash Variance</span>
                  <span className={`font-bold text-sm ${cashDifference === 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {cashDifference > 0 ? '+' : ''}₹{cashDifference.toFixed(2)}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border">
                  <span className="text-slate-500 block text-[10px] uppercase">Stock Variance</span>
                  <span className={`font-bold text-sm ${stockDifference === 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {stockDifference > 0 ? '+' : ''}{stockDifference.toFixed(1)} KG
                  </span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Variance Explanation / Justification</label>
                <input
                  type="text"
                  value={varianceReason}
                  onChange={(e) => setVarianceReason(e.target.value)}
                  placeholder="e.g. Exact match, or ₹20 petty change rounding..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Closing Audit Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Wharf station shift reconciled by terminal manager..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm & Lock Date</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reopen Business Day */}
      {showReopenModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-amber-700 text-white">
              <h3 className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                <LockOpen className="w-4 h-4 text-amber-200" />
                <span>Reopen Business Day ({selectedDate})</span>
              </h3>
              <button onClick={() => setShowReopenModal(false)} className="p-1 rounded-lg text-amber-200 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleReopenDay} className="p-5 flex flex-col gap-3 text-xs">
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 font-medium">
                Reopening a closed business day unlocks ledger mutation controls. The backend requires a documented audit reason.
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Reopen Reason / Audit Justification <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="e.g. Correcting late harbor boat weighment bill #104..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReopenModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 active:scale-95 text-white font-bold shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Reopen</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
