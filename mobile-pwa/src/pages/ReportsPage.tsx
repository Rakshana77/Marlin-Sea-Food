import React, { useState, useEffect } from 'react';
import { getSales } from '../api/sales';
import { getPurchaseBills } from '../api/collections';
import { getStockList, getStockMovements } from '../api/stock';
import { getExpenses } from '../api/expenses';
import { getFishermen } from '../api/advances';
import { getCustomers } from '../api/buyers';
import { getPnlSummary } from '../api/pnl';
import { useAuth } from '../hooks/useAuth';
import { 
  FileText, 
  Download, 
  Printer, 
  Calendar, 
  RefreshCw, 
  Loader2, 
  Search, 
  ShoppingCart, 
  Scale, 
  Boxes, 
  Trash2, 
  Receipt, 
  Users, 
  TrendingUp,
  AlertCircle
} from 'lucide-react';

type ReportType = 
  | 'sales' 
  | 'procurement' 
  | 'stock' 
  | 'movements' 
  | 'wastage' 
  | 'expenses' 
  | 'advances' 
  | 'receivables' 
  | 'pnl';

export const ReportsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const todayStr = new Date().toISOString().split('T')[0];

  const [reportType, setReportType] = useState<ReportType>('sales');
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Report Data Container
  const [reportData, setReportData] = useState<any[]>([]);
  const [pnlSummary, setPnlSummary] = useState<any | null>(null);

  const fetchReport = async () => {
    setIsLoading(true);
    setError(null);
    setReportData([]);
    setPnlSummary(null);
    try {
      if (reportType === 'sales') {
        const data = await getSales({ fromDate: startDate, toDate: endDate, limit: 100 });
        setReportData(data || []);
      } else if (reportType === 'procurement') {
        const data = await getPurchaseBills({ fromDate: startDate, toDate: endDate, limit: 100 });
        setReportData(data || []);
      } else if (reportType === 'stock') {
        const data = await getStockList({ limit: 100 });
        setReportData(data || []);
      } else if (reportType === 'movements') {
        const data = await getStockMovements({ fromDate: startDate, toDate: endDate, limit: 100 });
        setReportData(data || []);
      } else if (reportType === 'wastage') {
        const data = await getStockMovements({ movementType: 'WASTE', fromDate: startDate, toDate: endDate, limit: 100 });
        setReportData(data || []);
      } else if (reportType === 'expenses') {
        const data = await getExpenses({ fromDate: startDate, toDate: endDate, limit: 100 });
        setReportData(data || []);
      } else if (reportType === 'advances') {
        const data = await getFishermen();
        setReportData(data || []);
      } else if (reportType === 'receivables') {
        const data = await getCustomers();
        setReportData(data || []);
      } else if (reportType === 'pnl') {
        if (isAdmin) {
          const sum = await getPnlSummary(startDate, endDate);
          setPnlSummary(sum);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, startDate, endDate]);

  const exportCsv = () => {
    if (reportData.length === 0 && !pnlSummary) {
      alert('No data available to export');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';

    if (reportType === 'sales') {
      csvContent += 'Invoice Number,Date,Type,Customer,Total KG,Grand Total,Payment Status\n';
      reportData.forEach((s) => {
        csvContent += `"${s.invoiceNumber}","${s.saleDate}","${s.saleType}","${s.customer?.name || s.exportCompany?.companyName || 'Walk-in'}","${s.totalKg}","${s.grandTotal}","${s.paymentStatus}"\n`;
      });
    } else if (reportType === 'procurement') {
      csvContent += 'Voucher Number,Date,Fisherman,Total KG,Gross Subtotal,Advance Deducted,Net Payable,Status\n';
      reportData.forEach((p) => {
        csvContent += `"${p.billNumber}","${p.billDate}","${p.fisherman?.name}","${p.totalKg}","${p.subtotal}","${p.advanceDeducted}","${p.grandTotal}","${p.status}"\n`;
      });
    } else if (reportType === 'stock') {
      csvContent += 'Species,Grade,Quantity KG,WAC Cost,Total Value\n';
      reportData.forEach((st) => {
        csvContent += `"${st.seafood?.name}","${st.grade?.name}","${st.quantityKg}","${st.averageCost}","${st.totalValue}"\n`;
      });
    } else if (reportType === 'expenses') {
      csvContent += 'Voucher Number,Date,Category,Recipient,Method,Amount,Status\n';
      reportData.forEach((e) => {
        csvContent += `"${e.expenseNumber}","${e.expenseDate}","${e.category}","${e.recipient}","${e.paymentMethod}","${e.amount}","${e.status}"\n`;
      });
    } else if (reportType === 'advances') {
      csvContent += 'Fisherman Name,Contact,Advance Recoverable Balance,Status\n';
      reportData.forEach((f) => {
        csvContent += `"${f.name}","${f.countryCode} ${f.mobileNumber}","${f.advanceBalance || '0.00'}","${f.status}"\n`;
      });
    } else {
      csvContent += 'Item,Value\n';
      reportData.forEach((r, idx) => {
        csvContent += `"Item ${idx + 1}","${JSON.stringify(r)}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `marine_${reportType}_report_${startDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-24 md:pb-8 flex flex-col gap-4">
      {/* Top Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-300">
              Audit & Compliance
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Centralized Business Reports Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Exportable audit trails for wholesale sales, harbor catch, stock movements, advances, and P&L
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchReport()}
            disabled={isLoading}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors"
            title="Refresh Report"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-slate-900' : ''}`} />
          </button>

          <button
            onClick={exportCsv}
            disabled={isLoading || (reportData.length === 0 && !pnlSummary)}
            className="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Report Categories Selector */}
      <div className="flex flex-wrap items-center gap-1.5 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        {[
          { id: 'sales', label: 'Sales & Invoices', icon: ShoppingCart },
          { id: 'procurement', label: 'Catch Intake', icon: Scale },
          { id: 'stock', label: 'Cold Storage Stock', icon: Boxes },
          { id: 'movements', label: 'Stock Movements', icon: Boxes },
          { id: 'wastage', label: 'Spoilage Losses', icon: Trash2 },
          { id: 'expenses', label: 'Operating Expenses', icon: Receipt },
          { id: 'advances', label: 'Fisherman Advances', icon: Users },
          { id: 'receivables', label: 'Buyer Receivables', icon: Users },
          ...(isAdmin ? [{ id: 'pnl', label: 'P&L Statement', icon: TrendingUp }] : []),
        ].map((rep) => {
          const Icon = rep.icon;
          const isActive = reportType === rep.id;
          return (
            <button
              key={rep.id}
              onClick={() => setReportType(rep.id as ReportType)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{rep.label}</span>
            </button>
          );
        })}
      </div>

      {/* Date Range Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 text-xs font-semibold text-slate-700">
        <Calendar className="w-4 h-4 text-slate-400" />
        <span>Date Range:</span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs"
        />
        <span className="text-slate-400">to</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs"
        />
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Report Results Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="report-printable-area">
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-slate-800" />
            <span className="text-xs font-semibold">Generating report records...</span>
          </div>
        ) : reportType === 'pnl' && pnlSummary ? (
          <div className="p-6 flex flex-col gap-4 text-xs font-mono">
            <h3 className="font-extrabold text-base text-slate-900 font-sans border-b pb-2">
              Financial P&L Statement ({startDate} to {endDate})
            </h3>
            <div className="space-y-2 max-w-lg">
              <div className="flex justify-between py-1 border-b">
                <span>Net Sales Revenue:</span>
                <span className="font-bold">₹{parseFloat(pnlSummary.revenue?.netRevenue || '0').toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b text-slate-600">
                <span>Cost of Goods Sold (COGS):</span>
                <span>-₹{parseFloat(pnlSummary.cogs?.totalCogs || '0').toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b font-bold text-emerald-800 text-sm">
                <span>GROSS TRADING PROFIT:</span>
                <span>₹{parseFloat(pnlSummary.grossProfit?.grossProfit || '0').toFixed(2)} ({pnlSummary.grossProfit?.grossMarginPercent}%)</span>
              </div>
              <div className="flex justify-between py-1 border-b text-rose-700">
                <span>Spoilage & Wastage Losses:</span>
                <span>-₹{parseFloat(pnlSummary.wastage?.wastageCost || '0').toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b text-amber-700">
                <span>Operational Expenses & Wages:</span>
                <span>-₹{parseFloat(pnlSummary.operatingExpenses?.totalExpenses || '0').toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-t-2 border-slate-900 font-black text-sm text-slate-950">
                <span>OPERATING PROFIT (EBIT):</span>
                <span>₹{parseFloat(pnlSummary.operatingProfit?.operatingProfit || '0').toFixed(2)} ({pnlSummary.operatingProfit?.operatingMarginPercent}%)</span>
              </div>
            </div>
          </div>
        ) : reportData.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400">
            No records found for {reportType} in the specified date range.
          </div>
        ) : (
          <div className="overflow-x-auto">
            {reportType === 'sales' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Customer / Export Client</th>
                    <th className="py-3 px-3 text-right">Volume (KG)</th>
                    <th className="py-3 px-3 text-right">Grand Total (₹)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold">{s.invoiceNumber}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">{s.saleDate}</td>
                      <td className="py-3 px-3 font-semibold">{s.saleType}</td>
                      <td className="py-3 px-3 font-medium">{s.customer?.name || s.exportCompany?.companyName || 'Walk-in'}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold">{parseFloat(s.totalKg).toFixed(1)} KG</td>
                      <td className="py-3 px-3 text-right font-mono font-black">₹{parseFloat(s.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4 text-center font-bold text-[10px]">{s.paymentStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'procurement' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">Voucher #</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Fisherman Supplier</th>
                    <th className="py-3 px-3 text-right">Intake Weight</th>
                    <th className="py-3 px-3 text-right">Gross Subtotal</th>
                    <th className="py-3 px-3 text-right">Advance Deducted</th>
                    <th className="py-3 px-4 text-right">Net Payable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold">{p.billNumber}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">{p.billDate}</td>
                      <td className="py-3 px-3 font-medium">{p.fisherman?.name}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold">{parseFloat(p.totalKg).toFixed(1)} KG</td>
                      <td className="py-3 px-3 text-right font-mono">₹{parseFloat(p.subtotal).toFixed(2)}</td>
                      <td className="py-3 px-3 text-right font-mono text-purple-700 font-semibold">-₹{parseFloat(p.advanceDeducted).toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-mono font-black text-blue-900">₹{parseFloat(p.grandTotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'stock' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">Species</th>
                    <th className="py-3 px-3">Grade</th>
                    <th className="py-3 px-3 text-right">Quantity KG</th>
                    <th className="py-3 px-3 text-right">WAC Cost / KG</th>
                    <th className="py-3 px-4 text-right">Total Valuation (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{st.seafood?.name}</td>
                      <td className="py-3 px-3 font-semibold text-slate-600">{st.grade?.name}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold">{parseFloat(st.quantityKg).toFixed(1)} KG</td>
                      <td className="py-3 px-3 text-right font-mono">₹{parseFloat(st.averageCost).toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-mono font-black text-indigo-900">₹{parseFloat(st.totalValue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'expenses' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">Voucher #</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Recipient / Worker</th>
                    <th className="py-3 px-3">Method</th>
                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold">{e.expenseNumber}</td>
                      <td className="py-3 px-3 font-semibold text-amber-800">{e.category}</td>
                      <td className="py-3 px-3 font-medium">{e.recipient}</td>
                      <td className="py-3 px-3 font-mono">{e.paymentMethod}</td>
                      <td className="py-3 px-4 text-right font-mono font-black">₹{parseFloat(e.amount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'advances' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">Fisherman</th>
                    <th className="py-3 px-3">Contact</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Advance Balance (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{f.name}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">{f.countryCode} {f.mobileNumber}</td>
                      <td className="py-3 px-3 text-center font-bold text-[10px]">{f.status}</td>
                      <td className="py-3 px-4 text-right font-mono font-black text-purple-900">₹{parseFloat(f.advanceBalance || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
