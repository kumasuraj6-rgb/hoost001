import React, { useState, useRef } from 'react';
import {
  Package,
  Search,
  Filter,
  Eye,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  FileText,
  User,
  RotateCcw,
  X,
  Calendar,
  AlertCircle,
  Upload,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Order, OrderStatus } from '../../types';
import { formatINR } from '../../utils/currency';
import { ExportDataButton } from './ExportDataButton';

const ALL_ORDER_STATUSES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'PACKED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'RETURN_REQUESTED',
  'RETURNED',
  'REFUND_INITIATED',
  'REFUND_COMPLETED',
];

export const OrdersTab: React.FC = () => {
  const { orders, updateOrderStatus, setTrackingOrder, importOrders } = useStore();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importFeedback, setImportFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Status update state
  const [newStatus, setNewStatus] = useState<OrderStatus>('PROCESSING');
  const [courierName, setCourierName] = useState('Shiprocket Surface');
  const [awbNumber, setAwbNumber] = useState('');
  const [eventLocation, setEventLocation] = useState('Bengaluru Hub');
  const [eventDesc, setEventDesc] = useState('Package sorted at central hub');

  // Client-side robust CSV parsing
  const parseCsvOrders = (csvText: string) => {
    const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return [];

    const headerLine = lines[0].replace(/^\uFEFF/, '');
    const headers = headerLine.split(',').map((h) => h.replace(/^["']|["']$/g, '').trim().toLowerCase());

    const results: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line || line.startsWith('#')) continue;

      const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
      const values: string[] = [];
      let match;
      while ((match = regex.exec(line)) && values.length < headers.length) {
        let val = match[1] ?? '';
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1).replace(/""/g, '"');
        }
        values.push(val.trim());
        if (regex.lastIndex >= line.length) break;
      }

      if (values.length === 0) continue;

      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });

      const orderId = row['orderid'] || row['ordernumber'] || row['order_id'] || row['order #'] || row['id'];
      const customerName = row['customername'] || row['customer'] || row['name'] || row['customer_name'] || 'Rider Customer';
      const phone = row['phone'] || row['customerphone'] || row['mobile'] || '+91 98765 43210';
      const items = row['items'] || row['item'] || row['product'] || row['gear'] || 'AeroTour Riding Gear';
      const grandTotal = parseFloat(row['grandtotal'] || row['total'] || row['amount'] || row['price'] || '0') || 4999;
      const paymentStatus = row['paymentstatus'] || row['payment'] || 'PAID';
      const status = row['status'] || row['orderstatus'] || 'CONFIRMED';
      const date = row['date'] || row['createdat'] || row['created_at'] || new Date().toISOString();

      results.push({
        orderId,
        customerName,
        phone,
        items,
        grandTotal,
        paymentStatus,
        status,
        date,
      });
    }
    return results;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportFeedback(null);

    try {
      // 1. Read the text from the file for immediate parsing & preview
      const text = await file.text();
      const parsedOrders = parseCsvOrders(text);

      if (parsedOrders.length === 0) {
        throw new Error('CSV file contains no valid order rows. Please verify column headers.');
      }

      // 2. Also send FormData to /api/orders/import as requested
      const formData = new FormData();
      formData.append('file', file);
      fetch('/api/orders/import', {
        method: 'POST',
        body: formData,
      }).catch((netErr) => console.warn('Backend multipart upload notice:', netErr));

      // 3. Import orders into store state (synchronizes UI, local storage & backend)
      const res = importOrders(parsedOrders);
      if (res.success) {
        setImportFeedback({
          type: 'success',
          message: `Successfully imported ${res.count} order(s) into operations pipeline!`,
        });
      } else {
        setImportFeedback({
          type: 'error',
          message: res.message || 'Import failed',
        });
      }
    } catch (err: any) {
      setImportFeedback({
        type: 'error',
        message: err.message || 'Failed to read or parse file.',
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownloadSampleCsv = () => {
    const sampleCsv = `orderId,customerName,phone,items,grandTotal,paymentStatus,status,date
RDX-2026-1003,Amit Kumar,+919876543210,AeroTour Jacket,5499,UPI • PAID,CONFIRMED,2026-03-05
RDX-2026-1004,Priya Sharma,+919812345678,Apex Pro Gloves;Rain Cover,3299,CARD • PAID,SHIPPED,2026-03-06
RDX-2026-1005,Vikram Singh,+919988776655,Terra Dry Rain Suit,4499,COD • PENDING,DELIVERED,2026-03-07
RDX-2026-1006,Rahul Verma,+919123456780,Tail Bag 40L,3899,NETBANKING • PAID,PACKED,2026-03-08`;

    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_orders_import.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportOrdersCsv = () => {
    const headers = ['orderId', 'customerName', 'phone', 'items', 'grandTotal', 'paymentStatus', 'status', 'date'];
    const rows = orders.map((o) => [
      `"${o.orderNumber}"`,
      `"${o.customerName}"`,
      `"${o.customerPhone || ''}"`,
      `"${o.items.map((i) => i.name).join(';')}"`,
      o.grandTotal,
      `"${o.paymentStatus}"`,
      `"${o.orderStatus}"`,
      `"${o.createdAt ? o.createdAt.split('T')[0] : ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ridex_orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredOrders = orders.filter((ord) => {
    if (statusFilter !== 'ALL' && ord.orderStatus !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchNum = ord.orderNumber.toLowerCase().includes(q);
      const matchCust = ord.customerName.toLowerCase().includes(q);
      const matchEmail = ord.customerEmail.toLowerCase().includes(q);
      const matchAwb = ord.shipment?.awbNumber?.toLowerCase().includes(q);
      return matchNum || matchCust || matchEmail || matchAwb;
    }
    return true;
  });

  const handleOpenDetail = (ord: Order) => {
    setSelectedOrder(ord);
    setNewStatus(ord.orderStatus);
    setCourierName(ord.shipment?.courierName || 'Shiprocket Surface');
    setAwbNumber(ord.shipment?.awbNumber || '');
  };

  const handleApplyStatusUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const existingEvents = selectedOrder.shipment?.events || [];
    const newEvent = {
      id: `evt-${Date.now()}`,
      status: newStatus,
      location: eventLocation || 'Transit Facility',
      description: eventDesc || `Order status shifted to ${newStatus.replace(/_/g, ' ')}`,
      timestamp: new Date().toISOString(),
    };

    updateOrderStatus(selectedOrder.id, newStatus, {
      courierPartner: courierName,
      courierName,
      trackingNumber: awbNumber,
      awbNumber,
      currentStatus: eventDesc || `Status updated to ${newStatus.replace(/_/g, ' ')}`,
      events: [newEvent, ...existingEvents],
    });

    // Update local modal view
    setSelectedOrder((prev) =>
      prev
        ? {
            ...prev,
            orderStatus: newStatus,
            shipment: {
              ...prev.shipment,
              courierPartner: courierName,
              courierName,
              trackingNumber: awbNumber,
              awbNumber,
              currentStatus: eventDesc || `Status updated to ${newStatus.replace(/_/g, ' ')}`,
              events: [newEvent, ...existingEvents],
            },
          }
        : null
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-amber-500">
            Fulfillment & Operations
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-neutral-100 uppercase tracking-tight mt-1">
            Order Lifecycle Management
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Real-time status progression from Confirmation through Packing, Shipping, Doorstep Delivery,
            and Returns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-neutral-800 border border-neutral-700 text-xs font-mono text-neutral-300">
            Total Orders: {orders.length}
          </span>
        </div>
      </div>

      {/* Filters & Actions Bar */}
      <div className="space-y-3">
        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col lg:flex-row gap-3 items-center justify-between text-xs">
          {/* Search Bar */}
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by Order #, Customer or AWB..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-neutral-100 placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Action Buttons: Import, Sample CSV, Export, Status Filter */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv, text/csv, .txt, .xlsx"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />

            {/* Export CSV Buttons (Sales & Orders, Customers, AI Guide) */}
            <ExportDataButton />

            {/* Import Orders Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Upload CSV to import orders"
            >
              <Upload className="w-4 h-4" />
              <span>{isImporting ? 'Importing...' : 'Import Orders'}</span>
            </button>

            {/* Download Sample CSV */}
            <button
              onClick={handleDownloadSampleCsv}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors cursor-pointer"
              title="Download standard CSV format template"
            >
              <Download className="w-3.5 h-3.5 text-neutral-400" />
              <span className="hidden sm:inline">Sample CSV</span>
            </button>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:border-amber-500 focus:outline-none font-medium cursor-pointer"
            >
              <option value="ALL">All Statuses ({orders.length})</option>
              {ALL_ORDER_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Import Feedback Banner */}
        {importFeedback && (
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
              importFeedback.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {importFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{importFeedback.message}</span>
            </div>
            <button
              onClick={() => setImportFeedback(null)}
              className="text-neutral-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950 border-b border-neutral-800 text-neutral-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Order ID & Date</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Gear Items</th>
                <th className="p-4">Grand Total (INR)</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-800/80">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-500">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr
                    key={ord.id}
                    className="hover:bg-neutral-850/60 transition-colors"
                    id={`admin-order-row-${ord.id}`}
                  >
                    {/* 1. Order ID & Date */}
                    <td className="p-4">
                      <div className="font-mono font-bold text-amber-400">#{ord.orderNumber}</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>

                    {/* 2. Customer */}
                    <td className="p-4">
                      <div className="font-bold text-neutral-100">{ord.customerName}</div>
                      <div className="text-[11px] text-neutral-400 truncate max-w-[140px]">
                        {ord.customerPhone}
                      </div>
                    </td>

                    {/* 3. Items Count & Summary */}
                    <td className="p-4">
                      <div className="text-neutral-200 font-semibold">{ord.items.length} items</div>
                      <div className="text-[11px] text-neutral-400 truncate max-w-[160px]">
                        {ord.items.map((i) => i.name).join(', ')}
                      </div>
                    </td>

                    {/* 4. Grand Total */}
                    <td className="p-4">
                      <div className="font-mono font-black text-neutral-100">
                        {formatINR(ord.grandTotal)}
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        GST: {formatINR(ord.gstAmount)}
                      </div>
                    </td>

                    {/* 5. Payment */}
                    <td className="p-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          ord.paymentStatus === 'PAID'
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {ord.paymentMethod} • {ord.paymentStatus}
                      </span>
                    </td>

                    {/* 6. Order Status */}
                    <td className="p-4">
                      <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-neutral-800 border border-neutral-700 text-amber-400">
                        {ord.orderStatus.replace(/_/g, ' ')}
                      </span>
                      {ord.shipment?.awbNumber && (
                        <div className="text-[10px] font-mono text-neutral-400 mt-1">
                          AWB: {ord.shipment.awbNumber.slice(0, 8)}...
                        </div>
                      )}
                    </td>

                    {/* 7. Action */}
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleOpenDetail(ord)}
                        className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-amber-500 hover:text-black text-neutral-200 text-xs font-bold transition-colors"
                        id={`manage-order-${ord.id}`}
                      >
                        Manage Order
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Management Inspection Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                  Order Management & Logistics
                </span>
                <h3 className="text-base sm:text-lg font-bold text-neutral-100 flex items-center gap-2 mt-0.5">
                  <span>Order #{selectedOrder.orderNumber}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-normal">
                    {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
                  </span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs">
              {/* Status Update Form */}
              <form
                onSubmit={handleApplyStatusUpdate}
                className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4"
              >
                <div className="text-xs font-bold uppercase tracking-wider text-amber-500">
                  Update Lifecycle & Transit Details
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-neutral-400 font-medium">Progress Order Status *</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as any)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-bold focus:border-amber-500 focus:outline-none"
                    >
                      {ALL_ORDER_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-neutral-400 font-medium">Logistics Partner</label>
                    <input
                      type="text"
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 focus:border-amber-500 focus:outline-none"
                      placeholder="e.g. Shiprocket, BlueDart"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-neutral-400 font-medium">AWB / Tracking Number</label>
                    <input
                      type="text"
                      value={awbNumber}
                      onChange={(e) => setAwbNumber(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-mono focus:border-amber-500 focus:outline-none"
                      placeholder="SRKT12345678"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-neutral-400 font-medium">Checkpoint Location</label>
                    <input
                      type="text"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-neutral-400 font-medium">Checkpoint Milestone Note</label>
                    <input
                      type="text"
                      value={eventDesc}
                      onChange={(e) => setEventDesc(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold uppercase text-xs tracking-wider transition-colors"
                  >
                    Save & Push Tracking Event
                  </button>
                </div>
              </form>

              {/* Customer & Address Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-500" />
                    <span>Customer & Contact</span>
                  </div>
                  <div className="text-neutral-300 leading-relaxed">
                    <strong className="text-white block">{selectedOrder.customerName}</strong>
                    Email: {selectedOrder.customerEmail}
                    <br />
                    Phone: {selectedOrder.customerPhone}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    <span>Delivery Address</span>
                  </div>
                  <div className="text-neutral-300 leading-relaxed">
                    {selectedOrder.shippingAddress.street}
                    <br />
                    {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} -{' '}
                    {selectedOrder.shippingAddress.pincode}
                  </div>
                </div>
              </div>

              {/* Items Ordered */}
              <div className="space-y-3">
                <div className="font-bold text-neutral-200 uppercase tracking-wider">
                  Ordered Equipment ({selectedOrder.items.length})
                </div>

                <div className="space-y-2 divide-y divide-neutral-800 border border-neutral-800 rounded-xl p-3 bg-neutral-950">
                  {selectedOrder.items.map((item, itemIdx) => (
                    <div
                      key={item.id || `${selectedOrder.id}-admin-item-${item.productId}-${itemIdx}`}
                      className="pt-2 first:pt-0 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={item.selectedImage}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover bg-neutral-900 border border-neutral-800"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="font-bold text-neutral-100">{item.name}</div>
                          <div className="text-[11px] text-neutral-400">
                            Color: <strong className="text-amber-400">{item.selectedColor}</strong> | Size:{' '}
                            <strong className="text-neutral-200">{item.selectedSize}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <div className="font-bold text-neutral-100">
                          {item.quantity} × {formatINR(item.price)}
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          {formatINR(item.price * item.quantity)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Calculation */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5 text-right font-mono">
                <div className="flex justify-between text-neutral-400">
                  <span>Subtotal:</span>
                  <span>{formatINR(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount:</span>
                    <span>-{formatINR(selectedOrder.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-neutral-400">
                  <span>Delivery Charge:</span>
                  <span>
                    {selectedOrder.deliveryCharge === 0 ? 'FREE' : formatINR(selectedOrder.deliveryCharge)}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>GST (18% inclusive):</span>
                  <span>{formatINR(selectedOrder.gstAmount)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-neutral-100 pt-2 border-t border-neutral-800">
                  <span>Grand Total:</span>
                  <span className="text-amber-400">{formatINR(selectedOrder.grandTotal)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setTrackingOrder(selectedOrder)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Truck className="w-3.5 h-3.5 text-amber-500" />
                <span>View Customer Tracking View</span>
              </button>

              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
