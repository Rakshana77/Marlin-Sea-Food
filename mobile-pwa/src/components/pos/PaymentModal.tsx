import React, { useState } from 'react';
import { useCart } from '../../hooks/useCart';
import { useNetwork } from '../../hooks/useNetwork';
import { PaymentMethod, Sale } from '../../types/models';
import { createSale } from '../../api/sales';
import { ApiError } from '../../api/client';
import { X, Check, CreditCard, Banknote, QrCode, Building, AlertCircle, Loader2 } from 'lucide-react';

interface PaymentModalProps {
  onSaleSuccess: (sale: Sale) => void;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  onSaleSuccess,
  onClose,
}) => {
  const { items, customer, discount, totals, clearCart } = useCart();
  const { isOnline } = useNetwork();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [tenderedInput, setTenderedInput] = useState<string>(totals.grandTotal);
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Per-checkout idempotency key to prevent accidental duplicate invoices
  const [idempotencyKey] = useState<string>(() => {
    return 'pwa_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  });

  const grandTotalNum = parseFloat(totals.grandTotal) || 0;
  const tenderedNum = parseFloat(tenderedInput) || grandTotalNum;
  const changeNum = Math.max(0, tenderedNum - grandTotalNum);
  const balanceOutstanding = Math.max(0, grandTotalNum - tenderedNum);

  const isWalkIn = customer.isWalkIn;

  // Quick cash presets
  const handleCashPreset = (amount: number) => {
    setTenderedInput(amount.toFixed(2));
  };

  const handleConfirmSale = async () => {
    if (!isOnline) {
      setErrorMessage('You are offline. Connect to the internet to complete billing.');
      return;
    }

    if (items.length === 0) {
      setErrorMessage('Cart is empty.');
      return;
    }

    // Enforce Walk-in credit rule
    if (isWalkIn && paymentMethod === 'CREDIT') {
      setErrorMessage('Credit billing is strictly forbidden for Walk-in customers. Select Cash or UPI.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const todayIso = new Date().toISOString().split('T')[0];

    try {
      const payloadItems = items.map((item) => ({
        seafoodId: item.seafoodId,
        gradeId: item.gradeId,
        quantityKg: item.quantityKg,
        sellingRate: item.sellingRate,
      }));

      const confirmedSale = await createSale({
        saleType: 'WHOLESALE',
        customerId: customer.isWalkIn ? undefined : customer.id,
        saleDate: todayIso,
        items: payloadItems,
        discount: totals.discount,
        payment: {
          method: paymentMethod,
          amount: paymentMethod === 'CREDIT' ? '0.00' : (tenderedNum >= grandTotalNum ? totals.grandTotal : tenderedNum.toFixed(2)),
          referenceNumber: referenceNumber.trim() || undefined,
          notes: notes.trim() || undefined,
        },
        notes: notes.trim() || null,
        idempotencyKey,
      });

      // Clear local cart now that the sale is confirmed by the backend
      clearCart();
      onSaleSuccess(confirmedSale);
    } catch (err) {
      const apiErr = err as ApiError;
      setErrorMessage(
        apiErr.message || 'Sale confirmation failed. Please verify stock or network.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-primary-container text-white px-4 py-3 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base sm:text-lg">Payment & Bill Confirmation</h3>
            <p className="text-xs text-slate-300">
              Buyer: <span className="text-teal-300 font-semibold">{customer.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-4">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Amount Summary Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Payable Amount
            </span>
            <span className="text-3xl sm:text-4xl font-extrabold font-tabular text-teal-900 block my-1">
              ₹{totals.grandTotal}
            </span>
            <div className="flex items-center justify-center gap-3 text-xs text-slate-500 font-medium">
              <span>Items: {items.length}</span>
              <span>•</span>
              <span>Weight: {totals.totalKg} kg</span>
              {parseFloat(totals.discount) > 0 && (
                <>
                  <span>•</span>
                  <span className="text-emerald-700 font-bold">Disc: ₹{totals.discount}</span>
                </>
              )}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              Select Payment Method
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                  paymentMethod === 'CASH'
                    ? 'border-teal-700 bg-teal-50 text-teal-900 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-5 h-5 text-emerald-600" />
                <span>Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                  paymentMethod === 'UPI'
                    ? 'border-teal-700 bg-teal-50 text-teal-900 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <QrCode className="w-5 h-5 text-indigo-600" />
                <span>UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('BANK_TRANSFER')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                  paymentMethod === 'BANK_TRANSFER'
                    ? 'border-teal-700 bg-teal-50 text-teal-900 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Building className="w-5 h-5 text-blue-600" />
                <span>Bank IMPS</span>
              </button>

              <button
                type="button"
                disabled={isWalkIn}
                onClick={() => setPaymentMethod('CREDIT')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                  isWalkIn
                    ? 'opacity-40 border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                    : paymentMethod === 'CREDIT'
                      ? 'border-teal-700 bg-teal-50 text-teal-900 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
                title={isWalkIn ? 'Credit is not permitted for Walk-in buyers' : 'Account Credit'}
              >
                <CreditCard className="w-5 h-5 text-amber-600" />
                <span>Credit</span>
              </button>
            </div>

            {isWalkIn && (
              <p className="text-[11px] text-slate-400 mt-1 italic">
                * Note: Walk-in customers require immediate full settlement.
              </p>
            )}
          </div>

          {/* Cash Tendered Input & Change Preview */}
          {paymentMethod === 'CASH' && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Cash Received (₹)</label>
                <span className="text-xs text-slate-500 font-medium">Quick presets:</span>
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setTenderedInput(totals.grandTotal)}
                  className="px-2.5 py-1 rounded-lg bg-teal-100 hover:bg-teal-200 text-teal-900 text-xs font-bold"
                >
                  Exact (₹{totals.grandTotal})
                </button>
                {[500, 1000, 2000, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleCashPreset(amt)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold"
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>

              <input
                type="number"
                step="1"
                value={tenderedInput}
                onChange={(e) => setTenderedInput(e.target.value)}
                placeholder={totals.grandTotal}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-base font-bold font-tabular text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />

              {/* Change Output */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Change to Return:</span>
                <span className="text-base font-extrabold font-tabular text-emerald-700">
                  ₹{changeNum.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Reference / Transaction ID for Digital Payments */}
          {(paymentMethod === 'UPI' || paymentMethod === 'BANK_TRANSFER') && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Transaction / UTR Reference (Optional)
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. UPI Ref #4091823901"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Order Notes / Dock Memo (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Ice box packed, vehicle #KL-07-889"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Footer Confirmation */}
        <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4 py-3 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isSubmitting || !isOnline}
            onClick={handleConfirmSale}
            className="flex-1 py-3 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold text-base shadow-md flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Confirming Sale...</span>
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>Confirm & Print Bill (₹{totals.grandTotal})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
