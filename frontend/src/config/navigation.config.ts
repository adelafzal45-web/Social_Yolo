/**
 * Social Yolo — Single Source of Truth Navigation Configuration
 *
 * Powers both the Sidebar and the Header "Jump To" Command Palette.
 * Ensures consistent routing, search indexing, and RBAC visibility.
 */

import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  Image as ImageIcon,
  Star,
  Palette,
  CreditCard,
  Settings,
  ShieldAlert,
  Lightbulb,
  Layers,
  Mail,
  type LucideIcon,
} from 'lucide-react';
import { UserRole } from '@/lib/types';

export interface AppRouteItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
  category: 'Core' | 'Creation' | 'Management' | 'System' | 'Administration';
  badge?: string;
  keywords?: string[];
  requiredRole?: UserRole;
}

export const APP_ROUTES: AppRouteItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Workspace metrics, active plan stats, and recent activity',
    category: 'Core',
    keywords: ['home', 'overview', 'stats', 'analytics', 'summary'],
  },
  {
    id: 'content-create',
    label: 'Create Content',
    href: '/content/create',
    icon: Sparkles,
    description: 'No-prompt structured content generation powered by brand intelligence',
    category: 'Creation',
    badge: 'Intelligence',
    keywords: ['content', 'generate', 'social post', 'variations', 'copy', 'brand'],
  },
  {
    id: 'content-concepts',
    label: 'Content Concepts',
    href: '/content/concepts',
    icon: Lightbulb,
    description: 'Autonomous creative angles, campaign hooks, and strategy concepts',
    category: 'Creation',
    keywords: ['concepts', 'ideas', 'angles', 'hooks', 'strategy'],
  },
  {
    id: 'content-library',
    label: 'Content Library',
    href: '/content/library',
    icon: Layers,
    description: 'Generated platform-ready posts, copy variations, and approvals',
    category: 'Creation',
    keywords: ['library', 'posts', 'captions', 'drafts', 'scheduled', 'published'],
  },
  {
    id: 'design-studio',
    label: 'AI Post Studio',
    href: '/studio',
    icon: Sparkles,
    description: 'Unified promptless AI post & design generator powered by Brand Intelligence',
    category: 'Creation',
    badge: 'AI Studio',
    keywords: ['studio', 'post', 'creative', 'visual rag', 'design', 'meta ads', 'instagram', 'variations', 'generate', 'pinterest', 'behance'],
  },
  {
    id: 'creations',
    label: 'Creations',
    href: '/dashboard/gallery',
    icon: ImageIcon,
    description: 'Browse, filter, preview, and download your generated designs',
    category: 'Creation',
    keywords: ['gallery', 'posts', 'images', 'history', 'downloads', 'renders'],
  },
  {
    id: 'favorites',
    label: 'Favorites',
    href: '/dashboard/favorites',
    icon: Star,
    description: 'Quick access to your starred and top-rated marketing assets',
    category: 'Creation',
    keywords: ['bookmarks', 'starred', 'saved', 'likes', 'best'],
  },
  {
    id: 'brands',
    label: 'Brands',
    href: '/brands',
    icon: Palette,
    description: 'AI Content Intelligence, website crawler, and structured brand profiles',
    category: 'Management',
    keywords: ['brand', 'website', 'intelligence', 'colors', 'typography', 'logo', 'identity', 'crawler'],
  },
  {
    id: 'billing',
    label: 'Billing & Credits',
    href: '/dashboard/billing',
    icon: CreditCard,
    description: 'Credit balance, top-up packs, plan upgrade, and invoices',
    category: 'Management',
    keywords: ['credits', 'topup', 'subscription', 'plan', 'invoices', 'payment', 'upgrade'],
  },
  {
    id: 'email-campaigns',
    label: 'Email & Campaigns',
    href: '/dashboard/settings/email',
    icon: Mail,
    description: 'Production SMTP delivery, real-time offer campaigns, and domain health',
    category: 'Management',
    badge: 'Production',
    keywords: ['email', 'smtp', 'campaigns', 'offers', 'newsletter', 'templates', 'subscribers', 'dns', 'spf', 'dkim'],
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    description: 'Account profile, password management, and service connectivity',
    category: 'System',
    keywords: ['profile', 'password', 'security', 'health', 'port', 'account'],
  },
  {
    id: 'admin-users',
    label: 'Admin Control Panel',
    href: '/admin/users',
    icon: ShieldAlert,
    description: 'User access control, role promotions, and platform administration',
    category: 'Administration',
    requiredRole: UserRole.ADMIN,
    keywords: ['admin', 'users', 'rbac', 'roles', 'permissions', 'management'],
  },
];

/**
 * Returns navigation routes authorized for the given user role.
 */
export function getAuthorizedRoutes(role?: UserRole | string | null): AppRouteItem[] {
  const normalizedRole = typeof role === 'string' ? role.toLowerCase() : role;
  const isAdmin = normalizedRole === UserRole.ADMIN || normalizedRole === 'admin';

  return APP_ROUTES.filter((route) => {
    if (!route.requiredRole) return true;
    if (route.requiredRole === UserRole.ADMIN) return isAdmin;
    return true;
  });
}

/**
 * Filters authorized routes by a search query (label, description, keywords, href).
 */
export function searchAuthorizedRoutes(
  query: string,
  role?: UserRole | string | null
): AppRouteItem[] {
  const authorized = getAuthorizedRoutes(role);
  const q = query.trim().toLowerCase();

  if (!q) return authorized;

  return authorized.filter((route) => {
    if (route.label.toLowerCase().includes(q)) return true;
    if (route.description.toLowerCase().includes(q)) return true;
    if (route.href.toLowerCase().includes(q)) return true;
    if (route.category.toLowerCase().includes(q)) return true;
    if (route.keywords?.some((k) => k.toLowerCase().includes(q))) return true;
    return false;
  });
}
