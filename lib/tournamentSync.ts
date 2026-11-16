'use client';

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import {
  auth,
  buildFirestoreErrorInfo,
  db,
  handleFirestoreError,
  OperationType,
  testFirestoreConnection,
} from '@/lib/firebase';
import { GalleryItem, MatchItem } from '@/data/pordusData';
import type { MatchResultPayload } from '@/components/MatchResultForm';

const PENDING_MATCHES_KEY = 'pordus2_pending_matches_v1';
const PENDING_MATCHES_EVENT = 'pordus-pending-matches-updated';
const PENDING_RESULTS_KEY = 'pordus2_pending_results_v1';
const PENDING_RESULTS_EVENT = 'pordus-pending-results-updated';
const PENDING_GALLERY_KEY = 'pordus2_pending_gallery_v1';
const PENDING_GALLERY_EVENT = 'pordus-pending-gallery-updated';

function readStorageJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorageRaw(key: string, eventName: string, value: unknown): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event(eventName));
    return true;
  } catch {
    return false;
  }
}

function subscribeStorage(eventName: string) {
  return (callback: () => void) => {
    if (typeof window === 'undefined') return () => {};
    const handler = () => callback();
    window.addEventListener('storage', handler);
    window.addEventListener(eventName, handler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener(eventName, handler);
    };
  };
}

function getSnapshotString(key: string, fallback: string) {
  return () => {
    if (typeof window === 'undefined') return fallback;
    try {
      return window.localStorage.getItem(key) || fallback;
    } catch {
      return fallback;
    }
  };
}

function sanitizeTeam(team: MatchItem['teamA']) {
  const clean: Record<string, unknown> = {
    rw: String(team.rw).slice(0, 40),
  };
  if (team.name) clean.name = String(team.name).slice(0, 100);
  if (team.logo) clean.logo = String(team.logo).slice(0, 300);
  if (typeof team.score === 'number' && !Number.isNaN(team.score)) {
    clean.score = Math.max(0, Math.min(999, team.score));
  }
  return clean;
}

function sanitizeCustomMatchDoc(match: MatchItem) {
  const payload: Record<string, unknown> = {
    id: String(match.id).slice(0, 128),
    sport: match.sport,
    category: String(match.category).slice(0, 64),
    round: String(match.round).slice(0, 64),
    teamA: sanitizeTeam(match.teamA),
    teamB: sanitizeTeam(match.teamB),
    date: String(match.date).slice(0, 80),
    time: String(match.time).slice(0, 40),
    venue: String(match.venue).slice(0, 120),
    status: match.status,
    isCustom: true,
    updatedAt: serverTimestamp(),
  };
  if (match.winner) payload.winner = String(match.winner).slice(0, 40);
  if (match.sets) payload.sets = match.sets.slice(0, 10);
  if (match.badmintonDoubles) {
    payload.badmintonDoubles = match.badmintonDoubles.slice(0, 5);
  }
  if (match.tableTennisMatches) {
    payload.tableTennisMatches = match.tableTennisMatches.slice(0, 10);
  }
  if (match.futsalGoalScorers) {
    payload.futsalGoalScorers = match.futsalGoalScorers.slice(0, 50);
  }
  return payload;
}

function sanitizeMatchResultDoc(matchId: string, result: MatchResultPayload) {
  const payload: Record<string, unknown> = {
    matchId: String(matchId).slice(0, 128),
    status: result.status,
    scoreA: Math.max(0, Math.min(999, Number(result.scoreA) || 0)),
    scoreB: Math.max(0, Math.min(999, Number(result.scoreB) || 0)),
    updatedAt: serverTimestamp(),
  };
  if (result.winner) payload.winner = String(result.winner).slice(0, 40);
  if (result.sets) payload.sets = result.sets.slice(0, 10);
  if (result.badmintonDoubles) {
    payload.badmintonDoubles = result.badmintonDoubles.slice(0, 5);
  }
  if (result.tableTennisMatches) {
    payload.tableTennisMatches = result.tableTennisMatches.slice(0, 10);
  }
  if (result.futsalGoalScorers) {
    payload.futsalGoalScorers = result.futsalGoalScorers.slice(0, 50);
  }
  return payload;
}

function sanitizeGalleryDoc(item: GalleryItem, createdAt: number) {
  return {
    id: String(item.id).slice(0, 128),
    title: String(item.title).slice(0, 160),
    category: item.category,
    imageUrl: String(item.imageUrl).slice(0, 900000),
    caption: String(item.caption || '').slice(0, 500),
    date: String(item.date || 'SOR RW 017').slice(0, 80),
    isCustom: true,
    createdAt,
  };
}

export interface CloudWriteResult {
  savedLocally: boolean;
  syncedToCloud: boolean;
  needsGoogleAuth?: boolean;
  errorMessage?: string;
}

