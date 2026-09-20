import React, { useState } from 'react';
import {
  Users,
  Shield,
  ShieldCheck,
  UserPlus,
  Key,
  Lock,
  Mail,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit2,
  User,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { UserAccount, UserRole } from '../../types';

export const UsersRolesTab: React.FC = () => {
  const { usersList, saveUser, currentUser, loginAs, showToast } = useStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // Form inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('ADMIN');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const handleOpenNew = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setRole('ADMIN');
    setStatus('ACTIVE');
    setModalOpen(true);
  };

  const handleOpenEdit = (user: UserAccount) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setStatus(user.status);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    await saveUser({
      ...(editingUser ? { id: editingUser.id } : {}),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      status,
    });

    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Role-Based Access Control (RBAC)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-neutral-100 uppercase tracking-tight mt-1">
            Staff, Team & Role Permissions
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-xl">
            Super Admins, Store Managers, and Warehouse Operators have strict role boundaries to safeguard
            payment credentials, customer PII, and financial tax records.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-2 shadow-lg shadow-amber-500/20 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Team Member</span>
        </button>
      </div>

      {/* Role Matrix Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-neutral-900 border border-amber-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">SUPER_ADMIN</span>
            <Shield className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed">
            Full root privilege across company entity details, GSTIN, payment gateways, team management, and product deletions.
          </p>
          <div className="text-[11px] text-neutral-500 pt-1 font-mono">
            {usersList.filter((u) => u.role === 'SUPER_ADMIN').length} Super Admin(s) active
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">ADMIN / OPS</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed">
            Manages day-to-day inventory, product updates, order processing, shipping generation, and return requests.
          </p>
          <div className="text-[11px] text-neutral-500 pt-1 font-mono">
            {usersList.filter((u) => u.role === 'ADMIN').length} Store Operator(s)
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">CUSTOMER</span>
            <User className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed">
            Standard rider profile. Restricted to purchasing, wishlist, order tracking, address book, and return requests.
          </p>
          <div className="text-[11px] text-neutral-500 pt-1 font-mono">
            Client-side accounts & guest riders
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
            Registered Administrators & Staff Accounts
          </h3>
          <span className="text-xs text-neutral-500 font-mono">{usersList.length} Team Members</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950 text-neutral-400 font-bold uppercase text-[10px] tracking-wider border-b border-neutral-800">
              <tr>
                <th className="py-3.5 px-4">User Details</th>
                <th className="py-3.5 px-4">Assigned Role</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4">Last Login</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {usersList.map((user) => (
                <tr key={user.id} className="hover:bg-neutral-850/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-800 text-amber-400 font-bold flex items-center justify-center text-xs">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-neutral-200">{user.name}</div>
                        <div className="text-[11px] text-neutral-400 font-mono">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        user.role === 'SUPER_ADMIN'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : user.role === 'ADMIN'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                          : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                      }`}
                    >
                      <Shield className="w-3 h-3" />
                      <span>{user.role}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        user.status === 'ACTIVE'
                          ? 'bg-emerald-950 text-emerald-400'
                          : 'bg-red-950 text-red-400'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      <span>{user.status}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-neutral-400 font-mono text-[11px]">
                    {user.lastLogin
                      ? new Date(user.lastLogin).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Never'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(user)}
                        className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                        title="Edit Permissions"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Create User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 text-neutral-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-bold text-sm text-neutral-100 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-500" />
                <span>{editingUser ? 'Edit Team Member' : 'Invite Team Member'}</span>
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-neutral-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Anand Mahindra"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-neutral-100 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-medium">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@store.com"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-neutral-100 focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-neutral-400 font-medium">Role Access</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-neutral-100 focus:border-amber-500 focus:outline-none font-bold"
                  >
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="CUSTOMER">CUSTOMER</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-neutral-400 font-medium">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-neutral-100 focus:border-amber-500 focus:outline-none font-bold"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-400 space-y-1">
                <div className="font-semibold text-neutral-300 flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-amber-500" />
                  <span>Credential Security Protocol:</span>
                </div>
                <p>
                  Invitations send an encrypted login link. Passwords and two-factor auth tokens are never stored in plain text.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
