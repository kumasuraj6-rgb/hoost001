import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Tag,
  Truck,
  Plus,
  Minus,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../utils/currency';

interface CartDrawerProps {
  onOpenDetail?: (product: any) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    removeFromCart,
    updateCartQuantity,
    cartSubtotal,
    cartShipping,
    cartDiscount,
    cartGst,
    cartTotal,
    storeSettings,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    setActiveView,
  } = useStore();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');

  if (!isCartOpen) return null;

  const freeShippingNeeded = Math.max(0, storeSettings.freeShippingThreshold - cartSubtotal);
  const freeShippingPercent = Math.min(100, Math.round((cartSubtotal / storeSettings.freeShippingThreshold) * 100));

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    if (!couponInput.trim()) return;
    const res = applyCoupon(couponInput.trim());
    if (!res.success) {
      setCouponError(res.message);
    } else {
      setCouponInput('');
    }
  };

  const handleProceedCheckout = () => {
    setIsCartOpen(false);
    setActiveView('CHECKOUT');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-neutral-900 border-l border-neutral-800 shadow-2xl flex flex-col h-full">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold uppercase tracking-wider text-neutral-100">
              Shopping Cart ({cart.reduce((s, i) => s + i.quantity, 0)})
            </h2>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            id="close-cart-drawer-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div className="bg-neutral-950/80 px-4 py-3 border-b border-neutral-800 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-neutral-300">
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              {freeShippingNeeded > 0 ? (
                <span>
                  Add <strong className="text-amber-400">{formatINR(freeShippingNeeded)}</strong> more for Free Shipping!
                </span>
              ) : (
                <span className="text-emerald-400 font-bold">You unlocked Free Express Shipping!</span>
              )}
            </div>
            <span className="text-neutral-400 font-mono text-[11px]">{freeShippingPercent}%</span>
          </div>
          <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full transition-all duration-300"
              style={{ width: `${freeShippingPercent}%` }}
            />
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400">
                <ShoppingBag className="w-8 h-8 text-neutral-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-200">Your Cart is Empty</h3>
                <p className="text-xs text-neutral-400 mt-1 max-w-xs">
                  Discover touring jackets, carbon gloves, and submersible luggage for your next cross-country expedition.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  setActiveView('CATALOG');
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider transition-colors"
              >
                Browse Riding Gear
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 flex gap-3 relative group"
              >
                {/* Image corresponding to selected color */}
                <img
                  src={item.selectedImage}
                  alt={item.name}
                  className="w-20 h-20 rounded-lg object-cover bg-neutral-900 shrink-0 border border-neutral-800"
                  referrerPolicy="no-referrer"
                />

                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div className="pr-6">
                    <h4 className="text-xs font-bold text-neutral-100 truncate">{item.name}</h4>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-neutral-400">
                      <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-amber-400 font-semibold">
                        {item.selectedColor}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 font-semibold">
                        Size: {item.selectedSize}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    {/* Quantity controls */}
                    <div className="flex items-center border border-neutral-800 rounded-lg bg-neutral-900">
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        className="p-1 text-neutral-400 hover:text-white"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-xs font-bold text-neutral-200">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        className="p-1 text-neutral-400 hover:text-white"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-black text-neutral-100">
                        {formatINR(item.price * item.quantity)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="absolute top-2.5 right-2.5 text-neutral-500 hover:text-red-400 p-1 transition-colors"
                  title="Remove item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer & Checkout Area */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-neutral-800 bg-neutral-950 space-y-3">
            {/* Coupon Code Form */}
            {appliedCoupon ? (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs">
                <div className="flex items-center gap-1.5 text-amber-400">
                  <Tag className="w-3.5 h-3.5" />
                  <span>
                    Coupon <strong>{appliedCoupon.code}</strong> applied (-{formatINR(cartDiscount)})
                  </span>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-[11px] text-neutral-400 hover:text-red-400 font-semibold"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="space-y-1">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Coupon code (e.g. TOURING10)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 uppercase font-mono focus:border-amber-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold rounded-lg transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {couponError && <div className="text-[11px] text-red-400 pl-1">{couponError}</div>}
              </form>
            )}

            {/* Financial Summary */}
            <div className="space-y-1.5 text-xs text-neutral-400 pt-1 border-t border-neutral-900">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-neutral-200 font-semibold">{formatINR(cartSubtotal)}</span>
              </div>
              {cartDiscount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Coupon Discount</span>
                  <span>-{formatINR(cartDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Charge</span>
                <span>
                  {cartShipping === 0 ? (
                    <span className="text-emerald-400 font-bold">FREE</span>
                  ) : (
                    formatINR(cartShipping)
                  )}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-neutral-500">
                <span>GST (18% inclusive)</span>
                <span>{formatINR(cartGst)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-neutral-100 pt-2 border-t border-neutral-800">
                <span>Grand Total</span>
                <span className="text-amber-400 text-base">{formatINR(cartTotal)}</span>
              </div>
            </div>

            {/* Checkout Action Button */}
            <button
              onClick={handleProceedCheckout}
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              id="cart-proceed-checkout-btn"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-400 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Razorpay / UPI / Cards 256-Bit SSL Encrypted</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
