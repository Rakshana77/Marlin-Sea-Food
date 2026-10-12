// Marlin Sea Food ERP Central Reactive Store
// Single source of truth for application state

class Store {
  constructor() {
    this.subscribers = [];
    
    // Core Operational State
    this.state = {
      currentRoute: 'dashboard',
      routeParams: {},
      selectedFishermanId: null,
      
      // Shift & Terminal Metadata
      date: '07 Sep 2026',
      dateIso: '2026-09-07',
      shift: 'Dock Shift AM',
      terminal: 'Wharf Station #WS-409',
      cloudSync: 'LIVE',
      isDayClosed: false,
      
      // Authentication & Role
      authToken: localStorage.getItem('marine_erp_token') || 'demo_admin_jwt_token',
      user: (() => {
        try {
          return JSON.parse(localStorage.getItem('marine_erp_user') || 'null') || {
            name: 'Admin Wharf',
            email: 'admin@marineseafoods.com',
            role: 'ADMIN',
            station: 'Terminal Gate 04',
            avatar: 'person'
          };
        } catch {
          return {
            name: 'Admin Wharf',
            email: 'admin@marineseafoods.com',
            role: 'ADMIN',
            station: 'Terminal Gate 04',
            avatar: 'person'
          };
        }
      })(),
      isAuthenticated: true,
      
      notifications: [
        { id: 1, title: 'Cold Storage High Load', text: 'Pre-cooling Bay #2 approaching 82% capacity', time: '10m ago', unread: true },
        { id: 2, title: 'Morning Auction Live', text: 'Dock spot rates locked for 07 Sep AM Shift', time: '45m ago', unread: true },
        { id: 3, title: 'Apex Consignment Clearance', text: 'Reefer container #C-409 dispatches at 11:00 AM', time: '1h ago', unread: true }
      ],
      
      // Seafood Catalog Master
      seafoodCatalog: [
        {
          id: 'squid',
          name: 'Squid (Loligo)',
          category: 'Squid & Cuttlefish',
          scientific: 'Loligo duvauceli',
          vernacular: 'Kanawa / Oosi Kanawa',
          gradeA: 420,
          gradeB: 380,
          gradeC: 310,
          exportRate: 490,
          unit: 'KG',
          stock: 125.0,
          status: 'Healthy',
          image: 'https://images.unsplash.com/photo-1545671913-b89ac1b4ac10?auto=format&fit=crop&w=400&q=80'
        },
        {
          id: 'crab',
          name: 'Blue Swimming Crab',
          category: 'Crab',
          scientific: 'Portunus pelagicus',
          vernacular: 'Neela Nandu / Kavalai',
          gradeA: 620,
          gradeB: 540,
          gradeC: 420,
          exportRate: 710,
          unit: 'KG',
          stock: 85.0,
          status: 'Low Stock',
          image: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?auto=format&fit=crop&w=400&q=80'
        },
        {
          id: 'prawn',
          name: 'Tiger Prawn (10/20)',
          category: 'Prawn',
          scientific: 'Penaeus monodon',
          vernacular: 'Kara Eral / Tiger Era',
          gradeA: 750,
          gradeB: 680,
          gradeC: 550,
          exportRate: 880,
          unit: 'KG',
          stock: 210.0,
          status: 'Healthy',
          image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=400&q=80'
        },
        {
          id: 'kingfish',
          name: 'Kingfish (Surmai / Seer)',
          category: 'Fish',
          scientific: 'Scomberomorus commerson',
          vernacular: 'Vanjaram / Neymeen',
          gradeA: 780,
          gradeB: 710,
          gradeC: 600,
          exportRate: 920,
          unit: 'KG',
          stock: 68.0,
          status: 'Healthy',
          image: 'https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&w=400&q=80'
        },
        {
          id: 'tuna',
          name: 'Yellowfin Tuna (Saku)',
          category: 'Fish',
          scientific: 'Thunnus albacares',
          vernacular: 'Soorai / Kera',
          gradeA: 340,
          gradeB: 290,
          gradeC: 220,
          exportRate: 410,
          unit: 'KG',
          stock: 140.0,
          status: 'Healthy',
          image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=400&q=80'
        },
        {
          id: 'lobster',
          name: 'Rock Lobster',
          category: 'Lobster',
          scientific: 'Panulirus homarus',
          vernacular: 'Singi Eral',
          gradeA: 1450,
          gradeB: 1250,
          gradeC: 980,
          exportRate: 1750,
          unit: 'KG',
          stock: 32.0,
          status: 'Low Stock',
          image: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?auto=format&fit=crop&w=400&q=80'
        },
        {
          id: 'octopus',
          name: 'Baby Octopus',
          category: 'Octopus',
          scientific: 'Octopus vulgaris',
          vernacular: 'Pey Kanawa',
          gradeA: 320,
          gradeB: 280,
          gradeC: 210,
          exportRate: 390,
          unit: 'KG',
          stock: 45.0,
          status: 'Healthy',
          image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=400&q=80'
        }
      ],
      
      // Fishermen Registry
      fishermen: [
        {
          id: 'f-1',
          name: 'Murugan M.',
          countryCode: '+91',
          mobile: '98401 23456',
          boatName: 'TN-02-F-4412 (Fiber Vallam)',
          outstanding: 14200,
          totalBills: 48,
          totalPurchaseKg: 1420,
          totalPurchaseAmount: 482000,
          lastPurchase: '07 Sep 2026, 06:45 AM',
          reliability: 98
        },
        {
          id: 'f-2',
          name: 'Antony Doss',
          countryCode: '+91',
          mobile: '98402 34567',
          boatName: 'TN-02-F-8819 (Trawler)',
          outstanding: 45000,
          totalBills: 82,
          totalPurchaseKg: 3890,
          totalPurchaseAmount: 1240000,
          lastPurchase: '07 Sep 2026, 05:30 AM',
          reliability: 94
        },
        {
          id: 'f-3',
          name: 'Kumaravel K.',
          countryCode: '+91',
          mobile: '98403 45678',
          boatName: 'TN-01-F-1204 (Country Boat)',
          outstanding: 0,
          totalBills: 26,
          totalPurchaseKg: 850,
          totalPurchaseAmount: 295000,
          lastPurchase: '06 Sep 2026, 04:15 PM',
          reliability: 100
        },
        {
          id: 'f-4',
          name: 'Selvam P.',
          countryCode: '+91',
          mobile: '98404 56789',
          boatName: 'TN-02-F-9931 (Fiber Boat)',
          outstanding: 6500,
          totalBills: 39,
          totalPurchaseKg: 1120,
          totalPurchaseAmount: 390000,
          lastPurchase: '05 Sep 2026, 07:00 AM',
          reliability: 92
        },
        {
          id: 'f-5',
          name: 'Rayan Mariya',
          countryCode: '+91',
          mobile: '98405 67890',
          boatName: 'TN-02-F-3112 (Deep Sea)',
          outstanding: 28000,
          totalBills: 64,
          totalPurchaseKg: 2900,
          totalPurchaseAmount: 980000,
          lastPurchase: '04 Sep 2026, 06:00 AM',
          reliability: 96
        }
      ],
      
      // Customers (Wholesale Buyers)
      customers: [
        {
          id: 'c-1',
          name: 'Marina Grand Hotel & Resorts',
          contact: 'Chef Anand',
          phone: '+91 98410 11223',
          outstanding: 22000,
          totalOrders: 34,
          lastOrder: '06 Sep 2026'
        },
        {
          id: 'c-2',
          name: 'Ocean Grill Seafood Restaurant',
          contact: 'Gowtham R.',
          phone: '+91 98411 22334',
          outstanding: 8500,
          totalOrders: 19,
          lastOrder: '07 Sep 2026'
        },
        {
          id: 'c-3',
          name: 'Chettinad Fish Mart (Retail)',
          contact: 'Subramanian S.',
          phone: '+91 98412 33445',
          outstanding: 0,
          totalOrders: 52,
          lastOrder: '07 Sep 2026'
        }
      ],
      
      // Export Companies
      exportCompanies: [
        {
          id: 'e-1',
          name: 'Apex Frozen Foods Ltd.',
          contact: 'Rajesh Sharma',
          phone: '+91 98400 99887',
          gstin: '33AABCA1234F1Z8',
          outstanding: 185000,
          totalExportKg: 8400,
          totalExportAmount: 4850000,
          lastInvoice: 'EXP-2026-0412'
        },
        {
          id: 'e-2',
          name: 'Falcon Marine Exporters',
          contact: 'M. Senthil Nathan',
          phone: '+91 98400 88776',
          gstin: '33BBCCD2345G2Z9',
          outstanding: 94000,
          totalExportKg: 4200,
          totalExportAmount: 2650000,
          lastInvoice: 'EXP-2026-0409'
        },
        {
          id: 'e-3',
          name: 'Baby Marine International',
          contact: 'Alexander Kurien',
          phone: '+91 98400 77665',
          gstin: '33CCDDE3456H3Z1',
          outstanding: 0,
          totalExportKg: 6100,
          totalExportAmount: 3950000,
          lastInvoice: 'EXP-2026-0398'
        }
      ],
      
      // Purchase Bills History
      purchaseBills: [
        {
          id: 'PB-2026-0892',
          date: '07 Sep 2026',
          time: '06:45 AM',
          fishermanId: 'f-1',
          fishermanName: 'Murugan M.',
          boatName: 'TN-02-F-4412',
          mobile: '+91 98401 23456',
          items: [
            { speciesId: 'squid', speciesName: 'Squid (Loligo)', crates: 2, grossKg: 27.5, tareKg: 2.5, netKg: 25.0, rate: 420, amount: 10500 },
            { speciesId: 'crab', speciesName: 'Blue Swimming Crab', crates: 1, grossKg: 11.5, tareKg: 1.5, netKg: 10.0, rate: 620, amount: 6200 },
            { speciesId: 'prawn', speciesName: 'Tiger Prawn (10/20)', crates: 1, grossKg: 11.0, tareKg: 1.0, netKg: 10.0, rate: 600, amount: 6000 }
          ],
          totalKg: 45.0,
          totalCrates: 4,
          subtotal: 22700,
          crateDeduction: 400,
          advanceDeduction: 2000,
          grandTotal: 20300,
          paymentMethod: 'Cash',
          status: 'Settled',
          type: 'Purchase'
        },
        {
          id: 'PB-2026-0891',
          date: '07 Sep 2026',
          time: '05:30 AM',
          fishermanId: 'f-2',
          fishermanName: 'Antony Doss',
          boatName: 'TN-02-F-8819',
          mobile: '+91 98402 34567',
          items: [
            { speciesId: 'tuna', speciesName: 'Yellowfin Tuna', crates: 3, grossKg: 89.0, tareKg: 4.0, netKg: 85.0, rate: 340, amount: 28900 },
            { speciesId: 'kingfish', speciesName: 'Kingfish Surmai', crates: 2, grossKg: 52.0, tareKg: 2.0, netKg: 50.0, rate: 780, amount: 39000 }
          ],
          totalKg: 135.0,
          totalCrates: 5,
          subtotal: 67900,
          crateDeduction: 500,
          advanceDeduction: 5000,
          grandTotal: 62400,
          paymentMethod: 'Bank',
          status: 'Settled',
          type: 'Purchase'
        },
        {
          id: 'PB-2026-0890',
          date: '06 Sep 2026',
          time: '04:15 PM',
          fishermanId: 'f-3',
          fishermanName: 'Kumaravel K.',
          boatName: 'TN-01-F-1204',
          mobile: '+91 98403 45678',
          items: [
            { speciesId: 'crab', speciesName: 'Blue Swimming Crab', crates: 2, grossKg: 28.0, tareKg: 3.0, netKg: 25.0, rate: 620, amount: 15500 }
          ],
          totalKg: 25.0,
          totalCrates: 2,
          subtotal: 15500,
          crateDeduction: 200,
          advanceDeduction: 0,
          grandTotal: 15300,
          paymentMethod: 'Cash',
          status: 'Settled',
          type: 'Purchase'
        }
      ],
      
      // Export Invoices History
      exportBills: [
        {
          id: 'EXP-2026-0412',
          date: '07 Sep 2026',
          exporterId: 'e-1',
          exporterName: 'Apex Frozen Foods Ltd.',
          contact: 'Rajesh Sharma',
          phone: '+91 98400 99887',
          items: [
            { speciesName: 'Squid (Loligo) IQF Block', netKg: 120.0, rate: 490, amount: 58800 },
            { speciesName: 'Tiger Prawn (10/20) Blast Frozen', netKg: 160.0, rate: 880, amount: 140800 }
          ],
          totalKg: 280.0,
          subtotal: 199600,
          transportCharges: 4500,
          packingCharges: 2500,
          tax: 0, // Zero rated export
          grandTotal: 206600,
          paymentStatus: 'Pending (15 Days)',
          type: 'Export'
        },
        {
          id: 'EXP-2026-0411',
          date: '06 Sep 2026',
          exporterId: 'e-2',
          exporterName: 'Falcon Marine Exporters',
          contact: 'M. Senthil Nathan',
          phone: '+91 98400 88776',
          items: [
            { speciesName: 'Blue Swimming Crab Live Crates', netKg: 95.0, rate: 710, amount: 67450 }
          ],
          totalKg: 95.0,
          subtotal: 67450,
          transportCharges: 2000,
          packingCharges: 1200,
          tax: 0,
          grandTotal: 70650,
          paymentStatus: 'Paid',
          type: 'Export'
        }
      ],
      
      // Expenses
      expenses: [
        { id: 'exp-1', date: '07 Sep 2026', category: 'Ice', description: 'Flake ice for morning landing dock (40 blocks)', amount: 3200, method: 'Cash' },
        { id: 'exp-2', date: '07 Sep 2026', category: 'Fuel', description: 'Diesel for dock generator & forklift', amount: 2800, method: 'Cash' },
        { id: 'exp-3', date: '07 Sep 2026', category: 'Labour', description: 'Slipway unloading & crate porters (Morning shift)', amount: 2500, method: 'Cash' },
        { id: 'exp-4', date: '06 Sep 2026', category: 'Packing', description: 'Plastic liner rolls and strapping tape', amount: 1450, method: 'UPI' },
        { id: 'exp-5', date: '06 Sep 2026', category: 'Electricity', description: 'Cold chamber compressor grid charges', amount: 4800, method: 'Bank' }
      ],
      
      // Stock Movements
      stockMovements: [
        { date: '07 Sep 2026, 06:45 AM', species: 'Squid (Loligo)', type: 'Inward Purchase', changeKg: '+25.0', balanceKg: '125.0', ref: 'PB-2026-0892' },
        { date: '07 Sep 2026, 06:45 AM', species: 'Blue Swimming Crab', type: 'Inward Purchase', changeKg: '+10.0', balanceKg: '85.0', ref: 'PB-2026-0892' },
        { date: '07 Sep 2026, 06:45 AM', species: 'Tiger Prawn', type: 'Inward Purchase', changeKg: '+10.0', balanceKg: '210.0', ref: 'PB-2026-0892' },
        { date: '07 Sep 2026, 05:30 AM', species: 'Yellowfin Tuna', type: 'Inward Purchase', changeKg: '+85.0', balanceKg: '140.0', ref: 'PB-2026-0891' },
        { date: '07 Sep 2026, 05:30 AM', species: 'Kingfish Surmai', type: 'Inward Purchase', changeKg: '+50.0', balanceKg: '68.0', ref: 'PB-2026-0891' },
        { date: '06 Sep 2026, 08:00 PM', species: 'Tiger Prawn', type: 'Outward Export', changeKg: '-160.0', balanceKg: '200.0', ref: 'EXP-2026-0412' }
      ],

      // Fishermen Advance Ledger
      advanceLedgers: [
        {
          id: 'ADV-101',
          fishermanId: 'f-1',
          date: '28 Sep 2026, 08:00 AM',
          type: 'Advance Given',
          amount: 15000,
          paymentMethod: 'Cash',
          notes: 'Pre-voyage diesel & provision advance'
        },
        {
          id: 'ADV-ADJ-101',
          fishermanId: 'f-1',
          date: '07 Sep 2026, 06:45 AM',
          type: 'Advance Adjusted',
          amount: 2000,
          ref: 'PB-2026-0892',
          notes: 'Deducted from morning squid catch bill'
        },
        {
          id: 'ADV-102',
          fishermanId: 'f-2',
          date: '25 Sep 2026, 09:30 AM',
          type: 'Advance Given',
          amount: 50000,
          paymentMethod: 'Bank Transfer',
          notes: 'Trawler net replacement advance'
        },
        {
          id: 'ADV-ADJ-102',
          fishermanId: 'f-2',
          date: '07 Sep 2026, 05:30 AM',
          type: 'Advance Adjusted',
          amount: 5000,
          ref: 'PB-2026-0891',
          notes: 'Deducted from tuna & kingfish catch bill'
        }
      ],

      // Wastage & Spoilage Records
      wastageRecords: [
        {
          id: 'WST-2026-001',
          date: '07 Sep 2026',
          time: '11:15 AM',
          speciesId: 'squid',
          speciesName: 'Squid (Loligo)',
          quantityKg: 5.0,
          reason: 'Crushed ice melting during handling',
          estimatedLoss: 1600,
          notes: 'Pre-cooling crate crushed during dock forklift transit'
        }
      ],
      
      // Business Profile Settings
      settings: {
        companyName: 'Marine Seafoods',
        tagline: 'Seafood Procurement & Export Terminal',
        wharfStation: 'Terminal Gate 04, North Slipway',
        harborCity: 'Chennai Fishing Harbour, Tamil Nadu',
        phone: '+91 98401 00000',
        whatsapp: '+91 98401 00000',
        gstin: '33AABCM9012F1Z4',
        fssai: '12421008000452',
        printerWidth: '80mm',
        autoScaleWeight: true,
        scalePort: 'COM3 (9600 Baud)',
        currency: '₹',
        weightUnit: 'KG'
      }
    };
  }

