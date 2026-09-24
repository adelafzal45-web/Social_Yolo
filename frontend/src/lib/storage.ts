import {
  AppNotification,
  BrandProfile,
  CreativeVariant,
  Invoice,
  Project,
  TeamMember,
  UserAccount,
} from '../types';

const STORAGE_KEYS = {
  USER: 'social_yolo_user',
  PROJECTS: 'social_yolo_projects',
  BRANDS: 'social_yolo_brands',
  TEAM: 'social_yolo_team',
  NOTIFICATIONS: 'social_yolo_notifications',
  INVOICES: 'social_yolo_invoices',
};

const DEFAULT_USER: UserAccount = {
  id: 'usr_riya_101',
  name: 'Riya Malhotra',
  email: 'riya@brightpath.agency',
  avatarLetter: 'R',
  role: 'CREATOR',
  plan: 'Pro',
  credits: 214,
  maxCredits: 350,
  resetDays: 12,
  clientFoldersCount: 4,
  theme: 'dark',
};

export const INITIAL_BRANDS: BrandProfile[] = [
  {
    id: 'brand_meridian',
    name: 'Meridian Coffee Co.',
    tagline: 'Small-batch specialty beans, roasted weekly.',
    description: 'Small-batch specialty coffee roaster, warm and premium feel, focused on single-origin beans.',
    websiteUrl: 'https://www.meridiancoffeeco.com',
    niche: 'food_beverage',
    nicheLabel: 'Food & Beverage',
    colors: {
      primary: '#c98a3f',
      secondary: '#3a2c5a',
      accent: '#e0aa4e',
      background: '#0d0d14',
      text: '#ffffff',
    },
    fonts: {
      display: 'Fraktion Serif, Georgia, serif',
      body: 'Söhne Fallback, Inter, sans-serif',
    },
    tone: 'Warm',
    createdAt: '2026-08-01T10:00:00.000Z',
  },
  {
    id: 'brand_aster',
    name: 'Aster & Co.',
    tagline: 'Botanical luxury essentials for home and skin.',
    description: 'Minimalist organic body oils and aromatics made from cold-pressed botanicals.',
    websiteUrl: 'https://www.asterandco.com',
    niche: 'beauty_wellness',
    nicheLabel: 'Beauty & Wellness',
    colors: {
      primary: '#a86fae',
      secondary: '#2e1830',
      accent: '#f2c4d8',
      background: '#0e0b14',
      text: '#ffffff',
    },
    fonts: {
      display: 'Canela Fallback, serif',
      body: 'Inter, sans-serif',
    },
    tone: 'Premium',
    createdAt: '2026-08-10T14:30:00.000Z',
  },
  {
    id: 'brand_northridge',
    name: 'North Ridge Outdoors',
    tagline: 'Ultralight performance gear for alpine journeys.',
    description: 'Technical mountain gear and weatherproof essentials designed for severe climates.',
    websiteUrl: 'https://www.northridgeoutdoors.com',
    niche: 'fitness_sports',
    nicheLabel: 'Fitness & Sports',
    colors: {
      primary: '#3ecf8e',
      secondary: '#1c2438',
      accent: '#60a5fa',
      background: '#0a0d16',
      text: '#ffffff',
    },
    fonts: {
      display: 'Impact, Inter, sans-serif',
      body: 'Inter, sans-serif',
    },
    tone: 'Bold',
    createdAt: '2026-08-15T09:15:00.000Z',
  },
];

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj_ramadan_restock',
    name: 'Ramadan Restock — Insta',
    brandId: 'brand_meridian',
    brandName: 'Meridian Coffee Co.',
    clientFolder: 'Meridian workspace',
    status: 'approved',
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
    creatives: [
      {
        id: 'c1',
        platformKey: 'instagram_portrait',
        platformName: 'Instagram',
        width: 1080,
        height: 1350,
        label: '1080×1350 · Feed portrait',
        style: 'lifestyle',
        headline: 'Small batch. Big morning.',
        body: 'Roasted in 12kg batches, every Tuesday.',
        ctaText: 'SHOP NOW',
        textCoveragePct: 14,
        metaPass: true,
        status: 'approved',
      },
      {
        id: 'c2',
        platformKey: 'facebook_feed',
        platformName: 'Facebook',
        width: 1200,
        height: 628,
        label: '1200×628 · Link ad',
        style: 'lifestyle',
        headline: 'Small batch. Big morning.',
        body: 'Roasted in 12kg batches, every Tuesday.',
        ctaText: 'ORDER NOW',
        textCoveragePct: 12,
        metaPass: true,
        status: 'approved',
      },
      {
        id: 'c3',
        platformKey: 'pinterest_pin',
        platformName: 'Pinterest',
        width: 1000,
        height: 1500,
        label: '1000×1500 · Pin',
        style: 'lifestyle',
        headline: 'Small batch. Big morning.',
        body: 'Roasted in 12kg batches, every Tuesday.',
        ctaText: 'EXPLORE',
        textCoveragePct: 13,
        metaPass: true,
        status: 'approved',
      },
      {
        id: 'c4',
        platformKey: 'twitter_feed',
        platformName: 'Twitter / X',
        width: 1200,
        height: 628,
        label: '1200×628 · Feed',
        style: 'lifestyle',
        headline: 'Small batch. Big morning.',
        body: 'Roasted in 12kg batches, every Tuesday.',
        ctaText: 'LEARN MORE',
        textCoveragePct: 11,
        metaPass: true,
        status: 'approved',
      },
    ],
    creditsUsed: 16,
    createdAt: '2026-08-12T16:02:00.000Z',
    updatedAt: '2026-08-12T16:44:00.000Z',
  },
  {
    id: 'proj_q3_launch',
    name: 'Q3 Product Launch',
    brandId: 'brand_meridian',
    brandName: 'Meridian Coffee Co.',
    clientFolder: 'Meridian workspace',
    status: 'review',
    outputMode: 'meta_ad',
    platforms: ['instagram_portrait', 'facebook_feed', 'instagram_square'],
    style: 'luxury',
    contentType: 'static',
    quantity: 3,
    originalPhotoUrl: '',
    backgroundMode: 'ai_replace',
    backgroundPreset: 'Dark Gradient',
    copy: {
      headline: 'Freshly roasted single-origin beans.',
      body: 'Delivered fresh to your door within 48 hours of roasting.',
      occasion: 'New arrival',
    },
    creatives: [],
    creditsUsed: 12,
    createdAt: '2026-08-20T11:20:00.000Z',
    updatedAt: '2026-08-20T12:00:00.000Z',
  },
  {
    id: 'proj_fall_lookbook',
    name: 'Fall Lookbook',
    brandId: 'brand_aster',
    brandName: 'Aster & Co.',
    clientFolder: 'Aster workspace',
    status: 'draft',
    outputMode: 'creative',
    platforms: ['instagram_portrait', 'pinterest_pin'],
    style: 'minimalist',
    contentType: 'static',
    quantity: 2,
    originalPhotoUrl: '',
    backgroundMode: 'keep',
    backgroundPreset: 'Clean Studio',
    copy: {
      headline: 'Pure botanical moisture.',
      body: 'Formulated with cold-pressed rosehip and squalane.',
      occasion: 'Seasonal',
    },
    creatives: [],
    creditsUsed: 8,
    createdAt: '2026-08-28T09:00:00.000Z',
    updatedAt: '2026-08-28T09:00:00.000Z',
  },
  {
    id: 'proj_holiday_teaser',
    name: 'Holiday Teaser Set',
    brandId: 'brand_northridge',
    brandName: 'North Ridge Outdoors',
    clientFolder: 'No folder',
    status: 'generating',
    outputMode: 'creative',
    platforms: ['instagram_portrait', 'instagram_story', 'twitter_feed'],
    style: 'bold',
    contentType: 'static',
    quantity: 3,
    originalPhotoUrl: '',
    backgroundMode: 'ai_replace',
    backgroundPreset: 'Alpine Glacier',
    copy: {
      headline: 'Defy the elements.',
      body: 'Engineered for sub-zero alpine ascents.',
      occasion: 'Holiday sale',
    },
    creatives: [],
    creditsUsed: 12,
    createdAt: '2026-09-02T15:10:00.000Z',
    updatedAt: '2026-09-02T15:15:00.000Z',
  },
];

