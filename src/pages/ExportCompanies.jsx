import React, { useState, useEffect } from 'react';
import { localDb } from '../db/dexieDb';
import { queueSyncItem } from '../db/syncEngine';
import { Plus, Trash2, Edit3, Mail, MapPin, Award, Phone, PhoneCall, MessageSquare } from 'lucide-react';
import { COUNTRY_CODES, formatWhatsAppNumber } from '../utils/countryCodes';
import { useNavigate } from 'react-router-dom';

export default function ExportCompanies() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // Form fields
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [gst, setGst] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [outstanding, setOutstanding] = useState(0);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    const data = await localDb.companies.toArray();
    setCompanies(data);
  };

  const resetForm = () => {
    setName('');
    setAddress('');
    setGst('');
    setCountryCode('+91');
    setPhone('');
    setEmail('');
    setContactPerson('');
    setOutstanding(0);
    setEditItem(null);
  };

  const handleOpenEdit = (item) => {
    setEditItem(item);
    setName(item.name);
    setAddress(item.address);
    setGst(item.gst);
    setCountryCode(item.countryCode || '+91');
    const rawMobile = item.mobileNumber || item.phone || '';
    setPhone(rawMobile.replace(item.countryCode, ''));
    setEmail(item.email || '');
    setContactPerson(item.contactPerson || '');
    setOutstanding(item.outstanding);
    setShowAddModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || !phone) return;

    const cleanMobile = phone.replace(/[^0-9]/g, '');
    const whatsappNum = formatWhatsAppNumber(countryCode, cleanMobile);

    const itemData = {
      name,
      address,
      gst,
      countryCode,
      mobileNumber: cleanMobile,
      phone: whatsappNum,
      whatsappNumber: whatsappNum,
      email,
      contactPerson,
      outstanding: parseFloat(outstanding) || 0,
      syncStatus: 'Pending'
    };

    if (editItem) {
      await localDb.companies.put({ ...editItem, ...itemData });
      await queueSyncItem('companies', editItem.id, 'put', { ...editItem, ...itemData });
    } else {
      const newId = 'CO-' + Math.floor(1000 + Math.random() * 9000);
      const newCo = { id: newId, ...itemData };
      await localDb.companies.add(newCo);
      await queueSyncItem('companies', newId, 'add', newCo);
    }

    await loadCompanies();
    setShowAddModal(false);
    resetForm();
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this export company?')) {
      await localDb.companies.delete(id);
      await queueSyncItem('companies', id, 'delete', {});
      await loadCompanies();
    }
  };

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

  const formatCurrency = (val) => '₹' + Math.abs(val || 0).toLocaleString('en-IN');

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Export Companies</h1>
          <p className="text-slate-400 text-sm mt-1">Manage corporate exporter accounts and communication dispatches</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-ocean-500 to-ocean-600 hover:from-ocean-600 hover:to-ocean-700 text-white font-semibold text-sm shadow-lg shadow-ocean-500/10 transition-all"
        >
          Add Export Company
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {companies.map((c) => (
          <div key={c.id} className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-white leading-tight">{c.name}</h3>
                  <div className="text-[10px] text-ocean-400 font-mono font-semibold uppercase tracking-wider mt-1 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" /> GSTIN: {c.gst}
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded-md">{c.id}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-400 font-medium">
                <div className="flex items-start gap-2"><MapPin className="w-3.5 h-3.5 text-slate-550 shrink-0 mt-0.5" /> <span>{c.address}</span></div>
                <div className="flex items-start gap-2"><Mail className="w-3.5 h-3.5 text-slate-550 shrink-0 mt-0.5" /> <span>{c.email || 'N/A'}</span></div>
              </div>

              <div className="p-3 bg-slate-950/40 rounded-2xl text-xs flex justify-between items-center text-slate-350">
                <div>Contact Person: <strong className="text-white">{c.contactPerson || 'N/A'}</strong></div>
                
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                  <button 
                    onClick={() => launchCall(c.countryCode || '+91', c.mobileNumber || c.phone)}
                    className="p-1.5 rounded bg-slate-950 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 text-xs font-bold flex items-center gap-1"
                  >
                    <PhoneCall className="w-3 h-3" /> Call
                  </button>
                  <button 
                    onClick={() => launchWhatsAppGreeting(c.countryCode || '+91', c.mobileNumber || c.phone, c.name)}
                    className="p-1.5 rounded bg-slate-950 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 text-xs font-bold flex items-center gap-1"
                  >
                    <MessageSquare className="w-3 h-3" /> WhatsApp
                  </button>
                  {c.email && (
                    <button 
                      onClick={() => launchEmail(c.email)}
                      className="p-1.5 rounded bg-slate-950 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 text-xs font-bold"
                    >
                      Email
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-850 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Receivables Outstanding</span>
                <span className="text-base font-bold text-emerald-450">
                  {formatCurrency(c.outstanding)}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/export-billing', { state: { selectedCompanyId: c.id } })}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-ocean-500/10 to-ocean-500/20 hover:from-ocean-500/20 hover:to-ocean-500/30 text-ocean-400 hover:text-ocean-300 border border-ocean-500/20 text-xs font-bold"
                >
                  Generate Invoice
                </button>
                <button 
                  onClick={() => handleOpenEdit(c)}
                  className="p-2 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-400 hover:text-white"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(c.id)}
                  className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/10 text-rose-400"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-slate-850 flex justify-between items-center">
              <h3 className="text-base font-bold text-white">{editItem ? 'Edit Exporter details' : 'Add Corporate Exporter'}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Company Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">GSTIN Number</label>
                  <input
                    type="text"
                    required
                    value={gst}
                    onChange={(e) => setGst(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Contact Person</label>
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Dial Code</label>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-2 py-3 text-slate-100 text-sm focus:outline-none"
                  >
                    {COUNTRY_CODES.map(cc => <option key={cc.code} value={cc.code}>{cc.flag} {cc.code}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">WhatsApp Mobile</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows="2"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Ledger Receivable Balance</label>
                <input
                  type="number"
                  value={outstanding}
                  onChange={(e) => setOutstanding(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 text-sm focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-850 flex justify-end">
                <button type="submit" className="px-5 py-3 rounded-xl bg-gradient-to-r from-ocean-500 to-ocean-600 text-white font-semibold text-sm shadow-md">
                  Save Exporter Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
