'use client';

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  buildFirestoreErrorInfo,
  db,
  handleFirestoreError,
  OperationType,
  testFirestoreConnection,
} from '@/lib/firebase';

const CACHE_COMMENTS_KEY = 'pordus2_cache_comments_v1';

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

  useEffect(() => {
    testFirestoreConnection();

    const unsubComments = onSnapshot(
      collection(db, 'comments'),
      (snapshot) => {
        const list: TournamentComment[] = snapshot.docs
          .map((d) => {
            const data = d.data() as Record<string, unknown>;
            const rawParent =
              typeof data.parentId === 'string' ? data.parentId.trim() : '';
            return {
              id: d.id,
              ...(rawParent ? { parentId: rawParent } : {}),
              name: String(data.name || ''),
              rw: String(data.rw || 'Umum / Warga'),
              message: String(data.message || ''),
              createdAt: Number(data.createdAt || 0),
            };
          })
          .filter((c) => c.name.trim().length > 0 && c.message.trim().length > 0)
          .sort((a, b) => b.createdAt - a.createdAt);

        setComments(list);
        setIsLoading(false);
        setLoadError('');
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(CACHE_COMMENTS_KEY, JSON.stringify(list));
          }
        } catch {
          // Ignore storage quota errors
        }
      },
      (error) => {
        const cached = readCachedComments();
        if (cached.length > 0) {
          setComments(cached);
          setLoadError('');
        } else {
          setLoadError('Gagal memuat daftar komentar.');
        }
        setIsLoading(false);
        const errInfo = buildFirestoreErrorInfo(
          error,
          OperationType.LIST,
          'comments'
        );
        console.error('Firestore Error: ', JSON.stringify(errInfo));
      }
    );

    return () => unsubComments();
  }, []);

  return { comments, isLoading, loadError };
}

export async function saveComment(
  comment: TournamentComment
): Promise<CloudWriteResult> {
  const sanitized = sanitizeCommentDoc(comment);
  const docPath = `comments/${sanitized.id}`;
  try {
    await setDoc(doc(db, 'comments', sanitized.id), sanitized);
    return { syncedToCloud: true };
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    } catch (wrapped) {
      return {
        syncedToCloud: false,
        errorMessage:
          wrapped instanceof Error
            ? wrapped.message
            : 'Gagal mengirim komentar ke server.',
      };
    }
  }
}

export async function removeComment(
  commentId: string
): Promise<CloudWriteResult> {
  try {
    await deleteDoc(doc(db, 'comments', commentId));
    return { syncedToCloud: true };
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.DELETE, `comments/${commentId}`);
    } catch (wrapped) {
      return {
        syncedToCloud: false,
        errorMessage:
          wrapped instanceof Error
            ? wrapped.message
            : 'Gagal menghapus komentar.',
      };
    }
  }
}
