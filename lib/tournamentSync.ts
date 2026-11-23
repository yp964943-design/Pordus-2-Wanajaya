'use client';

import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import {
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
const CACHE_MATCHES_KEY = 'pordus2_cache_matches_v1';
const CACHE_RESULTS_KEY = 'pordus2_cache_results_v1';

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

function sanitizeCustomMatchDoc(match: MatchItem, isCustomFlag = true) {
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
    isCustom: isCustomFlag,
    updatedAt: serverTimestamp(),
  };
  if (match.winner) payload.winner = String(match.winner).slice(0, 40);
  if (match.sets) {
    payload.sets = match.sets.slice(0, 10).map((s) => ({
      set: Number(s.set) || 1,
      scoreA: Math.max(0, Number(s.scoreA) || 0),
      scoreB: Math.max(0, Number(s.scoreB) || 0),
    }));
  }
  if (match.badmintonDoubles) {
    payload.badmintonDoubles = match.badmintonDoubles.slice(0, 5).map((d) => ({
      partai: Number(d.partai) || 1,
      label: String(d.label || ''),
      pairA: String(d.pairA || ''),
      pairB: String(d.pairB || ''),
      scoreA: Math.max(0, Number(d.scoreA) || 0),
      scoreB: Math.max(0, Number(d.scoreB) || 0),
    }));
  }
  if (match.tableTennisMatches) {
    payload.tableTennisMatches = match.tableTennisMatches.slice(0, 10).map((p) => ({
      partai: Number(p.partai) || 1,
      label: String(p.label || ''),
      playerA: String(p.playerA || ''),
      playerB: String(p.playerB || ''),
      scoreA: Math.max(0, Number(p.scoreA) || 0),
      scoreB: Math.max(0, Number(p.scoreB) || 0),
    }));
  }
  if (match.futsalGoalScorers) {
    payload.futsalGoalScorers = match.futsalGoalScorers.slice(0, 50).map((g) => ({
      id: String(g.id),
      team: g.team === 'B' ? 'B' : 'A',
      playerName: String(g.playerName || ''),
      goals: Math.max(1, Number(g.goals) || 1),
      minute: String(g.minute || ''),
    }));
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
  if (result.sets) {
    payload.sets = result.sets.slice(0, 10).map((s) => ({
      set: Number(s.set) || 1,
      scoreA: Math.max(0, Number(s.scoreA) || 0),
      scoreB: Math.max(0, Number(s.scoreB) || 0),
    }));
  }
  if (result.badmintonDoubles) {
    payload.badmintonDoubles = result.badmintonDoubles.slice(0, 5).map((d) => ({
      partai: Number(d.partai) || 1,
      label: String(d.label || ''),
      pairA: String(d.pairA || ''),
      pairB: String(d.pairB || ''),
      scoreA: Math.max(0, Number(d.scoreA) || 0),
      scoreB: Math.max(0, Number(d.scoreB) || 0),
    }));
  }
  if (result.tableTennisMatches) {
    payload.tableTennisMatches = result.tableTennisMatches.slice(0, 10).map((p) => ({
      partai: Number(p.partai) || 1,
      label: String(p.label || ''),
      playerA: String(p.playerA || ''),
      playerB: String(p.playerB || ''),
      scoreA: Math.max(0, Number(p.scoreA) || 0),
      scoreB: Math.max(0, Number(p.scoreB) || 0),
    }));
  }
  if (result.futsalGoalScorers) {
    payload.futsalGoalScorers = result.futsalGoalScorers.slice(0, 50).map((g) => ({
      id: String(g.id),
      team: g.team === 'B' ? 'B' : 'A',
      playerName: String(g.playerName || ''),
      goals: Math.max(1, Number(g.goals) || 1),
      minute: String(g.minute || ''),
    }));
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
  syncedToCloud: boolean;
  errorMessage?: string;
}

export function useTournamentSync() {
  const [cloudMatches, setCloudMatches] = useState<MatchItem[]>([]);
  const [defaultMatchOverrides, setDefaultMatchOverrides] = useState<Record<string, MatchItem>>({});
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
    void syncLocalChangesToCloud();

    const unsubMatches = onSnapshot(
      collection(db, 'custom_matches'),
      (snapshot) => {
        const nextCustom: MatchItem[] = [];
        const nextOverrides: Record<string, MatchItem> = {};
        snapshot.docs.forEach((d) => {
          const data = d.data() as Record<string, unknown>;
          const isCustomFlag = data.isCustom !== false;
          const mapped: MatchItem = {
            ...(data as unknown as MatchItem),
            id: d.id,
            isCustom: isCustomFlag,
          };
          if (isCustomFlag) {
            nextCustom.push(mapped);
          } else {
            nextOverrides[d.id] = mapped;
          }
        });
        setCloudMatches(nextCustom);
        setDefaultMatchOverrides(nextOverrides);
        setCloudReady(true);
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(
              CACHE_MATCHES_KEY,
              JSON.stringify({ custom: nextCustom, overrides: nextOverrides })
            );
          }
        } catch {
          // ignore storage quota errors
        }
      },
      (error) => {
        const cached = readStorageJson<{
          custom?: MatchItem[];
          overrides?: Record<string, MatchItem>;
        }>(CACHE_MATCHES_KEY, {});
        if (Array.isArray(cached.custom) && cached.custom.length > 0) {
          setCloudMatches(cached.custom);
        }
        if (cached.overrides && typeof cached.overrides === 'object') {
          setDefaultMatchOverrides(cached.overrides);
        }
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
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(CACHE_RESULTS_KEY, JSON.stringify(nextMap));
          }
        } catch {
          // ignore storage quota errors
        }
      },
      (error) => {
        const cached = readStorageJson<Record<string, MatchResultPayload>>(
          CACHE_RESULTS_KEY,
          {}
        );
        if (cached && typeof cached === 'object' && Object.keys(cached).length > 0) {
          setCloudResults(cached);
        }
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

  return { customMatches, defaultMatchOverrides, resultOverrides, cloudReady };
}

