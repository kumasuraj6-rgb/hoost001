import React from 'react';
import {
  TrendingUp,
  Package,
  ShoppingBag,
  AlertTriangle,
  RotateCcw,
  Shield,
  ArrowUpRight,
  Truck,
  CheckCircle2,
  Share2,
  MessageSquare,
  Globe,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../utils/currency';
import { ExportDataButton } from './ExportDataButton';

interface DashboardTabProps {
  onNavigateTab: (tab: any) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ onNavigateTab }) => {
  const { products, orders, returns, storeSettings } = useStore();

  // Calculate live numbers
  const totalRevenue = orders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalOrders = orders.length;
  const lowStockProducts = products.filter((p) => p.stock <= p.lowStockThreshold);
  const pendingReturns = returns.filter(
    (r) => r.status !== 'REFUND_COMPLETED' && r.status !== 'REJECTED'
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-neutral-900 to-neutral-950 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-amber-500">
            Operations & Performance Dashboard
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-neutral-100 uppercase tracking-tight mt-1">
            {storeSettings.brandName} Control Center
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Real-time catalog inventory, order fulfillment, and logistics telemetry.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ExportDataButton variant="full" />
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Storefront Online</span>
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Revenue */}
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Total Sales</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-neutral-100 font-mono">
            {formatINR(totalRevenue)}
          </div>
          <div className="text-[11px] text-neutral-400 flex items-center gap-1">
            <span>From {totalOrders} placed orders</span>
          </div>
        </div>

        {/* 2. Total Orders */}
        <div
          onClick={() => onNavigateTab('ORDERS')}
          className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2 cursor-pointer hover:border-neutral-700 transition-colors"
        >
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Orders</span>
            <Package className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-neutral-100 font-mono">{totalOrders}</div>
          <div className="text-[11px] text-amber-400 flex items-center gap-1">
            <span>Manage dispatch & logistics →</span>
          </div>
        </div>

        {/* 3. Catalog Gear Units */}
        <div
          onClick={() => onNavigateTab('PRODUCTS')}
          className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2 cursor-pointer hover:border-neutral-700 transition-colors"
        >
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Active Gear Items</span>
            <ShoppingBag className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-neutral-100 font-mono">{products.length}</div>
          <div className="text-[11px] text-neutral-400">100% compliant with riding guidelines</div>
        </div>

        {/* 4. Critical Alerts */}
        <div
          onClick={() => onNavigateTab('PRODUCTS')}
          className={`p-5 rounded-2xl border space-y-2 cursor-pointer transition-colors ${
            lowStockProducts.length > 0
              ? 'bg-amber-950/20 border-amber-800/80 text-amber-300'
              : 'bg-neutral-900 border-neutral-800 text-neutral-400'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wider">Low Stock Warnings</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black font-mono">
            {lowStockProducts.length} Items
          </div>
          <div className="text-[11px]">
            {lowStockProducts.length > 0 ? 'Requires immediate warehouse restock' : 'All stock levels healthy'}
          </div>
        </div>
      </div>

      {/* Quick Ops & Channel Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Social Channels Card */}
        <div
          onClick={() => onNavigateTab('SOCIAL')}
          className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 transition-all cursor-pointer group flex flex-col justify-between"
          id="dashboard-social-channels-card"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" />
                <span>Social Media & Links</span>
              </span>
              <ArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-amber-400 transition-colors" />
            </div>
            <div className="text-sm font-bold text-neutral-100">
              Instagram, YouTube & WhatsApp
            </div>
            <p className="text-[11px] text-neutral-400 leading-snug">
              Link official profiles, toggle footer and header visibility, and test direct rider chat.
            </p>
          </div>
          <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-[10px] text-neutral-400">
            <span className="text-emerald-400 font-mono">
              {storeSettings.enableFloatingWhatsApp !== false ? '• WhatsApp Widget Active' : '• Widget Disabled'}
            </span>
            <span className="text-amber-400 font-medium group-hover:underline">Manage Channels →</span>
          </div>
        </div>

        {/* Shipping & Delivery Card */}
        <div
          onClick={() => onNavigateTab('SHIPPING')}
          className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 transition-all cursor-pointer group flex flex-col justify-between"
          id="dashboard-shipping-card"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" />
                <span>Shipping & Logistics</span>
              </span>
              <ArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-amber-400 transition-colors" />
            </div>
            <div className="text-sm font-bold text-neutral-100">
              India Delivery & Free Threshold
            </div>
            <p className="text-[11px] text-neutral-400 leading-snug">
              Complimentary shipping above {formatINR(storeSettings.freeShippingThreshold || 2499)}.
            </p>
          </div>
          <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-[10px] text-neutral-400">
            <span className="text-neutral-400">Delhivery, BlueDart, Blr</span>
            <span className="text-amber-400 font-medium group-hover:underline">Edit Shipping →</span>
          </div>
        </div>

        {/* Brand & Storefront Card */}
        <div
          onClick={() => onNavigateTab('SETTINGS')}
          className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 transition-all cursor-pointer group flex flex-col justify-between"
          id="dashboard-brand-settings-card"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                <span>Brand & Storefront Hub</span>
              </span>
              <ArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-amber-400 transition-colors" />
            </div>
            <div className="text-sm font-bold text-neutral-100">
              GSTIN, Invoicing & Company Info
            </div>
            <p className="text-[11px] text-neutral-400 leading-snug">
              GSTIN: {storeSettings.gstin} | PAN: {storeSettings.pan}
            </p>
          </div>
          <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-[10px] text-neutral-400">
            <span className="text-emerald-400 font-mono">• 18% Standard GST</span>
            <span className="text-amber-400 font-medium group-hover:underline">Edit Info →</span>
          </div>
        </div>
      </div>
      {lowStockProducts.length > 0 && (
        <div className="p-5 rounded-2xl bg-neutral-900 border border-amber-800/50 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Inventory Threshold Alert</span>
            </div>
            <button
              onClick={() => onNavigateTab('PRODUCTS')}
              className="text-amber-400 hover:underline font-semibold"
            >
              View in Product Manager
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockProducts.map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs"
              >
                <div className="truncate pr-2">
                  <div className="font-bold text-neutral-200 truncate">{p.name}</div>
                  <div className="text-[11px] text-neutral-500 font-mono">SKU: {p.sku}</div>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                      p.stock === 0 ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {p.stock} units left
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders Overview */}
      <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-200">
            Recent Customer Orders
          </h3>
          <button
            onClick={() => onNavigateTab('ORDERS')}
            className="text-xs text-amber-400 hover:underline font-semibold"
          >
            View All ({orders.length}) →
          </button>
        </div>

        <div className="divide-y divide-neutral-800">
          {orders.slice(0, 5).map((ord) => (
            <div
              key={ord.id}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center font-mono font-bold text-neutral-300">
                  #{ord.orderNumber.slice(-3)}
                </div>
                <div>
                  <div className="font-bold text-neutral-100">{ord.customerName}</div>
                  <div className="text-[11px] text-neutral-400">
                    {ord.items.length} items • {formatINR(ord.grandTotal)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-neutral-800 text-amber-400 border border-neutral-700">
                  {ord.orderStatus.replace(/_/g, ' ')}
                </span>
                <span className="text-[11px] font-mono text-neutral-400">
                  {new Date(ord.createdAt).toLocaleDateString('en-IN')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
