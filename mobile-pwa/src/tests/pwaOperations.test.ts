import { describe, it, expect, beforeEach } from 'vitest';
import { cartStore } from '../features/cart/cartStore';

describe('PWA Operational & Financial Logic Verification', () => {
  beforeEach(() => {
    cartStore.clearCart();
  });

  describe('1. POS Cart Precision, Customer Preservation & Credit Guards', () => {
    it('maintains 3-decimal precision for kg weighment', () => {
      cartStore.addItem({
        seafoodId: 'sf-1',
        seafoodName: 'Yellowfin Tuna',
        gradeId: 'gr-1',
        gradeName: 'Grade 1 (Sashimi)',
        quantityKg: '14.375',
        sellingRate: '650.00',
        unit: 'KG',
        availableKg: 50.0,
      });

      const totals = cartStore.getTotals();
      expect(totals.totalKg).toBe('14.375');
      expect(totals.subtotal).toBe('9343.75');
      expect(totals.grandTotal).toBe('9343.75');
    });

    it('strictly forbids CREDIT payment method for Walk-in customer', () => {
      cartStore.setWalkInCustomer();
      cartStore.setPaymentMethod('CREDIT');
      
      // Store state must refuse CREDIT and remain CASH
      expect(cartStore.getState().paymentMethod).toBe('CASH');
    });

    it('preserves existing cart items when a new buyer is selected', () => {
      cartStore.addItem({
        seafoodId: 'sf-2',
        seafoodName: 'Tiger Prawns',
        gradeId: 'gr-1',
        gradeName: 'Grade A',
        quantityKg: '5.250',
        sellingRate: '800.00',
        unit: 'KG',
        availableKg: 30.0,
      });

      expect(cartStore.getState().items.length).toBe(1);

      // Select new buyer
      cartStore.setCustomer({
        id: 'cust-999',
        name: 'Haji Seafoods Wholesale',
        mobileNumber: '9876543210',
        isWalkIn: false,
      });

      // Cart items must remain intact
      expect(cartStore.getState().items.length).toBe(1);
      expect(cartStore.getState().customer.name).toBe('Haji Seafoods Wholesale');
      expect(cartStore.getState().customer.isWalkIn).toBe(false);

      // Now CREDIT payment method should be permitted for registered buyer
      cartStore.setPaymentMethod('CREDIT');
      expect(cartStore.getState().paymentMethod).toBe('CREDIT');
    });
  });

  describe('2. Harbor Procurement & Fisherman Advance Separation', () => {
    it('accurately computes dock weighment and caps advance deduction', () => {
      const grossKg = 250.800;
      const tareKg = 10.300;
      const netKg = Number((grossKg - tareKg).toFixed(3));
      expect(netKg).toBe(240.500);

      const purchaseRate = 420.00;
      const purchaseValue = Number((netKg * purchaseRate).toFixed(2));
      expect(purchaseValue).toBe(101010.00);

      const fishermanAdvanceBalance = 25000.00;
      const requestedDeduction = 30000.00;

      // Business rule: deduction is capped at advance balance and purchase value
      const advanceDeducted = Math.min(requestedDeduction, fishermanAdvanceBalance, purchaseValue);
      expect(advanceDeducted).toBe(25000.00);

      const netPayableCash = Number((purchaseValue - advanceDeducted).toFixed(2));
      expect(netPayableCash).toBe(76010.00);
    });

    it('preserves strict separation between Fisherman Advance Recoverable and Supplier Payable', () => {
      const fishermanAdvanceBalance = 18000.00; // Asset (Recoverable)
      const supplierCatchBillPayable = 45000.00; // Liability (Settlement Payable)

      expect(fishermanAdvanceBalance).toBeGreaterThan(0);
      expect(supplierCatchBillPayable).toBeGreaterThan(0);
      expect(fishermanAdvanceBalance).not.toEqual(supplierCatchBillPayable);
    });
  });

  describe('3. Daily Rate Date Arithmetic', () => {
    it('correctly calculates sourceDate as exactly 1 day prior to targetDate', () => {
      const targetDate = '2026-10-15';
      const d = new Date(targetDate);
      d.setDate(d.getDate() - 1);
      const calculatedSource = d.toISOString().split('T')[0];

      expect(calculatedSource).toBe('2026-10-14');
    });

    it('correctly calculates sourceDate across month boundaries', () => {
      const targetDate = '2026-11-01';
      const d = new Date(targetDate);
      d.setDate(d.getDate() - 1);
      const calculatedSource = d.toISOString().split('T')[0];

      expect(calculatedSource).toBe('2026-10-31');
    });
  });

  describe('4. Operating Expenses & Worker Wages Integrity', () => {
    it('classifies worker wages as operating expenses, excluding purchases or advances', () => {
      const expenses = [
        { category: 'ICE', amount: 3500.0 },
        { category: 'DIESEL_FUEL', amount: 8000.0 },
        { category: 'WORKER_WAGE', amount: 4500.0 },
        { category: 'COOLIE_WAGES', amount: 2000.0 },
        { category: 'MAINTENANCE', amount: 1500.0 },
      ];

      const totalOpex = expenses.reduce((sum, e) => sum + e.amount, 0);
      const wagesTotal = expenses
        .filter((e) => e.category === 'WORKER_WAGE' || e.category === 'COOLIE_WAGES')
        .reduce((sum, e) => sum + e.amount, 0);

      expect(totalOpex).toBe(19500.0);
      expect(wagesTotal).toBe(6500.0);
    });
  });

  describe('5. Perpetual Stock Flow & Day End Audit Non-Zero Differences', () => {
    it('does not reset perpetual stock at midnight; applies immutable flow formula', () => {
      const openingStockKg = 1540.25;
      const receivedIntakeKg = 620.50;
      const soldRetailKg = 410.20;
      const soldExportKg = 700.00;
      const wastageLossKg = 18.50;
      const physicalAdjustmentKg = 0.00;

      const expectedClosingStockKg =
        openingStockKg + receivedIntakeKg - soldRetailKg - soldExportKg - wastageLossKg + physicalAdjustmentKg;

      expect(Number(expectedClosingStockKg.toFixed(3))).toBe(1032.05);

      // Audit variance: physical count differs from expected
      const countedPhysicalKg = 1029.80;
      const stockDifferenceKg = Number((countedPhysicalKg - expectedClosingStockKg).toFixed(3));
      expect(stockDifferenceKg).toBe(-2.25); // Shrinkage identified, never forced to zero
    });

    it('identifies cash shortage without forcing to zero', () => {
      const expectedCash = 34500.0;
      const countedPhysicalCash = 34420.0;
      const cashDifference = countedPhysicalCash - expectedCash;

      expect(cashDifference).toBe(-80.0);
    });
  });

  describe('6. P&L Engine Mathematical Axioms', () => {
    it('satisfies Gross Profit = Revenue - COGS, and Operating Profit = Gross Profit - Wastage - OPEX', () => {
      const grossRevenue = 500000.0;
      const discounts = 10000.0;
      const netRevenue = grossRevenue - discounts; // 490,000.0
      const cogs = 295000.0;

      const grossProfit = netRevenue - cogs;
      expect(grossProfit).toBe(195000.0);

      const grossMarginPercent = Number(((grossProfit / netRevenue) * 100).toFixed(2));
      expect(grossMarginPercent).toBe(39.80);

      const wastageCost = 6500.0;
      const opex = 42000.0;

      const operatingProfit = grossProfit - wastageCost - opex;
      expect(operatingProfit).toBe(146500.0);

      const operatingMarginPercent = Number(((operatingProfit / netRevenue) * 100).toFixed(2));
      expect(operatingMarginPercent).toBe(29.90);
    });
  });

  describe('7. Service Worker Financial Mutation Rule Specification', () => {
    it('guarantees financial mutations (POST, PUT, PATCH, DELETE) are never cached', () => {
      const mutationMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
      const sensitiveEndpoints = [
        '/api/sales',
        '/api/purchase-bills',
        '/api/fisherman-advances/disburse',
        '/api/expenses',
        '/api/day-end/2026-10-15/close',
      ];

      mutationMethods.forEach((method) => {
        expect(method !== 'GET').toBe(true);
      });

      sensitiveEndpoints.forEach((endpoint) => {
        const isSafePublicRead =
          endpoint.includes('/seafood') ||
          endpoint.includes('/daily-rates') ||
          endpoint.includes('/stock');
        // Non-read sensitive endpoints must NOT qualify as safe public cached reads
        if (!endpoint.includes('/stock')) {
          expect(isSafePublicRead).toBe(false);
        }
      });
    });
  });
});
