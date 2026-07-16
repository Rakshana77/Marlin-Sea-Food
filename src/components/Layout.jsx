import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OfflineBadge from './OfflineBadge';
import { 
  LayoutDashboard, 
  Receipt, 
  Fish, 
  TrendingUp, 
  Users, 
  Ship, 
  DollarSign, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X,
  FileSpreadsheet
} from 'lucide-react';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['Super Admin', 'Admin', 'Billing Staff', 'Export Company'] },
    { name: 'Daily Rates', path: '/rates', icon: TrendingUp, roles: ['Super Admin', 'Admin', 'Billing Staff'] },
    { name: 'Purchase Bill', path: '/purchase-billing', icon: Receipt, roles: ['Super Admin', 'Admin', 'Billing Staff'] },
    { name: 'Export Bill', path: '/export-billing', icon: Ship, roles: ['Super Admin', 'Admin', 'Billing Staff'] },
    { name: 'Seafood Master', path: '/seafood', icon: Fish, roles: ['Super Admin', 'Admin'] },
    { name: 'Fishermen', path: '/customers', icon: Users, roles: ['Super Admin', 'Admin', 'Billing Staff'] },
    { name: 'Export Companies', path: '/companies', icon: FileSpreadsheet, roles: ['Super Admin', 'Admin', 'Export Company'] },
    { name: 'Expenses', path: '/expenses', icon: DollarSign, roles: ['Super Admin', 'Admin', 'Billing Staff'] },
    { name: 'Reports & P&L', path: '/reports', icon: BarChart3, roles: ['Super Admin', 'Admin', 'Export Company'] },
    { name: 'Settings', path: '/settings', icon: Settings, roles: ['Super Admin', 'Admin'] },
  ];

  const allowedMenuItems = menuItems.filter(item => item.roles.includes(user?.role));

  const handleNav = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-slate-900 text-slate-100 font-sans">
      
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-950 border-r border-slate-800 shrink-0">
        <div className="p-6 flex items-center justify-between border-b border-slate-850">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-ocean-500 to-teal-400 flex items-center justify-center shadow-lg">
              <Fish className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">Marlin Sea Food</span>
          </div>
        </div>

        {/* User profile strip */}
        <div className="p-4 mx-4 my-3 bg-slate-900/50 border border-slate-800/80 rounded-xl flex flex-col gap-1">
          <div className="font-semibold text-sm text-slate-200">{user?.name}</div>
          <div className="text-xs text-ocean-400 font-medium tracking-wide uppercase">{user?.role}</div>
          <div className="mt-2">
            <OfflineBadge />
          </div>
        </div>

        <nav className="flex-1 px-4 py-3 space-y-1 overflow-y-auto">
          {allowedMenuItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <button
                key={item.name}
                onClick={() => handleNav(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active 
                    ? 'bg-gradient-to-r from-ocean-600 to-ocean-700 text-white shadow-md shadow-ocean-500/10' 
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-455'}`} />
                {item.name}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-850">
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Mobile Header / Sticky Header */}
        <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800 z-30">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-ocean-500 to-teal-400 flex items-center justify-center">
              <Fish className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-bold text-base text-white">Marlin Sea Food</span>
          </div>

          <div className="flex items-center gap-3">
            <OfflineBadge />
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-350 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-[65px] left-0 w-full bg-slate-950 border-b border-slate-800 shadow-2xl z-40 p-4 space-y-1">
            <div className="px-3 pb-3 border-b border-slate-850 mb-2">
              <div className="font-semibold text-sm text-slate-200">{user?.name}</div>
              <div className="text-xs text-ocean-400 uppercase font-medium">{user?.role}</div>
            </div>
            {allowedMenuItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <button
                  key={item.name}
                  onClick={() => handleNav(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    active 
                      ? 'bg-ocean-600 text-white' 
                      : 'text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </button>
              );
            })}
            <button 
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-all mt-4 pt-4 border-t border-slate-850"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        )}

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
          {children}
        </main>

        {/* Mobile Bottom Navigation (Quick Action Bar) */}
        <div className="lg:hidden sticky bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-lg border-t border-slate-850 py-2 px-6 flex justify-around items-center z-30 shadow-lg">
          <button onClick={() => navigate('/')} className={`flex flex-col items-center gap-1 text-[10px] ${location.pathname === '/' ? 'text-ocean-400' : 'text-slate-400'}`}>
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
          <button onClick={() => navigate('/purchase-billing')} className={`flex flex-col items-center gap-1 text-[10px] ${location.pathname === '/purchase-billing' ? 'text-ocean-400' : 'text-slate-400'}`}>
            <Receipt className="w-5 h-5" />
            <span>Billing</span>
          </button>
          <button onClick={() => navigate('/reports')} className={`flex flex-col items-center gap-1 text-[10px] ${location.pathname === '/reports' ? 'text-ocean-400' : 'text-slate-400'}`}>
            <BarChart3 className="w-5 h-5" />
            <span>Reports</span>
          </button>
        </div>
      </div>
    </div>
  );
}
