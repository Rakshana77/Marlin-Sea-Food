import React, { useState, useEffect } from 'react';
import { DailyRate, Seafood, SeafoodGrade } from '../types/models';
import { 
  getDailyRatesList, 
  publishAllRatesForDate, 
  copyYesterdayRates, 
  createDailyRate, 
  updateDailyRate 
} from '../api/rates';
import { getSeafoodCatalog } from '../api/stock';
import { getGrades } from '../api/masters';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../api/client';
import { 
  TrendingUp, 
  RefreshCw, 
  Send, 
  Copy, 
  Plus, 
  Edit2, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';

export const RatesPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [rates, setRates] = useState<DailyRate[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [publishing, setPublishing] = useState<boolean>(false);
  const [copying, setCopying] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Set / Edit Rate Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<Seafood[]>([]);
  const [grades, setGrades] = useState<SeafoodGrade[]>([]);
  const [formSeafoodId, setFormSeafoodId] = useState<string>('');
  const [formGradeId, setFormGradeId] = useState<string>('');
  const [formPurchaseRate, setFormPurchaseRate] = useState<string>('');
  const [formSellingRate, setFormSellingRate] = useState<string>('');
  const [savingRate, setSavingRate] = useState<boolean>(false);

  const fetchRates = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setErrorMessage(null);
    try {
      const data = await getDailyRatesList(selectedDate);
      setRates(data || []);
    } catch (err) {
      const apiErr = err as ApiError;
      setErrorMessage(apiErr.message || 'Failed to load daily seafood rates');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, [selectedDate]);

  // Load masters for rate modal when admin opens modal
  const openRateModal = async (rateToEdit?: DailyRate) => {
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      if (catalog.length === 0 || grades.length === 0) {
        const [cList, gList] = await Promise.all([
          getSeafoodCatalog(),
          getGrades(true)
        ]);
        setCatalog(cList || []);
        setGrades(gList || []);
        if (cList && cList[0] && !rateToEdit) setFormSeafoodId(cList[0].id);
        if (gList && gList[0] && !rateToEdit) setFormGradeId(gList[0].id);
      }

      if (rateToEdit) {
        setEditingRateId(rateToEdit.id);
        setFormSeafoodId(rateToEdit.seafoodId);
        setFormGradeId(rateToEdit.gradeId);
        setFormPurchaseRate(rateToEdit.purchaseRate);
        setFormSellingRate(rateToEdit.sellingRate);
      } else {
        setEditingRateId(null);
        if (catalog[0]) setFormSeafoodId(catalog[0].id);
        if (grades[0]) setFormGradeId(grades[0].id);
        setFormPurchaseRate('');
        setFormSellingRate('');
      }
      setShowModal(true);
    } catch {
      setErrorMessage('Failed to load master catalogs for rate entry');
    }
  };

  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    const pRate = parseFloat(formPurchaseRate);
    const sRate = parseFloat(formSellingRate);

    if (isNaN(pRate) || pRate < 0) {
      setErrorMessage('Please enter a valid non-negative purchase rate');
      return;
    }
    if (isNaN(sRate) || sRate < 0) {
      setErrorMessage('Please enter a valid non-negative selling rate');
      return;
    }
    if (!formSeafoodId || !formGradeId) {
      setErrorMessage('Seafood species and quality grade are required');
      return;
    }

    setSavingRate(true);
    setErrorMessage(null);
    try {
      if (editingRateId) {
        await updateDailyRate(editingRateId, {
          purchaseRate: pRate.toFixed(2),
          sellingRate: sRate.toFixed(2),
          seafoodId: formSeafoodId,
          gradeId: formGradeId
        });
        setStatusMessage('Daily spot rate updated successfully.');
      } else {
        await createDailyRate({
          rateDate: selectedDate,
          seafoodId: formSeafoodId,
          gradeId: formGradeId,
          purchaseRate: pRate.toFixed(2),
          sellingRate: sRate.toFixed(2)
        });
        setStatusMessage('Daily spot rate draft created successfully.');
      }
      setShowModal(false);
      fetchRates(true);
    } catch (err) {
      const apiErr = err as ApiError;
      setErrorMessage(apiErr.message || 'Failed to save daily rate');
    } finally {
      setSavingRate(false);
    }
  };

  const handleCopyYesterday = async () => {
    if (!window.confirm(`Copy yesterday's rates to ${selectedDate}?`)) return;
    setCopying(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const res = await copyYesterdayRates(selectedDate);
      setStatusMessage(`Successfully copied ${res.count || 0} rates from yesterday to ${selectedDate}.`);
      fetchRates(true);
    } catch (err) {
      const apiErr = err as ApiError;
      setErrorMessage(apiErr.message || 'Failed to copy yesterday rates');
    } finally {
      setCopying(false);
    }
  };

  const handlePublishAll = async () => {
    if (!window.confirm(`Publish all draft rates for date ${selectedDate}?`)) return;
    setPublishing(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const result = await publishAllRatesForDate(selectedDate);
      setStatusMessage(`Successfully published ${result.count || rates.length} rates for ${selectedDate}.`);
      fetchRates(true);
    } catch (err) {
      const apiErr = err as ApiError;
      setErrorMessage(apiErr.message || 'Failed to publish rates');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-24 md:pb-8 flex flex-col gap-4">
      {/* Header Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-base sm:text-lg text-slate-900">
              Published Seafood Rates
            </h1>
            <p className="text-xs text-slate-500">
              Daily spot rates for wholesale billing & harbor procurement
            </p>
          </div>
        </div>

        {/* Date Selector & Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
          />

          <button
            onClick={() => fetchRates(true)}
            disabled={refreshing}
            className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 active:scale-95 transition-all"
            title="Refresh Rates"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
          </button>

          {isAdmin && (
            <>
              <button
                onClick={handleCopyYesterday}
                disabled={copying || loading}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-40"
                title="Copy previous day rates"
              >
                {copying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span className="hidden sm:inline">Copy Yesterday</span>
              </button>

              <button
                onClick={() => openRateModal()}
                disabled={loading}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Set Rate</span>
              </button>

              <button
                onClick={handlePublishAll}
                disabled={publishing || loading}
                className="px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-600 active:scale-95 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-40"
              >
                {publishing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Publish All</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status Messages */}
      {statusMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Rates Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            <span className="text-xs font-semibold">Loading daily rates...</span>
          </div>
        ) : rates.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-xs px-4">
            No daily rates configured for {selectedDate}. {isAdmin && 'Click "+ Set Rate" or "Copy Yesterday" to initialize pricing.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Seafood Species</th>
                  <th className="py-3 px-3">Grade</th>
                  <th className="py-3 px-3 text-right">Purchase Rate</th>
                  <th className="py-3 px-3 text-right">Selling Rate</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  {isAdmin && <th className="py-3 px-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rates.map((rate) => {
                  const isPublished = rate.status === 'PUBLISHED';
                  return (
                    <tr key={rate.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block text-sm">
                          {rate.seafood?.name || 'Seafood Item'}
                        </span>
                        {rate.seafood?.category && (
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">
                            {rate.seafood.category.name}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-700 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                          {rate.grade?.name || 'Standard'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold font-tabular text-slate-700 text-sm">
                        ₹{rate.purchaseRate}
                        <span className="text-[10px] text-slate-400 font-normal">/kg</span>
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold font-tabular text-teal-800 text-sm">
                        ₹{rate.sellingRate}
                        <span className="text-[10px] text-slate-400 font-normal">/kg</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          isPublished
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {rate.status}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => openRateModal(rate)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                            title="Edit Spot Rate"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Set / Edit Rate Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-base">
                  {editingRateId ? 'Edit Daily Spot Rate' : 'Set New Daily Rate'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRate} className="p-4 flex flex-col gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Seafood Species *
                </label>
                <select
                  disabled={Boolean(editingRateId)}
                  value={formSeafoodId}
                  onChange={(e) => setFormSeafoodId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white disabled:bg-slate-100"
                >
                  {catalog.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quality Grade *
                </label>
                <select
                  disabled={Boolean(editingRateId)}
                  value={formGradeId}
                  onChange={(e) => setFormGradeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white disabled:bg-slate-100"
                >
                  {grades.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Purchase Rate (₹/kg) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formPurchaseRate}
                    onChange={(e) => setFormPurchaseRate(e.target.value)}
                    placeholder="350.00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold font-tabular text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Selling Rate (₹/kg) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formSellingRate}
                    onChange={(e) => setFormSellingRate(e.target.value)}
                    placeholder="450.00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold font-tabular text-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRate}
                  className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {savingRate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{editingRateId ? 'Update Rate' : 'Save Draft Rate'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
