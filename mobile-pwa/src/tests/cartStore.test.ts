import { describe, it, expect, beforeEach } from 'vitest';
import { cartStore } from '../features/cart/cartStore';

describe('POS Cart Store & Business Rules', () => {
  beforeEach(() => {
    cartStore.clearCart();
  });

  it('initializes with empty items and default Walk-in customer', () => {
    const state = cartStore.getState();
    expect(state.items).toHaveLength(0);
    expect(state.customer.isWalkIn).toBe(true);
    expect(state.paymentMethod).toBe('CASH');
  });

  it('adds item and computes line total correctly', () => {
    cartStore.addItem({
      seafoodId: 'seafood-1',
      seafoodName: 'Seer Fish',
      gradeId: 'grade-a',
      gradeName: 'Grade A',
      availableKg: 50,
      quantityKg: '2.500',
      sellingRate: '800.00',
      unit: 'KG',
    });

    const state = cartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantityKg).toBe('2.500');
    expect(state.items[0].amount).toBe('2000.00'); // 2.5 * 800

    const totals = cartStore.getTotals();
    expect(totals.totalKg).toBe('2.500');
    expect(totals.subtotal).toBe('2000.00');
    expect(totals.grandTotal).toBe('2000.00');
  });

  it('aggregates quantity when same item and grade added again', () => {
    cartStore.addItem({
      seafoodId: 'seafood-1',
      seafoodName: 'Seer Fish',
      gradeId: 'grade-a',
      gradeName: 'Grade A',
      availableKg: 50,
      quantityKg: '1.000',
      sellingRate: '800.00',
      unit: 'KG',
    });

    cartStore.addItem({
      seafoodId: 'seafood-1',
      seafoodName: 'Seer Fish',
      gradeId: 'grade-a',
      gradeName: 'Grade A',
      availableKg: 50,
      quantityKg: '2.500',
      sellingRate: '800.00',
      unit: 'KG',
    });

    const state = cartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantityKg).toBe('3.500');
    expect(state.items[0].amount).toBe('2800.00');
  });

  it('applies discount accurately to grand total', () => {
    cartStore.addItem({
      seafoodId: 'seafood-1',
      seafoodName: 'Squid',
      gradeId: 'grade-a',
      gradeName: 'Grade A',
      availableKg: 100,
      quantityKg: '10.000',
      sellingRate: '400.00',
      unit: 'KG',
    });

    cartStore.setDiscount('150.00');
    const totals = cartStore.getTotals();
    expect(totals.subtotal).toBe('4000.00');
    expect(totals.discount).toBe('150.00');
    expect(totals.grandTotal).toBe('3850.00');
  });

  it('enforces Walk-in credit restriction (cannot select CREDIT for walk-in)', () => {
    cartStore.setWalkInCustomer();
    cartStore.setPaymentMethod('CREDIT');
    // Should remain CASH or reject CREDIT
    expect(cartStore.getState().paymentMethod).not.toBe('CREDIT');
  });

  it('allows CREDIT payment only for registered buyer', () => {
    cartStore.setCustomer({
      id: 'cust-123',
      name: 'Apex Seafood Traders',
      mobileNumber: '9876543210',
      isWalkIn: false,
    });
    cartStore.setPaymentMethod('CREDIT');
    expect(cartStore.getState().paymentMethod).toBe('CREDIT');
  });
});