export function useTournamentSync() {
  const [cloudMatches, setCloudMatches] = useState<MatchItem[]>([]);
  const [cloudResults, setCloudResults] = useState<Record<string, MatchResultPayload>>({});
  const [cloudReady, setCloudReady] = useState(false);

  const pendingMatchesJson = useSyncExternalStore(
    subscribeStorage(PENDING_MATCHES_EVENT),
    getSnapshotString(PENDING_MATCHES_KEY, '[]'),
    () => '[]'
  );

  const pendingResultsJson = useSyncExternalStore(
    subscribeStorage(PENDING_RESULTS_EVENT),
    getSnapshotString(PENDING_RESULTS_KEY, '{}'),
    () => '{}'
  );

  useEffect(() => {
    testFirestoreConnection();

    const unsubMatches = onSnapshot(
      collection(db, 'custom_matches'),
      (snapshot) => {
        const items: MatchItem[] = snapshot.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          return {
            ...(data as unknown as MatchItem),
            id: d.id,
            isCustom: true,
          };
        });
        setCloudMatches(items);
        setCloudReady(true);
      },
      (error) => {
        const errInfo = buildFirestoreErrorInfo(
          error,
          OperationType.LIST,
          'custom_matches'
        );
        console.error('Firestore Error: ', JSON.stringify(errInfo));
      }
    );

    const unsubResults = onSnapshot(
      collection(db, 'match_results'),
      (snapshot) => {
        const nextMap: Record<string, MatchResultPayload> = {};
        snapshot.docs.forEach((d) => {
          const data = d.data() as Record<string, unknown>;
          nextMap[d.id] = {
            status: data.status as MatchItem['status'],
            scoreA: Number(data.scoreA ?? 0),
            scoreB: Number(data.scoreB ?? 0),
            ...(typeof data.winner === 'string' ? { winner: data.winner } : {}),
            ...(Array.isArray(data.sets)
              ? { sets: data.sets as MatchResultPayload['sets'] }
              : {}),
            ...(Array.isArray(data.badmintonDoubles)
              ? {
                  badmintonDoubles:
                    data.badmintonDoubles as MatchResultPayload['badmintonDoubles'],
                }
              : {}),
            ...(Array.isArray(data.tableTennisMatches)
              ? {
                  tableTennisMatches:
                    data.tableTennisMatches as MatchResultPayload['tableTennisMatches'],
                }
              : {}),
            ...(Array.isArray(data.futsalGoalScorers)
              ? {
                  futsalGoalScorers:
                    data.futsalGoalScorers as MatchResultPayload['futsalGoalScorers'],
                }
              : {}),
          };
        });
        setCloudResults(nextMap);
        setCloudReady(true);
      },
      (error) => {
        const errInfo = buildFirestoreErrorInfo(
          error,
          OperationType.LIST,
          'match_results'
        );
        console.error('Firestore Error: ', JSON.stringify(errInfo));
      }
    );

    return () => {
      unsubMatches();
      unsubResults();
    };
  }, []);

  const customMatches = useMemo<MatchItem[]>(() => {
    let pending: MatchItem[] = [];
    try {
      const parsed = JSON.parse(pendingMatchesJson);
      pending = Array.isArray(parsed) ? parsed : [];
    } catch {
      pending = [];
    }
    const map = new Map<string, MatchItem>();
    cloudMatches.forEach((m) => map.set(m.id, m));
    pending.forEach((m) => map.set(m.id, m));
    return Array.from(map.values());
  }, [cloudMatches, pendingMatchesJson]);

  const resultOverrides = useMemo<Record<string, MatchResultPayload>>(() => {
    let pending: Record<string, MatchResultPayload> = {};
    try {
      const parsed = JSON.parse(pendingResultsJson);
      pending =
        parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      pending = {};
    }
    return { ...cloudResults, ...pending };
  }, [cloudResults, pendingResultsJson]);

  return { customMatches, resultOverrides, cloudReady };
}

