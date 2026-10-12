import { useState, useEffect } from 'react';
import { cartStore } from '../features/cart/cartStore';
import { CartState } from '../features/cart/cartTypes';

export function useCart() {
  const [state, setState] = useState<CartState>(() => cartStore.getState());

  useEffect(() => {
    return cartStore.subscribe((newState) => {
      setState({ ...newState });
    });
  }, []);

  return {
    items: state.items,
    customer: state.customer,
    discount: state.discount,
    paymentMethod: state.paymentMethod,
    tenderedAmount: state.tenderedAmount,
    notes: state.notes,
    totals: cartStore.getTotals(),
    addItem: (item: Parameters<typeof cartStore.addItem>[0]) => cartStore.addItem(item),
    updateItemQuantity: (id: string, qty: string) => cartStore.updateItemQuantity(id, qty),
    removeItem: (id: string) => cartStore.removeItem(id),
    clearCart: () => cartStore.clearCart(),
    setCustomer: (customer: Parameters<typeof cartStore.setCustomer>[0]) => cartStore.setCustomer(customer),
    setWalkInCustomer: () => cartStore.setWalkInCustomer(),
    setDiscount: (discount: string) => cartStore.setDiscount(discount),
    setPaymentMethod: (method: Parameters<typeof cartStore.setPaymentMethod>[0]) => cartStore.setPaymentMethod(method),
    setTenderedAmount: (amount: string) => cartStore.setTenderedAmount(amount),
    setNotes: (notes: string) => cartStore.setNotes(notes),
  };
}
