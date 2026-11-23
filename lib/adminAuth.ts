'use client';

import { useSyncExternalStore } from 'react';

const ADMIN_AUTH_STORAGE_KEY = 'pordus2_admin_session_v1';
const ADMIN_AUTH_EVENT = 'pordus-admin-auth-updated';

function subscribeAdminAuth(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback();
  window.addEventListener('storage', handler);
  window.addEventListener(ADMIN_AUTH_EVENT, handler);
  return () => {
    window.removeEventListener('storage', handler);
    window.removeEventListener(ADMIN_AUTH_EVENT, handler);
  };
}

function getAdminAuthSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(ADMIN_AUTH_STORAGE_KEY) === 'authenticated';
  } catch {
    return false;
  }
}

function getAdminAuthServerSnapshot(): boolean {
  return false;
}

export function verifyAdminCredentials(username: string, password: string): boolean {
  return username.trim() === 'admin' && password === 'Pordus2';
}

export function setAdminAuthenticated(authenticated: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (authenticated) {
      window.localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, 'authenticated');
    } else {
      window.localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
    }
    window.dispatchEvent(new Event(ADMIN_AUTH_EVENT));
  } catch {
    // Ignore storage errors
  }
}

export function useAdminAuth() {
  const isAdmin = useSyncExternalStore(
    subscribeAdminAuth,
    getAdminAuthSnapshot,
    getAdminAuthServerSnapshot
  );

  const login = (username: string, password: string): boolean => {
    if (verifyAdminCredentials(username, password)) {
      setAdminAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setAdminAuthenticated(false);
  };

  return {
    isAdmin,
    login,
    logout,
  };
}
