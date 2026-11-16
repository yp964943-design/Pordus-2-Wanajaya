'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { syncLocalChangesToCloud } from '@/lib/tournamentSync';

const ADMIN_AUTH_STORAGE_KEY = 'pordus2_admin_session_v1';
const ADMIN_AUTH_EVENT = 'pordus-admin-auth-updated';
const ADMIN_GOOGLE_EMAIL = 'dusun2.wanajaya@gmail.com';

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
  const localAdmin = useSyncExternalStore(
    subscribeAdminAuth,
    getAdminAuthSnapshot,
    getAdminAuthServerSnapshot
  );

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (
        user?.emailVerified &&
        user.email?.toLowerCase() === ADMIN_GOOGLE_EMAIL
      ) {
        setAdminAuthenticated(true);
        void syncLocalChangesToCloud();
      }
    });
    return () => unsubscribe();
  }, []);

  const isCloudSynced = Boolean(
    firebaseUser?.emailVerified &&
      firebaseUser.email?.toLowerCase() === ADMIN_GOOGLE_EMAIL
  );

  const isAdmin = localAdmin || isCloudSynced;

  const login = (username: string, password: string): boolean => {
    if (verifyAdminCredentials(username, password)) {
      setAdminAuthenticated(true);
      return true;
    }
    return false;
  };

  const loginWithGoogle = async (): Promise<{ ok: boolean; error?: string }> => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const email = cred.user.email?.toLowerCase() || '';
      if (!cred.user.emailVerified || email !== ADMIN_GOOGLE_EMAIL) {
        await signOut(auth);
        return {
          ok: false,
          error: `Gunakan akun Google Panitia (${ADMIN_GOOGLE_EMAIL}) untuk sinkronisasi ke semua device.`,
        };
      }
      setAdminAuthenticated(true);
      await syncLocalChangesToCloud();
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error:
          err instanceof Error && err.message.includes('popup-closed-by-user')
            ? 'Jendela login Google ditutup sebelum selesai.'
            : 'Gagal masuk dengan Google. Pastikan pop-up diizinkan.',
      };
    }
  };

  const logout = () => {
    setAdminAuthenticated(false);
    void signOut(auth).catch(() => {});
  };

  return {
    isAdmin,
    isCloudSynced,
    cloudEmail: firebaseUser?.email ?? null,
    login,
    loginWithGoogle,
    logout,
  };
}
