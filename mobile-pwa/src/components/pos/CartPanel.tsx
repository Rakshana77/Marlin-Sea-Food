import React from 'react';
import { useCart } from '../../hooks/useCart';
import { useNetwork } from '../../hooks/useNetwork';
import { Trash2, ShoppingCart, User, ArrowRight, Minus, Plus, Tag } from 'lucide-react';

interface CartPanelProps {
  onOpenBuyerModal: () => void;
  onProceedToPayment: () => void;
  onEditItemQty: (item: any) => void;
}

export const CartPanel: React.FC<CartPanelProps> = ({
  onOpenBuyerModal,
  onProceedToPayment,
  onEditItemQty,
}) => {
  const { items, customer, discount, totals, removeItem, clearCart, setDiscount } = useCart();
  const { isOnline } = useNetwork();

  const hasItems = items.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Cart Header */}
      <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-teal-400" />
          <h2 className="font-bold text-sm sm:text-base">Billing Manifest</h2>
          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {hasItems && (
          <button
            onClick={() => {
              if (window.confirm('Clear all items from current cart?')) {
                clearCart();
              }
            }}
            className="text-xs text-rose-300 hover:text-rose-200 hover:underline flex items-center gap-1 active:scale-95 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Buyer Quick Ribbon */}
      <div className="bg-slate-50 px-3.5 py-2.5 border-b border-slate-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-7 h-7 rounded-full bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-800 flex-shrink-0">
            <User className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <span className="text-[11px] text-slate-500 font-medium block leading-none">Buyer</span>
            <span className="text-xs font-bold text-slate-900 truncate block">
              {customer.name} {customer.isWalkIn && '(Walk-in)'}
            </span>
          </div>
        </div>

        <button
          onClick={onOpenBuyerModal}
          className="text-xs font-bold text-teal-800 bg-white border border-slate-300 px-2.5 py-1 rounded-lg hover:bg-slate-100 active:scale-95 transition-all flex-shrink-0"
        >
          Change
        </button>
      </div>

      {/* Items Scrollable List */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 min-h-[180px]">
        {!hasItems ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-center px-4">
            <ShoppingCart className="w-10 h-10 stroke-[1.5] text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">Cart is empty</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Select seafood and grade from the catalog to start billing.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="p-2.5 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 shadow-sm flex items-center justify-between gap-2"
            >
              <div 
                onClick={() => onEditItemQty(item)}
                className="flex-1 cursor-pointer pr-1"
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                    {item.seafoodName}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {item.gradeName}
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 font-medium">
                  <span className="font-tabular font-bold text-slate-700">
                    {item.quantityKg} {item.unit}
                  </span>
                  <span>×</span>
                  <span className="font-tabular">₹{item.sellingRate}</span>
                </div>
              </div>

              {/* Amount & Remove */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="font-bold text-sm sm:text-base font-tabular text-teal-900">
                  ₹{item.amount}
                </span>
                <button
                  onClick={() => removeItem(item.id)}
                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bill Calculation & Summary */}
      {hasItems && (
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col gap-2">
          {/* Subtotal */}
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Weight & Items ({totals.totalKg} kg)</span>
            <span className="font-tabular font-semibold">₹{totals.subtotal}</span>
          </div>

          {/* Discount Entry */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-xs text-slate-600">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>Discount</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-400 font-bold">₹</span>
              <input
                type="number"
                min="0"
                step="1"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="0.00"
                className="w-20 px-2 py-1 text-right text-xs font-bold font-tabular rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Grand Total */}
          <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between">
            <span className="font-bold text-sm text-slate-900">Grand Total</span>
            <span className="text-2xl font-extrabold font-tabular text-teal-800">
              ₹{totals.grandTotal}
            </span>
          </div>

          {/* Checkout Button */}
          <button
            onClick={onProceedToPayment}
            disabled={!hasItems || !isOnline}
            className={`w-full py-3 rounded-xl font-bold text-sm sm:text-base shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all ${
              !isOnline
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-teal-700 hover:bg-teal-600 text-white'
            }`}
          >
            <span>{!isOnline ? 'Offline - Transactions Blocked' : 'Proceed to Payment'}</span>
            {isOnline && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  );
};
