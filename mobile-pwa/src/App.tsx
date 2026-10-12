import React, { useState } from 'react';
import { useAuth, AuthContext, useAuthProvider } from './hooks/useAuth';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { BottomNav } from './components/common/BottomNav';
import { OfflineBanner } from './components/common/OfflineBanner';

// POS Counter Pages
import { LoginPage } from './pages/LoginPage';
import { BillingPage } from './pages/BillingPage';
import { SalesHistoryPage } from './pages/SalesHistoryPage';

import { Loader2, ShieldAlert, X } from 'lucide-react';
import { setOnForbidden } from './api/client';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  // The Mobile PWA Counter opens directly into POS Billing as primary default screen
  const [activeTab, setActiveTab] = useState<'billing' | 'history'>('billing');
  const [forbiddenMessage, setForbiddenMessage] = useState<string | null>(null);

  React.useEffect(() => {
    setOnForbidden((msg: string) => {
      setForbiddenMessage(msg);
      const timer = setTimeout(() => setForbiddenMessage(null), 6000);
      return () => clearTimeout(timer);
    });
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-teal-400 gap-3">
        <Loader2 className="w-10 h-10 animate-spin" />
        <span className="text-sm font-semibold tracking-wide">
          Connecting to Marine Seafoods Terminal...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans overflow-x-hidden">
      {/* Tablet & Desktop Collapsible Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        onNavigateTab={(tab) => setActiveTab(tab === 'history' ? 'history' : 'billing')} 
      />

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="md:hidden">
          <Header 
            currentTab={activeTab} 
            onNavigateTab={(tab) => setActiveTab(tab === 'history' ? 'history' : 'billing')} 
          />
        </div>

        {/* Offline Alert Strip */}
        <OfflineBanner />

        {/* 403 Permission Denied Notification Banner */}
        {forbiddenMessage && (
          <div className="bg-amber-900 border-b border-amber-700 text-amber-100 px-4 py-2.5 text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in z-30">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-300 shrink-0" />
              <span>{forbiddenMessage}</span>
            </div>
            <button
              onClick={() => setForbiddenMessage(null)}
              className="p-1 rounded hover:bg-white/10 text-amber-200 transition-colors"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Primary Page Router: POS Billing default, Sales History lookup */}
        <main className="flex-1 w-full overflow-y-auto">
          {activeTab === 'history' ? <SalesHistoryPage /> : <BillingPage />}
        </main>

        {/* Mobile Fixed Bottom Navigation (Billing & History) */}
        <BottomNav 
          activeTab={activeTab} 
          onTabChange={(tab) => setActiveTab(tab === 'history' ? 'history' : 'billing')} 
        />
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const auth = useAuthProvider();

  return (
    <AuthContext.Provider value={auth}>
      <AppContent />
    </AuthContext.Provider>
  );
};
