import React, { useState } from 'react';
import {
  Users,
  Search,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  ExternalLink,
  MapPin,
  X,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Customer } from '../../types';
import { formatINR } from '../../utils/currency';
import { ExportDataButton } from './ExportDataButton';

export const CustomersTab: React.FC = () => {
  const { customers, orders } = useStore();

  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filteredCustomers = customers.filter((c) => {
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate live orders and total spent for selected customer
  const customerOrders = selectedCustomer
    ? orders.filter(
        (o) => o.customerId === selectedCustomer.id || o.customerEmail === selectedCustomer.email
      )
    : [];

  const customerTotalSpent = customerOrders.reduce((sum, o) => sum + o.grandTotal, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-amber-500">
            Rider CRM & User Base
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-neutral-100 uppercase tracking-tight mt-1">
            Registered Customers & Riders
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Track touring riders, order histories, total lifetime expenditure, and registered shipping addresses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-neutral-800 border border-neutral-700 text-xs font-mono text-neutral-300">
            Total Riders: {customers.length}
          </span>
        </div>
      </div>

      {/* Search Bar & Export Actions Toolbar */}
      <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col sm:flex-row gap-3 items-center justify-between text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search rider by name, phone or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-neutral-100 placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="w-full sm:w-auto flex items-center justify-end">
          <ExportDataButton variant="full" />
        </div>
      </div>

      {/* Customer Table */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950 border-b border-neutral-800 text-neutral-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Rider Profile</th>
                <th className="p-4">Customer ID</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Orders</th>
                <th className="p-4">Total Spending (INR)</th>
                <th className="p-4">Registered Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-800/80">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-500">
                    No customers found matching search.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const custOrders = orders.filter(
                    (o) => o.customerId === cust.id || o.customerEmail === cust.email
                  );
                  const totalSpent = custOrders.length > 0
                    ? custOrders.reduce((acc, o) => acc + o.grandTotal, 0)
                    : cust.totalSpending;

                  return (
                    <tr key={cust.id} className="hover:bg-neutral-850/60 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                            {cust.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-neutral-100">{cust.name}</div>
                            <div className="text-[11px] text-neutral-400">{cust.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-neutral-400">{cust.id}</td>
                      <td className="p-4 text-neutral-300 font-mono">{cust.phone}</td>
                      <td className="p-4 font-semibold text-neutral-200">
                        {custOrders.length || cust.totalOrders} orders
                      </td>
                      <td className="p-4 font-mono font-bold text-amber-400">
                        {formatINR(totalSpent)}
                      </td>
                      <td className="p-4 text-neutral-400">
                        {new Date(cust.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedCustomer(cust)}
                          className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs"
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Drawer / Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col text-xs">
            <div className="p-5 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-base">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-100">{selectedCustomer.name}</h3>
                  <div className="text-[11px] text-neutral-400">
                    ID: {selectedCustomer.id} • Registered:{' '}
                    {new Date(selectedCustomer.createdAt).toLocaleDateString('en-IN')}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Financial & Order Metric Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                  <div className="text-neutral-400">Lifetime Orders</div>
                  <div className="text-lg font-black text-neutral-100 font-mono">
                    {customerOrders.length}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                  <div className="text-neutral-400">Total Spent</div>
                  <div className="text-lg font-black text-amber-400 font-mono">
                    {formatINR(customerTotalSpent)}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="font-bold text-neutral-200 uppercase tracking-wider">
                  Contact Information
                </div>
                <div className="grid grid-cols-2 gap-2 text-neutral-300">
                  <div>
                    <span className="text-neutral-500 block text-[11px]">Email</span>
                    {selectedCustomer.email}
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[11px]">Phone</span>
                    {selectedCustomer.phone}
                  </div>
                </div>
              </div>

              {/* Delivery Addresses */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  <span>Primary Registered Address</span>
                </div>
                {selectedCustomer.addresses?.[0] ? (
                  <div className="text-neutral-300 leading-relaxed">
                    {selectedCustomer.addresses[0].street}
                    <br />
                    {selectedCustomer.addresses[0].city}, {selectedCustomer.addresses[0].state} -{' '}
                    {selectedCustomer.addresses[0].pincode}
                  </div>
                ) : (
                  <div className="text-neutral-500">No address on file yet.</div>
                )}
              </div>

              {/* Order History */}
              <div className="space-y-2">
                <div className="font-bold text-neutral-200 uppercase tracking-wider">
                  Recent Orders ({customerOrders.length})
                </div>
                {customerOrders.length === 0 ? (
                  <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-500 text-center">
                    No orders placed yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customerOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-mono font-bold text-amber-400">
                            #{ord.orderNumber}
                          </div>
                          <div className="text-[11px] text-neutral-400">
                            {new Date(ord.createdAt).toLocaleDateString('en-IN')} • {ord.items.length} items
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-neutral-100">
                            {formatINR(ord.grandTotal)}
                          </div>
                          <span className="text-[10px] uppercase font-bold text-amber-500">
                            {ord.orderStatus.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex justify-end">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 font-semibold"
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
