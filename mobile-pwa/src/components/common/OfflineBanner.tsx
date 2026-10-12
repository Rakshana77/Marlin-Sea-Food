import React from 'react';
import { WifiOff, AlertTriangle } from 'lucide-react';
import { useNetwork } from '../../hooks/useNetwork';

export const OfflineBanner: React.FC = () => {
  const { isOnline } = useNetwork();

  if (isOnline) return null;

  return (
    <div className="bg-rose-600 text-white px-4 py-2.5 shadow-md flex items-center justify-between gap-3 text-xs sm:text-sm animate-fade-in sticky top-14 sm:top-16 z-30">
      <div className="flex items-center gap-2 font-medium">
        <WifiOff className="w-4 h-4 flex-shrink-0 animate-pulse" />
        <span>
          <strong>You are offline.</strong> Connect to the internet to complete billing and other financial transactions.
        </span>
      </div>
      <div className="hidden sm:flex items-center gap-1 text-[11px] bg-rose-700/80 px-2 py-0.5 rounded font-mono uppercase tracking-wider">
        <AlertTriangle className="w-3 h-3 text-amber-300" />
        <span>Financial Mutations Blocked</span>
      </div>
    </div>
  );
};
