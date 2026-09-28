'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, UserRole } from '@/lib/types';
import {
  changePasswordApi,
  clearAuthToken,
  forgotPasswordApi,
  getAuthToken,
  getMeApi,
  loginApi,
  googleAuthApi,
  instantGoogleAuthApi,
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
    credentialOrPayload: string | { credential?: string; code?: string; redirectUri?: string }
  ) => Promise<void>;
  loginWithInstantGoogle: (email?: string, name?: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ message: string; devToken?: string; resetUrl?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    try {
      const profile = await getMeApi();
      if (profile && profile.id) {
        setUser(profile);
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
      const res = await loginApi(email, password);
      setUser(res.user);
      setTokenState(res.token);
      setAuthToken(res.token);
      setStoredUserId(res.user?.id || null);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (
    credentialOrPayload: string | { credential?: string; code?: string; redirectUri?: string }
  ) => {
    setIsLoading(true);
    try {
      const res = await googleAuthApi(credentialOrPayload);
      setUser(res.user);
      setTokenState(res.token);
      setAuthToken(res.token);
      setStoredUserId(res.user?.id || null);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithInstantGoogle = async (email?: string, name?: string) => {
    setIsLoading(true);
    try {
      const res = await instantGoogleAuthApi(email, name);
      setUser(res.user);
      setTokenState(res.token);
      setAuthToken(res.token);
      setStoredUserId(res.user?.id || null);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await registerApi(name, email, password);
      setUser(res.user);
      setTokenState(res.token);
      setAuthToken(res.token);
      setStoredUserId(res.user?.id || null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
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
        loginWithInstantGoogle,
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
