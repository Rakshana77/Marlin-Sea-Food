import React, { useState, useEffect } from 'react';
import { getStockMovements, getStockList, recordWastage } from '../api/stock';
import { StockMovement, StockItem } from '../types/models';
import { useAuth } from '../hooks/useAuth';
import { 
  Trash2, 
  Plus, 
  Search, 
  Calendar, 
  RefreshCw, 
  Loader2, 
  X, 
  Check, 
  AlertCircle,
  TrendingDown,
  Boxes
} from 'lucide-react';

export const WastagePage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [search, setSearch] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal states
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedStockId, setSelectedStockId] = useState<string>('');
  const [quantityKg, setQuantityKg] = useState<string>('');
  const [reason, setReason] = useState<string>('Spoilage / Cold Chain Failure');
  const [notes, setNotes] = useState<string>('');
  const [wastageDate, setWastageDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const loadData = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    try {
      const [movData, stockData] = await Promise.all([
        getStockMovements({
          movementType: 'WASTE',
          fromDate: selectedDate || undefined,
          toDate: selectedDate || undefined,
          limit: 50,
        }),
        getStockList({ limit: 100 }),
      ]);
      setMovements(movData || []);
      setStocks(stockData || []);
      if (stockData && stockData[0] && !selectedStockId) {
        setSelectedStockId(stockData[0].id);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load wastage records');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qtyVal = parseFloat(quantityKg);
    if (isNaN(qtyVal) || qtyVal <= 0) {
      setError('Please enter a valid wastage quantity in KG');
      return;
    }
    const targetStock = stocks.find(s => s.id === selectedStockId);
    if (!targetStock) {
      setError('Please select a seafood item from stock');
      return;
    }

    const availableKg = parseFloat(targetStock.quantityKg) || 0;
    if (qtyVal > availableKg) {
      if (!window.confirm(`Wastage quantity (${qtyVal} KG) exceeds recorded stock balance (${availableKg} KG). Proceed?`)) {
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const result = await recordWastage({
        seafoodId: targetStock.seafoodId,
        gradeId: targetStock.gradeId,
        quantityKg: qtyVal.toString(),
        reason: reason.trim(),
        notes: notes.trim() || undefined,
        date: wastageDate,
      });

      setSuccessMsg(`Recorded wastage: ${qtyVal} KG written off at backend valuation ₹${parseFloat(result.totalCost || '0').toFixed(2)}`);
      setShowModal(false);
      setQuantityKg('');
      setNotes('');
      loadData(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to record wastage');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalWastageKg = movements.reduce((sum, m) => sum + (parseFloat(m.quantityKg) || 0), 0);
  const totalWastageCost = movements.reduce((sum, m) => sum + (parseFloat(m.totalCost) || 0), 0);

  const filteredMovements = movements.filter(m => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      m.seafood?.name?.toLowerCase().includes(q) ||
      m.notes?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-24 md:pb-8 flex flex-col gap-4">
      {/* Top Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
              Perpetual Stock Losses
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Spoilage & Wastage Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Record decomposed catch, transit damage, and cold chain shrinkage with authoritative backend WAC valuation
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
            title="Refresh Records"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-rose-600' : ''}`} />
          </button>

          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Record Wastage</span>
            </button>
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-800">Total Weight Written Off</span>
          <div className="text-xl sm:text-2xl font-black text-rose-900 font-mono mt-1">
            {totalWastageKg.toFixed(1)} <span className="text-sm font-semibold text-rose-700">KG</span>
          </div>
          <p className="text-[11px] text-rose-600 mt-0.5">{movements.length} logged incidents</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Authoritative Spoilage Loss</span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1">
            ₹{totalWastageCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Computed from backend WAC cost rate</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by species or reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Wastage Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="font-bold text-xs uppercase tracking-wider text-slate-500">
            Wastage & Spoilage Write-Off Audit Trail ({filteredMovements.length})
          </span>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
            <span className="text-xs font-semibold">Loading wastage records...</span>
          </div>
        ) : filteredMovements.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No wastage write-offs recorded for this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-3">Species</th>
                  <th className="py-3 px-3">Grade</th>
                  <th className="py-3 px-3 text-right">Written-off Qty</th>
                  <th className="py-3 px-3 text-right">WAC Cost Rate</th>
                  <th className="py-3 px-3 text-right">Authoritative Loss Total</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {m.createdAt?.split('T')[0]} {m.createdAt?.split('T')[1]?.substring(0, 5)}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {m.seafood?.name || 'Seafood'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200 text-[11px]">
                        {m.grade?.name || 'Standard'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-700">
                      -{parseFloat(m.quantityKg).toFixed(1)} KG
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      ₹{parseFloat(m.unitCost).toFixed(2)}/KG
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-black text-rose-900 text-sm">
                      ₹{parseFloat(m.totalCost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {m.notes || 'Routine Spoilage Write-Off'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Record Spoilage Entry */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Record Perpetual Stock Wastage</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Target Seafood Item in Cold Storage <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedStockId}
                  onChange={(e) => setSelectedStockId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">Select Species & Grade</option>
                  {stocks.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.seafood?.name} - {s.grade?.name} ({parseFloat(s.quantityKg).toFixed(1)} KG in stock @ ₹{parseFloat(s.averageCost).toFixed(2)}/KG)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Wastage Weight (KG) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={quantityKg}
                    onChange={(e) => setQuantityKg(e.target.value)}
                    placeholder="0.000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Business Date</label>
                  <input
                    type="date"
                    value={wastageDate}
                    onChange={(e) => setWastageDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason for Spoilage</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold bg-white"
                >
                  <option value="Spoilage / Cold Chain Failure">Spoilage / Cold Chain Failure</option>
                  <option value="Decomposed / Ammonia Odor">Decomposed / Ammonia Odor</option>
                  <option value="Transit Crushing / Physical Damage">Transit Crushing / Physical Damage</option>
                  <option value="Ice Melt / Temperature Breach">Ice Melt / Temperature Breach</option>
                  <option value="Trimming / Gilling Loss">Trimming / Gilling Loss</option>
                  <option value="Quality Inspection Rejection">Quality Inspection Rejection</option>
                  <option value="Other">Other Operational Loss</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Audit Notes / Incident Log</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Compressor trip in Cold Bay #2 during night shift..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Write Off Stock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
