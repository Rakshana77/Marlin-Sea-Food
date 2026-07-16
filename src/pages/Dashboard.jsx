import React, { useState, useEffect } from 'react';
import { localDb } from '../db/dexieDb';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingBag, 
  DollarSign, 
  Scale, 
  AlertCircle, 
  Database,
  CloudLightning,
  Clock,
  ArrowRight,
  MessageCircle,
  Share2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

export default function Dashboard() {
  const [metrics, setMetrics] = useState({});
  const [recentBills, setRecentBills] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [storageUsage, setStorageUsage] = useState('Calculating...');

  const calculateQuota = async () => {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      const usedMB = (estimate.usage / (1024 * 1024)).toFixed(2);
      const totalMB = (estimate.quota / (1024 * 1024)).toFixed(0);
      setStorageUsage(`${usedMB} MB / ${totalMB} MB`);
    } else {
      setStorageUsage('IndexedDB Limit: Dynamic');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      // Fetch from Dexie
      const purchases = await localDb.purchaseBills.toArray();
      const exports = await localDb.exportBills.toArray();
      const expenses = await localDb.expenses.toArray();
      const seafoods = await localDb.seafood.toArray();
      const rates = await localDb.rates.toArray();
      const pendingSync = await localDb.syncQueue.count();

      // Calculations
      const todayPurchaseTotal = purchases.reduce((sum, b) => sum + b.grandTotal, 0);
      const todaySalesTotal = exports.reduce((sum, b) => sum + b.netTotal, 0);
      const todayExpensesTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
      const netProfit = todaySalesTotal - todayPurchaseTotal - todayExpensesTotal;

      const totalKgsPurchased = purchases.reduce((sum, b) => {
        return sum + b.items.reduce((itemSum, item) => itemSum + parseFloat(item.weight || 0), 0);
      }, 0);

      const totalKgsExported = exports.reduce((sum, b) => {
        return sum + b.items.reduce((itemSum, item) => itemSum + parseFloat(item.weight || 0), 0);
      }, 0);

      setMetrics({
        todayPurchaseTotal,
        todaySalesTotal,
        todayExpensesTotal,
        netProfit,
        totalKgsPurchased,
        totalKgsExported,
        pendingSync,
        syncedBills: purchases.filter(b => b.syncStatus === 'Completed').length + exports.filter(b => b.syncStatus === 'Completed').length,
        totalBills: purchases.length + exports.length,
        pendingExport: Math.max(0, totalKgsPurchased - totalKgsExported)
      });

      // Recents sorted
      const combined = [...purchases, ...exports]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
      setRecentBills(combined);

      // Alerts
      const activeAlerts = [];
      if (totalKgsPurchased > totalKgsExported) {
        activeAlerts.push({
          id: '1',
          type: 'warning',
          message: `${(totalKgsPurchased - totalKgsExported).toFixed(1)} kg seafood pending container shipment.`
        });
      }
      if (pendingSync > 0) {
        activeAlerts.push({
          id: '2',
          type: 'sync',
          message: `${pendingSync} bills saved locally. Syncing in background queue.`
        });
      }

      setAlerts(activeAlerts);
      calculateQuota();
    };

    fetchData();
  }, []);

  const chartData = [
    { name: 'Mon', Purchase: 12000, Export: 14500, Profit: 2500 },
    { name: 'Tue', Purchase: 18000, Export: 21000, Profit: 3000 },
    { name: 'Wed', Purchase: 15000, Export: 18200, Profit: 3200 },
    { name: 'Thu', Purchase: 24000, Export: 28500, Profit: 4500 },
    { name: 'Fri', Purchase: 22000, Export: 26000, Profit: 4000 },
    { name: 'Sat', Purchase: 29000, Export: 35000, Profit: 6000 },
    { name: 'Sun', Purchase: metrics.todayPurchaseTotal || 16000, Export: metrics.todaySalesTotal || 19000, Profit: metrics.netProfit || 3000 },
  ];

  const formatCurrency = (val) => '₹' + (val || 0).toLocaleString('en-IN');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Marlin Sea Food Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Simple view of daily fish purchases, sales, and system sync state</p>
        </div>
        <div className="text-sm bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-slate-400 flex items-center gap-2">
          <Clock className="w-4 h-4 text-ocean-400" />
          <span>Computer Storage: <strong className="text-white font-mono">{storageUsage}</strong></span>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alerts.map((alert) => (
            <div key={alert.id} className="p-4 rounded-2xl bg-slate-900/40 border border-slate-850 flex items-center gap-3.5">
              <AlertCircle className="w-5 h-5 text-ocean-450 animate-pulse shrink-0" />
              <span className="text-sm text-slate-350 font-medium">{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Metrics Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 hover:border-slate-750 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sync Status</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400"><Database className="w-5 h-5" /></div>
          </div>
          <div className="text-2xl font-bold text-white group-hover:scale-[1.01] transition-transform">{metrics.pendingSync || 0} Pending</div>
          <div className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
            <span className="text-cyan-400 font-semibold">{metrics.syncedBills || 0} Bills</span> synced to Cloud
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 hover:border-slate-750 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Procure Value</span>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400"><ShoppingBag className="w-5 h-5" /></div>
          </div>
          <div className="text-2xl font-bold text-white group-hover:scale-[1.01] transition-transform">{formatCurrency(metrics.todayPurchaseTotal)}</div>
          <div className="text-xs text-slate-500 mt-2">
            Procured <span className="text-orange-400 font-semibold">{metrics.totalKgsPurchased?.toFixed(1)} kg</span> seafood
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 hover:border-slate-750 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cargo Export</span>
            <div className="p-2 rounded-xl bg-ocean-500/10 text-ocean-400"><DollarSign className="w-5 h-5" /></div>
          </div>
          <div className="text-2xl font-bold text-white group-hover:scale-[1.01] transition-transform">{formatCurrency(metrics.todaySalesTotal)}</div>
          <div className="text-xs text-slate-500 mt-2">
            Loaded <span className="text-ocean-400 font-semibold">{metrics.totalKgsExported?.toFixed(1)} kg</span> for shipment
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 hover:border-slate-750 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Session Profit</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              {metrics.netProfit >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
          </div>
          <div className="text-2xl font-bold text-white group-hover:scale-[1.01] transition-transform">{formatCurrency(metrics.netProfit)}</div>
          <div className="text-xs text-slate-500 mt-2">
            Net session margin
          </div>
        </div>
      </div>

      {/* Analytics Chart */}
      <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800">
        <h3 className="text-base font-semibold text-white mb-6">Trade Volume Trend</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorExport" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPurchase" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }} />
              <Area type="monotone" dataKey="Export" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorExport)" strokeWidth={2} />
              <Area type="monotone" dataKey="Purchase" stroke="#f59e0b" fillOpacity={1} fill="url(#colorPurchase)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Ledger Transactions Table */}
      <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800">
        <h3 className="text-base font-semibold text-white mb-6">Recent Ledger Transactions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-350">
            <thead>
              <tr className="text-xs uppercase text-slate-500 tracking-wider border-b border-slate-850">
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Stakeholder</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Net Total</th>
                <th className="py-3 px-4">Cloud Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {recentBills.map((bill) => (
                <tr key={bill.id} className="hover:bg-slate-900/10">
                  <td className="py-4.5 px-4 font-mono text-xs text-slate-450">{bill.id}</td>
                  <td className="py-4.5 px-4 font-bold text-slate-100">{bill.customerName || bill.companyName}</td>
                  <td className="py-4.5 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      bill.id.startsWith('PB') 
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                        : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                    }`}>
                      {bill.id.startsWith('PB') ? 'Procurement' : 'Export Cargo'}
                    </span>
                  </td>
                  <td className="py-4.5 px-4 font-bold text-white">{formatCurrency(bill.grandTotal || bill.netTotal)}</td>
                  <td className="py-4.5 px-4">
                    <span className={`flex items-center gap-1.5 text-xs font-semibold ${
                      bill.syncStatus === 'Completed' ? 'text-emerald-400' : 'text-amber-400 animate-pulse'
                    }`}>
                      {bill.syncStatus === 'Completed' ? 'Synced to Cloud' : 'Local Queue'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