const INITIAL_TEAM: TeamMember[] = [
  {
    id: 'tm1',
    name: 'Riya Malhotra',
    email: 'riya@brightpath.agency',
    role: 'Owner',
    status: 'Active',
    avatarLetter: 'R',
  },
  {
    id: 'tm2',
    name: 'Dev Anand',
    email: 'dev@brightpath.agency',
    role: 'Editor',
    status: 'Active',
    avatarLetter: 'D',
  },
  {
    id: 'tm3',
    name: 'Sara Iqbal',
    email: 'sara@brightpath.agency',
    role: 'Editor',
    status: 'Invite pending',
    avatarLetter: 'S',
  },
  {
    id: 'tm4',
    name: 'Marcus Lee',
    email: 'marcus@brightpath.agency',
    role: 'Viewer',
    status: 'Active',
    avatarLetter: 'M',
  },
];

const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv_001',
    date: 'Aug 24, 2026',
    description: 'Pro plan — monthly renewal',
    amount: '$49.00',
    status: 'Paid',
    pdfUrl: '#',
  },
  {
    id: 'inv_002',
    date: 'Aug 12, 2026',
    description: 'Top-up — 50 credits',
    amount: '$5.00',
    status: 'Paid',
    pdfUrl: '#',
  },
  {
    id: 'inv_003',
    date: 'Jul 24, 2026',
    description: 'Pro plan — monthly renewal',
    amount: '$49.00',
    status: 'Paid',
    pdfUrl: '#',
  },
];

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_1',
    type: 'warning',
    title: 'Low credit balance',
    message: 'You have 16 credits left — top up to avoid interruptions.',
    time: '2 hours ago',
    read: false,
  },
  {
    id: 'notif_2',
    type: 'success',
    title: 'Generation complete',
    message: '6 creatives ready for review in Q3 Product Launch.',
    time: '5 hours ago',
    read: false,
  },
  {
    id: 'notif_3',
    type: 'info',
    title: 'Team invite accepted',
    message: 'Sara Iqbal joined Brightpath Agency as Editor.',
    time: 'Yesterday',
    read: true,
  },
  {
    id: 'notif_4',
    type: 'payment',
    title: 'Payment successful',
    message: 'Your Pro plan renewed — $49.00 charged.',
    time: 'Aug 24, 2026',
    read: true,
  },
];

