import Dexie from 'dexie';

// Initialize SAMS Local IndexedDB using Dexie
export const localDb = new Dexie('SAMS_Offline_Database');

localDb.version(1).stores({
  seafood: 'id, name, category, unit, status, syncStatus',
  rates: 'seafoodId, name, purchaseRate, sellingRate, date, syncStatus',
  customers: 'id, name, village, phone, bankDetails, outstanding, syncStatus',
  companies: 'id, name, address, gst, phone, email, contactPerson, outstanding, syncStatus',
  purchaseBills: 'id, customerName, customerId, date, grandTotal, paymentMode, syncStatus',
  exportBills: 'id, companyName, companyId, date, netTotal, syncStatus',
  expenses: 'id, category, amount, remarks, date, syncStatus',
  settings: 'key, businessName, logo, gstNumber, address, phone, whatsapp, currency, syncStatus',
  notifications: 'id, type, message, timestamp, read',
  auditLogs: 'id, action, userId, details, timestamp, syncStatus',
  syncQueue: 'id, table, recordId, action, payload, createdAt, attempts'
});

// Seed data helper if the indexeddb store is empty
export const seedDexie = async () => {
  const seafoodCount = await localDb.seafood.count();
  if (seafoodCount === 0) {
    // Seafood items
    await localDb.seafood.bulkAdd([
      { id: '1', name: 'Premium Squid', category: 'Squid', unit: 'kg', description: 'Fresh deep-sea squid, graded A.', status: 'Active', img: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=300&q=80', syncStatus: 'Completed' },
      { id: '2', name: 'Mud Crab', category: 'Crab', unit: 'kg', description: 'Large mangrove mud crabs.', status: 'Active', img: 'https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&w=300&q=80', syncStatus: 'Completed' },
      { id: '3', name: 'Tiger Prawn', category: 'Prawn', unit: 'kg', description: 'Jumbo tiger prawns, export grade.', status: 'Active', img: 'https://images.unsplash.com/photo-1559737607-3578909a49e0?auto=format&fit=crop&w=300&q=80', syncStatus: 'Completed' },
      { id: '4', name: 'King Fish', category: 'Fish', unit: 'kg', description: 'Premium fresh king fish.', status: 'Active', img: 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?auto=format&fit=crop&w=300&q=80', syncStatus: 'Completed' },
      { id: '5', name: 'Blue Lobster', category: 'Lobster', unit: 'kg', description: 'Rare Atlantic blue lobsters.', status: 'Active', img: 'https://images.unsplash.com/photo-1553618551-fba689030290?auto=format&fit=crop&w=300&q=80', syncStatus: 'Completed' },
    ]);

    // Rates
    await localDb.rates.bulkAdd([
      { seafoodId: '1', name: 'Premium Squid', purchaseRate: 420, sellingRate: 470, date: '2026-07-02', syncStatus: 'Completed' },
      { seafoodId: '2', name: 'Mud Crab', purchaseRate: 620, sellingRate: 700, date: '2026-07-02', syncStatus: 'Completed' },
      { seafoodId: '3', name: 'Tiger Prawn', purchaseRate: 850, sellingRate: 980, date: '2026-07-02', syncStatus: 'Completed' },
      { seafoodId: '4', name: 'King Fish', purchaseRate: 550, sellingRate: 620, date: '2026-07-02', syncStatus: 'Completed' },
      { seafoodId: '5', name: 'Blue Lobster', purchaseRate: 1800, sellingRate: 2100, date: '2026-07-02', syncStatus: 'Completed' },
    ]);

    // Customers (Fishermen)
    await localDb.customers.bulkAdd([
      { id: 'c1', name: 'Ananthan Fishery', village: 'Neendakara', phone: '+919446012345', bankDetails: 'SBI A/C: 10992384752', outstanding: 12000, syncStatus: 'Completed' },
      { id: 'c2', name: 'Mariyam Fishermen Group', village: 'Vizhinjam', phone: '+919928374829', bankDetails: 'HDFC A/C: 50100239485', outstanding: 4500, syncStatus: 'Completed' },
      { id: 'c3', name: 'Kadalora Cooperatives', village: 'Muttom', phone: '+918847293022', bankDetails: 'Canara A/C: 082394850239', outstanding: 0, syncStatus: 'Completed' },
    ]);

    // Export companies
    await localDb.companies.bulkAdd([
      { id: 'co1', name: 'Global Marine Exports Inc', address: 'SEZ Zone, Cochin, Kerala', gst: '32AAAAA1111A1Z1', phone: '+91484223948', email: 'billing@globalmarine.com', contactPerson: 'Mr. Joseph Kurien', outstanding: -45000, syncStatus: 'Completed' },
      { id: 'co2', name: 'Pacific Seafood Traders', address: 'Port Road, Tuticorin, TN', gst: '33BBBBB2222B2Z2', phone: '+91461239485', email: 'imports@pacificseafood.com', contactPerson: 'Ms. Priya Raj', outstanding: -128000, syncStatus: 'Completed' },
    ]);

    // Core Settings
    await localDb.settings.put({
      key: 'config',
      businessName: 'Coastal Seafood Exporters',
      logo: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=100&h=100&q=80',
      gstNumber: '32ABCDE1234F1Z5',
      address: 'Harbor Road, Neendakara, Kollam, Kerala, Pin: 691582',
      phone: '+91474274001',
      whatsapp: '+919446012345',
      currency: '₹',
      syncStatus: 'Completed'
    });
  }
};
