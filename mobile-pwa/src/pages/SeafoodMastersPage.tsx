import React, { useState, useEffect } from 'react';
import { 
  getSeafoodList, createSeafood, updateSeafood, 
  getCategories, createCategory, updateCategory, 
  getGrades, createGrade, updateGrade 
} from '../api/masters';
import { Seafood, SeafoodCategory, SeafoodGrade } from '../types/models';
import { useAuth } from '../hooks/useAuth';
import { 
  Fish, 
  Layers, 
  Award, 
  Plus, 
  Search, 
  Edit2, 
  RefreshCw, 
  Loader2, 
  X, 
  Check, 
  AlertCircle 
} from 'lucide-react';

export const SeafoodMastersPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'species' | 'categories' | 'grades'>('species');
  
  // Data lists
  const [speciesList, setSpeciesList] = useState<Seafood[]>([]);
  const [categoriesList, setCategoriesList] = useState<SeafoodCategory[]>([]);
  const [gradesList, setGradesList] = useState<SeafoodGrade[]>([]);
  
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal states
  const [modalType, setModalType] = useState<'create-species' | 'edit-species' | 'create-category' | 'edit-category' | 'create-grade' | 'edit-grade' | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form states
  const [formName, setFormName] = useState<string>('');
  const [formCategoryId, setFormCategoryId] = useState<string>('');
  const [formUnit, setFormUnit] = useState<string>('KG');
  const [formDesc, setFormDesc] = useState<string>('');
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const loadAll = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    try {
      const [species, cats, grades] = await Promise.all([
        getSeafoodList({ limit: 100 }),
        getCategories(false),
        getGrades(false),
      ]);
      setSpeciesList(species || []);
      setCategoriesList(cats || []);
      setGradesList(grades || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load seafood master catalogs');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const openCreateModal = () => {
    setError(null);
    setSuccessMsg(null);
    setFormName('');
    setFormDesc('');
    setFormStatus('ACTIVE');
    if (activeTab === 'species') {
      setFormUnit('KG');
      setFormCategoryId(categoriesList[0]?.id || '');
      setModalType('create-species');
    } else if (activeTab === 'categories') {
      setModalType('create-category');
    } else {
      setModalType('create-grade');
    }
  };

  const openEditModal = (item: any) => {
    setError(null);
    setSuccessMsg(null);
    setSelectedItem(item);
    setFormName(item.name || '');
    setFormDesc(item.description || '');
    setFormStatus(item.status || (item.active ? 'ACTIVE' : 'INACTIVE'));
    if (activeTab === 'species') {
      setFormCategoryId(item.categoryId || '');
      setFormUnit(item.unit || 'KG');
      setModalType('edit-species');
    } else if (activeTab === 'categories') {
      setModalType('edit-category');
    } else {
      setModalType('edit-grade');
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedItem(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setError('Name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      if (modalType === 'create-species') {
        if (!formCategoryId) throw new Error('Please select a category');
        await createSeafood({
          name: formName.trim(),
          categoryId: formCategoryId,
          unit: formUnit,
          status: formStatus,
          description: formDesc.trim() || null,
        });
        setSuccessMsg(`Created seafood item "${formName}" successfully`);
      } else if (modalType === 'edit-species') {
        await updateSeafood(selectedItem.id, {
          name: formName.trim(),
          categoryId: formCategoryId,
          unit: formUnit,
          status: formStatus,
          description: formDesc.trim() || null,
        });
        setSuccessMsg(`Updated seafood item "${formName}" successfully`);
      } else if (modalType === 'create-category') {
        await createCategory({
          name: formName.trim(),
          description: formDesc.trim() || null,
          active: formStatus === 'ACTIVE',
        });
        setSuccessMsg(`Created category "${formName}" successfully`);
      } else if (modalType === 'edit-category') {
        await updateCategory(selectedItem.id, {
          name: formName.trim(),
          description: formDesc.trim() || null,
          active: formStatus === 'ACTIVE',
        });
        setSuccessMsg(`Updated category "${formName}" successfully`);
      } else if (modalType === 'create-grade') {
        await createGrade({
          name: formName.trim(),
          description: formDesc.trim() || null,
          active: formStatus === 'ACTIVE',
        });
        setSuccessMsg(`Created grade "${formName}" successfully`);
      } else if (modalType === 'edit-grade') {
        await updateGrade(selectedItem.id, {
          name: formName.trim(),
          description: formDesc.trim() || null,
          active: formStatus === 'ACTIVE',
        });
        setSuccessMsg(`Updated grade "${formName}" successfully`);
      }
      closeModal();
      loadAll(true);
    } catch (err: any) {
      setError(err?.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered items
  const filteredSpecies = speciesList.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.category?.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCategories = categoriesList.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredGrades = gradesList.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-24 md:pb-8 flex flex-col gap-4">
      {/* Top Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              Master Data Engine
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Seafood Species, Categories & Grades
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage master seafood taxonomy, biological classifications, and grade definitions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadAll(true)}
            disabled={isRefreshing}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors"
            title="Refresh Catalogs"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-teal-600' : ''}`} />
          </button>

          {isAdmin && (
            <button
              onClick={openCreateModal}
              className="px-4 py-2.5 bg-teal-700 hover:bg-teal-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add {activeTab === 'species' ? 'Species' : activeTab === 'categories' ? 'Category' : 'Grade'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Nav Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => { setActiveTab('species'); setSearch(''); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'species'
                ? 'bg-white text-teal-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Fish className="w-4 h-4 text-teal-600" />
            <span>Species ({speciesList.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('categories'); setSearch(''); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'categories'
                ? 'bg-white text-teal-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Categories ({categoriesList.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('grades'); setSearch(''); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'grades'
                ? 'bg-white text-teal-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4 text-amber-600" />
            <span>Grades ({gradesList.length})</span>
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
          />
        </div>
      </div>

      {/* Main Content View */}
      {isLoading ? (
        <div className="py-24 bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <span className="text-xs font-semibold">Loading catalog data...</span>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Species Tab Content */}
          {activeTab === 'species' && (
            filteredSpecies.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400">
                No seafood species items found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Seafood Species</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Unit</th>
                      <th className="py-3 px-3">Description</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSpecies.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block text-sm">{item.name}</span>
                          {item.vernacularName && (
                            <span className="text-[10px] text-slate-400 font-medium">{item.vernacularName}</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200 text-[11px]">
                            {item.category?.name || 'Unassigned'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-700">{item.unit || 'KG'}</td>
                        <td className="py-3 px-3 text-slate-500 max-w-xs truncate">{item.description || '—'}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            item.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Edit Seafood Species"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* Categories Tab Content */}
          {activeTab === 'categories' && (
            filteredCategories.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400">
                No categories found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Category Name</th>
                      <th className="py-3 px-3">Description</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCategories.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 text-sm">{item.name}</td>
                        <td className="py-3 px-3 text-slate-500">{item.description || '—'}</td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-emerald-50 text-emerald-700 border-emerald-200">
                            Active
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 text-slate-500 hover:text-indigo-700 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Edit Category"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* Grades Tab Content */}
          {activeTab === 'grades' && (
            filteredGrades.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400">
                No grades found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Grade Classification</th>
                      <th className="py-3 px-3">Quality Description</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredGrades.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                          <span className="px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            {item.name}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500">{item.description || '—'}</td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-emerald-50 text-emerald-700 border-emerald-200">
                            Active
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Edit Grade"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      )}

      {/* Modal for Create / Edit */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                {modalType.startsWith('create') ? 'Create New ' : 'Edit '}
                {modalType.includes('species') ? 'Seafood Species' : modalType.includes('category') ? 'Category' : 'Grade'}
              </h3>
              <button onClick={closeModal} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 flex flex-col gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Yellowfin Tuna, Grade A, etc."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {modalType.includes('species') && (
                <>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formCategoryId}
                      onChange={(e) => setFormCategoryId(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                    >
                      <option value="">Select Category</option>
                      {categoriesList.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Measurement Unit
                    </label>
                    <input
                      type="text"
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Description / Notes
                </label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Biological species classification, storage notes, etc."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 active:scale-95 text-white font-bold shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{modalType.startsWith('create') ? 'Create Record' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
