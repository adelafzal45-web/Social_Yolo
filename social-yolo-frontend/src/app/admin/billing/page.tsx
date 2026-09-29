'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Zap,
  Coins,
  DollarSign,
  Tag,
  Users,
  FileText,
  Sliders,
  ShieldCheck,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import {
  getAdminBillingStatsApi,
  getAdminPackagesApi,
  createAdminPackageApi,
  updateAdminPackageApi,
  deleteAdminPackageApi,
  getAdminCostsApi,
  updateAdminCostApi,
  getAdminDiscountsApi,
  createAdminDiscountApi,
  updateAdminDiscountApi,
  getAdminWalletsApi,
  adminAdjustWalletApi,
  getAdminTransactionsApi,
  getAdminOrdersApi,
  getAdminAuditLogsApi,
} from '@/lib/api';
import {
  CreditPackage,
  CreditCostItem,
  DiscountItem,
  AdminWalletItem,
  AdminAuditLogItem,
  AdminBillingStats,
  OrderItem,
  UserRole,
} from '@/lib/types';

type AdminTab =
  | 'packages'
  | 'costs'
  | 'discounts'
  | 'wallets'
  | 'transactions'
  | 'orders'
  | 'audit';

export default function AdminBillingPage() {
  const { user } = useAuth();
  const { toast } = useNotification();

  const [activeTab, setActiveTab] = useState<AdminTab>('packages');
  const [stats, setStats] = useState<AdminBillingStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Tab Data State
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [costs, setCosts] = useState<CreditCostItem[]>([]);
  const [discounts, setDiscounts] = useState<DiscountItem[]>([]);
  const [wallets, setWallets] = useState<AdminWalletItem[]>([]);
  const [walletSearch, setWalletSearch] = useState<string>('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogItem[]>([]);

  // Modals
  const [showPackageModal, setShowPackageModal] = useState<boolean>(false);
  const [editingPackage, setEditingPackage] = useState<CreditPackage | null>(null);
  const [packageForm, setPackageForm] = useState({
    name: '',
    description: '',
    credits: 100,
    price: 5.0,
    currency: 'USD',
    discountPercentage: 0,
    isActive: true,
    isFeatured: false,
    displayOrder: 1,
  });

  const [showCostModal, setShowCostModal] = useState<boolean>(false);
  const [editingCost, setEditingCost] = useState<CreditCostItem | null>(null);
  const [costForm, setCostForm] = useState({ creditCost: 5, reason: '' });

  const [showDiscountModal, setShowDiscountModal] = useState<boolean>(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountItem | null>(null);
  const [discountForm, setDiscountForm] = useState({
    code: '',
    type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    value: 20,
    minimumPurchase: 0,
    maximumDiscount: 0,
    usageLimit: 500,
    perUserLimit: 1,
    isActive: true,
  });

  const [showAdjustModal, setShowAdjustModal] = useState<boolean>(false);
  const [adjustTargetUser, setAdjustTargetUser] = useState<AdminWalletItem | null>(null);
  const [adjustForm, setAdjustForm] = useState({
    amount: 50,
    action: 'add' as 'add' | 'remove' | 'refund',
    reason: '',
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadStatsAndTab = async () => {
    setLoading(true);
    try {
      const statsData = await getAdminBillingStatsApi().catch(() => null);
      setStats(statsData);

      if (activeTab === 'packages') {
        const pkgs = await getAdminPackagesApi();
        setPackages(pkgs);
      } else if (activeTab === 'costs') {
        const c = await getAdminCostsApi();
        setCosts(c);
      } else if (activeTab === 'discounts') {
        const d = await getAdminDiscountsApi();
        setDiscounts(d);
      } else if (activeTab === 'wallets') {
        const w = await getAdminWalletsApi(walletSearch);
        setWallets(w.items);
      } else if (activeTab === 'transactions') {
        const t = await getAdminTransactionsApi({ limit: 50 });
        setTransactions(t.items);
      } else if (activeTab === 'orders') {
        const o = await getAdminOrdersApi({ limit: 50 });
        setOrders(o.items);
      } else if (activeTab === 'audit') {
        const a = await getAdminAuditLogsApi({ limit: 50 });
        setAuditLogs(a.items);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load admin billing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatsAndTab();
  }, [activeTab]);

  // Handle Search in Wallets
  const handleWalletSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const w = await getAdminWalletsApi(walletSearch);
      setWallets(w.items);
    } finally {
      setLoading(false);
    }
  };

  // --- PACKAGE ACTIONS ---
  const openCreatePackage = () => {
    setEditingPackage(null);
    setPackageForm({
      name: '',
      description: '',
      credits: 100,
      price: 5.0,
      currency: 'USD',
      discountPercentage: 0,
      isActive: true,
      isFeatured: false,
      displayOrder: packages.length + 1,
    });
    setShowPackageModal(true);
  };

  const openEditPackage = (pkg: CreditPackage) => {
    setEditingPackage(pkg);
    setPackageForm({
      name: pkg.name,
      description: pkg.description || '',
      credits: pkg.credits,
      price: Number(pkg.price),
      currency: pkg.currency,
      discountPercentage: pkg.discountPercentage,
      isActive: pkg.isActive,
      isFeatured: pkg.isFeatured,
      displayOrder: pkg.displayOrder,
    });
    setShowPackageModal(true);
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingPackage) {
        await updateAdminPackageApi(editingPackage.id, packageForm);
        toast.success(`Updated package '${packageForm.name}'`, 'Saved');
      } else {
        await createAdminPackageApi(packageForm);
        toast.success(`Created package '${packageForm.name}'`, 'Package Created');
      }
      setShowPackageModal(false);
      loadStatsAndTab();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save package');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePackage = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to disable package '${name}'?`)) return;
    try {
      await deleteAdminPackageApi(id);
      toast.info(`Package '${name}' disabled`, 'Archived');
      loadStatsAndTab();
    } catch (err: any) {
      toast.error(err.message || 'Failed to disable package');
    }
  };

  // --- CREDIT COST ACTIONS ---
  const openEditCost = (cost: CreditCostItem) => {
    setEditingCost(cost);
    setCostForm({ creditCost: cost.creditCost, reason: '' });
    setShowCostModal(true);
  };

  const handleSaveCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCost) return;
    if (!costForm.reason.trim()) {
      toast.error('A reason is mandatory for modifying feature credit cost.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateAdminCostApi(editingCost.id, costForm.creditCost, costForm.reason.trim());
      toast.success(`Updated cost for ${editingCost.name} to ${costForm.creditCost} credits`, 'Cost Updated');
      setShowCostModal(false);
      loadStatsAndTab();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update cost');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- DISCOUNT ACTIONS ---
  const openCreateDiscount = () => {
    setEditingDiscount(null);
    setDiscountForm({
      code: '',
      type: 'PERCENTAGE',
      value: 20,
      minimumPurchase: 0,
      maximumDiscount: 0,
      usageLimit: 500,
      perUserLimit: 1,
      isActive: true,
    });
    setShowDiscountModal(true);
  };

  const openEditDiscount = (d: DiscountItem) => {
    setEditingDiscount(d);
    setDiscountForm({
      code: d.code,
      type: d.type,
      value: Number(d.value),
      minimumPurchase: Number(d.minimumPurchase || 0),
      maximumDiscount: Number(d.maximumDiscount || 0),
      usageLimit: d.usageLimit || 0,
      perUserLimit: d.perUserLimit || 1,
      isActive: d.isActive,
    });
    setShowDiscountModal(true);
  };

  const handleSaveDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingDiscount) {
        await updateAdminDiscountApi(editingDiscount.id, discountForm);
        toast.success(`Updated coupon code '${discountForm.code}'`, 'Saved');
      } else {
        await createAdminDiscountApi(discountForm);
        toast.success(`Created coupon code '${discountForm.code}'`, 'Coupon Created');
      }
      setShowDiscountModal(false);
      loadStatsAndTab();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save coupon');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- WALLET ADJUSTMENT ACTIONS ---
  const openAdjustWallet = (item: AdminWalletItem) => {
    setAdjustTargetUser(item);
    setAdjustForm({
      amount: 50,
      action: 'add',
      reason: '',
    });
    setShowAdjustModal(true);
  };

  const handleSaveAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTargetUser) return;
    if (!adjustForm.reason.trim()) {
      toast.error('A mandatory audit reason must be supplied for credit adjustment.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await adminAdjustWalletApi(
        adjustTargetUser.userId,
        adjustForm.amount,
        adjustForm.action,
        adjustForm.reason.trim(),
      );
      toast.success(res.message, 'Credits Adjusted');
      setShowAdjustModal(false);
      loadStatsAndTab();
    } catch (err: any) {
      toast.error(err.message || 'Adjustment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user?.role !== UserRole.ADMIN) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Lock className="w-12 h-12 text-rose-500 animate-bounce" />
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Admin Privileges Required</h2>
        <p className="text-xs text-slate-500 max-w-md">
          You must be an authenticated administrator to access the Financial, Wallet, and Pricing Management System.
        </p>
        <Link
          href="/dashboard"
          className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-20">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Central Hub</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Credit, Pricing & Financial Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Database-driven pricing packages, feature credit costs, promo codes, user wallet adjustments, and immutable ledgers.
          </p>
        </div>

        <button
          onClick={loadStatsAndTab}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold hover:border-brand-500 transition shadow-sm self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh All</span>
        </button>
      </div>

      {/* Metrics Banner */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Revenue</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              ${stats.totalRevenue.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-500">{stats.totalOrdersPaid} completed orders</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Circulating Credits</span>
            <div className="text-2xl font-black text-brand-600 dark:text-brand-400 mt-1">
              {stats.totalCirculatingCredits}
            </div>
            <span className="text-[10px] text-slate-500">Across {stats.totalUsers} registered users</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Credits Consumed</span>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
              {stats.totalCreditsConsumed}
            </div>
            <span className="text-[10px] text-slate-500">Used by AI operations</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Credits Purchased</span>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {stats.totalCreditsPurchased}
            </div>
            <span className="text-[10px] text-slate-500">Acquired via packages</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Deals</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {stats.activePackages} Pkgs / {stats.activeDiscounts} Coups
            </div>
            <span className="text-[10px] text-slate-500">Available on checkout</span>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 text-xs font-bold scrollbar-none">
        {[
          { id: 'packages', label: 'Credit Packages', icon: CreditCard },
          { id: 'costs', label: 'Feature Costs', icon: Sliders },
          { id: 'discounts', label: 'Discounts & Coupons', icon: Tag },
          { id: 'wallets', label: 'User Wallets', icon: Users },
          { id: 'transactions', label: 'Ledger Transactions', icon: Coins },
          { id: 'orders', label: 'Purchase Orders', icon: DollarSign },
          { id: 'audit', label: 'Audit Logs', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-brand-600 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: CREDIT PACKAGES */}
      {activeTab === 'packages' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Credit Packages</h2>
              <p className="text-xs text-slate-500">Configure prices, credit amounts, and featured bundles.</p>
            </div>
            <button
              onClick={openCreatePackage}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Package</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-slate-900 dark:text-white">{pkg.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        pkg.isActive
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {pkg.isActive ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    ${Number(pkg.price).toFixed(2)} <span className="text-xs text-slate-400 font-normal">{pkg.currency}</span>
                  </div>
                  <div className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                    {pkg.credits} Credits {pkg.discountPercentage > 0 && `(${pkg.discountPercentage}% OFF)`}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {pkg.description || 'Standard creative bundle.'}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => openEditPackage(pkg)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Edit Package"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {pkg.isActive && (
                    <button
                      onClick={() => handleDeletePackage(pkg.id, pkg.name)}
                      className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      title="Disable Package"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: FEATURE CREDIT COSTS */}
      {activeTab === 'costs' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">AI Feature Credit Costs</h2>
            <p className="text-xs text-slate-500">
              Configure how many credits each tool consumes. Stored in database; never hardcoded.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 text-slate-500">
                  <th className="py-3 px-4 font-bold uppercase">Feature Identifier</th>
                  <th className="py-3 px-4 font-bold uppercase">Display Name</th>
                  <th className="py-3 px-4 font-bold uppercase text-right">Cost (Credits)</th>
                  <th className="py-3 px-4 font-bold uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {costs.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {c.feature}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {c.name}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-amber-600 dark:text-amber-400">
                      {c.creditCost} credits
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openEditCost(c)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold transition"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit Cost</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DISCOUNTS & COUPONS */}
      {activeTab === 'discounts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Promotional Discounts & Coupons</h2>
              <p className="text-xs text-slate-500">Manage codes, percentage/fixed savings, and redemption limits.</p>
            </div>
            <button
              onClick={openCreateDiscount}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Coupon</span>
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 text-slate-500">
                  <th className="py-3 px-4 font-bold uppercase">Promo Code</th>
                  <th className="py-3 px-4 font-bold uppercase">Type & Value</th>
                  <th className="py-3 px-4 font-bold uppercase">Min Purchase</th>
                  <th className="py-3 px-4 font-bold uppercase">Usage / Limit</th>
                  <th className="py-3 px-4 font-bold uppercase">Status</th>
                  <th className="py-3 px-4 font-bold uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {discounts.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-black text-slate-900 dark:text-white">
                      {d.code}
                    </td>
                    <td className="py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                      {d.type === 'PERCENTAGE' ? `${d.value}% OFF` : `$${Number(d.value).toFixed(2)} FIXED`}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      ${Number(d.minimumPurchase || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {d.usageCount} / {d.usageLimit !== null ? d.usageLimit : '∞'} (Max {d.perUserLimit}/user)
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          d.isActive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {d.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openEditDiscount(d)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold transition"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: USER WALLETS */}
      {activeTab === 'wallets' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">User Wallets & Balances</h2>
              <p className="text-xs text-slate-500">Live database-backed user credit balances with atomic adjustments.</p>
            </div>

            <form onSubmit={handleWalletSearch} className="flex items-center gap-2">
              <input
                type="text"
                value={walletSearch}
                onChange={(e) => setWalletSearch(e.target.value)}
                placeholder="Search email or name..."
                className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-brand-600 text-white font-bold text-xs transition"
              >
                Search
              </button>
            </form>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 text-slate-500">
                  <th className="py-3 px-4 font-bold uppercase">User</th>
                  <th className="py-3 px-4 font-bold uppercase">Role</th>
                  <th className="py-3 px-4 font-bold uppercase text-right">Current Balance</th>
                  <th className="py-3 px-4 font-bold uppercase text-right">Purchased</th>
                  <th className="py-3 px-4 font-bold uppercase text-right">Used</th>
                  <th className="py-3 px-4 font-bold uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {wallets.map((w) => (
                  <tr key={w.userId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{w.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{w.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800">
                        {w.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-brand-600 dark:text-brand-400">
                      {w.currentBalance} credits
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">
                      {w.totalPurchased}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">
                      {w.totalUsed}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openAdjustWallet(w)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-bold transition"
                      >
                        <Zap className="w-3 h-3" />
                        <span>Adjust Credits</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: GLOBAL TRANSACTIONS LEDGER */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Global Credit Transactions Ledger</h2>
            <p className="text-xs text-slate-500">Immutable record of every balance modification across the entire system.</p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 text-slate-500">
                  <th className="py-3 px-4 font-bold uppercase">Date & Time</th>
                  <th className="py-3 px-4 font-bold uppercase">User</th>
                  <th className="py-3 px-4 font-bold uppercase">Type</th>
                  <th className="py-3 px-4 font-bold uppercase">Description</th>
                  <th className="py-3 px-4 font-bold uppercase text-right">Amount</th>
                  <th className="py-3 px-4 font-bold uppercase text-right">Balance After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {transactions.map((t) => {
                  const isPos = t.amount > 0;
                  return (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {new Date(t.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {t.userEmail || t.userId}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800">
                          {t.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {t.description}
                      </td>
                      <td className={`py-3 px-4 text-right font-black ${isPos ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isPos ? `+${t.amount}` : t.amount}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {t.balanceAfter}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Credit Purchase Orders</h2>
            <p className="text-xs text-slate-500">Commercial orders initiated and finalized by users.</p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 text-slate-500">
                  <th className="py-3 px-4 font-bold uppercase">Order ID / Date</th>
                  <th className="py-3 px-4 font-bold uppercase">User</th>
                  <th className="py-3 px-4 font-bold uppercase">Package</th>
                  <th className="py-3 px-4 font-bold uppercase text-right">Final Amount</th>
                  <th className="py-3 px-4 font-bold uppercase">Status</th>
                  <th className="py-3 px-4 font-bold uppercase">Payment Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <div className="font-mono text-[11px] font-bold text-slate-900 dark:text-white">{o.id.substring(0, 8)}...</div>
                      <div className="text-[10px] text-slate-400">{new Date(o.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {o.userEmail || o.userId}
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      {o.packageName || 'Credit Pack'} ({o.credits} credits)
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                      ${Number(o.finalAmount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      {o.paymentReference || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Admin Audit Logs</h2>
            <p className="text-xs text-slate-500">Every sensitive admin credit modification, package change, and cost tweak.</p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 text-slate-500">
                  <th className="py-3 px-4 font-bold uppercase">Timestamp</th>
                  <th className="py-3 px-4 font-bold uppercase">Admin</th>
                  <th className="py-3 px-4 font-bold uppercase">Action</th>
                  <th className="py-3 px-4 font-bold uppercase">Target</th>
                  <th className="py-3 px-4 font-bold uppercase">Mandatory Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                      {log.adminEmail || log.adminId}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                      {log.targetType}:{log.targetId.substring(0, 8)}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {log.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: PACKAGE CREATE / EDIT */}
      {showPackageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleSavePackage}
            className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {editingPackage ? 'Edit Package' : 'Create Credit Package'}
              </h3>
              <button
                type="button"
                onClick={() => setShowPackageModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Package Name</label>
                <input
                  type="text"
                  required
                  value={packageForm.name}
                  onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Credits</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={packageForm.credits}
                    onChange={(e) => setPackageForm({ ...packageForm, credits: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Price (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min={0.01}
                    value={packageForm.price}
                    onChange={(e) => setPackageForm({ ...packageForm, price: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Description</label>
                <textarea
                  rows={2}
                  value={packageForm.description}
                  onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Discount Badge (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={packageForm.discountPercentage}
                    onChange={(e) => setPackageForm({ ...packageForm, discountPercentage: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Display Order</label>
                  <input
                    type="number"
                    min={1}
                    value={packageForm.displayOrder}
                    onChange={(e) => setPackageForm({ ...packageForm, displayOrder: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={packageForm.isFeatured}
                    onChange={(e) => setPackageForm({ ...packageForm, isFeatured: e.target.checked })}
                    className="rounded text-brand-600"
                  />
                  <span>Featured Package</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={packageForm.isActive}
                    onChange={(e) => setPackageForm({ ...packageForm, isActive: e.target.checked })}
                    className="rounded text-brand-600"
                  />
                  <span>Active</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setShowPackageModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Package'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: EDIT FEATURE CREDIT COST */}
      {showCostModal && editingCost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleSaveCost}
            className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Edit Feature Cost
              </h3>
              <button
                type="button"
                onClick={() => setShowCostModal(false)}
                className="p-1 rounded-full text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400">Feature:</span>
                <p className="font-bold text-slate-900 dark:text-white">{editingCost.name}</p>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Cost in Credits</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={costForm.creditCost}
                  onChange={(e) => setCostForm({ ...costForm, creditCost: Number(e.target.value) })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Mandatory Audit Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Model infrastructure cost optimization"
                  value={costForm.reason}
                  onChange={(e) => setCostForm({ ...costForm, reason: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setShowCostModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition disabled:opacity-50"
              >
                {isSubmitting ? 'Updating...' : 'Update Cost'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: DISCOUNT CREATE / EDIT */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleSaveDiscount}
            className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {editingDiscount ? 'Edit Coupon' : 'Create Promo Code'}
              </h3>
              <button
                type="button"
                onClick={() => setShowDiscountModal(false)}
                className="p-1 rounded-full text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Code (e.g. FLASH50)</label>
                <input
                  type="text"
                  required
                  disabled={Boolean(editingDiscount)}
                  value={discountForm.code}
                  onChange={(e) => setDiscountForm({ ...discountForm, code: e.target.value.toUpperCase() })}
                  className="w-full mt-1 px-3 py-2 rounded-xl font-mono uppercase bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Discount Type</label>
                  <select
                    value={discountForm.type}
                    onChange={(e) => setDiscountForm({ ...discountForm, type: e.target.value as any })}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount ($)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Value</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={discountForm.value}
                    onChange={(e) => setDiscountForm({ ...discountForm, value: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Min Purchase ($)</label>
                  <input
                    type="number"
                    min={0}
                    value={discountForm.minimumPurchase}
                    onChange={(e) => setDiscountForm({ ...discountForm, minimumPurchase: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Max Discount ($)</label>
                  <input
                    type="number"
                    min={0}
                    value={discountForm.maximumDiscount}
                    onChange={(e) => setDiscountForm({ ...discountForm, maximumDiscount: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Total Usage Limit</label>
                  <input
                    type="number"
                    min={0}
                    value={discountForm.usageLimit}
                    onChange={(e) => setDiscountForm({ ...discountForm, usageLimit: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Per-User Limit</label>
                  <input
                    type="number"
                    min={1}
                    value={discountForm.perUserLimit}
                    onChange={(e) => setDiscountForm({ ...discountForm, perUserLimit: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={discountForm.isActive}
                  onChange={(e) => setDiscountForm({ ...discountForm, isActive: e.target.checked })}
                  className="rounded text-brand-600"
                />
                <span>Active Coupon</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setShowDiscountModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Coupon'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 4: USER WALLET ADJUSTMENT */}
      {showAdjustModal && adjustTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleSaveAdjust}
            className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Adjust User Credits
              </h3>
              <button
                type="button"
                onClick={() => setShowAdjustModal(false)}
                className="p-1 rounded-full text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="font-bold text-slate-900 dark:text-white">{adjustTargetUser.name}</div>
                <div className="text-slate-400 font-mono text-[11px]">{adjustTargetUser.email}</div>
                <div className="text-brand-600 dark:text-brand-400 font-extrabold mt-1">
                  Current Balance: {adjustTargetUser.currentBalance} credits
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Adjustment Action</label>
                <select
                  value={adjustForm.action}
                  onChange={(e) => setAdjustForm({ ...adjustForm, action: e.target.value as any })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                >
                  <option value="add">Add Credits (+)</option>
                  <option value="remove">Remove / Debit Credits (-)</option>
                  <option value="refund">Refund Credits (+)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Credit Amount</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={adjustForm.amount}
                  onChange={(e) => setAdjustForm({ ...adjustForm, amount: Number(e.target.value) })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Mandatory Audit Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. VIP Grant / Customer Support Resolution / Dispute correction"
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setShowAdjustModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition disabled:opacity-50"
              >
                {isSubmitting ? 'Adjusting...' : 'Confirm Adjustment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