export class AppStorage {
  private static isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  static getUser(): UserAccount {
    if (!this.isBrowser()) return DEFAULT_USER;
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(DEFAULT_USER));
      return DEFAULT_USER;
    }
    try {
      const parsed = JSON.parse(stored);
      if (!parsed || typeof parsed !== 'object') {
        return DEFAULT_USER;
      }
      return {
        ...DEFAULT_USER,
        ...parsed,
        plan: parsed.plan || DEFAULT_USER.plan,
        role: parsed.role || DEFAULT_USER.role,
        avatarLetter: parsed.avatarLetter || (parsed.name ? parsed.name.charAt(0).toUpperCase() : DEFAULT_USER.avatarLetter),
      };
    } catch {
      return DEFAULT_USER;
    }
  }

  static updateUser(updates: Partial<UserAccount>): UserAccount {
    const current = this.getUser();
    const updated: UserAccount = {
      ...current,
      ...updates,
      plan: updates.plan || current.plan || DEFAULT_USER.plan,
    };
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
    }
    return updated;
  }

  static deductCredits(amount: number): { success: boolean; balance: number } {
    const user = this.getUser();
    if (user.credits < amount) {
      return { success: false, balance: user.credits };
    }
    user.credits -= amount;
    this.updateUser({ credits: user.credits });
    return { success: true, balance: user.credits };
  }

  static addCredits(amount: number): number {
    const user = this.getUser();
    user.credits += amount;
    this.updateUser({ credits: user.credits });
    return user.credits;
  }

  static getProjects(): Project[] {
    if (!this.isBrowser()) return INITIAL_PROJECTS;
    const stored = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(INITIAL_PROJECTS));
      return INITIAL_PROJECTS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_PROJECTS;
    }
  }

  static saveProject(project: Project): Project {
    const list = this.getProjects();
    const idx = list.findIndex((p) => p.id === project.id);
    if (idx >= 0) {
      list[idx] = { ...project, updatedAt: new Date().toISOString() };
    } else {
      list.unshift({ ...project, updatedAt: new Date().toISOString() });
    }
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(list));
    }
    return project;
  }

  static getProjectById(id: string): Project | undefined {
    return this.getProjects().find((p) => p.id === id);
  }

  static deleteProject(id: string): void {
    const filtered = this.getProjects().filter((p) => p.id !== id);
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(filtered));
    }
  }

  static getBrands(): BrandProfile[] {
    if (!this.isBrowser()) return INITIAL_BRANDS;
    const stored = localStorage.getItem(STORAGE_KEYS.BRANDS);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.BRANDS, JSON.stringify(INITIAL_BRANDS));
      return INITIAL_BRANDS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_BRANDS;
    }
  }

  static saveBrand(brand: BrandProfile): BrandProfile {
    const list = this.getBrands();
    const idx = list.findIndex((b) => b.id === brand.id);
    if (idx >= 0) {
      list[idx] = brand;
    } else {
      list.push(brand);
    }
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.BRANDS, JSON.stringify(list));
    }
    return brand;
  }

  static getTeamMembers(): TeamMember[] {
    if (!this.isBrowser()) return INITIAL_TEAM;
    const stored = localStorage.getItem(STORAGE_KEYS.TEAM);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.TEAM, JSON.stringify(INITIAL_TEAM));
      return INITIAL_TEAM;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_TEAM;
    }
  }

  static inviteTeamMember(email: string, role: TeamMember['role']): TeamMember {
    const list = this.getTeamMembers();
    const safeEmail = email || '';
    const letter = (safeEmail.charAt(0) || 'U').toUpperCase();
    const newMember: TeamMember = {
      id: 'tm_' + Date.now(),
      name: safeEmail ? safeEmail.split('@')[0] : 'User',
      email: safeEmail,
      role,
      status: 'Invite pending',
      avatarLetter: letter,
    };
    list.push(newMember);
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.TEAM, JSON.stringify(list));
    }
    return newMember;
  }

  static getInvoices(): Invoice[] {
    return INITIAL_INVOICES;
  }

  static getNotifications(): AppNotification[] {
    if (!this.isBrowser()) return INITIAL_NOTIFICATIONS;
    const stored = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
      return INITIAL_NOTIFICATIONS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  }

  static markNotificationsAsRead(): void {
    const list = this.getNotifications().map((n) => ({ ...n, read: true }));
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
    }
  }

  static addNotification(notif: Omit<AppNotification, 'id' | 'time' | 'read'>): AppNotification {
    const list = this.getNotifications();
    const created: AppNotification = {
      id: 'notif_' + Date.now(),
      time: 'Just now',
      read: false,
      ...notif,
    };
    list.unshift(created);
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
    }
    return created;
  }
}
