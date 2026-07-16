import { supabase } from '../lib/supabase';

export const purchaseBillService = {
  async getAll() {
    const { data, error } = await supabase.from('purchase_bills').select('*, items:purchase_bill_items(*)');
    if (error) throw error;
    return data;
  },
  async create(bill, items) {
    const { data: billData, error: billError } = await supabase.from('purchase_bills').insert([bill]).select();
    if (billError) throw billError;

    const itemsWithBillId = items.map(item => ({
      purchase_bill_id: bill.id,
      seafood_id: item.seafoodId,
      weight: parseFloat(item.weight),
      rate: parseFloat(item.rate),
      amount: parseFloat(item.total)
    }));

    const { error: itemsError } = await supabase.from('purchase_bill_items').insert(itemsWithBillId);
    if (itemsError) throw itemsError;

    return billData[0];
  }
};
