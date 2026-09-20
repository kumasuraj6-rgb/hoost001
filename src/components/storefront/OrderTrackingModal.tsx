import React from 'react';
import {
  X,
  Truck,
  Package,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  Copy,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Order } from '../../types';
import { formatINR } from '../../utils/currency';
import { useStore } from '../../context/StoreContext';

interface OrderTrackingModalProps {
  order?: Order | null;
  onClose?: () => void;
}

const TIMELINE_STEPS: { status: Order['orderStatus']; label: string; description: string }[] = [
  { status: 'CONFIRMED', label: 'Order Confirmed', description: 'Order validated & payment verified' },
  { status: 'PROCESSING', label: 'Processing', description: 'Armor & size allocated from warehouse' },
  { status: 'PACKED', label: 'Packed & Inspected', description: 'Quality inspection passed and securely boxed' },
  { status: 'SHIPPED', label: 'Shipped', description: 'Handed over to courier partner' },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', description: 'Courier rider assigned for doorstep delivery' },
  { status: 'DELIVERED', label: 'Delivered', description: 'Package safely handed to rider' },
];

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({ order: propOrder, onClose: propOnClose }) => {
  const { trackingOrder, setTrackingOrder } = useStore();
  const activeOrder = propOrder !== undefined ? propOrder : trackingOrder;
  const handleClose = propOnClose || (() => setTrackingOrder(null));

  if (!activeOrder) return null;

  return <OrderTrackingModalContent order={activeOrder} onClose={handleClose} />;
};

const OrderTrackingModalContent: React.FC<{ order: Order; onClose: () => void }> = ({ order, onClose }) => {
  const { showToast } = useStore();

  const currentStepIndex = TIMELINE_STEPS.findIndex((s) => s.status === order.orderStatus);
  const isDelivered = order.orderStatus === 'DELIVERED';
  const isCancelled = order.orderStatus === 'CANCELLED';
  const isReturned = order.orderStatus === 'RETURNED' || order.orderStatus === 'RETURN_REQUESTED';

  const handleCopyAWB = () => {
    if (order.shipment?.awbNumber) {
      navigator.clipboard.writeText(order.shipment.awbNumber);
      showToast(`AWB Tracking #${order.shipment.awbNumber} copied to clipboard!`, 'info');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-neutral-100">Live Shipment Tracking</h3>
                <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {order.orderNumber}
                </span>
              </div>
              <div className="text-xs text-neutral-400">
                Logistics Partner:{' '}
                <strong className="text-neutral-200">{order.shipment?.courierName || 'Shiprocket X'}</strong>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Tracking Meta Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
              <div className="text-neutral-500 font-medium">AWB / Tracking Number</div>
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-neutral-200 truncate">
                  {order.shipment?.awbNumber || 'Generating...'}
                </span>
                {order.shipment?.awbNumber && (
                  <button
                    onClick={handleCopyAWB}
                    className="text-amber-500 hover:text-amber-400 p-1"
                    title="Copy AWB"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
              <div className="text-neutral-500 font-medium">Est. Delivery Date</div>
              <div className="font-bold text-neutral-200 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  {order.shipment?.estimatedDeliveryDate
                    ? new Date(order.shipment.estimatedDeliveryDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Within 3-4 Days'}
                </span>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
              <div className="text-neutral-500 font-medium">Destination</div>
              <div className="font-bold text-neutral-200 truncate flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">
                  {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                </span>
              </div>
            </div>
          </div>

          {/* Cancellation or Return Notice */}
          {isCancelled && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-200 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <strong className="block text-red-300 font-bold">This order was cancelled</strong>
                No further transit updates will be recorded.
              </div>
            </div>
          )}

          {/* Visual Progress Timeline (Order Confirmed -> Delivered) */}
          {!isCancelled && (
            <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-6">
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                Shipment Transit Progress
              </div>

              <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-800">
                {TIMELINE_STEPS.map((step, idx) => {
                  const isCompleted =
                    currentStepIndex >= idx ||
                    isDelivered ||
                    (order.orderStatus === 'CONFIRMED' && idx === 0) ||
                    (order.orderStatus === 'SHIPPED' && idx <= 3);
                  const isCurrent = currentStepIndex === idx;

                  return (
                    <div key={step.status} className="relative flex items-start gap-4">
                      {/* Step node */}
                      <div
                        className={`absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isCompleted
                            ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                            : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-bold ${
                              isCurrent
                                ? 'text-amber-400'
                                : isCompleted
                                ? 'text-neutral-100'
                                : 'text-neutral-500'
                            }`}
                          >
                            {step.label}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                              Active Stage
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5">{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Event Activity Log */}
          {order.shipment?.events && order.shipment.events.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                Courier Activity Log
              </div>
              <div className="rounded-xl border border-neutral-800 overflow-hidden bg-neutral-950 divide-y divide-neutral-900 text-xs">
                {order.shipment.events.map((evt) => (
                  <div key={evt.id} className="p-3 flex items-start justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-neutral-200">{evt.description}</div>
                      <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-amber-500" />
                        <span>{evt.location}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                      {new Date(evt.timestamp).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ordered Gear Summary */}
          <div className="space-y-3 pt-2 border-t border-neutral-800">
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-300">
              Items in this Shipment ({order.items.length})
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {order.items.map((item, itemIdx) => (
                <div
                  key={item.id || `${order.id}-track-${item.productId}-${itemIdx}`}
                  className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center gap-3"
                >
                  <img
                    src={item.selectedImage}
                    alt={item.name}
                    className="w-12 h-12 rounded-lg object-cover bg-neutral-900 border border-neutral-800 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <div className="font-bold text-neutral-200 truncate">{item.name}</div>
                    <div className="text-[11px] text-neutral-400">
                      Color: <span className="text-amber-400">{item.selectedColor}</span> | Size:{' '}
                      <span className="text-neutral-200">{item.selectedSize}</span>
                    </div>
                    <div className="text-[11px] text-neutral-300 font-mono">
                      {item.quantity} x {formatINR(item.price)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <div className="text-xs text-neutral-400">
            Total Paid: <strong className="text-neutral-100">{formatINR(order.grandTotal)}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-200 transition-colors"
          >
            Close Tracking
          </button>
        </div>
      </div>
    </div>
  );
};