export function useGallerySync() {
  const [cloudItems, setCloudItems] = useState<GalleryItem[]>([]);
  const [defaultOverrides, setDefaultOverrides] = useState<Record<string, GalleryItem>>({});

  const pendingGalleryJson = useSyncExternalStore(
    subscribeStorage(PENDING_GALLERY_EVENT),
    getSnapshotString(PENDING_GALLERY_KEY, '[]'),
    () => '[]'
  );

  useEffect(() => {
    testFirestoreConnection();
    void syncLocalChangesToCloud();

    const unsubGallery = onSnapshot(
      collection(db, 'gallery_items'),
      (snapshot) => {
        const nextCustom: { item: GalleryItem; createdAt: number }[] = [];
        const nextOverrides: Record<string, GalleryItem> = {};

        snapshot.docs.forEach((d) => {
          const data = d.data() as Record<string, unknown>;
          const isCustomFlag = data.isCustom !== false;
          const mappedItem: GalleryItem = {
            id: d.id,
            title: String(data.title || ''),
            category: data.category as GalleryItem['category'],
            imageUrl: String(data.imageUrl || ''),
            caption: String(data.caption || ''),
            date: String(data.date || 'SOR RW 017'),
            isCustom: isCustomFlag,
          };

          if (isCustomFlag) {
            nextCustom.push({
              item: mappedItem,
              createdAt: Number(data.createdAt || 0),
            });
          } else {
            nextOverrides[d.id] = mappedItem;
          }
        });

        setCloudItems(
          nextCustom
            .sort((a, b) => b.createdAt - a.createdAt)
            .map((entry) => entry.item)
        );
        setDefaultOverrides(nextOverrides);
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

  return { customItems, defaultOverrides };
}

export async function saveCustomMatch(match: MatchItem): Promise<CloudWriteResult> {
  const docPath = `custom_matches/${match.id}`;
  try {
    await setDoc(doc(db, 'custom_matches', match.id), sanitizeCustomMatchDoc(match, true));
    const current = readStorageJson<MatchItem[]>(PENDING_MATCHES_KEY, []);
    if (current.some((m) => m.id === match.id)) {
      writeStorageRaw(
        PENDING_MATCHES_KEY,
        PENDING_MATCHES_EVENT,
        current.filter((m) => m.id !== match.id)
      );
    }
    return { syncedToCloud: true };
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    } catch (wrapped) {
      return {
        syncedToCloud: false,
        errorMessage:
          wrapped instanceof Error ? wrapped.message : 'Gagal menyinkronkan jadwal ke cloud.',
      };
    }
  }
}

export async function updateMatchSchedule(match: MatchItem): Promise<CloudWriteResult> {
  const cleanId = String(match.id).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
  if (!cleanId) {
    return {
      syncedToCloud: false,
      errorMessage: 'ID pertandingan tidak valid.',
    };
  }

  const normalizedMatch: MatchItem = {
    ...match,
    id: cleanId,
  };
  const docPath = `custom_matches/${cleanId}`;
  const docRef = doc(db, 'custom_matches', cleanId);

  try {
    const snap = await getDoc(docRef);
    const fullPayload = sanitizeCustomMatchDoc(normalizedMatch, Boolean(normalizedMatch.isCustom));

    if (snap.exists()) {
      const existingData = snap.data() as Record<string, unknown>;
      const updatePayload: Record<string, unknown> = {
        sport: fullPayload.sport,
        category: fullPayload.category,
        round: fullPayload.round,
        teamA: fullPayload.teamA,
        teamB: fullPayload.teamB,
        date: fullPayload.date,
        time: fullPayload.time,
        venue: fullPayload.venue,
        status: fullPayload.status,
        updatedAt: serverTimestamp(),
      };

      const optionalKeys = [
        'winner',
        'sets',
        'badmintonDoubles',
        'tableTennisMatches',
        'futsalGoalScorers',
      ] as const;

      optionalKeys.forEach((key) => {
        if (key in fullPayload) {
          updatePayload[key] = fullPayload[key];
        } else if (key in existingData) {
          updatePayload[key] = deleteField();
        }
      });

      await updateDoc(docRef, updatePayload);
    } else {
      await setDoc(docRef, fullPayload);
    }

    const resultRef = doc(db, 'match_results', cleanId);
    const resultSnap = await getDoc(resultRef);
    if (resultSnap.exists()) {
      const resultData = resultSnap.data() as Record<string, unknown>;
      if (resultData.status !== normalizedMatch.status) {
        await updateDoc(resultRef, {
          status: normalizedMatch.status,
          updatedAt: serverTimestamp(),
        });
      }
    }

    const currentPending = readStorageJson<MatchItem[]>(PENDING_MATCHES_KEY, []);
    if (currentPending.some((m) => m.id === cleanId)) {
      writeStorageRaw(
        PENDING_MATCHES_KEY,
        PENDING_MATCHES_EVENT,
        currentPending.filter((m) => m.id !== cleanId)
      );
    }

    return { syncedToCloud: true };
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.UPDATE, docPath);
    } catch (wrapped) {
      return {
        syncedToCloud: false,
        errorMessage:
          wrapped instanceof Error ? wrapped.message : 'Gagal memperbarui jadwal di cloud.',
      };
    }
  }
}

export async function removeCustomMatch(matchId: string): Promise<CloudWriteResult> {
  const current = readStorageJson<MatchItem[]>(PENDING_MATCHES_KEY, []);
  if (current.some((m) => m.id === matchId)) {
    writeStorageRaw(
      PENDING_MATCHES_KEY,
      PENDING_MATCHES_EVENT,
      current.filter((m) => m.id !== matchId)
    );
  }
  const currentResults = readStorageJson<Record<string, MatchResultPayload>>(
    PENDING_RESULTS_KEY,
    {}
  );
  if (currentResults[matchId]) {
    const nextResults = { ...currentResults };
    delete nextResults[matchId];
    writeStorageRaw(PENDING_RESULTS_KEY, PENDING_RESULTS_EVENT, nextResults);
  }

  try {
    await deleteDoc(doc(db, 'custom_matches', matchId));
    await deleteDoc(doc(db, 'match_results', matchId)).catch(() => {});
    return { syncedToCloud: true };
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.DELETE, `custom_matches/${matchId}`);
    } catch (wrapped) {
      return {
        syncedToCloud: false,
        errorMessage:
          wrapped instanceof Error ? wrapped.message : 'Gagal menghapus jadwal dari cloud.',
      };
    }
  }
}

