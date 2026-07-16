import { localDb } from './dexieDb';
import { supabase } from '../lib/supabase';

// Registers pending queue operations
export const queueSyncItem = async (table, recordId, action, payload) => {
  const syncQueueItem = {
    id: Date.now().toString(),
    table,
    recordId,
    action,
    payload: JSON.parse(JSON.stringify(payload)),
    createdAt: new Date().toISOString(),
    attempts: 0
  };
  await localDb.syncQueue.add(syncQueueItem);
  
  // Try immediate sync in background if online
  if (navigator.onLine) {
    triggerSyncEngine().catch(err => console.log('Immediate sync background execution deferred:', err.message));
  }
};

// Process full offline queue directly to Supabase client PostgreSQL Tables
export const triggerSyncEngine = async () => {
  if (!navigator.onLine) {
    console.log('Marlin Sea Food Sync Engine: Device is currently offline.');
    return { success: false, status: 'Offline' };
  }

  const pendingItems = await localDb.syncQueue.toArray();
  if (pendingItems.length === 0) {
    return { success: true, status: 'Synced', count: 0 };
  }

  console.log(`Marlin Sea Food Sync Engine: Found ${pendingItems.length} transactions waiting to sync.`);

  for (const item of pendingItems) {
    try {
      const payload = item.payload;
      const targetTable = mapLocalTableToSupabase(item.table);

      if (item.table === 'settings') {
        // Skip local settings config sync
        await localDb.syncQueue.delete(item.id);
        continue;
      }

      if (item.action === 'delete') {
        const { error } = await supabase.from(targetTable).delete().eq('id', item.recordId);
        if (error) throw error;
      } else {
        // Upsert operation to sync to Supabase table
        const pgData = formatPayloadForPostgres(item.table, payload);
        const { error } = await supabase.from(targetTable).upsert(pgData);
        if (error) throw error;
        
        // Handle child items if purchase bill or export bill
        if (item.table === 'purchaseBills' && payload.items) {
          const itemsPayload = payload.items.map(bi => ({
            purchase_bill_id: payload.id,
            seafood_id: bi.seafoodId,
            weight: parseFloat(bi.weight),
            rate: parseFloat(bi.rate),
            amount: parseFloat(bi.total)
          }));
          const { error: childError } = await supabase.from('purchase_bill_items').upsert(itemsPayload);
          if (childError) throw childError;
        } else if (item.table === 'exportBills' && payload.items) {
          const itemsPayload = payload.items.map(bi => ({
            export_bill_id: payload.id,
            seafood_id: bi.seafoodId,
            weight: parseFloat(bi.weight),
            rate: parseFloat(bi.rate),
            amount: parseFloat(bi.total)
          }));
          const { error: childError } = await supabase.from('export_bill_items').upsert(itemsPayload);
          if (childError) throw childError;
        }
      }

      // On successful sync, delete item from local queue
      await localDb.syncQueue.delete(item.id);

      // Update record status in local store to completed
      if (localDb[item.table]) {
        await localDb[item.table].update(item.recordId, { syncStatus: 'Completed' });
      }
    } catch (error) {
      console.error(`Sync error on queue item ${item.id}:`, error.message);
      // Increment attempts
      await localDb.syncQueue.update(item.id, { attempts: item.attempts + 1 });
    }
  }

  const updatedCount = await localDb.syncQueue.count();
  return { 
    success: updatedCount === 0, 
    status: updatedCount === 0 ? 'Synced' : 'Failed Items remaining', 
    count: updatedCount 
  };
};

const mapLocalTableToSupabase = (localTable) => {
  const mapping = {
    seafood: 'seafood_master',
    rates: 'daily_rates',
    customers: 'fishermen',
    companies: 'export_companies',
    purchaseBills: 'purchase_bills',
    exportBills: 'export_bills',
    expenses: 'expenses'
  };
  return mapping[localTable] || localTable;
};

const formatPayloadForPostgres = (table, payload) => {
  const clone = { ...payload };
  delete clone.syncStatus;
  
  if (table === 'customers') {
    return {
      id: clone.id,
      name: clone.name,
      country_code: clone.countryCode,
      mobile: clone.mobileNumber,
      whatsapp: clone.whatsappNumber,
      address: clone.village || 'N/A',
      notes: clone.bankDetails || 'N/A'
    };
  }
  
  if (table === 'companies') {
    return {
      id: clone.id,
      company_name: clone.name,
      contact_person: clone.contactPerson,
      country_code: clone.countryCode,
      mobile: clone.mobileNumber,
      whatsapp: clone.whatsappNumber,
      email: clone.email,
      address: clone.address
    };
  }

  if (table === 'rates') {
    return {
      seafood_id: clone.seafoodId,
      purchase_rate: parseFloat(clone.purchaseRate),
      selling_rate: parseFloat(clone.sellingRate),
      effective_date: clone.date
    };
  }

  if (table === 'seafood') {
    return {
      id: clone.id,
      name: clone.name,
      unit: clone.unit,
      category: clone.category,
      status: clone.status
    };
  }

  if (table === 'purchaseBills') {
    return {
      id: clone.id,
      bill_no: clone.id,
      fisherman_id: clone.customerId,
      bill_date: clone.date,
      subtotal: parseFloat(clone.grandTotal),
      discount: 0,
      grand_total: parseFloat(clone.grandTotal),
      payment_method: clone.paymentMode,
      status: 'Completed'
    };
  }

  if (table === 'exportBills') {
    return {
      id: clone.id,
      invoice_no: clone.id,
      company_id: clone.companyId,
      invoice_date: clone.date,
      subtotal: parseFloat(clone.subTotal),
      discount: 0,
      grand_total: parseFloat(clone.netTotal),
      status: 'Completed'
    };
  }

  if (table === 'expenses') {
    return {
      id: clone.id,
      category: clone.category,
      amount: parseFloat(clone.amount),
      description: clone.remarks,
      expense_date: clone.date
    };
  }

  return clone;
};

// Hook listeners to track connectivity
export const initSyncScheduler = () => {
  window.addEventListener('online', triggerSyncEngine);
  // Periodically poll every 30 seconds to catch up
  setInterval(triggerSyncEngine, 30000);
};
