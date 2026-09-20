import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  RotateCcw,
  Users,
  Tag,
  Sparkles,
  Settings,
  ArrowLeft,
  Shield,
  Menu,
  X,
  Truck,
  Globe,
  Image,
  CreditCard,
  UserCheck,
  LogOut,
  ExternalLink,
  Share2,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { DashboardTab } from './DashboardTab';
import { ProductsTab } from './ProductsTab';
import { OrdersTab } from './OrdersTab';
import { ReturnsTab } from './ReturnsTab';
import { CustomersTab } from './CustomersTab';
import { CouponsTab } from './CouponsTab';
import { AiAnalyticsTab } from './AiAnalyticsTab';
import { CompanySettingsTab } from './CompanySettingsTab';
import { ShippingSettingsTab } from './ShippingSettingsTab';
import { HomepageSettingsTab } from './HomepageSettingsTab';
import { MediaManagerTab } from './MediaManagerTab';
import { PaymentsTab } from './PaymentsTab';
import { UsersRolesTab } from './UsersRolesTab';
import { SocialMediaTab } from './SocialMediaTab';

export type AdminTab =
  | 'DASHBOARD'
  | 'PRODUCTS'
  | 'ORDERS'
  | 'RETURNS'
  | 'CUSTOMERS'
  | 'COUPONS'
  | 'SHIPPING'
  | 'HOMEPAGE'
  | 'MEDIA'
  | 'PAYMENTS'
  | 'SOCIAL'
  | 'ROLES'
  | 'ANALYTICS'
  | 'SETTINGS';

export const AdminLayout: React.FC = () => {
  const { setActiveView, storeSettings, currentUser, adminSession, adminLogout, navigate } = useStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('DASHBOARD');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeAdminName = adminSession?.name || 'Suraj Shahu (Super Admin)';
  const activeAdminRole = adminSession?.role || 'SUPER_ADMIN';
  const activeAdminEmail = adminSession?.email || 'skgsurajshahu317@gmail.com';

  const navItems = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'PRODUCTS', label: 'Products & Gear', icon: ShoppingBag },
    { id: 'ORDERS', label: 'Orders & Shipments', icon: Package },
    { id: 'RETURNS', label: 'Returns & Refunds', icon: RotateCcw },
    { id: 'CUSTOMERS', label: 'Riders & Customers', icon: Users },
    { id: 'COUPONS', label: 'Coupons & Promo', icon: Tag },
    { id: 'SHIPPING', label: 'Shipping & Logistics', icon: Truck },
    { id: 'HOMEPAGE', label: 'Homepage Settings', icon: Globe },
    { id: 'MEDIA', label: 'Media Manager', icon: Image },
    { id: 'PAYMENTS', label: 'Payments & Gateway', icon: CreditCard },
    { id: 'SOCIAL', label: 'Social & Channels', icon: Share2 },
    { id: 'ROLES', label: 'Team & Roles', icon: UserCheck },
    { id: 'ANALYTICS', label: 'AI Analytics', icon: Sparkles },
    { id: 'SETTINGS', label: 'Company & Brand', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col md:flex-row font-sans">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-neutral-900 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-black flex items-center justify-center font-black text-xs">
            {storeSettings.brandName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight">{storeSettings.brandName} Hub</span>
            <div className="text-[10px] text-amber-400 font-mono">SELLER & OPS PORTAL</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => adminLogout()}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-red-950/60 border border-red-850 text-red-400 flex items-center gap-1"
            title="Sign out of Admin Ops"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg bg-neutral-800 text-neutral-200"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar for Desktop */}
      <aside
        className={`w-full md:w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col justify-between shrink-0 ${
          mobileMenuOpen ? 'block' : 'hidden md:flex'
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="p-5 border-b border-neutral-800 hidden md:flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-black flex items-center justify-center font-black text-sm shadow-md">
                {storeSettings.brandName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-black text-sm uppercase tracking-wider text-white">
                  {storeSettings.brandName}
                </div>
                <div className="text-[10px] text-amber-400 font-bold uppercase tracking-widest flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5" />
                  <span>Seller & Ops Hub</span>
                </div>
              </div>
            </div>
          </div>

          {/* Nav items list */}
          <nav className="p-3 space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as AdminTab);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                      : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/60'
                  }`}
                  id={`admin-nav-${item.id.toLowerCase()}`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-neutral-800 space-y-3">
          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] space-y-1">
            <div className="text-neutral-400">Authenticated Admin:</div>
            <div className="font-bold text-neutral-200 flex items-center gap-1.5 truncate">
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              <span>{activeAdminName}</span>
            </div>
            <div className="text-[10px] font-mono text-neutral-400 truncate">
              {activeAdminEmail}
            </div>
            <div className="text-[10px] font-mono text-amber-400 uppercase">
              Clearance: {activeAdminRole}
            </div>
          </div>

          <div className="space-y-1.5">
            <button
              onClick={() => adminLogout()}
              className="w-full px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-900/50 text-red-300 hover:text-red-100 text-xs font-bold transition-colors flex items-center justify-center gap-2"
              id="admin-logout-btn"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span>Sign Out of Ops Hub</span>
            </button>

            <button
              onClick={() => navigate('/')}
              className="w-full px-3 py-1.5 rounded-xl bg-neutral-800/70 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <ExternalLink className="w-3 h-3" />
              <span>View Live Storefront</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {activeTab === 'DASHBOARD' && (
          <DashboardTab onNavigateTab={(tab) => setActiveTab(tab as AdminTab)} />
        )}
        {activeTab === 'PRODUCTS' && <ProductsTab />}
        {activeTab === 'ORDERS' && <OrdersTab />}
        {activeTab === 'RETURNS' && <ReturnsTab />}
        {activeTab === 'CUSTOMERS' && <CustomersTab />}
        {activeTab === 'COUPONS' && <CouponsTab />}
        {activeTab === 'SHIPPING' && <ShippingSettingsTab />}
        {activeTab === 'HOMEPAGE' && <HomepageSettingsTab />}
        {activeTab === 'MEDIA' && <MediaManagerTab />}
        {activeTab === 'PAYMENTS' && <PaymentsTab />}
        {activeTab === 'SOCIAL' && <SocialMediaTab />}
        {activeTab === 'ROLES' && <UsersRolesTab />}
        {activeTab === 'ANALYTICS' && <AiAnalyticsTab />}
        {activeTab === 'SETTINGS' && <CompanySettingsTab />}
      </main>
    </div>
  );
};
