import React, { useState, useEffect } from 'react';
import { db } from '../db/localDb';
import { Plus, Trash2, Calendar, FileText, DollarSign, Tag } from 'lucide-react';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [category, setCategory] = useState('Ice');
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');

  const categories = ['Ice', 'Transport', 'Labour', 'Fuel', 'Electricity', 'Rent', 'Salary', 'Miscellaneous'];

  useEffect(() => {
    setExpenses(db.get('expenses'));
  }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    const newExpense = {
      category,
      amount: parseFloat(amount) || 0,
      remarks,
      date: '2026-07-02'
    };

    db.insert('expenses', newExpense);
    setExpenses(db.get('expenses'));
    
    // reset
    setAmount('');
    setRemarks('');
    setShowAddModal(false);
  };

  const handleDelete = (id) => {
    if (confirm('Delete this expense line item?')) {
      db.delete('expenses', id);
      setExpenses(db.get('expenses'));
    }
  };

  const formatCurrency = (val) => '₹' + (val || 0).toLocaleString('en-IN');

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Expense Ledger</h1>
          <p className="text-slate-400 text-sm mt-1">Record overhead parameters: Ice blocks, packing freight, labour, and generator fuel costs</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-ocean-500 to-ocean-600 hover:from-ocean-600 hover:to-ocean-700 text-white font-semibold text-sm shadow-lg shadow-ocean-500/10 transition-all hover:scale-[1.01]"
        >
          <Plus className="w-4 h-4" />
          Add Expense Item
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Ledger List */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-6">
          <h3 className="text-base font-bold text-white">Expense History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-350">
              <thead>
                <tr className="border-b border-slate-850 text-xs uppercase text-slate-500">
                  <th className="py-3 px-2">Category</th>
                  <th className="py-3 px-2">Date</th>
                  <th className="py-3 px-2">Remarks</th>
                  <th className="py-3 px-2 text-right">Amount</th>
                  <th className="py-3 px-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 font-medium">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-900/10">
                    <td className="py-4 px-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-950 border border-slate-850 text-slate-300">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-4 px-2 text-slate-400 font-mono text-xs">{e.date}</td>
                    <td className="py-4 px-2 text-xs text-slate-400">{e.remarks || '-'}</td>
                    <td className="py-4 px-2 text-right text-white font-bold">{formatCurrency(e.amount)}</td>
                    <td className="py-4 px-2 text-center">
                      <button 
                        onClick={() => handleDelete(e.id)}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expenses Summary Chart Container */}
        <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-ocean-400" />
            Overhead Parameters Total
          </h3>
          <div className="space-y-4 font-semibold text-slate-400 text-sm">
            <div className="flex justify-between">
              <span>Total Overhead Session Cost:</span>
              <strong className="text-white text-base">
                {formatCurrency(expenses.reduce((sum, e) => sum + e.amount, 0))}
              </strong>
            </div>
            <div className="border-t border-slate-850 pt-4">
              <span className="text-xs text-slate-500 block uppercase tracking-wider mb-2">Category distribution</span>
              {categories.slice(0, 4).map(cat => {
                const totalCat = expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
                return (
                  <div key={cat} className="flex justify-between py-1 text-xs">
                    <span>{cat}</span>
                    <span className="text-slate-200">{formatCurrency(totalCat)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4.5 border-b border-slate-850 flex justify-between items-center">
              <h3 className="text-base font-bold text-white">Add Overhead Expense Record</h3>
              <button onClick={() => setShowAddModal(false)} className="text-xs text-slate-550 hover:text-white">Cancel</button>
            </div>
            
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Expense Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 text-sm focus:outline-none"
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Expense Amount (INR)</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Remarks / Details</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. ice supplier invoice #12"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 text-sm focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-850 flex justify-end">
                <button type="submit" className="px-5 py-3 rounded-xl bg-gradient-to-r from-ocean-500 to-ocean-600 text-white font-semibold text-sm shadow-md">
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
