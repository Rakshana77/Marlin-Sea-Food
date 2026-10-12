import React, { useState, useEffect } from 'react';
import { getPurchaseBills, cancelPurchaseBill } from '../api/collections';
import { PurchaseBill } from '../types/models';
import { CollectionModal } from '../components/operations/CollectionModal';
import { useAuth } from '../hooks/useAuth';
import { printThermalReceipt } from '../utils/receiptPrinter';
import { 
  Scale, 
  Plus, 
  Search, 
  Calendar, 
  RefreshCw, 
  Loader2, 
  Printer, 
  X, 
  AlertCircle, 
  Check, 
  FileText,
  User,
  ArrowDownLeft
} from 'lucide-react';

export const PurchaseBillingPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [bills, setBills] = useState<PurchaseBill[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedBillForSlip, setSelectedBillForSlip] = useState<PurchaseBill | null>(null);
  const [cancellingBillId, setCancellingBillId] = useState<string | null>(null);

  const loadBills = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    try {
      const data = await getPurchaseBills({
        billDate: selectedDate,
        search: search.trim() || undefined,
        limit: 50,
      });
      setBills(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load purchase bills');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadBills();
  }, [selectedDate, search]);

  const handleCancelBill = async (billId: string) => {
    if (!window.confirm('Are you sure you want to cancel this purchase bill? Stock and advance recovery will be compensated.')) {
      return;
    }
    setCancellingBillId(billId);
    setError(null);
    try {
      await cancelPurchaseBill(billId);
      setSuccessMsg('Purchase bill cancelled successfully.');
      loadBills(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to cancel purchase bill');
    } finally {
      setCancellingBillId(null);
    }
  };

  const totalKg = bills.reduce((sum, b) => sum + (parseFloat(b.totalKg) || 0), 0);
  const totalGrossValue = bills.reduce((sum, b) => sum + (parseFloat(b.subtotal) || 0), 0);
  const totalAdvanceDeducted = bills.reduce((sum, b) => sum + (parseFloat(b.advanceDeducted) || 0), 0);
  const totalNetPayable = bills.reduce((sum, b) => sum + (parseFloat(b.grandTotal) || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-24 md:pb-8 flex flex-col gap-4">
      {/* Top Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Dockside Catch Procurement
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Catch Intake & Purchase Billing
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Harbor weighbridge intake, tare deductions, published rates, and advance recoveries
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-xl px-3 py-1.5 border border-slate-200 text-xs font-semibold text-slate-700">
            <Calendar className="w-4 h-4 text-slate-500 mr-2" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => loadBills(true)}
            disabled={isRefreshing}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors"
            title="Refresh Bills"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 bg-blue-700 hover:bg-blue-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Record Catch Collection</span>
            </button>
          )}
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

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Landed Catch</span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1">
            {totalKg.toFixed(1)} <span className="text-sm text-slate-500 font-semibold">KG</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">{bills.length} purchase vouchers</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Gross Intake Value</span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1">
            ₹{totalGrossValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Pre-advance deduction</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-800">Advances Deducted</span>
          <div className="text-xl sm:text-2xl font-black text-purple-900 font-mono mt-1">
            ₹{totalAdvanceDeducted.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-purple-700 mt-0.5">Recovered from boat advance balances</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-800">Net Payable Outflow</span>
          <div className="text-xl sm:text-2xl font-black text-blue-900 font-mono mt-1">
            ₹{totalNetPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-blue-700 mt-0.5">Paid dockside via cash / UPI / transfer</p>
        </div>
      </div>

      {/* Bills Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <span className="font-bold text-xs uppercase tracking-wider text-slate-500">
            Intake Vouchers for {selectedDate} ({bills.length})
          </span>
          <div className="relative w-48 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search voucher # or fisherman..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="text-xs font-semibold">Loading dock purchase vouchers...</span>
          </div>
        ) : bills.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No purchase bills found for {selectedDate}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Voucher Number</th>
                  <th className="py-3 px-3">Fisherman / Supplier</th>
                  <th className="py-3 px-3 text-right">Net Weight</th>
                  <th className="py-3 px-3 text-right">Gross Total</th>
                  <th className="py-3 px-3 text-right">Advance Deducted</th>
                  <th className="py-3 px-3 text-right">Net Payable</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bills.map((bill) => {
                  const isCancelled = bill.status === 'CANCELLED';

                  return (
                    <tr key={bill.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {bill.billNumber}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {bill.fisherman?.name || 'Fisherman Supplier'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {parseFloat(bill.totalKg).toFixed(1)} KG
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">
                        ₹{parseFloat(bill.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-purple-800">
                        {parseFloat(bill.advanceDeducted) > 0 ? `-₹${parseFloat(bill.advanceDeducted).toFixed(2)}` : '₹0.00'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-blue-900 text-sm">
                        ₹{parseFloat(bill.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          isCancelled
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {bill.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedBillForSlip(bill)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Print / View Thermal Voucher"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {isAdmin && !isCancelled && (
                            <button
                              onClick={() => handleCancelBill(bill.id)}
                              disabled={cancellingBillId === bill.id}
                              className="px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg font-bold transition-colors disabled:opacity-50"
                            >
                              {cancellingBillId === bill.id ? 'Cancelling...' : 'Cancel'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Record Catch Collection */}
      {showCreateModal && (
        <CollectionModal
          onSuccess={() => {
            setShowCreateModal(false);
            setSuccessMsg('Catch intake recorded and purchase bill generated successfully!');
            loadBills(true);
          }}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Printable Thermal Slip Modal */}
      {selectedBillForSlip && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">Purchase Voucher</span>
              <button onClick={() => setSelectedBillForSlip(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thermal Slip Content */}
            <div id="purchase-slip-print" className="p-6 font-mono text-xs text-slate-900 bg-white">
              <div className="text-center border-b border-dashed border-slate-300 pb-3 mb-3">
                <h2 className="font-black text-base uppercase">MARINE SEAFOODS</h2>
                <p className="text-[10px] text-slate-600">HARBOR WEIGHBRIDGE TERMINAL #04</p>
                <p className="text-[10px] text-slate-600">CATCH PURCHASE VOUCHER</p>
              </div>

              <div className="space-y-1 mb-3 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Voucher #:</span>
                  <span className="font-bold">{selectedBillForSlip.billNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date:</span>
                  <span>{selectedBillForSlip.billDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Supplier:</span>
                  <span className="font-bold">{selectedBillForSlip.fisherman?.name}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="border-t border-b border-dashed border-slate-300 py-2 mb-3">
                <div className="font-bold flex justify-between text-[11px] mb-1">
                  <span>Species</span>
                  <span>Qty x Rate</span>
                  <span>Total</span>
                </div>
                {selectedBillForSlip.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[11px] py-0.5">
                    <span className="truncate max-w-[100px]">{item.seafood?.name || 'Seafood'}</span>
                    <span>{parseFloat(item.quantityKg).toFixed(1)}kg @ {item.purchaseRate}</span>
                    <span className="font-bold">₹{parseFloat(item.amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Financial Totals */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Gross Value:</span>
                  <span>₹{parseFloat(selectedBillForSlip.subtotal).toFixed(2)}</span>
                </div>
                {parseFloat(selectedBillForSlip.advanceDeducted) > 0 && (
                  <div className="flex justify-between text-purple-800 font-bold">
                    <span>Advance Deducted:</span>
                    <span>-₹{parseFloat(selectedBillForSlip.advanceDeducted).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black border-t border-slate-300 pt-1.5 mt-1">
                  <span>NET PAYABLE:</span>
                  <span>₹{parseFloat(selectedBillForSlip.grandTotal).toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-500 mt-5 pt-3 border-t border-dashed border-slate-300">
                <p>Authorized Weighbridge Dock Slip</p>
                <p>Marine ERP Core Engine</p>
              </div>
            </div>

            {/* Print CTA */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedBillForSlip(null)}
                className="px-4 py-2 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-200"
              >
                Close
              </button>
              <button
                onClick={() => printThermalReceipt('purchase-slip-print', 'Purchase Voucher')}
                className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Thermal Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
