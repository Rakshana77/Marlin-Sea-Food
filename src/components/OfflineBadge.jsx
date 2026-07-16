import React, { useState, useEffect } from 'react';
import { localDb } from '../db/dexieDb';
import { triggerSyncEngine } from '../db/syncEngine';
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import axios from 'axios';

export default function OfflineBadge() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [cloudConnected, setCloudConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const checkConnectivity = async () => {
    setIsOnline(navigator.onLine);
    const count = await localDb.syncQueue.count();
    setPendingCount(count);

    if (navigator.onLine) {
      try {
        const res = await axios.get('http://localhost:5000/api/status', { timeout: 3000 });
        setCloudConnected(res.data.online);
      } catch {
        setCloudConnected(false);
      }
    } else {
      setCloudConnected(false);
    }
  };

  useEffect(() => {
    checkConnectivity();
    window.addEventListener('online', checkConnectivity);
    window.addEventListener('offline', checkConnectivity);

    const interval = setInterval(checkConnectivity, 10000);

    return () => {
      window.removeEventListener('online', checkConnectivity);
      window.removeEventListener('offline', checkConnectivity);
      clearInterval(interval);
    };
  }, []);

  const handleManualSync = async () => {
    setSyncing(true);
    await triggerSyncEngine();
    await checkConnectivity();
    setSyncing(false);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Network Connectivity State */}
      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md transition-all ${
        isOnline 
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse'
      }`}>
        {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
        <span>{isOnline ? 'Online' : 'Offline'}</span>
      </div>

      {/* Cloud DB Connection State */}
      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md transition-all ${
        cloudConnected 
          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
      }`}>
        {cloudConnected ? <Cloud className="w-3.5 h-3.5" /> : <CloudOff className="w-3.5 h-3.5" />}
        <span>{cloudConnected ? 'Cloud Sync Connected' : 'Local Standalone'}</span>
      </div>

      {/* Sync Queue Badge indicator */}
      {pendingCount > 0 && (
        <button
          onClick={handleManualSync}
          disabled={syncing || !isOnline}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all cursor-pointer animate-pulse"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          <span>{pendingCount} Pending Sync</span>
        </button>
      )}
    </div>
  );
}
