import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CreditCard,
  Truck,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Smartphone,
  Building,
  Banknote,
  Package,
  AlertCircle,
  Zap,
  X,
  RefreshCw,
  QrCode,
  MapPin,
  Check,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../utils/currency';
import { Address, Order, CustomerAddress } from '../../types';

interface RazorpaySimulationState {
  isOpen: boolean;
  orderId: string;
  amount: number;
  keyId: string;
  isSimulated: boolean;
}

export const CheckoutView: React.FC = () => {
  const {
    cart,
    cartSubtotal,
    cartShipping,
    cartDiscount,
    cartTax,
    cartTotal,
    storeSettings,
    currentUser,
    customers,
    addCustomerAddress,
    createOrder,
    setActiveView,
    setTrackingOrder,
    appliedCoupon,
  } = useStore();

  const currentCustomer = customers.find(
    (c) =>
      (currentUser.customerId && c.id === currentUser.customerId) ||
      (currentUser.email && c.email && c.email.toLowerCase() === currentUser.email.toLowerCase())
  );
  const savedAddresses: CustomerAddress[] = currentCustomer?.addresses || [];
  const defaultAddr = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];

  const [fullName, setFullName] = useState(defaultAddr?.fullName || defaultAddr?.name || currentUser.name || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [phone, setPhone] = useState(defaultAddr?.phone || currentCustomer?.phone || '+91 98200 12345');
  const [street, setStreet] = useState(defaultAddr?.street || 'Flat 402, Highline Residency, Outer Ring Road');
  const [city, setCity] = useState(defaultAddr?.city || 'Bengaluru');
  const [state, setState] = useState(defaultAddr?.state || 'Karnataka');
  const [pincode, setPincode] = useState(defaultAddr?.pincode || '560103');
  const [selectedSavedAddrId, setSelectedSavedAddrId] = useState<string | null>(defaultAddr?.id || null);
  const [saveAddressToProfile, setSaveAddressToProfile] = useState(false);
  const [sameAsShipping, setSameAsShipping] = useState(true);

  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NET_BANKING' | 'COD'>('UPI');
  const [upiId, setUpiId] = useState('rider@okhdfcbank');

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatusText, setProcessingStatusText] = useState('Processing...');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Razorpay sandbox simulation modal state
  const [rzpModal, setRzpModal] = useState<RazorpaySimulationState | null>(null);
  const [createdRzpOrderData, setCreatedRzpOrderData] = useState<any>(null);

  // Dynamically ensure Razorpay checkout.js script
  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  if (cart.length === 0 && !confirmedOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-neutral-100">No items in cart</h2>
        <p className="text-sm text-neutral-400">Add riding gear from the store before checking out.</p>
        <button
          onClick={() => setActiveView('CATALOG')}
          className="px-6 py-3 rounded-xl bg-amber-500 text-black font-bold uppercase text-xs tracking-wider"
        >
          Explore Riding Gear
        </button>
      </div>
    );
  }

  // Construct Address helpers
  const getShippingAddress = (): Address => ({
    fullName,
    phone,
    street,
    city,
    state,
    pincode,
    country: 'India',
  });

  const getBillingAddress = (): Address =>
    sameAsShipping ? getShippingAddress() : getShippingAddress();

  // Helper to commit confirmed order into store
  const finalizeOrderPlacement = (params: {
    paymentStatus: 'PAID' | 'PENDING';
    paymentMethod: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
  }) => {
    const shippingAddress = getShippingAddress();
    const billingAddress = getBillingAddress();

    const order = createOrder({
      customerId: currentUser.customerId || 'cust-1',
      customerName: fullName,
      customerEmail: email,
      customerPhone: phone,
      items: [...cart],
      subtotal: cartSubtotal,
      discountAmount: cartDiscount,
      deliveryCharge: cartShipping,
      gstAmount: cartTax,
      grandTotal: cartTotal,
      couponCode: appliedCoupon?.code,
      shippingAddress,
      billingAddress,
      paymentMethod: params.paymentMethod,
      paymentStatus: params.paymentStatus,
      paymentId: params.razorpayPaymentId || (params.paymentMethod === 'COD' ? undefined : `pay_${Date.now()}`),
      razorpayOrderId: params.razorpayOrderId,
      razorpayPaymentId: params.razorpayPaymentId,
      orderStatus: 'CONFIRMED',
      shipment: {
        courierName: 'Shiprocket Surface Express',
        awbNumber: `SRKT${Math.floor(100000000 + Math.random() * 900000000)}`,
        estimatedDeliveryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        shippedDate: new Date().toISOString(),
        events: [
          {
            id: 'evt-1',
            status: 'CONFIRMED',
            location: `${storeSettings.city}, ${storeSettings.state}`,
            description: 'Order placed & payment verified. Dispatched to fulfillment hub.',
            timestamp: new Date().toISOString(),
          },
        ],
      },
    });

    if (saveAddressToProfile) {
      const custId = currentCustomer?.id || currentUser.customerId || currentUser.email;
      if (custId) {
        addCustomerAddress(custId, {
          fullName,
          phone,
          street,
          city,
          state,
          pincode,
          country: 'India',
        });
      }
    }

    setIsProcessing(false);
    setRzpModal(null);
    setConfirmedOrder(order);
  };

  // Handle Order Placement
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName || !email || !phone || !street || !city || !pincode) {
      setErrorMessage('Please complete all delivery address fields');
      return;
    }

    setIsProcessing(true);

    // 1. CASH ON DELIVERY FLOW
    if (paymentMethod === 'COD') {
      setProcessingStatusText('Securing Cash on Delivery order...');
      setTimeout(() => {
        finalizeOrderPlacement({
          paymentStatus: 'PENDING',
          paymentMethod: 'COD',
        });
      }, 700);
      return;
    }

    // 2. RAZORPAY PAYMENT GATEWAY FLOW (UPI / CARD / NET_BANKING)
    setProcessingStatusText('Connecting to Razorpay gateway...');

    try {
      // Step 2 Backend Call: Create Razorpay Order
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: cartTotal,
          receipt: `rcpt_${Date.now()}`,
          customerName: fullName,
          customerEmail: email,
          customerPhone: phone,
          paymentMethod,
        }),
      });

      const orderData = await res.json();
      if (!res.ok || orderData.error) {
        throw new Error(orderData.error || 'Failed to initialize payment gateway');
      }

      setCreatedRzpOrderData(orderData);

      // Check if standard window.Razorpay checkout popup can be initialized
      const hasRzpSdk = typeof window !== 'undefined' && typeof (window as any).Razorpay === 'function';

      if (hasRzpSdk && !orderData.isSimulated) {
        try {
          const options = {
            key: orderData.key || orderData.keyId,
            amount: orderData.amount,
            currency: orderData.currency || 'INR',
            name: storeSettings.storeName || 'RIDEX MOTO',
            description: 'Premium Motorcycle Riding Gear Order',
            order_id: orderData.id,
            prefill: {
              name: fullName,
              email: email,
              contact: phone,
            },
            theme: {
              color: '#f59e0b',
            },
            handler: async function (response: any) {
              setProcessingStatusText('Verifying signature on backend...');
              try {
                // Step 4 Backend Call: Verify Signature
                const verifyRes = await fetch('/api/payment/verify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    paymentMethod,
                  }),
                });
                const verifyData = await verifyRes.json();
                if (verifyData.success) {
                  finalizeOrderPlacement({
                    paymentStatus: 'PAID',
                    paymentMethod,
                    razorpayOrderId: response.razorpay_order_id,
                    razorpayPaymentId: response.razorpay_payment_id,
                  });
                } else {
                  setErrorMessage(verifyData.message || 'Signature verification failed');
                  setIsProcessing(false);
                }
              } catch (verifyErr: any) {
                setErrorMessage('Error verifying payment: ' + verifyErr.message);
                setIsProcessing(false);
              }
            },
            modal: {
              ondismiss: function () {
                setIsProcessing(false);
              },
            },
          };

          const rzpInstance = new (window as any).Razorpay(options);
          rzpInstance.on('payment.failed', function (resp: any) {
            setErrorMessage(`Payment failed: ${resp.error?.description || 'Transaction declined'}`);
            setIsProcessing(false);
          });
          rzpInstance.open();
          return;
        } catch (popupErr: any) {
          console.warn('Standard Razorpay popup opening failed (possibly iframe blocked), using interactive sandbox modal:', popupErr);
        }
      }

      // Fallback or Test Sandbox Mode Modal
      setRzpModal({
        isOpen: true,
        orderId: orderData.id,
        amount: orderData.amount ? orderData.amount / 100 : cartTotal,
        keyId: orderData.key || orderData.keyId || '',
        isSimulated: !!orderData.isSimulated,
      });
      setIsProcessing(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not connect to payment gateway');
      setIsProcessing(false);
    }
  };

  // Authorize payment via interactive sandbox / fallback
  const handleAuthorizeSimulation = async (outcome: 'SUCCESS' | 'FAILURE') => {
    if (!rzpModal || !createdRzpOrderData) return;

    if (outcome === 'FAILURE') {
      setErrorMessage('Payment cancelled or declined by user in Razorpay gateway.');
      setRzpModal(null);
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);
    setProcessingStatusText('Authorizing & verifying payment with backend...');

    const simulatedPaymentId = `pay_${Math.random().toString(36).substring(2, 10).toUpperCase()}${Date.now().toString().slice(-4)}`;
    const simulatedSignature = `sim_sig_${Math.random().toString(36).substring(2, 12)}`;

    try {
      const verifyRes = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: rzpModal.orderId,
          razorpay_payment_id: simulatedPaymentId,
          razorpay_signature: simulatedSignature,
          paymentMethod,
        }),
      });

      const verifyData = await verifyRes.json();
      if (verifyData.success) {
        finalizeOrderPlacement({
          paymentStatus: 'PAID',
          paymentMethod,
          razorpayOrderId: rzpModal.orderId,
          razorpayPaymentId: simulatedPaymentId,
        });
      } else {
        setErrorMessage(verifyData.message || 'Payment verification failed');
        setIsProcessing(false);
        setRzpModal(null);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed');
      setIsProcessing(false);
      setRzpModal(null);
    }
  };

  // Render Order Confirmation Screen
  if (confirmedOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-18 h-18 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/30">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
            Payment & Order Confirmed
          </span>
          <h2 className="text-2xl sm:text-3xl font-black uppercase text-neutral-100">
            Thank you for your order!
          </h2>
          <p className="text-sm text-neutral-400">
            Order <strong className="text-amber-400 font-mono">#{confirmedOrder.orderNumber}</strong> has been
            routed to our Bangalore fulfillment center.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 text-left space-y-3 text-xs">
          <div className="flex justify-between border-b border-neutral-800 pb-2.5">
            <span className="text-neutral-400">AWB Tracking Number:</span>
            <span className="font-mono font-bold text-neutral-200">
              {confirmedOrder.shipment?.awbNumber}
            </span>
          </div>
          <div className="flex justify-between border-b border-neutral-800 pb-2.5">
            <span className="text-neutral-400">Logistics Partner:</span>
            <span className="font-bold text-neutral-200">{confirmedOrder.shipment?.courierName}</span>
          </div>
          <div className="flex justify-between border-b border-neutral-800 pb-2.5">
            <span className="text-neutral-400">Payment Status:</span>
            <span
              className={`font-bold uppercase px-2 py-0.5 rounded text-[10px] ${
                confirmedOrder.paymentStatus === 'PAID'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-amber-950 text-amber-400 border border-amber-800'
              }`}
            >
              {confirmedOrder.paymentStatus} ({confirmedOrder.paymentMethod})
            </span>
          </div>
          {confirmedOrder.razorpayPaymentId && (
            <div className="flex justify-between border-b border-neutral-800 pb-2.5">
              <span className="text-neutral-400">Razorpay Payment ID:</span>
              <span className="font-mono font-bold text-amber-400">
                {confirmedOrder.razorpayPaymentId}
              </span>
            </div>
          )}
          {confirmedOrder.razorpayOrderId && (
            <div className="flex justify-between border-b border-neutral-800 pb-2.5">
              <span className="text-neutral-400">Razorpay Order ID:</span>
              <span className="font-mono text-neutral-300">
                {confirmedOrder.razorpayOrderId}
              </span>
            </div>
          )}
          <div className="flex justify-between border-b border-neutral-800 pb-2.5">
            <span className="text-neutral-400">Amount Paid:</span>
            <span className="font-black text-amber-400 text-sm">
              {formatINR(confirmedOrder.grandTotal)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Estimated Delivery:</span>
            <span className="text-neutral-200 font-semibold">Within 3 to 4 working days</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={() => {
              setTrackingOrder(confirmedOrder);
            }}
            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            <Truck className="w-4 h-4" />
            <span>Track Shipment Now</span>
          </button>

          <button
            onClick={() => {
              setConfirmedOrder(null);
              setActiveView('HOME');
            }}
            className="px-6 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs uppercase tracking-wider transition-colors"
          >
            Back to Storefront
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-6 flex items-center gap-2">
        <button
          onClick={() => setActiveView('HOME')}
          className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Delivery & Payment Details Form */}
        <div className="lg:col-span-7 space-y-6">
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handlePlaceOrder} id="checkout-form" className="space-y-6">
            {/* 1. Customer Contact */}
            <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-100 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center text-xs font-black">
                  1
                </span>
                <span>Contact Details</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-neutral-400 font-medium">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 focus:border-amber-500 focus:outline-none"
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-neutral-400 font-medium">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 focus:border-amber-500 focus:outline-none"
                    placeholder="rider@example.com"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-neutral-400 font-medium">Mobile Number (+91) *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 focus:border-amber-500 focus:outline-none"
                    placeholder="+91 98200 12345"
                  />
                </div>
              </div>
            </div>

            {/* 2. Shipping Address */}
            <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-100 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center text-xs font-black">
                    2
                  </span>
                  <span>Delivery Address (India)</span>
                </h3>
                {savedAddresses.length > 0 && (
                  <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{savedAddresses.length} saved</span>
                  </span>
                )}
              </div>

              {savedAddresses.length > 0 && (
                <div className="space-y-2 p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs">
                  <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Quick Select Saved Address:</span>
                    <span className="text-[10px] text-neutral-500 font-normal">Auto-fills below</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {savedAddresses.map((addr, idx) => {
                      const isSelected = selectedSavedAddrId === addr.id;
                      return (
                        <button
                          key={addr.id || `saved-addr-${idx}`}
                          type="button"
                          onClick={() => {
                            setSelectedSavedAddrId(addr.id || null);
                            if (addr.fullName || addr.name) setFullName(addr.fullName || addr.name || '');
                            if (addr.phone) setPhone(addr.phone);
                            setStreet(addr.street);
                            setCity(addr.city);
                            setState(addr.state);
                            setPincode(addr.pincode);
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'bg-amber-500/10 border-amber-500 text-neutral-100 shadow-sm shadow-amber-500/10'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs flex items-center gap-1.5 truncate">
                              <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-amber-400' : 'text-neutral-500'}`} />
                              <span className="truncate">{addr.fullName || addr.name || 'Address'}</span>
                            </span>
                            {addr.isDefault && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[9px] font-bold shrink-0">
                                DEFAULT
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-neutral-400 truncate mt-1">
                            {addr.street}, {addr.city}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-neutral-400 font-medium">Street Address, House No, Landmark *</label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 focus:border-amber-500 focus:outline-none"
                    placeholder="Flat / Villa / Street, Landmark"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-neutral-400 font-medium">City *</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-neutral-400 font-medium">State *</label>
                    <input
                      type="text"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-neutral-400 font-medium">PIN Code *</label>
                    <input
                      type="text"
                      required
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-mono focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={sameAsShipping}
                      onChange={(e) => setSameAsShipping(e.target.checked)}
                      className="rounded border-neutral-700 text-amber-500 focus:ring-amber-500 accent-amber-500"
                    />
                    <span className="text-xs text-neutral-300">
                      Billing address is the same as shipping address
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={saveAddressToProfile}
                      onChange={(e) => setSaveAddressToProfile(e.target.checked)}
                      className="rounded border-neutral-700 text-amber-500 focus:ring-amber-500 accent-amber-500"
                    />
                    <span className="text-xs text-neutral-300">
                      Save this address to my profile address book for future orders
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* 3. Payment Method */}
            <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-100 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center text-xs font-black">
                    3
                  </span>
                  <span>Select Payment Method</span>
                </h3>
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800/80 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Razorpay 256-bit Encrypted</span>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between h-24 transition-all ${
                    paymentMethod === 'UPI'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-400 shadow-md'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-amber-400" />
                  <div>
                    <div className="font-bold text-neutral-100">UPI Instant</div>
                    <div className="text-[10px] text-neutral-400">GPay, PhonePe, Paytm</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between h-24 transition-all ${
                    paymentMethod === 'CARD'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-400 shadow-md'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-amber-400" />
                  <div>
                    <div className="font-bold text-neutral-100">Credit / Debit Card</div>
                    <div className="text-[10px] text-neutral-400">Visa, Mastercard, RuPay</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('NET_BANKING')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between h-24 transition-all ${
                    paymentMethod === 'NET_BANKING'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-400 shadow-md'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <Building className="w-5 h-5 text-amber-400" />
                  <div>
                    <div className="font-bold text-neutral-100">Net Banking</div>
                    <div className="text-[10px] text-neutral-400">All Indian Banks</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between h-24 transition-all ${
                    paymentMethod === 'COD'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-400 shadow-md'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <Banknote className="w-5 h-5 text-amber-400" />
                  <div>
                    <div className="font-bold text-neutral-100">Cash On Delivery</div>
                    <div className="text-[10px] text-neutral-400">Pay on arrival</div>
                  </div>
                </button>
              </div>

              {paymentMethod !== 'COD' ? (
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-neutral-300">
                      Payment powered by <strong className="text-neutral-100">Razorpay Gateway</strong>
                    </span>
                  </div>
                  <span className="text-[11px] text-amber-400 font-bold">Fast &amp; Automated Refund Protection</span>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-400">
                  Cash on Delivery orders require doorstep payment upon handover by the courier delivery executive.
                </div>
              )}
            </div>

            {/* Place Order Submit Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 disabled:opacity-50"
              id="confirm-place-order-btn"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{processingStatusText}</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>
                    {paymentMethod === 'COD'
                      ? `Confirm Cash on Delivery (${formatINR(cartTotal)})`
                      : `Pay via Razorpay • ${formatINR(cartTotal)}`}
                  </span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Order Summary & Armor Guarantee */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-100">
              Order Items ({cart.reduce((s, i) => s + i.quantity, 0)})
            </h3>

            <div className="space-y-3 divide-y divide-neutral-800 max-h-80 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.id} className="pt-3 first:pt-0 flex gap-3 text-xs">
                  <img
                    src={item.selectedImage}
                    alt={item.name}
                    className="w-16 h-16 rounded-lg object-cover bg-neutral-950 border border-neutral-800 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-neutral-200 truncate">{item.name}</h4>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      Color: <strong className="text-amber-400">{item.selectedColor}</strong> | Size:{' '}
                      <strong className="text-neutral-200">{item.selectedSize}</strong>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-xs">
                      <span className="text-neutral-400">Qty: {item.quantity}</span>
                      <span className="font-bold text-neutral-100 font-mono">
                        {formatINR(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Price Calculations in INR */}
            <div className="pt-4 border-t border-neutral-800 space-y-2 text-xs text-neutral-400">
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
                <span>Delivery Charges</span>
                <span>
                  {cartShipping === 0 ? (
                    <span className="text-emerald-400 font-bold">FREE EXPRESS</span>
                  ) : (
                    formatINR(cartShipping)
                  )}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-neutral-500">
                <span>18% GST (Tax included)</span>
                <span>{formatINR(cartTax)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-neutral-100 pt-2 border-t border-neutral-800">
                <span>Grand Total</span>
                <span className="text-amber-400 text-lg">{formatINR(cartTotal)}</span>
              </div>
            </div>
          </div>

          {/* Guarantee Badge */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex items-start gap-3 text-xs text-neutral-400">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-neutral-200 block font-bold">Buyer Protection & Return Guarantee</strong>
              100% genuine motorcycle riding gear with 7-day size replacement and official brand warranty.
            </div>
          </div>
        </div>
      </div>

      {/* RAZORPAY SANDBOX / GATEWAY MODAL */}
      {rzpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-700 rounded-3xl overflow-hidden shadow-2xl space-y-0">
            {/* Razorpay Modal Header */}
            <div className="p-5 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-black font-black flex items-center justify-center text-xs">
                  RZP
                </div>
                <div>
                  <h4 className="text-sm font-black text-neutral-100 tracking-tight">
                    Razorpay Secure Checkout
                  </h4>
                  <p className="text-[10px] text-neutral-400 font-mono">
                    Order ID: {rzpModal.orderId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRzpModal(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs">
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-neutral-500 uppercase tracking-wider block font-bold">
                    Merchant
                  </span>
                  <span className="text-sm font-extrabold text-neutral-100">
                    {storeSettings.storeName || 'RIDEX MOTO'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-neutral-500 uppercase tracking-wider block font-bold">
                    Amount Payable
                  </span>
                  <span className="text-lg font-black text-amber-400 font-mono">
                    {formatINR(rzpModal.amount)}
                  </span>
                </div>
              </div>

              {/* Simulation/Test Indicator */}
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-[11px] flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Razorpay Sandbox Gateway Active. You can test instant payment authorization and backend HMAC-SHA256 signature verification.
                </span>
              </div>

              {/* Payment Methods Simulation */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  Payment Mode ({paymentMethod})
                </div>
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center gap-3">
                  {paymentMethod === 'UPI' && (
                    <>
                      <QrCode className="w-6 h-6 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-bold text-neutral-200">UPI Instant Authorization</div>
                        <div className="text-[11px] text-neutral-400">VPA: {upiId}</div>
                      </div>
                    </>
                  )}
                  {paymentMethod === 'CARD' && (
                    <>
                      <CreditCard className="w-6 h-6 text-blue-400 shrink-0" />
                      <div>
                        <div className="font-bold text-neutral-200">Test Card Payment</div>
                        <div className="text-[11px] text-neutral-400">4111 •••• •••• 1111 (Visa Sandbox)</div>
                      </div>
                    </>
                  )}
                  {paymentMethod === 'NET_BANKING' && (
                    <>
                      <Building className="w-6 h-6 text-purple-400 shrink-0" />
                      <div>
                        <div className="font-bold text-neutral-200">Net Banking Flow</div>
                        <div className="text-[11px] text-neutral-400">HDFC / ICICI / SBI Test Gateway</div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleAuthorizeSimulation('SUCCESS')}
                  className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Authorize Successful Payment</span>
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleAuthorizeSimulation('FAILURE')}
                  className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  Simulate Payment Decline / Cancel
                </button>
              </div>

              <div className="text-center text-[10px] text-neutral-500 flex items-center justify-center gap-1.5 pt-1">
                <Lock className="w-3 h-3" />
                <span>PCI-DSS Level 1 Compliant • TLS 1.3 End-to-End Encryption</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
