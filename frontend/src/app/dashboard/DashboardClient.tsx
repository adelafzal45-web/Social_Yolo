'use client';

import React, { useEffect, useState } from 'react';
import {
  AppNotification,
  BrandProfile,
  CreativeVariant,
  DesignStyle,
  Invoice,
  Project,
  TeamMember,
  UserAccount,
} from '@/types';
import { AppStorage, INITIAL_BRANDS } from '@/lib/storage';
import { renderCreativeCanvas } from '@/lib/creativeRenderer';
import { AppHeader } from '@/components/AppHeader';
import { StudioStepper } from '@/components/StudioStepper';
import { PrototypeRail, PROTOTYPE_SCREENS } from '@/components/PrototypeRail';
import {
  getAuthProfile,
  fetchBrands,
  fetchProjects,
  createProject,
  updateProject,
  fetchCreditBalance,
  topUpCredits,
  fetchSubscription,
  fetchInvoices,
  fetchTeamMembers,
  updateCreativeVariant,
} from '@/lib/api';

// Step Components
import { Step1Upload } from '@/components/steps/Step1Upload';
import { Step2Brand } from '@/components/steps/Step2Brand';
import { Step3Copy } from '@/components/steps/Step3Copy';
import { Step4Style } from '@/components/steps/Step4Style';
import { Step5Platform } from '@/components/steps/Step5Platform';
import { Step6Mode } from '@/components/steps/Step6Mode';
import { Step7Quantity } from '@/components/steps/Step7Quantity';
import { Step8Generate } from '@/components/steps/Step8Generate';
import { Step9Review } from '@/components/steps/Step9Review';
import { Step10Export } from '@/components/steps/Step10Export';

// View Components
import { LandingGuestView } from '@/components/views/LandingGuestView';
import { DashboardView } from '@/components/views/DashboardView';
import { AgencyFoldersView } from '@/components/views/AgencyFoldersView';
import { ProjectDetailView } from '@/components/views/ProjectDetailView';
import { BillingView } from '@/components/views/BillingView';
import { TeamSeatsView } from '@/components/views/TeamSeatsView';
import { SettingsView } from '@/components/views/SettingsView';
import { NotificationsView } from '@/components/views/NotificationsView';

// Modal Components
import { TopUpModal } from '@/components/modals/TopUpModal';
import { NewProjectModal } from '@/components/modals/NewProjectModal';
import { EditCopyModal } from '@/components/modals/EditCopyModal';
import { SwapStyleModal } from '@/components/modals/SwapStyleModal';
import { AdjustBgModal } from '@/components/modals/AdjustBgModal';
import { CancelSubModal } from '@/components/modals/CancelSubModal';

/** Identity resolved on the server from the Supabase session + profiles row. */
export interface InitialProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  role: 'USER' | 'ADMIN';
}

