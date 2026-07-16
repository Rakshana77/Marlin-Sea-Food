import { supabase } from '../lib/supabase';

export const exportBillService = {
  async getAll() {
    const { data, error } = await supabase.from('export_bills').select('*, items:export_bill_items(*)');
    if (error) throw error;
    return data;
  },
  async create(bill, items) {
    const { data: billData, error: billError } = await supabase.from('export_bills').insert([bill]).select();
    if (billError) throw billError;

    const itemsWithBillId = items.map(item => ({
      export_bill_id: bill.id,
      seafood_id: item.seafoodId,
      weight: parseFloat(item.weight),
      rate: parseFloat(item.rate),
      amount: parseFloat(item.total)
    }));

    const { error: itemsError } = await supabase.from('export_bill_items').insert(itemsWithBillId);
    if (itemsError) throw itemsError;

    return billData[0];
  }
};
export const expenseService = {
  async getAll() {
    const { data, error } = await supabase.from('expenses').select('*');
    if (error) throw error;
    return data;
  },
  async create(expense) {
    const { data, error } = await supabase.from('expenses').insert([expense]).select();
    if (error) throw error;
    return data[0];
  }
};