export async function saveMatchResult(
  matchId: string,
  result: MatchResultPayload
): Promise<CloudWriteResult> {
  const docPath = `match_results/${matchId}`;
  try {
    await setDoc(
      doc(db, 'match_results', matchId),
      sanitizeMatchResultDoc(matchId, result)
    );
    const current = readStorageJson<Record<string, MatchResultPayload>>(
      PENDING_RESULTS_KEY,
      {}
    );
    if (current[matchId]) {
      const next = { ...current };
      delete next[matchId];
      writeStorageRaw(PENDING_RESULTS_KEY, PENDING_RESULTS_EVENT, next);
    }
    return { syncedToCloud: true };
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    } catch (wrapped) {
      return {
        syncedToCloud: false,
        errorMessage:
          wrapped instanceof Error ? wrapped.message : 'Gagal menyinkronkan hasil ke cloud.',
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

  try {
    await deleteDoc(doc(db, 'match_results', matchId));
    return { syncedToCloud: true };
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.DELETE, `match_results/${matchId}`);
    } catch (wrapped) {
      return {
        syncedToCloud: false,
        errorMessage:
          wrapped instanceof Error ? wrapped.message : 'Gagal mereset hasil di cloud.',
      };
    }
  }
}

export async function saveGalleryItems(newItems: GalleryItem[]): Promise<CloudWriteResult> {
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
    const current = readStorageJson<GalleryItem[]>(PENDING_GALLERY_KEY, []);
    if (current.length > 0) {
      const savedIds = new Set(newItems.map((i) => i.id));
      writeStorageRaw(
        PENDING_GALLERY_KEY,
        PENDING_GALLERY_EVENT,
        current.filter((item) => !savedIds.has(item.id))
      );
    }
    return { syncedToCloud: true };
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, 'gallery_items');
    } catch (wrapped) {
      return {
        syncedToCloud: false,
        errorMessage:
          wrapped instanceof Error ? wrapped.message : 'Gagal mengunggah foto ke cloud.',
      };
    }
  }
}

