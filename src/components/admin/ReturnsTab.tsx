import React, { useState } from 'react';
import {
  RotateCcw,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  DollarSign,
  User,
  ArrowRight,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { ReturnRequest } from '../../types';
import { formatINR } from '../../utils/currency';

export const ReturnsTab: React.FC = () => {
  const { returns, updateReturnStatus, orders, showToast } = useStore();

  const [search, setSearch] = useState('');
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);

  // Status update modal state
  const [statusInput, setStatusInput] = useState<ReturnRequest['status']>('APPROVED');
  const [adminNotes, setAdminNotes] = useState('');
  const [refundTxnId, setRefundTxnId] = useState('');

  const filteredReturns = returns.filter((r) => {
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return r.id.toLowerCase().includes(q) || r.orderId.toLowerCase().includes(q) || r.reason.toLowerCase().includes(q);
    }
    return true;
  });

  const handleOpenAction = (ret: ReturnRequest) => {
    setSelectedReturn(ret);
    setStatusInput(ret.status);
    setAdminNotes(ret.adminNotes || '');
    setRefundTxnId(ret.refundTransactionId || `RFND-RZP-${Date.now().toString().slice(-6)}`);
  };

  const handleSaveResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReturn) return;

    updateReturnStatus(selectedReturn.id, statusInput, adminNotes, statusInput === 'REFUND_COMPLETED' ? refundTxnId : undefined);
    setSelectedReturn(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-amber-500">
            Post-Sale Support & Assurance
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-neutral-100 uppercase tracking-tight mt-1">
            Returns, Exchanges & Refunds
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Process size exchanges for jackets and gloves, inspect equipment returns, and disburse refunds to original payment methods.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-neutral-800 border border-neutral-700 text-xs font-mono text-neutral-300">
            Active Requests: {returns.filter((r) => r.status !== 'REFUND_COMPLETED' && r.status !== 'REJECTED').length}
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search return by ID or Order #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-neutral-100 placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Returns Table */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950 border-b border-neutral-800 text-neutral-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Return ID</th>
                <th className="p-4">Order ID</th>
                <th className="p-4">Reason Given</th>
                <th className="p-4">Items to Return</th>
                <th className="p-4">Current Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-800/80">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-500">
                    No return or exchange requests recorded.
                  </td>
                </tr>
              ) : (
                filteredReturns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-neutral-850/60 transition-colors">
                    <td className="p-4 font-mono font-bold text-amber-400">#{ret.id}</td>
                    <td className="p-4 font-mono text-neutral-300">{ret.orderId}</td>
                    <td className="p-4 max-w-xs text-neutral-200">{ret.reason}</td>
                    <td className="p-4 text-neutral-400 font-medium">
                      {ret.items.map((i) => `${i.name} (x${i.quantity})`).join(', ')}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          ret.status === 'REFUND_COMPLETED'
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            : ret.status === 'REJECTED'
                            ? 'bg-red-950 text-red-400 border-red-800'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {ret.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleOpenAction(ret)}
                        className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-amber-500 hover:text-black text-neutral-200 text-xs font-bold transition-colors"
                      >
                        Review & Resolve
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolution Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 text-neutral-200 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-bold text-sm text-neutral-100 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-500" />
                <span>Resolve Return Request #{selectedReturn.id}</span>
              </h3>
              <button
                onClick={() => setSelectedReturn(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveResolution} className="space-y-4">
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                <div className="text-neutral-400">Customer Reason:</div>
                <div className="text-neutral-200 font-semibold">{selectedReturn.reason}</div>
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Update Status *</label>
                <select
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value as any)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-bold focus:border-amber-500 focus:outline-none"
                >
                  <option value="REQUESTED">REQUESTED</option>
                  <option value="UNDER_REVIEW">UNDER REVIEW</option>
                  <option value="APPROVED">APPROVED (Pickup Scheduled)</option>
                  <option value="REFUND_INITIATED">REFUND INITIATED</option>
                  <option value="REFUND_COMPLETED">REFUND COMPLETED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              {statusInput === 'REFUND_COMPLETED' && (
                <div className="space-y-1">
                  <label className="text-emerald-400 font-medium">
                    Refund Transaction Reference ID (UPI / Gateway)
                  </label>
                  <input
                    type="text"
                    required
                    value={refundTxnId}
                    onChange={(e) => setRefundTxnId(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-mono font-bold focus:border-emerald-500 focus:outline-none"
                    placeholder="RFND-RZP-981245"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Admin Notes / Reason to Rider</label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-neutral-100 focus:border-amber-500 focus:outline-none"
                  placeholder="e.g. Return pickup scheduled for tomorrow. Replacement size L dispatched."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReturn(null)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold uppercase tracking-wider"
                >
                  Apply Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
