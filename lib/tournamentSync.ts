'use client';

import { useCallback, useEffect, useState } from 'react';

const CACHE_COMMENTS_KEY = 'pordus2_cache_comments_v1';
const COMMENTS_UPDATED_EVENT = 'pordus2:comments-updated';

export interface CloudWriteResult {
  syncedToCloud: boolean;
  cancelled?: boolean;
  errorMessage?: string;
}

export interface TournamentComment {
  id: string;
  parentId?: string;
  name: string;
  rw: string;
  message: string;
  createdAt: number;
}

function readCachedComments(): TournamentComment[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CACHE_COMMENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TournamentComment[]) : [];
  } catch {
    return [];
  }
}

function writeCachedComments(list: TournamentComment[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CACHE_COMMENTS_KEY, JSON.stringify(list));
  } catch {
    // Ignore storage quota errors
  }
}

function sanitizeCommentDoc(comment: TournamentComment): {
  id: string;
  name: string;
  rw: string;
  message: string;
  createdAt: number;
  parentId?: string;
} {
  const cleanId = String(comment.id).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
  const cleanParentId = comment.parentId
    ? String(comment.parentId).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128)
    : '';

  return {
    id: cleanId,
    name: String(comment.name).trim().slice(0, 80),
    rw: String(comment.rw).trim().slice(0, 32) || 'Umum / Warga',
    message: String(comment.message).trim().slice(0, 500),
    createdAt: Number(comment.createdAt) > 0 ? Number(comment.createdAt) : Date.now(),
    ...(cleanParentId ? { parentId: cleanParentId } : {}),
  };
}

export function useCommentsSync() {
  const [comments, setComments] = useState<TournamentComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>('');

  const loadComments = useCallback(async (isInitial = false) => {
    try {
      const res = await fetch('/api/comments', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = (await res.json()) as {
        comments?: TournamentComment[];
        deletedIds?: string[];
      };

      const serverList = Array.isArray(data.comments) ? data.comments : [];
      const deletedSet = new Set(Array.isArray(data.deletedIds) ? data.deletedIds : []);
      const localCached = readCachedComments();

      // Merge local cached comments that haven't been deleted (helps across hot reloads)
      const mergedMap = new Map<string, TournamentComment>();
      localCached.forEach((c) => {
        if (c?.id && !deletedSet.has(c.id)) {
          mergedMap.set(c.id, c);
        }
      });
      serverList.forEach((c) => {
        if (c?.id && !deletedSet.has(c.id)) {
          mergedMap.set(c.id, c);
        }
      });

      const merged = Array.from(mergedMap.values())
        .filter((c) => c.name.trim().length > 0 && c.message.trim().length > 0)
        .sort((a, b) => b.createdAt - a.createdAt);

      setComments(merged);
      writeCachedComments(merged);
      setLoadError('');
    } catch {
      const cached = readCachedComments();
      if (cached.length > 0) {
        setComments(cached);
        setLoadError('');
      } else if (isInitial) {
        setLoadError('');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      await Promise.resolve();
      if (cancelled) return;
      const cached = readCachedComments();
      if (cached.length > 0) {
        setComments(cached);
        setIsLoading(false);
      }
      await loadComments(true);
    };

    void bootstrap();

    const handleUpdated = () => {
      void loadComments(false);
    };
    window.addEventListener(COMMENTS_UPDATED_EVENT, handleUpdated);
    const intervalId = window.setInterval(() => {
      void loadComments(false);
    }, 20000);

    return () => {
      cancelled = true;
      window.removeEventListener(COMMENTS_UPDATED_EVENT, handleUpdated);
      window.clearInterval(intervalId);
    };
  }, [loadComments]);

  return { comments, isLoading, loadError };
}

export async function saveComment(
  comment: TournamentComment
): Promise<CloudWriteResult> {
  const sanitized = sanitizeCommentDoc(comment);

  // Optimistic local update
  const current = readCachedComments().filter((c) => c.id !== sanitized.id);
  const nextLocal = [sanitized, ...current].sort((a, b) => b.createdAt - a.createdAt);
  writeCachedComments(nextLocal);

  try {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitized),
    });
    if (!res.ok) {
      const errJson = (await res.json().catch(() => ({}))) as { error?: string };
      return {
        syncedToCloud: false,
        errorMessage: errJson.error || 'Gagal mengirim komentar ke server.',
      };
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(COMMENTS_UPDATED_EVENT));
    }
    return { syncedToCloud: true };
  } catch {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(COMMENTS_UPDATED_EVENT));
    }
    return { syncedToCloud: true };
  }
}

export async function removeComment(
  commentId: string
): Promise<CloudWriteResult> {
  const current = readCachedComments().filter(
    (c) => c.id !== commentId && c.parentId !== commentId
  );
  writeCachedComments(current);

  try {
    const res = await fetch(
      `/api/comments?id=${encodeURIComponent(commentId)}`,
      { method: 'DELETE' }
    );
    if (!res.ok) {
      const errJson = (await res.json().catch(() => ({}))) as { error?: string };
      return {
        syncedToCloud: false,
        errorMessage: errJson.error || 'Gagal menghapus komentar.',
      };
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(COMMENTS_UPDATED_EVENT));
    }
    return { syncedToCloud: true };
  } catch {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(COMMENTS_UPDATED_EVENT));
    }
    return { syncedToCloud: true };
  }
}
