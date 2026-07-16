import React, { useState, useEffect } from 'react';
import { db } from '../db/localDb';
import { BarChart3, FileSpreadsheet, Download, FileText, ChevronRight, Calendar, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid } from 'recharts';

export default function Reports() {
  const [purchaseBills, setPurchaseBills] = useState([]);
  const [exportBills, setExportBills] = useState([]);
  const [expenses, setExpenses] = useState([]);

  // Stats
  const [stats, setStats] = useState({
    purchaseTotal: 0,
    salesTotal: 0,
    expenseTotal: 0,
    grossProfit: 0,
    netProfit: 0,
    totalKgPurchased: 0,
    totalKgExported: 0
  });

  useEffect(() => {
    const purchases = db.get('purchase_bills');
    const exports = db.get('export_bills');
    const exps = db.get('expenses');

    setPurchaseBills(purchases);
    setExportBills(exports);
    setExpenses(exps);

    const purchaseTotal = purchases.reduce((sum, b) => sum + b.grandTotal, 0);
    const salesTotal = exports.reduce((sum, b) => sum + b.netTotal, 0);
    const expenseTotal = exps.reduce((sum, e) => sum + e.amount, 0);
    
    // Profit metrics
    const grossProfit = salesTotal - purchaseTotal;
    const netProfit = grossProfit - expenseTotal;

    const totalKgPurchased = purchases.reduce((sum, b) => {
      return sum + b.items.reduce((itemSum, item) => itemSum + parseFloat(item.weight || 0), 0);
    }, 0);

    const totalKgExported = exports.reduce((sum, b) => {
      return sum + b.items.reduce((itemSum, item) => itemSum + parseFloat(item.weight || 0), 0);
    }, 0);

    setStats({
      purchaseTotal,
      salesTotal,
      expenseTotal,
      grossProfit,
      netProfit,
      totalKgPurchased,
      totalKgExported
    });
  }, []);

  const monthlyTrend = [
    { name: 'Jan', Purchase: 240000, Sales: 290000, Expenses: 30000 },
    { name: 'Feb', Purchase: 320000, Sales: 385000, Expenses: 35000 },
    { name: 'Mar', Purchase: 280000, Sales: 340000, Expenses: 28000 },
    { name: 'Apr', Purchase: 450000, Sales: 535000, Expenses: 50000 },
    { name: 'May', Purchase: 590000, Sales: 710000, Expenses: 65000 },
    { name: 'Jun', Purchase: 620000, Sales: 745000, Expenses: 70000 },
    { name: 'Jul', Purchase: stats.purchaseTotal || 160000, Sales: stats.salesTotal || 190000, Expenses: stats.expenseTotal || 24000 },
  ];

  const formatCurrency = (val) => '₹' + (val || 0).toLocaleString('en-IN');

  const exportCSV = (type) => {
    alert(`Generating automated Excel/CSV export spreadsheet for: ${type}`);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Financial Reports & Profit & Loss</h1>
          <p className="text-slate-400 text-sm mt-1">Audit container profitability statements, export details and GST tax logs</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => exportCSV('Monthly P&L')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 font-semibold text-xs transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Export Excel
          </button>
          <button 
            onClick={() => exportCSV('Audited PDF')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 font-semibold text-xs transition-all"
          >
            <Download className="w-4 h-4 text-ocean-400" /> Download PDF Report
          </button>
        </div>
      </div>

      {/* P&L Statement card */}
      <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-6 relative overflow-hidden">
        {/* Decorative ambient light */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-ocean-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex justify-between items-center border-b border-slate-850 pb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-ocean-400" />
            Session Profit & Loss Statement (Real-Time)
          </h3>
          <span className="text-xs text-slate-500 font-mono">For period: 2026-07-02</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 uppercase tracking-wider block">Gross Sales Value</span>
            <div className="text-2xl font-bold text-white">{formatCurrency(stats.salesTotal)}</div>
            <p className="text-xs text-slate-500">Export cargo invoice totals</p>
          </div>

          <div className="space-y-1 border-l-0 md:border-l border-slate-850 md:pl-6">
            <span className="text-xs text-slate-500 uppercase tracking-wider block">Acquisition Procurement Value</span>
            <div className="text-2xl font-bold text-white">{formatCurrency(stats.purchaseTotal)}</div>
            <p className="text-xs text-slate-500">Payments committed to fishermen</p>
          </div>

          <div className="space-y-1 border-l-0 md:border-l border-slate-850 md:pl-6">
            <span className="text-xs text-slate-500 uppercase tracking-wider block">Operating Session Margin</span>
            <div className={`text-2xl font-black ${stats.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(stats.netProfit)}
            </div>
            <p className="text-xs text-slate-500">Net margin after ice, packing & logistics</p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-850 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-400">
          <div>Weight Procured: <strong className="text-white">{stats.totalKgPurchased?.toFixed(1)} kg</strong></div>
          <div>Weight Shipped: <strong className="text-white">{stats.totalKgExported?.toFixed(1)} kg</strong></div>
          <div>Operating Overhead: <strong className="text-white">{formatCurrency(stats.expenseTotal)}</strong></div>
          <div>Cargo Yield Margin: <strong className="text-emerald-400">+{((stats.netProfit / (stats.purchaseTotal || 1)) * 100).toFixed(1)}%</strong></div>
        </div>
      </div>

      {/* Analytical charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue chart */}
        <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 flex flex-col justify-between">
          <h3 className="text-base font-bold text-white mb-6">Financial Comparison Trend</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }} />
                <Legend textAnchor="middle" wrapperStyle={{ paddingTop: 10, fontSize: 11 }} />
                <Bar dataKey="Sales" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Purchase" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses Line chart */}
        <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 flex flex-col justify-between">
          <h3 className="text-base font-bold text-white mb-6">Overhead & Expense Trend</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }} />
                <Legend wrapperStyle={{ paddingTop: 10, fontSize: 11 }} />
                <Line type="monotone" dataKey="Expenses" stroke="#ef4444" strokeWidth={2.5} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
