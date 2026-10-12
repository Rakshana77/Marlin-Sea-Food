import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  X, 
  Scale, 
  Users, 
  Trash2, 
  Receipt, 
  TrendingUp, 
  History, 
  Lock, 
  FileText, 
  Fish, 
  Building2, 
  Globe, 
  DollarSign, 
  ShieldCheck, 
  LogOut,
  ChevronRight
} from 'lucide-react';

interface MoreMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onNavigateTab: (tab: string) => void;
}

export const MoreMenuDrawer: React.FC<MoreMenuDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onNavigateTab,
}) => {
  const { user, isAdmin, logout } = useAuth();

  if (!isOpen) return null;

  const navigateTo = (tab: string) => {
    onNavigateTab(tab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex justify-end animate-fade-in md:hidden select-none">
      <div 
        className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-slide-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-teal-400">Navigation Hub</span>
            <h2 className="text-base font-black">All Business Modules</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modules List */}
        <div className="p-4 flex-1 space-y-4 text-xs overflow-y-auto">
          {/* Operations & Procurement */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 px-2">
              Procurement & Operations
            </span>
            <div className="space-y-1">
              <button
                onClick={() => navigateTo('collection')}
                className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-colors ${
                  activeTab === 'collection' ? 'bg-blue-50 text-blue-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                    <Scale className="w-4 h-4" />
                  </div>
                  <span>Catch Intake & Purchases</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => navigateTo('fishermen')}
                className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-colors ${
                  activeTab === 'fishermen' ? 'bg-purple-50 text-purple-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <span>Fishermen & Advances</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => navigateTo('wastage')}
                className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-colors ${
                  activeTab === 'wastage' ? 'bg-rose-50 text-rose-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <span>Spoilage & Wastage Losses</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => navigateTo('expenses')}
                className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-colors ${
                  activeTab === 'expenses' ? 'bg-amber-50 text-amber-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <span>Expenses & Worker Wages</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Sales & Export */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 px-2">
              Sales & Export Shipping
            </span>
            <div className="space-y-1">
              <button
                onClick={() => navigateTo('rates')}
                className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-colors ${
                  activeTab === 'rates' ? 'bg-teal-50 text-teal-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span>Daily Published Rates</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => navigateTo('history')}
                className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-colors ${
                  activeTab === 'history' ? 'bg-emerald-50 text-emerald-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <History className="w-4 h-4" />
                  </div>
                  <span>Sales History & Invoices</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => navigateTo('export-billing')}
                className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-colors ${
                  activeTab === 'export-billing' ? 'bg-purple-50 text-purple-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                    <Globe className="w-4 h-4" />
                  </div>
                  <span>Export Cargo Billing</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => navigateTo('export-companies')}
                className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-colors ${
                  activeTab === 'export-companies' ? 'bg-purple-50 text-purple-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span>Export Partners Directory</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => navigateTo('buyers')}
                className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-colors ${
                  activeTab === 'buyers' ? 'bg-teal-50 text-teal-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <span>Wholesale Buyers</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Master Data & Reports */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 px-2">
              Master Data & Reconciliation
            </span>
            <div className="space-y-1">
              <button
                onClick={() => navigateTo('masters')}
                className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-colors ${
                  activeTab === 'masters' ? 'bg-indigo-50 text-indigo-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                    <Fish className="w-4 h-4" />
                  </div>
                  <span>Species, Categories & Grades</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => navigateTo('day-end')}
                className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-colors ${
                  activeTab === 'day-end' ? 'bg-slate-100 text-slate-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <span>Day End Reconciliation</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {isAdmin && (
                <button
                  onClick={() => navigateTo('pnl')}
                  className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-colors ${
                    activeTab === 'pnl' ? 'bg-emerald-50 text-emerald-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <span>Profit & Loss Statement</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              )}

              <button
                onClick={() => navigateTo('reports')}
                className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-colors ${
                  activeTab === 'reports' ? 'bg-slate-100 text-slate-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span>Business Reports Hub</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {isAdmin && (
                <button
                  onClick={() => navigateTo('users')}
                  className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-colors ${
                    activeTab === 'users' ? 'bg-indigo-50 text-indigo-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span>User RBAC Accounts</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900">{user?.name}</div>
              <div className="text-[10px] text-slate-500">{user?.role}</div>
            </div>
          </div>

          <button
            onClick={() => {
              if (window.confirm('Sign out of terminal?')) {
                logout();
              }
            }}
            className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
