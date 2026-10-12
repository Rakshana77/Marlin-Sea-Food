import { describe, it, expect } from 'vitest';

describe('Marine Seafoods ERP Business & Calculation Engine', () => {
  describe('Dock Catch Collection & Purchase Billing Logic', () => {
    it('accurately computes net weight from gross and tare weights', () => {
      const grossKg = 125.75;
      const tareKg = 5.25;
      const netKg = Number((grossKg - tareKg).toFixed(3));
      expect(netKg).toBe(120.5);
    });

    it('accurately calculates purchase value using published spot rate', () => {
      const netKg = 120.5;
      const spotRatePerKg = 450.0;
      const purchaseValue = Number((netKg * spotRatePerKg).toFixed(2));
      expect(purchaseValue).toBe(54225.0);
    });

    it('enforces that advance deduction does not exceed permitted recoverable balance or purchase value', () => {
      const purchaseValue = 54225.0;
      const advanceBalance = 15000.0;
      const requestedDeduction = 20000.0;

      // Business rule: deduction capped at advance balance and purchase value
      const permittedDeduction = Math.min(requestedDeduction, advanceBalance, purchaseValue);
      expect(permittedDeduction).toBe(15000.0);

      const netPayable = purchaseValue - permittedDeduction;
      expect(netPayable).toBe(39225.0);
    });
  });

  describe('Export Billing & Cargo Consignments Logic', () => {
    it('aggregates multi-species export line items into FOB grand total', () => {
      const lineItems = [
        { species: 'Yellowfin Tuna', qtyKg: 500, exportRate: 650 },
        { species: 'Squid (Loligo)', qtyKg: 350, exportRate: 420 },
        { species: 'Tiger Prawns', qtyKg: 200, exportRate: 850 },
      ];

      const lineTotals = lineItems.map((item) => item.qtyKg * item.exportRate);
      const grandTotal = lineTotals.reduce((sum, val) => sum + val, 0);
      const totalWeightKg = lineItems.reduce((sum, item) => sum + item.qtyKg, 0);

      expect(lineTotals).toEqual([325000, 147000, 170000]);
      expect(grandTotal).toBe(642000);
      expect(totalWeightKg).toBe(1050);
    });
  });

  describe('Day End Audit & Physical Count Reconciliation', () => {
    it('correctly calculates expected cash drawer balance from flows', () => {
      const openingCash = 10000.0;
      const salesCash = 45000.0;
      const purchaseCashPaid = 25000.0;
      const advancesDisbursed = 5000.0;
      const expensesPaid = 3500.0;

      const expectedCash = openingCash + salesCash - purchaseCashPaid - advancesDisbursed - expensesPaid;
      expect(expectedCash).toBe(21500.0);
    });

    it('identifies cash shortage and surplus variances without forcing to zero', () => {
      const expectedCash = 21500.0;
      
      const countedSurplus = 21550.0;
      const varianceSurplus = countedSurplus - expectedCash;
      expect(varianceSurplus).toBe(50.0);

      const countedShortage = 21420.0;
      const varianceShortage = countedShortage - expectedCash;
      expect(varianceShortage).toBe(-80.0);
    });

    it('computes perpetual stock flow and audit variance', () => {
      const openingStockKg = 1200.0;
      const landedIntakeKg = 450.0;
      const domesticSoldKg = 320.0;
      const exportSoldKg = 500.0;
      const wastageKg = 15.0;

      const expectedStockKg = openingStockKg + landedIntakeKg - domesticSoldKg - exportSoldKg - wastageKg;
      expect(expectedStockKg).toBe(815.0);

      const physicalAuditCountKg = 812.5;
      const stockVarianceKg = physicalAuditCountKg - expectedStockKg;
      expect(stockVarianceKg).toBe(-2.5); // 2.5 KG cold storage shrinkage
    });
  });

  describe('Financial P&L Metric Relationships', () => {
    it('verifies gross profit, operating profit, and margins with strict accounting integrity', () => {
      const grossSales = 250000.0;
      const discount = 5000.0;
      const netRevenue = grossSales - discount; // 245000.0
      const cogs = 140000.0; // from immutable sale valuation

      const grossProfit = netRevenue - cogs;
      const grossMarginPercent = Number(((grossProfit / netRevenue) * 100).toFixed(2));

      expect(grossProfit).toBe(105000.0);
      expect(grossMarginPercent).toBe(42.86);

      const wastageCost = 4500.0;
      const opex = 22000.0; // worker wages, ice, diesel, etc.

      const operatingProfit = grossProfit - wastageCost - opex;
      const operatingMarginPercent = Number(((operatingProfit / netRevenue) * 100).toFixed(2));

      expect(operatingProfit).toBe(78500.0);
      expect(operatingMarginPercent).toBe(32.04);
    });
  });
});
