// Simple IndexedDB and localStorage based offline engine.
// Pre-populates sample data for seamless demonstration of billing, inventory, settings, reports.

const DB_VERSION = 1;
const DB_NAME = 'seafood_sams_db';

const getLocalStorageItem = (key, defaultVal) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
};

const setLocalStorageItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Local storage error:", e);
  }
};

// Seed initial data if database is empty
const INITIAL_SEAFOOD = [
  { id: '1', name: 'Premium Squid', category: 'Squid', unit: 'kg', description: 'Fresh deep-sea squid, graded A.', status: 'Active', img: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=300&q=80' },
  { id: '2', name: 'Mud Crab', category: 'Crab', unit: 'kg', description: 'Large mangrove mud crabs.', status: 'Active', img: 'https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&w=300&q=80' },
  { id: '3', name: 'Tiger Prawn', category: 'Prawn', unit: 'kg', description: 'Jumbo tiger prawns, export grade.', status: 'Active', img: 'https://images.unsplash.com/photo-1559737607-3578909a49e0?auto=format&fit=crop&w=300&q=80' },
  { id: '4', name: 'King Fish', category: 'Fish', unit: 'kg', description: 'Premium fresh king fish.', status: 'Active', img: 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?auto=format&fit=crop&w=300&q=80' },
  { id: '5', name: 'Blue Lobster', category: 'Lobster', unit: 'kg', description: 'Rare Atlantic blue lobsters.', status: 'Active', img: 'https://images.unsplash.com/photo-1553618551-fba689030290?auto=format&fit=crop&w=300&q=80' },
];

const INITIAL_RATES = [
  { seafoodId: '1', name: 'Premium Squid', purchaseRate: 420, sellingRate: 470, date: '2026-07-02' },
  { seafoodId: '2', name: 'Mud Crab', purchaseRate: 620, sellingRate: 700, date: '2026-07-02' },
  { seafoodId: '3', name: 'Tiger Prawn', purchaseRate: 850, sellingRate: 980, date: '2026-07-02' },
  { seafoodId: '4', name: 'King Fish', purchaseRate: 550, sellingRate: 620, date: '2026-07-02' },
  { seafoodId: '5', name: 'Blue Lobster', purchaseRate: 1800, sellingRate: 2100, date: '2026-07-02' },
];

const INITIAL_CUSTOMERS = [
  { id: 'c1', name: 'Ananthan Fishery', village: 'Neendakara', phone: '+91 9845012345', bankDetails: 'SBI A/C: 10992384752', outstanding: 12000 },
  { id: 'c2', name: 'Mariyam Fishermen Group', village: 'Vizhinjam', phone: '+91 9928374829', bankDetails: 'HDFC A/C: 50100239485', outstanding: 4500 },
  { id: 'c3', name: 'Kadalora Cooperatives', village: 'Muttom', phone: '+91 8847293022', bankDetails: 'Canara A/C: 082394850239', outstanding: 0 },
];

const INITIAL_COMPANIES = [
  { id: 'co1', name: 'Global Marine Exports Inc', address: 'SEZ Zone, Cochin, Kerala', gst: '32AAAAA1111A1Z1', phone: '+91 484 223948', email: 'billing@globalmarine.com', contactPerson: 'Mr. Joseph Kurien', outstanding: -45000 },
  { id: 'co2', name: 'Pacific Seafood Traders', address: 'Port Road, Tuticorin, TN', gst: '33BBBBB2222B2Z2', phone: '+91 461 239485', email: 'imports@pacificseafood.com', contactPerson: 'Ms. Priya Raj', outstanding: -128000 },
];

const INITIAL_EXPENSES = [
  { id: 'e1', category: 'Ice', amount: 3500, date: '2026-07-02', remarks: '5 Blocks for preservation' },
  { id: 'e2', category: 'Transport', amount: 5000, date: '2026-07-02', remarks: 'Tempo charge to Cochin SEZ' },
  { id: 'e3', category: 'Labour', amount: 2400, date: '2026-07-02', remarks: '4 Loaders daily wage' },
  { id: 'e4', category: 'Fuel', amount: 1500, date: '2026-07-02', remarks: 'Generator backup fuel' },
];

// Seed sample historical bills
const INITIAL_PURCHASE_BILLS = [
  {
    id: 'PB-1001',
    customerName: 'Ananthan Fishery',
    customerId: 'c1',
    date: '2026-07-02',
    items: [
      { seafoodId: '1', name: 'Premium Squid', rate: 420, weight: 35, total: 14700 },
      { seafoodId: '3', name: 'Tiger Prawn', rate: 850, weight: 12, total: 10200 }
    ],
    grandTotal: 24900,
    paymentMode: 'Bank Transfer',
    remarks: 'Delivered in morning session.'
  },
  {
    id: 'PB-1002',
    customerName: 'Mariyam Fishermen Group',
    customerId: 'c2',
    date: '2026-07-02',
    items: [
      { seafoodId: '2', name: 'Mud Crab', rate: 620, weight: 20, total: 12400 }
    ],
    grandTotal: 12400,
    paymentMode: 'Cash',
    remarks: 'Immediate payment.'
  }
];

const INITIAL_EXPORT_BILLS = [
  {
    id: 'INV-5001',
    companyName: 'Global Marine Exports Inc',
    companyId: 'co1',
    date: '2026-07-02',
    items: [
      { seafoodId: '1', name: 'Premium Squid', rate: 470, weight: 35, total: 16450 },
      { seafoodId: '3', name: 'Tiger Prawn', rate: 980, weight: 12, total: 11760 }
    ],
    tax: 1410.5,
    transport: 1500,
    packing: 800,
    netTotal: 31920.5,
    remarks: 'Shipped via Cold Carrier'
  }
];

export const initDb = () => {
  if (!localStorage.getItem('sams_initialized')) {
    setLocalStorageItem('seafood', INITIAL_SEAFOOD);
    setLocalStorageItem('rates', INITIAL_RATES);
    setLocalStorageItem('customers', INITIAL_CUSTOMERS);
    setLocalStorageItem('companies', INITIAL_COMPANIES);
    setLocalStorageItem('expenses', INITIAL_EXPENSES);
    setLocalStorageItem('purchase_bills', INITIAL_PURCHASE_BILLS);
    setLocalStorageItem('export_bills', INITIAL_EXPORT_BILLS);
    setLocalStorageItem('settings', {
      businessName: 'Coastal Seafood Exporters',
      logo: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=100&h=100&q=80',
      gstNumber: '32ABCDE1234F1Z5',
      address: 'Harbor Road, Neendakara, Kollam, Kerala, Pin: 691582',
      phone: '+91 474 274001',
      whatsapp: '+91 9446012345',
      currency: '₹',
      theme: 'dark'
    });
    localStorage.setItem('sams_initialized', 'true');
  }
};

// Database operations with helper storage functions
export const db = {
  get: (key) => getLocalStorageItem(key, []),
  save: (key, data) => setLocalStorageItem(key, data),
  
  insert: (key, item) => {
    const list = db.get(key);
    const newItem = { ...item, id: item.id || Date.now().toString() };
    list.unshift(newItem);
    db.save(key, list);
    return newItem;
  },
  
  update: (key, id, updatedData) => {
    const list = db.get(key);
    const index = list.findIndex(item => item.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updatedData };
      db.save(key, list);
      return list[index];
    }
    return null;
  },

  delete: (key, id) => {
    const list = db.get(key);
    const filtered = list.filter(item => item.id !== id);
    db.save(key, filtered);
    return true;
  }
};
