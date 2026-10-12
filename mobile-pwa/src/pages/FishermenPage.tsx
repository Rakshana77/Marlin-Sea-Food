import React, { useState, useEffect } from 'react';
import { 
  getFishermen, createFisherman, updateFisherman, 
  getFishermanAdvanceBalance, getFishermanLedger,
  disburseAdvance, repayAdvance 
} from '../api/advances';
import { Fisherman, AdvanceLedgerEntry } from '../types/models';
import { useAuth } from '../hooks/useAuth';
import { 
  Users, 
  Search, 
  Plus, 
  Edit2, 
  RefreshCw, 
  Loader2, 
  X, 
  Check, 
  AlertCircle, 
  DollarSign, 
  ArrowDownLeft, 
  ArrowUpRight, 
  FileText,
  Phone
} from 'lucide-react';

export const FishermenPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [fishermen, setFishermen] = useState<Fisherman[]>([]);
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Detail / Ledger view
  const [selectedFisherman, setSelectedFisherman] = useState<Fisherman | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<AdvanceLedgerEntry[]>([]);
  const [loadingLedger, setLoadingLedger] = useState<boolean>(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState<'disburse' | 'repay' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form states
  const [formName, setFormName] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formCountryCode, setFormCountryCode] = useState<string>('+91');
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // Advance modal form
  const [advanceAmount, setAdvanceAmount] = useState<string>('');
  const [advanceMethod, setAdvanceMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'UPI'>('CASH');
  const [advanceNotes, setAdvanceNotes] = useState<string>('');

  const loadFishermen = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    try {
      const data = await getFishermen(search, undefined);
      setFishermen(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load fishermen directory');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadFishermen();
  }, [search]);

  const viewLedger = async (fisherman: Fisherman) => {
    setSelectedFisherman(fisherman);
    setLoadingLedger(true);
    setError(null);
    try {
      const ledger = await getFishermanLedger(fisherman.id);
      setLedgerEntries(ledger || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load advance ledger');
    } finally {
      setLoadingLedger(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) {
      setError('Name and mobile number are required');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await createFisherman({
        name: formName.trim(),
        countryCode: formCountryCode,
        mobileNumber: formPhone.trim(),
      });
      setSuccessMsg(`Added fisherman "${formName}" successfully`);
      setShowCreateModal(false);
      loadFishermen(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to add fisherman');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFisherman) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await updateFisherman(selectedFisherman.id, {
        name: formName.trim(),
        countryCode: formCountryCode,
        mobileNumber: formPhone.trim(),
        status: formStatus,
      });
      setSuccessMsg(`Updated fisherman "${formName}" successfully`);
      setShowEditModal(false);
      loadFishermen(true);
      if (selectedFisherman.id === selectedFisherman?.id) {
        setSelectedFisherman({
          ...selectedFisherman,
          name: formName,
          countryCode: formCountryCode,
          mobileNumber: formPhone,
          status: formStatus,
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update fisherman');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdvanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFisherman) return;
    const amountVal = parseFloat(advanceAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      if (showAdvanceModal === 'disburse') {
        await disburseAdvance({
          fishermanId: selectedFisherman.id,
          amount: amountVal.toFixed(2),
          paymentMethod: advanceMethod,
          notes: advanceNotes.trim() || undefined,
        });
        setSuccessMsg(`Disbursed advance of ₹${amountVal.toFixed(2)} to ${selectedFisherman.name}`);
      } else {
        await repayAdvance({
          fishermanId: selectedFisherman.id,
          amount: amountVal.toFixed(2),
          paymentMethod: advanceMethod,
          notes: advanceNotes.trim() || undefined,
        });
        setSuccessMsg(`Recorded cash repayment of ₹${amountVal.toFixed(2)} from ${selectedFisherman.name}`);
      }
      setShowAdvanceModal(null);
      setAdvanceAmount('');
      setAdvanceNotes('');
      // Reload fisherman balance & ledger
      const bal = await getFishermanAdvanceBalance(selectedFisherman.id);
      setSelectedFisherman({
        ...selectedFisherman,
        advanceBalance: bal.advanceRecoverableBalance,
      });
      viewLedger(selectedFisherman);
      loadFishermen(true);
    } catch (err: any) {
      setError(err?.message || 'Advance transaction failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAdvanceRecoverable = fishermen.reduce((sum, f) => {
    return sum + (parseFloat(f.advanceBalance || '0') || 0);
  }, 0);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-24 md:pb-8 flex flex-col gap-4">
      {/* Top Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              Procurement & Advances
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Fisherman & Advance Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage boat suppliers, advance disbursements, cash repayments, and purchase deductions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadFishermen(true)}
            disabled={isRefreshing}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-purple-600' : ''}`} />
          </button>

          {isAdmin && (
            <button
              onClick={() => {
                setFormName('');
                setFormPhone('');
                setFormCountryCode('+91');
                setShowCreateModal(true);
              }}
              className="px-4 py-2.5 bg-purple-700 hover:bg-purple-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Fisherman</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Balance Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white shadow-sm">
          <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">Total Advance Recoverable</span>
          <div className="text-xl sm:text-2xl font-black text-purple-900 font-mono mt-1">
            ₹{totalAdvanceRecoverable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-purple-700 mt-0.5">
            Across {fishermen.length} registered fishermen
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm sm:col-span-2 flex flex-col justify-center">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search fisherman by name or mobile number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
            />
          </div>
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

      {/* Main Grid: Fishermen Directory + Selected Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Fishermen List (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-500">
              Registered Boat Suppliers ({fishermen.length})
            </span>
          </div>

          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              <span className="text-xs font-semibold">Loading fishermen...</span>
            </div>
          ) : fishermen.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              No fishermen found matching search.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {fishermen.map((f) => {
                const bal = parseFloat(f.advanceBalance || '0');
                const isSelected = selectedFisherman?.id === f.id;

                return (
                  <div
                    key={f.id}
                    onClick={() => viewLedger(f)}
                    className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-purple-50/70 border-l-4 border-purple-600' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{f.name}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          f.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {f.status}
                        </span>
                      </div>
                      <div className="text-slate-500 text-xs flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{f.countryCode} {f.mobileNumber}</span>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Advance Balance</span>
                        <span className={`font-mono font-bold text-sm ${bal > 0 ? 'text-purple-900' : 'text-slate-500'}`}>
                          ₹{bal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFisherman(f);
                            setFormName(f.name);
                            setFormCountryCode(f.countryCode || '+91');
                            setFormPhone(f.mobileNumber);
                            setFormStatus(f.status);
                            setShowEditModal(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-purple-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Fisherman"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Fisherman Detail & Ledger (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col justify-between">
          {selectedFisherman ? (
            <div className="flex flex-col gap-4">
              {/* Profile Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base text-slate-900">{selectedFisherman.name}</h3>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    {selectedFisherman.countryCode} {selectedFisherman.mobileNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-xs">
                  <span className="text-slate-500 font-semibold">Advance Recoverable:</span>
                  <span className="font-mono font-black text-purple-900 text-sm">
                    ₹{parseFloat(selectedFisherman.advanceBalance || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Advance Actions */}
                {isAdmin && (
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200">
                    <button
                      onClick={() => setShowAdvanceModal('disburse')}
                      className="py-2 px-3 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
                    >
                      + Disburse Advance
                    </button>
                    <button
                      onClick={() => setShowAdvanceModal('repay')}
                      className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-all active:scale-95"
                    >
                      Record Cash Repay
                    </button>
                  </div>
                )}
              </div>

              {/* Ledger History */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">
                  Advance Ledger Audit Trail
                </h4>
                {loadingLedger ? (
                  <div className="py-12 flex justify-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                  </div>
                ) : ledgerEntries.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400">
                    No ledger transactions recorded yet.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                    {ledgerEntries.map((entry) => (
                      <div key={entry.id} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 text-xs flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              entry.direction === 'DEBIT'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {entry.entryType}
                            </span>
                            <span className="font-mono text-[11px] text-slate-500">
                              {entry.entryDate?.split('T')[0]}
                            </span>
                          </div>
                          {entry.notes && (
                            <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[200px]">
                              {entry.notes}
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          <div className={`font-mono font-bold ${
                            entry.direction === 'DEBIT' ? 'text-purple-900' : 'text-emerald-700'
                          }`}>
                            {entry.direction === 'DEBIT' ? '+' : '-'}₹{parseFloat(entry.amount).toFixed(2)}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Bal: ₹{parseFloat(entry.balanceAfter).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-slate-400 text-xs">
              Select a fisherman from the directory to review their advance ledger and recovery transactions.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Fisherman */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Register New Fisherman</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-5 flex flex-col gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Fisherman Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Antony Mariappan"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Country</label>
                  <input
                    type="text"
                    value={formCountryCode}
                    onChange={(e) => setFormCountryCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-center"
                  />
                </div>
                <div className="col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 active:scale-95 text-white font-bold shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Register Fisherman</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Fisherman */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Edit Fisherman Information</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-5 flex flex-col gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Country</label>
                  <input
                    type="text"
                    value={formCountryCode}
                    onChange={(e) => setFormCountryCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-center"
                  />
                </div>
                <div className="col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold bg-white"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 active:scale-95 text-white font-bold shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Advance Disbursement / Repayment */}
      {showAdvanceModal && selectedFisherman && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                {showAdvanceModal === 'disburse' ? 'Disburse Advance' : 'Record Cash Repayment'}
              </h3>
              <button onClick={() => setShowAdvanceModal(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAdvanceSubmit} className="p-5 flex flex-col gap-3 text-xs">
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 font-medium">
                Target: <span className="font-bold">{selectedFisherman.name}</span>
                <span className="block text-[11px] mt-0.5">
                  Current Balance: ₹{parseFloat(selectedFisherman.advanceBalance || '0').toFixed(2)}
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
                <select
                  value={advanceMethod}
                  onChange={(e) => setAdvanceMethod(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold bg-white"
                >
                  <option value="CASH">CASH</option>
                  <option value="UPI">UPI / QR</option>
                  <option value="BANK_TRANSFER">BANK TRANSFER</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes / Voucher Reference</label>
                <textarea
                  rows={2}
                  value={advanceNotes}
                  onChange={(e) => setAdvanceNotes(e.target.value)}
                  placeholder="e.g. Deep-sea trip advance, boat maintenance fund, etc."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdvanceModal(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 active:scale-95 text-white font-bold shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{showAdvanceModal === 'disburse' ? 'Confirm Disbursement' : 'Confirm Repayment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
