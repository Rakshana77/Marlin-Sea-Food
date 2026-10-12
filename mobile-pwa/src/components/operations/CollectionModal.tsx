import React, { useState, useEffect } from 'react';
import { Fisherman, Seafood, SeafoodGrade } from '../../types/models';
import { getFishermen, getFishermanAdvanceBalance } from '../../api/advances';
import { getSeafoodCatalog } from '../../api/stock';
import { getGrades } from '../../api/masters';
import { getCurrentDailyRates } from '../../api/rates';
import { createPurchaseBill } from '../../api/collections';
import { ApiError } from '../../api/client';
import { X, Check, Scale, AlertCircle, Loader2 } from 'lucide-react';

interface CollectionModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

export const CollectionModal: React.FC<CollectionModalProps> = ({
  onSuccess,
  onClose,
}) => {
  const [fishermen, setFishermen] = useState<Fisherman[]>([]);
  const [seafoodList, setSeafoodList] = useState<Seafood[]>([]);
  const [gradesList, setGradesList] = useState<SeafoodGrade[]>([]);
  const [selectedFishermanId, setSelectedFishermanId] = useState<string>('');
  const [selectedSeafoodId, setSelectedSeafoodId] = useState<string>('');
  const [selectedGradeId, setSelectedGradeId] = useState<string>('');
  
  const [fishermanAdvance, setFishermanAdvance] = useState<string>('0.00');
  const [purchaseRate, setPurchaseRate] = useState<string>('0.00');

  // Gross, Tare, Net weights
  const [grossWeight, setGrossWeight] = useState<string>('');
  const [tareWeight, setTareWeight] = useState<string>('0.000');
  const [advanceDeducted, setAdvanceDeducted] = useState<string>('0.00');
  const [notes, setNotes] = useState<string>('');

  const [loadingInit, setLoadingInit] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load fishermen, seafood master, grades, and rates on mount
  useEffect(() => {
    let active = true;
    const loadMasters = async () => {
      try {
        const [fList, sList, gList, rates] = await Promise.all([
          getFishermen(),
          getSeafoodCatalog(),
          getGrades(true),
          getCurrentDailyRates(),
        ]);
        if (active) {
          setFishermen(fList || []);
          setSeafoodList(sList || []);
          setGradesList(gList || []);
          if (fList && fList[0]) setSelectedFishermanId(fList[0].id);
          if (sList && sList[0]) setSelectedSeafoodId(sList[0].id);
          if (gList && gList[0]) setSelectedGradeId(gList[0].id);
        }
      } catch (err) {
        if (active) {
          const apiErr = err as ApiError;
          setErrorMessage(apiErr.message || 'Failed to load master collection data');
        }
      } finally {
        if (active) setLoadingInit(false);
      }
    };
    loadMasters();
    return () => { active = false; };
  }, []);

  // When fisherman changes, retrieve advance balance
  useEffect(() => {
    if (!selectedFishermanId) return;
    let active = true;
    getFishermanAdvanceBalance(selectedFishermanId)
      .then((res) => {
        if (active) setFishermanAdvance(res.advanceRecoverableBalance || '0.00');
      })
      .catch(() => {
        if (active) setFishermanAdvance('0.00');
      });
    return () => { active = false; };
  }, [selectedFishermanId]);

  // When seafood or grade changes, load published purchase rate
  useEffect(() => {
    if (!selectedSeafoodId) return;
    getCurrentDailyRates()
      .then((rates) => {
        const match = rates.find((r) => 
          r.seafoodId === selectedSeafoodId && (selectedGradeId ? r.gradeId === selectedGradeId : true)
        );
        if (match) {
          setPurchaseRate(match.purchaseRate || '0.00');
          if (match.gradeId && !selectedGradeId) setSelectedGradeId(match.gradeId);
        } else {
          setPurchaseRate('0.00');
        }
      })
      .catch(() => {});
  }, [selectedSeafoodId, selectedGradeId]);

  // Calculations: Gross - Tare = Net Weight
  const grossNum = parseFloat(grossWeight) || 0;
  const tareNum = parseFloat(tareWeight) || 0;
  const netWeightNum = Math.max(0, grossNum - tareNum);
  const rateNum = parseFloat(purchaseRate) || 0;
  const purchaseValue = (netWeightNum * rateNum).toFixed(2);
  const advanceNum = parseFloat(advanceDeducted) || 0;
  const netPayable = Math.max(0, parseFloat(purchaseValue) - advanceNum).toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFishermanId) {
      setErrorMessage('Please select a fisherman');
      return;
    }
    if (!selectedSeafoodId) {
      setErrorMessage('Please select seafood');
      return;
    }
    if (netWeightNum <= 0) {
      setErrorMessage('Net weight must be greater than 0 kg');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const todayIso = new Date().toISOString().split('T')[0];

    try {
      await createPurchaseBill({
        fishermanId: selectedFishermanId,
        billDate: todayIso,
        items: [
          {
            seafoodId: selectedSeafoodId,
            gradeId: selectedGradeId,
            quantityKg: netWeightNum.toFixed(3),
            purchaseRate: purchaseRate,
          },
        ],
        advanceDeducted: advanceDeducted || '0.00',
        payment: {
          method: 'CASH',
          amount: netPayable,
        },
        notes: notes.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err) {
      const apiErr = err as ApiError;
      setErrorMessage(apiErr.message || 'Failed to record collection purchase');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-primary-container text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-base sm:text-lg">Dock Procurement / Collection</h3>
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
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {loadingInit ? (
            <div className="py-12 flex items-center justify-center text-slate-400 text-xs">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading procurement data...
            </div>
          ) : (
            <>
              {/* Fisherman Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fisherman / Boat Supplier *
                </label>
                <select
                  value={selectedFishermanId}
                  onChange={(e) => setSelectedFishermanId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  {fishermen.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.countryCode} {f.mobileNumber})
                    </option>
                  ))}
                </select>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                  <span>Advance Recoverable Balance:</span>
                  <span className="font-bold font-tabular text-amber-700">₹{fishermanAdvance}</span>
                </div>
              </div>

              {/* Seafood Item Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Seafood Species *
                </label>
                <select
                  value={selectedSeafoodId}
                  onChange={(e) => setSelectedSeafoodId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  {seafoodList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quality Grade Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quality Grade *
                </label>
                <select
                  value={selectedGradeId}
                  onChange={(e) => setSelectedGradeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  {gradesList.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Gross, Tare & Net Weights */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Gross (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    required
                    value={grossWeight}
                    onChange={(e) => setGrossWeight(e.target.value)}
                    placeholder="40.000"
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-sm font-bold font-tabular text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Tare (kg)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={tareWeight}
                    onChange={(e) => setTareWeight(e.target.value)}
                    placeholder="2.000"
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-sm font-bold font-tabular text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Net Wt (kg)
                  </label>
                  <div className="w-full px-2 py-1.5 rounded-lg bg-teal-100 border border-teal-300 text-sm font-extrabold font-tabular text-teal-900">
                    {netWeightNum.toFixed(3)}
                  </div>
                </div>
              </div>

              {/* Purchase Rate Applied */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-700 block">Published Purchase Rate:</span>
                  <span className="text-[11px] text-slate-500">From Today's published rate ledger</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-slate-500">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    value={purchaseRate}
                    onChange={(e) => setPurchaseRate(e.target.value)}
                    className="w-20 px-2 py-1 text-right text-sm font-bold font-tabular rounded border border-slate-300"
                  />
                </div>
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 flex flex-col gap-1.5 text-xs">
                <div className="flex justify-between text-slate-700">
                  <span>Gross Purchase Value:</span>
                  <span className="font-bold font-tabular">₹{purchaseValue}</span>
                </div>
                
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-teal-200">
                  <span className="text-amber-800 font-semibold">Advance Deduction Recovery:</span>
                  <div className="flex items-center gap-1">
                    <span>₹</span>
                    <input
                      type="number"
                      step="1"
                      max={parseFloat(fishermanAdvance) || 0}
                      value={advanceDeducted}
                      onChange={(e) => setAdvanceDeducted(e.target.value)}
                      placeholder="0.00"
                      className="w-20 px-2 py-0.5 text-right font-bold font-tabular rounded border border-amber-300 bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-between font-bold text-sm text-teal-950 pt-1 border-t border-teal-200">
                  <span>Net Payable to Fisherman:</span>
                  <span className="font-tabular text-base text-teal-800">₹{netPayable}</span>
                </div>
              </div>

              {/* Memo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dock Receipt Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Lot #DK-409, iced crate"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || netWeightNum <= 0}
                  className="w-full py-3 rounded-xl bg-teal-700 hover:bg-teal-600 disabled:opacity-40 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Recording Collection...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirm Collection (Net ₹{netPayable})</span>
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
