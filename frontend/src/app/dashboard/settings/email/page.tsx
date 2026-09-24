'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Mail,
  Server,
  ShieldCheck,
  Send,
  Sparkles,
  Tag,
  FileText,
  UserX,
  Sliders,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Play,
  Pause,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  Eye,
  Download,
  Smartphone,
  Monitor,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  HelpCircle,
  Copy,
  Zap,
} from 'lucide-react';
import {
  getEmailOverviewApi,
  getEmailProvidersApi,
  saveEmailProviderApi,
  deleteEmailProviderApi,
  testSmtpConnectionApi,
  verifyEmailDomainApi,
  getEmailTemplatesApi,
  saveEmailTemplateApi,
  deleteEmailTemplateApi,
  previewEmailTemplateApi,
  getEmailOffersApi,
  saveEmailOfferApi,
  deleteEmailOfferApi,
  estimateAudienceApi,
  getEmailCampaignsApi,
  getEmailCampaignApi,
  saveEmailCampaignApi,
  sendEmailCampaignApi,
  pauseEmailCampaignApi,
  resumeEmailCampaignApi,
  cancelEmailCampaignApi,
  getEmailCampaignAnalyticsApi,
  getEmailCampaignRecipientsApi,
  subscribeCampaignProgressStream,
  getEmailSuppressionsApi,
  addEmailSuppressionApi,
  deleteEmailSuppressionApi,
  getEmailPreferencesApi,
  updateEmailPreferencesApi,
} from '@/lib/api';
import type {
  EmailProvider,
  EmailTemplate,
  EmailOffer,
  EmailCampaign,
  EmailRecipient,
  EmailSuppression,
  EmailPreferences,
  DomainVerificationResult,
  EmailOverviewStats,
  AudienceEstimationResult,
  SmtpTestResult,
} from '@/types/email';

type MainTab =
  | 'overview'
  | 'smtp'
  | 'domains'
  | 'campaigns'
  | 'create-campaign'
  | 'campaign-details'
  | 'offers'
  | 'templates'
  | 'suppressions'
  | 'preferences';