export function useGallerySync() {
  const [cloudItems, setCloudItems] = useState<GalleryItem[]>([]);

  const pendingGalleryJson = useSyncExternalStore(
    subscribeStorage(PENDING_GALLERY_EVENT),
    getSnapshotString(PENDING_GALLERY_KEY, '[]'),
    () => '[]'
  );

  useEffect(() => {
    testFirestoreConnection();

    const unsubGallery = onSnapshot(
      collection(db, 'gallery_items'),
      (snapshot) => {
        const items = snapshot.docs
          .map((d) => {
            const data = d.data() as Record<string, unknown>;
            return {
              item: {
                id: d.id,
                title: String(data.title || ''),
                category: data.category as GalleryItem['category'],
                imageUrl: String(data.imageUrl || ''),
                caption: String(data.caption || ''),
                date: String(data.date || 'SOR RW 017'),
                isCustom: true,
              } satisfies GalleryItem,
              createdAt: Number(data.createdAt || 0),
            };
          })
          .sort((a, b) => b.createdAt - a.createdAt)
          .map((entry) => entry.item);

        setCloudItems(items);
      },
      (error) => {
        const errInfo = buildFirestoreErrorInfo(
          error,
          OperationType.LIST,
          'gallery_items'
        );
        console.error('Firestore Error: ', JSON.stringify(errInfo));
      }
    );

    return () => unsubGallery();
  }, []);

  const customItems = useMemo<GalleryItem[]>(() => {
    let pending: GalleryItem[] = [];
    try {
      const parsed = JSON.parse(pendingGalleryJson);
      pending = Array.isArray(parsed) ? parsed : [];
    } catch {
      pending = [];
    }
    const seen = new Set<string>();
    const combined: GalleryItem[] = [];
    [...pending, ...cloudItems].forEach((item) => {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        combined.push(item);
      }
    });
    return combined;
  }, [cloudItems, pendingGalleryJson]);

  return { customItems };
}

export async function saveCustomMatch(match: MatchItem): Promise<CloudWriteResult> {
  if (!auth.currentUser) {
    const current = readStorageJson<MatchItem[]>(PENDING_MATCHES_KEY, []);
    const savedLocally = writeStorageRaw(
      PENDING_MATCHES_KEY,
      PENDING_MATCHES_EVENT,
      [...current.filter((m) => m.id !== match.id), match]
    );
    return { savedLocally, syncedToCloud: false, needsGoogleAuth: true };
  }

  const docPath = `custom_matches/${match.id}`;
  try {
    await setDoc(doc(db, 'custom_matches', match.id), sanitizeCustomMatchDoc(match));
    return { savedLocally: true, syncedToCloud: true };
  } catch (error) {
    const current = readStorageJson<MatchItem[]>(PENDING_MATCHES_KEY, []);
    const savedLocally = writeStorageRaw(
      PENDING_MATCHES_KEY,
      PENDING_MATCHES_EVENT,
      [...current.filter((m) => m.id !== match.id), match]
    );
    try {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    } catch (wrapped) {
      return {
        savedLocally,
        syncedToCloud: false,
        needsGoogleAuth: true,
        errorMessage:
          wrapped instanceof Error ? wrapped.message : 'Gagal sinkronisasi ke cloud.',
      };
    }
  }
}

export async function removeCustomMatch(matchId: string): Promise<CloudWriteResult> {
  const current = readStorageJson<MatchItem[]>(PENDING_MATCHES_KEY, []);
  writeStorageRaw(
    PENDING_MATCHES_KEY,
    PENDING_MATCHES_EVENT,
    current.filter((m) => m.id !== matchId)
  );
  const currentResults = readStorageJson<Record<string, MatchResultPayload>>(
    PENDING_RESULTS_KEY,
    {}
  );
  if (currentResults[matchId]) {
    const nextResults = { ...currentResults };
    delete nextResults[matchId];
    writeStorageRaw(PENDING_RESULTS_KEY, PENDING_RESULTS_EVENT, nextResults);
  }

  if (!auth.currentUser) {
    return { savedLocally: true, syncedToCloud: false, needsGoogleAuth: true };
  }

  try {
    await deleteDoc(doc(db, 'custom_matches', matchId));
    await deleteDoc(doc(db, 'match_results', matchId)).catch(() => {});
    return { savedLocally: true, syncedToCloud: true };
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.DELETE, `custom_matches/${matchId}`);
    } catch {
      return { savedLocally: true, syncedToCloud: false, needsGoogleAuth: true };
    }
  }
}

export async function saveMatchResult(
  matchId: string,
  result: MatchResultPayload
): Promise<CloudWriteResult> {
  if (!auth.currentUser) {
    const current = readStorageJson<Record<string, MatchResultPayload>>(
      PENDING_RESULTS_KEY,
      {}
    );
    const savedLocally = writeStorageRaw(
      PENDING_RESULTS_KEY,
      PENDING_RESULTS_EVENT,
      { ...current, [matchId]: result }
    );
    return { savedLocally, syncedToCloud: false, needsGoogleAuth: true };
  }

  const docPath = `match_results/${matchId}`;
  try {
    await setDoc(
      doc(db, 'match_results', matchId),
      sanitizeMatchResultDoc(matchId, result)
    );
    return { savedLocally: true, syncedToCloud: true };
  } catch (error) {
    const current = readStorageJson<Record<string, MatchResultPayload>>(
      PENDING_RESULTS_KEY,
      {}
    );
    const savedLocally = writeStorageRaw(
      PENDING_RESULTS_KEY,
      PENDING_RESULTS_EVENT,
      { ...current, [matchId]: result }
    );
    try {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    } catch (wrapped) {
      return {
        savedLocally,
        syncedToCloud: false,
        needsGoogleAuth: true,
        errorMessage:
          wrapped instanceof Error ? wrapped.message : 'Gagal sinkronisasi ke cloud.',
      };
    }
  }
}

