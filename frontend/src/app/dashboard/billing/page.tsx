'use client';

import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  CreditCard,
  Zap,
  Check,
  ShieldCheck,
  RefreshCw,
  Clock,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  ExternalLink,
  Lock,
  XCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import {
  getBillingSummaryApi,
  createSafePayCheckoutApi,
  verifySafePayPaymentApi,
  cancelSubscriptionApi,
} from '@/lib/api';
import { BillingSummary } from '@/lib/types';

const CREDIT_PACKS = [
  {
    id: 'starter_pack',
    title: 'Starter Pack',
    credits: 50,
    price: '$9',
    popular: false,
    costPerCredit: '$0.18 / credit',
  },
  {
    id: 'creator_pack',
    title: 'Creator Pack',
    credits: 150,
    price: '$19',
    popular: true,
    costPerCredit: '$0.12 / credit',
    badge: 'Most Popular',
  },
  {
    id: 'agency_pack',
    title: 'Agency Power Pack',
    credits: 500,
    price: '$49',
    popular: false,
    costPerCredit: '$0.09 / credit',
  },
];

const SUBSCRIPTION_PLANS = [
  {
    id: 'free_trial',
    name: 'Free Trial',
    price: '$0',
    period: 'forever',
    allowance: 50,
    features: ['50 Welcome Credits', 'High-Resolution AI Vision', 'All 6 Platform Ratios', '1 Brand DNA Profile'],
  },
  {
    id: 'starter',
    name: 'Starter Creator',
    price: '$19',
    period: 'per month',
    allowance: 100,
    features: ['100 Credits / month', 'Fast ISNet BG Removal', '3 Brand DNA Profiles', 'Commercial Usage License'],
  },
  {
    id: 'pro',
    name: 'Pro Marketer',
    price: '$49',
    period: 'per month',
    allowance: 350,
    features: [
      '350 Credits / month',
      'Unlimited Brand Profiles',
      'High-Priority AI Style Queue',
      'Personal Style Memory Tuning',
      'VIP Discord Support',
    ],
    highlight: true,
  },
  {
    id: 'agency',
    name: 'Scale Agency',
    price: '$149',
    period: 'per month',
    allowance: 1000,
    features: [
      '1,000 Credits / month',
      'Multi-User Team Seats',
      'Custom Font Uploads',
      'Dedicated Cloud Microservice',
      '99.9% SLA Guarantee',
    ],
  },
];

