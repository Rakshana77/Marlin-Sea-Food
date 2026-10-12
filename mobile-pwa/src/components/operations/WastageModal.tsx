import React, { useState, useEffect } from 'react';
import { Seafood, StockItem } from '../../types/models';
import { getStockList, recordWastage } from '../../api/stock';
import { ApiError } from '../../api/client';
import { X, Check, Trash2, AlertCircle, Loader2 } from 'lucide-react';

interface WastageModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

export const WastageModal: React.FC<WastageModalProps> = ({
  onSuccess,
  onClose,
}) => {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [selectedStockId, setSelectedStockId] = useState<string>('');
  const [quantityKg, setQuantityKg] = useState<string>('');
  const [reason, setReason] = useState<string>('SPOILAGE');
  const [notes, setNotes] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getStockList()
      .then((items) => {
        if (active) {
          setStockItems(items);
          if (items[0]) setSelectedStockId(items[0].id);
        }
      })
      .catch((err) => {
        if (active) {
          const apiErr = err as ApiError;
          setErrorMessage(apiErr.message || 'Failed to load live stock');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const activeStock = stockItems.find((s) => s.id === selectedStockId) || stockItems[0];
  const maxAvailable = parseFloat(activeStock?.quantityKg || '0');
  const enteredQty = parseFloat(quantityKg) || 0;
  const exceedsStock = enteredQty > maxAvailable;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStock) {
      setErrorMessage('Please select a stock item');
      return;
    }
    if (enteredQty <= 0) {
      setErrorMessage('Wastage quantity must be greater than 0 kg');
      return;
    }
    if (exceedsStock) {
      setErrorMessage(`Cannot waste more than available stock (${maxAvailable.toFixed(2)} kg)`);
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      await recordWastage({
        seafoodId: activeStock.seafoodId,
        gradeId: activeStock.gradeId,
        quantityKg: enteredQty.toFixed(3),
        reason,
        notes: notes.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err) {
      const apiErr = err as ApiError;
      setErrorMessage(apiErr.message || 'Failed to record wastage');
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
            <Trash2 className="w-5 h-5 text-rose-400" />
            <h3 className="font-bold text-base sm:text-lg">Record Seafood Spoilage / Wastage</h3>
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

          {loading ? (
            <div className="py-8 flex items-center justify-center text-slate-400 text-xs">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading stock list...
            </div>
          ) : (
            <>
              {/* Select Stock Item */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Seafood & Grade from Stock *
                </label>
                <select
                  value={selectedStockId}
                  onChange={(e) => setSelectedStockId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  {stockItems.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.seafood?.name} - {s.grade?.name} ({parseFloat(s.quantityKg).toFixed(2)} kg avail)
                    </option>
                  ))}
                </select>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                  <span>Currently Available:</span>
                  <span className="font-bold font-tabular text-slate-900">
                    {maxAvailable.toFixed(2)} kg
                  </span>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Wastage Quantity (kg) *
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  max={maxAvailable}
                  required
                  value={quantityKg}
                  onChange={(e) => setQuantityKg(e.target.value)}
                  placeholder="e.g. 5.250"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold font-tabular focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Loss *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="SPOILAGE">Spoilage / Decomposed</option>
                  <option value="TRANSIT_DAMAGE">Transit / Handling Damage</option>
                  <option value="TEMPERATURE_ABUSE">Cold Storage Temp Failure</option>
                  <option value="ICE_MELT_DEFECT">Ice Melt / Quality Degradation</option>
                  <option value="OTHER">Other Discard</option>
                </select>
              </div>

              {/* Memo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Inspection Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Broken ice box during truck unloading"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || enteredQty <= 0 || exceedsStock}
                  className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Writing Off Stock...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Confirm Wastage ({enteredQty.toFixed(2)} kg)</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
