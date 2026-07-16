import React, { useState, useEffect } from 'react';
import { localDb } from '../db/dexieDb';
import { Settings as SettingsIcon, Save, RefreshCw, BadgeInfo, CheckCircle, Database } from 'lucide-react';
import axios from 'axios';

export default function Settings() {
  const [businessName, setBusinessName] = useState('');
  const [logo, setLogo] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [currency, setCurrency] = useState('₹');
  
  // WhatsApp Cloud credentials
  const [whatsappToken, setWhatsappToken] = useState('EAABw2f5ZAxZBoBO9...');
  const [whatsappPhoneId, setWhatsappPhoneId] = useState('10928374652938');
  
  const [success, setSuccess] = useState(false);
  const [dbStats, setDbStats] = useState({ tablesCount: 0, pendingSync: 0 });

  useEffect(() => {
    const fetchSettings = async () => {
      const activeSettings = await localDb.settings.get('config');
      if (activeSettings) {
        setBusinessName(activeSettings.businessName || '');
        setLogo(activeSettings.logo || '');
        setGstNumber(activeSettings.gstNumber || '');
        setAddress(activeSettings.address || '');
        setPhone(activeSettings.phone || '');
        setWhatsapp(activeSettings.whatsapp || '');
        setCurrency(activeSettings.currency || '₹');
      }

      // Read stored local API configurations
      const storedToken = localStorage.getItem('sams_wa_token') || 'EAABw2f5ZAxZBoBO9...';
      const storedPhoneId = localStorage.getItem('sams_wa_phone_id') || '10928374652938';
      setWhatsappToken(storedToken);
      setWhatsappPhoneId(storedPhoneId);

      const pendingSync = await localDb.syncQueue.count();
      setDbStats({
        tablesCount: localDb.tables.length,
        pendingSync
      });
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    const newSettings = {
      key: 'config',
      businessName,
      logo,
      gstNumber,
      address,
      phone,
      whatsapp,
      currency
    };

    await localDb.settings.put(newSettings);
    
    // Save local WhatsApp Cloud API details
    localStorage.setItem('sams_wa_token', whatsappToken);
    localStorage.setItem('sams_wa_phone_id', whatsappPhoneId);
    
    // Register sync queue item
    const syncItem = {
      id: 'config',
      table: 'settings',
      recordId: 'config',
      action: 'put',
      payload: newSettings,
      createdAt: new Date().toISOString(),
      attempts: 0
    };
    await localDb.syncQueue.add(syncItem);

    setSuccess(true);
    setTimeout(() => setSuccess(false), 2500);
  };

  const handleClearQueue = async () => {
    if (confirm('Clear local sync queue? This will drop un-synced items.')) {
      await localDb.syncQueue.clear();
      const pendingSync = await localDb.syncQueue.count();
      setDbStats(prev => ({ ...prev, pendingSync }));
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">System Configuration</h1>
        <p className="text-slate-400 text-sm mt-1">Configure business profile parameters, Meta Cloud API settings, and synchronization states</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Settings */}
        <form onSubmit={handleSave} className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-5">
          <div className="flex justify-between items-center border-b border-slate-850 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-ocean-400" />
              Corporate Identity & WhatsApp Settings
            </h3>
            {success && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 animate-bounce">
                <CheckCircle className="w-3.5 h-3.5" /> Configuration Saved
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Corporate Trading Name</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">GSTIN Registration</label>
              <input
                type="text"
                required
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* Meta API Configuration block */}
          <div className="p-4 bg-slate-950/30 border border-slate-850/80 rounded-2xl space-y-4">
            <h4 className="text-xs font-bold text-ocean-400 uppercase tracking-wider">Method 2: Meta WhatsApp Cloud API credentials</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Meta Phone Number ID</label>
                <input
                  type="text"
                  value={whatsappPhoneId}
                  onChange={(e) => setWhatsappPhoneId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Temporary Access Token</label>
                <input
                  type="password"
                  value={whatsappToken}
                  onChange={(e) => setWhatsappToken(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 text-xs focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Primary Phone</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">WhatsApp Alert Phone</label>
              <input
                type="text"
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Currency Symbol</label>
              <input
                type="text"
                required
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 text-sm focus:outline-none text-center"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Business Address</label>
            <textarea
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows="2"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 text-sm focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-850 flex justify-end">
            <button type="submit" className="px-5 py-3 rounded-xl bg-gradient-to-r from-ocean-500 to-ocean-600 text-white font-semibold text-sm shadow-md flex items-center gap-2">
              <Save className="w-4 h-4" /> Save Configuration
            </button>
          </div>
        </form>

        {/* Database Utility and Status */}
        <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-ocean-400" />
              IndexedDB Schema Status
            </h3>
            <div className="space-y-2 text-xs text-slate-450 font-medium">
              <div className="flex justify-between"><span>Registered Tables:</span> <strong className="text-slate-200">{dbStats.tablesCount} Tables</strong></div>
              <div className="flex justify-between"><span>Pending Sync Logs:</span> <strong className="text-amber-400">{dbStats.pendingSync} operations</strong></div>
              <div className="flex justify-between"><span>Offline Mode Status:</span> <strong className="text-emerald-400">Offline-First Engine active</strong></div>
            </div>
          </div>
          <div className="pt-6 border-t border-slate-850 space-y-3">
            <button
              onClick={handleClearQueue}
              disabled={dbStats.pendingSync === 0}
              className="w-full py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-xs transition-all border border-rose-500/10 disabled:opacity-30"
            >
              Flush Pending Sync Queue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