export default function BillingPage() {
  const { user, refreshUser } = useAuth();
  const { toast, refreshNotifications } = useNotification();
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBillingSummaryApi();
      setSummary(data);
    } catch (err: any) {
      console.error('Error fetching billing summary:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyPayment = useCallback(
    async (trackerToken?: string | null, paymentId?: string | null) => {
      setVerifying(true);
      try {
        const res = await verifySafePayPaymentApi({
          trackerToken: trackerToken || undefined,
          paymentId: paymentId || undefined,
        });

        if (res.success) {
          const successMsg = `Payment verified via SafePay! Account updated with ${res.credits} credits (${res.plan.toUpperCase()} plan).`;
          setFeedbackMsg(successMsg);
          toast.success(res.message || successMsg, 'SafePay Payment Succeeded');

          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#e0aa4e', '#7c5cff', '#10b981'],
          });

          await refreshUser();
          await loadSummary();
          refreshNotifications();
        } else {
          toast.error(res.message || 'Payment verification returned an incomplete state.', 'Verification Status');
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to verify SafePay transaction server-side.', 'SafePay Verification Error');
      } finally {
        setVerifying(false);
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    },
    [refreshUser, loadSummary, refreshNotifications, toast]
  );

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // Check for SafePay callback redirect parameters in URL
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const tracker = params.get('tracker') || params.get('beacon');
    const paymentId =
      params.get('payment_id') ||
      params.get('paymentId') ||
      params.get('session_id') ||
      params.get('order_id');
    const cancelled =
      params.get('cancelled') === 'true' ||
      params.get('canceled') === 'true';

    if (tracker || paymentId) {
      verifyPayment(tracker, paymentId);
    } else if (cancelled) {
      toast.info('SafePay checkout was cancelled before completion.', 'Checkout Cancelled');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [verifyPayment, toast]);

  // SafePay Checkout for Credit Packs
  const handlePurchasePack = async (packId: string) => {
    setProcessingId(packId);
    setFeedbackMsg(null);

    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const redirectUrl = `${origin}/dashboard/billing`;
      const cancelUrl = `${origin}/dashboard/billing?cancelled=true`;

      const checkout = await createSafePayCheckoutApi({
        packId,
        redirectUrl,
        cancelUrl,
      });

      if (checkout.checkoutUrl) {
        toast.info('Redirecting to SafePay secure checkout...', 'SafePay Checkout');
        window.location.href = checkout.checkoutUrl;
      } else {
        throw new Error('SafePay checkout URL could not be generated.');
      }
    } catch (err: any) {
      const errMsg = err.message || 'Failed to initiate SafePay checkout';
      setFeedbackMsg(errMsg);
      toast.error(errMsg, 'Checkout Error');
      setProcessingId(null);
    }
  };

  // SafePay Checkout for Subscriptions
  const handleSelectPlan = async (planId: string) => {
    if (planId === 'free_trial') {
      toast.info('You are already enrolled or your free trial has ended.', 'Free Tier');
      return;
    }

    setProcessingId(planId);
    setFeedbackMsg(null);

    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const redirectUrl = `${origin}/dashboard/billing`;
      const cancelUrl = `${origin}/dashboard/billing?cancelled=true`;

      const checkout = await createSafePayCheckoutApi({
        planId,
        redirectUrl,
        cancelUrl,
      });

      if (checkout.checkoutUrl) {
        toast.info('Redirecting to SafePay secure checkout...', 'SafePay Subscription');
        window.location.href = checkout.checkoutUrl;
      } else {
        throw new Error('SafePay checkout URL could not be generated.');
      }
    } catch (err: any) {
      const errMsg = err.message || 'Failed to upgrade subscription';
      setFeedbackMsg(errMsg);
      toast.error(errMsg, 'Subscription Error');
      setProcessingId(null);
    }
  };

  // Cancel Subscription
  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing cycle.')) {
      return;
    }

    setCancelling(true);
    try {
      const res = await cancelSubscriptionApi('Cancelled by user via dashboard');
      toast.success(res.message || 'Subscription successfully cancelled.', 'Subscription Cancelled');
      await loadSummary();
      await refreshUser();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel subscription', 'Cancellation Error');
    } finally {
      setCancelling(false);
    }
  };

  const userPlan = summary?.plan || user?.plan || 'free_trial';
  const userCredits = summary?.credits ?? user?.credits ?? 50;
  const maxAllowance = summary?.monthlyAllowance ?? 50;
  const percentUsed = Math.min(100, Math.round((userCredits / maxAllowance) * 100));
  const activeSub = summary?.subscription;
  const isCancelled = activeSub?.cancelAtPeriodEnd || activeSub?.status === 'cancelled';

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-amber-500 dark:text-amber-400" />
            <span>Subscription &amp; SafePay Billing</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Authoritative balance tracking, automated SafePay checkout, and subscription lifecycle management.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {verifying && (
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-xs font-semibold animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Verifying SafePay Payment...
            </span>
          )}
          <button
            onClick={loadSummary}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 transition"
            title="Refresh balance"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-500' : ''}`} />
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500 dark:text-emerald-400" />
          <span className="flex-1 font-semibold">{feedbackMsg}</span>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* CURRENT STATUS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Credits Status */}
        <div className="md:col-span-2 p-6 rounded-3xl bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-500 dark:text-amber-400 flex items-center justify-center">
                <Zap className="w-5 h-5 fill-amber-400/20" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Credit Balance</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Costs 5 credits per AI campaign generation</p>
              </div>
            </div>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{userCredits} Credits</span>
          </div>

          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-500 dark:text-slate-400">Available Allowance</span>
              <span className="text-slate-800 dark:text-slate-200">
                {userCredits} / {maxAllowance}
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-950 overflow-hidden border border-slate-200 dark:border-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-amber-400 transition-all duration-500"
                style={{ width: `${percentUsed}%` }}
              />
            </div>
          </div>
        </div>

        {/* Current Plan */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Your Subscription</span>
              {activeSub && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    activeSub.status === 'active'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-500/20'
                      : activeSub.status === 'past_due'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border border-amber-500/20'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {activeSub.status}
                </span>
              )}
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {userPlan.replace('_', ' ')}
            </h3>

            <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-2 font-medium">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Full AI Post &amp; Video Suite Active</span>
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Next Renewal / Period End:</span>
              <span className="text-slate-800 dark:text-slate-200 font-semibold">
                {activeSub?.currentPeriodEnd
                  ? new Date(activeSub.currentPeriodEnd).toLocaleDateString()
                  : summary?.renewsAt
                  ? new Date(summary.renewsAt).toLocaleDateString()
                  : 'N/A'}
              </span>
            </div>

            {userPlan !== 'free_trial' && !isCancelled && (
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelSubscription}
                className="w-full mt-2 py-1.5 px-3 rounded-lg text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition flex items-center justify-center gap-1.5"
              >
                {cancelling ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                <span>Cancel Renewal</span>
              </button>
            )}

            {isCancelled && userPlan !== 'free_trial' && (
              <p className="text-[11px] text-amber-500 font-medium">
                Renewal cancelled. Plan expires at end of current period.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* INSTANT TOP-UP PACKS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Instant Credit Top-Up Packs</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Credits never expire and roll over indefinitely. Instant activation via SafePay.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800">
            <Lock className="w-3.5 h-3.5 text-emerald-500" />
            <span>SafePay 256-Bit SSL Encrypted</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CREDIT_PACKS.map((pack) => (
            <div
              key={pack.id}
              className={`p-6 rounded-3xl border transition relative flex flex-col justify-between shadow-sm dark:shadow-xl ${
                pack.popular
                  ? 'border-brand-500 ring-1 ring-brand-500/40 bg-purple-50/50 dark:bg-gradient-to-b dark:from-brand-950/30 dark:to-slate-900'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {pack.badge && (
                <span className="absolute -top-3 right-6 px-3 py-0.5 rounded-full text-[10px] font-black uppercase bg-brand-500 text-white shadow-md shadow-brand-500/30">
                  {pack.badge}
                </span>
              )}

              <div>
                <div className="flex items-baseline justify-between mb-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{pack.title}</h3>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">{pack.price}</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400 fill-amber-400/20" />
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">+{pack.credits} Credits</span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {pack.costPerCredit}
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                  Generates ~{Math.floor(pack.credits / 5)} multi-platform advertising posts with AI Vision product inspection.
                </p>
              </div>

              <button
                type="button"
                disabled={processingId === pack.id}
                onClick={() => handlePurchasePack(pack.id)}
                className={`w-full py-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
                  pack.popular
                    ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/25'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200'
                }`}
              >
                {processingId === pack.id ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Connecting SafePay...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Pay with SafePay ({pack.price})</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SUBSCRIPTION TIERS MATRIX */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Monthly Subscription Tiers</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Upgrade for continuous monthly allowance and dedicated AI throughput via SafePay recurring billing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const isCurrent = userPlan === plan.id;
            return (
              <div
                key={plan.id}
                className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border flex flex-col justify-between space-y-4 shadow-sm dark:shadow-none ${
                  plan.highlight
                    ? 'border-brand-500/60 ring-1 ring-brand-500/30 shadow-md dark:shadow-xl'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{plan.name}</span>
                    {isCurrent && (
                      <span className="text-[10px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/30">
                        Current
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">{plan.price}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">/{plan.period}</span>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  disabled={isCurrent || processingId === plan.id}
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`w-full py-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                    isCurrent
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-default'
                      : plan.highlight
                      ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/20'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {processingId === plan.id ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Redirecting...</span>
                    </>
                  ) : isCurrent ? (
                    'Current Plan'
                  ) : (
                    <>
                      <span>Switch to {plan.name}</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* TRANSACTION HISTORY */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Credit Ledger &amp; Invoices</h2>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm dark:shadow-none">
          {!summary?.transactions?.length ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No transactions recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Description</th>
                    <th className="px-5 py-3">Change</th>
                    <th className="px-5 py-3">Balance After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                  {summary.transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/40 transition">
                      <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                        {new Date(tx.createdAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{tx.description}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`font-bold ${
                            tx.amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {tx.amount > 0 ? `+${tx.amount}` : tx.amount} Credits
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-500 dark:text-slate-400 font-mono">
                        {tx.balanceAfter} Credits
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
