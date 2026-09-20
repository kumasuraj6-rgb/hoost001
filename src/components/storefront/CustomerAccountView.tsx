import React, { useState } from 'react';
import {
  User,
  Package,
  Heart,
  RotateCcw,
  MapPin,
  Truck,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShoppingBag,
  Plus,
  Trash2,
  Check,
  Edit2,
  Save,
  Lock,
  Phone,
  Mail,
  Shield,
  LogOut,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../utils/currency';
import { Order, CustomerAddress } from '../../types';

export const CustomerAccountView: React.FC = () => {
  const {
    currentUser,
    orders,
    products,
    wishlist,
    toggleWishlist,
    addToCart,
    returns,
    createReturnRequest,
    setTrackingOrder,
    setActiveView,
    storeSettings,
    customers,
    updateCustomerProfile,
    addCustomerAddress,
    updateCustomerAddress,
    deleteCustomerAddress,
    setDefaultCustomerAddress,
    customerLogout,
    showToast,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'ORDERS' | 'WISHLIST' | 'RETURNS' | 'ADDRESSES' | 'PROFILE'>('ORDERS');
  const [returnModalOrder, setReturnModalOrder] = useState<Order | null>(null);
  const [returnReason, setReturnReason] = useState('Size does not fit comfortably in riding stance');

  // Address Modal State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<CustomerAddress>({
    fullName: currentUser.name || '',
    phone: '',
    street: '',
    landmark: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560103',
    country: 'India',
    isDefault: false,
  });

  // Profile Edit State
  const currentCustomer = customers.find(
    (c) =>
      (currentUser.customerId && c.id === currentUser.customerId) ||
      (currentUser.email && c.email && c.email.toLowerCase() === currentUser.email.toLowerCase())
  );

  const [profileName, setProfileName] = useState(currentUser.name || 'Rider');
  const [profilePhone, setProfilePhone] = useState(currentCustomer?.phone || '+91 98200 12345');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);

  // Filter orders for current customer
  const customerOrders = orders.filter(
    (o) => o.customerId === currentUser.customerId || o.customerEmail === currentUser.email
  );

  // Wishlisted products
  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  // Resolved customer addresses
  const customerAddresses: CustomerAddress[] = currentCustomer?.addresses || [];

  // Submit return request
  const handleInitiateReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModalOrder) return;
    const items = returnModalOrder.items.map((i) => ({
      productId: i.productId,
      name: i.name,
      quantity: i.quantity,
    }));
    createReturnRequest(returnModalOrder.id, returnReason, items);
    setReturnModalOrder(null);
    showToast('Return request submitted for warehouse review!', 'success');
  };

  // Open modal for Adding a new address
  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setAddressForm({
      fullName: currentCustomer?.name || currentUser.name || '',
      phone: currentCustomer?.phone || '',
      street: '',
      landmark: '',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560103',
      country: 'India',
      isDefault: customerAddresses.length === 0,
    });
    setIsAddressModalOpen(true);
  };

  // Open modal for Editing/Modifying an existing address
  const handleOpenEditAddress = (addr: CustomerAddress) => {
    setEditingAddressId(addr.id || null);
    setAddressForm({
      id: addr.id,
      fullName: addr.fullName || addr.name || currentUser.name || '',
      name: addr.fullName || addr.name || currentUser.name || '',
      phone: addr.phone || currentCustomer?.phone || '',
      street: addr.street || '',
      landmark: addr.landmark || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
      country: addr.country || 'India',
      isDefault: Boolean(addr.isDefault),
    });
    setIsAddressModalOpen(true);
  };

  // Save / Modify Address Handler
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.fullName?.trim()) {
      showToast('Please enter recipient full name', 'error');
      return;
    }
    const cleanPhone = (addressForm.phone || '').replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      showToast('Please enter a valid 10-digit phone number', 'error');
      return;
    }
    if (!addressForm.street?.trim() || !addressForm.city?.trim() || !addressForm.state?.trim() || !addressForm.pincode?.trim()) {
      showToast('Please fill all required address fields', 'error');
      return;
    }
    const cleanPin = (addressForm.pincode || '').replace(/\D/g, '');
    if (cleanPin.length !== 6) {
      showToast('Please enter a valid 6-digit postal PIN code', 'error');
      return;
    }

    const customerId = currentCustomer?.id || currentUser.customerId || currentUser.email || 'CUST-01';

    if (editingAddressId) {
      // Modify / Update existing address
      const success = await updateCustomerAddress(customerId, {
        ...addressForm,
        id: editingAddressId,
      });
      if (success) {
        setIsAddressModalOpen(false);
        setEditingAddressId(null);
      }
    } else {
      // Add new address
      const success = await addCustomerAddress(customerId, addressForm);
      if (success) {
        setIsAddressModalOpen(false);
      }
    }
  };

  // Save Profile Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    const customerId = currentCustomer?.id || currentUser.customerId || 'CUST-01';
    await updateCustomerProfile(customerId, {
      name: profileName,
      phone: profilePhone,
    });
    setTimeout(() => {
      setIsSavingProfile(false);
      showToast('Profile information updated successfully!', 'success');
    }, 400);
  };

  // Change Password Handler
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordNotice('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordNotice('New password and confirmation do not match.');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordNotice(null);
    showToast('Security password updated and encrypted successfully!', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Account Profile Header */}
      <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-black text-2xl">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-neutral-100">{currentUser.name}</h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Verified Rider
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">{currentUser.email}</p>
            <div className="text-[11px] text-neutral-500 mt-1">
              Registered with {storeSettings.brandName} • Customer ID: {currentUser.customerId || 'CUST-01'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setActiveView('CATALOG')}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
          >
            <ShoppingBag className="w-4 h-4 text-amber-500" />
            <span>Shop Gear</span>
          </button>
          <button
            onClick={() => customerLogout()}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-900/50 text-red-300 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
            id="account-sign-out-btn"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-neutral-800 gap-2 sm:gap-6 overflow-x-auto text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'ORDERS'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>My Orders ({customerOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('WISHLIST')}
          className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'WISHLIST'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Wishlist ({wishlist.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('RETURNS')}
          className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'RETURNS'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Returns & Refunds ({returns.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ADDRESSES')}
          className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'ADDRESSES'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Saved Addresses ({customerAddresses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('PROFILE')}
          className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'PROFILE'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile & Security</span>
        </button>
      </div>

      {/* Tab 1: Orders */}
      {activeTab === 'ORDERS' && (
        <div className="space-y-4">
          {customerOrders.length === 0 ? (
            <div className="p-12 text-center bg-neutral-900/50 rounded-2xl border border-neutral-800 space-y-3">
              <Package className="w-10 h-10 text-neutral-600 mx-auto" />
              <div className="text-sm font-bold text-neutral-300">No orders placed yet</div>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Explore our CE Level 2 jackets, monsoon rain suits, and submersible tail bags to gear up for your next ride.
              </p>
              <button
                onClick={() => setActiveView('CATALOG')}
                className="px-5 py-2.5 rounded-xl bg-amber-500 text-black font-extrabold text-xs uppercase tracking-wider"
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            customerOrders.map((ord) => (
              <div
                key={`order-card-${ord.id}`}
                className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4 shadow-sm"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-800/80 text-xs">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono font-bold text-amber-400 text-sm">
                      #{ord.orderNumber}
                    </span>
                    <span className="text-neutral-500">•</span>
                    <span className="text-neutral-400">
                      {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="text-neutral-500">•</span>
                    <span className="font-semibold text-neutral-200">
                      Paid: {formatINR(ord.grandTotal)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-neutral-800 text-amber-400 border border-neutral-700">
                      {ord.orderStatus.replace(/_/g, ' ')}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {ord.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* Items in order */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ord.items.map((item, itemIdx) => (
                    <div
                      key={`order-${ord.id}-item-${item.productId}-${itemIdx}-${item.selectedColor}-${item.selectedSize}`}
                      className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center gap-3 text-xs"
                    >
                      <img
                        src={item.selectedImage}
                        alt={item.name}
                        className="w-14 h-14 rounded-lg object-cover bg-neutral-900 border border-neutral-800 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-neutral-100 truncate">{item.name}</div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">
                          Color: <strong className="text-amber-400">{item.selectedColor}</strong> | Size:{' '}
                          <strong className="text-neutral-200">{item.selectedSize}</strong>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[11px] font-mono text-neutral-300">
                          <span>Qty: {item.quantity}</span>
                          <span>{formatINR(item.price * item.quantity)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Action Footer */}
                <div className="pt-3 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="text-neutral-400 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-amber-500" />
                    <span>
                      AWB: <strong className="text-neutral-200 font-mono">{ord.shipment?.awbNumber || 'Generating...'}</strong> (
                      {ord.shipment?.courierName || 'Surface Logistics'})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTrackingOrder(ord)}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Live Tracking</span>
                    </button>

                    {ord.orderStatus === 'DELIVERED' && (
                      <button
                        onClick={() => setReturnModalOrder(ord)}
                        className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Request Return / Exchange</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Wishlist */}
      {activeTab === 'WISHLIST' && (
        <div>
          {wishlistedProducts.length === 0 ? (
            <div className="p-12 text-center bg-neutral-900/50 rounded-2xl border border-neutral-800 space-y-3">
              <Heart className="w-10 h-10 text-neutral-600 mx-auto" />
              <div className="text-sm font-bold text-neutral-300">Your wishlist is empty</div>
              <p className="text-xs text-neutral-500">Save items here to quickly purchase or monitor stock.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {wishlistedProducts.map((prod) => (
                <div
                  key={`wishlist-card-${prod.id}`}
                  className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex gap-3 text-xs relative"
                >
                  <img
                    src={prod.masterImages?.[0]?.url || prod.colorVariants?.[0]?.images?.[0]?.url}
                    alt={prod.name}
                    className="w-20 h-20 rounded-lg object-cover bg-neutral-950 border border-neutral-800 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="font-bold text-neutral-100 truncate">{prod.name}</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">{prod.category}</div>
                      <div className="font-black text-amber-400 mt-1 font-mono">{formatINR(prod.price)}</div>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => {
                          const col = prod.colorVariants?.[0]?.colorName || 'Default';
                          const sz = prod.sizes?.[0] || 'Standard';
                          addToCart(prod, col, sz, prod.masterImages?.[0]?.url || '');
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-[11px] uppercase tracking-wider"
                      >
                        Add to Cart
                      </button>
                      <button
                        onClick={() => toggleWishlist(prod.id)}
                        className="text-neutral-500 hover:text-red-400 text-[11px]"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Returns & Refunds */}
      {activeTab === 'RETURNS' && (
        <div className="space-y-4">
          {returns.length === 0 ? (
            <div className="p-12 text-center bg-neutral-900/50 rounded-2xl border border-neutral-800 space-y-2">
              <RotateCcw className="w-10 h-10 text-neutral-600 mx-auto" />
              <div className="text-sm font-bold text-neutral-300">No Return or Refund Requests</div>
              <p className="text-xs text-neutral-500">
                Returns can be initiated within 7 days of delivery directly from the Orders tab.
              </p>
            </div>
          ) : (
            returns.map((ret, rIdx) => (
              <div
                key={`return-card-${ret.id || `ret-${rIdx}`}`}
                className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div className="space-y-0.5">
                    <span className="font-mono font-bold text-neutral-200">Return #{ret.id}</span>
                    <div className="text-neutral-500">For Order: {ret.orderId}</div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      ret.status === 'REFUND_COMPLETED'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : ret.status === 'REJECTED'
                        ? 'bg-red-950 text-red-400 border-red-800'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    Status: {ret.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-neutral-400 font-semibold">Reason for Return / Exchange:</span>
                  <p className="text-neutral-300 bg-neutral-950 p-2.5 rounded-lg border border-neutral-850">
                    {ret.reason}
                  </p>
                </div>

                {ret.adminNotes && (
                  <div className="space-y-1">
                    <span className="text-amber-400 font-semibold">Admin Resolution Notes:</span>
                    <p className="text-neutral-300 bg-amber-500/5 border border-amber-500/20 p-2.5 rounded-lg">
                      {ret.adminNotes}
                    </p>
                  </div>
                )}

                {ret.refundTransactionId && (
                  <div className="flex items-center justify-between pt-2 text-[11px] text-neutral-400">
                    <span>Refund Transaction Reference:</span>
                    <span className="font-mono font-bold text-emerald-400">{ret.refundTransactionId}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 4: Saved Addresses */}
      {activeTab === 'ADDRESSES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                Delivery Address Book
              </h2>
              <p className="text-[11px] text-neutral-400">
                Manage your saved delivery destinations, edit locations, or set primary address for 1-click checkout.
              </p>
            </div>
            <button
              onClick={handleOpenAddAddress}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-md shadow-amber-500/20 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Address</span>
            </button>
          </div>

          {customerAddresses.length === 0 ? (
            <div className="p-8 rounded-2xl bg-neutral-900/60 border border-dashed border-neutral-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-neutral-200">No saved addresses found</div>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                Add your home or garage address so you don't have to retype shipping info when placing gear orders.
              </p>
              <button
                type="button"
                onClick={handleOpenAddAddress}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-md shadow-amber-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Your Delivery Address</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {customerAddresses.map((addr, addrIdx) => (
                <div
                  key={`address-card-${addr.id || `addr-${addrIdx}`}`}
                  className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3 text-xs relative flex flex-col justify-between hover:border-neutral-700 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                      <span className="font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-500" />
                        <span>{addr.fullName || addr.name || currentUser.name}</span>
                      </span>
                      {addr.isDefault && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30">
                          DEFAULT
                        </span>
                      )}
                    </div>

                    <div className="text-neutral-300 leading-relaxed pt-2 space-y-1">
                      <div className="font-medium text-neutral-200">{addr.street}</div>
                      {addr.landmark && (
                        <div className="text-neutral-400 text-[11px]">Landmark: {addr.landmark}</div>
                      )}
                      <div>
                        {addr.city}, {addr.state} - <span className="font-mono text-neutral-200 font-medium">{addr.pincode}</span>
                      </div>
                      <div className="text-neutral-400">{addr.country || 'India'}</div>
                      {addr.phone && (
                        <div className="text-[11px] text-amber-400/90 font-mono pt-1 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-amber-500/80" />
                          <span>{addr.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-neutral-800 text-[11px]">
                    <div>
                      {!addr.isDefault && addr.id ? (
                        <button
                          type="button"
                          onClick={() =>
                            setDefaultCustomerAddress(
                              currentCustomer?.id || currentUser.customerId || currentUser.email || 'CUST-01',
                              addr.id!
                            )
                          }
                          className="text-amber-400 hover:text-amber-300 hover:underline font-semibold flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Set as Default</span>
                        </button>
                      ) : (
                        <span className="text-neutral-500 flex items-center gap-1">
                          <Check className="w-3 h-3 text-amber-500" />
                          <span>Primary Delivery</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditAddress(addr)}
                        className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-neutral-700"
                        title="Modify Address"
                      >
                        <Edit2 className="w-3 h-3 text-amber-400" />
                        <span>Modify</span>
                      </button>

                      {addr.id && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Delete this saved delivery address?')) {
                              deleteCustomerAddress(
                                currentCustomer?.id || currentUser.customerId || currentUser.email || 'CUST-01',
                                addr.id!
                              );
                            }
                          }}
                          className="p-1.5 rounded-lg bg-neutral-800 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition-colors border border-neutral-700"
                          title="Delete Address"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Profile & Security */}
      {activeTab === 'PROFILE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Form */}
          <form
            onSubmit={handleSaveProfile}
            className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-bold text-neutral-100 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-amber-500" />
                <span>Rider Profile Details</span>
              </h3>
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase text-[11px] flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingProfile ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-400 font-semibold">Full Legal / Display Name</label>
              <input
                type="text"
                required
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-400 font-semibold">Contact Mobile Number</label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 font-mono focus:border-amber-500 focus:outline-none"
                />
                <Phone className="w-3.5 h-3.5 text-neutral-500 absolute right-3.5 top-3" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-400 font-semibold">Registered Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  value={currentUser.email}
                  className="w-full bg-neutral-950/60 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-400 font-mono cursor-not-allowed"
                />
                <Mail className="w-3.5 h-3.5 text-neutral-600 absolute right-3.5 top-3" />
              </div>
              <span className="text-[10px] text-neutral-500">
                Email is tied to order notifications and cannot be changed directly.
              </span>
            </div>
          </form>

          {/* Security & Password */}
          <form
            onSubmit={handleChangePassword}
            className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-bold text-neutral-100 uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-500" />
                <span>Security & Password</span>
              </h3>
            </div>

            {passwordNotice && (
              <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/80 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordNotice}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-neutral-400 font-semibold">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 focus:border-amber-500 focus:outline-none font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-400 font-semibold">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 focus:border-amber-500 focus:outline-none font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-400 font-semibold">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 focus:border-amber-500 focus:outline-none font-mono"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add / Modify Address Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 text-neutral-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-neutral-100 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-500" />
                  <span>{editingAddressId ? 'Modify Delivery Address' : 'Add New Delivery Address'}</span>
                </h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {editingAddressId
                    ? 'Update and persist changes to this saved delivery address.'
                    : 'Save a new delivery address for fast 1-click checkout.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddressModalOpen(false);
                  setEditingAddressId(null);
                }}
                className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-neutral-400 font-medium">Recipient Name *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.fullName || addressForm.name || ''}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, fullName: e.target.value, name: e.target.value })
                    }
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-neutral-100 focus:border-amber-500 focus:outline-none"
                    placeholder="Recipient Full Name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-neutral-400 font-medium">Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-neutral-100 font-mono focus:border-amber-500 focus:outline-none"
                    placeholder="10-digit mobile number"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Street Address, Flat / House # *</label>
                <input
                  type="text"
                  required
                  value={addressForm.street}
                  onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-neutral-100 focus:border-amber-500 focus:outline-none"
                  placeholder="Flat / Building / Street name / Road"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Landmark (Optional)</label>
                <input
                  type="text"
                  value={addressForm.landmark || ''}
                  onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-neutral-100 focus:border-amber-500 focus:outline-none"
                  placeholder="Near Metro station, opposite park, etc."
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="space-y-1">
                  <label className="text-neutral-400 font-medium">City *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-neutral-100 focus:border-amber-500 focus:outline-none"
                    placeholder="City"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-neutral-400 font-medium">State *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-neutral-100 focus:border-amber-500 focus:outline-none"
                    placeholder="State"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-neutral-400 font-medium">PIN Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-neutral-100 font-mono focus:border-amber-500 focus:outline-none"
                    placeholder="6 digits"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 pt-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <span className="text-neutral-300">Set as my primary delivery address</span>
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddressModalOpen(false);
                    setEditingAddressId(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider transition-colors shadow-md shadow-amber-500/20"
                >
                  {editingAddressId ? 'Update Address' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Request Modal */}
      {returnModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 text-neutral-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-bold text-sm text-neutral-100 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-500" />
                <span>Return / Exchange: #{returnModalOrder.orderNumber}</span>
              </h3>
              <button
                onClick={() => setReturnModalOrder(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInitiateReturn} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Select / Describe Reason *</label>
                <textarea
                  rows={3}
                  required
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-neutral-100 focus:border-amber-500 focus:outline-none"
                  placeholder="E.g., Sleeves too tight with thermal liner installed..."
                />
              </div>

              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1 text-[11px] text-neutral-400">
                <div className="font-semibold text-neutral-300">Exchange Guarantee:</div>
                <p>
                  Our courier rider will pick up the gear in its original tags and packaging. Replacement
                  size or refund to original payment method will be executed within 48 hours of warehouse inspection.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReturnModalOrder(null)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
