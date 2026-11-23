'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { User } from 'firebase/auth';
import { GalleryItem, MatchItem } from '@/data/pordusData';
import type { MatchResultPayload } from '@/components/MatchResultForm';
import type { CloudWriteResult } from '@/lib/tournamentSync';
import {
  clearDriveAccessToken,
  getDriveAccessToken,
  googleSignInDrive,
  initGoogleDriveAuth,
  signOutGoogleDrive,
} from '@/lib/googleDriveAuth';
import {
  createEmptyDataset,
  deleteFileFromDrive,
  DRIVE_DATA_FILE_NAME,
  DRIVE_FOLDER_NAME,
  DriveAdminDataset,
  DriveGalleryItem,
  ensureDriveWorkspace,
  fetchLegacyFirestoreSnapshot,
  fetchPublicDriveDataset,
  normalizeDataset,
  publishDrivePointerToServer,
  readDriveDatasetAuthenticated,
  uploadGalleryImageFileToDrive,
  writeDriveDatasetAuthenticated,
} from '@/lib/googleDriveStorage';
import DriveConfirmationModal, {
  DriveConfirmRequest,
} from '@/components/DriveConfirmationModal';

const CACHE_DRIVE_DATASET_KEY = 'pordus2_drive_dataset_cache_v1';
const CACHE_DRIVE_POINTER_KEY = 'pordus2_drive_pointer_v1';

// Legacy localStorage keys so prior locally cached/pending admin edits can be migrated cleanly
const LEGACY_PENDING_MATCHES_KEY = 'pordus2_pending_matches_v1';
const LEGACY_PENDING_RESULTS_KEY = 'pordus2_pending_results_v1';
const LEGACY_PENDING_GALLERY_KEY = 'pordus2_pending_gallery_v1';
const LEGACY_CACHE_MATCHES_KEY = 'pordus2_cache_matches_v1';
const LEGACY_CACHE_RESULTS_KEY = 'pordus2_cache_results_v1';

interface LocalDrivePointer {
  fileId: string;
  folderId: string;
  folderUrl: string;
  fileUrl: string;
}

function readLocalJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLocalJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

interface PendingConfirmState {
  request: DriveConfirmRequest;
  executor: (
    accessToken: string,
    workspace: { fileId: string; folderId: string }
  ) => Promise<DriveAdminDataset>;
  resolve: (result: CloudWriteResult) => void;
}

interface DriveSyncContextValue {
  customMatches: MatchItem[];
  defaultMatchOverrides: Record<string, MatchItem>;
  resultOverrides: Record<string, MatchResultPayload>;
  galleryCustomItems: DriveGalleryItem[];
  galleryDefaultOverrides: Record<string, DriveGalleryItem>;
  isDriveConnected: boolean;
  driveUserEmail: string | null;
  driveUserName: string | null;
  driveFolderId: string | null;
  driveFolderUrl: string | null;
  driveDataFileId: string | null;
  driveDataFileUrl: string | null;
  lastSyncedAt: string | null;
  isConnectingDrive: boolean;
  isRefreshingDrive: boolean;
  driveStatusError: string;
  connectGoogleDrive: () => Promise<boolean>;
  disconnectGoogleDrive: () => Promise<void>;
  refreshFromDrive: () => Promise<void>;
  saveCustomMatchWithConfirm: (match: MatchItem) => Promise<CloudWriteResult>;
  updateMatchScheduleWithConfirm: (match: MatchItem) => Promise<CloudWriteResult>;
  removeCustomMatchWithConfirm: (match: MatchItem) => Promise<CloudWriteResult>;
  saveMatchResultWithConfirm: (
    match: MatchItem,
    result: MatchResultPayload
  ) => Promise<CloudWriteResult>;
  removeMatchResultWithConfirm: (match: MatchItem) => Promise<CloudWriteResult>;
  saveGalleryItemsWithConfirm: (items: GalleryItem[]) => Promise<CloudWriteResult>;
  updateGalleryItemWithConfirm: (
    item: GalleryItem,
    patch: {
      title: string;
      category: GalleryItem['category'];
      caption: string;
      date: string;
    }
  ) => Promise<CloudWriteResult>;
  removeGalleryItemWithConfirm: (item: DriveGalleryItem) => Promise<CloudWriteResult>;
  migrateLegacyDataWithConfirm: () => Promise<CloudWriteResult>;
}

