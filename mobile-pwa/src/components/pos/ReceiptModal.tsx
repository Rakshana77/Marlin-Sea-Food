import React, { useEffect } from 'react';
import { Sale } from '../../types/models';
import { CheckCircle2, Printer, Share2, Plus, X, Anchor } from 'lucide-react';
import { printThermalReceipt } from '../../utils/receiptPrinter';

interface ReceiptModalProps {
  sale: Sale;
  onNewSale: () => void;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  sale,
  onNewSale,
  onClose,
}) => {
  // Pre-sync printable receipt content to print-root so Ctrl+P or direct browser print also prints strictly 1 page
  useEffect(() => {
    const printRoot = document.getElementById('print-root');
    const printableEl = document.getElementById('thermal-receipt-printable');
    if (printRoot && printableEl) {
      printRoot.innerHTML = printableEl.innerHTML;
      document.body.classList.add('is-printing-receipt');
    }
    return () => {
      document.body.classList.remove('is-printing-receipt');
      const root = document.getElementById('print-root');
      if (root) root.innerHTML = '';
    };
  }, [sale]);

  const handlePrint = () => {
    printThermalReceipt('thermal-receipt-printable');
  };

  const handleShare = async () => {
    const text = `Marine Seafoods Bill #${sale.invoiceNumber}\nDate: ${sale.saleDate}\nBuyer: ${sale.customer?.name || 'Walk-in'}\nTotal: ₹${sale.grandTotal}\nStatus: ${sale.paymentStatus}\nThank you for your business.`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invoice #${sale.invoiceNumber}`,
          text,
        });
      } catch {
        // Share cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
      alert('Receipt summary copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Success Banner */}
        <div className="bg-emerald-700 text-white p-4 text-center">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-extrabold text-lg sm:text-xl">Sale Confirmed</h3>
          <p className="text-xs text-emerald-100 font-mono tracking-wider mt-0.5">
            Invoice #{sale.invoiceNumber}
          </p>
        </div>

        {/* Printable Receipt Body */}
        <div id="thermal-receipt-printable" className="p-4 overflow-y-auto flex-1 font-mono text-xs">
          {/* Business Info Header */}
          <div className="text-center pb-3 border-b border-dashed border-slate-300">
            <h4 className="font-bold text-sm text-slate-900 tracking-wide uppercase">
              Marine Seafoods Terminal
            </h4>
            <p className="text-[11px] text-slate-500">Wholesale Fish & Shellfish Dispatch</p>
            <p className="text-[11px] text-slate-500">GST: 33AABCM9981K1Z5 • Harbor Wharf #04</p>
          </div>

          {/* Invoice & Buyer Meta */}
          <div className="py-2.5 border-b border-dashed border-slate-300 flex flex-col gap-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Bill No:</span>
              <span className="font-bold text-slate-900">{sale.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date/Time:</span>
              <span className="text-slate-800">{new Date(sale.createdAt || Date.now()).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Buyer:</span>
              <span className="font-bold text-slate-900">{sale.customer?.name || 'Walk-in Customer'}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-2.5 border-b border-dashed border-slate-300">
            <div className="grid grid-cols-12 font-bold text-slate-700 pb-1 mb-1 border-b border-slate-200 text-[11px]">
              <span className="col-span-5">Item</span>
              <span className="col-span-3 text-right">Qty</span>
              <span className="col-span-4 text-right">Amount</span>
            </div>

            <div className="flex flex-col gap-1.5">
              {sale.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 text-[11px] leading-tight">
                  <div className="col-span-5">
                    <span className="font-semibold block truncate">{item.seafood?.name || 'Seafood Item'}</span>
                    <span className="text-[9px] text-slate-500">({item.grade?.name || 'Grade A'})</span>
                  </div>
                  <div className="col-span-3 text-right text-slate-600">
                    {item.quantityKg} kg
                  </div>
                  <div className="col-span-4 text-right font-bold text-slate-900">
                    ₹{item.amount}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Totals */}
          <div className="py-2.5 border-b border-dashed border-slate-300 flex flex-col gap-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal:</span>
              <span>₹{sale.subtotal}</span>
            </div>
            {parseFloat(sale.discount) > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount:</span>
                <span>-₹{sale.discount}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-slate-900 pt-1 border-t border-slate-200">
              <span>Grand Total:</span>
              <span>₹{sale.grandTotal}</span>
            </div>
            <div className="flex justify-between text-slate-700 pt-1">
              <span>Payment Mode:</span>
              <span className="font-bold">{sale.payments?.[0]?.paymentMethod || 'CASH'}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Amount Paid:</span>
              <span className="font-bold text-emerald-700">₹{sale.paidAmount}</span>
            </div>
            {parseFloat(sale.changeAmount) > 0 && (
              <div className="flex justify-between text-slate-700">
                <span>Change Returned:</span>
                <span>₹{sale.changeAmount}</span>
              </div>
            )}
            {parseFloat(sale.outstandingAmount) > 0 && (
              <div className="flex justify-between text-rose-700 font-bold">
                <span>Balance Due:</span>
                <span>₹{sale.outstandingAmount}</span>
              </div>
            )}
          </div>

          {/* Receipt Footer Directive */}
          <div className="pt-4 text-center text-[11px] text-slate-600">
            <p className="font-bold text-slate-900">Thank you for your business.</p>
            <p className="text-[9px] text-slate-400 mt-1">
              Computer-generated dock slip • No returns on perishable seafood
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            <Printer className="w-4 h-4 text-teal-700" />
            <span>Print</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            <Share2 className="w-4 h-4 text-indigo-700" />
            <span>Share</span>
          </button>

          <button
            type="button"
            onClick={onNewSale}
            className="py-2.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Sale</span>
          </button>
        </div>
      </div>
    </div>
  );
};
