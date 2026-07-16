import React, { useState, useEffect } from 'react';
import { localDb } from '../db/dexieDb';
import { queueSyncItem } from '../db/syncEngine';
import { TrendingUp, Calendar, History, ShieldCheck } from 'lucide-react';

export default function DailyRates() {
  const [rates, setRates] = useState([]);
  const [history, setHistory] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);

  // Edit states
  const [editId, setEditId] = useState(null);
  const [newPurchase, setNewPurchase] = useState('');
  const [newSelling, setNewSelling] = useState('');

  const loadRatesAndSeafood = async () => {
    // 1. Fetch current rates & active seafood master catalog items
    const activeSeafood = await localDb.seafood.toArray();
    const storedRates = await localDb.rates.toArray();

    // 2. Map rates directly from active seafood master list so they stay perfectly in sync
    const mappedRates = activeSeafood.map(item => {
      // Find existing rate pricing configuration if present
      const existingRate = storedRates.find(r => r.seafoodId === item.id);
      return {
        seafoodId: item.id,
        name: item.name,
        category: item.category,
        purchaseRate: existingRate ? existingRate.purchaseRate : 0,
        sellingRate: existingRate ? existingRate.sellingRate : 0,
        date: existingRate ? existingRate.date : '2026-07-02'
      };
    });

    setRates(mappedRates);
  };

  useEffect(() => {
    loadRatesAndSeafood();

    // Initial rates history simulation
    setHistory([
      { date: '2026-07-02', seafood: 'Premium Squid', pRate: 420, sRate: 470 },
      { date: '2026-07-01', seafood: 'Premium Squid', pRate: 410, sRate: 465 },
      { date: '2026-06-30', seafood: 'Premium Squid', pRate: 415, sRate: 470 },
      { date: '2026-07-02', seafood: 'Mud Crab', pRate: 620, sRate: 700 },
      { date: '2026-07-01', seafood: 'Mud Crab', pRate: 630, sRate: 710 },
      { date: '2026-07-02', seafood: 'Tiger Prawn', pRate: 850, sRate: 980 },
    ]);
  }, []);

  const handleUpdate = (seafoodId, currentPRate, currentSRate) => {
    setEditId(seafoodId);
    setNewPurchase(currentPRate);
    setNewSelling(currentSRate);
  };

  const handleSave = async (seafoodId) => {
    setIsUpdating(true);
    
    const rateItem = rates.find(r => r.seafoodId === seafoodId);
    if (!rateItem) return;

    const pRate = parseFloat(newPurchase) || 0;
    const sRate = parseFloat(newSelling) || 0;

    const rateData = {
      seafoodId,
      name: rateItem.name,
      purchaseRate: pRate,
      sellingRate: sRate,
      date: '2026-07-02',
      syncStatus: 'Pending'
    };

    // Save/Update rate in Dexie local storage
    await localDb.rates.put(rateData);
    await queueSyncItem('rates', seafoodId, 'put', rateData);

    // Prepend to history log
    setHistory(prev => [
      { 
        date: '2026-07-02', 
        seafood: rateItem.name, 
        pRate, 
        sRate 
      },
      ...prev
    ]);

    await loadRatesAndSeafood();
    setEditId(null);
    setIsUpdating(false);
  };

  const formatCurrency = (val) => '₹' + (val || 0).toLocaleString('en-IN');

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Trading Daily Rates</h1>
          <p className="text-slate-400 text-sm mt-1">Configure procurement purchase rates and target selling prices</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Calendar className="w-4 h-4 text-ocean-400" />
          <span>Active Session Date: <strong className="text-white font-mono">2026-07-02</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pricing editor */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-850 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-ocean-400" />
              Procurement & Selling Catalog
            </h3>
            <span className="text-xs text-slate-450 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-450" /> Auto-sync enabled
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-350">
              <thead className="text-xs uppercase text-slate-505 tracking-wider">
                <tr className="border-b border-slate-850">
                  <th className="py-3 px-2">Seafood Category</th>
                  <th className="py-3 px-2 text-right">Purchase Rate / kg</th>
                  <th className="py-3 px-2 text-right">Selling Rate / kg</th>
                  <th className="py-3 px-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {rates.map((rate) => {
                  const isEditing = editId === rate.seafoodId;
                  return (
                    <tr key={rate.seafoodId} className="hover:bg-slate-900/10">
                      <td className="py-4 px-2">
                        <div className="font-bold text-white">{rate.name}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{rate.category}</div>
                      </td>
                      <td className="py-4 px-2 text-right font-semibold text-slate-200">
                        {isEditing ? (
                          <input
                            type="number"
                            value={newPurchase}
                            onChange={(e) => setNewPurchase(e.target.value)}
                            className="w-20 text-right bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-sm focus:outline-none"
                          />
                        ) : (
                          formatCurrency(rate.purchaseRate)
                        )}
                      </td>
                      <td className="py-4 px-2 text-right font-semibold text-slate-200">
                        {isEditing ? (
                          <input
                            type="number"
                            value={newSelling}
                            onChange={(e) => setNewSelling(e.target.value)}
                            className="w-20 text-right bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-sm focus:outline-none"
                          />
                        ) : (
                          formatCurrency(rate.sellingRate)
                        )}
                      </td>
                      <td className="py-4 px-2 text-center">
                        {isEditing ? (
                          <button
                            onClick={() => handleSave(rate.seafoodId)}
                            disabled={isUpdating}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold"
                          >
                            {isUpdating ? 'Saving...' : 'Save'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdate(rate.seafoodId, rate.purchaseRate, rate.sellingRate)}
                            className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white border border-slate-850 text-xs font-medium"
                          >
                            Update Rate
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit history list */}
        <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
              Daily Rate Log History
            </h3>
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
              {history.map((h, i) => (
                <div key={i} className="p-3 bg-slate-950/40 border border-slate-855 rounded-2xl flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-300">{h.seafood}</span>
                    <span className="text-slate-500 font-mono">{h.date}</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono text-slate-450">
                    <span>P: <strong className="text-amber-400">{formatCurrency(h.pRate)}</strong></span>
                    <span>S: <strong className="text-sky-400">{formatCurrency(h.sRate)}</strong></span>
                    <span className="text-emerald-400 font-bold">Margin: {formatCurrency(h.sRate - h.pRate)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-4 border-t border-slate-850 mt-6 text-center text-xs text-slate-500">
            Daily logs persisted locally
          </div>
        </div>
      </div>
    </div>
  );
}