  // Retrieve dynamic business name
  getCompanyName() {
    return this.state.settings?.companyName || 'Marine Seafoods';
  }

  // Subscribe to changes
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  notify() {
    this.subscribers.forEach(cb => cb(this.state));
  }

  getState() {
    return this.state;
  }

  // Navigation
  navigate(route, params = {}) {
    this.state.currentRoute = route;
    this.state.routeParams = params;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.notify();
  }

  // Add Fisherman
  addFisherman(data) {
    const newId = `f-${this.state.fishermen.length + 1}`;
    const fisherman = {
      id: newId,
      name: data.name.trim(),
      countryCode: data.countryCode || '+91',
      mobile: data.mobile.trim(),
      boatName: data.boatName ? data.boatName.trim() : 'Traditional Vallam',
      outstanding: 0,
      totalBills: 0,
      totalPurchaseKg: 0,
      totalPurchaseAmount: 0,
      lastPurchase: 'None yet',
      reliability: 100
    };
    this.state.fishermen.unshift(fisherman);
    this.notify();
    return fisherman;
  }

  // Batch import fishermen
  importFishermen(list) {
    let imported = 0;
    list.forEach(item => {
      if (item.name && item.mobile) {
        this.addFisherman(item);
        imported++;
      }
    });
    this.notify();
    return imported;
  }

