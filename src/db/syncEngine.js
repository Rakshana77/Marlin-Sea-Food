import { localDb } from './dexieDb';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000/api';

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
};

// Process full offline queue to Cloud API server
export const triggerSyncEngine = async () => {
  if (!navigator.onLine) {
    console.log('SAMS Sync Engine: Device is currently offline.');
    return { success: false, status: 'Offline' };
  }

  const pendingItems = await localDb.syncQueue.toArray();
  if (pendingItems.length === 0) {
    return { success: true, status: 'Synced', count: 0 };
  }

  console.log(`SAMS Sync Engine: Found ${pendingItems.length} transactions waiting to sync.`);

  for (const item of pendingItems) {
    try {
      // API call to cloud sync engine
      await axios.post(`${BACKEND_URL}/sync`, {
        table: item.table,
        action: item.action,
        recordId: item.recordId,
        payload: item.payload,
        deviceId: 'device-client-001'
      });

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

// Hook listeners to track connectivity
export const initSyncScheduler = () => {
  window.addEventListener('online', triggerSyncEngine);
  // Periodically poll every 30 seconds to catch up
  setInterval(triggerSyncEngine, 30000);
};
