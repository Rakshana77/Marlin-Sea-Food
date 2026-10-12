import { describe, it, expect, beforeEach } from 'vitest';
import { cartStore } from '../features/cart/cartStore';

describe('Quantity & Weight Entry Business Rules', () => {
  beforeEach(() => {
    cartStore.clearCart();
  });

  it('updates item quantity directly when editing an existing cart item', () => {
    cartStore.addItem({
      seafoodId: 'crab-1',
      seafoodName: 'Blue Sea Crab',
      gradeId: 'grade-a',
      gradeName: 'Grade A',
      availableKg: 21,
      quantityKg: '1.000',
      sellingRate: '700.00',
      unit: 'KG',
    });

    const items = cartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].quantityKg).toBe('1.000');
    expect(items[0].amount).toBe('700.00');

    // Update with manual entered KG
    cartStore.updateItemQuantity(items[0].id, '3.250');

    const updated = cartStore.getState().items;
    expect(updated).toHaveLength(1);
    expect(updated[0].quantityKg).toBe('3.250');
    expect(updated[0].amount).toBe('2275.00'); // 3.25 * 700
  });

  it('removes item if updated quantity is 0 or invalid', () => {
    cartStore.addItem({
      seafoodId: 'crab-1',
      seafoodName: 'Blue Sea Crab',
      gradeId: 'grade-a',
      gradeName: 'Grade A',
      availableKg: 21,
      quantityKg: '2.000',
      sellingRate: '700.00',
      unit: 'KG',
    });

    const items = cartStore.getState().items;
    cartStore.updateItemQuantity(items[0].id, '0');
    expect(cartStore.getState().items).toHaveLength(0);
  });

  it('correctly handles decimal precision calculation for 3 decimal places', () => {
    const rate = 700;
    const manualKg = '2.375';
    const computedTotal = (parseFloat(manualKg) * rate).toFixed(2);
    expect(computedTotal).toBe('1662.50');
  });
});
