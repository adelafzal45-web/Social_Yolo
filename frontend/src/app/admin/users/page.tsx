'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Shield,
  ShieldCheck,
  Search,
  RefreshCw,
  ArrowLeft,
  Trash2,
  UserCheck,
  UserX,
  UserPlus,
  CreditCard,
  X,
  Key,
  Coins,
  Calendar,
  DollarSign,
  History,
  Edit3,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { User, UserRole, UserBillingDetails } from '@/lib/types';
import {
  deleteUserApi,
  getUsersApi,
  updateUserRoleApi,
  updateUserStatusApi,
  adminCreateUserApi,
  adminUpdateUserApi,
  adminGetUserBillingApi,
} from '@/lib/api';

export default function AdminUsersPage() {
  const router = useRouter();
  const { user: currentUser, isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();
  const { toast } = useNotification();

  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showBillingModal, setShowBillingModal] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userBilling, setUserBilling] = useState<UserBillingDetails | null>(null);
  const [billingLoading, setBillingLoading] = useState<boolean>(false);

  // Create Form State
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    plan: 'free_trial',
    credits: 50,
  });

  // Edit Form State
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: 'user',
    status: 'active',
    plan: 'free_trial',
    credits: 50,
    newPassword: '',
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUsersApi(1, 100, search);
      setUsers(res.users);
      setTotal(res.total);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch users', 'Admin Error');
    } finally {
      setLoading(false);
    }
  }, [search, toast]);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login?redirect=/admin/users');
      } else if (!isAdmin) {
        router.push('/');
      } else {
        fetchUsers();
      }
    }
  }, [authLoading, isAuthenticated, isAdmin, router, fetchUsers]);

  const handleRoleToggle = async (targetUser: User) => {
    const isTargetAdmin = targetUser.role?.toLowerCase() === 'admin';
    const newRole = isTargetAdmin ? UserRole.USER : UserRole.ADMIN;
    setActionLoading(targetUser.id);
    try {
      await updateUserRoleApi(targetUser.id, newRole);
      toast.success(`Role for ${targetUser.email} updated to ${newRole.toUpperCase()}.`, 'Role Updated');
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update role', 'Error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusToggle = async (targetUser: User) => {
    const newStatus = !targetUser.isActive;
    setActionLoading(targetUser.id);
    try {
      await updateUserStatusApi(targetUser.id, newStatus);
      toast.success(
        `Account for ${targetUser.email} ${newStatus ? 'activated' : 'deactivated'}.`,
        'Status Updated'
      );
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status', 'Error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (targetUser: User) => {
    if (!confirm(`Are you sure you want to permanently delete user ${targetUser.email}?`)) {
      return;
    }
    setActionLoading(targetUser.id);
    try {
      await deleteUserApi(targetUser.id);
      toast.success(`User ${targetUser.email} has been deleted.`, 'User Deleted');
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user', 'Delete Error');
    } finally {
      setActionLoading(null);
    }
  };

  // Open Edit Modal
  const openEditModal = (targetUser: User) => {
    setSelectedUser(targetUser);
    setEditForm({
      name: targetUser.name || '',
      email: targetUser.email || '',
      role: targetUser.role || 'user',
      status: targetUser.isActive ? 'active' : 'suspended',
      plan: targetUser.plan || 'free_trial',
      credits: targetUser.credits ?? 50,
      newPassword: '',
    });
    setShowEditModal(true);
  };

  // Submit Edit Form
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setActionLoading(selectedUser.id);
    try {
      await adminUpdateUserApi(selectedUser.id, {
        name: editForm.name,
        role: editForm.role,
        status: editForm.status as 'active' | 'suspended' | 'banned',
        plan: editForm.plan,
        credits: Number(editForm.credits),
        password: editForm.newPassword.trim() ? editForm.newPassword.trim() : undefined,
      });

      toast.success(`User ${selectedUser.email} successfully updated!`, 'User Updated');
      setShowEditModal(false);
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user', 'Update Error');
    } finally {
      setActionLoading(null);
    }
  };

  // Submit Create Form
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.email || !createForm.password) {
      toast.error('Email and password are required', 'Validation Error');
      return;
    }

    setActionLoading('creating');
    try {
      await adminCreateUserApi({
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
        role: createForm.role,
        plan: createForm.plan,
        credits: Number(createForm.credits),
      });

      toast.success(`New user ${createForm.email} created successfully!`, 'User Created');
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        email: '',
        password: '',
        role: 'user',
        plan: 'free_trial',
        credits: 50,
      });
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create user', 'Creation Error');
    } finally {
      setActionLoading(null);
    }
  };

  // Open Billing Modal
  const openBillingModal = async (targetUser: User) => {
    setSelectedUser(targetUser);
    setShowBillingModal(true);
    setBillingLoading(true);
    try {
      const details = await adminGetUserBillingApi(targetUser.id);
      setUserBilling(details);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load user billing history', 'Billing Error');
    } finally {
      setBillingLoading(false);
    }
  };

  if (authLoading || (!isAdmin && isAuthenticated)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top bar navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition shadow-sm"
              title="Return to Studio Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800/60 text-purple-600 dark:text-purple-400">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white font-display">
                  Admin User &amp; Billing Management
                </h1>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Centralized RBAC, user provisioning, plan assignments, and SafePay transaction tracking
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email..."
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              onClick={() => fetchUsers()}
              className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition shadow-sm cursor-pointer"
              title="Refresh User List"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-brand-600/20 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create User</span>
            </button>
          </div>
        </div>

        {/* Users Table */}
        {/* Users Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                Registered Users ({total})
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-6">User</th>
                  <th className="py-3.5 px-6">Role</th>
                  <th className="py-3.5 px-6">Plan &amp; Credits</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Created Date</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      {loading ? 'Loading users...' : 'No users found.'}
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    const isBusy = actionLoading === u.id;
                    const isUserAdmin = u.role?.toLowerCase() === 'admin';
                    const dateVal = u.createdAt || (u as any).created_at;
                    const formattedDate = dateVal && !isNaN(new Date(dateVal).getTime())
                      ? new Date(dateVal).toLocaleDateString()
                      : 'N/A';

                    return (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900 dark:text-white text-sm">
                            {u.name || 'Unnamed'}
                          </div>
                          <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">{u.email}</div>
                          {isSelf && (
                            <span className="inline-block text-[9px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800/60 px-1.5 py-0.5 rounded mt-0.5">
                              (You / Current Session)
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-6">
                          {isUserAdmin ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700/60">
                              <Shield className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                              <span>ADMIN</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              <span>USER</span>
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span className="uppercase text-[10px] font-extrabold px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60">
                              {u.plan ? u.plan.replace('_', ' ') : 'FREE TRIAL'}
                            </span>
                            <span className="text-amber-600 dark:text-amber-400 font-bold font-mono text-[11px]">
                              {u.credits ?? 50} cr
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          {u.isActive ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-full text-[10px]">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 px-2 py-0.5 rounded-full text-[10px]">
                              Deactivated
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          {formattedDate}
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {/* View Billing */}
                            <button
                              onClick={() => openBillingModal(u)}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                              title="View Billing &amp; Ledger"
                            >
                              <CreditCard className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                            </button>

                            {/* Edit Profile */}
                            <button
                              onClick={() => openEditModal(u)}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                              title="Edit User Profile"
                            >
                              <Edit3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            </button>

                            {/* Toggle Role */}
                            <button
                              disabled={isSelf || isBusy}
                              onClick={() => handleRoleToggle(u)}
                              className={`px-2 py-1 rounded-lg font-bold text-[10px] transition ${
                                isUserAdmin
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                                  : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900 border border-purple-200 dark:border-purple-800/60'
                              } disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer`}
                            >
                              {isUserAdmin ? 'Demote' : 'Promote'}
                            </button>

                            {/* Toggle Status */}
                            <button
                              disabled={isSelf || isBusy}
                              onClick={() => handleStatusToggle(u)}
                              className={`p-1.5 rounded-lg border transition ${
                                u.isActive
                                  ? 'border-amber-200 dark:border-amber-800/60 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                  : 'border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                              } disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer`}
                              title={u.isActive ? 'Deactivate Account' : 'Activate Account'}
                            >
                              {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>

                            {/* Delete Account */}
                            <button
                              disabled={isSelf || isBusy}
                              onClick={() => handleDelete(u)}
                              className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                              title="Delete Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" role="dialog">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Create New User</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g. Jane Doe"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="At least 8 characters"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">Role</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">Plan Tier</label>
                  <select
                    value={createForm.plan}
                    onChange={(e) => setCreateForm({ ...createForm, plan: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="free_trial">Free Trial (50 cr)</option>
                    <option value="starter">Starter (100 cr)</option>
                    <option value="pro">Pro (350 cr)</option>
                    <option value="agency">Agency (1000 cr)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">Initial Credits</label>
                <input
                  type="number"
                  min={0}
                  value={createForm.credits}
                  onChange={(e) => setCreateForm({ ...createForm, credits: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'creating'}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold transition flex items-center gap-1.5"
                >
                  {actionLoading === 'creating' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserPlus className="w-3.5 h-3.5" />
                  )}
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" role="dialog">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit User: {selectedUser.email}</h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">Account Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended / Deactivated</option>
                    <option value="banned">Banned</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">Plan Tier</label>
                  <select
                    value={editForm.plan}
                    onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="free_trial">Free Trial</option>
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="agency">Agency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">Credits Balance</label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.credits}
                    onChange={(e) => setEditForm({ ...editForm, credits: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">
                  Reset Password (Leave blank to keep current)
                </label>
                <input
                  type="password"
                  minLength={8}
                  value={editForm.newPassword}
                  onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                  placeholder="New password (optional)"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === selectedUser.id}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition flex items-center gap-1.5"
                >
                  {actionLoading === selectedUser.id ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER BILLING DETAILS MODAL */}
      {showBillingModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" role="dialog">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Billing &amp; Ledger: {selectedUser.email}
                </h3>
              </div>
              <button
                onClick={() => setShowBillingModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {billingLoading ? (
              <div className="py-12 flex justify-center items-center">
                <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
              </div>
            ) : userBilling ? (
              <div className="space-y-6 text-xs">
                {/* User Overview */}
                <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Current Plan</span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white uppercase">
                      {userBilling.user?.plan || 'Free Trial'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Available Credits</span>
                    <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                      {userBilling.user?.credits ?? 0} Credits
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Subscription Status</span>
                    <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 uppercase">
                      {userBilling.subscription?.status || 'None / Trial'}
                    </span>
                  </div>
                </div>

                {/* Payments History */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>SafePay Transactions ({userBilling.payments?.length || 0})</span>
                  </h4>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase text-[9px] border-b border-slate-200 dark:border-slate-800 font-bold">
                        <tr>
                          <th className="p-2.5">Date</th>
                          <th className="p-2.5">Amount</th>
                          <th className="p-2.5">Type</th>
                          <th className="p-2.5">Status</th>
                          <th className="p-2.5">Tracker</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                        {userBilling.payments?.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-slate-500">
                              No payments recorded yet.
                            </td>
                          </tr>
                        ) : (
                          userBilling.payments.map((p) => (
                            <tr key={p.id}>
                              <td className="p-2.5 text-slate-500 dark:text-slate-400">
                                {new Date(p.createdAt).toLocaleDateString()}
                              </td>
                              <td className="p-2.5 font-bold font-mono">
                                {p.amount} {p.currency}
                              </td>
                              <td className="p-2.5 capitalize">{p.type}</td>
                              <td className="p-2.5">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                    p.status === 'completed'
                                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                      : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                                  }`}
                                >
                                  {p.status}
                                </span>
                              </td>
                              <td className="p-2.5 font-mono text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                                {p.trackerToken || '-'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Credit Transactions */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <History className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Credit Ledger ({userBilling.creditTransactions?.length || 0})</span>
                  </h4>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase text-[9px] border-b border-slate-200 dark:border-slate-800 font-bold sticky top-0">
                        <tr>
                          <th className="p-2.5">Date</th>
                          <th className="p-2.5">Description</th>
                          <th className="p-2.5">Change</th>
                          <th className="p-2.5">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                        {userBilling.creditTransactions?.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-slate-500">
                              No credit changes recorded.
                            </td>
                          </tr>
                        ) : (
                          userBilling.creditTransactions.map((tx) => (
                            <tr key={tx.id}>
                              <td className="p-2.5 text-slate-500 dark:text-slate-400">
                                {new Date(tx.createdAt).toLocaleDateString()}
                              </td>
                              <td className="p-2.5 font-medium">{tx.description}</td>
                              <td className="p-2.5 font-bold font-mono">
                                <span className={tx.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                                  {tx.amount >= 0 ? `+${tx.amount}` : tx.amount}
                                </span>
                              </td>
                              <td className="p-2.5 font-mono text-slate-500 dark:text-slate-400">{tx.balanceAfter}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-slate-500 text-xs">
                Could not load billing records.
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