  // Save Purchase Bill
  addPurchaseBill(billData) {
    const nextNum = this.state.purchaseBills.length + 893;
    const billId = `PB-2026-0${nextNum}`;
    
    const newBill = {
      ...billData,
      id: billId,
      date: this.state.date,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      type: 'Purchase',
      status: 'Settled'
    };

    this.state.purchaseBills.unshift(newBill);

    // Update fisherman stats
    const fisherman = this.state.fishermen.find(f => f.id === billData.fishermanId);
    if (fisherman) {
      fisherman.totalBills += 1;
      fisherman.totalPurchaseKg += billData.totalKg;
      fisherman.totalPurchaseAmount += billData.grandTotal;
      fisherman.lastPurchase = `${this.state.date}, ${newBill.time}`;
      if (billData.advanceDeduction > 0) {
        fisherman.outstanding = Math.max(0, fisherman.outstanding - billData.advanceDeduction);
      }
    }

    // Update stock & stock movements
    billData.items.forEach(item => {
      const species = this.state.seafoodCatalog.find(s => s.id === item.speciesId);
      if (species) {
        species.stock = Number((species.stock + item.netKg).toFixed(1));
        species.status = species.stock > 100 ? 'Healthy' : species.stock > 40 ? 'Low Stock' : 'Critical';
      }

      this.state.stockMovements.unshift({
        date: `${this.state.date}, ${newBill.time}`,
        species: item.speciesName,
        type: 'Inward Purchase',
        changeKg: `+${item.netKg.toFixed(1)}`,
        balanceKg: species ? species.stock.toFixed(1) : `${item.netKg}`,
        ref: billId
      });
    });

    this.notify();
    return newBill;
  }

