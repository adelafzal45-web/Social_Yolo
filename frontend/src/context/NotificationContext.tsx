'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';
import { NotificationItem } from '@/lib/types';
import {
  getNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  deleteNotificationApi,
  clearAllNotificationsApi,
} from '@/lib/api';
import { useAuth } from './AuthContext';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

export interface NotificationContextType {
  // Toast notifications (ephemeral alerts)
  toasts: ToastMessage[];
  showToast: (toast: Omit<ToastMessage, 'id'>) => string;
  dismissToast: (id: string) => void;
  toast: {
    (toastOrMessage: Omit<ToastMessage, 'id'> | string, type?: ToastType): string;
    success: (message: string, title?: string) => string;
    error: (message: string, title?: string) => string;
    warning: (message: string, title?: string) => string;
    info: (message: string, title?: string) => string;
  };

  // Persistent in-app notifications
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 1. Toast Engine
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration = 4500 }: Omit<ToastMessage, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newToast: ToastMessage = { id, type, title, message, duration };

      setToasts((prev) => [...prev.slice(-4), newToast]); // keep max 5 on screen

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
      return id;
    },
    [dismissToast],
  );

  const toast = Object.assign(
    (toastOrMessage: Omit<ToastMessage, 'id'> | string, type?: ToastType) => {
      if (typeof toastOrMessage === 'string') {
        return showToast({ message: toastOrMessage, type: type || 'info' });
      }
      return showToast(toastOrMessage);
    },
    {
      success: (message: string, title?: string) => showToast({ type: 'success', message, title }),
      error: (message: string, title?: string) => showToast({ type: 'error', message, title }),
      warning: (message: string, title?: string) => showToast({ type: 'warning', message, title }),
      info: (message: string, title?: string) => showToast({ type: 'info', message, title }),
    },
  );

  // 2. Persistent In-App Notifications Engine
  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      return;
    }
    try {
      setIsLoading(true);
      const items = await getNotificationsApi();
      setNotifications(items);
    } catch {
      // ignore network errors silently
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true, isRead: true } : n)),
    );
    try {
      await markNotificationReadApi(id);
    } catch {
      // rollback on error
      refreshNotifications();
    }
  }, [refreshNotifications]);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true, isRead: true })),
    );
    try {
      await markAllNotificationsReadApi();
    } catch {
      refreshNotifications();
    }
  }, [refreshNotifications]);

  const deleteNotification = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await deleteNotificationApi(id);
    } catch {
      refreshNotifications();
    }
  }, [refreshNotifications]);

  const clearAllNotifications = useCallback(async () => {
    setNotifications([]);
    try {
      await clearAllNotificationsApi();
    } catch {
      refreshNotifications();
    }
  }, [refreshNotifications]);

  const unreadCount = notifications.filter((n) => !n.read && !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        toasts,
        showToast,
        dismissToast,
        toast,
        notifications,
        unreadCount,
        isLoading,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

/** Global Floating Toast Renderer */
function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((item) => (
        <ToastItem key={item.id} toast={item} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          border: 'border-emerald-500/40 dark:border-emerald-500/50',
          bg: 'bg-white dark:bg-slate-900',
          iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400',
          Icon: CheckCircle2,
          defaultTitle: 'Success',
        };
      case 'error':
        return {
          border: 'border-rose-500/40 dark:border-rose-500/50',
          bg: 'bg-white dark:bg-slate-900',
          iconBg: 'bg-rose-100 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400',
          Icon: AlertCircle,
          defaultTitle: 'Error',
        };
      case 'warning':
        return {
          border: 'border-amber-500/40 dark:border-amber-500/50',
          bg: 'bg-white dark:bg-slate-900',
          iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400',
          Icon: AlertTriangle,
          defaultTitle: 'Notice',
        };
      case 'info':
      default:
        return {
          border: 'border-brand-500/40 dark:border-brand-500/50',
          bg: 'bg-white dark:bg-slate-900',
          iconBg: 'bg-brand-100 text-brand-600 dark:bg-brand-950/80 dark:text-brand-400',
          Icon: Info,
          defaultTitle: 'Information',
        };
    }
  };

  const { border, bg, iconBg, Icon, defaultTitle } = getStyles();

  return (
    <div
      role="alert"
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border ${border} ${bg} shadow-2xl shadow-slate-900/10 dark:shadow-black/40 backdrop-blur-md animate-in slide-in-from-top-3 fade-in duration-200 transition-all`}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 pt-0.5 min-w-0">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
          {toast.title || defaultTitle}
        </h4>
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed break-words">
          {toast.message}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="p-1 -mr-1 -mt-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
