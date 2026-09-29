'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  CreditCard,
  Zap,
  Check,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Clock,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Tag,
  X,
  Coins,
  ArrowDownLeft,
  ShoppingBag,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import {
  getBillingSummaryApi,
  getCreditPackagesApi,
  validateCouponApi,
  checkoutApi,
} from '@/lib/api';
import {
  BillingSummary,
  CreditPackage,
  PriceCalculation,
} from '@/lib/types';

export default function BillingPage() {
  const { user, refreshUser } = useAuth();
  const { toast, refreshNotifications } = useNotification();

  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingPackages, setLoadingPackages] = useState<boolean>(true);

  // Checkout modal state
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [couponCode, setCouponCode] = useState<string>('');
  const [validatingCoupon, setValidatingCoupon] = useState<boolean>(false);
  const [priceBreakdown, setPriceBreakdown] = useState<PriceCalculation | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    setLoadingPackages(true);
    try {
      const [sum, pkgs] = await Promise.all([
        getBillingSummaryApi(),
        getCreditPackagesApi().catch(() => []),
      ]);
      setSummary(sum);
      setPackages(pkgs);
    } catch (err: any) {
      console.error('Failed to load billing data:', err);
      toast.error('Failed to load billing information');
    } finally {
      setLoading(false);
      setLoadingPackages(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCheckout = (pkg: CreditPackage) => {
    setSelectedPackage(pkg);
    setCouponCode('');
    setCouponError(null);
    setPriceBreakdown({
      packageId: pkg.id,
      packageName: pkg.name,
      credits: pkg.credits,
      currency: pkg.currency || 'USD',
      basePrice: Number(pkg.price),
      discountCode: null,
      discountType: null,
      discountValue: 0,
      discountAmount: 0,
      finalPrice: Number(pkg.price),
      isValidCoupon: false,
    });
  };

  const handleApplyCoupon = async () => {
    if (!selectedPackage || !couponCode.trim()) return;

    setValidatingCoupon(true);
    setCouponError(null);
    try {
      const result = await validateCouponApi(selectedPackage.id, couponCode.trim());
      setPriceBreakdown(result);
      if (result.isValidCoupon) {
        toast.success(result.couponMessage || 'Coupon applied successfully!', 'Promo Applied');
      } else {
        setCouponError(result.couponMessage || 'Invalid coupon code');
      }
    } catch (err: any) {
      setCouponError(err.message || 'Failed to validate coupon code.');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleCompleteCheckout = async () => {
    if (!selectedPackage) return;

    setIsProcessingCheckout(true);
    try {
      const idempotencyKey = `CHK-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const res = await checkoutApi(
        selectedPackage.id,
        priceBreakdown?.isValidCoupon ? couponCode.trim() : undefined,
        'credit_card',
        idempotencyKey,
      );

      toast.success(
        `Successfully added ${res.creditsAdded} credits to your wallet!`,
        'Purchase Complete',
      );

      // Trigger celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#7c5cff', '#e0aa4e', '#10b981'],
      });

      setSelectedPackage(null);
      await refreshUser();
      await loadData();
      refreshNotifications();
    } catch (err: any) {
      toast.error(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const currentBalance = summary?.wallet?.currentBalance ?? user?.credits ?? 50;
  const totalPurchased = summary?.wallet?.totalPurchased ?? 0;
  const totalUsed = summary?.wallet?.totalUsed ?? 0;
  const totalRefunded = summary?.wallet?.totalRefunded ?? 0;

  return (
    <div className="space-y-10 animate-fadeIn max-w-6xl mx-auto pb-20">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-bold mb-2">
            <Coins className="w-3.5 h-3.5" />
            <span>Database-Backed Real Wallet</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Credit Wallet & Pricing
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time balance, instant credit packages, promo codes, and immutable ledger history.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold hover:border-brand-500 transition shadow-sm self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Wallet</span>
        </button>
      </div>

      {/* Wallet Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Credits */}
        <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-brand-600 to-indigo-700 text-white shadow-xl shadow-brand-500/20">
          <div className="flex items-center justify-between opacity-80 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Available Balance</span>
            <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
          </div>
          <div className="text-4xl font-black tracking-tight">{currentBalance}</div>
          <div className="text-xs text-white/80 mt-2 font-medium">Credits ready for AI creation</div>
        </div>

        {/* Total Purchased */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Purchased</span>
            <ShoppingBag className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">{totalPurchased}</div>
          <div className="text-xs text-slate-500 mt-2">Credits acquired via packages</div>
        </div>

        {/* Total Used */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Used</span>
            <ArrowUpRight className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">{totalUsed}</div>
          <div className="text-xs text-slate-500 mt-2">Consumed by AI generations</div>
        </div>

        {/* Total Refunded */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Refunded</span>
            <ArrowDownLeft className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">{totalRefunded}</div>
          <div className="text-xs text-slate-500 mt-2">Restored from failed generations</div>
        </div>
      </div>

      {/* Credit Packages Grid (Database-driven) */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Purchase Credit Packages
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Choose a bundle to refill your creative pipeline. Credits never expire.
          </p>
        </div>

        {loadingPackages ? (
          <div className="py-12 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-brand-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg) => {
              const isFeatured = pkg.isFeatured;
              return (
                <div
                  key={pkg.id}
                  className={`relative flex flex-col justify-between p-6 rounded-3xl transition-all duration-200 ${
                    isFeatured
                      ? 'border-2 border-brand-500 bg-gradient-to-b from-brand-500/10 via-white to-white dark:from-brand-950/40 dark:via-slate-900 dark:to-slate-900 shadow-xl shadow-brand-500/15 scale-[1.02]'
                      : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-400 dark:hover:border-brand-600 shadow-sm'
                  }`}
                >
                  {isFeatured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-black text-[10px] uppercase tracking-wider shadow-md">
                      Most Popular
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                        {pkg.name}
                      </h3>
                      {pkg.discountPercentage > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          {pkg.discountPercentage}% OFF
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900 dark:text-white">
                          ${Number(pkg.price).toFixed(2)}
                        </span>
                        <span className="text-xs text-slate-400 uppercase">{pkg.currency}</span>
                      </div>
                      <div className="text-xs font-semibold text-brand-600 dark:text-brand-400 mt-1">
                        {pkg.credits} High-Res AI Credits
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed min-h-[36px]">
                      {pkg.description || 'Full access to post generation, vision reasoning, and background removal.'}
                    </p>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        <span>~{Math.floor(pkg.credits / 5)} Multimodal Posts</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        <span>Instant Wallet Deposit</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        <span>No Expiration Date</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6">
                    <button
                      type="button"
                      onClick={() => openCheckout(pkg)}
                      className={`w-full py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-md ${
                        isFeatured
                          ? 'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-brand-500/25'
                          : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700'
                      }`}
                    >
                      Buy {pkg.credits} Credits
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Immutable Transaction History Ledger */}
      <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Transaction History
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Audit log of all credit top-ups, AI deductions, refunds, and adjustments.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {summary?.transactions?.length ?? 0} Transactions Recorded
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Date & Time</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Type</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Description</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-right">Amount</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-right">Balance After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {summary?.transactions && summary.transactions.length > 0 ? (
                  summary.transactions.map((tx) => {
                    const isPositive = tx.amount > 0;
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          {new Date(tx.createdAt).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                              tx.type === 'PURCHASE'
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                : tx.type === 'REFUND'
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                : tx.type === 'ADMIN_CREDIT'
                                ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                                : tx.type === 'ADMIN_DEBIT'
                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {tx.type || (isPositive ? 'CREDIT' : 'DEBIT')}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                          {tx.description}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-black ${
                            isPositive
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {isPositive ? `+${tx.amount}` : tx.amount}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {tx.balanceAfter}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No credit transactions recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Interactive Checkout & Coupon Modal */}
      {selectedPackage && priceBreakdown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
            <button
              onClick={() => setSelectedPackage(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-bold mb-2">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Secure Checkout</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Purchase {selectedPackage.name} Package
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Refill your wallet with {selectedPackage.credits} credits.
              </p>
            </div>

            {/* Coupon Code Section */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-brand-500" />
                <span>Have a promo code? (Try WELCOME20)</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="PROMO CODE"
                  className="flex-1 px-3 py-2 rounded-xl text-xs uppercase font-mono tracking-wider bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={validatingCoupon || !couponCode.trim()}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition disabled:opacity-50"
                >
                  {validatingCoupon ? 'Checking...' : 'Apply'}
                </button>
              </div>
              {couponError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-500 font-medium pt-1">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{couponError}</span>
                </div>
              )}
              {priceBreakdown.isValidCoupon && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{priceBreakdown.couponMessage}</span>
                </div>
              )}
            </div>

            {/* Price Calculation Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Base Price</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  ${priceBreakdown.basePrice.toFixed(2)}
                </span>
              </div>
              {priceBreakdown.discountAmount > 0 && (
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Discount ({priceBreakdown.discountCode})</span>
                  <span>-${priceBreakdown.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-base font-extrabold text-slate-900 dark:text-white">
                <span>Total Due</span>
                <span className="text-xl font-black text-brand-600 dark:text-brand-400">
                  ${priceBreakdown.finalPrice.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedPackage(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCompleteCheckout}
                disabled={isProcessingCheckout}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition disabled:opacity-50"
              >
                {isProcessingCheckout ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Pay ${priceBreakdown.finalPrice.toFixed(2)} & Deposit Credits</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
