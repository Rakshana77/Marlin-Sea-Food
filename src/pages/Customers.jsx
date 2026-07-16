import React, { useState, useEffect } from 'react';
import { localDb } from '../db/dexieDb';
import { queueSyncItem } from '../db/syncEngine';
import { Plus, Edit3, Phone, Search, X, Upload, Download, CheckCircle2, AlertCircle, FileSpreadsheet, MessageSquare, Mail, PhoneCall } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { COUNTRY_CODES, formatWhatsAppNumber } from '../utils/countryCodes';

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // Form fields
  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [village, setVillage] = useState('');
  const [bankDetails, setBankDetails] = useState('');

  // Import states
  const [importProgress, setImportProgress] = useState(-1);
  const [duplicatePolicy, setDuplicatePolicy] = useState('skip');
  const [importSummary, setImportSummary] = useState(null);
  const [failedRows, setFailedRows] = useState([]);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    const data = await localDb.customers.toArray();
    setCustomers(data);
  };

  const resetForm = () => {
    setName('');
    setCountryCode('+91');
    setPhone('');
    setEmail('');
    setVillage('');
    setBankDetails('');
    setEditItem(null);
  };

  const handleOpenEdit = (item) => {
    setEditItem(item);
    setName(item.name);
    setCountryCode(item.countryCode || '+91');
    const rawMobile = item.mobileNumber || item.phone || '';
    setPhone(rawMobile.replace(item.countryCode, ''));
    setEmail(item.email || '');
    setVillage(item.village || '');
    setBankDetails(item.bankDetails || '');
    setShowAddModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || !phone) return;

    const cleanMobile = phone.replace(/[^0-9]/g, '');
    const whatsappNum = formatWhatsAppNumber(countryCode, cleanMobile);

    const dataPayload = {
      name,
      countryCode,
      mobileNumber: cleanMobile,
      phone: whatsappNum,
      whatsappNumber: whatsappNum,
      email: email || '',
      village,
      bankDetails,
      syncStatus: 'Pending'
    };

    if (editItem) {
      const updated = { ...editItem, ...dataPayload };
      await localDb.customers.put(updated);
      await queueSyncItem('customers', editItem.id, 'put', updated);
    } else {
      const newId = 'FM-' + Math.floor(1000 + Math.random() * 9000);
      const newFisherman = {
        id: newId,
        ...dataPayload,
        outstanding: 0,
        totalPurchases: 0,
        totalBills: 0,
        status: 'Active',
        createdAt: new Date().toISOString().split('T')[0]
      };
      await localDb.customers.add(newFisherman);
      await queueSyncItem('customers', newId, 'add', newFisherman);
    }

    await loadCustomers();
    setShowAddModal(false);
    resetForm();
  };

  // WhatsApp quick greeting wa.me redirect
  const launchWhatsAppGreeting = (countryCode, mobile, name) => {
    const cleanMobile = mobile.replace(/[^0-9]/g, '');
    const fullPhone = `${countryCode.replace('+', '')}${cleanMobile}`;
    const text = `Hello ${name},\n\nHow are you?\n\nRegards,\nMarlin Sea Food`;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const launchCall = (countryCode, mobile) => {
    const cleanMobile = mobile.replace(/[^0-9]/g, '');
    window.location.href = `tel:${countryCode}${cleanMobile}`;
  };

  const launchEmail = (emailAddr) => {
    if (!emailAddr) return;
    window.location.href = `mailto:${emailAddr}`;
  };

  const handleExcelImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportProgress(10);
    setImportSummary(null);
    setFailedRows([]);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(worksheet);
        
        let imported = 0;
        let updated = 0;
        let skipped = 0;
        let failed = 0;
        const errorReport = [];

        const existingMap = new Map();
        const activeList = await localDb.customers.toArray();
        activeList.forEach(c => existingMap.set(c.whatsappNumber, c));

        const batchAdds = [];
        const batchUpdates = [];

        rawRows.forEach((row, index) => {
          const rowName = row.Name || row['Fisherman Name'] || row['name'];
          const rowMobileRaw = row['Mobile Number'] || row['Phone'] || row['phone'] || row['Mobile'];
          let rowCc = String(row['Country Code'] || row['countryCode'] || '+91').trim();
          if (!rowCc.startsWith('+')) rowCc = '+' + rowCc;

          const cleanMobile = rowMobileRaw ? String(rowMobileRaw).trim().replace(/[^0-9]/g, '') : '';
          const whatsappNum = formatWhatsAppNumber(rowCc, cleanMobile);

          if (!rowName) {
            failed++;
            errorReport.push({ Row: index + 2, Name: 'MISSING', Phone: cleanMobile, Reason: 'Name is required' });
            return;
          }
          if (!cleanMobile) {
            failed++;
            errorReport.push({ Row: index + 2, Name: rowName, Phone: '', Reason: 'Mobile number is required' });
            return;
          }

          const existing = existingMap.get(whatsappNum);
          if (existing) {
            if (duplicatePolicy === 'skip') {
              skipped++;
            } else {
              updated++;
              batchUpdates.push({
                ...existing,
                name: rowName,
                syncStatus: 'Pending'
              });
            }
          } else {
            imported++;
            const newId = 'FM-' + Math.floor(1000 + Math.random() * 9000);
            batchAdds.push({
              id: newId,
              name: rowName,
              countryCode: rowCc,
              mobileNumber: cleanMobile,
              phone: whatsappNum,
              whatsappNumber: whatsappNum,
              email: row.Email || row.email || '',
              village: 'N/A',
              bankDetails: 'N/A',
              outstanding: 0,
              totalPurchases: 0,
              totalBills: 0,
              status: 'Active',
              createdAt: new Date().toISOString().split('T')[0],
              syncStatus: 'Pending'
            });
          }
        });

        if (batchAdds.length > 0) {
          await localDb.customers.bulkAdd(batchAdds);
          for (const item of batchAdds) await queueSyncItem('customers', item.id, 'add', item);
        }
        if (batchUpdates.length > 0) {
          for (const item of batchUpdates) {
            await localDb.customers.put(item);
            await queueSyncItem('customers', item.id, 'put', item);
          }
        }

        setImportProgress(100);
        setImportSummary({ total: rawRows.length, imported, updated, skipped, failed });
        setFailedRows(errorReport);
        await loadCustomers();
      } catch (err) {
        alert('Parsing error.');
        setImportProgress(-1);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExportExcel = () => {
    const exportData = customers.map(c => ({
      Name: c.name,
      'Country Code': c.countryCode || '+91',
      'Mobile Number': c.mobileNumber || c.phone,
      Email: c.email || '',
      Village: c.village || 'N/A',
      Outstanding: c.outstanding || 0
    }));

    const wsNode = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsNode, 'Fishermen');
    XLSX.writeFile(wb, `sams_fishermen_export.xlsx`);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.whatsappNumber?.includes(searchQuery) ||
    c.phone?.includes(searchQuery)
  );

  const formatCurrency = (val) => '₹' + (val || 0).toLocaleString('en-IN');

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Fishermen Registry</h1>
          <p className="text-slate-400 text-xs mt-1">Harbor procurement directory & instant communication widgets</p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button 
            onClick={() => { setImportSummary(null); setFailedRows([]); setImportProgress(-1); setShowImportModal(true); }}
            className="flex-grow sm:flex-grow-0 px-5 py-3 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-350 hover:text-white font-bold text-sm"
          >
            Import Excel
          </button>
          <button 
            onClick={handleExportExcel}
            className="flex-grow sm:flex-grow-0 px-5 py-3 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-350 hover:text-white font-bold text-sm"
          >
            Export Excel
          </button>
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="flex-grow px-6 py-4 rounded-2xl bg-gradient-to-r from-ocean-500 to-ocean-600 hover:from-ocean-600 hover:to-ocean-700 text-white font-bold text-base shadow-lg shadow-ocean-500/10"
          >
            <Plus className="w-5 h-5" />
            Add Fisherman
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-4.5 w-6 h-6 text-slate-500" />
        <input
          type="text"
          placeholder="Search by fisherman name or WhatsApp number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-100 text-base focus:outline-none focus:border-ocean-500 placeholder-slate-500"
        />
      </div>

      {/* Fishermen Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCustomers.map((c) => (
          <div key={c.id} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between gap-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-white leading-tight">{c.name}</h3>
                
                {/* Phone details & communication Action buttons panel */}
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <div className="flex items-center gap-1 text-xs text-slate-400 font-semibold">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{c.whatsappNumber || c.phone}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-850">
                    <button 
                      onClick={() => launchCall(c.countryCode || '+91', c.mobileNumber || c.phone)}
                      className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300"
                      title="Direct Call Dialer"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => launchWhatsAppGreeting(c.countryCode || '+91', c.mobileNumber || c.phone, c.name)}
                      className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300"
                      title="Quick WhatsApp Greeting"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                    {c.email && (
                      <button 
                        onClick={() => launchEmail(c.email)}
                        className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300"
                        title="Send Mail"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded-lg">{c.id}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-950/40 p-3 rounded-xl">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Outstanding</span>
                <span className="text-base font-black text-amber-400 font-mono">{formatCurrency(c.outstanding)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Total Bills</span>
                <span className="text-base font-black text-slate-200 font-mono">{c.totalBills || 0}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => navigate('/purchase-billing', { state: { selectedCustomerId: c.id } })}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-ocean-500/10 to-ocean-500/20 hover:from-ocean-500/20 hover:to-ocean-500/30 text-ocean-400 hover:text-ocean-300 border border-ocean-500/20 text-sm font-bold text-center active:scale-[0.98] transition-transform"
              >
                Create Purchase Bill
              </button>
              <button 
                onClick={() => handleOpenEdit(c)}
                className="p-3 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white active:scale-[0.98] transition-transform"
              >
                <Edit3 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-slate-850 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">{editItem ? 'Edit Profile details' : 'Quick Register Fisherman'}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Fisherman Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-base focus:outline-none focus:border-ocean-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Mobile Number *</label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-1/3 bg-slate-950 border border-slate-800 rounded-xl px-2 text-slate-100 text-base focus:outline-none"
                  >
                    {COUNTRY_CODES.map(cc => (
                      <option key={cc.code} value={cc.code}>{cc.flag} {cc.code}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 px-4 py-3.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-base focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email address (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. fisher@harbor.com"
                  className="w-full px-4 py-3.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-base focus:outline-none"
                />
              </div>

              <div className="space-y-4 pt-2 border-t border-slate-850">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Village / Harbor</label>
                  <input
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Bank & Account Details</label>
                  <input
                    type="text"
                    value={bankDetails}
                    onChange={(e) => setBankDetails(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-850">
                <button
                  type="submit"
                  className="w-full py-4.5 rounded-xl bg-gradient-to-r from-ocean-500 to-ocean-600 text-white font-bold text-base shadow-md"
                >
                  Save Fisherman Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-slate-850 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">Bulk Import Fishermen</h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-2 bg-slate-950/50 p-1 rounded-xl">
                <button type="button" onClick={() => setDuplicatePolicy('skip')} className={`py-2 rounded-lg text-xs font-bold transition-all ${duplicatePolicy === 'skip' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400'}`}>Skip Duplicates</button>
                <button type="button" onClick={() => setDuplicatePolicy('update')} className={`py-2 rounded-lg text-xs font-bold transition-all ${duplicatePolicy === 'update' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400'}`}>Update Duplicates</button>
              </div>

              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl p-8 hover:bg-slate-950/20 cursor-pointer text-center group transition-colors">
                <Upload className="w-10 h-10 text-slate-550 group-hover:text-emerald-400 mb-3" />
                <span className="text-sm font-bold text-slate-350">Click or Drag & Drop Excel / CSV files</span>
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelImport} className="hidden" />
              </label>

              {importProgress >= 0 && importProgress < 100 && (
                <div className="space-y-2">
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${importProgress}%` }} />
                  </div>
                  <div className="text-xs text-slate-500 text-center font-bold">Processing records... {importProgress}%</div>
                </div>
              )}

              {importSummary && (
                <div className="space-y-4 bg-slate-950/50 p-4 rounded-2xl border border-slate-850">
                  <div className="grid grid-cols-5 text-center text-xs gap-1 font-bold">
                    <div className="p-2 bg-slate-900 rounded-lg"><div className="text-slate-400">Total</div><div className="text-base text-slate-200 mt-1">{importSummary.total}</div></div>
                    <div className="p-2 bg-emerald-950/40 rounded-lg"><div className="text-emerald-400">Imported</div><div className="text-base text-emerald-400 mt-1">{importSummary.imported}</div></div>
                    <div className="p-2 bg-cyan-950/40 rounded-lg"><div className="text-cyan-400">Updated</div><div className="text-base text-cyan-400 mt-1">{importSummary.updated}</div></div>
                    <div className="p-2 bg-slate-900 rounded-lg"><div className="text-slate-555">Skipped</div><div className="text-base text-slate-455 mt-1">{importSummary.skipped}</div></div>
                    <div className="p-2 bg-rose-950/40 rounded-lg"><div className="text-rose-450">Failed</div><div className="text-base text-rose-400 mt-1">{importSummary.failed}</div></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
