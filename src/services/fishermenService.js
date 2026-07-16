import { supabase } from '../lib/supabase';

export const fishermenService = {
  async getAll() {
    const { data, error } = await supabase.from('fishermen').select('*');
    if (error) throw error;
    return data;
  },
  async getById(id) {
    const { data, error } = await supabase.from('fishermen').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },
  async create(fisherman) {
    const { data, error } = await supabase.from('fishermen').insert([fisherman]).select();
    if (error) throw error;
    return data[0];
  },
  async update(id, updates) {
    const { data, error } = await supabase.from('fishermen').update(updates).eq('id', id).select();
    if (error) throw error;
    return data[0];
  },
  async delete(id) {
    const { error } = await supabase.from('fishermen').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
};
