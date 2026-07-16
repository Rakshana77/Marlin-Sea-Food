import { supabase } from '../lib/supabase';

export const companiesService = {
  async getAll() {
    const { data, error } = await supabase.from('export_companies').select('*');
    if (error) throw error;
    return data;
  },
  async create(company) {
    const { data, error } = await supabase.from('export_companies').insert([company]).select();
    if (error) throw error;
    return data[0];
  },
  async update(id, updates) {
    const { data, error } = await supabase.from('export_companies').update(updates).eq('id', id).select();
    if (error) throw error;
    return data[0];
  },
  async delete(id) {
    const { error } = await supabase.from('export_companies').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
};
