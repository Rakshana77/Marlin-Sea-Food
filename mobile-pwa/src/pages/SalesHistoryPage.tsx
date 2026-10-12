import React, { useState, useEffect } from 'react';
import { Sale } from '../types/models';
import { getSales, cancelSale } from '../api/sales';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../api/client';
import { ReceiptModal } from '../components/pos/ReceiptModal';
import { History, Search, RefreshCw, Eye, Ban, AlertCircle, Loader2 } from 'lucide-react';

export const SalesHistoryPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [activeReceiptSale, setActiveReceiptSale] = useState<Sale | null>(null);

  const fetchSales = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setErrorMessage(null);

    try {
      const data = await getSales({
        search: searchQuery.trim() || undefined,
        date: selectedDate || undefined,
        limit: 50,
      });
      setSales(data || []);
    } catch (err) {
      const apiErr = err as ApiError;
      setErrorMessage(apiErr.message || 'Failed to load sales history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [selectedDate, searchQuery]);

  const handleCancelSale = async (sale: Sale) => {
    if (!window.confirm(`Are you sure you want to CANCEL Invoice #${sale.invoiceNumber}? Stock will be reversed automatically.`)) {
      return;
    }
    try {
      await cancelSale(sale.id);
      alert(`Invoice #${sale.invoiceNumber} cancelled and stock reversed.`);
      fetchSales(true);
    } catch (err) {
      const apiErr = err as ApiError;
      alert(`Failed to cancel sale: ${apiErr.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-24 md:pb-8 flex flex-col gap-4">
      {/* Top Banner & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-base sm:text-lg text-slate-900">
              Sales History & Receipts
            </h1>
            <p className="text-xs text-slate-500">
              Persisted customer sales invoices and settlement records
            </p>
          </div>
        </div>

        {/* Date Filter & Refresh */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
          />

          <button
            onClick={() => fetchSales(true)}
            disabled={refreshing}
            className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 active:scale-95 transition-all"
            title="Refresh Sales"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by invoice number or buyer name..."
          className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
        />
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Sales Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            <span className="text-xs font-semibold">Loading sales history...</span>
          </div>
        ) : sales.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-xs px-4">
            No sales invoices found matching filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Buyer</th>
                  <th className="py-3 px-3 text-right">Volume</th>
                  <th className="py-3 px-3 text-right">Grand Total</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.map((sale) => {
                  const isCancelled = sale.status === 'CANCELLED';
                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {sale.invoiceNumber}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {sale.saleDate}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {sale.customer?.name || 'Walk-in Customer'}
                      </td>
                      <td className="py-3 px-3 text-right font-tabular text-slate-700">
                        {sale.totalKg} kg
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold font-tabular text-teal-800 text-sm">
                        ₹{sale.grandTotal}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isCancelled
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : sale.paymentStatus === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {sale.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setActiveReceiptSale(sale)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
                            title="View / Print Receipt"
                          >
                            <Eye className="w-3.5 h-3.5 text-teal-700" />
                          </button>

                          {isAdmin && !isCancelled && (
                            <button
                              onClick={() => handleCancelSale(sale)}
                              className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors"
                              title="Cancel / Reverse Sale"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Receipt Modal for Viewed Sale */}
      {activeReceiptSale && (
        <ReceiptModal
          sale={activeReceiptSale}
          onNewSale={() => setActiveReceiptSale(null)}
          onClose={() => setActiveReceiptSale(null)}
        />
      )}
    </div>
  );
};
