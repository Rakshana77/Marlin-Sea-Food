import React, { useState, useEffect } from 'react';
import { localDb } from '../db/dexieDb';
import { queueSyncItem } from '../db/syncEngine';
import { Plus, Trash2, Printer, CheckCircle, Calculator, PhoneCall, Share2, UserPlus, X, Download, Mail, MessageSquare } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import confetti from 'canvas-confetti';
import axios from 'axios';
import { COUNTRY_CODES, formatWhatsAppNumber } from '../utils/countryCodes';

export default function PurchaseBilling() {
  const location = useLocation();
  const [customers, setCustomers] = useState([]);
  const [seafoodList, setSeafoodList] = useState([]);
  const [rates, setRates] = useState([]);

  // Form selections
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [remarks, setRemarks] = useState('');

  // Cart / Items
  const [items, setItems] = useState([
    { seafoodId: '', weight: '', rate: 0, total: 0 }
  ]);

  const [grandTotal, setGrandTotal] = useState(0);
  const [completedBill, setCompletedBill] = useState(null);

  // WhatsApp Integration states
  const [waSending, setWaSending] = useState(false);
  const [waStatus, setWaStatus] = useState('');

  // Quick Add Fisherman Pop-up states
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickCountryCode, setQuickCountryCode] = useState('+91');
  const [quickPhone, setQuickPhone] = useState('');

  const loadDexieData = async () => {
    const activeCustomers = await localDb.customers.toArray();
    const activeSeafood = await localDb.seafood.toArray();
    const activeRates = await localDb.rates.toArray();
    
    setCustomers(activeCustomers);
    setSeafoodList(activeSeafood);
    setRates(activeRates);
  };

  useEffect(() => {
    loadDexieData();
  }, []);

  useEffect(() => {
    if (location.state && location.state.selectedCustomerId) {
      setSelectedCustomerId(location.state.selectedCustomerId);
    }
  }, [location.state, customers]);

  const handleSeafoodChange = (index, seafoodId) => {
    const matchedRate = rates.find(r => r.seafoodId === seafoodId);
    const itemRate = matchedRate ? matchedRate.purchaseRate : 0;
    
    const updated = [...items];
    updated[index].seafoodId = seafoodId;
    updated[index].rate = itemRate;
    updated[index].total = itemRate * (parseFloat(updated[index].weight) || 0);
    
    setItems(updated);
    calcGrandTotal(updated);
  };

  const handleWeightChange = (index, weight) => {
    const updated = [...items];
    updated[index].weight = weight;
    updated[index].total = updated[index].rate * (parseFloat(weight) || 0);
    
    setItems(updated);
    calcGrandTotal(updated);
  };

  const addItemRow = () => {
    setItems([...items, { seafoodId: '', weight: '', rate: 0, total: 0 }]);
  };

  const removeItemRow = (index) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    calcGrandTotal(updated);
  };

  const calcGrandTotal = (itemList) => {
    const total = itemList.reduce((sum, item) => sum + (item.total || 0), 0);
    setGrandTotal(total);
  };

  const handleGenerateBill = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      alert('Please select a fisherman / customer.');
      return;
    }
    
    const validItems = items.filter(item => item.seafoodId && parseFloat(item.weight) > 0);
    if (validItems.length === 0) {
      alert('Please add at least one valid seafood item.');
      return;
    }

    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
    const billId = 'PB-' + Math.floor(1000 + Math.random() * 9000);

    const billData = {
      id: billId,
      customerName: selectedCustomer.name,
      customerId: selectedCustomerId,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      items: validItems.map(item => {
        const itemInfo = seafoodList.find(s => s.id === item.seafoodId);
        return {
          ...item,
          name: itemInfo ? itemInfo.name : 'Unknown Seafood'
        };
      }),
      grandTotal,
      paymentMode,
      remarks,
      syncStatus: 'Pending'
    };

    await localDb.purchaseBills.add(billData);
    await queueSyncItem('purchaseBills', billId, 'add', billData);

    const currentOutstanding = selectedCustomer.outstanding + grandTotal;
    const currentTotalBills = (selectedCustomer.totalBills || 0) + 1;
    await localDb.customers.update(selectedCustomerId, { 
      outstanding: currentOutstanding,
      totalBills: currentTotalBills
    });
    await queueSyncItem('customers', selectedCustomerId, 'put', { 
      ...selectedCustomer, 
      outstanding: currentOutstanding,
      totalBills: currentTotalBills
    });

    confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });
    setCompletedBill(billData);
  };

  const handleQuickAddFisherman = async (e) => {
    e.preventDefault();
    if (!quickName || !quickPhone) return;

    const cleanMobile = quickPhone.replace(/[^0-9]/g, '');
    const whatsappNum = formatWhatsAppNumber(quickCountryCode, cleanMobile);

    const newId = 'FM-' + Math.floor(1000 + Math.random() * 9000);
    const newFisherman = {
      id: newId,
      name: quickName,
      countryCode: quickCountryCode,
      mobileNumber: cleanMobile,
      phone: whatsappNum,
      whatsappNumber: whatsappNum,
      email: '',
      village: 'N/A',
      bankDetails: 'N/A',
      outstanding: 0,
      totalPurchases: 0,
      totalBills: 0,
      status: 'Active',
      createdAt: new Date().toISOString().split('T')[0],
      syncStatus: 'Pending'
    };

    await localDb.customers.add(newFisherman);
    await queueSyncItem('customers', newId, 'add', newFisherman);

    await loadDexieData();
    setSelectedCustomerId(newId);
    
    setQuickName('');
    setQuickPhone('');
    setQuickCountryCode('+91');
    setShowQuickAdd(false);
  };

  const handleWhatsAppShare = async (method) => {
    const customer = customers.find(c => c.id === completedBill.customerId);
    const waPhone = customer ? (customer.whatsappNumber || customer.phone).replace('+', '') : '';
    
    // Construct pre-filled message matching requirements
    const msg = `Hello ${completedBill.customerName},\n\nThank you for your seafood transaction.\n\nInvoice No: ${completedBill.id}\n\nDate:\n${completedBill.date}\n\nItems\n` +
      completedBill.items.map(item => `• ${item.name}\n  ${item.weight} Kg × ₹${item.rate}\n  ₹${item.total.toLocaleString('en-IN')}`).join('\n\n') +
      `\n\nGrand Total\n\n₹${completedBill.grandTotal.toLocaleString('en-IN')}\n\nThank you for choosing Marlin Sea Food.`;

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
          invoiceId: completedBill.id
        });
        setWaStatus('Invoice Delivered');
      } catch (err) {
        setWaStatus('Invoice Failed');
      }
      setWaSending(false);
    }
  };

  const launchCall = () => {
    const customer = customers.find(c => c.id === completedBill.customerId);
    if (!customer) return;
    window.location.href = `tel:${customer.countryCode || '+91'}${customer.mobileNumber}`;
  };

  const launchEmail = () => {
    const customer = customers.find(c => c.id === completedBill.customerId);
    if (!customer || !customer.email) return;
    window.location.href = `mailto:${customer.email}`;
  };

  const resetBilling = () => {
    setSelectedCustomerId('');
    setPaymentMode('Cash');
    setRemarks('');
    setItems([{ seafoodId: '', weight: '', rate: 0, total: 0 }]);
    setGrandTotal(0);
    setCompletedBill(null);
    setWaStatus('');
  };

  const formatCurrency = (val) => '₹' + (val || 0).toLocaleString('en-IN');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Fisherman Procurement Billing</h1>
        <p className="text-slate-400 text-sm mt-1">Acquire seafood weights, compute instant rates, and print settlement slips</p>
      </div>

      {completedBill ? (
        /* Bill Completed page with required action widgets */
        <div className="max-w-xl mx-auto p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl relative">
          
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

          <div className="text-center pb-4">
            <h3 className="text-xl font-bold text-white">MARLIN SEA FOOD</h3>
            <p className="text-slate-400 text-xs mt-1">Harbor Road, Neendakara, Kollam, Kerala</p>
          </div>

          {/* Action widgets & retry statuses */}
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
                <th className="py-2.5">Items</th>
                <th className="py-2.5 text-right">Rate/kg</th>
                <th className="py-2.5 text-right">Weight</th>
                <th className="py-2.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 font-medium">
              {completedBill.items.map((item, i) => (
                <tr key={i}>
                  <td className="py-3 text-white">{item.name}</td>
                  <td className="py-3 text-right">{formatCurrency(item.rate)}</td>
                  <td className="py-3 text-right">{item.weight} kg</td>
                  <td className="py-3 text-right text-white">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between items-center pt-2">
            <span className="text-slate-400 font-semibold">Grand Total:</span>
            <span className="text-2xl font-black text-white">{formatCurrency(completedBill.grandTotal)}</span>
          </div>

          <div className="pt-6 border-t border-slate-800 flex justify-between gap-3">
            <button onClick={resetBilling} className="flex-grow py-3 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-300 font-semibold text-sm transition-all">Next Bill</button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleGenerateBill} className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Fisherman Source</label>
                <button type="button" onClick={() => setShowQuickAdd(true)} className="text-xs text-ocean-400 hover:text-ocean-300 font-bold flex items-center gap-1"><UserPlus className="w-3.5 h-3.5" /> Quick Register</button>
              </div>
              <select
                required
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 text-sm focus:outline-none"
              >
                <option value="">-- Choose Fisherman --</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.whatsappNumber || c.phone})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Settlement Mode</label>
              <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 text-sm focus:outline-none"><option value="Cash">Cash</option><option value="UPI Pay">UPI (Instant)</option><option value="Bank Transfer">Bank Transfer</option></select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Remarks</label>
              <input type="text" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="e.g. Morning session load" className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 text-sm focus:outline-none" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-850 pb-2"><h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Weight Slips Rows</h3><button type="button" onClick={addItemRow} className="text-xs text-ocean-400 hover:text-ocean-300 font-bold flex items-center gap-1">+ Add Weight Slip Row</button></div>
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-center bg-slate-950/35 p-3 rounded-2xl border border-slate-850/50">
                <div className="col-span-4"><select required value={item.seafoodId} onChange={(e) => handleSeafoodChange(index, e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-100 text-sm focus:outline-none"><option value="">-- Seafood --</option>{seafoodList.filter(s => s.status === 'Active').map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}</select></div>
                <div className="col-span-2"><div className="text-right px-2 font-mono text-xs font-semibold text-slate-450">Rate: {formatCurrency(item.rate)}</div></div>
                <div className="col-span-3"><div className="relative"><input type="number" step="any" required placeholder="0.0" value={item.weight} onChange={(e) => handleWeightChange(index, e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-100 text-sm text-right focus:outline-none" /><span className="absolute right-3 top-2 text-xs text-slate-500 font-mono font-semibold">kg</span></div></div>
                <div className="col-span-2 text-right text-sm font-semibold text-white font-mono">{formatCurrency(item.total)}</div>
                <div className="col-span-1 text-center"><button type="button" onClick={() => removeItemRow(index)} disabled={items.length === 1} className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 disabled:opacity-30"><Trash2 className="w-4 h-4" /></button></div>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-slate-850 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2.5 text-slate-400 text-sm font-semibold"><Calculator className="w-5 h-5 text-ocean-400" /><span>Live offline calculations supported</span></div>
            <div className="flex items-center gap-6">
              <div className="text-right"><span className="text-xs text-slate-500 block uppercase tracking-wider">Grand Total</span><span className="text-2xl font-black text-white font-mono">{formatCurrency(grandTotal)}</span></div>
              <button type="submit" className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-ocean-500 to-ocean-600 hover:from-ocean-600 hover:to-ocean-700 text-white font-bold text-sm shadow-lg shadow-ocean-500/10 hover:scale-[1.01] transition-all">Procure & Auto Settlement</button>
            </div>
          </div>
        </form>
      )}

      {showQuickAdd && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-slate-850 flex justify-between items-center"><h3 className="text-base font-bold text-white">Quick Register Fisherman</h3><button type="button" onClick={() => setShowQuickAdd(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleQuickAddFisherman} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Fisherman Name *</label>
                <input type="text" required value={quickName} onChange={(e) => setQuickName(e.target.value)} placeholder="e.g. Antony Raju" className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">WhatsApp Mobile *</label>
                <div className="flex gap-2">
                  <select value={quickCountryCode} onChange={(e) => setQuickCountryCode(e.target.value)} className="w-1/3 bg-slate-950 border border-slate-800 rounded-xl px-2 text-slate-100 text-sm focus:outline-none">
                    {COUNTRY_CODES.map(cc => <option key={cc.code} value={cc.code}>{cc.flag} {cc.code}</option>)}
                  </select>
                  <input type="text" required value={quickPhone} onChange={(e) => setQuickPhone(e.target.value)} placeholder="e.g. 9845012345" className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none" />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-850 flex justify-end">
                <button type="submit" className="w-full py-3.5 rounded-xl bg-gradient-to-r from-ocean-500 to-ocean-600 text-white font-bold text-sm shadow-md active:scale-[0.98]">Register & Select</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