export default function EmailSettingsPage() {
  const [activeTab, setActiveTab] = useState<MainTab>('overview');
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Overview data
  const [overview, setOverview] = useState<{ metrics: EmailOverviewStats; queue: any } | null>(null);

  // Providers data
  const [providers, setProviders] = useState<EmailProvider[]>([]);
  const [editingProvider, setEditingProvider] = useState<Partial<EmailProvider> | null>(null);
  const [smtpTestResult, setSmtpTestResult] = useState<SmtpTestResult | null>(null);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [testRecipientEmail, setTestRecipientEmail] = useState('');

  // Domains data
  const [domainCheck, setDomainCheck] = useState<DomainVerificationResult | null>(null);
  const [domainInput, setDomainInput] = useState('socialyolo.com');
  const [verifyingDomain, setVerifyingDomain] = useState(false);

  // Campaigns data
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [campaignFilter, setCampaignFilter] = useState('ALL');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [activeCampaign, setActiveCampaign] = useState<EmailCampaign | null>(null);
  const [campaignStats, setCampaignStats] = useState<any>(null);
  const [campaignRecipients, setCampaignRecipients] = useState<EmailRecipient[]>([]);
  const [recipientsStatusFilter, setRecipientsStatusFilter] = useState('ALL');

  // Offers data
  const [offers, setOffers] = useState<EmailOffer[]>([]);
  const [editingOffer, setEditingOffer] = useState<Partial<EmailOffer> | null>(null);

  // Templates data
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<Partial<EmailTemplate> | null>(null);
  const [previewTemplateHtml, setPreviewTemplateHtml] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  // Suppressions data
  const [suppressions, setSuppressions] = useState<EmailSuppression[]>([]);
  const [suppressionSearch, setSuppressionSearch] = useState('');
  const [newSuppressionEmail, setNewSuppressionEmail] = useState('');

  // Preferences data
  const [preferences, setPreferences] = useState<EmailPreferences | null>(null);

  // Campaign Creator Wizard State
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState<any>({
    name: '',
    subject: '',
    campaignType: 'OFFER',
    templateId: '',
    offerId: '',
    brandId: '',
    audienceTarget: 'all',
    plans: [],
    inactiveDays: 30,
    scheduledAt: '',
  });
  const [audienceEstimation, setAudienceEstimation] = useState<AudienceEstimationResult | null>(null);
  const [estimatingAudience, setEstimatingAudience] = useState(false);
  const [testEmailSending, setTestEmailSending] = useState(false);
  const [showConfirmSendModal, setShowConfirmSendModal] = useState(false);

  // Auto-dismiss status messages after 5 seconds
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // Load initial data
  useEffect(() => {
    loadTabInitialData(activeTab);
  }, [activeTab, timeRange]);

  const loadTabInitialData = async (tab: MainTab) => {
    setLoading(true);
    try {
      if (tab === 'overview') {
        const data = await getEmailOverviewApi(timeRange);
        setOverview(data);
      } else if (tab === 'smtp') {
        const data = await getEmailProvidersApi();
        setProviders(data);
      } else if (tab === 'domains') {
        const data = await verifyEmailDomainApi(domainInput);
        setDomainCheck(data);
      } else if (tab === 'campaigns') {
        const data = await getEmailCampaignsApi(campaignFilter);
        setCampaigns(data);
      } else if (tab === 'offers') {
        const data = await getEmailOffersApi();
        setOffers(data);
      } else if (tab === 'templates') {
        const data = await getEmailTemplatesApi();
        setTemplates(data);
      } else if (tab === 'suppressions') {
        const data = await getEmailSuppressionsApi();
        setSuppressions(data);
      } else if (tab === 'preferences') {
        const data = await getEmailPreferencesApi();
        setPreferences(data);
      } else if (tab === 'create-campaign') {
        const [tpls, ofrs] = await Promise.all([getEmailTemplatesApi(), getEmailOffersApi()]);
        setTemplates(tpls);
        setOffers(ofrs);
        if (tpls.length > 0 && !wizardData.templateId) {
          setWizardData((prev: any) => ({ ...prev, templateId: tpls[0].id }));
        }
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  // SSE subscription for active campaign details
  useEffect(() => {
    if (activeTab === 'campaign-details' && selectedCampaignId) {
      // Fetch initial
      getEmailCampaignApi(selectedCampaignId).then(setActiveCampaign).catch(() => {});
      getEmailCampaignAnalyticsApi(selectedCampaignId).then(setCampaignStats).catch(() => {});
      getEmailCampaignRecipientsApi(selectedCampaignId, recipientsStatusFilter).then((res) => {
        setCampaignRecipients(res.items);
      }).catch(() => {});

      // Subscribe to real-time SSE stream
      const unsubscribe = subscribeCampaignProgressStream(selectedCampaignId, (update) => {
        setCampaignStats(update);
        if (update.status && activeCampaign) {
          setActiveCampaign((prev) => (prev ? { ...prev, status: update.status } : null));
        }
      });

      return () => unsubscribe();
    }
  }, [activeTab, selectedCampaignId, recipientsStatusFilter]);

  // ---------------------------------------------------------------------------
  // SMTP Actions
  // ---------------------------------------------------------------------------
  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProvider) return;
    try {
      await saveEmailProviderApi(editingProvider);
      setStatusMessage({ type: 'success', text: 'Email provider configuration saved successfully.' });
      setEditingProvider(null);
      const data = await getEmailProvidersApi();
      setProviders(data);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleTestSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestingSmtp(true);
    setSmtpTestResult(null);
    try {
      const payload = {
        ...(editingProvider || {}),
        testRecipient: testRecipientEmail.trim() || undefined,
      };
      const result = await testSmtpConnectionApi(payload);
      setSmtpTestResult(result);
      if (result.connection.connected) {
        setStatusMessage({ type: 'success', text: 'SMTP verification succeeded! Genuine 250 response received.' });
      } else {
        setStatusMessage({ type: 'error', text: `SMTP connection failed: ${result.connection.message}` });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setTestingSmtp(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Domain Verification Actions
  // ---------------------------------------------------------------------------
  const handleVerifyDomain = async () => {
    setVerifyingDomain(true);
    try {
      const res = await verifyEmailDomainApi(domainInput);
      setDomainCheck(res);
      setStatusMessage({ type: 'success', text: `DNS records queried live for ${res.domain}.` });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setVerifyingDomain(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Offers Actions
  // ---------------------------------------------------------------------------
  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOffer) return;
    try {
      await saveEmailOfferApi(editingOffer);
      setStatusMessage({ type: 'success', text: 'Offer saved successfully.' });
      setEditingOffer(null);
      const data = await getEmailOffersApi();
      setOffers(data);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteOffer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;
    try {
      await deleteEmailOfferApi(id);
      setStatusMessage({ type: 'success', text: 'Offer deleted.' });
      setOffers(offers.filter((o) => o.id !== id));
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  // ---------------------------------------------------------------------------
  // Templates Actions
  // ---------------------------------------------------------------------------
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;
    try {
      await saveEmailTemplateApi(editingTemplate);
      setStatusMessage({ type: 'success', text: 'Template saved.' });
      setEditingTemplate(null);
      const data = await getEmailTemplatesApi();
      setTemplates(data);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handlePreviewTemplate = async (template: EmailTemplate) => {
    try {
      const res = await previewEmailTemplateApi(template.htmlContent, {
        user: { name: 'Sarah Connor', email: 'sarah@example.com' },
        offer: { title: 'Spring AI Boost', discount: '40% OFF', code: 'SPRING40', expiresAt: 'May 31, 2026' },
        campaign: { unsubscribeUrl: '#' },
      });
      setPreviewTemplateHtml(res.html);
    } catch (err: any) {
      setPreviewTemplateHtml(template.htmlContent);
    }
  };

  // ---------------------------------------------------------------------------
  // Campaign Actions
  // ---------------------------------------------------------------------------
  const handleSendCampaignNow = async (id: string) => {
    try {
      await sendEmailCampaignApi(id);
      setStatusMessage({ type: 'success', text: 'Campaign execution dispatched to Redis email queue!' });
      setActiveTab('campaign-details');
      setSelectedCampaignId(id);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handlePauseCampaign = async (id: string) => {
    try {
      await pauseEmailCampaignApi(id);
      setStatusMessage({ type: 'success', text: 'Campaign paused.' });
      if (activeCampaign) setActiveCampaign({ ...activeCampaign, status: 'PAUSED' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleResumeCampaign = async (id: string) => {
    try {
      await resumeEmailCampaignApi(id);
      setStatusMessage({ type: 'success', text: 'Campaign resumed.' });
      if (activeCampaign) setActiveCampaign({ ...activeCampaign, status: 'SENDING' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleCancelCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this campaign? Undispatched emails will be cancelled.')) return;
    try {
      await cancelEmailCampaignApi(id);
      setStatusMessage({ type: 'success', text: 'Campaign cancelled.' });
      if (activeCampaign) setActiveCampaign({ ...activeCampaign, status: 'CANCELLED' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  // ---------------------------------------------------------------------------
  // Wizard Actions
  // ---------------------------------------------------------------------------
  const handleEstimateAudience = async () => {
    setEstimatingAudience(true);
    try {
      const res = await estimateAudienceApi({
        target: wizardData.audienceTarget,
        plans: wizardData.plans,
        inactiveDays: wizardData.inactiveDays,
        category: wizardData.campaignType,
      });
      setAudienceEstimation(res);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setEstimatingAudience(false);
    }
  };

  const handleCreateCampaignSubmit = async () => {
    setShowConfirmSendModal(false);
    try {
      const campaign = await saveEmailCampaignApi({
        name: wizardData.name,
        subject: wizardData.subject,
        campaignType: wizardData.campaignType,
        templateId: wizardData.templateId,
        offerId: wizardData.offerId || null,
        brandId: wizardData.brandId || null,
        status: wizardData.scheduledAt ? 'SCHEDULED' : 'DRAFT',
        scheduledAt: wizardData.scheduledAt || null,
        audienceDefinition: {
          target: wizardData.audienceTarget,
          plans: wizardData.plans,
          inactiveDays: wizardData.inactiveDays,
        },
      });

      if (!wizardData.scheduledAt) {
        // Send now
        await sendEmailCampaignApi(campaign.id);
        setStatusMessage({ type: 'success', text: `Campaign "${campaign.name}" dispatched to queue!` });
      } else {
        setStatusMessage({ type: 'success', text: `Campaign "${campaign.name}" scheduled successfully!` });
      }

      setSelectedCampaignId(campaign.id);
      setActiveTab('campaign-details');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  // ---------------------------------------------------------------------------
  // Suppressions Actions
  // ---------------------------------------------------------------------------
  const handleAddSuppression = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSuppressionEmail) return;
    try {
      const added = await addEmailSuppressionApi(newSuppressionEmail);
      setSuppressions([added, ...suppressions]);
      setNewSuppressionEmail('');
      setStatusMessage({ type: 'success', text: `Added ${added.email} to suppression list.` });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteSuppression = async (id: string) => {
    try {
      await deleteEmailSuppressionApi(id);
      setSuppressions(suppressions.filter((s) => s.id !== id));
      setStatusMessage({ type: 'success', text: 'Email removed from suppression list.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  // ---------------------------------------------------------------------------
  // Preferences Actions
  // ---------------------------------------------------------------------------
  const handleSavePreferences = async () => {
    if (!preferences) return;
    try {
      const updated = await updateEmailPreferencesApi(preferences);
      setPreferences(updated);
      setStatusMessage({ type: 'success', text: 'Email preferences saved.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Email & Real-Time Campaigns
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              Live Production
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Enterprise SMTP infrastructure, real-time offer campaigns, genuine delivery tracking, and DNS verification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setWizardStep(1);
              setActiveTab('create-campaign');
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            Create Campaign
          </button>
        </div>
      </div>

      {/* STATUS TOAST */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center justify-between transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-500" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs underline opacity-70 hover:opacity-100 ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* NAVIGATION TABS */}
      <div className="flex overflow-x-auto no-scrollbar gap-1 border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'overview', label: 'Overview', icon: Sliders },
          { id: 'smtp', label: 'SMTP & Providers', icon: Server },
          { id: 'domains', label: 'Domains & DNS', icon: ShieldCheck },
          { id: 'campaigns', label: 'Campaigns', icon: Send },
          { id: 'offers', label: 'Offers', icon: Tag },
          { id: 'templates', label: 'Templates', icon: FileText },
          { id: 'suppressions', label: 'Suppression List', icon: UserX },
          { id: 'preferences', label: 'Preferences', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id || (tab.id === 'campaigns' && (activeTab === 'create-campaign' || activeTab === 'campaign-details'));
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as MainTab)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/20'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* LOADING STATE */}
      {loading && !overview && (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-brand-500" />
          <p className="text-sm">Connecting to PostgreSQL and loading email infrastructure...</p>
        </div>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* 1. OVERVIEW TAB */}
      {/* ----------------------------------------------------------------------- */}
      {activeTab === 'overview' && overview && (
        <div className="space-y-6">
          {/* Time Filter & Engine Pill */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Window:</span>
              {(['today', '7d', '30d', '90d', 'all'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    timeRange === r
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Queue Engine:</span>
              <strong className="text-slate-900 dark:text-white">
                {overview.queue?.mode === 'bullmq-redis' ? 'BullMQ (Redis)' : 'Resilient High-Throughput Engine'}
              </strong>
            </div>
          </div>

          {/* METRIC CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {[
              { label: 'Total Sent', count: overview.metrics.totalSent, color: 'text-blue-500' },
              { label: 'Delivered', count: overview.metrics.delivered, rate: `${overview.metrics.deliveryRate}%`, color: 'text-emerald-500' },
              { label: 'Opened', count: overview.metrics.opened, rate: `${overview.metrics.openRate}%`, color: 'text-purple-500' },
              { label: 'Clicked', count: overview.metrics.clicked, rate: `${overview.metrics.clickRate}%`, color: 'text-amber-500' },
              { label: 'Bounced', count: overview.metrics.bounced, rate: `${overview.metrics.bounceRate}%`, color: 'text-orange-500' },
              { label: 'Failed', count: overview.metrics.failed, color: 'text-rose-500' },
            ].map((m, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs"
              >
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{m.label}</div>
                <div className={`text-2xl font-black mt-1 ${m.color}`}>
                  {m.count.toLocaleString()}
                </div>
                {m.rate && (
                  <div className="text-[11px] font-bold text-slate-400 mt-1">
                    Rate: <span className="text-slate-700 dark:text-slate-200">{m.rate}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* SUMMARY GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Campaign Pipeline */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Send className="w-4 h-4 text-brand-500" />
                Campaign Pipeline
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Active Dispatches:</span>
                  <span className="font-bold text-emerald-500">{overview.metrics.campaignsCount.active}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Scheduled:</span>
                  <span className="font-bold text-amber-500">{overview.metrics.campaignsCount.scheduled}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Completed:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{overview.metrics.campaignsCount.completed}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Total Campaigns:</span>
                  <span className="font-bold text-brand-500">{overview.metrics.campaignsCount.total}</span>
                </div>
              </div>
            </div>

            {/* Delivery Health */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Deliverability Health
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Delivery Success Rate</span>
                    <span className="text-emerald-500 font-bold">{overview.metrics.deliveryRate}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, overview.metrics.deliveryRate || 0)}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Open Rate</span>
                    <span className="text-purple-500 font-bold">{overview.metrics.openRate}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: `${Math.min(100, overview.metrics.openRate || 0)}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Click-to-Open Rate</span>
                    <span className="text-amber-500 font-bold">{overview.metrics.clickRate}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, overview.metrics.clickRate || 0)}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Queue & Worker Status */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Live Worker Queue
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Waiting in Queue:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{overview.queue?.sendQueue?.waiting ?? 0}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Active Worker Jobs:</span>
                  <span className="font-bold text-brand-500">{overview.queue?.sendQueue?.active ?? 0}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Unsubscribe Count:</span>
                  <span className="font-bold text-slate-400">{overview.metrics.unsubscribed}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Complaint Rate:</span>
                  <span className="font-bold text-emerald-500">{overview.metrics.complaintRate}% (Target &lt; 0.1%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* 2. SMTP & PROVIDERS TAB */}
      {/* ----------------------------------------------------------------------- */}
      {activeTab === 'smtp' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Email Delivery Providers</h2>
              <p className="text-xs text-slate-500">
                Configure your SMTP credentials or cloud providers (Amazon SES, Resend, SendGrid, Mailgun, Postmark).
              </p>
            </div>

            <button
              onClick={() => {
                setEditingProvider({
                  name: 'Primary SMTP Server',
                  type: 'smtp',
                  host: 'smtp.example.com',
                  port: 587,
                  encryptionType: 'STARTTLS',
                  secure: false,
                  fromEmail: 'noreply@socialyolo.com',
                  fromName: 'SocialYolo',
                  isActive: true,
                  isDefault: true,
                });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Provider
            </button>
          </div>

          {/* PROVIDER LIST */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.length === 0 ? (
              <div className="col-span-2 p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500">
                <Server className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="font-semibold">No custom providers configured yet.</p>
                <p className="text-xs text-slate-400 mt-1">
                  SocialYolo is currently using environment-level SMTP credentials ({process.env.SMTP_HOST || '127.0.0.1'}).
                </p>
                <button
                  onClick={() => {
                    setEditingProvider({
                      name: 'Production SMTP Gateway',
                      type: 'smtp',
                      host: 'smtp.mailgun.org',
                      port: 587,
                      encryptionType: 'STARTTLS',
                      fromEmail: 'hello@socialyolo.com',
                      fromName: 'SocialYolo',
                      isActive: true,
                      isDefault: true,
                    });
                  }}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold"
                >
                  Configure SMTP Provider
                </button>
              </div>
            ) : (
              providers.map((p) => (
                <div
                  key={p.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative shadow-xs"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{p.name}</span>
                        {p.isDefault && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Default
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {p.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {p.host ? `${p.host}:${p.port}` : 'Cloud API Adapter'} • {p.encryptionType || 'TLS'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingProvider(p)}
                        className="p-1.5 text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                        title="Edit Provider"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm(`Delete provider "${p.name}"?`)) return;
                          await deleteEmailProviderApi(p.id);
                          setProviders(providers.filter((item) => item.id !== p.id));
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                        title="Delete Provider"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex justify-between">
                    <div>
                      Sender: <strong className="text-slate-700 dark:text-slate-300">{p.fromName} &lt;{p.fromEmail}&gt;</strong>
                    </div>
                    <div>
                      Auth: {p.hasPassword ? '••••••••' : 'No auth'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* EDIT / CREATE PROVIDER FORM */}
          {editingProvider && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-brand-500/40 shadow-xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {editingProvider.id ? 'Edit Provider Configuration' : 'Add New Email / SMTP Provider'}
                </h3>
                <button
                  onClick={() => setEditingProvider(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSaveProvider} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Provider Name</label>
                    <input
                      type="text"
                      required
                      value={editingProvider.name || ''}
                      onChange={(e) => setEditingProvider({ ...editingProvider, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Provider Type</label>
                    <select
                      value={editingProvider.type || 'smtp'}
                      onChange={(e) => setEditingProvider({ ...editingProvider, type: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    >
                      <option value="smtp">Standard SMTP Server</option>
                      <option value="resend">Resend API</option>
                      <option value="ses">Amazon SES</option>
                      <option value="sendgrid">SendGrid</option>
                      <option value="mailgun">Mailgun</option>
                      <option value="postmark">Postmark</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">SMTP Host / Region</label>
                    <input
                      type="text"
                      value={editingProvider.host || ''}
                      onChange={(e) => setEditingProvider({ ...editingProvider, host: e.target.value })}
                      placeholder="e.g. smtp.gmail.com or email-smtp.us-east-1.amazonaws.com"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">SMTP Port</label>
                    <input
                      type="number"
                      value={editingProvider.port || 587}
                      onChange={(e) => setEditingProvider({ ...editingProvider, port: parseInt(e.target.value, 10) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Username / Access Key</label>
                    <input
                      type="text"
                      value={editingProvider.username || ''}
                      onChange={(e) => setEditingProvider({ ...editingProvider, username: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Password / API Key</label>
                    <input
                      type="password"
                      placeholder={editingProvider.id ? 'Leave blank to keep unchanged' : 'Enter password or key'}
                      value={editingProvider.encryptedPassword || ''}
                      onChange={(e) => setEditingProvider({ ...editingProvider, encryptedPassword: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Encryption</label>
                    <select
                      value={editingProvider.encryptionType || 'STARTTLS'}
                      onChange={(e) => setEditingProvider({ ...editingProvider, encryptionType: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    >
                      <option value="STARTTLS">STARTTLS (Port 587)</option>
                      <option value="TLS">SSL / TLS (Port 465)</option>
                      <option value="NONE">None (Port 25/1025)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">From Email</label>
                    <input
                      type="email"
                      required
                      value={editingProvider.fromEmail || ''}
                      onChange={(e) => setEditingProvider({ ...editingProvider, fromEmail: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">From Name</label>
                    <input
                      type="text"
                      required
                      value={editingProvider.fromName || ''}
                      onChange={(e) => setEditingProvider({ ...editingProvider, fromName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProvider.isDefault || false}
                      onChange={(e) => setEditingProvider({ ...editingProvider, isDefault: e.target.checked })}
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span>Set as Default Provider for All Outgoing Emails</span>
                  </label>
                </div>

                {/* TEST SMTP & SAVE BUTTONS */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="email"
                      placeholder="Optional test recipient (e.g. you@example.com)"
                      value={testRecipientEmail}
                      onChange={(e) => setTestRecipientEmail(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs w-64"
                    />
                    <button
                      type="button"
                      disabled={testingSmtp}
                      onClick={handleTestSmtp}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      {testingSmtp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                      Test Connection
                    </button>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => setEditingProvider(null)}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold hover:bg-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-md"
                    >
                      Save Configuration
                    </button>
                  </div>
                </div>

                {/* SMTP TEST RESULT BOX */}
                {smtpTestResult && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-2 mt-4">
                    <div className="flex items-center gap-2 font-bold text-slate-200">
                      {smtpTestResult.connection.connected ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      )}
                      <span>Connection: {smtpTestResult.connection.connected ? 'Connected' : 'Connection Failed'}</span>
                      <span className="text-slate-500 font-normal ml-auto">
                        Latency: {smtpTestResult.connection.latencyMs}ms
                      </span>
                    </div>

                    <div className="text-slate-400">
                      Response: <span className="text-slate-200">{smtpTestResult.connection.message}</span>
                    </div>

                    {smtpTestResult.testEmail && (
                      <div className="text-emerald-400 pt-1 border-t border-slate-800">
                        ✉️ Test Email: {smtpTestResult.testEmail.success ? 'Delivered to ' + testRecipientEmail : 'Failed: ' + smtpTestResult.testEmail.error}
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* 3. DOMAINS & DNS VERIFICATION TAB */}
      {/* ----------------------------------------------------------------------- */}
      {activeTab === 'domains' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Domain & DNS Deliverability</h2>
                <p className="text-xs text-slate-500">
                  Live DNS lookup against SPF, DKIM, and DMARC records to protect sender reputation and prevent spam folder landing.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  placeholder="domain.com"
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono"
                />
                <button
                  disabled={verifyingDomain}
                  onClick={handleVerifyDomain}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  {verifyingDomain ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  Verify DNS
                </button>
              </div>
            </div>

            {domainCheck && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                  <div>
                    Domain: <strong className="text-slate-900 dark:text-white font-mono">{domainCheck.domain}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    Status:
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        domainCheck.isVerified
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : domainCheck.status === 'FAILED'
                          ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}
                    >
                      {domainCheck.status}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                        <th className="py-2.5 font-bold">Type</th>
                        <th className="py-2.5 font-bold">Record Name / Host</th>
                        <th className="py-2.5 font-bold">Expected Configuration</th>
                        <th className="py-2.5 font-bold">Found Record</th>
                        <th className="py-2.5 font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {domainCheck.records.map((r, i) => (
                        <tr key={i}>
                          <td className="py-3 font-bold text-slate-900 dark:text-white">{r.type}</td>
                          <td className="py-3 font-mono text-slate-600 dark:text-slate-300">{r.name}</td>
                          <td className="py-3 text-slate-500">{r.expected}</td>
                          <td className="py-3 font-mono text-slate-400 max-w-xs truncate">
                            {r.found || <span className="text-slate-500 italic">None found</span>}
                          </td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                r.status === 'VERIFIED'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : r.status === 'FAILED'
                                  ? 'bg-rose-500/10 text-rose-400'
                                  : 'bg-amber-500/10 text-amber-400'
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* 4. CAMPAIGNS TAB */}
      {/* ----------------------------------------------------------------------- */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            {/* Status Tabs */}
            <div className="flex gap-1 overflow-x-auto no-scrollbar">
              {(['ALL', 'DRAFT', 'SCHEDULED', 'SENDING', 'COMPLETED', 'PAUSED', 'CANCELLED'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setCampaignFilter(s);
                    getEmailCampaignsApi(s).then(setCampaigns);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    campaignFilter === s
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setWizardStep(1);
                setActiveTab('create-campaign');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              New Campaign
            </button>
          </div>

          {/* CAMPAIGN LIST */}
          <div className="space-y-3">
            {campaigns.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500">
                <Send className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="font-semibold">No campaigns found in this category.</p>
                <p className="text-xs text-slate-400 mt-1">Create an offer campaign or schedule a newsletter to begin.</p>
              </div>
            ) : (
              campaigns.map((c) => (
                <div
                  key={c.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-base">{c.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          c.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : c.status === 'SENDING'
                            ? 'bg-blue-500/10 text-blue-500 animate-pulse'
                            : c.status === 'SCHEDULED'
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-slate-500/10 text-slate-400'
                        }`}
                      >
                        {c.status}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-500/10 text-brand-600 dark:text-brand-400">
                        {c.campaignType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Subject: <span className="text-slate-700 dark:text-slate-300 font-medium">{c.subject}</span>
                    </p>
                    {c.scheduledAt && (
                      <p className="text-[11px] text-amber-500 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Scheduled for: {new Date(c.scheduledAt).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {c.status === 'DRAFT' && (
                      <button
                        onClick={() => handleSendCampaignNow(c.id)}
                        className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition flex items-center gap-1"
                      >
                        <Play className="w-3 h-3" /> Send Now
                      </button>
                    )}

                    {c.status === 'SENDING' && (
                      <button
                        onClick={() => handlePauseCampaign(c.id)}
                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition flex items-center gap-1"
                      >
                        <Pause className="w-3 h-3" /> Pause
                      </button>
                    )}

                    {c.status === 'PAUSED' && (
                      <button
                        onClick={() => handleResumeCampaign(c.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center gap-1"
                      >
                        <Play className="w-3 h-3" /> Resume
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedCampaignId(c.id);
                        setActiveTab('campaign-details');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
                    >
                      View Details &rarr;
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* 5. CAMPAIGN CREATOR WIZARD */}
      {/* ----------------------------------------------------------------------- */}
      {activeTab === 'create-campaign' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create Targeted Email Campaign</h2>
              <p className="text-xs text-slate-500">Step {wizardStep} of 4 • Target real audiences from PostgreSQL</p>
            </div>
            <button
              onClick={() => setActiveTab('campaigns')}
              className="text-xs text-slate-400 hover:text-white"
            >
              Exit Wizard
            </button>
          </div>

          {/* STEP INDICATORS */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`flex-1 h-1.5 rounded-full transition-all ${
                  wizardStep >= step ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-800'
                }`}
              />
            ))}
          </div>

          {/* STEP 1: CAMPAIGN INFO */}
          {wizardStep === 1 && (
            <div className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-bold mb-1">Campaign Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer Creator Flash Sale 2026"
                  value={wizardData.name}
                  onChange={(e) => setWizardData({ ...wizardData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Subject Line</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Save {{offer.discount}} on SocialYolo this weekend only!"
                  value={wizardData.subject}
                  onChange={(e) => setWizardData({ ...wizardData, subject: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Supports dynamic tokens like {'{{user.name}}'}, {'{{offer.discount}}'}, {'{{offer.code}}'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Campaign Type</label>
                <select
                  value={wizardData.campaignType}
                  onChange={(e) => setWizardData({ ...wizardData, campaignType: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm"
                >
                  <option value="OFFER">Promotional Offer</option>
                  <option value="NEWSLETTER">Newsletter</option>
                  <option value="ANNOUNCEMENT">Announcement</option>
                  <option value="PRODUCT_UPDATE">Product Update</option>
                  <option value="CUSTOM">Custom Campaign</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  disabled={!wizardData.name || !wizardData.subject}
                  onClick={() => setWizardStep(2)}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition disabled:opacity-50"
                >
                  Next: Select Content &rarr;
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: TEMPLATE & OFFER SELECTION */}
          {wizardStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold mb-2">Select Template</label>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {templates.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setWizardData({ ...wizardData, templateId: t.id })}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                          wizardData.templateId === t.id
                            ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-950/30'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                        }`}
                      >
                        <div className="font-bold text-slate-900 dark:text-white">{t.name}</div>
                        <div className="text-slate-400 text-[11px] truncate mt-0.5">{t.subject}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-2">Attach Promotional Offer (Optional)</label>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    <div
                      onClick={() => setWizardData({ ...wizardData, offerId: '' })}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                        !wizardData.offerId
                          ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-950/30'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="font-bold text-slate-500">No Offer Attached</div>
                      <div className="text-slate-400 text-[11px]">General informational / update email</div>
                    </div>

                    {offers.map((o) => (
                      <div
                        key={o.id}
                        onClick={() => setWizardData({ ...wizardData, offerId: o.id })}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                          wizardData.offerId === o.id
                            ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-950/30'
                            : 'border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-900 dark:text-white">{o.offerName}</span>
                          <span className="text-emerald-500 font-bold">{o.discount}</span>
                        </div>
                        <div className="text-slate-400 text-[11px]">Code: {o.promoCode}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  onClick={() => setWizardStep(1)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
                >
                  &larr; Back
                </button>
                <button
                  disabled={!wizardData.templateId}
                  onClick={() => {
                    setWizardStep(3);
                    handleEstimateAudience();
                  }}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition disabled:opacity-50"
                >
                  Next: Resolve Audience &rarr;
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: AUDIENCE RESOLUTION */}
          {wizardStep === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold mb-1">Audience Target Criteria</label>
                    <select
                      value={wizardData.audienceTarget}
                      onChange={(e) => {
                        setWizardData({ ...wizardData, audienceTarget: e.target.value });
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm"
                    >
                      <option value="all">All Active Registered Users</option>
                      <option value="plan">Users on Specific Subscription Plan</option>
                      <option value="content_creators">Content Creators (Generated Posts)</option>
                      <option value="inactive_users">Inactive Users</option>
                    </select>
                  </div>

                  {wizardData.audienceTarget === 'plan' && (
                    <div>
                      <label className="block text-xs font-bold mb-2">Select Plans</label>
                      <div className="flex gap-2">
                        {['free_trial', 'starter', 'pro', 'agency'].map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => {
                              const curr = wizardData.plans || [];
                              const updated = curr.includes(p) ? curr.filter((x: any) => x !== p) : [...curr, p];
                              setWizardData({ ...wizardData, plans: updated });
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition ${
                              wizardData.plans?.includes(p)
                                ? 'bg-brand-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                            }`}
                          >
                            {p.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleEstimateAudience}
                    disabled={estimatingAudience}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    {estimatingAudience ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    Recalculate Audience
                  </button>
                </div>

                {/* AUDIENCE ESTIMATION CARD */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Database Audience Breakdown</h4>

                  {audienceEstimation ? (
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500">Matching Database Records:</span>
                        <strong className="text-slate-900 dark:text-white">{audienceEstimation.totalTargeted}</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500">Filtered by Suppression List (Bounces/Unsubs):</span>
                        <strong className="text-rose-500">-{audienceEstimation.suppressedCount}</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500">Filtered by Marketing Preferences:</span>
                        <strong className="text-amber-500">-{audienceEstimation.optedOutCount}</strong>
                      </div>
                      <div className="flex justify-between py-2 text-sm">
                        <span className="font-bold text-slate-900 dark:text-white">Eligible Recipients to Receive Email:</span>
                        <strong className="text-emerald-500 font-extrabold text-base">
                          {audienceEstimation.eligibleCount}
                        </strong>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Calculating audience from PostgreSQL...</p>
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  onClick={() => setWizardStep(2)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
                >
                  &larr; Back
                </button>
                <button
                  onClick={() => setWizardStep(4)}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition"
                >
                  Next: Schedule & Dispatch &rarr;
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: SCHEDULE & DISPATCH */}
          {wizardStep === 4 && (
            <div className="space-y-6 max-w-xl">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                <div className="font-bold text-slate-900 dark:text-white text-sm">Campaign Summary</div>
                <div>Name: <strong className="text-slate-300">{wizardData.name}</strong></div>
                <div>Subject: <strong className="text-slate-300">{wizardData.subject}</strong></div>
                <div>Eligible Recipients: <strong className="text-emerald-400 font-bold">{audienceEstimation?.eligibleCount ?? '0'}</strong></div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Send Timing</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="timing"
                      checked={!wizardData.scheduledAt}
                      onChange={() => setWizardData({ ...wizardData, scheduledAt: '' })}
                    />
                    <span>Send Immediately Now</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="timing"
                      checked={Boolean(wizardData.scheduledAt)}
                      onChange={() => setWizardData({ ...wizardData, scheduledAt: new Date(Date.now() + 3600000).toISOString().slice(0, 16) })}
                    />
                    <span>Schedule for Later</span>
                  </label>
                </div>

                {wizardData.scheduledAt && (
                  <div className="mt-3">
                    <input
                      type="datetime-local"
                      value={wizardData.scheduledAt}
                      onChange={(e) => setWizardData({ ...wizardData, scheduledAt: e.target.value })}
                      className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                    />
                    <span className="text-[11px] text-slate-400 block mt-1">Times stored in UTC; dispatched automatically by scheduler worker.</span>
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  onClick={() => setWizardStep(3)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
                >
                  &larr; Back
                </button>
                <button
                  onClick={() => setShowConfirmSendModal(true)}
                  className="px-6 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition shadow-lg"
                >
                  {wizardData.scheduledAt ? 'Confirm & Schedule Campaign' : 'Confirm & Send Campaign Now'}
                </button>
              </div>
            </div>
          )}

          {/* SAFETY CONFIRMATION MODAL (§45) */}
          {showConfirmSendModal && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                <div className="flex items-center gap-3 text-amber-500">
                  <AlertTriangle className="w-6 h-6" />
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">Safety Confirmation</h3>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300">
                  You are about to dispatch this campaign to{' '}
                  <strong className="text-slate-900 dark:text-white">{audienceEstimation?.eligibleCount ?? 0} actual recipients</strong>.
                  Emails will be enqueued in BullMQ and delivered via your active SMTP provider.
                </p>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowConfirmSendModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateCampaignSubmit}
                    className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md"
                  >
                    Confirm & Proceed
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* 6. CAMPAIGN DETAILS VIEW (REAL-TIME SSE) */}
      {/* ----------------------------------------------------------------------- */}
      {activeTab === 'campaign-details' && activeCampaign && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('campaigns')}
                  className="text-xs text-brand-500 hover:underline"
                >
                  &larr; All Campaigns
                </button>
                <span className="text-slate-500">•</span>
                <span className="text-xs font-bold uppercase text-slate-400">{activeCampaign.campaignType}</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{activeCampaign.name}</h2>
              <p className="text-xs text-slate-400">Subject: {activeCampaign.subject}</p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`/api/proxy/email/campaigns/${activeCampaign.id}/export`}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </a>

              {activeCampaign.status === 'SENDING' && (
                <button
                  onClick={() => handlePauseCampaign(activeCampaign.id)}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
                >
                  Pause
                </button>
              )}

              {activeCampaign.status === 'PAUSED' && (
                <button
                  onClick={() => handleResumeCampaign(activeCampaign.id)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  Resume
                </button>
              )}

              {activeCampaign.status !== 'COMPLETED' && activeCampaign.status !== 'CANCELLED' && (
                <button
                  onClick={() => handleCancelCampaign(activeCampaign.id)}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* REAL-TIME PROGRESS BAR */}
          {campaignStats && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Live Delivery Progress</span>
                <span className="text-brand-500 font-bold flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Real-time SSE Sync
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 text-center">
                  <div className="text-[11px] text-slate-400">Total</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white">{campaignStats.totalRecipients || 0}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 text-center">
                  <div className="text-[11px] text-slate-400">Queued</div>
                  <div className="text-xl font-bold text-slate-400">{campaignStats.queued || 0}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 text-center">
                  <div className="text-[11px] text-slate-400">Processing</div>
                  <div className="text-xl font-bold text-blue-400">{campaignStats.processing || 0}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 text-center">
                  <div className="text-[11px] text-slate-400">Delivered</div>
                  <div className="text-xl font-bold text-emerald-400">{campaignStats.delivered || 0}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 text-center">
                  <div className="text-[11px] text-slate-400">Opened</div>
                  <div className="text-xl font-bold text-purple-400">{campaignStats.opened || 0}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 text-center">
                  <div className="text-[11px] text-slate-400">Bounced / Failed</div>
                  <div className="text-xl font-bold text-rose-400">{(campaignStats.bounced || 0) + (campaignStats.failed || 0)}</div>
                </div>
              </div>
            </div>
          )}

          {/* RECIPIENTS TABLE */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Recipient Delivery Status</h3>
              <select
                value={recipientsStatusFilter}
                onChange={(e) => setRecipientsStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
              >
                <option value="ALL">All Statuses</option>
                <option value="DELIVERED">Delivered</option>
                <option value="SENT">Sent</option>
                <option value="OPENED">Opened</option>
                <option value="CLICKED">Clicked</option>
                <option value="BOUNCED">Bounced</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                    <th className="py-2.5">Email</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5">Provider Message ID</th>
                    <th className="py-2.5">Delivered At</th>
                    <th className="py-2.5">Opened At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {campaignRecipients.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2.5 font-medium text-slate-900 dark:text-white">{r.email}</td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.status === 'DELIVERED' || r.status === 'OPENED'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : r.status === 'FAILED' || r.status === 'BOUNCED'
                              ? 'bg-rose-500/10 text-rose-400'
                              : 'bg-slate-500/10 text-slate-400'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono text-slate-400 max-w-xs truncate">{r.providerMessageId || '—'}</td>
                      <td className="py-2.5 text-slate-400">{r.deliveredAt ? new Date(r.deliveredAt).toLocaleTimeString() : '—'}</td>
                      <td className="py-2.5 text-slate-400">{r.openedAt ? new Date(r.openedAt).toLocaleTimeString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* 7. OFFERS TAB */}
      {/* ----------------------------------------------------------------------- */}
      {activeTab === 'offers' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Marketing & Campaign Offers</h2>
              <p className="text-xs text-slate-500">Create promotional codes, discount campaigns, and special terms.</p>
            </div>
            <button
              onClick={() => {
                setEditingOffer({
                  offerName: 'New Creator Offer',
                  title: 'Special 30% Discount',
                  description: 'Boost your content production with 30% off all creator plans.',
                  discount: '30% OFF',
                  promoCode: 'CREATOR30',
                  ctaText: 'Claim Discount',
                  isActive: true,
                });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" /> Add Offer
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {offers.length === 0 ? (
              <div className="col-span-2 p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500">
                <Tag className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="font-semibold">No offers created yet.</p>
                <p className="text-xs text-slate-400 mt-1">Create an offer to attach it to campaigns and email templates.</p>
              </div>
            ) : (
              offers.map((o) => (
                <div
                  key={o.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white text-base">{o.offerName}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-500">
                          {o.discount}
                        </span>
                        <span className="font-mono text-xs text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded-full">
                          {o.promoCode}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingOffer(o)}
                        className="p-1.5 text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteOffer(o.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 mt-2">{o.description}</p>
                </div>
              ))
            )}
          </div>

          {/* EDIT OFFER MODAL / FORM */}
          {editingOffer && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-brand-500/40 shadow-xl space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingOffer.id ? 'Edit Offer' : 'Create New Offer'}
              </h3>

              <form onSubmit={handleSaveOffer} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold mb-1">Offer Name</label>
                    <input
                      type="text"
                      required
                      value={editingOffer.offerName || ''}
                      onChange={(e) => setEditingOffer({ ...editingOffer, offerName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Email Headline / Title</label>
                    <input
                      type="text"
                      required
                      value={editingOffer.title || ''}
                      onChange={(e) => setEditingOffer({ ...editingOffer, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Discount Text</label>
                    <input
                      type="text"
                      placeholder="e.g. 50% OFF"
                      value={editingOffer.discount || ''}
                      onChange={(e) => setEditingOffer({ ...editingOffer, discount: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Promo Code</label>
                    <input
                      type="text"
                      placeholder="e.g. YOLO50"
                      value={editingOffer.promoCode || ''}
                      onChange={(e) => setEditingOffer({ ...editingOffer, promoCode: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-xs">Description</label>
                  <textarea
                    rows={2}
                    value={editingOffer.description || ''}
                    onChange={(e) => setEditingOffer({ ...editingOffer, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingOffer(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold"
                  >
                    Save Offer
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* 8. TEMPLATES TAB */}
      {/* ----------------------------------------------------------------------- */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Email Templates</h2>
              <p className="text-xs text-slate-500">Transactional, offer, and campaign templates with dynamic variables.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((t) => (
              <div
                key={t.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{t.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-400">
                      {t.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 truncate">{t.subject}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <button
                    onClick={() => handlePreviewTemplate(t)}
                    className="text-xs text-brand-500 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* TEMPLATE PREVIEW MODAL */}
          {previewTemplateHtml && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full h-[80vh] flex flex-col overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewMode('desktop')}
                      className={`p-1.5 rounded-lg ${previewMode === 'desktop' ? 'bg-brand-500 text-white' : 'text-slate-400'}`}
                    >
                      <Monitor className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPreviewMode('mobile')}
                      className={`p-1.5 rounded-lg ${previewMode === 'mobile' ? 'bg-brand-500 text-white' : 'text-slate-400'}`}
                    >
                      <Smartphone className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => setPreviewTemplateHtml(null)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Close
                  </button>
                </div>

                <div className="flex-1 bg-slate-950 p-4 overflow-auto flex justify-center">
                  <div className={previewMode === 'mobile' ? 'w-[375px] shadow-2xl' : 'w-full'}>
                    <iframe
                      srcDoc={previewTemplateHtml}
                      className="w-full h-full min-h-[500px] rounded-xl border border-slate-800 bg-white"
                      title="Preview"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* 9. SUPPRESSION LIST TAB */}
      {/* ----------------------------------------------------------------------- */}
      {activeTab === 'suppressions' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Email Suppression List</h2>
              <p className="text-xs text-slate-500">
                Emails on this list are automatically excluded from all marketing & promotional campaigns to maintain high sender deliverability.
              </p>
            </div>

            {/* ADD SUPPRESSION */}
            <form onSubmit={handleAddSuppression} className="flex gap-2 max-w-md">
              <input
                type="email"
                required
                placeholder="email@example.com"
                value={newSuppressionEmail}
                onChange={(e) => setNewSuppressionEmail(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Add Suppression
              </button>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                    <th className="py-2.5">Suppressed Email</th>
                    <th className="py-2.5">Reason</th>
                    <th className="py-2.5">Source</th>
                    <th className="py-2.5">Added Date</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {suppressions.map((s) => (
                    <tr key={s.id}>
                      <td className="py-3 font-medium text-slate-900 dark:text-white">{s.email}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400">
                          {s.reason}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400 font-mono text-[11px]">{s.source}</td>
                      <td className="py-3 text-slate-400">{new Date(s.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleDeleteSuppression(s.id)}
                          className="text-xs text-rose-500 hover:underline"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* 10. PREFERENCES TAB */}
      {/* ----------------------------------------------------------------------- */}
      {activeTab === 'preferences' && preferences && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Email Preferences & Subscriptions</h2>
            <p className="text-xs text-slate-500">Manage communication channels and consent settings.</p>
          </div>

          <div className="space-y-4">
            {[
              { id: 'marketingEmails', label: 'Marketing & Announcements', desc: 'Product feature announcements, tips, and platform news.' },
              { id: 'offerEmails', label: 'Promotional Offers & Discounts', desc: 'Exclusive creator discounts, flash sales, and credit vouchers.' },
              { id: 'productUpdates', label: 'Product & Engine Updates', desc: 'Changelog notes and visual engine performance updates.' },
              { id: 'newsletters', label: 'Weekly Creator Newsletter', desc: 'Curated creative inspiration and social trends.' },
              { id: 'systemNotifications', label: 'System & Workflow Notifications', desc: 'Post generation completion and account credit alerts.' },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{item.label}</div>
                  <div className="text-[11px] text-slate-400">{item.desc}</div>
                </div>
                <input
                  type="checkbox"
                  checked={(preferences as any)[item.id]}
                  onChange={(e) => setPreferences({ ...preferences, [item.id]: e.target.checked })}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                />
              </div>
            ))}

            {/* Security Emails (Locked) */}
            <div className="flex items-center justify-between py-2 opacity-60">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Security & Billing Alerts</div>
                <div className="text-[11px] text-slate-400">Password resets, security alerts, and payment receipts (required).</div>
              </div>
              <input type="checkbox" checked disabled className="rounded border-slate-300 text-brand-600 w-4 h-4" />
            </div>
          </div>

          <button
            onClick={handleSavePreferences}
            className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition"
          >
            Save Preferences
          </button>
        </div>
      )}
    </div>
  );
}