export function DashboardClient({
  initialProfile,
  accessToken,
}: {
  initialProfile: InitialProfile;
  accessToken: string;
}) {
  // 1. Core Reactive State — identity comes from the verified Supabase session
  //    (initialProfile); the remaining fields keep the existing local defaults.
  const [user, setUser] = useState<UserAccount>(() => {
    const base = AppStorage.getUser();
    const name = initialProfile.name || base.name || 'User';
    return {
      ...base,
      id: initialProfile.id,
      name,
      email: initialProfile.email || base.email,
      role: (initialProfile.role as UserAccount['role']) || base.role,
      avatarLetter: name.charAt(0).toUpperCase(),
    };
  });
  const [brands, setBrands] = useState<BrandProfile[]>(() => AppStorage.getBrands());
  const [projects, setProjects] = useState<Project[]>(() => AppStorage.getProjects());
  const [team, setTeam] = useState<TeamMember[]>(() => AppStorage.getTeamMembers());
  const [invoices, setInvoices] = useState<Invoice[]>(() => AppStorage.getInvoices());
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    AppStorage.getNotifications(),
  );

  // 2. Navigation & Studio State
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [studioStep, setStudioStep] = useState<number>(1);
  const [currentProject, setCurrentProject] = useState<Project>(() => {
    const list = AppStorage.getProjects();
    return list[0] || createDefaultProject();
  });
  const [selectedBrand, setSelectedBrand] = useState<BrandProfile>(() => {
    return AppStorage.getBrands()[0] || INITIAL_BRANDS[0];
  });

  // 3. Modals State
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showCancelSubModal, setShowCancelSubModal] = useState(false);
  const [editingCreativeForCopy, setEditingCreativeForCopy] = useState<CreativeVariant | null>(null);
  const [swappingStyleForCreative, setSwappingStyleForCreative] = useState<CreativeVariant | null>(null);
  const [adjustingBgForCreative, setAdjustingBgForCreative] = useState<CreativeVariant | null>(null);

  // 4. Prototype Navigator Drawer State
  const [isRailOpen, setIsRailOpen] = useState(false);
  const [currentScreenIdx, setCurrentScreenIdx] = useState(9); // Default to Screen 10 (Dashboard populated)
  const [token] = useState<string>(accessToken);

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', user.theme);
  }, [user.theme]);

  // Live Backend PostgreSQL Synchronization.
  // The bearer token is the verified Supabase access token supplied by the
  // server component (in-memory only — never localStorage). The backend guard
  // validates it and authorizes each request server-side.
  useEffect(() => {
    if (!accessToken) return;

    async function initFullStack(currentToken: string) {
      try {
        // 1. Live profile & credits
        try {
          const profile = await getAuthProfile(currentToken);
          const u = profile?.user;
          if (u) {
            setUser((prev) => ({
              ...prev,
              id: u.id ?? prev.id,
              name: u.name ?? prev.name,
              email: u.email ?? prev.email,
              role: ((u.role ? String(u.role).toUpperCase() : prev.role) as UserAccount['role']),
              plan: (profile.organization?.tier as UserAccount['plan']) || prev.plan || 'Pro',
              credits: profile.credits?.balance ?? prev.credits,
            }));
          }

        } catch {
          // Profile endpoint unavailable — keep the server-provided identity.
        }

        // 2. Live Brands from PostgreSQL
        try {
          const dbBrands = await fetchBrands(currentToken);
          if (Array.isArray(dbBrands) && dbBrands.length > 0) {
            setBrands(dbBrands as any);
            setSelectedBrand(dbBrands[0] as any);
          }
        } catch {
          /* keep local defaults */
        }

        // 3. Live Projects from PostgreSQL
        try {
          const dbProjects = await fetchProjects(currentToken);
          if (Array.isArray(dbProjects) && dbProjects.length > 0) {
            setProjects(dbProjects);
            setCurrentProject(dbProjects[0]);
          }
        } catch {
          /* keep local defaults */
        }

        // 4. Live Invoices from PostgreSQL
        try {
          const dbInvoices = await fetchInvoices(currentToken);
          if (Array.isArray(dbInvoices) && dbInvoices.length > 0) {
            setInvoices(
              dbInvoices.map((inv: {
                id: string;
                createdAt?: string;
                description: string;
                amountFormatted?: string;
                amountCents: number;
                status: Invoice['status'];
              }) => ({
                id: inv.id,
                date: (inv.createdAt || '').slice(0, 10),
                description: inv.description,
                amount: inv.amountFormatted || `$${(inv.amountCents / 100).toFixed(2)}`,
                status: inv.status,
              })),
            );
          }
        } catch {
          /* keep local defaults */
        }

        // 5. Live Team Members from PostgreSQL
        try {
          const dbTeam = await fetchTeamMembers(currentToken);
          if (Array.isArray(dbTeam) && dbTeam.length > 0) {
            setTeam(dbTeam);
          }
        } catch {
          /* keep local defaults */
        }
      } catch (err) {
        console.warn('Backend live sync notice:', err);
      }
    }

    initFullStack(accessToken);
  }, [accessToken]);

  function createDefaultProject(name = 'New Creative Project'): Project {
    const brand = brands[0] || INITIAL_BRANDS[0];
    return {
      id: 'proj_' + Date.now(),
      name,
      brandId: brand.id,
      brandName: brand.name,
      clientFolder: 'Meridian workspace',
      status: 'draft',
      outputMode: 'creative',
      platforms: ['instagram_portrait', 'facebook_feed', 'pinterest_pin', 'twitter_feed'],
      style: 'lifestyle',
      contentType: 'static',
      quantity: 4,
      originalPhotoUrl: '',
      backgroundMode: 'ai_replace',
      backgroundPreset: 'Warm Studio',
      copy: {
        headline: 'Small batch. Big morning.',
        body: 'Roasted in 12kg batches, every Tuesday. Restocking this Friday — set a reminder.',
        occasion: 'Limited edition',
      },
      creatives: [],
      creditsUsed: 16,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // --- Handlers ---
  const handleUpdateUser = (updates: Partial<UserAccount>) => {
    const updated = AppStorage.updateUser(updates);
    setUser({ ...updated });
  };

  const handleToggleTheme = () => {
    const nextTheme = user.theme === 'dark' ? 'light' : 'dark';
    handleUpdateUser({ theme: nextTheme });
  };

  const handleUpdateProject = (updates: Partial<Project>) => {
    const updated = { ...currentProject, ...updates };
    setCurrentProject(updated);
    AppStorage.saveProject(updated);
    setProjects(AppStorage.getProjects());

    if (token && currentProject.id && !currentProject.id.startsWith('proj_')) {
      updateProject(token, currentProject.id, updates).catch((e: any) =>
        console.warn('Update project API note:', e),
      );
    }
  };

  const handleStartNewProject = (name: string, brandId: string, clientFolder: string) => {
    const targetBrand = brands.find((b) => b.id === brandId) || brands[0] || INITIAL_BRANDS[0];
    const newProj = createDefaultProject(name);
    newProj.brandId = targetBrand?.id || 'brand_meridian';
    newProj.brandName = targetBrand?.name || 'Meridian Coffee Co.';
    newProj.clientFolder = clientFolder;

    setCurrentProject(newProj);
    setSelectedBrand(targetBrand);
    AppStorage.saveProject(newProj);
    setProjects(AppStorage.getProjects());
    setStudioStep(1);
    setActiveView('studio');

    if (token) {
      createProject(token, {
        name,
        brandId: targetBrand.id,
        brandName: targetBrand.name,
        clientFolder,
        platforms: newProj.platforms,
        style: newProj.style,
      })
        .then((saved: any) => {
          if (saved?.id) {
            setCurrentProject((p) => ({ ...p, id: saved.id }));
          }
        })
        .catch((e: any) => console.warn('Project PostgreSQL save notice:', e));
    }
  };

  const handleConfirmTopUp = (credits: number, priceFormatted: string) => {
    const newBalance = AppStorage.addCredits(credits);
    setUser((u) => ({ ...u, credits: newBalance }));

    // Add invoice
    const newInv: Invoice = {
      id: 'inv_' + Date.now(),
      date: 'Today',
      description: `Top-up — ${credits} credits`,
      amount: priceFormatted,
      status: 'Paid',
    };
    setInvoices([newInv, ...invoices]);

    AppStorage.addNotification({
      type: 'payment',
      title: 'Credits Added',
      message: `Successfully topped up ${credits} credits for ${priceFormatted}.`,
    });
    setNotifications(AppStorage.getNotifications());

    if (token) {
      const cents = credits === 50 ? 500 : credits === 150 ? 1200 : 3500;
      topUpCredits(token, credits, cents)
        .then((res: any) => {
          if (res?.account) {
            setUser((u) => ({ ...u, credits: res.account.balance }));
          }
        })
        .catch((e: any) => console.warn('Topup API notice:', e));
    }
  };

  const handleInviteTeamMember = (email: string, role: TeamMember['role']) => {
    AppStorage.inviteTeamMember(email, role);
    setTeam([...AppStorage.getTeamMembers()]);
    AppStorage.addNotification({
      type: 'info',
      title: 'Invitation Dispatched',
      message: `Invited ${email} as ${role}.`,
    });
    setNotifications(AppStorage.getNotifications());
  };

  const handleMarkNotificationsRead = () => {
    AppStorage.markNotificationsAsRead();
    setNotifications(AppStorage.getNotifications());
  };

  // Re-render single creative variant
  const handleRegenerateCreative = async (creativeId: string) => {
    const c = (currentProject?.creatives || []).find((item) => item.id === creativeId);
    if (!c) return;

    const imgSrc =
      currentProject.backgroundMode === 'remove' && currentProject.transparentPhotoUrl
        ? currentProject.transparentPhotoUrl
        : currentProject.enhancedPhotoUrl || currentProject.originalPhotoUrl;

    const rendered = await renderCreativeCanvas({
      width: c.width,
      height: c.height,
      style: c.style,
      brand: selectedBrand,
      headline: c.headline,
      body: c.body,
      occasion: currentProject.copy?.occasion,
      ctaText: c.ctaText,
      productImageSrc: imgSrc,
      isMetaAd: currentProject.outputMode === 'meta_ad',
    });

    const updatedCreatives = (currentProject?.creatives || []).map((item) =>
      item.id === creativeId
        ? { ...item, renderUrl: rendered.dataUrl, textCoveragePct: rendered.textCoveragePct }
        : item,
    );
    handleUpdateProject({ creatives: updatedCreatives });
  };

  // Prototype Screen Selector
  const handleSelectPrototypeScreen = (idx: number) => {
    setCurrentScreenIdx(idx);
    const def = PROTOTYPE_SCREENS[idx];
    if (!def) return;

    if (def.view === 'studio') {
      setActiveView('studio');
      setStudioStep(def.step || 1);
    } else if (def.view === 'new_project_modal') {
      setActiveView('dashboard');
      setShowNewProjectModal(true);
    } else if (def.view === 'topup_modal') {
      setActiveView('studio');
      setStudioStep(7);
      setShowTopUpModal(true);
    } else if (def.view === 'cancel_sub_modal') {
      setActiveView('billing');
      setShowCancelSubModal(true);
    } else if (def.view === 'edit_copy_modal') {
      setActiveView('studio');
      setStudioStep(9);
      if (currentProject?.creatives?.[0]) {
        setEditingCreativeForCopy(currentProject.creatives[0]);
      }
    } else if (def.view === 'swap_style_modal') {
      setActiveView('studio');
      setStudioStep(9);
      if (currentProject?.creatives?.[0]) {
        setSwappingStyleForCreative(currentProject.creatives[0]);
      }
    } else if (def.view === 'adjust_bg_modal') {
      setActiveView('studio');
      setStudioStep(9);
      if (currentProject?.creatives?.[0]) {
        setAdjustingBgForCreative(currentProject.creatives[0]);
      }
    } else if (def.view === 'meta_compliance_check') {
      setActiveView('studio');
      setStudioStep(6);
      handleUpdateProject({ outputMode: 'meta_ad' });
    } else if (def.view === 'insufficient_credits') {
      setActiveView('studio');
      setStudioStep(7);
      handleUpdateUser({ credits: 16 });
      handleUpdateProject({ quantity: 8 });
    } else if (def.view === 'custom_size_dialog') {
      setActiveView('studio');
      setStudioStep(10);
    } else if (def.view === 'export_success') {
      setActiveView('studio');
      setStudioStep(10);
    } else {
      setActiveView(def.view);
    }
  };

  return (
    <div className={isRailOpen ? 'proto-app' : undefined}>
      {/* 1. Left Prototype Matrix Rail (Toggleable) */}
      <PrototypeRail
        currentScreenIdx={currentScreenIdx}
        onSelectScreen={handleSelectPrototypeScreen}
        isOpen={isRailOpen}
        onToggleOpen={() => setIsRailOpen(!isRailOpen)}
      />

      {/* 2. Main Content Area */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Global App Topbar (Header) */}
        {activeView !== 'landing' && (
          <AppHeader
            user={user}
            activeView={activeView}
            onNavigate={(v) => {
              setActiveView(v);
              if (v === 'studio') setStudioStep(1);
            }}
            onOpenTopUp={() => setShowTopUpModal(true)}
            notifications={notifications}
            onMarkNotificationsRead={handleMarkNotificationsRead}
            onToggleTheme={handleToggleTheme}
          />
        )}

        {/* 10-Step Studio Stepper (visible in studio view) */}
        {activeView === 'studio' && (
          <StudioStepper
            currentStep={studioStep}
            onStepClick={(step) => setStudioStep(step)}
          />
        )}

        {/* Main Body Switcher */}
        <main>
          {/* A. Landing / Guest Mode */}
          {activeView === 'landing' && (
            <LandingGuestView
              onStartFree={(file) => {
                const proj = createDefaultProject('Guest Creative');
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => {
                    proj.originalPhotoUrl = reader.result as string;
                    proj.enhancedPhotoUrl = reader.result as string;
                    setCurrentProject(proj);
                    setActiveView('studio');
                    setStudioStep(1);
                  };
                  reader.readAsDataURL(file);
                } else {
                  setCurrentProject(proj);
                  setActiveView('studio');
                  setStudioStep(1);
                }
              }}
              onLogin={() => setActiveView('dashboard')}
              onSignUp={() => {
                setActiveView('dashboard');
              }}
            />
          )}

          {/* B. Dashboard */}
          {activeView === 'dashboard' && (
            <DashboardView
              user={user}
              projects={projects}
              onNewProject={() => setShowNewProjectModal(true)}
              onOpenProject={(proj) => {
                setCurrentProject(proj);
                setActiveView('project_detail');
              }}
              onViewAllProjects={() => {}}
              onOpenTopUp={() => setShowTopUpModal(true)}
              onNavigate={(v) => setActiveView(v)}
            />
          )}

          {/* C. 10-Step Creative Studio */}
          {activeView === 'studio' && (
            <>
              {studioStep === 1 && (
                <Step1Upload
                  project={currentProject}
                  onUpdateProject={handleUpdateProject}
                  onNext={() => setStudioStep(2)}
                  onSaveExit={() => setActiveView('dashboard')}
                  userToken={token || null}
                />
              )}

              {studioStep === 2 && (
                <Step2Brand
                  project={currentProject}
                  brand={selectedBrand}
                  onUpdateBrand={(b) => {
                    setSelectedBrand(b);
                    AppStorage.saveBrand(b);
                    setBrands(AppStorage.getBrands());
                    handleUpdateProject({ brandId: b.id, brandName: b.name });
                  }}
                  onNext={() => setStudioStep(3)}
                  onBack={() => setStudioStep(1)}
                />
              )}

              {studioStep === 3 && (
                <Step3Copy
                  project={currentProject}
                  brand={selectedBrand}
                  onUpdateProject={handleUpdateProject}
                  onNext={() => setStudioStep(4)}
                  onBack={() => setStudioStep(2)}
                />
              )}

              {studioStep === 4 && (
                <Step4Style
                  project={currentProject}
                  brand={selectedBrand}
                  onUpdateProject={handleUpdateProject}
                  onNext={() => setStudioStep(5)}
                  onBack={() => setStudioStep(3)}
                />
              )}

              {studioStep === 5 && (
                <Step5Platform
                  project={currentProject}
                  onUpdateProject={handleUpdateProject}
                  onNext={() => setStudioStep(6)}
                  onBack={() => setStudioStep(4)}
                />
              )}

              {studioStep === 6 && (
                <Step6Mode
                  project={currentProject}
                  onUpdateProject={handleUpdateProject}
                  onNext={() => setStudioStep(7)}
                  onBack={() => setStudioStep(5)}
                />
              )}

              {studioStep === 7 && (
                <Step7Quantity
                  project={currentProject}
                  user={user}
                  onUpdateProject={handleUpdateProject}
                  onNext={() => {
                    const cost = currentProject.quantity * (currentProject.contentType === 'video' ? 20 : 4);
                    const deduction = AppStorage.deductCredits(cost);
                    if (deduction.success) {
                      setUser((u) => ({ ...u, credits: deduction.balance }));
                      setStudioStep(8);
                    } else {
                      setShowTopUpModal(true);
                    }
                  }}
                  onBack={() => setStudioStep(6)}
                  onOpenTopUp={() => setShowTopUpModal(true)}
                />
              )}

              {studioStep === 8 && (
                <Step8Generate
                  project={currentProject}
                  brand={selectedBrand}
                  token={token}
                  onGenerationComplete={(creatives) => {
                    handleUpdateProject({ creatives, status: 'review' });
                    setStudioStep(9);
                  }}
                />
              )}

              {studioStep === 9 && (
                <Step9Review
                  project={currentProject}
                  onUpdateCreative={(id, updates) => {
                    const list = (currentProject?.creatives || []).map((c) =>
                      c.id === id ? { ...c, ...updates } : c,
                    );
                    handleUpdateProject({ creatives: list });
                  }}
                  onRegenerateCreative={handleRegenerateCreative}
                  onRegenerateAll={() => {
                    (currentProject?.creatives || []).forEach((c) => handleRegenerateCreative(c.id));
                  }}
                  onOpenEditCopyModal={(c) => setEditingCreativeForCopy(c)}
                  onOpenSwapStyleModal={(c) => setSwappingStyleForCreative(c)}
                  onOpenAdjustBgModal={(c) => setAdjustingBgForCreative(c)}
                  onNext={() => setStudioStep(10)}
                  onBack={() => setStudioStep(7)}
                />
              )}

              {studioStep === 10 && (
                <Step10Export
                  project={currentProject}
                  user={user}
                  onBackToReview={() => setStudioStep(9)}
                  onDone={() => {
                    handleUpdateProject({ status: 'approved' });
                    setActiveView('dashboard');
                  }}
                  onSignUpRedirect={() => {
                    handleUpdateProject({ status: 'approved' });
                    setActiveView('dashboard');
                  }}
                />
              )}
            </>
          )}

          {/* D. Agency Client Workspaces */}
          {activeView === 'agency_folders' && (
            <AgencyFoldersView
              projects={projects}
              onOpenProject={(proj) => {
                setCurrentProject(proj);
                setActiveView('project_detail');
              }}
              onNewProject={() => setShowNewProjectModal(true)}
            />
          )}

          {/* E. Project Detail View */}
          {activeView === 'project_detail' && (
            <ProjectDetailView
              project={currentProject}
              onBackToDashboard={() => setActiveView('dashboard')}
              onOpenInStudio={(p) => {
                setCurrentProject(p);
                setActiveView('studio');
                setStudioStep(p.status === 'approved' ? 9 : 1);
              }}
              onDuplicate={(p) => {
                const dup = { ...p, id: 'proj_' + Date.now(), name: `${p.name} (Copy)` };
                AppStorage.saveProject(dup);
                setProjects(AppStorage.getProjects());
                setCurrentProject(dup);
                setActiveView('studio');
                setStudioStep(1);
              }}
            />
          )}

          {/* F. Plans & Billing */}
          {activeView === 'billing' && (
            <BillingView
              user={user}
              invoices={invoices}
              onOpenTopUp={() => setShowTopUpModal(true)}
              onOpenCancelModal={() => setShowCancelSubModal(true)}
              onUpgradePlan={(newPlan) => {
                const creditsMap = {
                  'Free Trial': 4,
                  Starter: 100,
                  Pro: 350,
                  Agency: 1000,
                };
                handleUpdateUser({ plan: newPlan, maxCredits: creditsMap[newPlan], credits: creditsMap[newPlan] });
              }}
            />
          )}

          {/* G. Team Seats */}
          {activeView === 'team' && (
            <TeamSeatsView
              teamMembers={team}
              onInviteMember={handleInviteTeamMember}
            />
          )}

          {/* H. Settings */}
          {activeView === 'settings' && (
            <SettingsView
              user={user}
              onUpdateUser={handleUpdateUser}
              onNavigate={(v) => setActiveView(v)}
            />
          )}

          {/* I. Notifications */}
          {activeView === 'notifications' && (
            <NotificationsView
              notifications={notifications}
              onMarkAllRead={handleMarkNotificationsRead}
              onBack={() => setActiveView('dashboard')}
            />
          )}

          {/* J. System Views from PRD */}
          {activeView === 'session_expired' && (
            <div className="app-body centered">
              <div className="center-card">
                <div className="icon-circle" style={{ background: '#2a2008', color: 'var(--amber)' }}>
                  ⏱
                </div>
                <h3>Your session has expired</h3>
                <p>
                  For your security, we signed you out after a period of inactivity. Your project drafts and brand assets have been safely saved.
                </p>
                <a className="btn btn-primary btn-block" href="/login">
                  Log in again →
                </a>
              </div>
            </div>
          )}

          {activeView === 'mobile_flow' && (
            <div className="app-body centered" style={{ padding: '20px' }}>
              <div
                style={{
                  width: '380px',
                  background: '#12121c',
                  border: '1px solid var(--border)',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  boxShadow: '0 30px 70px rgba(0,0,0,0.7)',
                }}
              >
                <div className="app-topbar" style={{ padding: '12px 16px' }}>
                  <div className="app-brand">
                    <div className="logo" style={{ width: '22px', height: '22px' }}>SY</div>
                    <span className="name" style={{ fontSize: '13px' }}>SOCIAL YOLO</span>
                  </div>
                  <span className="pill pill-credits" style={{ fontSize: '10px', padding: '3px 8px' }}>
                    {user?.credits ?? 0} CR
                  </span>
                </div>

                <div style={{ padding: '16px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--purple-2)', textTransform: 'uppercase' }}>
                    Step 3 of 10 · Copy
                  </div>
                  <h3 style={{ fontSize: '16px', margin: '6px 0 12px' }}>
                    {currentProject?.copy?.headline || 'Small batch. Big morning.'}
                  </h3>
                  <div className="panel" style={{ padding: '12px', background: '#1c1c2c', marginBottom: '14px' }}>
                    <div style={{ fontSize: '12px', color: '#fff' }}>
                      {currentProject?.copy?.body || 'Roasted in 12kg batches, every Tuesday.'}
                    </div>
                  </div>
                  <button
                    className="btn btn-primary btn-block"
                    onClick={() => {
                      setActiveView('studio');
                      setStudioStep(4);
                    }}
                  >
                    Continue to Style →
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* --- MODALS --- */}
      {showTopUpModal && (
        <TopUpModal
          onClose={() => setShowTopUpModal(false)}
          onConfirmTopUp={handleConfirmTopUp}
        />
      )}

      {showNewProjectModal && (
        <NewProjectModal
          brands={brands}
          onClose={() => setShowNewProjectModal(false)}
          onCreateProject={handleStartNewProject}
        />
      )}

      {showCancelSubModal && (
        <CancelSubModal
          renewalDate="Sep 24, 2026"
          onClose={() => setShowCancelSubModal(false)}
          onConfirmCancel={() => {
            handleUpdateUser({ plan: 'Free Trial', maxCredits: 4, credits: 4 });
          }}
        />
      )}

      {editingCreativeForCopy && (
        <EditCopyModal
          creative={editingCreativeForCopy}
          onClose={() => setEditingCreativeForCopy(null)}
          onSave={(id, newHead, newBody) => {
            const list = (currentProject?.creatives || []).map((c) =>
              c.id === id ? { ...c, headline: newHead, body: newBody } : c,
            );
            handleUpdateProject({ creatives: list });
            handleRegenerateCreative(id);
          }}
        />
      )}

      {swappingStyleForCreative && (
        <SwapStyleModal
          creative={swappingStyleForCreative}
          onClose={() => setSwappingStyleForCreative(null)}
          onSwapStyle={(id, newStyle: DesignStyle) => {
            const list = (currentProject?.creatives || []).map((c) =>
              c.id === id ? { ...c, style: newStyle } : c,
            );
            handleUpdateProject({ creatives: list });
            handleRegenerateCreative(id);
          }}
        />
      )}

      {adjustingBgForCreative && (
        <AdjustBgModal
          creative={adjustingBgForCreative}
          onClose={() => setAdjustingBgForCreative(null)}
          onApply={(id) => {
            handleRegenerateCreative(id);
          }}
        />
      )}
    </div>
  );
}
