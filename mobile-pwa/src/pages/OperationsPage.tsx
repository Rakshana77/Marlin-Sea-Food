import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  Scale, 
  Users, 
  Trash2, 
  Receipt, 
  Lock, 
  Boxes, 
  History, 
  Globe, 
  TrendingUp, 
  FileText, 
  DollarSign,
  ArrowRight
} from 'lucide-react';

interface OperationsPageProps {
  onNavigateTab: (tab: string) => void;
}

export const OperationsPage: React.FC<OperationsPageProps> = ({ onNavigateTab }) => {
  const { isAdmin, user } = useAuth();

  const operationModules = [
    {
      id: 'collection',
      title: 'Harbor Catch Intake',
      subtitle: 'Record weighment (gross, tare, net), spot rates & advance recovery',
      icon: Scale,
      color: 'teal',
      badge: 'Procurement',
      requiresAdmin: true,
    },
    {
      id: 'fishermen',
      title: 'Fishermen & Advance Ledger',
      subtitle: 'Manage boat suppliers, disburse advances & cash repayments',
      icon: Users,
      color: 'purple',
      badge: 'Advances',
      requiresAdmin: true,
    },
    {
      id: 'stock',
      title: 'Cold Storage Inventory',
      subtitle: 'Perpetual species stock balances, movements & WAC valuation',
      icon: Boxes,
      color: 'indigo',
      badge: 'Inventory',
      requiresAdmin: false,
    },
    {
      id: 'wastage',
      title: 'Spoilage & Wastage Losses',
      subtitle: 'Log decomposed catch and transit damage directly against stock',
      icon: Trash2,
      color: 'rose',
      badge: 'Loss Audit',
      requiresAdmin: true,
    },
    {
      id: 'export-billing',
      title: 'Export Cargo Consignments',
      subtitle: 'Issue overseas reefer sales invoices, container refs & shipping bills',
      icon: Globe,
      color: 'purple',
      badge: 'International',
      requiresAdmin: false,
    },
    {
      id: 'expenses',
      title: 'Operational Expenses & Wages',
      subtitle: 'Issue vouchers for ice, diesel, coolie wages & transport freight',
      icon: Receipt,
      color: 'amber',
      badge: 'Opex Vouchers',
      requiresAdmin: true,
    },
    {
      id: 'rates',
      title: 'Published Daily Rates',
      subtitle: 'Review spot wholesale and purchase rates, publish or copy yesterday',
      icon: TrendingUp,
      color: 'teal',
      badge: 'Spot Rates',
      requiresAdmin: false,
    },
    {
      id: 'history',
      title: 'Sales History & Slips',
      subtitle: 'Browse wholesale customer sales, thermal slips & settlement status',
      icon: History,
      color: 'emerald',
      badge: 'Sales Ledger',
      requiresAdmin: false,
    },
    {
      id: 'day-end',
      title: 'Day End Reconciliation',
      subtitle: 'Audit cash drawer counts, verify stock weights and lock date',
      icon: Lock,
      color: 'slate',
      badge: 'Terminal Closing',
      requiresAdmin: true,
    },
    {
      id: 'reports',
      title: 'Business Reports Hub',
      subtitle: 'Exportable CSV audit trails for procurement, sales and stock',
      icon: FileText,
      color: 'blue',
      badge: 'Reporting',
      requiresAdmin: false,
    },
    ...(isAdmin ? [{
      id: 'pnl',
      title: 'Profit & Loss (P&L)',
      subtitle: 'Authoritative financial engine with COGS and operating margins',
      icon: DollarSign,
      color: 'emerald',
      badge: 'Financials',
      requiresAdmin: true,
    }] : []),
  ];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-24 md:pb-8 flex flex-col gap-4">
      {/* Top Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              Operations Hub
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Terminal Operations & Procurement
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Harbor weighbridge intake, boat advances, inventory, vouchers, and reconciliations
          </p>
        </div>

        <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full border self-start sm:self-auto ${
          isAdmin ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-teal-50 text-teal-800 border-teal-300'
        }`}>
          {user?.role} ACCESS
        </span>
      </div>

      {/* Grid of Operation Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {operationModules.map((mod) => {
          const Icon = mod.icon;
          const isPermitted = !mod.requiresAdmin || isAdmin;

          return (
            <div
              key={mod.id}
              onClick={() => {
                if (isPermitted) onNavigateTab(mod.id);
              }}
              className={`p-4 sm:p-5 rounded-2xl border bg-white shadow-sm flex flex-col justify-between gap-4 transition-all ${
                isPermitted 
                  ? 'hover:border-teal-500 hover:shadow cursor-pointer group' 
                  : 'opacity-50 cursor-not-allowed bg-slate-50/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5 text-slate-700" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {mod.badge}
                  </span>
                </div>

                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug">
                  {mod.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {mod.subtitle}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-bold">
                <span className={isPermitted ? 'text-teal-700 group-hover:underline' : 'text-slate-400'}>
                  {isPermitted ? 'Open Module' : 'Admin Required'}
                </span>
                {isPermitted && (
                  <ArrowRight className="w-4 h-4 text-teal-600 group-hover:translate-x-1 transition-transform" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
