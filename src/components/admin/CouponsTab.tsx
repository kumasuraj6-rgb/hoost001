import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Percent,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Coupon } from '../../types';
import { formatINR } from '../../utils/currency';

export const CouponsTab: React.FC = () => {
  const { coupons, saveCoupon, deleteCoupon, showToast } = useStore();

  const [isAdding, setIsAdding] = useState(false);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FLAT'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState(10);
  const [minOrderValue, setMinOrderValue] = useState(2500);
  const [maxDiscount, setMaxDiscount] = useState(1500);
  const [validUntil, setValidUntil] = useState('2026-12-31');

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    saveCoupon({
      code: code.trim().toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue),
      maxDiscount: discountType === 'PERCENTAGE' ? Number(maxDiscount) : undefined,
      validUntil,
      isActive: true,
    });

    setIsAdding(false);
    setCode('');
  };

  const handleToggleStatus = (cpn: Coupon) => {
    saveCoupon({ ...cpn, isActive: !cpn.isActive });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-amber-500">
            Promotions & Discounts
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-neutral-100 uppercase tracking-tight mt-1">
            Coupon Codes & Discounts
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Create percentage or flat rupee discounts with minimum cart value and validity thresholds.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-2 shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon</span>
        </button>
      </div>

      {/* Coupons Table */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950 border-b border-neutral-800 text-neutral-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Coupon Code</th>
                <th className="p-4">Discount</th>
                <th className="p-4">Min. Cart Value</th>
                <th className="p-4">Cap Limit</th>
                <th className="p-4">Valid Until</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-800/80">
              {coupons.map((cpn) => (
                <tr key={cpn.id} className="hover:bg-neutral-850/60 transition-colors">
                  <td className="p-4 font-mono font-bold text-amber-400 text-sm">
                    {cpn.code}
                  </td>
                  <td className="p-4 font-bold text-neutral-200">
                    {cpn.discountType === 'PERCENTAGE' ? `${cpn.discountValue}% OFF` : `Flat ${formatINR(cpn.discountValue)}`}
                  </td>
                  <td className="p-4 text-neutral-300 font-mono">
                    {formatINR(cpn.minOrderValue)}
                  </td>
                  <td className="p-4 text-neutral-400 font-mono">
                    {cpn.maxDiscount ? formatINR(cpn.maxDiscount) : 'No Cap'}
                  </td>
                  <td className="p-4 text-neutral-400">
                    {new Date(cpn.validUntil).toLocaleDateString('en-IN')}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleStatus(cpn)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        cpn.isActive
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                      }`}
                    >
                      {cpn.isActive ? 'ACTIVE' : 'DISABLED'}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => {
                        if (confirm(`Delete coupon ${cpn.code}?`)) {
                          deleteCoupon(cpn.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-neutral-800 hover:bg-red-900 text-neutral-400 hover:text-red-200 transition-colors"
                      title="Delete Coupon"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Coupon Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 text-neutral-200 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-bold text-sm text-neutral-100 flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-500" />
                <span>Create New Promo Coupon</span>
              </h3>
              <button
                onClick={() => setIsAdding(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-mono uppercase font-bold focus:border-amber-500 focus:outline-none"
                  placeholder="e.g. MONSOON25"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-neutral-400 font-medium">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Rupee (₹)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-neutral-400 font-medium">Discount Value *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-neutral-400 font-medium">Min Cart Value (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-neutral-400 font-medium">Max Discount Cap (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Expiry Date</label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold uppercase tracking-wider"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
