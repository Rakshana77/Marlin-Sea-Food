import React, { useState, useEffect, useMemo } from 'react';
import { Seafood, SeafoodGrade, Sale, Customer } from '../types/models';
import { getSeafoodCatalog, getStockList } from '../api/stock';
import { getCurrentDailyRates } from '../api/rates';
import { apiClient } from '../api/client';
import { useCart } from '../hooks/useCart';
import { CatalogItemCard } from '../components/pos/CatalogItemCard';
import { QuantityModal } from '../components/pos/QuantityModal';
import { CartPanel } from '../components/pos/CartPanel';
import { BuyerModal } from '../components/pos/BuyerModal';
import { PaymentModal } from '../components/pos/PaymentModal';
import { ReceiptModal } from '../components/pos/ReceiptModal';
import { Search, ShoppingCart, RefreshCw, AlertCircle, Loader2, Sparkles } from 'lucide-react';

export const BillingPage: React.FC = () => {
  const [catalog, setCatalog] = useState<Seafood[]>([]);
  const [grades, setGrades] = useState<SeafoodGrade[]>([]);
  const [ratesMap, setRatesMap] = useState<Record<string, string>>({});
  const [stockMap, setStockMap] = useState<Record<string, number>>({});
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal active states
  const [activeItemForQty, setActiveItemForQty] = useState<{
    seafood: Seafood;
    grade: SeafoodGrade;
    rate: string;
    availableKg: number;
    initialQuantity?: string;
    isEditing?: boolean;
    itemId?: string;
  } | null>(null);

  const [showBuyerModal, setShowBuyerModal] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [confirmedSale, setConfirmedSale] = useState<Sale | null>(null);
  const [mobileCartOpen, setMobileCartOpen] = useState<boolean>(false);

  const { items, customer, totals, addItem, updateItemQuantity, setCustomer, setWalkInCustomer, clearCart } = useCart();

  // Load authoritative catalog, grades, published rates, and live stock balances
  const loadTerminalData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMessage(null);

    try {
      const [seafoodList, gradesList, ratesList, stockList] = await Promise.all([
        getSeafoodCatalog(),
        apiClient<SeafoodGrade[]>('/seafood-grades'),
        getCurrentDailyRates(),
        getStockList(),
      ]);

      setCatalog(seafoodList || []);
      setGrades(gradesList || []);

      // Build rate mapping: `${seafoodId}_${gradeId}` -> rate
      const rMap: Record<string, string> = {};
      ratesList.forEach((r) => {
        rMap[`${r.seafoodId}_${r.gradeId}`] = r.sellingRate;
      });
      setRatesMap(rMap);

      // Build stock mapping: `${seafoodId}_${gradeId}` -> availableKg
      const sMap: Record<string, number> = {};
      stockList.forEach((s) => {
        sMap[`${s.seafoodId}_${s.gradeId}`] = parseFloat(s.quantityKg) || 0;
      });
      setStockMap(sMap);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load catalog or live rates');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTerminalData();
  }, []);

  // Unique categories for filtering, prioritized in order: Squid, Crab, Fish
  const categories = useMemo(() => {
    const priority = ['Squid', 'Crab', 'Fish'];
    const set = new Set<string>();
    catalog.forEach((item) => {
      if (item.category?.name) set.add(item.category.name);
    });
    return Array.from(set).sort((a, b) => {
      const idxA = priority.indexOf(a);
      const idxB = priority.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [catalog]);

  // Filtered catalog
  const filteredCatalog = useMemo(() => {
    return catalog.filter((item) => {
      const matchesSearch =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.vernacularName && item.vernacularName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.scientificName && item.scientificName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat =
        selectedCategory === 'all' || item.category?.name === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [catalog, searchQuery, selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-24 md:pb-8 flex flex-col gap-4">
      {/* Top Controls: Search, Category Chips & Live Refresh */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col gap-3">
        <div className="flex items-center gap-2">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search seafood by English or vernacular name..."
              className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition-colors"
            />
          </div>

          {/* Refresh Rates & Stock */}
          <button
            onClick={() => loadTerminalData(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 active:scale-95 transition-all flex items-center justify-center flex-shrink-0"
            title="Refresh Live Stock & Rates"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Seafood ({catalog.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => loadTerminalData(true)}
            className="text-xs font-bold text-rose-800 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Grid: Catalog on left, Cart on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Seafood Catalog Grid (8 columns on lg) */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              <span className="text-sm font-semibold">Loading seafood rates & stock...</span>
            </div>
          ) : filteredCatalog.length === 0 ? (
            <div className="py-24 bg-white rounded-2xl border border-slate-200 text-center p-6 flex flex-col items-center">
              <Sparkles className="w-8 h-8 text-slate-300 mb-2" />
              <h3 className="font-bold text-slate-700 text-base">No seafood found</h3>
              <p className="text-xs text-slate-500 mt-1">
                Try adjusting your search query or category filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredCatalog.map((seafood) => (
                <CatalogItemCard
                  key={seafood.id}
                  seafood={seafood}
                  grades={grades}
                  ratesMap={ratesMap}
                  stockMap={stockMap}
                  onSelectItem={(sf, gr, rate, availKg) => {
                    setActiveItemForQty({
                      seafood: sf,
                      grade: gr,
                      rate,
                      availableKg: availKg,
                    });
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Desktop Cart Panel (4 columns on lg) */}
        <div className="hidden lg:block lg:col-span-4 sticky top-20">
          <CartPanel
            onOpenBuyerModal={() => setShowBuyerModal(true)}
            onProceedToPayment={() => setShowPaymentModal(true)}
            onEditItemQty={(item) => {
              const sf = catalog.find((c) => c.id === item.seafoodId);
              const gr = grades.find((g) => g.id === item.gradeId);
              if (sf && gr) {
                setActiveItemForQty({
                  seafood: sf,
                  grade: gr,
                  rate: item.sellingRate,
                  availableKg: stockMap[`${sf.id}_${gr.id}`] ?? 0,
                  initialQuantity: item.quantityKg,
                  isEditing: true,
                  itemId: item.id,
                });
              }
            }}
          />
        </div>
      </div>

      {/* Mobile Sticky Floating Cart Summary Bar (visible when items > 0) */}
      {items.length > 0 && (
        <div className="lg:hidden fixed bottom-18 left-3 right-3 z-30">
          <div 
            onClick={() => setMobileCartOpen(true)}
            className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl border border-slate-800 flex items-center justify-between cursor-pointer active:scale-95 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-teal-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                {items.length}
              </div>
              <div>
                <span className="text-xs font-medium text-slate-300 block">Total ({totals.totalKg} kg)</span>
                <span className="text-base font-bold font-tabular text-teal-300 block">
                  ₹{totals.grandTotal}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow flex items-center gap-1.5"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>View Cart & Pay</span>
            </button>
          </div>
        </div>
      )}

      {/* Mobile Cart Full-Screen Drawer */}
      {mobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end animate-fade-in">
          <div className="bg-white rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-3 bg-slate-100 flex items-center justify-between border-b border-slate-200">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Current Cart
              </span>
              <button
                onClick={() => setMobileCartOpen(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 px-2 py-1"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <CartPanel
                onOpenBuyerModal={() => {
                  setMobileCartOpen(false);
                  setShowBuyerModal(true);
                }}
                onProceedToPayment={() => {
                  setMobileCartOpen(false);
                  setShowPaymentModal(true);
                }}
                onEditItemQty={(item) => {
                  setMobileCartOpen(false);
                  const sf = catalog.find((c) => c.id === item.seafoodId);
                  const gr = grades.find((g) => g.id === item.gradeId);
                  if (sf && gr) {
                    setActiveItemForQty({
                      seafood: sf,
                      grade: gr,
                      rate: item.sellingRate,
                      availableKg: stockMap[`${sf.id}_${gr.id}`] ?? 0,
                      initialQuantity: item.quantityKg,
                      isEditing: true,
                      itemId: item.id,
                    });
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 1. Quantity & Weight Entry Modal */}
      {activeItemForQty && (
        <QuantityModal
          seafood={activeItemForQty.seafood}
          grade={activeItemForQty.grade}
          rate={activeItemForQty.rate}
          availableKg={activeItemForQty.availableKg}
          initialQuantity={activeItemForQty.initialQuantity}
          onConfirm={(qty) => {
            if (activeItemForQty.isEditing && activeItemForQty.itemId) {
              updateItemQuantity(activeItemForQty.itemId, qty);
            } else {
              addItem({
                seafoodId: activeItemForQty.seafood.id,
                seafoodName: activeItemForQty.seafood.name,
                categoryName: activeItemForQty.seafood.category?.name,
                unit: activeItemForQty.seafood.unit || 'KG',
                gradeId: activeItemForQty.grade.id,
                gradeName: activeItemForQty.grade.name,
                availableKg: activeItemForQty.availableKg,
                quantityKg: qty,
                sellingRate: activeItemForQty.rate,
              });
            }
            setActiveItemForQty(null);
          }}
          onClose={() => setActiveItemForQty(null)}
        />
      )}

      {/* 2. Buyer Selection / Creation Modal */}
      {showBuyerModal && (
        <BuyerModal
          currentBuyerId={customer.id}
          isWalkIn={customer.isWalkIn}
          onSelectBuyer={(buyer: Customer | null) => {
            if (buyer) {
              setCustomer({
                id: buyer.id,
                name: buyer.name,
                mobileNumber: buyer.mobileNumber,
                countryCode: buyer.countryCode,
                isWalkIn: false,
              });
            } else {
              setWalkInCustomer();
            }
          }}
          onClose={() => setShowBuyerModal(false)}
        />
      )}

      {/* 3. Payment & Confirmation Modal */}
      {showPaymentModal && (
        <PaymentModal
          onSaleSuccess={(sale: Sale) => {
            setShowPaymentModal(false);
            setConfirmedSale(sale);
            // Refresh live stock balances after sale mutation
            loadTerminalData(true);
          }}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {/* 4. Receipt & Thermal Print Modal */}
      {confirmedSale && (
        <ReceiptModal
          sale={confirmedSale}
          onNewSale={() => setConfirmedSale(null)}
          onClose={() => setConfirmedSale(null)}
        />
      )}
    </div>
  );
};
