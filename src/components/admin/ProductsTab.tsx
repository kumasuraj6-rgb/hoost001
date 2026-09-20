import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Copy,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Eye,
  Shield,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Product, ALLOWED_CATEGORIES } from '../../types';
import { formatINR } from '../../utils/currency';
import { ProductEditorModal } from './ProductEditorModal';

export const ProductsTab: React.FC = () => {
  const { products, saveProduct, deleteProduct, duplicateProduct, showToast } = useStore();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Filter products
  const filteredProducts = products.filter((p) => {
    if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
    if (stockFilter === 'LOW' && (p.stock <= 0 || p.stock > p.lowStockThreshold)) return false;
    if (stockFilter === 'OUT' && p.stock > 0) return false;

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchName = p.name.toLowerCase().includes(q);
      const matchSku = p.sku.toLowerCase().includes(q);
      const matchCat = p.category.toLowerCase().includes(q);
      return matchName || matchSku || matchCat;
    }
    return true;
  });

  const handleSaveModal = (data: Partial<Product>) => {
    const res = saveProduct(data);
    if (res.success) {
      setEditingProduct(null);
      setIsCreatingNew(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      deleteProduct(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-amber-500">
            Catalog Administration
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-neutral-100 uppercase tracking-tight mt-1">
            Product & Armor Inventory
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Manage CE certified jackets, monsoon suits, leather gloves, and waterproof luggage.
          </p>
        </div>

        <button
          onClick={() => setIsCreatingNew(true)}
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-2 shadow-lg shadow-amber-500/20 shrink-0"
          id="admin-add-product-btn"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Riding Gear</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col sm:flex-row gap-3 items-center justify-between text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by name, SKU or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-neutral-100 placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:border-amber-500 focus:outline-none font-medium"
          >
            <option value="ALL">All Categories ({products.length})</option>
            {ALLOWED_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:border-amber-500 focus:outline-none font-medium"
          >
            <option value="ALL">All Stock Levels</option>
            <option value="LOW">Low Stock Alert (&lt;= threshold)</option>
            <option value="OUT">Out of Stock (0 units)</option>
          </select>
        </div>
      </div>

      {/* Products Table (Desktop) / Cards (Mobile) */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950 border-b border-neutral-800 text-neutral-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Item & Visual</th>
                <th className="p-4">Category & SKU</th>
                <th className="p-4">Color Galleries</th>
                <th className="p-4">Price (INR)</th>
                <th className="p-4">Inventory</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-800/80">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-500">
                    No riding gear matches the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const isLow = prod.stock > 0 && prod.stock <= prod.lowStockThreshold;
                  const isOut = prod.stock <= 0;
                  const thumbnail =
                    prod.masterImages?.[0]?.url ||
                    prod.colorVariants?.[0]?.images?.[0]?.url ||
                    '';

                  return (
                    <tr
                      key={prod.id}
                      className="hover:bg-neutral-850/60 transition-colors group"
                      id={`admin-row-${prod.id}`}
                    >
                      {/* 1. Item & Visual */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={thumbnail}
                            alt={prod.name}
                            className="w-12 h-12 rounded-xl object-cover bg-neutral-950 border border-neutral-800 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="max-w-xs">
                            <div className="font-bold text-neutral-100 group-hover:text-amber-400 transition-colors truncate">
                              {prod.name}
                            </div>
                            <div className="text-[11px] text-neutral-400 flex items-center gap-1.5 mt-0.5">
                              {prod.armorLevel && prod.armorLevel !== 'None' && (
                                <span className="text-amber-500 font-semibold">{prod.armorLevel}</span>
                              )}
                              {prod.waterproofRating && (
                                <span className="text-blue-400 font-semibold">• {prod.waterproofRating}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Category & SKU */}
                      <td className="p-4">
                        <span className="inline-block px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-300 font-semibold text-[11px]">
                          {prod.category}
                        </span>
                        <div className="font-mono text-neutral-400 text-[11px] mt-1">
                          {prod.sku}
                        </div>
                      </td>

                      {/* 3. Color Galleries Count */}
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          {prod.colorVariants?.slice(0, 3).map((v) => (
                            <span
                              key={v.id || v.colorName}
                              className="w-3.5 h-3.5 rounded-full border border-neutral-700"
                              style={{ backgroundColor: v.colorHex || '#333' }}
                              title={`${v.colorName} (${v.images.length} photos)`}
                            />
                          ))}
                          {prod.colorVariants && prod.colorVariants.length > 3 && (
                            <span className="text-[10px] text-neutral-400 font-mono">
                              +{prod.colorVariants.length - 3}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-neutral-400 mt-1">
                          {prod.colorVariants?.length || 0} color galleries
                        </div>
                      </td>

                      {/* 4. Price in INR */}
                      <td className="p-4">
                        <div className="font-black text-neutral-100 font-mono">
                          {formatINR(prod.price)}
                        </div>
                        {prod.originalPrice > prod.price && (
                          <div className="text-[11px] text-neutral-400 line-through">
                            {formatINR(prod.originalPrice)}
                          </div>
                        )}
                      </td>

                      {/* 5. Inventory */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-mono font-bold text-xs ${
                              isOut ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-neutral-200'
                            }`}
                          >
                            {prod.stock} units
                          </span>
                        </div>
                        {isLow && (
                          <span className="inline-block text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 mt-1">
                            Low Stock
                          </span>
                        )}
                        {isOut && (
                          <span className="inline-block text-[10px] font-bold text-red-400 bg-red-950 px-1.5 py-0.5 rounded border border-red-800 mt-1">
                            Sold Out
                          </span>
                        )}
                      </td>

                      {/* 6. Status */}
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            prod.status === 'ACTIVE'
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                              : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                          }`}
                        >
                          {prod.status}
                        </span>
                      </td>

                      {/* 7. Action Buttons */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingProduct(prod)}
                            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-amber-500 hover:text-black text-neutral-200 transition-colors"
                            title="Edit Gear Details"
                            id={`edit-prod-btn-${prod.id}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => duplicateProduct(prod.id)}
                            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                            title="Duplicate / Clone Product"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(prod.id, prod.name)}
                            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-red-900 text-neutral-400 hover:text-red-200 transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Editor Modal (for Add or Edit) */}
      {(editingProduct || isCreatingNew) && (
        <ProductEditorModal
          product={editingProduct}
          onClose={() => {
            setEditingProduct(null);
            setIsCreatingNew(false);
          }}
          onSave={handleSaveModal}
        />
      )}
    </div>
  );
};
