import React, { useState, useEffect } from 'react';
import { getPnlSummary, getPnlBreakdowns } from '../api/pnl';
import { PnlSummary, PnlBreakdowns } from '../types/models';
import { useAuth } from '../hooks/useAuth';
import { 
  TrendingUp, 
  Calendar, 
  RefreshCw, 
  Loader2, 
  Printer, 
  Download, 
  AlertCircle, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Percent, 
  Layers, 
  Fish, 
  Users, 
  Globe, 
  Receipt 
} from 'lucide-react';

export const ProfitAndLossPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const todayStr = new Date().toISOString().split('T')[0];

  const [datePreset, setDatePreset] = useState<'today' | '7days' | 'month' | 'custom'>('today');
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(todayStr);

  const [summary, setSummary] = useState<PnlSummary | null>(null);
  const [breakdowns, setBreakdowns] = useState<PnlBreakdowns | null>(null);
  const [activeBreakdownTab, setActiveBreakdownTab] = useState<'species' | 'category' | 'buyer' | 'export' | 'opex'>('species');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handlePresetChange = (preset: 'today' | '7days' | 'month' | 'custom') => {
    setDatePreset(preset);
    const now = new Date();
    if (preset === 'today') {
      const d = now.toISOString().split('T')[0];
      setStartDate(d);
      setEndDate(d);
    } else if (preset === '7days') {
      const past = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (preset === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(monthStart.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    }
  };

  const loadPnl = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    try {
      const [sum, bdown] = await Promise.all([
        getPnlSummary(startDate, endDate),
        getPnlBreakdowns(startDate, endDate),
      ]);
      setSummary(sum);
      setBreakdowns(bdown);
    } catch (err: any) {
      setError(err?.message || 'Failed to load Profit & Loss statement');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadPnl();
  }, [startDate, endDate]);

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center text-slate-500">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Restricted Financial Module</h2>
        <p className="text-xs text-slate-500 mt-1">
          The Financial Profit & Loss Statement is strictly restricted to Terminal Administrators.
        </p>
      </div>
    );
  }

  const netRevenue = parseFloat(summary?.revenue?.netRevenue || '0');
  const cogs = parseFloat(summary?.cogs?.totalCogs || '0');
  const grossProfit = parseFloat(summary?.grossProfit?.grossProfit || '0');
  const grossMargin = parseFloat(summary?.grossProfit?.grossMarginPercent || '0');
  const wastageCost = parseFloat(summary?.wastage?.wastageCost || '0');
  const totalOpex = parseFloat(summary?.operatingExpenses?.totalExpenses || '0');
  const operatingProfit = parseFloat(summary?.operatingProfit?.operatingProfit || '0');
  const operatingMargin = parseFloat(summary?.operatingProfit?.operatingMarginPercent || '0');

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-24 md:pb-8 flex flex-col gap-5">
      {/* Top Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Authoritative Financial Engine
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Profit & Loss (P&L) Statement
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Strict accounting standards: Immutable COGS valuations, perpetual wastage deductions, and EBIT operating margins
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick presets */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => handlePresetChange('today')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                datePreset === 'today' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => handlePresetChange('7days')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                datePreset === '7days' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => handlePresetChange('month')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                datePreset === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              This Month
            </button>
          </div>

          <button
            onClick={() => loadPnl(true)}
            disabled={isRefreshing}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors"
            title="Refresh P&L"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Date Range Inputs */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-700">
        <span className="text-slate-500 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>Accounting Period:</span>
        </span>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setDatePreset('custom'); }}
            className="px-2.5 py-1.5 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setDatePreset('custom'); }}
            className="px-2.5 py-1.5 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-24 bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <span className="text-xs font-semibold">Auditing financial general ledger...</span>
        </div>
      ) : summary && (
        <div className="flex flex-col gap-5">
          {/* Executive Waterfall Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Net Revenue */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Net Sales Revenue</span>
                <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1">
                  ₹{netRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="text-xs text-slate-500 mt-3 pt-2.5 border-t border-slate-100 flex justify-between">
                <span>{parseFloat(summary.revenue?.totalKgSold || '0').toFixed(1)} KG Sold</span>
                <span>{summary.revenue?.completedSalesCount} Invoices</span>
              </div>
            </div>

            {/* 2. COGS */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Cost of Goods Sold (COGS)</span>
                <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1">
                  ₹{cogs.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="text-xs text-slate-500 mt-3 pt-2.5 border-t border-slate-100 flex justify-between">
                <span>Avg COGS: ₹{parseFloat(summary.cogs?.averageCogsPerKg || '0').toFixed(2)}/KG</span>
                <span>WAC Based</span>
              </div>
            </div>

            {/* 3. Gross Profit */}
            <div className="p-4 sm:p-5 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Gross Trading Profit</span>
                <div className="text-xl sm:text-2xl font-black text-emerald-950 font-mono mt-1">
                  ₹{grossProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="text-xs text-emerald-800 mt-3 pt-2.5 border-t border-emerald-200 flex justify-between font-bold">
                <span>Gross Margin:</span>
                <span className="font-mono">{grossMargin.toFixed(2)}%</span>
              </div>
            </div>

            {/* 4. Operating Profit (EBIT) */}
            <div className="p-4 sm:p-5 rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800">Operating Profit (EBIT)</span>
                <div className="text-xl sm:text-2xl font-black text-teal-950 font-mono mt-1">
                  ₹{operatingProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="text-xs text-teal-800 mt-3 pt-2.5 border-t border-teal-200 flex justify-between font-bold">
                <span>Operating Margin:</span>
                <span className="font-mono">{operatingMargin.toFixed(2)}%</span>
              </div>
            </div>
          </div>

          {/* Sub-deductions Strip: Spoilage Loss & Operating Expenses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 bg-white rounded-2xl border border-rose-200/90 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-800">Perpetual Wastage Cost</span>
                <div className="text-lg sm:text-xl font-black text-rose-950 font-mono mt-0.5">
                  -₹{wastageCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  {parseFloat(summary.wastage?.totalWastageKg || '0').toFixed(1)} KG written off directly from inventory
                </p>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-amber-200/90 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Operating Expenses & Wages</span>
                <div className="text-lg sm:text-xl font-black text-amber-950 font-mono mt-0.5">
                  -₹{totalOpex.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Worker Wages: ₹{parseFloat(summary.operatingExpenses?.workerWages || '0').toLocaleString('en-IN')} • Ice/Fuel: ₹{parseFloat(summary.operatingExpenses?.otherExpenses || '0').toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          {/* Breakdowns Section */}
          {breakdowns && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              {/* Tab Navigation */}
              <div className="p-3 border-b border-slate-100 flex flex-wrap items-center gap-1.5 bg-slate-50">
                <button
                  onClick={() => setActiveBreakdownTab('species')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeBreakdownTab === 'species'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Fish className="w-3.5 h-3.5 text-teal-600" />
                  <span>By Species ({breakdowns.seafoodBreakdown?.length || 0})</span>
                </button>

                <button
                  onClick={() => setActiveBreakdownTab('category')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeBreakdownTab === 'category'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>By Category ({breakdowns.categoryBreakdown?.length || 0})</span>
                </button>

                <button
                  onClick={() => setActiveBreakdownTab('buyer')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeBreakdownTab === 'buyer'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>By Wholesale Buyer ({breakdowns.buyerBreakdown?.length || 0})</span>
                </button>

                <button
                  onClick={() => setActiveBreakdownTab('export')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeBreakdownTab === 'export'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5 text-purple-600" />
                  <span>By Export Client ({breakdowns.exportBreakdown?.length || 0})</span>
                </button>

                <button
                  onClick={() => setActiveBreakdownTab('opex')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeBreakdownTab === 'opex'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5 text-amber-600" />
                  <span>By Expense Category ({breakdowns.expenseCategoryBreakdown?.length || 0})</span>
                </button>
              </div>

              {/* Table Data */}
              <div className="overflow-x-auto">
                {activeBreakdownTab === 'species' && (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">Seafood Species</th>
                        <th className="py-3 px-3">Category</th>
                        <th className="py-3 px-3 text-right">Volume (KG)</th>
                        <th className="py-3 px-3 text-right">Revenue</th>
                        <th className="py-3 px-3 text-right">COGS</th>
                        <th className="py-3 px-3 text-right">Gross Profit</th>
                        <th className="py-3 px-4 text-right">Margin %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {breakdowns.seafoodBreakdown?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-bold text-slate-900">{item.seafoodName}</td>
                          <td className="py-3 px-3 text-slate-500">{item.categoryName}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold">{parseFloat(item.totalKg).toFixed(1)} KG</td>
                          <td className="py-3 px-3 text-right font-mono">₹{parseFloat(item.revenue).toFixed(2)}</td>
                          <td className="py-3 px-3 text-right font-mono text-slate-500">₹{parseFloat(item.cogs).toFixed(2)}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">₹{parseFloat(item.grossProfit).toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900">{item.grossMarginPercent}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {activeBreakdownTab === 'category' && (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-3 text-right">Volume (KG)</th>
                        <th className="py-3 px-3 text-right">Revenue</th>
                        <th className="py-3 px-3 text-right">COGS</th>
                        <th className="py-3 px-3 text-right">Gross Profit</th>
                        <th className="py-3 px-4 text-right">Margin %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {breakdowns.categoryBreakdown?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-bold text-slate-900">{item.categoryName}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold">{parseFloat(item.totalKg).toFixed(1)} KG</td>
                          <td className="py-3 px-3 text-right font-mono">₹{parseFloat(item.revenue).toFixed(2)}</td>
                          <td className="py-3 px-3 text-right font-mono text-slate-500">₹{parseFloat(item.cogs).toFixed(2)}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">₹{parseFloat(item.grossProfit).toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900">{item.grossMarginPercent}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {activeBreakdownTab === 'buyer' && (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">Wholesale Buyer</th>
                        <th className="py-3 px-3 text-right">Volume (KG)</th>
                        <th className="py-3 px-3 text-right">Revenue</th>
                        <th className="py-3 px-4 text-right">Gross Profit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {breakdowns.buyerBreakdown?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-bold text-slate-900">{item.customerName}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold">{parseFloat(item.totalKg).toFixed(1)} KG</td>
                          <td className="py-3 px-3 text-right font-mono">₹{parseFloat(item.revenue).toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">₹{parseFloat(item.grossProfit).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {activeBreakdownTab === 'export' && (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">Export Client</th>
                        <th className="py-3 px-3 text-right">Volume (KG)</th>
                        <th className="py-3 px-3 text-right">Revenue</th>
                        <th className="py-3 px-4 text-right">Gross Profit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {breakdowns.exportBreakdown?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-bold text-slate-900">{item.companyName}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold">{parseFloat(item.totalKg).toFixed(1)} KG</td>
                          <td className="py-3 px-3 text-right font-mono">₹{parseFloat(item.revenue).toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">₹{parseFloat(item.grossProfit).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {activeBreakdownTab === 'opex' && (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">Expense Category</th>
                        <th className="py-3 px-3 text-center">Vouchers Count</th>
                        <th className="py-3 px-4 text-right">Total Outflow (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {breakdowns.expenseCategoryBreakdown?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-bold text-slate-900">{item.category}</td>
                          <td className="py-3 px-3 text-center font-mono font-semibold">{item.count}</td>
                          <td className="py-3 px-4 text-right font-mono font-black text-amber-900">₹{parseFloat(item.totalAmount).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
