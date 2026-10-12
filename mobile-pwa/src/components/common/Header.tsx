import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNetwork } from '../../hooks/useNetwork';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Anchor, Wifi, WifiOff, Download, LogOut, UserCheck } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onNavigateTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onNavigateTab }) => {
  const { user, logout, isAdmin } = useAuth();
  const { isOnline } = useNetwork();
  const { isInstallable, promptInstall } = usePWAInstall();

  return (
    <header className="sticky top-0 z-40 bg-primary-container border-b border-slate-700/60 text-white shadow-md select-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Brand & Terminal Identifier */}
        <div 
          onClick={() => onNavigateTab('billing')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform">
            <Anchor className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base tracking-tight text-white">Marine Seafoods</span>
              <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                isAdmin ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
              }`}>
                {user?.role || 'POS'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="truncate max-w-[120px] sm:max-w-none">{user?.name || 'Terminal'}</span>
              <span>•</span>
              <span className="text-teal-400 font-mono">Wharf #04</span>
            </div>
          </div>
        </div>

        {/* Right Status Badges & Controls */}
        <div className="flex items-center gap-2">
          {/* Online/Offline Status */}
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium border ${
            isOnline 
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30' 
              : 'bg-rose-950/40 text-rose-300 border-rose-500/40 animate-pulse'
          }`}>
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">LIVE SYNC</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                <span>OFFLINE</span>
              </>
            )}
          </div>

          {/* PWA Install Button (if available) */}
          {isInstallable && (
            <button
              onClick={() => promptInstall()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
              title="Install Marine POS to Home Screen"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Install App</span>
            </button>
          )}

          {/* Sign Out */}
          <button
            onClick={() => {
              if (window.confirm('Sign out of Marine POS terminal?')) {
                logout();
              }
            }}
            className="p-2 rounded-lg text-slate-300 hover:text-rose-300 hover:bg-white/5 active:scale-95 transition-colors"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