export async function removeMatchResult(matchId: string): Promise<CloudWriteResult> {
  const current = readStorageJson<Record<string, MatchResultPayload>>(
    PENDING_RESULTS_KEY,
    {}
  );
  if (current[matchId]) {
    const next = { ...current };
    delete next[matchId];
    writeStorageRaw(PENDING_RESULTS_KEY, PENDING_RESULTS_EVENT, next);
  }

  if (!auth.currentUser) {
    return { savedLocally: true, syncedToCloud: false, needsGoogleAuth: true };
  }

  try {
    await deleteDoc(doc(db, 'match_results', matchId));
    return { savedLocally: true, syncedToCloud: true };
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.DELETE, `match_results/${matchId}`);
    } catch {
      return { savedLocally: true, syncedToCloud: false, needsGoogleAuth: true };
    }
  }
}

export async function saveGalleryItems(newItems: GalleryItem[]): Promise<CloudWriteResult> {
  if (!auth.currentUser) {
    const current = readStorageJson<GalleryItem[]>(PENDING_GALLERY_KEY, []);
    const existingIds = new Set(newItems.map((i) => i.id));
    const merged = [...newItems, ...current.filter((c) => !existingIds.has(c.id))];
    const savedLocally = writeStorageRaw(
      PENDING_GALLERY_KEY,
      PENDING_GALLERY_EVENT,
      merged
    );
    return { savedLocally, syncedToCloud: false, needsGoogleAuth: true };
  }

  try {
    const baseTs = Date.now();
    await Promise.all(
      newItems.map((item, idx) =>
        setDoc(
          doc(db, 'gallery_items', item.id),
          sanitizeGalleryDoc(item, baseTs - idx)
        )
      )
    );
    return { savedLocally: true, syncedToCloud: true };
  } catch (error) {
    const current = readStorageJson<GalleryItem[]>(PENDING_GALLERY_KEY, []);
    const existingIds = new Set(newItems.map((i) => i.id));
    const merged = [...newItems, ...current.filter((c) => !existingIds.has(c.id))];
    const savedLocally = writeStorageRaw(
      PENDING_GALLERY_KEY,
      PENDING_GALLERY_EVENT,
      merged
    );
    try {
      handleFirestoreError(error, OperationType.WRITE, 'gallery_items');
    } catch {
      return { savedLocally, syncedToCloud: false, needsGoogleAuth: true };
    }
  }
}

export async function removeGalleryItem(itemId: string): Promise<CloudWriteResult> {
  const current = readStorageJson<GalleryItem[]>(PENDING_GALLERY_KEY, []);
  writeStorageRaw(
    PENDING_GALLERY_KEY,
    PENDING_GALLERY_EVENT,
    current.filter((item) => item.id !== itemId)
  );

  if (!auth.currentUser) {
    return { savedLocally: true, syncedToCloud: false, needsGoogleAuth: true };
  }

  try {
    await deleteDoc(doc(db, 'gallery_items', itemId));
    return { savedLocally: true, syncedToCloud: true };
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.DELETE, `gallery_items/${itemId}`);
    } catch {
      return { savedLocally: true, syncedToCloud: false, needsGoogleAuth: true };
    }
  }
}

export async function syncLocalChangesToCloud(): Promise<void> {
  if (!auth.currentUser) return;
  const localMatches = readStorageJson<MatchItem[]>(PENDING_MATCHES_KEY, []);
  const localResults = readStorageJson<Record<string, MatchResultPayload>>(
    PENDING_RESULTS_KEY,
    {}
  );
  const localGallery = readStorageJson<GalleryItem[]>(PENDING_GALLERY_KEY, []);

  try {
    await Promise.all([
      ...localMatches.map((m) =>
        setDoc(doc(db, 'custom_matches', m.id), sanitizeCustomMatchDoc(m))
      ),
      ...Object.entries(localResults).map(([matchId, res]) =>
        setDoc(doc(db, 'match_results', matchId), sanitizeMatchResultDoc(matchId, res))
      ),
      ...localGallery.map((item, idx) =>
        setDoc(
          doc(db, 'gallery_items', item.id),
          sanitizeGalleryDoc(item, Date.now() - idx)
        )
      ),
    ]);
    writeStorageRaw(PENDING_MATCHES_KEY, PENDING_MATCHES_EVENT, []);
    writeStorageRaw(PENDING_RESULTS_KEY, PENDING_RESULTS_EVENT, {});
    writeStorageRaw(PENDING_GALLERY_KEY, PENDING_GALLERY_EVENT, []);
  } catch (err) {
    console.error('Sync pending changes error:', err);
  }
}