export async function updateGalleryItem(
  item: GalleryItem,
  patch: {
    title: string;
    category: GalleryItem['category'];
    caption: string;
    date: string;
  }
): Promise<CloudWriteResult> {
  const cleanId = String(item.id).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
  const cleanTitle = String(patch.title || '').trim().slice(0, 160);
  const cleanCaption = String(patch.caption || '').trim().slice(0, 500);
  const cleanDate =
    String(patch.date || '').trim().slice(0, 80) ||
    String(item.date || 'SOR RW 017').slice(0, 80);
  const allowedCategories: GalleryItem['category'][] = [
    'Bulutangkis',
    'Bola Voli',
    'Tenis Meja',
    'Futsal Anak',
    'Seremoni',
  ];
  const cleanCategory = allowedCategories.includes(patch.category)
    ? patch.category
    : item.category;

  if (!cleanId || !cleanTitle) {
    return {
      syncedToCloud: false,
      errorMessage: 'Judul foto tidak boleh kosong.',
    };
  }

  const docPath = `gallery_items/${cleanId}`;
  const docRef = doc(db, 'gallery_items', cleanId);

  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      await updateDoc(docRef, {
        title: cleanTitle,
        category: cleanCategory,
        caption: cleanCaption,
        date: cleanDate,
      });
    } else {
      await setDoc(docRef, {
        id: cleanId,
        title: cleanTitle,
        category: cleanCategory,
        imageUrl: String(item.imageUrl || '').slice(0, 900000),
        caption: cleanCaption,
        date: cleanDate,
        isCustom: Boolean(item.isCustom),
        createdAt: item.isCustom ? Date.now() : 0,
      });
    }

    const current = readStorageJson<GalleryItem[]>(PENDING_GALLERY_KEY, []);
    if (current.some((entry) => entry.id === cleanId)) {
      writeStorageRaw(
        PENDING_GALLERY_KEY,
        PENDING_GALLERY_EVENT,
        current.map((entry) =>
          entry.id === cleanId
            ? {
                ...entry,
                title: cleanTitle,
                category: cleanCategory,
                caption: cleanCaption,
                date: cleanDate,
              }
            : entry
        )
      );
    }

    return { syncedToCloud: true };
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.UPDATE, docPath);
    } catch (wrapped) {
      return {
        syncedToCloud: false,
        errorMessage:
          wrapped instanceof Error
            ? wrapped.message
            : 'Gagal memperbarui keterangan foto di cloud.',
      };
    }
  }
}

