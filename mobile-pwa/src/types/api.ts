// API Request and Response interfaces matching backend contracts

export interface ApiResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  [key: string]: unknown;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: ApiResponseMeta;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  [key: string]: unknown;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[] | unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthSuccessData {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'WORKER';
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    permissions?: string[];
  };
}

export interface CreateSaleItemPayload {
  seafoodId: string;
  gradeId: string;
  quantityKg: string;
  sellingRate?: string;
  unitPrice?: string;
}

export interface CreateSalePayload {
  saleType?: 'WHOLESALE' | 'EXPORT';
  customerId?: string;
  saleDate: string; // YYYY-MM-DD
  items: CreateSaleItemPayload[];
  discount?: string;
  taxAmount?: string;
  payment?: {
    method: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CREDIT';
    amount?: string;
    referenceNumber?: string;
    notes?: string;
  };
  notes?: string | null;
  idempotencyKey?: string;
}

export interface CreateCustomerPayload {
  name: string;
  countryCode?: string;
  mobileNumber: string;
  email?: string | null;
  address?: string | null;
}

export interface RecordWastagePayload {
  seafoodId: string;
  gradeId: string;
  quantityKg: string;
  reason: string;
  notes?: string;
  date?: string;
}

export interface CreateExpensePayload {
  category: string;
  amount: string;
  paymentMethod: 'CASH' | 'UPI' | 'BANK_TRANSFER';
  recipient: string;
  reference?: string | null;
  notes?: string | null;
  expenseDate?: string;
}

export interface CreatePurchaseBillPayload {
  fishermanId: string;
  billDate: string;
  items: Array<{
    seafoodId: string;
    gradeId: string;
    quantityKg: string;
    purchaseRate?: string;
  }>;
  discount?: string;
  advanceDeducted?: string;
  payment?: {
    amount: string;
    method: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CREDIT';
    referenceNumber?: string;
    notes?: string;
  };
  notes?: string | null;
}

export interface CloseDayPayload {
  openingCash?: string;
  actualPhysicalCash?: string;
  actualPhysicalStockKg?: string;
  varianceReason?: string | null;
  notes?: string | null;
}

export interface CreateExportCompanyPayload {
  companyName: string;
  contactPerson?: string | null;
  countryCode?: string;
  mobileNumber?: string | null;
  email?: string | null;
  address?: string | null;
  taxNumber?: string | null;
}

export interface UpdateExportCompanyPayload extends Partial<CreateExportCompanyPayload> {
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password?: string;
  roleId: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  roleId?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface RecordAdjustmentPayload {
  seafoodId: string;
  gradeId: string;
  quantityKg: string | number;
  reason: string;
  notes?: string;
  date?: string;
}

export interface CreateDailyRatePayload {
  rateDate: string;
  seafoodId: string;
  gradeId: string;
  purchaseRate: string | number;
  sellingRate: string | number;
}

