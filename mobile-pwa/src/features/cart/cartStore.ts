import { CartItem, CartCustomer, CartState } from './cartTypes';
import { PaymentMethod } from '../../types/models';

const DEFAULT_CUSTOMER: CartCustomer = {
  id: undefined,
  name: 'Walk-in Customer',
  mobileNumber: '',
  isWalkIn: true,
};

const initialCartState: CartState = {
  items: [],
  customer: DEFAULT_CUSTOMER,
  discount: '0.00',
  taxAmount: '0.00',
  paymentMethod: 'CASH',
  tenderedAmount: '',
  notes: '',
};

type Listener = (state: CartState) => void;

class CartStore {
  private state: CartState;
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): CartState {
    try {
      const saved = sessionStorage.getItem('marine_pos_cart');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore sessionStorage parsing errors
    }
    return { ...initialCartState };
  }

  private persistState() {
    try {
      sessionStorage.setItem('marine_pos_cart', JSON.stringify(this.state));
    } catch {
      // Ignore storage errors
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.state));
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState(): CartState {
    return this.state;
  }

  addItem(item: Omit<CartItem, 'id' | 'amount'>): void {
    const id = `${item.seafoodId}_${item.gradeId}`;
    const qty = parseFloat(item.quantityKg) || 0;
    const rate = parseFloat(item.sellingRate) || 0;
    const amount = (qty * rate).toFixed(2);

    const existingIndex = this.state.items.findIndex((i) => i.id === id);
    if (existingIndex >= 0) {
      // Update quantity of existing item
      const updatedItems = [...this.state.items];
      const newQty = (parseFloat(updatedItems[existingIndex].quantityKg) + qty).toFixed(3);
      const newAmount = (parseFloat(newQty) * rate).toFixed(2);
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        quantityKg: newQty,
        amount: newAmount,
      };
      this.state.items = updatedItems;
    } else {
      this.state.items = [
        ...this.state.items,
        {
          ...item,
          id,
          amount,
        },
      ];
    }
    this.persistState();
  }

  updateItemQuantity(id: string, quantityKg: string): void {
    const qtyNum = parseFloat(quantityKg);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      this.removeItem(id);
      return;
    }

    this.state.items = this.state.items.map((item) => {
      if (item.id === id) {
        const rate = parseFloat(item.sellingRate) || 0;
        const amount = (qtyNum * rate).toFixed(2);
        return {
          ...item,
          quantityKg: qtyNum.toFixed(3),
          amount,
        };
      }
      return item;
    });
    this.persistState();
  }

  removeItem(id: string): void {
    this.state.items = this.state.items.filter((item) => item.id !== id);
    this.persistState();
  }

  clearCart(): void {
    this.state = {
      ...initialCartState,
      customer: DEFAULT_CUSTOMER,
    };
    this.persistState();
  }

  setCustomer(customer: CartCustomer): void {
    this.state.customer = customer;
    // If walk-in customer and credit was chosen, reset to CASH
    if (customer.isWalkIn && this.state.paymentMethod === 'CREDIT') {
      this.state.paymentMethod = 'CASH';
    }
    this.persistState();
  }

  setWalkInCustomer(): void {
    this.setCustomer(DEFAULT_CUSTOMER);
  }

  setDiscount(discount: string): void {
    this.state.discount = discount;
    this.persistState();
  }

  setPaymentMethod(method: PaymentMethod): void {
    // Prevent CREDIT for walk-in buyers
    if (this.state.customer.isWalkIn && method === 'CREDIT') {
      return;
    }
    this.state.paymentMethod = method;
    this.persistState();
  }

  setTenderedAmount(amount: string): void {
    this.state.tenderedAmount = amount;
    this.persistState();
  }

  setNotes(notes: string): void {
    this.state.notes = notes;
    this.persistState();
  }

  // Calculated totals
  getTotals() {
    const totalKg = this.state.items.reduce(
      (sum, item) => sum + (parseFloat(item.quantityKg) || 0),
      0
    );
    const subtotal = this.state.items.reduce(
      (sum, item) => sum + (parseFloat(item.amount) || 0),
      0
    );
    const discount = parseFloat(this.state.discount) || 0;
    const grandTotal = Math.max(0, subtotal - discount);

    const tendered = parseFloat(this.state.tenderedAmount) || grandTotal;
    const change = Math.max(0, tendered - grandTotal);
    const outstanding = Math.max(0, grandTotal - tendered);

    return {
      totalKg: totalKg.toFixed(3),
      subtotal: subtotal.toFixed(2),
      discount: discount.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
      tendered: tendered.toFixed(2),
      change: change.toFixed(2),
      outstanding: outstanding.toFixed(2),
    };
  }
}

export const cartStore = new CartStore();
