'use client';

import React, { useState } from 'react';
import { FirebaseProvider } from './context/FirebaseContext';
import { StoreProvider, useStore } from './context/StoreContext';
import { Navbar } from './components/storefront/Navbar';
import { Footer } from './components/storefront/Footer';
import { Hero } from './components/storefront/Hero';
import { CategoryShowcase } from './components/storefront/CategoryShowcase';
import { ProductCard } from './components/storefront/ProductCard';
import { ProductDetailModal } from './components/storefront/ProductDetailModal';
import { CartDrawer } from './components/storefront/CartDrawer';
import { CheckoutView } from './components/storefront/CheckoutView';
import { OrderTrackingModal } from './components/storefront/OrderTrackingModal';
import { CustomerAccountView } from './components/storefront/CustomerAccountView';
import { CatalogView } from './components/storefront/CatalogView';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminLogin } from './components/auth/AdminLogin';
import { CustomerLoginModal } from './components/auth/CustomerLoginModal';
import { FloatingWhatsApp } from './components/storefront/FloatingWhatsApp';
import { Product } from './types';
import {
  ShieldCheck,
  Award,
  Truck,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  CheckCircle2,
  AlertCircle,
  Info,
  Lock,
  X,
} from 'lucide-react';

const AppContent: React.FC = () => {
  const {
    activeView,
    setActiveView,
    currentPath,
    products,
    setSelectedCategory,
    toastMessage,
    toastType,
    storeSettings,
    adminSession,
    isCustomerAuthModalOpen,
    setIsCustomerAuthModalOpen,
    adminAccessDeniedNotice,
    setAdminAccessDeniedNotice,
    navigate,
    currentUser,
  } = useStore();

  const [inspectingProduct, setInspectingProduct] = useState<Product | null>(null);

  // 1. ISOLATED ADMIN PORTAL LOGIN ROUTE: /admin/login
  const isAtAdminLogin =
    activeView === 'ADMIN_LOGIN' ||
    currentPath === '/admin/login' ||
    (typeof window !== 'undefined' && window.location.pathname === '/admin/login');

  if (isAtAdminLogin) {
    return (
      <>
        <AdminLogin />
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-[9999] max-w-sm w-full">
            <div
              className={`p-4 rounded-2xl shadow-2xl border flex items-center gap-3 text-xs font-bold ${
                toastType === 'error'
                  ? 'bg-red-950 text-red-200 border-red-800'
                  : toastType === 'info'
                  ? 'bg-blue-950 text-blue-200 border-blue-800'
                  : 'bg-emerald-950 text-emerald-200 border-emerald-800'
              }`}
            >
              {toastType === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              ) : toastType === 'info' ? (
                <Info className="w-5 h-5 text-blue-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              )}
              <span>{toastMessage}</span>
            </div>
          </div>
        )}
      </>
    );
  }

  // 2. PROTECTED ADMIN DASHBOARD ROUTE: /admin/dashboard or /admin
  // Strictly restricted to registered administrator: skgsurajshahu317@gmail.com
  const isAtAdminDashboard =
    activeView === 'ADMIN' ||
    currentPath === '/admin' ||
    currentPath.startsWith('/admin/dashboard') ||
    (typeof window !== 'undefined' && (window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/dashboard')));

  const isAuthorizedAdmin =
    Boolean(adminSession) &&
    adminSession?.email?.trim().toLowerCase() === 'skgsurajshahu317@gmail.com' &&
    (adminSession?.role === 'ADMIN' || adminSession?.role === 'SUPER_ADMIN');

  if (isAtAdminDashboard) {
    if (!isAuthorizedAdmin) {
      return (
        <>
          <AdminLogin accessDeniedMessage="Access Denied: The Admin Panel is strictly restricted to registered administrator skgsurajshahu317@gmail.com. No other account is permitted access." />
          {toastMessage && (
            <div className="fixed bottom-6 right-6 z-[9999] max-w-sm w-full">
              <div
                className={`p-4 rounded-2xl shadow-2xl border flex items-center gap-3 text-xs font-bold ${
                  toastType === 'error'
                    ? 'bg-red-950 text-red-200 border-red-800'
                    : toastType === 'info'
                    ? 'bg-blue-950 text-blue-200 border-blue-800'
                    : 'bg-emerald-950 text-emerald-200 border-emerald-800'
                }`}
              >
                {toastType === 'error' ? (
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                ) : toastType === 'info' ? (
                  <Info className="w-5 h-5 text-blue-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                )}
                <span>{toastMessage}</span>
              </div>
            </div>
          )}
        </>
      );
    }

    return (
      <>
        <AdminLayout />
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-[9999] max-w-sm w-full">
            <div
              className={`p-4 rounded-2xl shadow-2xl border flex items-center gap-3 text-xs font-bold ${
                toastType === 'error'
                  ? 'bg-red-950 text-red-200 border-red-800'
                  : toastType === 'info'
                  ? 'bg-blue-950 text-blue-200 border-blue-800'
                  : 'bg-emerald-950 text-emerald-200 border-emerald-800'
              }`}
            >
              {toastType === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              ) : toastType === 'info' ? (
                <Info className="w-5 h-5 text-blue-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              )}
              <span>{toastMessage}</span>
            </div>
          </div>
        )}
      </>
    );
  }

  // Featured items for Homepage
  const featuredJackets = products.filter(
    (p) => p.category === 'Riding Jackets' || p.category === 'Full Rain Suits'
  ).slice(0, 4);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Access Denied Warning for Customers trying to enter /admin */}
      {adminAccessDeniedNotice && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5 text-xs text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Access Restricted:</strong> {adminAccessDeniedNotice}
            </span>
            <button
              onClick={() => navigate('/admin/login')}
              className="underline font-bold text-amber-400 hover:text-white ml-2"
            >
              Go to Admin Login →
            </button>
          </div>
          <button
            onClick={() => setAdminAccessDeniedNotice(null)}
            className="text-neutral-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Store Navigation Bar */}
      <Navbar />

      {/* Main Content Router */}
      <main className="flex-1">
        {activeView === 'HOME' && (
          <div className="space-y-16 pb-16">
            {/* 1. Hero Landing Banner */}
            <Hero onExplore={() => setActiveView('CATALOG')} />

            {/* 2. Brand Value Pillars */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl bg-neutral-900/60 border border-neutral-850">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                      CE Level 2 Armor
                    </h4>
                    <p className="text-[11px] text-neutral-400">EN1621 Certified</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                      Express Shipping
                    </h4>
                    <p className="text-[11px] text-neutral-400">All India Coverage</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                      Easy Size Exchange
                    </h4>
                    <p className="text-[11px] text-neutral-400">7-Day Rider Guarantee</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                      100% Weatherproof
                    </h4>
                    <p className="text-[11px] text-neutral-400">Tested in Monsoons</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Category Showcase Grid */}
            <CategoryShowcase
              onSelectCategory={(cat) => {
                setSelectedCategory(cat);
                setActiveView('CATALOG');
              }}
            />

            {/* 4. Featured Flagship Gear */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                    Engineered for Highway & Track
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-100 mt-1">
                    Featured Riding Protection
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setActiveView('CATALOG');
                  }}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 uppercase tracking-wider group"
                >
                  <span>Explore Full Collection</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredJackets.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onOpenDetail={(p) => setInspectingProduct(p)}
                  />
                ))}
              </div>
            </div>

            {/* 5. Technical Protection Engineering Showcase */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="p-8 sm:p-12 rounded-3xl bg-neutral-900 border border-neutral-800 relative overflow-hidden">
                <div className="max-w-xl space-y-4 relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold uppercase tracking-wider">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Armor & Fabric Architecture</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight leading-tight">
                    Tested for abrasion resistance and thermal endurance.
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                    Every piece of {storeSettings.brandName} apparel uses heavy denier ballistic Cordura,
                    double-stitched stress zones, and Knox or D3O CE Level 2 viscoelastic armor that remains
                    flexible while riding and hardens instantaneously upon impact.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => setActiveView('CATALOG')}
                      className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold uppercase text-xs tracking-wider transition-colors shadow-lg shadow-amber-500/20"
                    >
                      Shop Impact Protected Gear
                    </button>
                  </div>
                </div>

                {/* Subtle visual accent */}
                <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none hidden lg:block" />
              </div>
            </div>
          </div>
        )}

        {activeView === 'CATALOG' && (
          <CatalogView onOpenDetail={(p) => setInspectingProduct(p)} />
        )}

        {activeView === 'ACCOUNT' && <CustomerAccountView />}

        {activeView === 'CHECKOUT' && <CheckoutView />}
      </main>

      {/* Global Overlays & Modals */}
      <CartDrawer onOpenDetail={(p) => setInspectingProduct(p)} />
      <OrderTrackingModal />
      <CustomerLoginModal
        isOpen={isCustomerAuthModalOpen}
        onClose={() => setIsCustomerAuthModalOpen(false)}
      />
      {inspectingProduct && (
        <ProductDetailModal
          product={inspectingProduct}
          onClose={() => setInspectingProduct(null)}
        />
      )}

      {/* Floating WhatsApp Quick Support */}
      <FloatingWhatsApp />

      {/* Footer */}
      <Footer />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[9999] max-w-sm w-full">
          <div
            className={`p-4 rounded-2xl shadow-2xl border flex items-center gap-3 text-xs font-bold ${
              toastType === 'error'
                ? 'bg-red-950 text-red-200 border-red-800'
                : toastType === 'info'
                ? 'bg-blue-950 text-blue-200 border-blue-800'
                : 'bg-emerald-950 text-emerald-200 border-emerald-800'
            }`}
          >
            {toastType === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            ) : toastType === 'info' ? (
              <Info className="w-5 h-5 text-blue-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <FirebaseProvider>
      <StoreProvider>
        <AppContent />
      </StoreProvider>
    </FirebaseProvider>
  );
}
