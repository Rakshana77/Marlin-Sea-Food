import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getDayEndPreview } from '../api/dayEnd';
import { getDailyPnl } from '../api/pnl';
import { getStockList } from '../api/stock';
import { getCustomers } from '../api/buyers';
import { getFishermen } from '../api/advances';
import { getSales } from '../api/sales';
import { DayEndPreview, PnlSummary, StockItem, Customer, Fisherman, Sale } from '../types/models';
import { 
  TrendingUp, 
  ShoppingCart, 
  Scale, 
  Boxes, 
  Receipt, 
  Trash2, 
  Lock, 
  DollarSign, 
  Users, 
  Globe, 
  RefreshCw, 
  ArrowUpRight, 
  Clock, 
  AlertCircle,
  Calendar,
  CheckCircle2,
  LockOpen
} from 'lucide-react';

interface DashboardPageProps {
  onNavigateTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigateTab }) => {
  const { isAdmin } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Live Data States
  const [dayEnd, setDayEnd] = useState<DayEndPreview | null>(null);
  const [pnl, setPnl] = useState<PnlSummary | null>(null);
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [fishermen, setFishermen] = useState<Fisherman[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Parallel fetch for safe reads
      const promises: Promise<any>[] = [
        getDayEndPreview(selectedDate).catch(() => null),
        getStockList({ limit: 100 }).catch(() => []),
        getCustomers('', 'ACTIVE').catch(() => []),
        getRecentSalesData(selectedDate),
      ];

      // Admin restricted data
      if (isAdmin) {
        promises.push(getDailyPnl(selectedDate).catch(() => null));
        promises.push(getFishermen('', 'ACTIVE').catch(() => []));
      }

      const results = await Promise.all(promises);
      setDayEnd(results[0]);
      setStocks(results[1] || []);
      setCustomers(results[2] || []);
      setRecentSales(results[3] || []);

      if (isAdmin) {
        setPnl(results[4]);
        setFishermen(results[5] || []);
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err?.message || 'Failed to load dashboard metrics');
    } finally {
      setIsLoading(false);
    }
  };

  const getRecentSalesData = async (date: string) => {
    try {
      return await getSales({ date, limit: 6 });
    } catch {
      return [];
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedDate, isAdmin]);

  // Aggregate values
  const totalStockKg = stocks.reduce((sum, item) => sum + (parseFloat(item.quantityKg) || 0), 0);
  const totalStockValue = stocks.reduce((sum, item) => sum + (parseFloat(item.totalValue) || 0), 0);
  const buyerOutstanding = parseFloat(dayEnd?.salesSummary?.buyerOutstanding || '0');
  const supplierPayable = parseFloat(dayEnd?.collectionsSummary?.outstandingSupplierPayable || '0');
  const totalAdvancesRecoverable = fishermen.reduce((sum, f) => {
    return sum + (parseFloat(f.advanceBalance || '0') || 0);
  }, 0);

  // Sales totals
  const salesAmount = parseFloat(pnl?.revenue?.netRevenue || dayEnd?.salesSummary?.grossSales || dayEnd?.sales?.totalSalesAmount || '0');
  const salesKg = parseFloat(pnl?.revenue?.totalKgSold || dayEnd?.stockSummary?.totalSoldKg || dayEnd?.sales?.totalSalesKg || '0');
  const purchasesAmount = parseFloat(dayEnd?.collectionsSummary?.grossTotal || dayEnd?.purchases?.totalPurchasesAmount || '0');
  const purchasesKg = parseFloat(dayEnd?.stockSummary?.totalReceivedKg || dayEnd?.purchases?.totalPurchasesKg || '0');
  const wastageKg = parseFloat(pnl?.wastage?.totalWastageKg || dayEnd?.wastageSummary?.totalWastageKg || dayEnd?.wastage?.totalWastageKg || '0');
  const wastageCost = parseFloat(pnl?.wastage?.wastageCost || dayEnd?.wastageSummary?.totalWastageCost || dayEnd?.wastage?.estimatedWastageCost || '0');
  const expensesAmount = parseFloat(pnl?.operatingExpenses?.totalExpenses || dayEnd?.expensesSummary?.totalOpex || dayEnd?.expenses?.totalExpensesAmount || '0');
  const grossProfit = parseFloat(pnl?.grossProfit?.grossProfit || dayEnd?.salesSummary?.grossProfit || '0');
  const operatingProfit = parseFloat(pnl?.operatingProfit?.operatingProfit || '0');

  const isClosed = dayEnd?.isClosed || dayEnd?.status === 'CLOSED';

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-24 md:pb-8 flex flex-col gap-5">
      {/* Top Banner & Date Selector */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              Live Terminal Operations
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-500">Wharf #04 Gate</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Marine Operations Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time procurement, retail POS turnover, cold room inventory, and financial balances
          </p>
        </div>

        {/* Date Filter & Refresh */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
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
            onClick={() => fetchDashboardData()}
            disabled={isLoading}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-teal-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Day End Status Alert Strip */}
      <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm ${
        isClosed
          ? 'bg-amber-50/90 border-amber-300 text-amber-900'
          : 'bg-emerald-50/90 border-emerald-300 text-emerald-900'
      }`}>
        <div className="flex items-center gap-2.5">
          {isClosed ? (
            <Lock className="w-5 h-5 text-amber-600 shrink-0" />
          ) : (
            <LockOpen className="w-5 h-5 text-emerald-600 shrink-0" />
          )}
          <div>
            <span className="font-bold">
              Business Date {selectedDate}: {isClosed ? 'DAY END CLOSED & RECONCILED' : 'DAY OPEN (TRANSACTIONS ACTIVE)'}
            </span>
            <p className="text-[11px] opacity-80 mt-0.5">
              {isClosed 
                ? 'All financial transactions and stock movements for this date are locked against mutation.' 
                : 'Terminal is open for retail billing, dock collections, and inventory adjustments.'}
            </p>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={() => onNavigateTab('day-end')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition-all shadow-sm ${
              isClosed
                ? 'bg-amber-700 hover:bg-amber-800 text-white'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white'
            }`}
          >
            {isClosed ? 'Audit Reconciliation' : 'Day End Closing'}
          </button>
        )}
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Today's Sales */}
        <div 
          onClick={() => onNavigateTab('history')}
          className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm hover:border-teal-500 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Sales</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 font-mono">
            ₹{salesAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 font-medium">
            <span>{salesKg.toFixed(1)} KG Sold</span>
            <span className="text-teal-600 font-bold group-hover:underline flex items-center gap-0.5">
              History <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Metric 2: Today's Dock Purchases */}
        <div 
          onClick={() => onNavigateTab('collection')}
          className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm hover:border-blue-500 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Catch Intake</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 font-mono">
            ₹{purchasesAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 font-medium">
            <span>{purchasesKg.toFixed(1)} KG Landed</span>
            <span className="text-blue-600 font-bold group-hover:underline flex items-center gap-0.5">
              Intake <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Metric 3: Live Cold Room Stock */}
        <div 
          onClick={() => onNavigateTab('stock')}
          className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm hover:border-indigo-500 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cold Storage Stock</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 font-mono">
            {totalStockKg.toFixed(1)} <span className="text-sm font-semibold text-slate-500">KG</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 font-medium">
            <span>₹{totalStockValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Value</span>
            <span className="text-indigo-600 font-bold group-hover:underline flex items-center gap-0.5">
              Stock <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Metric 4: Operating Expenses */}
        <div 
          onClick={() => onNavigateTab('expenses')}
          className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm hover:border-amber-500 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Opex</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 font-mono">
            ₹{expensesAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 font-medium">
            <span>Ice, Diesel, Coolie</span>
            <span className="text-amber-600 font-bold group-hover:underline flex items-center gap-0.5">
              Vouchers <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Financial & Accounting Row (Strictly Backend Authoritative) */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Gross Profit */}
          <div 
            onClick={() => onNavigateTab('pnl')}
            className="p-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-sm cursor-pointer hover:shadow transition-all"
          >
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Gross Profit</span>
            <div className="text-lg sm:text-xl font-black text-emerald-900 font-mono mt-1">
              ₹{grossProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-emerald-700 mt-1 font-medium">
              Margin: {pnl?.grossProfit?.grossMarginPercent || '0.00'}%
            </p>
          </div>

          {/* Operating Profit */}
          <div 
            onClick={() => onNavigateTab('pnl')}
            className="p-4 rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white shadow-sm cursor-pointer hover:shadow transition-all"
          >
            <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">Operating (EBIT)</span>
            <div className="text-lg sm:text-xl font-black text-teal-900 font-mono mt-1">
              ₹{operatingProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-teal-700 mt-1 font-medium">
              Margin: {pnl?.operatingProfit?.operatingMarginPercent || '0.00'}%
            </p>
          </div>

          {/* Fisherman Advances Recoverable */}
          <div 
            onClick={() => onNavigateTab('fishermen')}
            className="p-4 rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white shadow-sm cursor-pointer hover:shadow transition-all"
          >
            <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">Advances Due</span>
            <div className="text-lg sm:text-xl font-black text-purple-900 font-mono mt-1">
              ₹{totalAdvancesRecoverable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-purple-700 mt-1 font-medium">
              Fisherman recoverable
            </p>
          </div>

          {/* Buyer Receivables */}
          <div 
            onClick={() => onNavigateTab('buyers')}
            className="p-4 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-sm cursor-pointer hover:shadow transition-all"
          >
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Buyer Receivables</span>
            <div className="text-lg sm:text-xl font-black text-blue-900 font-mono mt-1">
              ₹{buyerOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-blue-700 mt-1 font-medium">
              Outstanding credit sales
            </p>
          </div>

          {/* Supplier Payable */}
          <div 
            onClick={() => onNavigateTab('collection')}
            className="p-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white shadow-sm cursor-pointer hover:shadow transition-all"
          >
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Supplier Payable</span>
            <div className="text-lg sm:text-xl font-black text-slate-900 font-mono mt-1">
              ₹{supplierPayable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-600 mt-1 font-medium">
              Dock catch net payable
            </p>
          </div>

          {/* Wastage Loss */}
          <div 
            onClick={() => onNavigateTab('wastage')}
            className="p-4 rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white shadow-sm cursor-pointer hover:shadow transition-all"
          >
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Spoilage Loss</span>
            <div className="text-lg sm:text-xl font-black text-rose-900 font-mono mt-1">
              ₹{wastageCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-rose-700 mt-1 font-medium">
              {wastageKg.toFixed(1)} KG written off
            </p>
          </div>
        </div>
      )}

      {/* Quick Launchpad Buttons */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-black text-base sm:text-lg">Terminal Fast Launch</h3>
          <p className="text-xs text-slate-300 mt-0.5">Quickly start retail billing, boat catch weighment, or expense issue</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => onNavigateTab('billing')}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs transition-all active:scale-95 shadow"
          >
            + POS New Bill
          </button>
          <button
            onClick={() => onNavigateTab('collection')}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs transition-all active:scale-95 shadow"
          >
            + Record Catch Collection
          </button>
          <button
            onClick={() => onNavigateTab('export-billing')}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all active:scale-95"
          >
            + Export Bill
          </button>
          <button
            onClick={() => onNavigateTab('rates')}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all active:scale-95"
          >
            Daily Spot Rates
          </button>
        </div>
      </div>

      {/* Split Row: Recent Transactions + Live Inventory Quick View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Invoices Feed */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-teal-600" />
                <h3 className="font-bold text-sm text-slate-900">Recent Customer Invoices ({selectedDate})</h3>
              </div>
              <button
                onClick={() => onNavigateTab('history')}
                className="text-xs text-teal-700 font-bold hover:underline"
              >
                View All
              </button>
            </div>

            {recentSales.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">
                No invoices recorded for {selectedDate} yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentSales.map((sale) => (
                  <div key={sale.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5 font-mono">
                        <span>{sale.invoiceNumber}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          sale.saleType === 'EXPORT' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {sale.saleType}
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        {sale.customer?.name || sale.exportCompany?.companyName || 'Walk-in Cash Buyer'} • {parseFloat(sale.totalKg).toFixed(1)} KG
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold font-mono text-slate-900">
                        ₹{parseFloat(sale.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        sale.paymentStatus === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sale.paymentStatus === 'PARTIALLY_PAID'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {sale.paymentStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cold Storage Species Stock Balance */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900">Cold Storage Inventory Status</h3>
              </div>
              <button
                onClick={() => onNavigateTab('stock')}
                className="text-xs text-indigo-700 font-bold hover:underline"
              >
                Detailed Ledger
              </button>
            </div>

            {stocks.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">
                No active stock balances found in cold rooms.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {stocks.slice(0, 6).map((item) => {
                  const qty = parseFloat(item.quantityKg) || 0;
                  const isLow = qty < 50;

                  return (
                    <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{item.seafood?.name || 'Seafood Item'}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                            {item.grade?.name || 'Standard'}
                          </span>
                        </div>
                        <div className="text-slate-500 text-[11px] mt-0.5">
                          WAC Cost: ₹{parseFloat(item.averageCost).toFixed(2)}/KG
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-black font-mono text-sm ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                          {qty.toFixed(1)} KG
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isLow ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isLow ? 'Low Stock' : 'Available'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
