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
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { getBillingSummaryApi, topupCreditsApi } from '@/lib/api';
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
  const [purchasingPack, setPurchasingPack] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await getBillingSummaryApi();
      setSummary(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const handleTopup = async (credits: number, packTitle: string) => {
    setPurchasingPack(packTitle);
    setFeedbackMsg(null);

    try {
      const res = await topupCreditsApi(credits, packTitle);
      const successMessage = `Successfully added ${credits} credits to your account!`;
      setFeedbackMsg(successMessage);
      toast.success(successMessage, 'Credits Added');
      await refreshUser();
      await loadSummary();
      refreshNotifications();

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#e0aa4e', '#7c5cff', '#10b981'],
      });
    } catch (err: any) {
      const errMsg = err.message || 'Failed to top up credits';
      setFeedbackMsg(errMsg);
      toast.error(errMsg, 'Payment Error');
    } finally {
      setPurchasingPack(null);
    }
  };

  const userPlan = user?.plan || 'free_trial';
  const userCredits = summary?.credits ?? user?.credits ?? 50;
  const maxAllowance = summary?.monthlyAllowance ?? 50;
  const percentUsed = Math.min(100, Math.round((userCredits / maxAllowance) * 100));

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-amber-500 dark:text-amber-400" />
            <span>Subscription & Billing</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your AI generation credits, view transaction history, and scale your creative quota.
          </p>
        </div>

        <div className="flex items-center gap-2">
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
          <button onClick={() => setFeedbackMsg(null)} className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold">
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
              <span className="text-slate-800 dark:text-slate-200">{userCredits} / {maxAllowance}</span>
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
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Your Subscription</span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {userPlan.replace('_', ' ')}
            </h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-2 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Full AI Post Access Active</span>
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Cycle Renewal:</span>
            <span className="text-slate-800 dark:text-slate-200 font-semibold">Auto-renewing</span>
          </div>
        </div>
      </div>

      {/* INSTANT TOP-UP PACKS */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Instant Credit Top-Up Packs</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Credits never expire and roll over indefinitely. Instant activation.
          </p>
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
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{pack.costPerCredit}</span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                  Generates ~{Math.floor(pack.credits / 5)} multi-platform advertising posts with AI Vision product inspection.
                </p>
              </div>

              <button
                type="button"
                disabled={purchasingPack === pack.title}
                onClick={() => handleTopup(pack.credits, pack.title)}
                className={`w-full py-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
                  pack.popular
                    ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/25'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200'
                }`}
              >
                {purchasingPack === pack.title ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Top-Up...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Add {pack.credits} Credits</span>
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
            Upgrade for continuous monthly allowance and dedicated AI throughput.
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
                  disabled={isCurrent}
                  onClick={() => handleTopup(plan.allowance, `${plan.name} Monthly Renewal`)}
                  className={`w-full py-2.5 rounded-xl text-xs font-semibold transition ${
                    isCurrent
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-default'
                      : plan.highlight
                      ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/20'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {isCurrent ? 'Current Plan' : `Switch to ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* TRANSACTION HISTORY */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Credit Ledger & Invoices</h2>

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
