// Marine Seafoods - Domain Models matching Backend Database

export type UserRole = 'ADMIN' | 'WORKER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  permissions?: string[];
}

export interface SeafoodCategory {
  id: string;
  name: string;
  code?: string;
  description?: string;
}

export interface SeafoodGrade {
  id: string;
  name: string;
  description?: string | null;
}

export interface Seafood {
  id: string;
  name: string;
  vernacularName?: string;
  scientificName?: string;
  unit: string;
  categoryId: string;
  status: 'ACTIVE' | 'INACTIVE';
  description?: string | null;
  category?: SeafoodCategory;
}

export interface DailyRate {
  id: string;
  rateDate: string;
  seafoodId: string;
  gradeId: string;
  purchaseRate: string;
  sellingRate: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  version?: number;
  seafood?: Seafood;
  grade?: SeafoodGrade;
}

export interface StockItem {
  id: string;
  seafoodId: string;
  gradeId: string;
  quantityKg: string;
  averageCost: string;
  totalValue: string;
  createdAt: string;
  updatedAt: string;
  seafood: Seafood;
  grade: SeafoodGrade;
}

export interface StockMovement {
  id: string;
  stockId: string;
  movementType: 'SALE' | 'PURCHASE' | 'EXPORT' | 'ADJUSTMENT' | 'RETURN' | 'WASTE';
  quantityKg: string;
  unitCost: string;
  totalCost: string;
  referenceType: string;
  referenceId?: string | null;
  notes?: string | null;
  createdAt: string;
  seafood?: Seafood;
  grade?: SeafoodGrade;
}

