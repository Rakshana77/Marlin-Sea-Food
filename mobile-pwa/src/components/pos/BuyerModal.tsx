import React, { useState, useEffect } from 'react';
import { Customer } from '../../types/models';
import { getCustomers, createCustomer } from '../../api/buyers';
import { X, Search, UserPlus, User, Check, Phone, AlertCircle, Loader2 } from 'lucide-react';
import { ApiError } from '../../api/client';

interface BuyerModalProps {
  currentBuyerId?: string;
  isWalkIn: boolean;
  onSelectBuyer: (customer: Customer | null) => void;
  onClose: () => void;
}

export const BuyerModal: React.FC<BuyerModalProps> = ({
  currentBuyerId,
  isWalkIn,
  onSelectBuyer,
  onClose,
}) => {
  const [tab, setTab] = useState<'search' | 'create'>('search');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // New buyer form fields
  const [name, setName] = useState<string>('');
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchBuyers = async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await getCustomers(searchTerm.trim() || undefined);
        if (active) setCustomers(list);
      } catch (err) {
        if (active) {
          const apiErr = err as ApiError;
          setError(apiErr.message || 'Failed to load customers');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    const timer = setTimeout(fetchBuyers, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchTerm]);

  const handleCreateBuyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Buyer name is required');
      return;
    }
    if (!mobileNumber.trim() || mobileNumber.trim().length < 7) {
      setFormError('Enter a valid mobile number (min 7 digits)');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const created = await createCustomer({
        name: name.trim(),
        countryCode: '+91',
        mobileNumber: mobileNumber.trim(),
        address: address.trim() || null,
      });

      // Auto-select newly created buyer and return to billing
      onSelectBuyer(created);
      onClose();
    } catch (err) {
      const apiErr = err as ApiError;
      setFormError(apiErr.message || 'Failed to create buyer. Check duplicate mobile number.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-primary-container text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-base sm:text-lg">Select or Create Buyer</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={() => setTab('search')}
            className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              tab === 'search'
                ? 'border-teal-700 text-teal-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Existing Buyer</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('create')}
            className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              tab === 'create'
                ? 'border-teal-700 text-teal-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ New Buyer</span>
          </button>
        </div>

        {/* Tab 1: Search & Walk-In */}
        {tab === 'search' && (
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {/* Walk-in Customer Quick Option */}
            <button
              type="button"
              onClick={() => {
                onSelectBuyer(null);
                onClose();
              }}
              className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                isWalkIn
                  ? 'border-teal-600 bg-teal-50/80 text-teal-950 shadow-sm'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
              }`}
            >
              <div>
                <span className="font-bold text-sm block">Walk-in Customer</span>
                <span className="text-xs text-slate-500">Immediate cash/digital settlement (No credit)</span>
              </div>
              {isWalkIn && <Check className="w-5 h-5 text-teal-700" />}
            </button>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search buyer by name or phone..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Buyer List */}
            <div className="flex-1 overflow-y-auto min-h-[160px] flex flex-col gap-2">
              {loading ? (
                <div className="py-8 flex items-center justify-center text-slate-400 text-xs">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Loading buyers...
                </div>
              ) : error ? (
                <div className="p-3 text-xs text-rose-700 bg-rose-50 rounded-lg border border-rose-200">
                  {error}
                </div>
              ) : customers.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No buyers found matching search.
                </div>
              ) : (
                customers.map((c) => {
                  const isSelected = !isWalkIn && currentBuyerId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        onSelectBuyer(c);
                        onClose();
                      }}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50 text-teal-950 font-bold'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div>
                        <span className="text-sm font-bold block">{c.name}</span>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{c.countryCode} {c.mobileNumber}</span>
                          {c.address && <span>• {c.address}</span>}
                        </div>
                      </div>
                      {isSelected && <Check className="w-5 h-5 text-teal-700" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Create New Buyer Form */}
        {tab === 'create' && (
          <form onSubmit={handleCreateBuyer} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {formError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Buyer / Business Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Marina Fresh Traders"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mobile Number *
              </label>
              <div className="flex gap-2">
                <span className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-xs font-bold text-slate-600 flex items-center">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="9876543210"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Address / Wharf Location (Optional)
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Stall #14, Harbor Gate"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 transition-all"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Buyer...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create & Select Buyer</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
