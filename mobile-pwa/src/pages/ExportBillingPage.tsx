import React, { useState, useEffect } from 'react';
import { getSales, createSale, cancelSale } from '../api/sales';
import { getExportCompanies } from '../api/exportCompanies';
import { getStockList } from '../api/stock';
import { getGrades } from '../api/masters';
import { Sale, ExportCompany, StockItem, SeafoodGrade } from '../types/models';
import { useAuth } from '../hooks/useAuth';
import { printThermalReceipt } from '../utils/receiptPrinter';
import { 
  Globe, 
  Plus, 
  Search, 
  Calendar, 
  RefreshCw, 
  Loader2, 
  Printer, 
  X, 
  AlertCircle, 
  Check, 
  Building2, 
  Ship, 
  Boxes, 
  Trash2,
  ArrowUpRight
} from 'lucide-react';

export const ExportBillingPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'history' | 'create'>('history');

  // History & List States
  const [exportSales, setExportSales] = useState<Sale[]>([]);
  const [search, setSearch] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Masters for Creating Export Bill
  const [exportCompanies, setExportCompanies] = useState<ExportCompany[]>([]);
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [grades, setGrades] = useState<SeafoodGrade[]>([]);

  // Form Fields
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [exportRef, setExportRef] = useState<string>('');
  const [destinationPort, setDestinationPort] = useState<string>('');
  const [dispatchDate, setDispatchDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [saleDate, setSaleDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState<'CREDIT' | 'BANK_TRANSFER' | 'CASH' | 'UPI'>('CREDIT');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Cart Line Items for Export Consignment
  const [items, setItems] = useState<Array<{
    seafoodId: string;
    seafoodName: string;
    gradeId: string;
    gradeName: string;
    quantityKg: string;
    sellingRate: string;
    amount: string;
    availableStockKg: number;
  }>>([]);

  // Line item adder form states
  const [addStockId, setAddStockId] = useState<string>('');
  const [addQty, setAddQty] = useState<string>('');
  const [addRate, setAddRate] = useState<string>('');

  // Print Modal
  const [selectedSaleForPrint, setSelectedSaleForPrint] = useState<Sale | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [cancellingSaleId, setCancellingSaleId] = useState<string | null>(null);

  const loadData = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    try {
      const [salesData, companiesData, stockData, gradeData] = await Promise.all([
        getSales({
          saleType: 'EXPORT',
          search: search.trim() || undefined,
          date: selectedDate || undefined,
          limit: 50,
        }),
        getExportCompanies('', 'ACTIVE'),
        getStockList({ limit: 100 }),
        getGrades(true),
      ]);
      setExportSales(salesData || []);
      setExportCompanies(companiesData || []);
      setStocks(stockData || []);
      setGrades(gradeData || []);
      if (companiesData && companiesData[0] && !selectedCompanyId) {
        setSelectedCompanyId(companiesData[0].id);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load export sales data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, selectedDate]);

  // When stock item is selected for adding to consignment
  const handleStockSelectionChange = (stockId: string) => {
    setAddStockId(stockId);
    const selectedStock = stocks.find(s => s.id === stockId);
    if (selectedStock) {
      // Suggest previous rate or standard rate
      setAddRate('');
    }
  };

  const handleAddItem = () => {
    if (!addStockId) {
      setError('Please select a seafood species from available stock');
      return;
    }
    const qtyVal = parseFloat(addQty);
    const rateVal = parseFloat(addRate);

    if (isNaN(qtyVal) || qtyVal <= 0) {
      setError('Please enter a valid export quantity in KG');
      return;
    }
    if (isNaN(rateVal) || rateVal <= 0) {
      setError('Please enter a valid export selling rate per KG');
      return;
    }

    const selectedStock = stocks.find(s => s.id === addStockId);
    if (!selectedStock) return;

    const availableKg = parseFloat(selectedStock.quantityKg) || 0;
    if (qtyVal > availableKg) {
      if (!window.confirm(`Warning: Requested quantity (${qtyVal} KG) exceeds recorded cold storage stock (${availableKg} KG). Proceed?`)) {
        return;
      }
    }

    const lineTotal = (qtyVal * rateVal).toFixed(2);
    const newItem = {
      seafoodId: selectedStock.seafoodId,
      seafoodName: selectedStock.seafood?.name || 'Seafood',
      gradeId: selectedStock.gradeId,
      gradeName: selectedStock.grade?.name || 'Grade A',
      quantityKg: qtyVal.toString(),
      sellingRate: rateVal.toFixed(2),
      amount: lineTotal,
      availableStockKg: availableKg,
    };

    setItems([...items, newItem]);
    setAddStockId('');
    setAddQty('');
    setAddRate('');
    setError(null);
  };

  const handleRemoveItem = (index: number) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  const handleCreateExportSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyId) {
      setError('Please select an export company');
      return;
    }
    if (items.length === 0) {
      setError('Export invoice must contain at least one seafood line item');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const payload: any = {
        saleType: 'EXPORT',
        exportCompanyId: selectedCompanyId,
        exportRef: exportRef.trim() || undefined,
        destinationPort: destinationPort.trim() || undefined,
        dispatchDate: dispatchDate || undefined,
        saleDate: saleDate,
        items: items.map(it => ({
          seafoodId: it.seafoodId,
          gradeId: it.gradeId,
          quantityKg: it.quantityKg,
          sellingRate: it.sellingRate,
          unitPrice: it.sellingRate,
        })),
        payment: {
          method: paymentMethod,
          amount: paymentMethod === 'CREDIT' ? '0.00' : (paymentAmount || subtotal.toFixed(2)),
          notes: `Export dispatch - ${destinationPort || 'Overseas'}`,
        },
        notes: notes.trim() || undefined,
      };

      const createdSale = await createSale(payload);
      setSuccessMsg(`Export invoice ${createdSale.invoiceNumber} recorded successfully!`);
      // Reset form
      setItems([]);
      setExportRef('');
      setDestinationPort('');
      setPaymentAmount('');
      setNotes('');
      setActiveTab('history');
      loadData(true);
      setSelectedSaleForPrint(createdSale);
    } catch (err: any) {
      setError(err?.message || 'Failed to create export sale');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSale = async (saleId: string) => {
    if (!window.confirm('Cancel this export sale? Stock will be restored and receivables reversed.')) {
      return;
    }
    setCancellingSaleId(saleId);
    setError(null);
    try {
      await cancelSale(saleId);
      setSuccessMsg('Export sale cancelled and stock compensated.');
      loadData(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to cancel export sale');
    } finally {
      setCancellingSaleId(null);
    }
  };

  // Aggregates for history
  const totalExportRevenue = exportSales.reduce((sum, s) => sum + (parseFloat(s.grandTotal) || 0), 0);
  const totalExportKg = exportSales.reduce((sum, s) => sum + (parseFloat(s.totalKg) || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-24 md:pb-8 flex flex-col gap-4">
      {/* Top Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              International Cargo Consignments
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Export Billing & Cargo Invoices
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Overseas reefer shipments, FOB invoicing, destination ports, and export sales ledger
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors"
            title="Refresh Invoices"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-purple-600' : ''}`} />
          </button>

          <button
            onClick={() => setActiveTab(activeTab === 'create' ? 'history' : 'create')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
              activeTab === 'create'
                ? 'bg-slate-800 text-white hover:bg-slate-700'
                : 'bg-purple-700 text-white hover:bg-purple-600 active:scale-95'
            }`}
          >
            {activeTab === 'create' ? (
              <span>View Invoice History</span>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>+ New Export Bill</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Mode A: Create Export Bill */}
      {activeTab === 'create' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 flex flex-col gap-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-extrabold text-slate-900">Create Export Consignment Bill</h2>
            <p className="text-xs text-slate-500">Record international shipment invoice against stock</p>
          </div>

          <form onSubmit={handleCreateExportSale} className="flex flex-col gap-5 text-xs">
            {/* Header Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Export Partner <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Company</option>
                  {exportCompanies.map((c) => (
                    <option key={c.id} value={c.id}>{c.companyName} ({c.taxNumber || 'Active'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Shipping Bill / Export Ref</label>
                <input
                  type="text"
                  value={exportRef}
                  onChange={(e) => setExportRef(e.target.value)}
                  placeholder="e.g. SB-2026-9048 / Cont #C-409"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Destination Port</label>
                <input
                  type="text"
                  value={destinationPort}
                  onChange={(e) => setDestinationPort(e.target.value)}
                  placeholder="e.g. Port of Jebel Ali, Dubai"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Sale Date</label>
                <input
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                />
              </div>
            </div>

            {/* Seafood Consignment Line Items Builder */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col gap-3">
              <span className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
                Add Seafood Species To Shipment
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-600 block mb-1">Species in Cold Storage</label>
                  <select
                    value={addStockId}
                    onChange={(e) => handleStockSelectionChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold bg-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select Species & Grade</option>
                    {stocks.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.seafood?.name} - {s.grade?.name} ({parseFloat(s.quantityKg).toFixed(1)} KG in stock)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-600 block mb-1">Export Weight (KG)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={addQty}
                    onChange={(e) => setAddQty(e.target.value)}
                    placeholder="0.000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-600 block mb-1">Selling Rate (₹/KG)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={addRate}
                    onChange={(e) => setAddRate(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>

              {/* Items Manifest Table */}
              {items.length > 0 && (
                <div className="mt-3 overflow-x-auto bg-white rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                        <th className="py-2.5 px-3">Species</th>
                        <th className="py-2.5 px-3">Grade</th>
                        <th className="py-2.5 px-3 text-right">Export Qty</th>
                        <th className="py-2.5 px-3 text-right">Agreed Rate</th>
                        <th className="py-2.5 px-3 text-right">Total (₹)</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{it.seafoodName}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-600">{it.gradeName}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold">{it.quantityKg} KG</td>
                          <td className="py-2.5 px-3 text-right font-mono">₹{it.sellingRate}/KG</td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-purple-900">
                            ₹{it.amount}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-rose-500 hover:text-rose-700 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Payment & Terms */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold bg-white"
                >
                  <option value="CREDIT">CREDIT (Account Receivable)</option>
                  <option value="BANK_TRANSFER">BANK TRANSFER (Advance/Letter of Credit)</option>
                  <option value="CASH">CASH</option>
                  <option value="UPI">UPI / QR</option>
                </select>
              </div>

              {paymentMethod !== 'CREDIT' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Paid Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder={subtotal.toFixed(2)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-xs"
                  />
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Notes / Container Manifest</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Master bill of lading, temperature logger #44, etc."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>
            </div>

            {/* Grand Total & Submit */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-200">
              <div>
                <span className="text-xs text-slate-500 font-bold block uppercase">Consignment Total</span>
                <span className="text-2xl font-black font-mono text-purple-900">
                  ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className="px-4 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || items.length === 0}
                  className="px-6 py-2.5 bg-purple-700 hover:bg-purple-600 active:scale-95 text-white font-extrabold rounded-xl shadow flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Confirm & Issue Export Bill</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        /* Mode B: Export Invoices History */
        <div className="flex flex-col gap-4">
          {/* KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Export Value</span>
              <div className="text-xl sm:text-2xl font-black text-purple-900 font-mono mt-1">
                ₹{totalExportRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{exportSales.length} shipments issued</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Export Volume</span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1">
                {totalExportKg.toFixed(1)} <span className="text-sm font-semibold text-slate-500">KG</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Dispatched overseas</p>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-500">
                Export Invoices ({exportSales.length})
              </span>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search invoice # or partner..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                <span className="text-xs font-semibold">Loading export sales...</span>
              </div>
            ) : exportSales.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400">
                No export invoices recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-3">Export Client</th>
                      <th className="py-3 px-3">Port / Destination</th>
                      <th className="py-3 px-3 text-right">Net Weight</th>
                      <th className="py-3 px-3 text-right">Invoice Total</th>
                      <th className="py-3 px-3 text-center">Payment Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {exportSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {sale.invoiceNumber}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {sale.exportCompany?.companyName || 'Export Partner'}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {sale.destinationPort || 'Overseas Wharf'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                          {parseFloat(sale.totalKg).toFixed(1)} KG
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-purple-900 text-sm">
                          ₹{parseFloat(sale.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            sale.paymentStatus === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : sale.paymentStatus === 'PARTIALLY_PAID'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {sale.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedSaleForPrint(sale)}
                              className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Print / View Export Invoice"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {isAdmin && sale.status !== 'CANCELLED' && (
                              <button
                                onClick={() => handleCancelSale(sale.id)}
                                disabled={cancellingSaleId === sale.id}
                                className="px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg font-bold transition-colors disabled:opacity-50"
                              >
                                {cancellingSaleId === sale.id ? 'Cancelling...' : 'Cancel'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Printable Thermal/A4 Export Slip Modal */}
      {selectedSaleForPrint && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">Export Commercial Invoice</span>
              <button onClick={() => setSelectedSaleForPrint(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Print Slip Content */}
            <div id="export-slip-print" className="p-6 font-mono text-xs text-slate-900 bg-white">
              <div className="text-center border-b border-dashed border-slate-300 pb-3 mb-3">
                <h2 className="font-black text-base uppercase">MARINE SEAFOODS</h2>
                <p className="text-[10px] text-slate-600">EXPORT CONSIGNMENT BILL</p>
                <p className="text-[10px] text-slate-600">CUSTOMS HARBOR WHARF #04</p>
              </div>

              <div className="space-y-1 mb-3 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice #:</span>
                  <span className="font-bold">{selectedSaleForPrint.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date:</span>
                  <span>{selectedSaleForPrint.saleDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Client:</span>
                  <span className="font-bold">{selectedSaleForPrint.exportCompany?.companyName || 'Export Partner'}</span>
                </div>
                {selectedSaleForPrint.destinationPort && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Port:</span>
                    <span>{selectedSaleForPrint.destinationPort}</span>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="border-t border-b border-dashed border-slate-300 py-2 mb-3">
                <div className="font-bold flex justify-between text-[11px] mb-1">
                  <span>Species</span>
                  <span>Qty x Rate</span>
                  <span>Total</span>
                </div>
                {selectedSaleForPrint.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[11px] py-0.5">
                    <span className="truncate max-w-[100px]">{item.seafood?.name || 'Seafood'}</span>
                    <span>{parseFloat(item.quantityKg).toFixed(1)}kg @ {item.sellingRate}</span>
                    <span className="font-bold">₹{parseFloat(item.amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Financial Totals */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>FOB Subtotal:</span>
                  <span>₹{parseFloat(selectedSaleForPrint.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-black border-t border-slate-300 pt-1.5 mt-1">
                  <span>GRAND TOTAL:</span>
                  <span>₹{parseFloat(selectedSaleForPrint.grandTotal).toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-500 mt-5 pt-3 border-t border-dashed border-slate-300">
                <p>Commercial Marine Export Document</p>
                <p>Marine Seafoods Management System</p>
              </div>
            </div>

            {/* Print Action */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedSaleForPrint(null)}
                className="px-4 py-2 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-200"
              >
                Close
              </button>
              <button
                onClick={() => printThermalReceipt('export-slip-print', 'Export Commercial Invoice')}
                className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