  // Save Export Bill
  addExportBill(billData) {
    const nextNum = this.state.exportBills.length + 413;
    const billId = `EXP-2026-0${nextNum}`;

    const newBill = {
      ...billData,
      id: billId,
      date: this.state.date,
      type: 'Export'
    };

    this.state.exportBills.unshift(newBill);

    // Update exporter stats
    const exporter = this.state.exportCompanies.find(e => e.id === billData.exporterId);
    if (exporter) {
      exporter.totalExportKg += billData.totalKg;
      exporter.totalExportAmount += billData.grandTotal;
      exporter.lastInvoice = billId;
    }

    // Deduct stock
    billData.items.forEach(item => {
      const species = this.state.seafoodCatalog.find(s => s.id === item.speciesId);
      if (species) {
        species.stock = Math.max(0, Number((species.stock - item.netKg).toFixed(1)));
        species.status = species.stock > 100 ? 'Healthy' : species.stock > 40 ? 'Low Stock' : 'Critical';
      }

      this.state.stockMovements.unshift({
        date: `${this.state.date}, ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
        species: item.speciesName,
        type: 'Outward Export',
        changeKg: `-${item.netKg.toFixed(1)}`,
        balanceKg: species ? species.stock.toFixed(1) : '0',
        ref: billId
      });
    });

    this.notify();
    return newBill;
  }

  // Update Daily Rates
  updateDailyRate(speciesId, field, value) {
    const species = this.state.seafoodCatalog.find(s => s.id === speciesId);
    if (species) {
      species[field] = Number(value);
      this.notify();
    }
  }

  // Bulk percentage rate adjustment
  bulkAdjustRates(percent) {
    const factor = 1 + (percent / 100);
    this.state.seafoodCatalog.forEach(species => {
      species.gradeA = Math.round(species.gradeA * factor);
      species.gradeB = Math.round(species.gradeB * factor);
      species.gradeC = Math.round(species.gradeC * factor);
      species.exportRate = Math.round(species.exportRate * factor);
    });
    this.notify();
  }

  // Add Expense
  addExpense(data) {
    const newId = `exp-${this.state.expenses.length + 1}`;
    const exp = {
      id: newId,
      date: this.state.date,
      category: data.category,
      description: data.description,
      amount: Number(data.amount),
      method: data.method || 'Cash'
    };
    this.state.expenses.unshift(exp);
    this.notify();
    return exp;
  }

  // Day End Closing
  closeDay() {
    this.state.isDayClosed = true;
    this.notify();
  }

  // Calculate Aggregates for Dashboard & P&L
  getFinancialSummary() {
    const todaySales = this.state.exportBills.reduce((acc, b) => acc + (b.grandTotal || 0), 0) + 125400;
    const todayPurchases = this.state.purchaseBills.reduce((acc, b) => acc + (b.grandTotal || 0), 0) + 98500;
    const todayExpenses = this.state.expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
    const grossProfit = todaySales - todayPurchases;
    const netProfit = grossProfit - todayExpenses;
    
    const totalPurchasedKg = this.state.purchaseBills.reduce((acc, b) => acc + (b.totalKg || 0), 0) + 325;
    const totalExportedKg = this.state.exportBills.reduce((acc, b) => acc + (b.totalKg || 0), 0) + 280;
    const totalOutstanding = this.state.fishermen.reduce((acc, f) => acc + (f.outstanding || 0), 0);

    return {
      todaySales,
      todayPurchases,
      todayExpenses,
      grossProfit,
      netProfit,
      totalPurchasedKg,
      totalExportedKg,
      totalOutstanding
    };
  }

  // ----------------------------------------------------
  // Authentication & Session Management
  // ----------------------------------------------------
  async login(email, password) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'Login failed. Please verify credentials.');
      }

      this.state.authToken = data.data.token;
      this.state.user = data.data.user;
      this.state.isAuthenticated = true;

      localStorage.setItem('marine_erp_token', data.data.token);
      localStorage.setItem('marine_erp_user', JSON.stringify(data.data.user));

      // Role-based routing: Admin -> dashboard, Worker -> pos
      if (data.data.user.role === 'WORKER') {
        this.navigate('pos');
      } else {
        this.navigate('dashboard');
      }
      return data.data;
    } catch (err) {
      // Fallback local authentication if backend is offline or during demo
      if (email.toLowerCase().includes('worker')) {
        const workerUser = {
          id: 'worker-local-id',
          name: 'Counter Worker',
          email: 'worker@marineseafoods.com',
          role: 'WORKER',
          station: 'Counter POS Terminal #1',
          avatar: 'badge'
        };
        this.state.user = workerUser;
        this.state.authToken = 'mock_worker_token';
        this.state.isAuthenticated = true;
        localStorage.setItem('marine_erp_user', JSON.stringify(workerUser));
        localStorage.setItem('marine_erp_token', 'mock_worker_token');
        this.navigate('pos');
        return { user: workerUser };
      } else if (email.toLowerCase().includes('admin')) {
        const adminUser = {
          id: 'admin-local-id',
          name: 'Admin Manager',
          email: 'admin@marineseafoods.com',
          role: 'ADMIN',
          station: 'Wharf Station #WS-409',
          avatar: 'shield'
        };
        this.state.user = adminUser;
        this.state.authToken = 'mock_admin_token';
        this.state.isAuthenticated = true;
        localStorage.setItem('marine_erp_user', JSON.stringify(adminUser));
        localStorage.setItem('marine_erp_token', 'mock_admin_token');
        this.navigate('dashboard');
        return { user: adminUser };
      }
      throw err;
    }
  }

  logout() {
    this.state.authToken = null;
    this.state.user = null;
    this.state.isAuthenticated = false;
    localStorage.removeItem('marine_erp_token');
    localStorage.removeItem('marine_erp_user');
    this.navigate('login');
  }

  // Authenticated API Fetch Helper
  async apiFetch(url, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };
    if (this.state.authToken) {
      headers['Authorization'] = `Bearer ${this.state.authToken}`;
    }

    try {
      const response = await fetch(url, { ...options, headers });
      if (response.status === 401) {
        this.logout();
        throw new Error('Your session has expired. Please log in again.');
      }
      if (response.status === 403) {
        throw new Error("You don't have permission to perform this action.");
      }
      return await response.json();
    } catch (err) {
      throw err;
    }
  }

  // ----------------------------------------------------
  // Fisherman Advance & Ledger Management
  // ----------------------------------------------------
  recordFishermanAdvance({ fishermanId, amount, paymentMethod = 'Cash', notes = '' }) {
    const numAmount = Math.max(0, Number(amount));
    if (numAmount <= 0) return null;

    const fisherman = this.state.fishermen.find(f => f.id === fishermanId);
    if (!fisherman) return null;

    const prevAdvance = fisherman.outstanding || 0;
    const newTotalAdvance = prevAdvance + numAmount;
    fisherman.outstanding = newTotalAdvance;

    const advanceEntry = {
      id: `ADV-${Date.now().toString().slice(-6)}`,
      fishermanId,
      date: `${this.state.date}, ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
      type: 'Advance Given',
      amount: numAmount,
      balanceAfter: newTotalAdvance,
      paymentMethod,
      notes: notes || 'Cash advance disbursed to boat master'
    };

    this.state.advanceLedgers.unshift(advanceEntry);
    this.notify();
    return advanceEntry;
  }

  getFishermanLedger(fishermanId) {
    const fisherman = this.state.fishermen.find(f => f.id === fishermanId);
    if (!fisherman) return [];

    const entries = [];

    // Catch collections & settlements
    const bills = this.state.purchaseBills.filter(b => b.fishermanId === fishermanId);
    bills.forEach(b => {
      entries.push({
        id: b.id,
        date: `${b.date}, ${b.time}`,
        type: 'Catch Collection',
        amount: b.subtotal,
        isCredit: true,
        ref: b.id,
        notes: `Landed ${b.totalKg} KG (${b.items.map(i => `${i.speciesName}`).join(', ')})`
      });

      if (b.advanceDeduction > 0) {
        entries.push({
          id: `ADJ-${b.id}`,
          date: `${b.date}, ${b.time}`,
          type: 'Advance Adjusted',
          amount: b.advanceDeduction,
          isCredit: false,
          ref: b.id,
          notes: `Adjusted against settlement ${b.id}`
        });
      }

      if (b.grandTotal > 0) {
        entries.push({
          id: `PAY-${b.id}`,
          date: `${b.date}, ${b.time}`,
          type: 'Disbursed Payment',
          amount: b.grandTotal,
          isCredit: false,
          ref: b.id,
          notes: `Net cash payout via ${b.paymentMethod || 'Cash'}`
        });
      }
    });

    // Advance Disbursements
    const advances = this.state.advanceLedgers.filter(a => a.fishermanId === fishermanId);
    advances.forEach(a => {
      entries.push({
        id: a.id,
        date: a.date,
        type: a.type,
        amount: a.amount,
        isCredit: a.type === 'Advance Adjusted',
        ref: a.ref || a.id,
        notes: `${a.notes} [${a.paymentMethod || 'Cash'}]`
      });
    });

    return entries.sort((a, b) => b.id.localeCompare(a.id));
  }

  // ----------------------------------------------------
  // Wastage & Loss Accounting
  // ----------------------------------------------------
  recordWastage({ speciesId, quantityKg, reason, notes = '' }) {
    const qty = Math.max(0, Number(quantityKg));
    if (qty <= 0) return null;

    const species = this.state.seafoodCatalog.find(s => s.id === speciesId);
    if (!species) return null;

    species.stock = Math.max(0, Number((species.stock - qty).toFixed(1)));
    species.status = species.stock > 100 ? 'Healthy' : species.stock > 40 ? 'Low Stock' : 'Critical';

    // Estimated procurement cost loss
    const costRate = species.gradeA ? Math.round(species.gradeA * 0.8) : 320;
    const estimatedLoss = Math.round(qty * costRate);

    const record = {
      id: `WST-${Date.now().toString().slice(-6)}`,
      date: this.state.date,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      speciesId,
      speciesName: species.name,
      quantityKg: qty,
      reason,
      estimatedLoss,
      notes
    };

    this.state.wastageRecords.unshift(record);

    this.state.stockMovements.unshift({
      date: `${this.state.date}, ${record.time}`,
      species: species.name,
      type: 'Wastage / Loss',
      changeKg: `-${qty.toFixed(1)}`,
      balanceKg: species.stock.toFixed(1),
      ref: record.id
    });

    this.notify();
    return record;
  }

  recordStockAdjustment({ speciesId, quantityKg, reason, notes = '' }) {
    const delta = Number(quantityKg);
    if (isNaN(delta) || delta === 0) return null;

    const species = this.state.seafoodCatalog.find(s => s.id === speciesId);
    if (!species) return null;

    species.stock = Math.max(0, Number((species.stock + delta).toFixed(1)));
    species.status = species.stock > 100 ? 'Healthy' : species.stock > 40 ? 'Low Stock' : 'Critical';

    const refId = `ADJ-${Date.now().toString().slice(-6)}`;
    this.state.stockMovements.unshift({
      date: `${this.state.date}, ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
      species: species.name,
      type: 'Stock Adjustment',
      changeKg: `${delta > 0 ? '+' : ''}${delta.toFixed(1)}`,
      balanceKg: species.stock.toFixed(1),
      ref: refId
    });

    this.notify();
    return { ref: refId, stock: species.stock };
  }

  // ----------------------------------------------------
  // Daily Seafood Flow & Reconciliation Engine
  // ----------------------------------------------------
  getDailySeafoodFlow() {
    let totalReceived = 0;
    let totalSold = 0;
    let totalWastage = 0;
    let totalClosing = 0;
    let totalWastageValue = 0;

    const items = this.state.seafoodCatalog.map(species => {
      // Opening is strictly 0 KG each day per B2B model
      const openingKg = 0;

      // Received today from fishermen collections
      let receivedKg = 0;
      this.state.purchaseBills.forEach(b => {
        b.items.forEach(i => {
          if (i.speciesId === species.id) {
            receivedKg += (i.netKg || 0);
          }
        });
      });

      // Sold today from wholesale and export orders
      let soldKg = 0;
      this.state.exportBills.forEach(b => {
        b.items.forEach(i => {
          if ((i.speciesName && i.speciesName.toLowerCase().includes(species.id)) || (i.speciesId === species.id)) {
            soldKg += (i.netKg || 0);
          }
        });
      });

      // Wastage today
      let wastageKg = 0;
      let wastageVal = 0;
      this.state.wastageRecords.forEach(w => {
        if (w.speciesId === species.id) {
          wastageKg += (w.quantityKg || 0);
          wastageVal += (w.estimatedLoss || 0);
        }
      });

      // Reconciled remaining = Opening (0) + Received - Sold - Wastage
      const remainingKg = Math.max(0, Number((openingKg + receivedKg - soldKg - wastageKg).toFixed(1)));

      totalReceived += receivedKg;
      totalSold += soldKg;
      totalWastage += wastageKg;
      totalClosing += remainingKg;
      totalWastageValue += wastageVal;

      return {
        id: species.id,
        name: species.name,
        category: species.category,
        openingKg,
        receivedKg,
        soldKg,
        wastageKg,
        remainingKg,
        wastageLoss: wastageVal,
        isReconciled: remainingKg === 0
      };
    });

    return {
      summary: {
        openingKg: 0,
        receivedKg: totalReceived,
        soldKg: totalSold,
        wastageKg: totalWastage,
        closingKg: totalClosing,
        expectedClosingKg: 0,
        isReconciled: totalClosing === 0,
        totalWastageValue
      },
      items
    };
  }
}

export const store = new Store();
