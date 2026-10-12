import React from 'react';
import { ShoppingCart, History } from 'lucide-react';
import { useCart } from '../../hooks/useCart';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenMore?: () => void;
  isMoreOpen?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { items } = useCart();
  const itemCount = items.length;

  const navItems = [
    {
      id: 'billing',
      label: 'POS Billing',
      icon: ShoppingCart,
      badge: itemCount > 0 ? itemCount : null,
    },
    {
      id: 'history',
      label: 'Sales History',
      icon: History,
      badge: null,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] md:hidden pb-[env(safe-area-inset-bottom,0px)] select-none">
      <div className="grid grid-cols-2 h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              id={`bottom-nav-${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                onTabChange(item.id);
              }}
              className={`relative flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
                isActive
                  ? 'text-teal-700 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-teal-600' : ''}`} />
                {item.badge !== null && (
                  <span className="absolute -top-1.5 -right-2.5 bg-rose-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm animate-bounce">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] mt-1 tracking-tight ${isActive ? 'font-bold text-teal-800' : 'font-medium'}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-8 h-0.5 bg-teal-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
