'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Search,
  RefreshCw,
  Sparkles,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  UserCheck,
  UserX,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { User, UserRole } from '@/lib/types';
import { deleteUserApi, getUsersApi, updateUserRoleApi, updateUserStatusApi } from '@/lib/api';

export default function AdminUsersPage() {
  const router = useRouter();
  const { user: currentUser, isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();
  const { toast } = useNotification();

  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUsersApi(1, 50, search);
      setUsers(res.users);
      setTotal(res.total);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch users', 'Admin Error');
    } finally {
      setLoading(false);
    }
  }, [search]);

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
    const newRole = targetUser.role === UserRole.ADMIN ? UserRole.USER : UserRole.ADMIN;
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
      toast.success(`Account for ${targetUser.email} ${newStatus ? 'activated' : 'deactivated'}.`, 'Status Updated');
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

  if (authLoading || (!isAdmin && isAuthenticated)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top bar navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition shadow-sm"
              title="Return to Studio Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-purple-950/70 border border-purple-800/60 text-purple-400">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <h1 className="text-2xl font-black text-white font-display">
                  Admin User Management
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Centralized Role-Based Access Control (RBAC) &amp; account provisioning
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email..."
                className="w-full pl-9 pr-3 py-2 bg-slate-900 rounded-xl border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              onClick={() => fetchUsers()}
              className="p-2 bg-slate-900 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition shadow-sm cursor-pointer"
              title="Refresh User List"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              <h2 className="font-bold text-base text-white">
                Registered Users ({total})
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-6">User</th>
                  <th className="py-3.5 px-6">Role</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Created Date</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-medium">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      {loading ? 'Loading users...' : 'No users found.'}
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    const isBusy = actionLoading === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-4 px-6">
                          <div className="font-bold text-white text-sm">{u.name}</div>
                          <div className="text-slate-400 font-mono text-[11px]">{u.email}</div>
                          {isSelf && (
                            <span className="inline-block text-[9px] font-bold text-purple-400 bg-purple-950/80 border border-purple-800/60 px-1.5 py-0.5 rounded mt-0.5">
                              (You / Current Session)
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-6">
                          {u.role === UserRole.ADMIN ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-purple-950/80 text-purple-300 border border-purple-700/60">
                              <Shield className="w-3 h-3 text-purple-400" />
                              <span>ADMIN</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                              <span>USER</span>
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-6">
                          {u.isActive ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full text-[10px]">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-400 font-bold bg-rose-950/60 border border-rose-800/60 px-2 py-0.5 rounded-full text-[10px]">
                              Deactivated
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-slate-400 font-mono text-[11px]">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="inline-flex items-center gap-2">
                            {/* Toggle Role */}
                            <button
                              disabled={isSelf || isBusy}
                              onClick={() => handleRoleToggle(u)}
                              className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition ${
                                u.role === UserRole.ADMIN
                                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                                  : 'bg-purple-950 text-purple-300 hover:bg-purple-900 border border-purple-800/60'
                              } disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer`}
                            >
                              {u.role === UserRole.ADMIN ? 'Demote to User' : 'Promote to Admin'}
                            </button>

                            {/* Toggle Status */}
                            <button
                              disabled={isSelf || isBusy}
                              onClick={() => handleStatusToggle(u)}
                              className={`p-1.5 rounded-lg border transition ${
                                u.isActive
                                  ? 'border-amber-800/60 text-amber-400 hover:bg-amber-950/40'
                                  : 'border-emerald-800/60 text-emerald-400 hover:bg-emerald-950/40'
                              } disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer`}
                              title={u.isActive ? 'Deactivate Account' : 'Activate Account'}
                            >
                              {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>

                            {/* Delete Account */}
                            <button
                              disabled={isSelf || isBusy}
                              onClick={() => handleDelete(u)}
                              className="p-1.5 rounded-lg border border-rose-800/60 text-rose-400 hover:bg-rose-950/40 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
    </main>
  );
}
