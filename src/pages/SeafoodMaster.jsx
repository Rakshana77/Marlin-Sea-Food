import React, { useState, useEffect } from 'react';
import { localDb } from '../db/dexieDb';
import { queueSyncItem } from '../db/syncEngine';
import { Plus, Trash2, Edit3, Image, Settings, Sparkles, Check } from 'lucide-react';

export default function SeafoodMaster() {
  const [seafoodList, setSeafoodList] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Squid');
  const [unit, setUnit] = useState('kg');
  const [description, setDescription] = useState('');
  const [imgUrl, setImgUrl] = useState('');
  const [status, setStatus] = useState('Active');

  const categories = ['Squid', 'Crab', 'Prawn', 'Fish', 'Octopus', 'Lobster', 'Custom'];

  useEffect(() => {
    loadSeafood();
  }, []);

  const loadSeafood = async () => {
    const list = await localDb.seafood.toArray();
    setSeafoodList(list);
  };

  const resetForm = () => {
    setName('');
    setCategory('Squid');
    setUnit('kg');
    setDescription('');
    setImgUrl('');
    setStatus('Active');
    setEditItem(null);
  };

  const handleOpenEdit = (item) => {
    setEditItem(item);
    setName(item.name);
    setCategory(item.category);
    setUnit(item.unit);
    setDescription(item.description);
    setImgUrl(item.img || '');
    setStatus(item.status);
    setShowAddModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const itemData = {
      name,
      category,
      unit,
      description,
      img: imgUrl || 'https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&w=300&q=80',
      status,
      syncStatus: 'Pending'
    };

    if (editItem) {
      const updated = { ...editItem, ...itemData };
      await localDb.seafood.put(updated);
      await queueSyncItem('seafood', editItem.id, 'put', updated);
    } else {
      const newId = Date.now().toString();
      const newItem = { id: newId, ...itemData };
      await localDb.seafood.add(newItem);
      await queueSyncItem('seafood', newId, 'add', newItem);
    }
    
    await loadSeafood();
    setShowAddModal(false);
    resetForm();
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this seafood item?')) {
      await localDb.seafood.delete(id);
      await queueSyncItem('seafood', id, 'delete', {});
      await loadSeafood();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Fish Master Catalog</h1>
          <p className="text-slate-400 text-sm mt-1">Manage global fish types and measuring units</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-ocean-500 to-ocean-600 hover:from-ocean-600 hover:to-ocean-700 text-white font-semibold text-sm shadow-lg shadow-ocean-500/10 transition-all hover:scale-[1.01]"
        >
          <Plus className="w-4 h-4" />
          Add Seafood
        </button>
      </div>

      {/* Seafood catalog card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {seafoodList.map((item) => (
          <div key={item.id} className="rounded-3xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-all overflow-hidden flex flex-col group">
            <div className="h-44 relative bg-slate-950 overflow-hidden">
              <img 
                src={item.img} 
                alt={item.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
              />
              <span className={`absolute top-4 right-4 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase backdrop-blur-md ${
                item.status === 'Active' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {item.status}
              </span>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="text-xs text-ocean-400 font-semibold tracking-wider uppercase">{item.category}</div>
                <h3 className="text-lg font-bold text-white leading-tight">{item.name}</h3>
                <p className="text-slate-450 text-xs line-clamp-2">{item.description || 'No catalog specifications configured.'}</p>
              </div>

              <div className="pt-4 border-t border-slate-850 flex justify-between items-center">
                <span className="text-xs text-slate-500">Unit: <strong className="text-slate-300 font-mono">{item.unit}</strong></span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleOpenEdit(item)}
                    className="p-2 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-400 hover:text-white"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/10 text-rose-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4.5 border-b border-slate-850 flex justify-between items-center">
              <h3 className="text-base font-bold text-white">{editItem ? 'Edit Catalog Registry' : 'New Seafood Item Registry'}</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-xs text-slate-550 hover:text-white"
              >
                Cancel
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Item Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tiger Prawn Large"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-ocean-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Category</label>
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Lobster, Squid, Tuna"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-ocean-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Trading Unit</label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="kg or box"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Catalog Image URL</label>
                <input
                  type="url"
                  value={imgUrl}
                  onChange={(e) => setImgUrl(e.target.value)}
                  placeholder="https://image-link.com"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Item Specifications / Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-ocean-500"
                  placeholder="Grading information, size ranges, source details..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 text-sm focus:outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-850 flex justify-end gap-3">
                <button
                  type="submit"
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-ocean-500 to-ocean-600 text-white font-semibold text-sm shadow-md"
                >
                  Save Item Registry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
