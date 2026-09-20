import React, { useState } from 'react';
import { Download, FileSpreadsheet, Users, RefreshCw, CheckCircle2, Sparkles, HelpCircle, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface ExportDataButtonProps {
  variant?: 'full' | 'compact' | 'orders-only' | 'customers-only';
  className?: string;
}

export const ExportDataButton: React.FC<ExportDataButtonProps> = ({
  variant = 'full',
  className = '',
}) => {
  const { orders, customers, products } = useStore();
  const [downloadingType, setDownloadingType] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showAiGuide, setShowAiGuide] = useState(false);

  // Helper to safely escape CSV values
  const escapeCsv = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const handleDownload = (type: 'orders' | 'customers' | 'products' = 'orders') => {
    try {
      setDownloadingType(type);
      setFeedback(null);

      let csvContent = '';
      const dateTag = new Date().toISOString().slice(0, 10);
      let filename = `ridex_${type}_export_${dateTag}.csv`;

      if (type === 'customers') {
        const headers = [
          'Customer ID',
          'Name',
          'Email',
          'Phone',
          'Account Status',
          'Registered Date',
          'Total Orders',
          'Total Spent (INR)',
          'Last Order Date',
          'City',
          'State',
        ];

        const rows = customers.map((c) => [
          escapeCsv(c.id),
          escapeCsv(c.name),
          escapeCsv(c.email),
          escapeCsv(c.phone),
          escapeCsv(c.status || 'ACTIVE'),
          escapeCsv(c.createdAt || c.registeredAt || '2025-01-15'),
          escapeCsv(c.totalOrders || 0),
          escapeCsv(c.totalSpent || 0),
          escapeCsv(c.lastOrderDate || 'N/A'),
          escapeCsv(c.defaultAddress?.city || 'Bengaluru'),
          escapeCsv(c.defaultAddress?.state || 'Karnataka'),
        ]);

        csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
        filename = `ridex_customers_export_${dateTag}.csv`;
      } else if (type === 'orders') {
        const headers = [
          'Order ID',
          'Order Date',
          'Customer Name',
          'Customer Email',
          'Items Count',
          'Items Summary',
          'Total Amount (INR)',
          'Order Status',
          'Payment Method',
          'Payment Status',
          'Courier Partner',
          'Tracking Number / AWB',
          'Shipping City',
          'Shipping State',
        ];

        const rows = orders.map((o) => {
          const itemsSummary = (o.items || [])
            .map((item) => `${item.name || item.productName || 'Gear'} (x${item.quantity})`)
            .join('; ');

          return [
            escapeCsv(o.id),
            escapeCsv(o.orderDate || o.createdAt || dateTag),
            escapeCsv(o.customerName || o.shippingAddress?.fullName || 'Customer'),
            escapeCsv(o.customerEmail || 'customer@ridexgear.in'),
            escapeCsv((o.items || []).length),
            escapeCsv(itemsSummary),
            escapeCsv(o.totalAmount || o.total || 0),
            escapeCsv(o.status),
            escapeCsv(o.paymentMethod || 'Razorpay UPI'),
            escapeCsv(o.paymentStatus || 'PAID'),
            escapeCsv(o.shipment?.courier || o.courierPartner || 'Delhivery Express'),
            escapeCsv(o.shipment?.trackingNumber || o.trackingNumber || 'AWB-RDX-9901'),
            escapeCsv(o.shippingAddress?.city || 'Bengaluru'),
            escapeCsv(o.shippingAddress?.state || 'Karnataka'),
          ];
        });

        csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
        filename = `ridex_orders_export_${dateTag}.csv`;
      } else {
        const headers = [
          'Product ID',
          'Name',
          'SKU',
          'Category',
          'Brand',
          'Price (INR)',
          'Original Price (INR)',
          'Stock',
          'Status',
        ];

        const rows = products.map((p) => [
          escapeCsv(p.id),
          escapeCsv(p.name),
          escapeCsv(p.sku),
          escapeCsv(p.category),
          escapeCsv(p.brand),
          escapeCsv(p.price),
          escapeCsv(p.originalPrice),
          escapeCsv(p.stock),
          escapeCsv(p.status || 'PUBLISHED'),
        ]);

        csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
        filename = `ridex_products_export_${dateTag}.csv`;
      }

      // Pure client-side CSV Blob download without 404 network requests
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      const label = type === 'orders' ? 'Sales & Orders' : type === 'customers' ? 'Customers' : 'Products';
      setFeedback(`Downloaded ${label} CSV!`);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      console.error('Error exporting data:', err);
      alert('Error exporting data: ' + (err.message || 'Unknown error'));
    } finally {
      setDownloadingType(null);
    }
  };

  return (
    <div className={`inline-flex flex-wrap items-center gap-2 ${className}`}>
      {/* 1. Export Sales & Orders Button */}
      {(variant === 'full' || variant === 'orders-only') && (
        <button
          type="button"
          onClick={() => handleDownload('orders')}
          disabled={downloadingType !== null}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
          title="Export real-time sales & order history to CSV for spreadsheets or AI Studio analysis"
          id="export-orders-csv-btn"
        >
          {downloadingType === 'orders' ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <FileSpreadsheet className="w-3.5 h-3.5" />
          )}
          <span>{downloadingType === 'orders' ? 'Exporting...' : 'Export Sales & Orders (CSV)'}</span>
        </button>
      )}

      {/* 2. Export Customers Button */}
      {(variant === 'full' || variant === 'customers-only') && (
        <button
          type="button"
          onClick={() => handleDownload('customers')}
          disabled={downloadingType !== null}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
          title="Export customer profiles, contacts & order metrics to CSV"
          id="export-customers-csv-btn"
        >
          {downloadingType === 'customers' ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Users className="w-3.5 h-3.5" />
          )}
          <span>{downloadingType === 'customers' ? 'Exporting...' : 'Export Customers'}</span>
        </button>
      )}

      {/* AI Studio Analysis Guide Trigger */}
      <button
        type="button"
        onClick={() => setShowAiGuide(true)}
        className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-amber-400 border border-neutral-800 text-xs transition-colors cursor-pointer"
        title="View how to analyze this CSV in Google AI Studio"
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span className="hidden sm:inline">AI Studio Guide</span>
      </button>

      {/* Download Success Notice */}
      {feedback && (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800/80 animate-fade-in">
          <CheckCircle2 className="w-3 h-3" />
          <span>{feedback}</span>
        </span>
      )}

      {/* AI Studio Guidance Modal */}
      {showAiGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-neutral-100 uppercase tracking-wide">
                    Analyze in Google AI Studio
                  </h4>
                  <p className="text-[11px] text-neutral-400">How to use your exported CSV data</p>
                </div>
              </div>
              <button
                onClick={() => setShowAiGuide(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-neutral-300">
              <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                <div className="font-bold text-neutral-100 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-black">
                    1
                  </span>
                  <span>Export &amp; Save to Downloads</span>
                </div>
                <p className="text-[11px] text-neutral-400 pl-7">
                  Click the <strong className="text-neutral-200">Export Sales &amp; Orders (CSV)</strong> or{' '}
                  <strong className="text-neutral-200">Export Customers</strong> button above. The CSV will save straight to your device&apos;s Downloads folder.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                <div className="font-bold text-neutral-100 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-black">
                    2
                  </span>
                  <span>Attach in Google AI Studio Prompt</span>
                </div>
                <p className="text-[11px] text-neutral-400 pl-7">
                  Open Google AI Studio, click <strong className="text-amber-400">+ (Add File)</strong> in the prompt box, and attach your exported CSV.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                <div className="font-bold text-neutral-100 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-black">
                    3
                  </span>
                  <span>Try Sample Prompts</span>
                </div>
                <div className="pl-7 space-y-1 text-[11px] font-mono text-amber-300/90 bg-neutral-900 p-2.5 rounded-xl border border-neutral-800">
                  <div>&quot;Analyze total sales trends, revenue, and average order value.&quot;</div>
                  <div>&quot;Which riding gear products have the highest repeat orders?&quot;</div>
                  <div>&quot;Segment customers by total spending and recommend retention offers.&quot;</div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAiGuide(false)}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Got it, Close Guide
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
