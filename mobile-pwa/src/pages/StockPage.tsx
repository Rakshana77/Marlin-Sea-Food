import React, { useState, useEffect } from 'react';
import { StockItem, StockMovement } from '../types/models';
import { getStockList, getStockMovements } from '../api/stock';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../api/client';
import { WastageModal } from '../components/operations/WastageModal';
import { Boxes, History, RefreshCw, Search, Trash2, AlertCircle, Loader2 } from 'lucide-react';

export const StockPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'balances' | 'movements'>('balances');
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [showWastageModal, setShowWastageModal] = useState<boolean>(false);

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setErrorMessage(null);
    try {
      if (activeTab === 'balances') {
        const list = await getStockList({ search: searchQuery.trim() || undefined });
        setStocks(list || []);
      } else {
        const mvList = await getStockMovements();
        setMovements(mvList || []);
      }
    } catch (err) {
      const apiErr = err as ApiError;
      setErrorMessage(apiErr.message || 'Failed to load stock data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-24 md:pb-8 flex flex-col gap-4">
      {/* Top Controls & Navigation */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-base sm:text-lg text-slate-900">
              Perpetual Seafood Stock
            </h1>
            <p className="text-xs text-slate-500">
              Live balances and WAC valuation across harbor cold storage
            </p>
          </div>
        </div>

        {/* Tab Switcher & Actions */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
            <button
              onClick={() => setActiveTab('balances')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'balances'
                  ? 'bg-white text-teal-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Balances
            </button>
            <button
              onClick={() => setActiveTab('movements')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'movements'
                  ? 'bg-white text-teal-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Movements
            </button>
          </div>

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 active:scale-95 transition-all"
            title="Refresh Stock"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
          </button>

          {isAdmin && (
            <button
              onClick={() => setShowWastageModal(true)}
              className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Record Wastage</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Input for Balances */}
      {activeTab === 'balances' && (
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stock by species name..."
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          />
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Content View */}
      {activeTab === 'balances' ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              <span className="text-xs font-semibold">Loading live stock...</span>
            </div>
          ) : stocks.length === 0 ? (
            <div className="py-20 text-center text-slate-500 text-xs px-4">
              No stock balances recorded.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Seafood Species</th>
                    <th className="py-3 px-3">Grade</th>
                    <th className="py-3 px-3 text-right">Available Qty</th>
                    {isAdmin && <th className="py-3 px-3 text-right">WAC Cost</th>}
                    {isAdmin && <th className="py-3 px-4 text-right">Total Value</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stocks.map((item) => {
                    const qty = parseFloat(item.quantityKg) || 0;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block text-sm">
                            {item.seafood?.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">
                            {item.seafood?.category?.name || 'Seafood'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-700 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                            {item.grade?.name || 'Grade A'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className={`font-extrabold font-tabular text-sm ${
                            qty <= 0 ? 'text-rose-600' : qty < 15 ? 'text-amber-600' : 'text-slate-900'
                          }`}>
                            {qty.toFixed(3)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal ml-1">
                            {item.seafood?.unit || 'KG'}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="py-3 px-3 text-right font-semibold font-tabular text-slate-600">
                            ₹{parseFloat(item.averageCost).toFixed(2)}
                          </td>
                        )}
                        {isAdmin && (
                          <td className="py-3 px-4 text-right font-bold font-tabular text-teal-800">
                            ₹{parseFloat(item.totalValue).toFixed(2)}
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
      ) : (
        /* Movements History View */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              <span className="text-xs font-semibold">Loading stock movements...</span>
            </div>
          ) : movements.length === 0 ? (
            <div className="py-20 text-center text-slate-500 text-xs px-4">
              No stock movements recorded.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Date / Time</th>
                    <th className="py-3 px-3">Species & Grade</th>
                    <th className="py-3 px-3 text-center">Movement</th>
                    <th className="py-3 px-3 text-right">Qty</th>
                    <th className="py-3 px-4">Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.map((mv) => {
                    const isPositive = mv.movementType === 'PURCHASE' || mv.movementType === 'RETURN';
                    return (
                      <tr key={mv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 text-[11px] text-slate-500 font-mono">
                          {new Date(mv.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900 block">
                            {mv.seafood?.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {mv.grade?.name}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            mv.movementType === 'SALE'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : mv.movementType === 'PURCHASE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : mv.movementType === 'WASTE'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {mv.movementType}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-extrabold font-tabular text-sm">
                          <span className={isPositive ? 'text-emerald-700' : 'text-slate-800'}>
                            {isPositive ? '+' : '-'}{parseFloat(mv.quantityKg).toFixed(3)} kg
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[11px] text-slate-600">
                          <span className="font-semibold block">{mv.referenceType}</span>
                          {mv.notes && <span className="text-slate-400 truncate max-w-xs block">{mv.notes}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Wastage Entry Modal */}
      {showWastageModal && (
        <WastageModal
          onSuccess={() => loadData(true)}
          onClose={() => setShowWastageModal(false)}
        />
      )}
    </div>
  );
};
