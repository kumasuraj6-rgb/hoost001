import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  RotateCcw,
  AlertCircle,
  Search,
  Filter,
  DollarSign,
  ShieldCheck,
  Zap,
  Building,
  Smartphone,
  Eye,
  EyeOff,
  Key,
  Lock,
  ExternalLink,
  RefreshCw,
  Sliders,
  Check,
  Radio,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../utils/currency';

interface GatewaySettingsState {
  keyId: string;
  keySecret: string;
  isEnabled: boolean;
  mode: 'TEST' | 'LIVE';
  preferredGateway: 'RAZORPAY' | 'CASHFREE' | 'PHONEPE';
  webhookSecret: string;
  companyName: string;
  themeColor: string;
}

export const PaymentsTab: React.FC = () => {
  const { orders, returns, setTrackingOrder } = useStore();
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');

  // Gateway Settings State
  const [activeSection, setActiveSection] = useState<'TRANSACTIONS' | 'GATEWAY_CONFIG'>('GATEWAY_CONFIG');
  const [gatewayConfig, setGatewayConfig] = useState<GatewaySettingsState>({
    keyId: '',
    keySecret: '',
    isEnabled: true,
    mode: 'TEST',
    preferredGateway: 'RAZORPAY',
    webhookSecret: '',
    companyName: 'RIDEX MOTO',
    themeColor: '#f59e0b',
  });

  const [showSecret, setShowSecret] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Fetch admin gateway config on mount
  useEffect(() => {
    fetch('/api/admin/payment/config', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.config) {
          setGatewayConfig({
            keyId: data.config.keyId || '',
            keySecret: data.config.keySecret || '',
            isEnabled: data.config.isEnabled ?? true,
            mode: data.config.mode || 'TEST',
            preferredGateway: data.config.preferredGateway || 'RAZORPAY',
            webhookSecret: data.config.webhookSecret || '',
            companyName: data.config.companyName || 'RIDEX MOTO',
            themeColor: data.config.themeColor || '#f59e0b',
          });
        }
      })
      .catch((err) => console.log('Using default gateway config:', err));
  }, []);

  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(null);
    setTestResult(null);

    try {
      const res = await fetch('/api/admin/payment/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gatewayConfig),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess('Razorpay API keys & configuration saved successfully!');
        setTimeout(() => setSaveSuccess(null), 4000);
      } else {
        alert(data.error || 'Failed to save configuration');
      }
    } catch (err: any) {
      alert(err.message || 'Error communicating with server');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/admin/payment/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyId: gatewayConfig.keyId,
          keySecret: gatewayConfig.keySecret,
        }),
      });
      const data = await res.json();
      setTestResult({
        success: data.success,
        message: data.message || (data.success ? 'Connection verified!' : 'Connection failed'),
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Network request failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Compute stats
  const totalCollected = orders
    .filter((o) => o.paymentStatus === 'PAID')
    .reduce((sum, o) => sum + o.grandTotal, 0);

  const pendingPayments = orders
    .filter((o) => o.paymentStatus === 'PENDING')
    .reduce((sum, o) => sum + o.grandTotal, 0);

  const refundedTotal = returns
    .filter((r) => r.status === 'REFUND_COMPLETED')
    .reduce((sum, r) => {
      const ord = orders.find((o) => o.id === r.orderId);
      return sum + (ord ? ord.grandTotal : 0);
    }, 0);

  const filteredOrders = orders.filter((ord) => {
    if (methodFilter !== 'ALL' && ord.paymentMethod !== methodFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return (
        ord.orderNumber.toLowerCase().includes(q) ||
        ord.customerName.toLowerCase().includes(q) ||
        ord.paymentMethod.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Financial Operations & Gateway</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-neutral-100 uppercase tracking-tight mt-1">
            Payments & Gateway
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-xl">
            Configure live or test Razorpay API keys, monitor real-time UPI settlements, and reconcile customer order transactions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSection('GATEWAY_CONFIG')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
              activeSection === 'GATEWAY_CONFIG'
                ? 'bg-amber-500 text-black'
                : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>API Keys & Gateway</span>
          </button>
          <button
            onClick={() => setActiveSection('TRANSACTIONS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
              activeSection === 'TRANSACTIONS'
                ? 'bg-amber-500 text-black'
                : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Settled Orders ({orders.length})</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
          <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
            Total Revenue Collected
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {formatINR(totalCollected)}
          </div>
          <div className="text-[11px] text-neutral-500 font-medium">
            From {orders.filter((o) => o.paymentStatus === 'PAID').length} settled transactions
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
          <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
            Pending COD / Unsettled
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            {formatINR(pendingPayments)}
          </div>
          <div className="text-[11px] text-neutral-500 font-medium">
            Doorstep cash collections in transit
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
          <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
            Total Refunds Disbursed
          </div>
          <div className="text-2xl font-black text-blue-400 font-mono">
            {formatINR(refundedTotal)}
          </div>
          <div className="text-[11px] text-neutral-500 font-medium">
            {returns.filter((r) => r.status === 'REFUND_COMPLETED').length} verified returns
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
          <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
            Active Payment Rail
          </div>
          <div className="text-sm font-bold text-neutral-200 flex items-center gap-2 pt-1">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                gatewayConfig.isEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-600'
              }`}
            />
            <span>
              {gatewayConfig.preferredGateway} ({gatewayConfig.mode})
            </span>
          </div>
          <div className="text-[11px] text-neutral-500 font-medium">
            {gatewayConfig.isEnabled ? 'Accepting Live/Test Orders' : 'Gateway Paused'}
          </div>
        </div>
      </div>

      {/* GATEWAY CONFIGURATION PANEL (STEP 1) */}
      {activeSection === 'GATEWAY_CONFIG' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-neutral-100 uppercase tracking-wider">
                    Razorpay Gateway Credentials & Settings
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      gatewayConfig.mode === 'LIVE'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}
                  >
                    {gatewayConfig.mode} MODE
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  Razorpay Dashboard se API Keys generate karke yahan paste karein. Real-time payments accept karne ke liye ye credentials zaroori hain.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer bg-neutral-950 border border-neutral-800 px-3 py-1.5 rounded-xl text-xs text-neutral-300">
                  <input
                    type="checkbox"
                    checked={gatewayConfig.isEnabled}
                    onChange={(e) =>
                      setGatewayConfig({ ...gatewayConfig, isEnabled: e.target.checked })
                    }
                    className="rounded border-neutral-700 text-amber-500 focus:ring-amber-500"
                  />
                  <span>Gateway Enabled</span>
                </label>
              </div>
            </div>

            {/* Gateway Selection Cards */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                Primary Payment Gateway
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  onClick={() => setGatewayConfig({ ...gatewayConfig, preferredGateway: 'RAZORPAY' })}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    gatewayConfig.preferredGateway === 'RAZORPAY'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-md'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-neutral-100 text-sm">Razorpay</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[9px] font-bold uppercase">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, Net Banking & Auto-refunds.
                  </p>
                </div>

                <div
                  onClick={() => setGatewayConfig({ ...gatewayConfig, preferredGateway: 'CASHFREE' })}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    gatewayConfig.preferredGateway === 'CASHFREE'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-md'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-neutral-100 text-sm">Cashfree Payments</span>
                    <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[9px] font-bold uppercase">
                      Ready
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Auto-collect UPI QR, cards, and payouts integration ready.
                  </p>
                </div>

                <div
                  onClick={() => setGatewayConfig({ ...gatewayConfig, preferredGateway: 'PHONEPE' })}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    gatewayConfig.preferredGateway === 'PHONEPE'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-md'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-neutral-100 text-sm">PhonePe PG</span>
                    <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[9px] font-bold uppercase">
                      Ready
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Direct UPI intent flow on Indian mobile numbers with 0% UPI MDR.
                  </p>
                </div>
              </div>
            </div>

            {/* Credential Inputs Form */}
            <form onSubmit={handleSaveConfig} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Environment Mode */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                    Environment Mode
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setGatewayConfig({ ...gatewayConfig, mode: 'TEST' })}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border ${
                        gatewayConfig.mode === 'TEST'
                          ? 'bg-amber-500 text-black border-amber-500'
                          : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                      }`}
                    >
                      Test Sandbox (rzp_test_*)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGatewayConfig({ ...gatewayConfig, mode: 'LIVE' })}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border ${
                        gatewayConfig.mode === 'LIVE'
                          ? 'bg-emerald-500 text-black border-emerald-500'
                          : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                      }`}
                    >
                      Live Production (rzp_live_*)
                    </button>
                  </div>
                </div>

                {/* Key ID */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-500" />
                      <span>Razorpay Key ID *</span>
                    </label>
                    <span className="text-[11px] text-neutral-500 font-mono">
                      e.g. rzp_test_xxxxxx
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={gatewayConfig.keyId}
                    onChange={(e) =>
                      setGatewayConfig({ ...gatewayConfig, keyId: e.target.value })
                    }
                    placeholder="rzp_test_xxxxxx or rzp_live_xxxxxx"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 font-mono focus:border-amber-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-neutral-500">
                    Razorpay Dashboard &gt; Settings &gt; API Keys se Key ID copy karein.
                  </p>
                </div>

                {/* Key Secret */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Razorpay Key Secret *</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                    >
                      {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showSecret ? 'Hide Secret' : 'Show Secret'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showSecret ? 'text' : 'password'}
                      required
                      value={gatewayConfig.keySecret}
                      onChange={(e) =>
                        setGatewayConfig({ ...gatewayConfig, keySecret: e.target.value })
                      }
                      placeholder="Enter Razorpay Secret"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 font-mono focus:border-amber-500 focus:outline-none pr-10"
                    />
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Never exposed to the public browser. HMAC SHA-256 signature verification ke liye use hota hai.
                  </p>
                </div>

                {/* Webhook Secret (Optional) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                    Webhook Secret (Optional)
                  </label>
                  <input
                    type="text"
                    value={gatewayConfig.webhookSecret}
                    onChange={(e) =>
                      setGatewayConfig({ ...gatewayConfig, webhookSecret: e.target.value })
                    }
                    placeholder="whsec_xxxxxx"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 font-mono focus:border-amber-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-neutral-500">
                    For real-time webhook callback event signature validation.
                  </p>
                </div>

                {/* Brand Name on Modal */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                    Checkout Display Brand
                  </label>
                  <input
                    type="text"
                    value={gatewayConfig.companyName}
                    onChange={(e) =>
                      setGatewayConfig({ ...gatewayConfig, companyName: e.target.value })
                    }
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 focus:border-amber-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-neutral-500">
                    Displayed at the top of the Razorpay modal during customer checkout.
                  </p>
                </div>
              </div>

              {/* Feedback messages */}
              {saveSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{saveSuccess}</span>
                </div>
              )}

              {testResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                    testResult.success
                      ? 'bg-emerald-950/80 border-emerald-800 text-emerald-400'
                      : 'bg-red-950/80 border-red-800 text-red-400'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{isSaving ? 'Saving Configuration...' : 'Save Credentials'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-amber-400" />}
                  <span>{isTesting ? 'Testing Connectivity...' : 'Test Connection'}</span>
                </button>

                <a
                  href="https://dashboard.razorpay.com/app/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-300 text-xs font-semibold flex items-center gap-1.5 ml-auto"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Razorpay Dashboard</span>
                </a>
              </div>
            </form>

            {/* Quick Setup Instructions */}
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2 text-xs">
              <div className="font-bold text-neutral-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>Razorpay Setup Quick Guide (Step-by-Step)</span>
              </div>
              <ul className="list-decimal pl-5 space-y-1 text-neutral-400 text-[11px] leading-relaxed">
                <li>
                  <strong className="text-neutral-200">Razorpay Dashboard</strong> (<a href="https://dashboard.razorpay.com" target="_blank" rel="noreferrer" className="text-amber-400 hover:underline">dashboard.razorpay.com</a>) par login karein.
                </li>
                <li>
                  Left sidebar mein <strong className="text-neutral-200">Settings &gt; API Keys</strong> option par click karein.
                </li>
                <li>
                  <strong className="text-neutral-200">Generate Key</strong> button dabayein. Aapko ek <span className="font-mono text-amber-300">Key ID</span> (e.g. <code>rzp_test_...</code>) aur ek <span className="font-mono text-amber-300">Key Secret</span> milega.
                </li>
                <li>
                  Dono keys ko upar form mein paste karke <strong className="text-neutral-200">Save Credentials</strong> dabayein ya container ki <code>.env</code> file mein <code>RAZORPAY_KEY_ID</code> aur <code>RAZORPAY_KEY_SECRET</code> set karein.
                </li>
                <li>
                  Customer checkout par ab real-time Razorpay popup load hoga aur payment verify hokar automatically <span className="text-emerald-400 font-bold">PAID</span> ho jayegi!
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TRANSACTIONS RECONCILIATION SECTION */}
      {activeSection === 'TRANSACTIONS' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by order #, customer, or method..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs text-neutral-100 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              {['ALL', 'ONLINE', 'COD', 'UPI', 'CARD'].map((m) => (
                <button
                  key={m}
                  onClick={() => setMethodFilter(m)}
                  className={`px-3 py-1.5 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-colors ${
                    methodFilter === m
                      ? 'bg-amber-500 text-black'
                      : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Transactions Table */}
          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950 text-neutral-400 font-bold uppercase text-[10px] tracking-wider border-b border-neutral-800">
                  <tr>
                    <th className="py-3.5 px-4">Order Ref</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Payment Method</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/80">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-neutral-500">
                        No transactions match your search filter.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-neutral-850/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                          #{ord.orderNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-neutral-200">{ord.customerName}</div>
                          <div className="text-[11px] text-neutral-500">{ord.customerEmail}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono text-[10px] font-bold">
                            {ord.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-neutral-100">
                          {formatINR(ord.grandTotal)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              ord.paymentStatus === 'PAID'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : ord.paymentStatus === 'REFUNDED'
                                ? 'bg-blue-950 text-blue-400 border border-blue-800'
                                : 'bg-amber-950 text-amber-400 border border-amber-800'
                            }`}
                          >
                            <span>{ord.paymentStatus}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-neutral-400 font-mono text-[11px]">
                          {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setTrackingOrder(ord)}
                            className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-semibold transition-colors"
                          >
                            Track Order
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
