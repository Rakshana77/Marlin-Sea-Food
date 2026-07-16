import { supabase } from '../lib/supabase';

// Upload invoice PDF generator helper
export const storageService = {
  async uploadInvoicePdf(fileName, fileBlob) {
    const { data, error } = await supabase.storage
      .from('invoice-pdfs')
      .upload(fileName, fileBlob, {
        contentType: 'application/pdf',
        upsert: true
      });
    if (error) throw error;
    
    // Get public URL link
    const { data: urlData } = supabase.storage
      .from('invoice-pdfs')
      .getPublicUrl(fileName);
      
    return urlData.publicUrl;
  },
  
  async uploadSeafoodImage(fileName, fileBlob) {
    const { data, error } = await supabase.storage
      .from('seafood-images')
      .upload(fileName, fileBlob, {
        upsert: true
      });
    if (error) throw error;
    
    const { data: urlData } = supabase.storage
      .from('seafood-images')
      .getPublicUrl(fileName);
      
    return urlData.publicUrl;
  }
};
