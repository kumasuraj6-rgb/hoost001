import React, { useState } from 'react';
import {
  Shield,
  ShoppingBag,
  Heart,
  User,
  Search,
  Menu,
  X,
  PhoneCall,
  ChevronDown,
  Truck,
  Sparkles,
  LogOut,
  LogIn,
  Package,
  Instagram,
  Youtube,
  MessageSquare,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../utils/currency';
import { ALLOWED_CATEGORIES } from '../../types';

export const Navbar: React.FC = () => {
  const {
    storeSettings,
    cart,
    wishlist,
    currentUser,
    customerLogout,
    setIsCustomerAuthModalOpen,
    activeView,
    setActiveView,
    searchQuery,
    setSearchQuery,
    setSelectedCategory,
    setIsCartOpen,
    navigate,
  } = useStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  const [authDropdownOpen, setAuthDropdownOpen] = useState(false);

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const isGuest = !currentUser || currentUser.customerId === 'guest' || currentUser.name === 'Guest Rider';

  const handleCategoryClick = (cat: string) => {
    setSelectedCategory(cat);
    setActiveView('CATALOG');
    setCategoriesDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800">
      {/* Top Notification / Announcement Bar */}
      {storeSettings.homepage?.showAnnouncementBar !== false && (
        <div className="bg-neutral-900 border-b border-neutral-800/80 py-1.5 px-4 text-xs font-medium text-neutral-300">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-semibold text-[10px] tracking-wide uppercase border border-amber-500/30">
                Official Store
              </span>
              <span className="text-neutral-300">
                {storeSettings.homepage?.announcementBarText ||
                  `Free Express Delivery on all riding gear orders above ${formatINR(storeSettings.freeShippingThreshold || 1999)} across India`}
              </span>
            </div>
            <div className="flex items-center gap-4 text-neutral-400 text-xs">
              <a
                href={`tel:${storeSettings.phone}`}
                className="hidden md:flex items-center gap-1.5 hover:text-amber-400 transition-colors"
              >
                <PhoneCall className="w-3 h-3 text-amber-500" />
                <span>{storeSettings.phone}</span>
              </a>

              {storeSettings.socialHeaderDisplay !== false && (
                <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-neutral-800">
                  {storeSettings.instagram && (
                    <a
                      href={storeSettings.instagram}
                      target="_blank"
                      rel="noreferrer"
                      className="text-neutral-400 hover:text-pink-400 transition-colors"
                      title="Follow on Instagram"
                      id="navbar-social-instagram"
                    >
                      <Instagram className="w-3 h-3" />
                    </a>
                  )}
                  {storeSettings.youtube && (
                    <a
                      href={storeSettings.youtube}
                      target="_blank"
                      rel="noreferrer"
                      className="text-neutral-400 hover:text-red-400 transition-colors"
                      title="Watch on YouTube"
                      id="navbar-social-youtube"
                    >
                      <Youtube className="w-3 h-3" />
                    </a>
                  )}
                  {storeSettings.whatsapp && (
                    <a
                      href={`https://wa.me/${(storeSettings.whatsapp || '').replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-neutral-400 hover:text-emerald-400 transition-colors"
                      title="WhatsApp Support"
                      id="navbar-social-whatsapp"
                    >
                      <MessageSquare className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-neutral-500">|</span>
                <span className="text-neutral-400">100% Verified CE Level 2 Armor</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-4">
          {/* Logo & Brand Identity (Dynamic from storeSettings) */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSearchQuery('');
                setActiveView('HOME');
              }}
              className="flex items-center gap-2.5 text-left group"
              id="brand-logo-btn"
            >
              {storeSettings.brandLogo ? (
                <img
                  src={storeSettings.brandLogo}
                  alt={storeSettings.brandName}
                  className="h-10 w-10 object-cover rounded-lg border border-neutral-700 group-hover:border-amber-500 transition-colors"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-amber-500 text-black flex items-center justify-center font-black text-lg">
                  <Shield className="w-6 h-6" />
                </div>
              )}
              <div>
                <div className="text-lg font-black tracking-wider uppercase text-neutral-100 group-hover:text-amber-400 transition-colors">
                  {storeSettings.brandName}
                </div>
                <div className="text-[10px] tracking-wider text-neutral-400 font-medium uppercase truncate max-w-[170px] sm:max-w-xs">
                  {storeSettings.brandTagline || 'Riding Gear & Luggage'}
                </div>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => {
                setSelectedCategory(null);
                setActiveView('HOME');
              }}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === 'HOME'
                  ? 'text-amber-400 bg-neutral-900'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-900/60'
              }`}
            >
              Home
            </button>

            {/* Categories Dropdown */}
            <div className="relative">
              <button
                onClick={() => setCategoriesDropdownOpen(!categoriesDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-900/60 transition-colors"
                id="nav-categories-btn"
              >
                <span>Gear Categories</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${categoriesDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {categoriesDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 rounded-xl bg-neutral-900 border border-neutral-800 shadow-2xl p-2 z-50">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 px-3 py-1.5">
                    Authorized Gear Only
                  </div>
                  <div className="max-h-80 overflow-y-auto space-y-0.5">
                    {ALLOWED_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => handleCategoryClick(cat)}
                        className="w-full text-left px-3 py-2 text-sm text-neutral-200 hover:text-amber-400 hover:bg-neutral-800/80 rounded-lg transition-colors flex items-center justify-between"
                      >
                        <span>{cat}</span>
                        {cat.includes('Rain') && (
                          <span className="text-[10px] bg-blue-950 text-blue-400 px-1.5 py-0.5 rounded border border-blue-800">
                            Rain
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setSelectedCategory(null);
                setActiveView('CATALOG');
              }}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === 'CATALOG'
                  ? 'text-amber-400 bg-neutral-900'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-900/60'
              }`}
            >
              All Gear
            </button>

            <button
              onClick={() => handleCategoryClick('Full Rain Suits')}
              className="px-3 py-2 rounded-md text-sm font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-950/40 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Monsoon Gear</span>
            </button>

            <button
              onClick={() => handleCategoryClick('Tail Bags')}
              className="px-3 py-2 rounded-md text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-900/60 transition-colors"
            >
              Touring Luggage
            </button>
          </nav>

          {/* Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-xs relative">
            <Search className="w-4 h-4 absolute left-3 text-neutral-400" />
            <input
              type="text"
              placeholder="Search jackets, gloves, bags..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeView !== 'CATALOG') setActiveView('CATALOG');
              }}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
              id="global-search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-neutral-400 hover:text-white text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Right Action Icons & Role Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Wishlist */}
            <button
              onClick={() => setActiveView('ACCOUNT')}
              className="relative p-2 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors"
              title="Wishlist"
              id="nav-wishlist-btn"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Cart Drawer Toggle */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-200 hover:border-amber-500/50 hover:text-amber-400 transition-colors flex items-center gap-2"
              title="Shopping Cart"
              id="nav-cart-btn"
            >
              <ShoppingBag className="w-5 h-5 text-amber-500" />
              <span className="hidden sm:inline text-xs font-semibold">
                {totalCartItems > 0 ? `${totalCartItems} items` : 'Cart'}
              </span>
              {totalCartItems > 0 && (
                <span className="w-5 h-5 bg-amber-500 text-black text-xs font-extrabold rounded-full flex items-center justify-center">
                  {totalCartItems}
                </span>
              )}
            </button>

            {/* Customer Account / Auth */}
            {isGuest ? (
              <button
                onClick={() => setIsCustomerAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition-colors shadow-sm"
                id="customer-signin-btn"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setAuthDropdownOpen(!authDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors text-xs text-neutral-300"
                  id="customer-account-menu-btn"
                >
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-xs">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-semibold text-neutral-200 truncate max-w-[90px]">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] text-neutral-400 font-medium">
                      Rider Account
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                </button>

                {authDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="p-3 border-b border-neutral-800/80">
                      <div className="text-xs font-bold text-neutral-100">{currentUser.name}</div>
                      <div className="text-[11px] text-neutral-400 truncate">{currentUser.email}</div>
                      <div className="mt-1.5 inline-flex items-center gap-1 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Shield className="w-2.5 h-2.5" />
                        <span>Verified Rider</span>
                      </div>
                    </div>

                    <div className="py-1.5 space-y-0.5 text-xs">
                      <button
                        onClick={() => {
                          navigate('/account/orders');
                          setAuthDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-neutral-200 hover:bg-neutral-800/80 rounded-xl flex items-center gap-2.5 transition-colors"
                        id="nav-customer-orders-btn"
                      >
                        <Package className="w-4 h-4 text-amber-400" />
                        <span>My Orders & Tracking</span>
                      </button>

                      <button
                        onClick={() => {
                          navigate('/account');
                          setAuthDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-neutral-200 hover:bg-neutral-800/80 rounded-xl flex items-center gap-2.5 transition-colors"
                        id="nav-customer-profile-btn"
                      >
                        <User className="w-4 h-4 text-neutral-400" />
                        <span>Rider Profile & Addresses</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsCartOpen(true);
                          setAuthDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-neutral-200 hover:bg-neutral-800/80 rounded-xl flex items-center justify-between transition-colors"
                        id="nav-customer-cart-btn"
                      >
                        <div className="flex items-center gap-2.5">
                          <ShoppingBag className="w-4 h-4 text-neutral-400" />
                          <span>Shopping Cart</span>
                        </div>
                        {totalCartItems > 0 && (
                          <span className="text-[10px] font-bold bg-amber-500 text-black px-1.5 py-0.5 rounded-full">
                            {totalCartItems}
                          </span>
                        )}
                      </button>
                    </div>

                    <div className="pt-1.5 border-t border-neutral-800/80">
                      <button
                        onClick={() => {
                          customerLogout();
                          setAuthDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-950/40 rounded-xl flex items-center gap-2.5 transition-colors"
                        id="customer-logout-btn"
                      >
                        <LogOut className="w-4 h-4 text-red-400" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-900"
              id="mobile-menu-btn"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-neutral-800 bg-neutral-950 p-4 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
            <input
              type="text"
              placeholder="Search gear..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setActiveView('CATALOG');
              }}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-sm text-neutral-100"
            />
          </div>

          <div className="space-y-1">
            <button
              onClick={() => {
                setSelectedCategory(null);
                navigate('/');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-neutral-200 hover:bg-neutral-900"
            >
              Home
            </button>
            <button
              onClick={() => {
                setSelectedCategory(null);
                navigate('/catalog');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-neutral-200 hover:bg-neutral-900"
            >
              All Riding Gear
            </button>
            <button
              onClick={() => {
                if (isGuest) {
                  setIsCustomerAuthModalOpen(true);
                } else {
                  navigate('/account/orders');
                }
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-neutral-200 hover:bg-neutral-900 flex items-center justify-between"
            >
              <span>My Orders & Account</span>
              <Package className="w-4 h-4 text-amber-400" />
            </button>
            {isGuest ? (
              <button
                onClick={() => {
                  setIsCustomerAuthModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 flex items-center justify-between"
              >
                <span>Rider Sign In / Register</span>
                <LogIn className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => {
                  customerLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-950/30 flex items-center justify-between"
              >
                <span>Sign Out ({currentUser.name})</span>
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="pt-2 border-t border-neutral-800">
            <div className="text-xs font-semibold text-neutral-400 uppercase mb-2">Categories</div>
            <div className="grid grid-cols-2 gap-1.5">
              {ALLOWED_CATEGORIES.slice(0, 8).map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className="text-left text-xs text-neutral-300 p-2 rounded bg-neutral-900/60 hover:bg-neutral-800 truncate"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