const DriveSyncContext = createContext<DriveSyncContextValue | null>(null);

export function useDriveSync(): DriveSyncContextValue {
  const ctx = useContext(DriveSyncContext);
  if (!ctx) {
    throw new Error('useDriveSync harus digunakan di dalam DriveSyncProvider.');
  }
  return ctx;
}

export default function DriveSyncProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dataset, setDataset] = useState<DriveAdminDataset>(() => createEmptyDataset());
  const [driveUser, setDriveUser] = useState<User | null>(null);
  const driveUserEmail = driveUser?.email || null;
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [driveFolderId, setDriveFolderId] = useState<string | null>(null);
  const [driveDataFileId, setDriveDataFileId] = useState<string | null>(null);
  const [isConnectingDrive, setIsConnectingDrive] = useState(false);
  const [isRefreshingDrive, setIsRefreshingDrive] = useState(false);
  const [driveStatusError, setDriveStatusError] = useState('');

  // Confirmation modal state
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirmState | null>(null);
  const [isExecutingConfirm, setIsExecutingConfirm] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  const pointerRef = useRef<{ fileId: string | null; folderId: string | null }>({
    fileId: null,
    folderId: null,
  });

  const persistDatasetLocally = useCallback(
    (next: DriveAdminDataset, fileId?: string | null, folderId?: string | null) => {
      setDataset(next);
      writeLocalJson(CACHE_DRIVE_DATASET_KEY, next);
      if (fileId && folderId) {
        pointerRef.current = { fileId, folderId };
        setDriveDataFileId(fileId);
        setDriveFolderId(folderId);
        const pointerObj: LocalDrivePointer = {
          fileId,
          folderId,
          folderUrl: `https://drive.google.com/drive/folders/${folderId}`,
          fileUrl: `https://drive.google.com/file/d/${fileId}/view`,
        };
        writeLocalJson(CACHE_DRIVE_POINTER_KEY, pointerObj);
      }
    },
    []
  );

  // 1. Load cached dataset + public Google Drive data on mount
  useEffect(() => {
    let cancelled = false;
    const loadInitialPublicDrive = async () => {
      await Promise.resolve();
      if (cancelled) return;

      const cached = readLocalJson<DriveAdminDataset | null>(
        CACHE_DRIVE_DATASET_KEY,
        null
      );
      if (cached) {
        setDataset(normalizeDataset(cached));
      }

      const localPointer = readLocalJson<LocalDrivePointer | null>(
        CACHE_DRIVE_POINTER_KEY,
        null
      );
      if (localPointer?.fileId && localPointer?.folderId) {
        pointerRef.current = {
          fileId: localPointer.fileId,
          folderId: localPointer.folderId,
        };
        setDriveDataFileId(localPointer.fileId);
        setDriveFolderId(localPointer.folderId);
      }

      try {
        const publicRes = await fetchPublicDriveDataset();
        if (cancelled) return;
        if (publicRes.dataset && publicRes.fileId && publicRes.folderId) {
          persistDatasetLocally(publicRes.dataset, publicRes.fileId, publicRes.folderId);
          return;
        }
        // Fallback: if server lost tmp pointer, try locally cached Drive fileId
        if (localPointer?.fileId && localPointer?.folderId) {
          const directRes = await fetch(
            `/api/drive-public/${encodeURIComponent(localPointer.fileId)}?type=json`,
            { cache: 'no-store' }
          );
          if (directRes.ok && !cancelled) {
            const raw = await directRes.json();
            persistDatasetLocally(
              normalizeDataset(raw),
              localPointer.fileId,
              localPointer.folderId
            );
          }
        }
      } catch {
        // Keep cached dataset gracefully
      }
    };

    void loadInitialPublicDrive();
    return () => {
      cancelled = true;
    };
  }, [persistDatasetLocally]);

  // 2. Listen to Firebase Auth state & clear in-memory token on sign-out
  useEffect(() => {
    const unsubscribe = initGoogleDriveAuth(
      (user) => {
        setDriveUser(user);
        setIsDriveConnected(Boolean(getDriveAccessToken()));
      },
      (user) => {
        setDriveUser(user);
        setIsDriveConnected(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const connectGoogleDrive = useCallback(async (): Promise<boolean> => {
    setDriveStatusError('');
    setConfirmError('');
    setIsConnectingDrive(true);
    try {
      const { user, accessToken } = await googleSignInDrive();
      setDriveUser(user);
      setIsDriveConnected(true);

      const workspace = await ensureDriveWorkspace(accessToken, user.email);
      persistDatasetLocally(workspace.dataset, workspace.fileId, workspace.folderId);

      await publishDrivePointerToServer(accessToken, {
        fileId: workspace.fileId,
        folderId: workspace.folderId,
        folderName: DRIVE_FOLDER_NAME,
        updatedAt: workspace.dataset.updatedAt || new Date().toISOString(),
        updatedByEmail: user.email || undefined,
      }).catch(() => {
        // Non-fatal
      });

      return true;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Gagal menghubungkan akun Google Drive.';
      setDriveStatusError(message);
      setConfirmError(message);
      setIsDriveConnected(Boolean(getDriveAccessToken()));
      return false;
    } finally {
      setIsConnectingDrive(false);
    }
  }, [persistDatasetLocally]);

  const disconnectGoogleDrive = useCallback(async (): Promise<void> => {
    clearDriveAccessToken();
    setIsDriveConnected(false);
    setDriveUser(null);
    await signOutGoogleDrive().catch(() => {});
  }, []);

  const refreshFromDrive = useCallback(async (): Promise<void> => {
    setIsRefreshingDrive(true);
    setDriveStatusError('');
    try {
      const token = getDriveAccessToken();
      if (token && pointerRef.current.fileId && pointerRef.current.folderId) {
        const fresh = await readDriveDatasetAuthenticated(token, pointerRef.current.fileId);
        persistDatasetLocally(
          fresh,
          pointerRef.current.fileId,
          pointerRef.current.folderId
        );
        return;
      }

      if (token) {
        const workspace = await ensureDriveWorkspace(token, driveUserEmail);
        persistDatasetLocally(workspace.dataset, workspace.fileId, workspace.folderId);
        return;
      }

      const publicRes = await fetchPublicDriveDataset();
      if (publicRes.dataset && publicRes.fileId && publicRes.folderId) {
        persistDatasetLocally(publicRes.dataset, publicRes.fileId, publicRes.folderId);
      } else if (pointerRef.current.fileId && pointerRef.current.folderId) {
        const res = await fetch(
          `/api/drive-public/${encodeURIComponent(pointerRef.current.fileId)}?type=json`,
          { cache: 'no-store' }
        );
        if (res.ok) {
          const raw = await res.json();
          persistDatasetLocally(
            normalizeDataset(raw),
            pointerRef.current.fileId,
            pointerRef.current.folderId
          );
        }
      }
    } catch (err) {
      setDriveStatusError(
        err instanceof Error ? err.message : 'Gagal menyegarkan data dari Google Drive.'
      );
    } finally {
      setIsRefreshingDrive(false);
    }
  }, [driveUserEmail, persistDatasetLocally]);

  const requestDriveMutation = useCallback(
    (
      request: DriveConfirmRequest,
      executor: (
        accessToken: string,
        workspace: { fileId: string; folderId: string }
      ) => Promise<DriveAdminDataset>
    ): Promise<CloudWriteResult> => {
      return new Promise((resolve) => {
        setConfirmError('');
        setPendingConfirm({ request, executor, resolve });
      });
    },
    []
  );

  const handleConfirmExecute = useCallback(async () => {
    if (!pendingConfirm) return;
    const token = getDriveAccessToken();
    if (!token) {
      setConfirmError(
        'Token Google Drive tidak tersedia. Silakan klik Sign in with Google terlebih dahulu.'
      );
      return;
    }

    setIsExecutingConfirm(true);
    setConfirmError('');
    try {
      let fileId = pointerRef.current.fileId;
      let folderId = pointerRef.current.folderId;
      if (!fileId || !folderId) {
        const workspace = await ensureDriveWorkspace(token, driveUserEmail);
        fileId = workspace.fileId;
        folderId = workspace.folderId;
      }

      const updatedDataset = await pendingConfirm.executor(token, {
        fileId,
        folderId,
      });

      await writeDriveDatasetAuthenticated(token, fileId, updatedDataset);
      persistDatasetLocally(updatedDataset, fileId, folderId);

      await publishDrivePointerToServer(token, {
        fileId,
        folderId,
        folderName: DRIVE_FOLDER_NAME,
        updatedAt: updatedDataset.updatedAt,
        updatedByEmail: driveUserEmail || undefined,
      }).catch(() => {});

      const resolver = pendingConfirm.resolve;
      setPendingConfirm(null);
      resolver({ syncedToCloud: true });
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan perubahan ke Google Drive.';
      setConfirmError(msg);
      if (msg.includes('(401)') || msg.includes('(403)')) {
        clearDriveAccessToken();
        setIsDriveConnected(false);
      }
    } finally {
      setIsExecutingConfirm(false);
    }
  }, [driveUserEmail, pendingConfirm, persistDatasetLocally]);

  const handleConfirmCancel = useCallback(() => {
    if (!pendingConfirm) return;
    const resolver = pendingConfirm.resolve;
    setPendingConfirm(null);
    setConfirmError('');
    resolver({ syncedToCloud: false, cancelled: true });
  }, [pendingConfirm]);

  const saveCustomMatchWithConfirm = useCallback(
    (match: MatchItem) => {
      return requestDriveMutation(
        {
          title: 'Simpan Jadwal Baru ke Google Drive',
          description: `Tambahkan jadwal ${match.sport} (${match.teamA.rw} vs ${match.teamB.rw}) ke file ${DRIVE_DATA_FILE_NAME} di Google Drive?`,
          targetLabel: `${DRIVE_FOLDER_NAME} / ${DRIVE_DATA_FILE_NAME}`,
          details: [
            `Cabang: ${match.sport} (${match.category})`,
            `Pertandingan: ${match.teamA.rw} vs ${match.teamB.rw} · ${match.round}`,
            `Waktu & Lokasi: ${match.date}, ${match.time} di ${match.venue}`,
          ],
          confirmLabel: 'Simpan ke Google Drive',
        },
        async (token, { fileId }) => {
          const latest = await readDriveDatasetAuthenticated(token, fileId);
          const filtered = latest.customMatches.filter((m) => m.id !== match.id);
          return {
            ...latest,
            updatedAt: new Date().toISOString(),
            updatedBy: driveUser?.email || latest.updatedBy,
            customMatches: [...filtered, { ...match, isCustom: true }],
          };
        }
      );
    },
    [driveUser?.email, requestDriveMutation]
  );

  const updateMatchScheduleWithConfirm = useCallback(
    (match: MatchItem) => {
      return requestDriveMutation(
        {
          title: 'Perbarui Jadwal di Google Drive',
          description: `Perbarui jadwal ${match.sport} (${match.teamA.rw} vs ${match.teamB.rw}) pada file ${DRIVE_DATA_FILE_NAME} di Google Drive?`,
          targetLabel: `${DRIVE_FOLDER_NAME} / ${DRIVE_DATA_FILE_NAME}`,
          details: [
            `Cabang: ${match.sport} (${match.category}) · ${match.round}`,
            `Jadwal Baru: ${match.date} · ${match.time}`,
            `Gelanggang & Status: ${match.venue} · ${match.status}`,
          ],
          confirmLabel: 'Perbarui di Google Drive',
        },
        async (token, { fileId }) => {
          const latest = await readDriveDatasetAuthenticated(token, fileId);
          const cleanId = String(match.id).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
          const normalized: MatchItem = { ...match, id: cleanId };

          let nextCustomMatches = latest.customMatches;
          const nextDefaultOverrides = { ...latest.defaultMatchOverrides };

          if (normalized.isCustom) {
            const exists = latest.customMatches.some((m) => m.id === cleanId);
            nextCustomMatches = exists
              ? latest.customMatches.map((m) => (m.id === cleanId ? normalized : m))
              : [...latest.customMatches, normalized];
          } else {
            nextDefaultOverrides[cleanId] = { ...normalized, isCustom: false };
          }

          const nextResultOverrides = { ...latest.resultOverrides };
          if (nextResultOverrides[cleanId]) {
            nextResultOverrides[cleanId] = {
              ...nextResultOverrides[cleanId],
              status: normalized.status,
            };
          }

          return {
            ...latest,
            updatedAt: new Date().toISOString(),
            updatedBy: driveUser?.email || latest.updatedBy,
            customMatches: nextCustomMatches,
            defaultMatchOverrides: nextDefaultOverrides,
            resultOverrides: nextResultOverrides,
          };
        }
      );
    },
    [driveUser?.email, requestDriveMutation]
  );

  const removeCustomMatchWithConfirm = useCallback(
    (match: MatchItem) => {
      return requestDriveMutation(
        {
          title: 'Hapus Jadwal dari Google Drive',
          description: `Hapus jadwal ${match.sport} (${match.teamA.rw} vs ${match.teamB.rw}) dari file ${DRIVE_DATA_FILE_NAME} di Google Drive? Data yang dihapus tidak dapat dikembalikan.`,
          targetLabel: `${DRIVE_FOLDER_NAME} / ${DRIVE_DATA_FILE_NAME}`,
          details: [
            `Pertandingan: ${match.teamA.rw} vs ${match.teamB.rw}`,
            `Tanggal: ${match.date} · ${match.time}`,
          ],
          confirmLabel: 'Hapus dari Drive',
          variant: 'danger',
        },
        async (token, { fileId }) => {
          const latest = await readDriveDatasetAuthenticated(token, fileId);
          const nextResultOverrides = { ...latest.resultOverrides };
          delete nextResultOverrides[match.id];
          return {
            ...latest,
            updatedAt: new Date().toISOString(),
            updatedBy: driveUser?.email || latest.updatedBy,
            customMatches: latest.customMatches.filter((m) => m.id !== match.id),
            resultOverrides: nextResultOverrides,
          };
        }
      );
    },
    [driveUser?.email, requestDriveMutation]
  );

  const saveMatchResultWithConfirm = useCallback(
    (match: MatchItem, result: MatchResultPayload) => {
      return requestDriveMutation(
        {
          title: 'Simpan Hasil Pertandingan ke Google Drive',
          description: `Simpan pembaruan papan skor untuk ${match.sport} (${match.teamA.rw} vs ${match.teamB.rw}) ke file ${DRIVE_DATA_FILE_NAME} di Google Drive?`,
          targetLabel: `${DRIVE_FOLDER_NAME} / ${DRIVE_DATA_FILE_NAME}`,
          details: [
            `Skor Akhir: ${match.teamA.rw} ${result.scoreA} - ${result.scoreB} ${match.teamB.rw}`,
            `Status: ${result.status}${result.winner ? ` · Pemenang: ${result.winner}` : ''}`,
          ],
          confirmLabel: 'Simpan Hasil ke Drive',
        },
        async (token, { fileId }) => {
          const latest = await readDriveDatasetAuthenticated(token, fileId);
          return {
            ...latest,
            updatedAt: new Date().toISOString(),
            updatedBy: driveUser?.email || latest.updatedBy,
            resultOverrides: {
              ...latest.resultOverrides,
              [match.id]: result,
            },
          };
        }
      );
    },
    [driveUser?.email, requestDriveMutation]
  );

  const removeMatchResultWithConfirm = useCallback(
    (match: MatchItem) => {
      return requestDriveMutation(
        {
          title: 'Reset Skor Pertandingan di Google Drive',
          description: `Hapus override hasil untuk ${match.sport} (${match.teamA.rw} vs ${match.teamB.rw}) di Google Drive dan kembalikan skor ke kondisi awal?`,
          targetLabel: `${DRIVE_FOLDER_NAME} / ${DRIVE_DATA_FILE_NAME}`,
          details: [`Pertandingan: ${match.teamA.rw} vs ${match.teamB.rw} (${match.date})`],
          confirmLabel: 'Reset Skor di Drive',
          variant: 'danger',
        },
        async (token, { fileId }) => {
          const latest = await readDriveDatasetAuthenticated(token, fileId);
          const nextResults = { ...latest.resultOverrides };
          delete nextResults[match.id];
          return {
            ...latest,
            updatedAt: new Date().toISOString(),
            updatedBy: driveUser?.email || latest.updatedBy,
            resultOverrides: nextResults,
          };
        }
      );
    },
    [driveUser?.email, requestDriveMutation]
  );

  const saveGalleryItemsWithConfirm = useCallback(
    (newItems: GalleryItem[]) => {
      return requestDriveMutation(
        {
          title: 'Unggah Foto Galeri ke Google Drive',
          description: `Unggah ${newItems.length} foto baru ke folder Google Drive dan perbarui daftar galeri pada file ${DRIVE_DATA_FILE_NAME}?`,
          targetLabel: `${DRIVE_FOLDER_NAME} / ${DRIVE_DATA_FILE_NAME}`,
          details: newItems.slice(0, 5).map(
            (item, idx) => `${idx + 1}. ${item.title} (${item.category} · ${item.date})`
          ),
          confirmLabel: `Unggah ${newItems.length} Foto ke Drive`,
        },
        async (token, { fileId, folderId }) => {
          const latest = await readDriveDatasetAuthenticated(token, fileId);
          const uploadedItems: DriveGalleryItem[] = await Promise.all(
            newItems.map(async (item) => {
              const uploaded = await uploadGalleryImageFileToDrive(
                token,
                folderId,
                item
              );
              return {
                ...item,
                imageUrl: uploaded.publicUrl,
                ...(uploaded.fileId ? { driveFileId: uploaded.fileId } : {}),
                isCustom: true,
              };
            })
          );

          return {
            ...latest,
            updatedAt: new Date().toISOString(),
            updatedBy: driveUser?.email || latest.updatedBy,
            galleryCustomItems: [...uploadedItems, ...latest.galleryCustomItems],
          };
        }
      );
    },
    [driveUser?.email, requestDriveMutation]
  );

  const updateGalleryItemWithConfirm = useCallback(
    (
      item: GalleryItem,
      patch: {
        title: string;
        category: GalleryItem['category'];
        caption: string;
        date: string;
      }
    ) => {
      return requestDriveMutation(
        {
          title: 'Perbarui Keterangan Foto di Google Drive',
          description: `Perbarui judul, kategori, tanggal, dan keterangan foto "${item.title}" di file ${DRIVE_DATA_FILE_NAME}?`,
          targetLabel: `${DRIVE_FOLDER_NAME} / ${DRIVE_DATA_FILE_NAME}`,
          details: [
            `Judul Baru: ${patch.title}`,
            `Kategori & Tanggal: ${patch.category} · ${patch.date}`,
          ],
          confirmLabel: 'Perbarui di Drive',
        },
        async (token, { fileId }) => {
          const latest = await readDriveDatasetAuthenticated(token, fileId);
          const updatedItem: DriveGalleryItem = {
            ...(item as DriveGalleryItem),
            title: patch.title,
            category: patch.category,
            caption: patch.caption,
            date: patch.date,
          };

          if (item.isCustom) {
            const exists = latest.galleryCustomItems.some((g) => g.id === item.id);
            return {
              ...latest,
              updatedAt: new Date().toISOString(),
              updatedBy: driveUser?.email || latest.updatedBy,
              galleryCustomItems: exists
                ? latest.galleryCustomItems.map((g) =>
                    g.id === item.id ? updatedItem : g
                  )
                : [updatedItem, ...latest.galleryCustomItems],
            };
          }

          return {
            ...latest,
            updatedAt: new Date().toISOString(),
            updatedBy: driveUser?.email || latest.updatedBy,
            galleryDefaultOverrides: {
              ...latest.galleryDefaultOverrides,
              [item.id]: { ...updatedItem, isCustom: false },
            },
          };
        }
      );
    },
    [driveUser?.email, requestDriveMutation]
  );

  const removeGalleryItemWithConfirm = useCallback(
    (item: DriveGalleryItem) => {
      return requestDriveMutation(
        {
          title: 'Hapus Foto dari Google Drive',
          description: `Hapus foto "${item.title}" dari folder Google Drive dan daftar galeri di ${DRIVE_DATA_FILE_NAME}? Tindakan ini tidak dapat dibatalkan.`,
          targetLabel: `${DRIVE_FOLDER_NAME} / ${DRIVE_DATA_FILE_NAME}`,
          details: [
            `Foto: ${item.title}`,
            `Kategori & Tanggal: ${item.category} · ${item.date}`,
            ...(item.driveFileId
              ? ['File gambar terkait di Google Drive juga akan dihapus.']
              : []),
          ],
          confirmLabel: 'Hapus dari Drive',
          variant: 'danger',
        },
        async (token, { fileId }) => {
          if (item.driveFileId) {
            await deleteFileFromDrive(token, item.driveFileId).catch(() => {});
          }
          const latest = await readDriveDatasetAuthenticated(token, fileId);
          return {
            ...latest,
            updatedAt: new Date().toISOString(),
            updatedBy: driveUser?.email || latest.updatedBy,
            galleryCustomItems: latest.galleryCustomItems.filter(
              (g) => g.id !== item.id
            ),
          };
        }
      );
    },
    [driveUser?.email, requestDriveMutation]
  );

  const migrateLegacyDataWithConfirm = useCallback(async (): Promise<CloudWriteResult> => {
    const legacyMatchCache = readLocalJson<{
      custom?: MatchItem[];
      overrides?: Record<string, MatchItem>;
    }>(LEGACY_CACHE_MATCHES_KEY, {});
    const legacyResultCache = readLocalJson<Record<string, MatchResultPayload>>(
      LEGACY_CACHE_RESULTS_KEY,
      {}
    );
    const legacyPendingMatches = readLocalJson<MatchItem[]>(
      LEGACY_PENDING_MATCHES_KEY,
      []
    );
    const legacyPendingResults = readLocalJson<Record<string, MatchResultPayload>>(
      LEGACY_PENDING_RESULTS_KEY,
      {}
    );
    const legacyPendingGallery = readLocalJson<GalleryItem[]>(
      LEGACY_PENDING_GALLERY_KEY,
      []
    );

    let firestoreData: Awaited<ReturnType<typeof fetchLegacyFirestoreSnapshot>> | null =
      null;
    try {
      firestoreData = await fetchLegacyFirestoreSnapshot();
    } catch {
      firestoreData = null;
    }

    const combinedCustomMatches = [
      ...(firestoreData?.customMatches || []),
      ...(legacyMatchCache.custom || []),
      ...legacyPendingMatches,
    ];
    const combinedDefaultOverrides = {
      ...(firestoreData?.defaultMatchOverrides || {}),
      ...(legacyMatchCache.overrides || {}),
    };
    const combinedResults = {
      ...(firestoreData?.resultOverrides || {}),
      ...legacyResultCache,
      ...legacyPendingResults,
    };
    const combinedGalleryCustom = [
      ...(firestoreData?.galleryCustomItems || []),
      ...legacyPendingGallery,
    ];
    const combinedGalleryOverrides = {
      ...(firestoreData?.galleryDefaultOverrides || {}),
    };

    const matchMap = new Map<string, MatchItem>();
    combinedCustomMatches.forEach((m) => matchMap.set(m.id, m));
    const galleryMap = new Map<string, DriveGalleryItem>();
    combinedGalleryCustom.forEach((g) => galleryMap.set(g.id, g));

    const totalMatches = matchMap.size;
    const totalMatchOverrides = Object.keys(combinedDefaultOverrides).length;
    const totalResults = Object.keys(combinedResults).length;
    const totalGallery =
      galleryMap.size + Object.keys(combinedGalleryOverrides).length;

    return requestDriveMutation(
      {
        title: 'Migrasi Data Lama ke Google Drive',
        description: `Impor dan gabungkan data jadwal, skor, dan galeri yang sebelumnya tersimpan di server/browser ke file ${DRIVE_DATA_FILE_NAME} di Google Drive?`,
        targetLabel: `${DRIVE_FOLDER_NAME} / ${DRIVE_DATA_FILE_NAME}`,
        details: [
          `${totalMatches} jadwal tambahan & ${totalMatchOverrides} edit jadwal utama`,
          `${totalResults} skor hasil pertandingan`,
          `${totalGallery} data foto galeri`,
          firestoreData
            ? 'Sumber: Firestore + Cache Browser Lokal'
            : 'Sumber: Cache Browser Lokal (Firestore sedang limit kuota)',
        ],
        confirmLabel: 'Migrasi ke Google Drive',
      },
      async (token, { fileId, folderId }) => {
        const latest = await readDriveDatasetAuthenticated(token, fileId);

        const nextCustomMap = new Map<string, MatchItem>();
        matchMap.forEach((m, id) => nextCustomMap.set(id, m));
        latest.customMatches.forEach((m) => nextCustomMap.set(m.id, m));

        const migratedGallery: DriveGalleryItem[] = [];
        for (const item of galleryMap.values()) {
          const alreadyInDrive = latest.galleryCustomItems.find((g) => g.id === item.id);
          if (alreadyInDrive) continue;
          if (item.imageUrl.startsWith('data:image/')) {
            const uploaded = await uploadGalleryImageFileToDrive(token, folderId, item);
            migratedGallery.push({
              ...item,
              imageUrl: uploaded.publicUrl,
              ...(uploaded.fileId ? { driveFileId: uploaded.fileId } : {}),
              isCustom: true,
            });
          } else {
            migratedGallery.push(item);
          }
        }

        return {
          ...latest,
          updatedAt: new Date().toISOString(),
          updatedBy: driveUser?.email || latest.updatedBy,
          customMatches: Array.from(nextCustomMap.values()),
          defaultMatchOverrides: {
            ...combinedDefaultOverrides,
            ...latest.defaultMatchOverrides,
          },
          resultOverrides: {
            ...combinedResults,
            ...latest.resultOverrides,
          },
          galleryCustomItems: [
            ...latest.galleryCustomItems,
            ...migratedGallery,
          ],
          galleryDefaultOverrides: {
            ...combinedGalleryOverrides,
            ...latest.galleryDefaultOverrides,
          },
        };
      }
    );
  }, [driveUser?.email, requestDriveMutation]);

  const contextValue: DriveSyncContextValue = {
    customMatches: dataset.customMatches,
    defaultMatchOverrides: dataset.defaultMatchOverrides,
    resultOverrides: dataset.resultOverrides,
    galleryCustomItems: dataset.galleryCustomItems,
    galleryDefaultOverrides: dataset.galleryDefaultOverrides,
    isDriveConnected,
    driveUserEmail: driveUser?.email || null,
    driveUserName: driveUser?.displayName || null,
    driveFolderId,
    driveFolderUrl: driveFolderId
      ? `https://drive.google.com/drive/folders/${driveFolderId}`
      : null,
    driveDataFileId,
    driveDataFileUrl: driveDataFileId
      ? `https://drive.google.com/file/d/${driveDataFileId}/view`
      : null,
    lastSyncedAt: dataset.updatedAt || null,
    isConnectingDrive,
    isRefreshingDrive,
    driveStatusError,
    connectGoogleDrive,
    disconnectGoogleDrive,
    refreshFromDrive,
    saveCustomMatchWithConfirm,
    updateMatchScheduleWithConfirm,
    removeCustomMatchWithConfirm,
    saveMatchResultWithConfirm,
    removeMatchResultWithConfirm,
    saveGalleryItemsWithConfirm,
    updateGalleryItemWithConfirm,
    removeGalleryItemWithConfirm,
    migrateLegacyDataWithConfirm,
  };

  return (
    <DriveSyncContext.Provider value={contextValue}>
      {children}
      <DriveConfirmationModal
        isOpen={pendingConfirm !== null}
        request={pendingConfirm?.request ?? null}
        isDriveConnected={isDriveConnected}
        driveUserEmail={driveUser?.email}
        isConnectingDrive={isConnectingDrive}
        isExecuting={isExecutingConfirm}
        errorMessage={confirmError}
        onConnectDrive={connectGoogleDrive}
        onConfirm={handleConfirmExecute}
        onCancel={handleConfirmCancel}
      />
    </DriveSyncContext.Provider>
  );
}
