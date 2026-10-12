import { Customer, PaymentMethod, Seafood, SeafoodGrade } from '../../types/models';

export interface CartItem {
  id: string; // unique item id e.g. `${seafoodId}_${gradeId}`
  seafoodId: string;
  seafoodName: string;
  categoryName?: string;
  unit: string;
  gradeId: string;
  gradeName: string;
  availableKg: number;
  quantityKg: string;
  sellingRate: string;
  amount: string;
}

export interface CartCustomer {
  id?: string;
  name: string;
  mobileNumber?: string;
  countryCode?: string;
  isWalkIn: boolean;
}

export interface CartState {
  items: CartItem[];
  customer: CartCustomer;
  discount: string;
  taxAmount: string;
  paymentMethod: PaymentMethod;
  tenderedAmount: string;
  notes: string;
}