export interface Customer {
  id: string;
  name: string;
  countryCode: string;
  mobileNumber: string;
  email?: string | null;
  address?: string | null;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface Fisherman {
  id: string;
  name: string;
  countryCode: string;
  mobileNumber: string;
  advanceBalance?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface FishermanAdvance {
  id: string;
  advanceNumber: string;
  fishermanId: string;
  amount: string;
  recoveredAmount: string;
  remainingBalance: string;
  status: 'ACTIVE' | 'FULLY_RECOVERED' | 'WRITTEN_OFF' | 'CANCELLED';
  disbursementDate: string;
  paymentMethod: string;
  notes?: string | null;
  fisherman?: Fisherman;
}

export interface AdvanceLedgerEntry {
  id: string;
  entryDate: string;
  entryType: 'DISBURSEMENT' | 'RECOVERY_DEDUCTION' | 'RECOVERY_REVERSAL' | 'CASH_REPAYMENT' | 'WRITE_OFF';
  direction: 'DEBIT' | 'CREDIT';
  amount: string;
  balanceAfter: string;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
}

export type PaymentMethod = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CREDIT';
export type PaymentStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
export type SaleStatus = 'DRAFT' | 'COMPLETED' | 'CANCELLED';

export interface FormattedSaleItem {
  id?: string;
  seafoodId: string;
  gradeId: string;
  quantityKg: string;
  sellingRate: string;
  amount: string;
  costRate?: string;
  cogsAmount?: string;
  grossProfit?: string;
  seafood?: Seafood;
  grade?: SeafoodGrade;
}

export interface PaymentRecord {
  id?: string;
  amount: string;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  paymentDate: string;
  referenceNumber?: string | null;
  notes?: string | null;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  idempotencyKey?: string | null;
  saleDate: string;
  saleType: 'WHOLESALE' | 'EXPORT';
  customerId: string | null;
  customer: Customer | null;
  items: FormattedSaleItem[];
  totalKg: string;
  subtotal: string;
  discount: string;
  taxAmount: string;
  grandTotal: string;
  totalCogs?: string;
  totalGrossProfit?: string;
  paidAmount: string;
  outstandingAmount: string;
  changeAmount: string;
  paymentStatus: PaymentStatus;
  status: SaleStatus;
  notes?: string | null;
  exportCompanyId?: string | null;
  exportCompany?: ExportCompany | null;
  exportRef?: string | null;
  dispatchDate?: string | null;
  destinationPort?: string | null;
  payments: PaymentRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface ExportCompany {
  id: string;
  companyName: string;
  contactPerson?: string | null;
  countryCode: string;
  mobileNumber?: string | null;
  email?: string | null;
  address?: string | null;
  taxNumber?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string | null;
  permissions?: Permission[];
}

export interface Permission {
  id: string;
  name: string;
  module: string;
  description?: string | null;
}

export interface PnlSummary {
  period: {
    startDate: string;
    endDate: string;
    isSingleDay: boolean;
  };
  revenue: {
    grossSales: string;
    totalDiscount: string;
    netRevenue: string;
    totalKgSold: string;
    completedSalesCount: number;
  };
  cogs: {
    totalCogs: string;
    averageCogsPerKg: string;
  };
  grossProfit: {
    grossProfit: string;
    grossMarginPercent: string;
  };
  wastage: {
    totalWastageKg: string;
    wastageCost: string;
  };
  operatingExpenses: {
    totalExpenses: string;
    workerWages: string;
    otherExpenses: string;
    expensesCount: number;
  };
  operatingProfit: {
    operatingProfit: string;
    operatingMarginPercent: string;
  };
  dayEndStatus?: {
    isClosed: boolean;
    closingStatus?: 'OPEN' | 'CLOSED' | 'REOPENED' | null;
  };
}

export interface PnlBreakdowns {
  period: {
    startDate: string;
    endDate: string;
  };
  seafoodBreakdown: Array<{
    seafoodId: string;
    seafoodName: string;
    categoryName: string;
    totalKg: string;
    revenue: string;
    cogs: string;
    grossProfit: string;
    grossMarginPercent: string;
  }>;
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    totalKg: string;
    revenue: string;
    cogs: string;
    grossProfit: string;
    grossMarginPercent: string;
  }>;
  gradeBreakdown: Array<{
    gradeId: string;
    gradeName: string;
    totalKg: string;
    revenue: string;
    cogs: string;
    grossProfit: string;
    grossMarginPercent: string;
  }>;
  buyerBreakdown: Array<{
    customerId: string;
    customerName: string;
    totalKg: string;
    revenue: string;
    grossProfit: string;
  }>;
  exportBreakdown: Array<{
    exportCompanyId: string;
    companyName: string;
    totalKg: string;
    revenue: string;
    grossProfit: string;
  }>;
  expenseCategoryBreakdown: Array<{
    category: string;
    totalAmount: string;
    count: number;
  }>;
}

export interface PurchaseBillItem {
  id?: string;
  seafoodId: string;
  gradeId: string;
  quantityKg: string;
  purchaseRate: string;
  amount: string;
  seafood?: Seafood;
  grade?: SeafoodGrade;
}

export interface PurchaseBill {
  id: string;
  billNumber: string;
  billDate: string;
  fishermanId: string;
  fisherman: Fisherman;
  items: PurchaseBillItem[];
  totalKg: string;
  subtotal: string;
  discount: string;
  advanceDeducted: string;
  grandTotal: string;
  paidAmount: string;
  outstandingAmount: string;
  status: 'DRAFT' | 'POSTED' | 'CANCELLED';
  paymentStatus: PaymentStatus;
  payments: PaymentRecord[];
  notes?: string | null;
  createdAt: string;
}

export interface Expense {
  id: string;
  expenseNumber: string;
  expenseDate: string;
  category: string;
  amount: string;
  paymentMethod: string;
  recipient: string;
  reference?: string | null;
  notes?: string | null;
  status: 'RECORDED' | 'CANCELLED';
  createdAt: string;
}

export interface DayEndPreview {
  businessDate: string;
  isClosed: boolean;
  status?: 'OPEN' | 'CLOSED' | 'REOPENED';
  reconciliationStatus?: 'RECONCILED' | 'DIFFERENCE_EXISTS';
  storedClosing?: any | null;
  closedAt?: string | null;
  stockSummary?: {
    openingStockKg: string;
    totalReceivedKg: string;
    totalSoldKg: string;
    totalWastageKg: string;
    totalAdjustedKg: string;
    expectedClosingStockKg: string;
    actualPhysicalStockKg: string;
    stockVarianceKg: string;
    isStockReconciled: boolean;
    items?: Array<{
      seafoodId: string;
      seafoodName: string;
      gradeId: string;
      gradeName: string;
      openingKg: string;
      receivedKg: string;
      soldKg: string;
      wastageKg: string;
      adjustedKg: string;
      expectedClosingKg: string;
      actualPhysicalKg: string;
      varianceKg: string;
    }>;
  };
  cashSummary?: {
    openingCash: string;
    cashReceivedSales: string;
    cashReceivedRepayments: string;
    totalCashInflows: string;
    cashPaidPurchases: string;
    cashPaidAdvances: string;
    cashPaidExpenses: string;
    totalCashOutflows: string;
    expectedClosingCash: string;
    actualPhysicalCash: string;
    cashVariance: string;
    isCashReconciled: boolean;
  };
  collectionsSummary?: {
    totalBills: number;
    cancelledBills: number;
    grossTotal: string;
    advanceDeducted: string;
    netPayableCash: string;
    cashPaid: string;
    upiPaid: string;
    bankPaid: string;
    outstandingSupplierPayable: string;
  };
  salesSummary?: {
    totalSales: number;
    cancelledSales: number;
    grossSales: string;
    domesticSales: string;
    exportSales: string;
    cashCollected: string;
    upiCollected: string;
    bankCollected: string;
    buyerOutstanding: string;
    totalCogs: string;
    grossProfit: string;
  };
  advancesSummary?: {
    openingAdvanceBalance: string;
    newAdvancesDisbursed: string;
    advancesRecovered: string;
    cashRepayments: string;
    writeOffs: string;
    reversals: string;
    closingAdvanceBalance: string;
  };
  wastageSummary?: {
    totalWastageKg: string;
    totalWastageCost: string;
    eventCount: number;
  };
  expensesSummary?: {
    totalOpex: string;
    cashOpex: string;
    upiOpex: string;
    bankOpex: string;
    workerWages: string;
    otherOpex: string;
    byCategory: Array<{
      category: string;
      count: number;
      amount: string;
    }>;
  };
  // Normalized legacy / view helper properties
  sales: {
    totalSalesCount: number;
    totalSalesAmount: string;
    totalSalesKg: string;
  };
  purchases: {
    totalPurchasesCount: number;
    totalPurchasesAmount: string;
    totalPurchasesKg: string;
  };
  wastage: {
    totalWastageKg: string;
    estimatedWastageCost: string;
  };
  expenses: {
    totalExpensesCount: number;
    totalExpensesAmount: string;
  };
  advances: {
    totalDisbursed: string;
    totalRecovered: string;
  };
  cash: {
    openingCash: string;
    cashReceivedSales: string;
    cashPaidPurchases: string;
    cashPaidAdvances: string;
    cashPaidExpenses: string;
    expectedCash: string;
  };
  stock: {
    openingStockKg: string;
    totalReceivedKg: string;
    totalSoldKg: string;
    totalWastageKg: string;
    totalAdjustedKg: string;
    expectedClosingStockKg: string;
  };
}
