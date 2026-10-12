import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { 
  Anchor, 
  ShoppingCart, 
  History, 
  ChevronLeft, 
  ChevronRight, 
  LogOut 
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onNavigateTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onNavigateTab }) => {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const cartCount = items.length;

  const navItems = [
    { 
      id: 'billing', 
      label: 'POS Billing', 
      icon: ShoppingCart, 
      badge: cartCount > 0 ? cartCount : null,
    },
    { 
      id: 'history', 
      label: 'Sales History', 
      icon: History, 
      badge: null,
    },
  ];

  return (
    <aside 
      className={`hidden md:flex flex-col bg-slate-900 border-r border-slate-800 text-slate-300 transition-all duration-200 select-none ${
        collapsed ? 'w-16' : 'w-64'
      } shrink-0`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-3.5 border-b border-slate-800">
        <div 
          onClick={() => onNavigateTab('billing')}
          className="flex items-center gap-2.5 cursor-pointer overflow-hidden"
          title="Marine Seafoods POS Counter"
        >
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
            <Anchor className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="truncate">
              <span className="font-extrabold text-white text-sm tracking-tight block">Marine Seafoods</span>
              <span className="text-[10px] text-teal-400 font-mono">POS Counter • Wharf #04</span>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Counter Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {!collapsed && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block px-2.5 mb-2">
            POS Terminal
          </span>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              id={`nav-btn-${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                onNavigateTab(item.id);
              }}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all relative cursor-pointer ${
                isActive
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {!collapsed && (
                <div className="flex-1 text-left truncate">
                  <span className="block truncate">{item.label}</span>
                </div>
              )}
              {item.badge !== null && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                  isActive ? 'bg-white text-teal-900' : 'bg-rose-600 text-white'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Operator Footer */}
      <div className="p-3 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-teal-400 text-xs shrink-0">
            {user?.name?.charAt(0) || 'U'}
          </div>
          {!collapsed && (
            <div className="truncate">
              <div className="font-bold text-xs text-white truncate">{user?.name || 'Counter Operator'}</div>
              <div className="text-[10px] text-teal-400 font-medium">{user?.role || 'CASHIER'}</div>
            </div>
          )}
        </div>

        <button
          onClick={() => {
            if (window.confirm('Sign out of Marine POS terminal?')) {
              logout();
            }
          }}
          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
