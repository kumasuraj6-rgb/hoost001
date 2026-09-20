import React, { useState, useEffect } from 'react';
import {
  Truck,
  ShieldCheck,
  Save,
  RotateCcw,
  Check,
  Plus,
  Trash2,
  Clock,
  Banknote,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { ShippingSettings } from '../../types';
import { formatINR } from '../../utils/currency';

export const ShippingSettingsTab: React.FC = () => {
  const { storeSettings, updateStoreSettings, showToast } = useStore();

  const [shipping, setShipping] = useState<ShippingSettings>({
    flatRate: storeSettings.shipping?.flatRate ?? storeSettings.deliveryCharge ?? 149,
    freeShippingThreshold: storeSettings.shipping?.freeShippingThreshold ?? storeSettings.freeShippingThreshold ?? 1999,
    courierPartners: storeSettings.shipping?.courierPartners?.length
      ? storeSettings.shipping.courierPartners
      : ['BlueDart Express', 'Delhivery Surface', 'DTDC Priority', 'Shiprocket Air'],
    estimatedDays: storeSettings.shipping?.estimatedDays || '3-5 Business Days',
    codAvailable: storeSettings.shipping?.codAvailable ?? true,
    codExtraFee: storeSettings.shipping?.codExtraFee ?? 49,
    enabled: storeSettings.shipping?.enabled ?? true,
  });

  const [newPartnerInput, setNewPartnerInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (storeSettings.shipping) {
      setShipping({
        flatRate: storeSettings.shipping.flatRate ?? 149,
        freeShippingThreshold: storeSettings.shipping.freeShippingThreshold ?? 1999,
        courierPartners: storeSettings.shipping.courierPartners?.length
          ? storeSettings.shipping.courierPartners
          : ['BlueDart Express', 'Delhivery Surface', 'DTDC Priority', 'Shiprocket Air'],
        estimatedDays: storeSettings.shipping.estimatedDays || '3-5 Business Days',
        codAvailable: storeSettings.shipping.codAvailable ?? true,
        codExtraFee: storeSettings.shipping.codExtraFee ?? 49,
        enabled: storeSettings.shipping.enabled ?? true,
      });
    }
  }, [storeSettings]);

  const handleAddPartner = () => {
    if (!newPartnerInput.trim()) return;
    if (shipping.courierPartners.includes(newPartnerInput.trim())) {
      showToast('Courier partner already in list', 'info');
      return;
    }
    setShipping((prev) => ({
      ...prev,
      courierPartners: [...prev.courierPartners, newPartnerInput.trim()],
    }));
    setNewPartnerInput('');
  };

  const handleRemovePartner = (partner: string) => {
    setShipping((prev) => ({
      ...prev,
      courierPartners: prev.courierPartners.filter((p) => p !== partner),
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const success = updateStoreSettings({
      shipping,
      deliveryCharge: shipping.flatRate,
      freeShippingThreshold: shipping.freeShippingThreshold,
    });
    setTimeout(() => {
      setIsSaving(false);
      if (success) {
        showToast('Shipping settings saved & synchronized with checkout!', 'success');
      }
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5" />
            <span>Store Logistics & Fulfillment</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-neutral-100 uppercase tracking-tight mt-1">
            Shipping & Logistics Settings
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-xl">
            Configure all-India delivery rates, free shipping cart qualification thresholds, cash-on-delivery
            availability, and logistics courier partners for dispatch.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save Logistics Rules'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings - 2 Columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Rates and Thresholds */}
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-200 flex items-center gap-2">
              <span>Delivery Charges & Cart Rules</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">
                  Flat Delivery Charge (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={shipping.flatRate}
                  onChange={(e) =>
                    setShipping((prev) => ({ ...prev, flatRate: Number(e.target.value) }))
                  }
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-neutral-100 font-mono focus:border-amber-500 focus:outline-none"
                  placeholder="149"
                  required
                />
                <span className="text-[10px] text-neutral-500">
                  Applied to orders under the free shipping limit.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">
                  Free Shipping Threshold (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={shipping.freeShippingThreshold}
                  onChange={(e) =>
                    setShipping((prev) => ({
                      ...prev,
                      freeShippingThreshold: Number(e.target.value),
                    }))
                  }
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-neutral-100 font-mono focus:border-amber-500 focus:outline-none"
                  placeholder="1999"
                  required
                />
                <span className="text-[10px] text-neutral-500">
                  Orders equal or above this amount get free express shipping.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-800">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">
                  Estimated Delivery Transit Time
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={shipping.estimatedDays}
                    onChange={(e) =>
                      setShipping((prev) => ({ ...prev, estimatedDays: e.target.value }))
                    }
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-neutral-100 focus:border-amber-500 focus:outline-none"
                    placeholder="3-5 Business Days"
                  />
                  <Clock className="w-4 h-4 text-neutral-500 absolute right-3 top-3" />
                </div>
                <span className="text-[10px] text-neutral-500">
                  Displayed on product details and checkout.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">
                  COD Handling Fee (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={shipping.codExtraFee}
                  onChange={(e) =>
                    setShipping((prev) => ({ ...prev, codExtraFee: Number(e.target.value) }))
                  }
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-neutral-100 font-mono focus:border-amber-500 focus:outline-none"
                  placeholder="49"
                />
                <span className="text-[10px] text-neutral-500">
                  Extra carrier verification fee for Cash on Delivery.
                </span>
              </div>
            </div>

            {/* Toggles */}
            <div className="pt-4 border-t border-neutral-800 space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-neutral-200">
                    Enable Shipping Fulfillment
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    Toggle entire nationwide shipping service in checkout.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={shipping.enabled}
                  onChange={(e) =>
                    setShipping((prev) => ({ ...prev, enabled: e.target.checked }))
                  }
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-neutral-200">
                    Enable Cash on Delivery (COD)
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    Allow riders to pay upon physical doorstep delivery.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={shipping.codAvailable}
                  onChange={(e) =>
                    setShipping((prev) => ({ ...prev, codAvailable: e.target.checked }))
                  }
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Courier Partners Management */}
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                  Integrated Courier Partners
                </h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Partners selectable when generating AWB tracking in Orders.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newPartnerInput}
                onChange={(e) => setNewPartnerInput(e.target.value)}
                placeholder="e.g. XpressBees Logistics, Amazon Shipping..."
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-neutral-100 focus:border-amber-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddPartner}
                className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Add Partner</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              {shipping.courierPartners.map((partner) => (
                <div
                  key={partner}
                  className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5 text-amber-500" />
                    <span className="font-semibold text-neutral-200">{partner}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePartner(partner)}
                    className="text-neutral-500 hover:text-red-400 transition-colors p-1"
                    title="Remove Partner"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Preview / Calculation Sidebar */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2">
              <Banknote className="w-4 h-4" />
              <span>Checkout Calculator Simulation</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-850 space-y-2">
                <div className="text-[11px] font-bold text-neutral-400 uppercase">
                  Scenario A: Order under threshold
                </div>
                <div className="flex justify-between text-neutral-300">
                  <span>Cart Items:</span>
                  <span className="font-mono">₹1,200</span>
                </div>
                <div className="flex justify-between text-amber-400 font-semibold">
                  <span>Shipping Fee:</span>
                  <span className="font-mono">+{formatINR(shipping.flatRate)}</span>
                </div>
                <div className="flex justify-between text-white font-bold border-t border-neutral-800 pt-1.5">
                  <span>Payable Total:</span>
                  <span className="font-mono">{formatINR(1200 + shipping.flatRate)}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-850 space-y-2">
                <div className="text-[11px] font-bold text-neutral-400 uppercase">
                  Scenario B: Qualified for Free Express
                </div>
                <div className="flex justify-between text-neutral-300">
                  <span>Cart Items:</span>
                  <span className="font-mono">₹4,999</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Shipping Fee:</span>
                  <span className="font-mono uppercase text-[10px] bg-emerald-950 px-1.5 py-0.5 rounded">
                    FREE
                  </span>
                </div>
                <div className="flex justify-between text-white font-bold border-t border-neutral-800 pt-1.5">
                  <span>Payable Total:</span>
                  <span className="font-mono">{formatINR(4999)}</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 space-y-1">
              <div className="font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Logistics Guarantee</span>
              </div>
              <p className="text-[11px] leading-relaxed text-neutral-400">
                All riding armor and helmets are shipped via insured surface or air couriers with tamper-proof
                heavy-duty security seal packaging.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
