import { supabase } from '../lib/supabase';

export const seafoodService = {
  async getAll() {
    const { data, error } = await supabase.from('seafood_master').select('*');
    if (error) throw error;
    return data;
  },
  async create(item) {
    const { data, error } = await supabase.from('seafood_master').insert([item]).select();
    if (error) throw error;
    return data[0];
  },
  async update(id, updates) {
    const { data, error } = await supabase.from('seafood_master').update(updates).eq('id', id).select();
    if (error) throw error;
    return data[0];
  },
  async delete(id) {
    const { error } = await supabase.from('seafood_master').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
};
export const dailyRatesService = {
  async getAll() {
    const { data, error } = await supabase.from('daily_rates').select('*');
    if (error) throw error;
    return data;
  },
  async updateRate(rate) {
    const { data, error } = await supabase.from('daily_rates').upsert(rate).select();
    if (error) throw error;
    return data[0];
  }
};
