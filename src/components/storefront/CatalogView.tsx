import React, { useState, useMemo } from 'react';
import {
  Filter,
  SlidersHorizontal,
  Search,
  RotateCcw,
  Shield,
  Droplets,
  ChevronDown,
  X,
} from 'lucide-react';
import { Product, ALLOWED_CATEGORIES } from '../../types';
import { useStore } from '../../context/StoreContext';
import { ProductCard } from './ProductCard';
import { formatINR } from '../../utils/currency';

interface CatalogViewProps {
  onOpenDetail: (product: Product) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({ onOpenDetail }) => {
  const { products, selectedCategory, setSelectedCategory, searchQuery, setSearchQuery } = useStore();

  const [selectedArmor, setSelectedArmor] = useState<string | null>(null);
  const [onlyWaterproof, setOnlyWaterproof] = useState<boolean>(false);
  const [priceSort, setPriceSort] = useState<'FEATURED' | 'PRICE_ASC' | 'PRICE_DESC' | 'RATING' | 'DISCOUNT'>('FEATURED');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Status check
      if (p.status === 'ARCHIVED') return false;

      // 2. Category filter
      if (selectedCategory && p.category !== selectedCategory) {
        return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(q);
        const matchBrand = p.brand?.toLowerCase().includes(q);
        const matchCategory = p.category.toLowerCase().includes(q);
        const matchTags = p.tags?.some((t) => t.toLowerCase().includes(q));
        const matchSku = p.sku.toLowerCase().includes(q);
        if (!matchName && !matchBrand && !matchCategory && !matchTags && !matchSku) {
          return false;
        }
      }

      // 4. Armor level
      if (selectedArmor && p.armorLevel !== selectedArmor) {
        return false;
      }

      // 5. Waterproof filter
      if (onlyWaterproof && !p.waterproofRating) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (priceSort === 'PRICE_ASC') return a.price - b.price;
      if (priceSort === 'PRICE_DESC') return b.price - a.price;
      if (priceSort === 'RATING') return b.rating - a.rating;
      if (priceSort === 'DISCOUNT') return b.discountPercentage - a.discountPercentage;
      return 0; // FEATURED
    });
  }, [products, selectedCategory, searchQuery, selectedArmor, onlyWaterproof, priceSort]);

  const clearAllFilters = () => {
    setSelectedCategory(null);
    setSearchQuery('');
    setSelectedArmor(null);
    setOnlyWaterproof(false);
    setPriceSort('FEATURED');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header & Sort Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-amber-500">
            Certified Riding Equipment
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase text-neutral-100 mt-1">
            {selectedCategory || 'All Riding Gear & Touring Luggage'}
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Showing {filteredProducts.length} certified items compliant with CE EN1621 norms.
          </p>
        </div>

        {/* Sort & Mobile filter trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs font-bold flex items-center gap-2"
          >
            <Filter className="w-4 h-4 text-amber-500" />
            <span>Filters</span>
          </button>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-400 hidden sm:inline">Sort:</span>
            <select
              value={priceSort}
              onChange={(e) => setPriceSort(e.target.value as any)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-200 focus:border-amber-500 focus:outline-none"
            >
              <option value="FEATURED">Featured Gear</option>
              <option value="PRICE_ASC">Price: Low to High</option>
              <option value="PRICE_DESC">Price: High to Low</option>
              <option value="RATING">Highest Customer Rating</option>
              <option value="DISCOUNT">Biggest Discount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Filters Sidebar (Desktop) + Product Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left Column: Filter Sidebar (Desktop) */}
        <div className="hidden lg:block space-y-6 sticky top-24 bg-neutral-900/60 p-5 rounded-2xl border border-neutral-800">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <span className="font-bold text-xs uppercase tracking-wider text-neutral-200 flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-amber-500" />
              <span>Gear Filters</span>
            </span>
            {(selectedCategory || selectedArmor || onlyWaterproof || searchQuery) && (
              <button
                onClick={clearAllFilters}
                className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Gear Category
            </div>
            <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                  selectedCategory === null
                    ? 'bg-amber-500 text-black font-bold'
                    : 'text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                <span>All Categories</span>
                <span>{products.length}</span>
              </button>
              {ALLOWED_CATEGORIES.map((cat) => {
                const count = products.filter((p) => p.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                      selectedCategory === cat
                        ? 'bg-amber-500 text-black font-bold'
                        : 'text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    <span className="truncate pr-1">{cat}</span>
                    <span className="text-[11px] opacity-70 font-mono">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Armor Certification Filter */}
          <div className="space-y-2 pt-2 border-t border-neutral-800">
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              <span>Impact Armor</span>
            </div>
            <div className="space-y-1">
              {['CE Level 2', 'CE Level 1'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedArmor(selectedArmor === lvl ? null : lvl)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                    selectedArmor === lvl
                      ? 'bg-neutral-800 text-amber-400 border border-amber-500/50 font-bold'
                      : 'text-neutral-300 hover:bg-neutral-800/80'
                  }`}
                >
                  <span>{lvl} Certified</span>
                  {selectedArmor === lvl && <span className="text-amber-400">✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Monsoon / Waterproofing Filter */}
          <div className="space-y-2 pt-2 border-t border-neutral-800">
            <label className="flex items-center gap-2.5 text-xs text-neutral-300 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyWaterproof}
                onChange={(e) => setOnlyWaterproof(e.target.checked)}
                className="rounded border-neutral-700 text-amber-500 focus:ring-amber-500"
              />
              <span className="flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-blue-400" />
                <span>Waterproof Rated Only</span>
              </span>
            </label>
          </div>
        </div>

        {/* Right Column: Products Grid */}
        <div className="lg:col-span-3">
          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
              <Shield className="w-12 h-12 text-neutral-600 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-neutral-200">No matching gear found</h3>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                  Try clearing your filters or adjusting your search term to explore available riding gear.
                </p>
              </div>
              <button
                onClick={clearAllFilters}
                className="px-5 py-2.5 rounded-xl bg-amber-500 text-black font-extrabold text-xs uppercase tracking-wider"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOpenDetail={onOpenDetail}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
