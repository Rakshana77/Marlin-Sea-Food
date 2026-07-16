import React, { useState, useEffect } from 'react';
import { localDb } from '../db/dexieDb';
import { queueSyncItem } from '../db/syncEngine';
import { Plus, Trash2, Printer, CheckCircle, Calculator, Ship, Share2, PhoneCall, MessageSquare, Mail, Download } from 'lucide-react';
import confetti from 'canvas-confetti';
import axios from 'axios';

export default function ExportBilling() {
  const [companies, setCompanies] = useState([]);
  const [seafoodList, setSeafoodList] = useState([]);
  const [rates, setRates] = useState([]);

  // Form states
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [transportCharges, setTransportCharges] = useState('1500');
  const [packingCharges, setPackingCharges] = useState('800');
  const [taxPercent, setTaxPercent] = useState('5');
  const [remarks, setRemarks] = useState('');

  // Cargo Invoice Items
  const [items, setItems] = useState([
    { seafoodId: '', weight: '', rate: 0, total: 0 }
  ]);

  const [subTotal, setSubTotal] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [netTotal, setNetTotal] = useState(0);
  
  const [completedInvoice, setCompletedInvoice] = useState(null);

  // WhatsApp states
  const [waSending, setWaSending] = useState(false);
  const [waStatus, setWaStatus] = useState('');

  useEffect(() => {
    const loadDexieData = async () => {
      const activeCompanies = await localDb.companies.toArray();
      const activeSeafood = await localDb.seafood.toArray();
      const activeRates = await localDb.rates.toArray();

      setCompanies(activeCompanies);
      setSeafoodList(activeSeafood);
      setRates(activeRates);
    };
    loadDexieData();
  }, []);

  const handleSeafoodChange = (index, seafoodId) => {
    const matchedRate = rates.find(r => r.seafoodId === seafoodId);
    const itemRate = matchedRate ? matchedRate.sellingRate : 0;
    
    const updated = [...items];
    updated[index].seafoodId = seafoodId;
    updated[index].rate = itemRate;
    updated[index].total = itemRate * (parseFloat(updated[index].weight) || 0);
    
    setItems(updated);
    recalcInvoice(updated, transportCharges, packingCharges, taxPercent);
  };

  const handleWeightChange = (index, weight) => {
    const updated = [...items];
    updated[index].weight = weight;
    updated[index].total = updated[index].rate * (parseFloat(weight) || 0);
    
    setItems(updated);
    recalcInvoice(updated, transportCharges, packingCharges, taxPercent);
  };

  const addItemRow = () => {
    setItems([...items, { seafoodId: '', weight: '', rate: 0, total: 0 }]);
  };

  const removeItemRow = (index) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    recalcInvoice(updated, transportCharges, packingCharges, taxPercent);
  };

  const recalcInvoice = (itemList, transport, packing, taxRate) => {
    const sub = itemList.reduce((sum, item) => sum + (item.total || 0), 0);
    const tCharge = parseFloat(transport) || 0;
    const pCharge = parseFloat(packing) || 0;
    const taxAmt = (sub * (parseFloat(taxRate) || 0)) / 100;
    
    setSubTotal(sub);
    setTaxAmount(taxAmt);
    setNetTotal(sub + tCharge + pCharge + taxAmt);
  };

  const handleGenerateInvoice = async (e) => {
    e.preventDefault();
    if (!selectedCompanyId) {
      alert('Please select an export company.');
      return;
    }
    const validItems = items.filter(item => item.seafoodId && parseFloat(item.weight) > 0);
    if (validItems.length === 0) {
      alert('Please configure at least one cargo row.');
      return;
    }

    const selectedCo = companies.find(c => c.id === selectedCompanyId);
    const invoiceId = 'INV-' + Math.floor(5000 + Math.random() * 4999);

    const invoiceData = {
      id: invoiceId,
      companyName: selectedCo.name,
      companyId: selectedCompanyId,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      items: validItems.map(item => {
        const itemInfo = seafoodList.find(s => s.id === item.seafoodId);
        return {
          ...item,
          name: itemInfo ? itemInfo.name : 'Unknown Seafood'
        };
      }),
      subTotal,
      tax: taxAmount,
      transport: parseFloat(transportCharges) || 0,
      packing: parseFloat(packingCharges) || 0,
      netTotal,
      remarks,
      syncStatus: 'Pending'
    };

    await localDb.exportBills.add(invoiceData);
    await queueSyncItem('exportBills', invoiceId, 'add', invoiceData);

    const currentOutstanding = selectedCo.outstanding - netTotal;
    await localDb.companies.update(selectedCompanyId, { outstanding: currentOutstanding });
    await queueSyncItem('companies', selectedCompanyId, 'put', { ...selectedCo, outstanding: currentOutstanding });

    confetti({ particleCount: 100, spread: 70, origin: { y: 0.8 } });
    setCompletedInvoice(invoiceData);
  };

  const handleWhatsAppShare = async (method) => {
    const company = companies.find(c => c.id === completedInvoice.companyId);
    const waPhone = company ? (company.whatsappNumber || company.phone).replace('+', '') : '';

    const msg = `Hello ${completedInvoice.companyName},\n\nThank you for today's seafood export cargo transaction.\n\nInvoice No:\n${completedInvoice.id}\n\nDate:\n${completedInvoice.date}\n\nItems:\n` +
      completedInvoice.items.map(item => `${item.name} (${item.weight} kg) @ ₹${item.rate}/kg = ₹${item.total}`).join('\n') +
      `\n\nGST Tax: ₹${completedInvoice.tax}\nFreight: ₹${completedInvoice.transport}\nNet Total Invoice Value:\n₹${completedInvoice.netTotal}\n\nThank you.\nSeaFood Accounts Management`;

    if (method === 'wa_link') {
      const url = `https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
      setWaStatus('Redirected');
    } else if (method === 'wa_api') {
      setWaSending(true);
      setWaStatus('Sending...');
      try {
        await axios.post('http://localhost:5000/api/whatsapp/send', {
          phoneNumber: waPhone,
          message: msg,
          invoiceId: completedInvoice.id
        });
        setWaStatus('Invoice Delivered');
      } catch (err) {
        setWaStatus('Invoice Failed');
      }
      setWaSending(false);
    }
  };

  const launchCall = () => {
    const company = companies.find(c => c.id === completedInvoice.companyId);
    if (!company) return;
    window.location.href = `tel:${company.countryCode || '+91'}${company.mobileNumber}`;
  };

  const launchEmail = () => {
    const company = companies.find(c => c.id === completedInvoice.companyId);
    if (!company || !company.email) return;
    window.location.href = `mailto:${company.email}`;
  };

  const resetInvoice = () => {
    setSelectedCompanyId('');
    setTransportCharges('1500');
    setPackingCharges('800');
    setTaxPercent('5');
    setRemarks('');
    setItems([{ seafoodId: '', weight: '', rate: 0, total: 0 }]);
    setSubTotal(0);
    setTaxAmount(0);
    setNetTotal(0);
    setCompletedInvoice(null);
    setWaStatus('');
  };

  const formatCurrency = (val) => '₹' + (val || 0).toLocaleString('en-IN');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Export cargo & Invoicing</h1>
        <p className="text-slate-400 text-sm mt-1">Export seafood containers, load-out invoices, transport fees, and auto tax</p>
      </div>

      {completedInvoice ? (
        <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl relative">
          
          {/* Top Right Action Strip */}
          <div className="flex justify-end items-center gap-2 border-b border-slate-850 pb-4">
            <button 
              onClick={() => window.print()}
              className="p-2 rounded bg-slate-950 hover:bg-slate-800 text-slate-350 hover:text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button 
              onClick={() => window.print()}
              className="p-2 rounded bg-slate-950 hover:bg-slate-800 text-slate-350 hover:text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
            <button 
              onClick={() => handleWhatsAppShare('wa_link')}
              className="p-2 rounded bg-slate-950 hover:bg-slate-800 text-emerald-450 hover:text-emerald-300 text-xs font-bold flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
            </button>
            <button 
              onClick={launchCall}
              className="p-2 rounded bg-slate-950 hover:bg-slate-800 text-cyan-455 hover:text-cyan-300 text-xs font-bold flex items-center gap-1.5"
            >
              <PhoneCall className="w-3.5 h-3.5" /> Call Customer
            </button>
          </div>

          <div className="flex justify-between items-start pb-4">
            <div>
              <h3 className="text-xl font-bold text-white">COASTAL SEAFOOD EXPORTERS</h3>
              <p className="text-slate-450 text-xs mt-1">Harbor Road, Neendakara, Kollam, Kerala</p>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 inline-block mb-2">
                Export Invoice
              </span>
              <div className="text-sm font-mono text-slate-350">{completedInvoice.id}</div>
            </div>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-2xl space-y-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Share Transaction Bill</div>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => handleWhatsAppShare('wa_link')}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 border border-slate-850 hover:bg-slate-850 text-slate-200 text-xs font-bold"
              >
                <Share2 className="w-4 h-4 text-emerald-400" /> wa.me
              </button>
              <button 
                onClick={() => handleWhatsAppShare('wa_api')}
                disabled={waSending}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 border border-slate-850 hover:bg-slate-850 text-slate-200 text-xs font-bold"
              >
                <PhoneCall className="w-4 h-4 text-cyan-400" /> Meta API
              </button>
              <button 
                onClick={launchEmail}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 border border-slate-850 hover:bg-slate-850 text-slate-200 text-xs font-bold"
              >
                <Mail className="w-4 h-4 text-indigo-400" /> Send Email
              </button>
            </div>
            {waStatus && (
              <div className={`text-center py-2 rounded-xl text-xs font-bold ${
                waStatus.includes('Delivered') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400 animate-pulse'
              }`}>
                WhatsApp Cloud Delivery: {waStatus}
              </div>
            )}
          </div>

          <table className="w-full text-left text-sm text-slate-350 border-t border-b border-slate-800">
            <thead>
              <tr className="text-xs uppercase text-slate-500 font-semibold border-b border-slate-850">
                <th className="py-2.5">Cargo Item</th>
                <th className="py-2.5 text-right">Selling Rate</th>
                <th className="py-2.5 text-right">Loaded Weight</th>
                <th className="py-2.5 text-right">Cargo Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {completedInvoice.items.map((item, i) => (
                <tr key={i}>
                  <td className="py-3 text-white">{item.name}</td>
                  <td className="py-3 text-right">{formatCurrency(item.rate)}</td>
                  <td className="py-3 text-right">{item.weight} kg</td>
                  <td className="py-3 text-right text-white">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="space-y-2 text-sm text-slate-400 font-medium">
            <div className="flex justify-between"><span>Cargo Subtotal:</span> <span className="text-slate-200">{formatCurrency(completedInvoice.subTotal)}</span></div>
            <div className="flex justify-between"><span>Tax / GST:</span> <span className="text-slate-200">{formatCurrency(completedInvoice.tax)}</span></div>
            <div className="flex justify-between"><span>Ice & Packing Fees:</span> <span className="text-slate-200">{formatCurrency(completedInvoice.packing)}</span></div>
            <div className="flex justify-between"><span>Freight / Transport charges:</span> <span className="text-slate-200">{formatCurrency(completedInvoice.transport)}</span></div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-850">
              <span className="text-slate-300 font-bold">Net Invoice Value:</span>
              <span className="text-2xl font-black text-white">{formatCurrency(completedInvoice.netTotal)}</span>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 flex justify-between gap-3">
            <button onClick={resetInvoice} className="flex-1 py-3 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-300 font-semibold text-sm transition-all">New Cargo Load</button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleGenerateInvoice} className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Export Company Partner</label>
              <select
                required
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 text-sm focus:outline-none"
              >
                <option value="">-- Choose Export Co --</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Freight Cost</label>
                <input type="number" value={transportCharges} onChange={(e) => { setTransportCharges(e.target.value); recalcInvoice(items, e.target.value, packingCharges, taxPercent); }} className="w-full px-3 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">GST %</label>
                <input type="number" value={taxPercent} onChange={(e) => { setTaxPercent(e.target.value); recalcInvoice(items, transportCharges, packingCharges, e.target.value); }} className="w-full px-3 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 text-sm focus:outline-none text-center" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Ice & Packing Fees</label>
              <input type="number" value={packingCharges} onChange={(e) => { setPackingCharges(e.target.value); recalcInvoice(items, transportCharges, e.target.value, taxPercent); }} className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 text-sm focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Transport Remarks</label>
              <input type="text" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="e.g. Container block #3" className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 text-sm focus:outline-none" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-850 pb-2"><h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Cargo Itemization</h3><button type="button" onClick={addItemRow} className="text-xs text-ocean-400 hover:text-ocean-300 font-bold flex items-center gap-1">+ Add Cargo Row</button></div>
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-center bg-slate-950/35 p-3 rounded-2xl border border-slate-850/50">
                <div className="col-span-4"><select required value={item.seafoodId} onChange={(e) => handleSeafoodChange(index, e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-100 text-sm focus:outline-none"><option value="">-- Seafood Category --</option>{seafoodList.filter(s => s.status === 'Active').map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}</select></div>
                <div className="col-span-2"><div className="text-right px-2 font-mono text-xs font-semibold text-slate-450">Selling Rate: {formatCurrency(item.rate)}</div></div>
                <div className="col-span-3"><div className="relative"><input type="number" step="any" required placeholder="0.0" value={item.weight} onChange={(e) => handleWeightChange(index, e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-100 text-sm text-right focus:outline-none" /><span className="absolute right-3 top-2 text-xs text-slate-500 font-mono font-semibold">kg</span></div></div>
                <div className="col-span-2 text-right text-sm font-semibold text-white font-mono">{formatCurrency(item.total)}</div>
                <div className="col-span-1 text-center"><button type="button" onClick={() => removeItemRow(index)} disabled={items.length === 1} className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 disabled:opacity-30"><Trash2 className="w-4 h-4" /></button></div>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-slate-850 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2.5 text-slate-400 text-sm font-semibold"><Ship className="w-5 h-5 text-ocean-400" /><span>Direct integration with harbor shipment dispatch</span></div>
            <div className="flex items-center gap-6">
              <div className="text-right space-y-1">
                <div className="text-xs text-slate-550">Subtotal: {formatCurrency(subTotal)}</div>
                <div className="text-xs text-slate-550">Taxes: {formatCurrency(taxAmount)}</div>
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Net Total</div>
                <div className="text-2xl font-black text-white font-mono">{formatCurrency(netTotal)}</div>
              </div>
              <button type="submit" className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-ocean-500 to-ocean-600 hover:from-ocean-600 hover:to-ocean-700 text-white font-bold text-sm shadow-lg shadow-ocean-500/10 hover:scale-[1.01] transition-all">Generate Export Cargo Bill</button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