export async function removeGalleryItem(itemId: string): Promise<CloudWriteResult> {
  const current = readStorageJson<GalleryItem[]>(PENDING_GALLERY_KEY, []);
  if (current.some((item) => item.id === itemId)) {
    writeStorageRaw(
      PENDING_GALLERY_KEY,
      PENDING_GALLERY_EVENT,
      current.filter((item) => item.id !== itemId)
    );
  }

  try {
    await deleteDoc(doc(db, 'gallery_items', itemId));
    return { syncedToCloud: true };
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.DELETE, `gallery_items/${itemId}`);
    } catch (wrapped) {
      return {
        syncedToCloud: false,
        errorMessage:
          wrapped instanceof Error ? wrapped.message : 'Gagal menghapus foto dari cloud.',
      };
    }
  }
}

let pendingSyncInFlight: Promise<void> | null = null;

export async function syncLocalChangesToCloud(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (pendingSyncInFlight) return pendingSyncInFlight;

  const localMatches = readStorageJson<MatchItem[]>(PENDING_MATCHES_KEY, []);
  const localResults = readStorageJson<Record<string, MatchResultPayload>>(
    PENDING_RESULTS_KEY,
    {}
  );
  const localGallery = readStorageJson<GalleryItem[]>(PENDING_GALLERY_KEY, []);

  if (
    localMatches.length === 0 &&
    Object.keys(localResults).length === 0 &&
    localGallery.length === 0
  ) {
    return;
  }

  pendingSyncInFlight = (async () => {
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
    } finally {
      pendingSyncInFlight = null;
    }
  })();

  return pendingSyncInFlight;
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
            const rawParent = typeof data.parentId === 'string' ? data.parentId.trim() : '';
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
      },
      (error) => {
        const errInfo = buildFirestoreErrorInfo(
          error,
          OperationType.LIST,
          'comments'
        );
        console.error('Firestore Error: ', JSON.stringify(errInfo));
        setIsLoading(false);
        setLoadError('Gagal memuat daftar komentar.');
      }
    );

    return () => unsubComments();
  }, []);

  return { comments, isLoading, loadError };
}

export async function saveComment(comment: TournamentComment): Promise<CloudWriteResult> {
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
          wrapped instanceof Error ? wrapped.message : 'Gagal mengirim komentar ke server.',
      };
    }
  }
}

export async function removeComment(commentId: string): Promise<CloudWriteResult> {
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
          wrapped instanceof Error ? wrapped.message : 'Gagal menghapus komentar.',
      };
    }
  }
}

