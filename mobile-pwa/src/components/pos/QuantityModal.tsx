import React, { useState, useRef, useEffect } from 'react';
import { Seafood, SeafoodGrade } from '../../types/models';
import { X, Check, Delete, AlertCircle, Keyboard } from 'lucide-react';

interface QuantityModalProps {
  seafood: Seafood;
  grade: SeafoodGrade;
  rate: string;
  availableKg: number;
  initialQuantity?: string;
  onConfirm: (quantityKg: string) => void;
  onClose: () => void;
}

export const QuantityModal: React.FC<QuantityModalProps> = ({
  seafood,
  grade,
  rate,
  availableKg,
  initialQuantity = '1.000',
  onConfirm,
  onClose,
}) => {
  const [quantity, setQuantity] = useState<string>(initialQuantity);
  const [isPristine, setIsPristine] = useState<boolean>(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const rateNum = parseFloat(rate) || 0;
  const qtyNum = parseFloat(quantity) || 0;
  const lineTotal = (qtyNum * rateNum).toFixed(2);
  const exceedsStock = availableKg > 0 && qtyNum > availableKg;

  // Auto-focus and highlight input on mount for immediate keyboard entry
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  // Global escape key to close modal
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [onClose]);

  // Handle direct manual typing in the input field
  const handleManualInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsPristine(false);
    const raw = e.target.value;

    // Allow user to clear completely to type from scratch
    if (raw === '') {
      setQuantity('');
      return;
    }

    // Normalize comma to decimal point (common on international keyboards)
    const normalized = raw.replace(',', '.');
    // Allow only numeric digits and a decimal point
    let cleaned = normalized.replace(/[^0-9.]/g, '');

    // If starts with '.', turn into '0.'
    if (cleaned === '.') {
      setQuantity('0.');
      return;
    }

    // Allow max 1 decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return;
    }

    // Limit decimal precision to 3 places (standard for KG in seafood trade)
    if (parts[1] && parts[1].length > 3) {
      return;
    }

    // Normalize leading zeros (e.g., '05' -> '5', but keep '0.x' and '0')
    if (cleaned.length > 1 && cleaned.startsWith('0') && cleaned[1] !== '.') {
      cleaned = cleaned.replace(/^0+/, '') || '0';
    }

    setQuantity(cleaned);
  };

  // Keyboard actions on input (Enter to submit, Escape to close)
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (qtyNum > 0) {
        handleConfirm();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // On-screen virtual keypad digit handler
  const handleDigit = (digit: string) => {
    if (isPristine) {
      setIsPristine(false);
      if (digit === '.') {
        setQuantity('0.');
      } else {
        setQuantity(digit);
      }
      return;
    }

    if (quantity === '0' || quantity === '0.000' || quantity === '') {
      if (digit === '.') {
        setQuantity('0.');
      } else {
        setQuantity(digit);
      }
      return;
    }

    // Allow max 1 decimal point
    if (digit === '.' && quantity.includes('.')) return;

    // Limit decimal precision to 3 places
    if (quantity.includes('.') && quantity.split('.')[1].length >= 3) return;

    setQuantity(quantity + digit);
  };

  const handleBackspace = () => {
    setIsPristine(false);
    if (!quantity || quantity.length <= 1 || quantity === '0') {
      setQuantity('');
    } else {
      setQuantity(quantity.slice(0, -1));
    }
  };

  const handleClear = () => {
    setIsPristine(false);
    setQuantity('');
    inputRef.current?.focus();
  };

  // Quick preset shortcuts
  const handleQuickAdd = (amount: number) => {
    setIsPristine(false);
    const current = parseFloat(quantity) || 0;
    const next = Math.max(0, current + amount);
    setQuantity(next.toFixed(3));
    inputRef.current?.focus();
  };

  const handleSetPreset = (preset: number) => {
    setIsPristine(false);
    setQuantity(preset.toFixed(3));
    inputRef.current?.focus();
  };

  const handleConfirm = () => {
    if (qtyNum <= 0) return;
    onConfirm(qtyNum.toFixed(3));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-primary-container text-white px-4 py-3 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base sm:text-lg">{seafood.name}</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                {grade.name}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Rate: ₹{rate}/{seafood.unit || 'KG'} • Avail: {availableKg.toFixed(2)} {seafood.unit || 'KG'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quantity Input & Total Preview */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="manual-quantity-input"
              className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              <Keyboard className="w-3.5 h-3.5 text-teal-600" />
              <span>Enter Quantity ({seafood.unit || 'KG'})</span>
            </label>
            <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
              Manual & Numpad
            </span>
          </div>

          {/* Interactive Manual / Numpad Input Field */}
          <div className="relative flex items-center justify-center">
            <div className="w-full relative flex items-center bg-white rounded-xl border-2 border-slate-300 hover:border-teal-400 focus-within:border-teal-600 focus-within:ring-4 focus-within:ring-teal-500/15 shadow-sm transition-all overflow-hidden">
              <input
                id="manual-quantity-input"
                ref={inputRef}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={quantity}
                onChange={handleManualInputChange}
                onKeyDown={handleInputKeyDown}
                placeholder="0"
                aria-label={`Quantity in ${seafood.unit || 'KG'}`}
                className="w-full text-center text-3xl sm:text-4xl font-extrabold font-tabular text-slate-900 tracking-tight bg-transparent py-2.5 px-12 focus:outline-none placeholder:text-slate-300"
              />
              <div className="absolute right-3.5 flex items-center pointer-events-none select-none">
                <span className="text-xs sm:text-sm font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md uppercase">
                  {seafood.unit || 'KG'}
                </span>
              </div>
            </div>
          </div>

          {/* Line Total preview */}
          <div className="mt-2.5 flex items-center justify-between px-3.5 py-2 rounded-xl bg-teal-50 border border-teal-200">
            <span className="text-xs font-semibold text-teal-900">Estimated Total:</span>
            <span className="text-base sm:text-lg font-bold font-tabular text-teal-800">₹{lineTotal}</span>
          </div>

          {exceedsStock && (
            <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Requested quantity exceeds currently recorded stock ({availableKg.toFixed(2)} kg).</span>
            </div>
          )}
        </div>

        {/* Quick Quantity Buttons */}
        <div className="p-3 bg-white border-b border-slate-100 flex flex-wrap gap-1.5 justify-center">
          {[0.5, 1.0, 2.0, 5.0, 10.0].map((preset) => (
            <button
              key={preset}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSetPreset(preset)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 border border-slate-200 text-xs font-bold text-slate-700 active:scale-95 transition-all"
            >
              {preset} kg
            </button>
          ))}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleQuickAdd(1.0)}
            className="px-2.5 py-1.5 rounded-lg bg-teal-100 hover:bg-teal-200 text-teal-900 border border-teal-300 text-xs font-bold active:scale-95 transition-all"
          >
            +1 kg
          </button>
        </div>

        {/* Touch-Friendly Numeric Keypad */}
        <div className="p-3 bg-slate-100 grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map((digit) => (
            <button
              key={digit}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleDigit(digit)}
              className="h-12 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-200 shadow-sm border border-slate-200/80 text-xl font-bold font-tabular text-slate-800 flex items-center justify-center select-none active:scale-95 transition-all"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleBackspace}
            className="h-12 rounded-xl bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-700 flex items-center justify-center font-bold select-none active:scale-95 transition-all"
            aria-label="Backspace"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Confirmation Footer */}
        <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-3 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 active:scale-95 transition-all"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={qtyNum <= 0}
            className="flex-1 py-3 rounded-xl bg-teal-700 hover:bg-teal-600 disabled:opacity-40 disabled:pointer-events-none text-white text-base font-bold shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Check className="w-5 h-5" />
            <span>Add to Cart (₹{lineTotal})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
