'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, UserRole } from '@/lib/types';
import { authClient } from '@/lib/auth-client';
import {
  changePasswordApi,
  clearAuthToken,
  forgotPasswordApi,
  getAuthToken,
  getMeApi,
  loginApi,
  googleAuthApi,
  logoutApi,
  registerApi,
  resetPasswordApi,
  setAuthToken,
  setStoredUserId,
} from '@/lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (
    credentialOrPayload?: string | { credential?: string; code?: string; redirectUri?: string }
  ) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ message: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    // Timeout helper: resolves to null if the promise takes too long
    const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T | null> =>
      Promise.race([
        promise,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
      ]);

    try {
      // 1. Check Better Auth active session (5s timeout to avoid hanging on DB issues)
      const sessionRes = await withTimeout(authClient.getSession().catch(() => null), 5000);
      if (sessionRes?.data?.user) {
        const u: any = sessionRes.data.user;
        const role = (u.role && u.role.toUpperCase() === 'ADMIN') ? UserRole.ADMIN : UserRole.USER;
        if (sessionRes.data.session?.token) {
          setTokenState(sessionRes.data.session.token);
          setAuthToken(sessionRes.data.session.token);
        }

        // Fetch genuine backend profile with real UUID and database credits
        const backendProfile = await withTimeout(getMeApi().catch(() => null), 5000);
        const effectiveId = backendProfile?.id || u.id;

        setUser({
          id: effectiveId,
          email: u.email,
          name: backendProfile?.name || u.name,
          role: backendProfile?.role || role,
          credits: (typeof backendProfile?.credits === 'object' ? backendProfile?.credits?.balance : backendProfile?.credits) ?? 50,
          plan: backendProfile?.plan || 'free_trial',
          avatarUrl: backendProfile?.avatarUrl || u.image || undefined,
          isActive: backendProfile?.isActive ?? (u.isActive !== false),
          createdAt: backendProfile?.createdAt || u.createdAt,
          updatedAt: backendProfile?.updatedAt || u.updatedAt,
        });
        setStoredUserId(effectiveId);
        setIsLoading(false);
        return;
      }

      // 2. Fallback to legacy JWT / token session
      const profile = await withTimeout(getMeApi().catch(() => null), 5000);
      if (profile && profile.id) {
        const rawCredits = profile.credits;
        const normalizedCredits = (typeof rawCredits === 'object' ? rawCredits?.balance : rawCredits) ?? 50;
        setUser({ ...profile, credits: normalizedCredits });
        setStoredUserId(profile.id);
        const currentToken = getAuthToken();
        if (currentToken) {
          setTokenState(currentToken);
        }
      } else {
        setUser(null);
        setTokenState(null);
        clearAuthToken();
      }
    } catch {
      setUser(null);
      setTokenState(null);
      clearAuthToken();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Attempt Better Auth email sign-in first
      const res = await authClient.signIn.email({
        email: email.trim(),
        password,
      });

      if (res.error) {
        throw new Error(res.error.message || 'Login failed.');
      }

      if (res.data?.user) {
        const token = (res.data as any)?.session?.token || (res.data as any)?.token;
        if (token) {
          setTokenState(token);
          setAuthToken(token);
        }
        await refreshUser();
      }
    } catch (err: any) {
      // Fallback to legacy backend login if Better Auth account not found
      try {
        const legacyRes = await loginApi(email, password);
        setUser(legacyRes.user);
        setTokenState(legacyRes.token);
        setAuthToken(legacyRes.token);
        setStoredUserId(legacyRes.user?.id || null);
      } catch {
        throw err;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (
    credentialOrPayload?: string | { credential?: string; code?: string; redirectUri?: string }
  ) => {
    setIsLoading(true);
    try {
      if (typeof credentialOrPayload === 'string') {
        // ID token from Google One-Tap / GSI
        const res = await authClient.signIn.social({
          provider: 'google',
          idToken: { token: credentialOrPayload },
        });
        if (res.error) throw new Error(res.error.message || 'Google sign-in failed.');
        await refreshUser();
      } else if (credentialOrPayload && 'credential' in credentialOrPayload && credentialOrPayload.credential) {
        const res = await authClient.signIn.social({
          provider: 'google',
          idToken: { token: credentialOrPayload.credential },
        });
        if (res.error) throw new Error(res.error.message || 'Google sign-in failed.');
        await refreshUser();
      } else if (credentialOrPayload && 'code' in credentialOrPayload && credentialOrPayload.code) {
        // Google authorization code: delegate to backend callback
        const res = await googleAuthApi(credentialOrPayload);
        setUser(res.user);
        setTokenState(res.token);
        setAuthToken(res.token);
        setStoredUserId(res.user?.id || null);
      } else {
        // Standard Better Auth Social redirect
        await authClient.signIn.social({
          provider: 'google',
          callbackURL: '/dashboard',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };


  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authClient.signUp.email({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      if (res.error) {
        throw new Error(res.error.message || 'Registration failed.');
      }

      if (res.data?.user) {
        const u: any = res.data.user;
        setUser({
          id: u.id,
          email: u.email,
          name: u.name,
          role: UserRole.USER,
          credits: 50,
          plan: 'free_trial',
          isActive: true,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        });
        setStoredUserId(u.id);
        const token = (res.data as any)?.session?.token || (res.data as any)?.token;
        if (token) {
          setTokenState(token);
          setAuthToken(token);
        }
      }
    } catch (err: any) {
      // Fallback to legacy registration if needed
      try {
        const legacyRes = await registerApi(name, email, password);
        setUser(legacyRes.user);
        setTokenState(legacyRes.token);
        setAuthToken(legacyRes.token);
        setStoredUserId(legacyRes.user?.id || null);
      } catch {
        throw err;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authClient.signOut().catch(() => {});
      await logoutApi().catch(() => {});
    } finally {
      clearAuthToken();
      setUser(null);
      setTokenState(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };

  const forgotPassword = async (email: string) => {
    return forgotPasswordApi(email);
  };

  const resetPassword = async (tokenParam: string, newPassword: string) => {
    await resetPasswordApi(tokenParam, newPassword);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await changePasswordApi(currentPassword, newPassword);
  };

  const isAuthenticated = Boolean(user);
  const isAdmin = user?.role === UserRole.ADMIN;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isAdmin,
        isLoading,
        login,
        loginWithGoogle,
        register,
        logout,
        refreshUser,
        forgotPassword,
        resetPassword,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
