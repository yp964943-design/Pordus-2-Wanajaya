'use client';

import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { GalleryItem, MatchItem } from '@/data/pordusData';
import type { MatchResultPayload } from '@/components/MatchResultForm';

export const DRIVE_FOLDER_NAME = 'PORDUS 2 Wanajaya - Admin Data';
export const DRIVE_DATA_FILE_NAME = 'pordus2_admin_data.json';

export interface DriveGalleryItem extends GalleryItem {
  driveFileId?: string;
}

export interface DriveAdminDataset {
  version: number;
  updatedAt: string;
  updatedBy?: string;
  customMatches: MatchItem[];
  defaultMatchOverrides: Record<string, MatchItem>;
  resultOverrides: Record<string, MatchResultPayload>;
  galleryCustomItems: DriveGalleryItem[];
  galleryDefaultOverrides: Record<string, DriveGalleryItem>;
}

export interface DriveWorkspaceInfo {
  folderId: string;
  folderUrl: string;
  fileId: string;
  fileUrl: string;
  dataset: DriveAdminDataset;
}

export function createEmptyDataset(): DriveAdminDataset {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    customMatches: [],
    defaultMatchOverrides: {},
    resultOverrides: {},
    galleryCustomItems: [],
    galleryDefaultOverrides: {},
  };
}

export function normalizeDataset(raw: unknown): DriveAdminDataset {
  const base = createEmptyDataset();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return base;
  }
  const obj = raw as Record<string, unknown>;
  return {
    version: typeof obj.version === 'number' ? obj.version : 1,
    updatedAt:
      typeof obj.updatedAt === 'string' && obj.updatedAt
        ? obj.updatedAt
        : new Date().toISOString(),
    ...(typeof obj.updatedBy === 'string' ? { updatedBy: obj.updatedBy } : {}),
    customMatches: Array.isArray(obj.customMatches)
      ? (obj.customMatches as MatchItem[])
      : [],
    defaultMatchOverrides:
      obj.defaultMatchOverrides &&
      typeof obj.defaultMatchOverrides === 'object' &&
      !Array.isArray(obj.defaultMatchOverrides)
        ? (obj.defaultMatchOverrides as Record<string, MatchItem>)
        : {},
    resultOverrides:
      obj.resultOverrides &&
      typeof obj.resultOverrides === 'object' &&
      !Array.isArray(obj.resultOverrides)
        ? (obj.resultOverrides as Record<string, MatchResultPayload>)
        : {},
    galleryCustomItems: Array.isArray(obj.galleryCustomItems)
      ? (obj.galleryCustomItems as DriveGalleryItem[])
      : [],
    galleryDefaultOverrides:
      obj.galleryDefaultOverrides &&
      typeof obj.galleryDefaultOverrides === 'object' &&
      !Array.isArray(obj.galleryDefaultOverrides)
        ? (obj.galleryDefaultOverrides as Record<string, DriveGalleryItem>)
        : {},
  };
}

function escapeDriveQuery(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function driveJsonFetch<T>(
  url: string,
  accessToken: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(
      `Google Drive API error (${res.status}): ${errText.slice(0, 200) || res.statusText}`
    );
  }
  return (await res.json()) as T;
}

export async function ensureAnyoneReadPermission(
  accessToken: string,
  fileId: string
): Promise<void> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/permissions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone',
        }),
      }
    );
    if (!res.ok) {
      // Non-fatal: admin can still read/write in Drive even if domain restricts public sharing
      console.warn('Could not set anyone reader permission on Drive file:', fileId);
    }
  } catch {
    // Non-fatal
  }
}

async function findOrCreateFolder(accessToken: string): Promise<string> {
  const q = `name = '${escapeDriveQuery(DRIVE_FOLDER_NAME)}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)&pageSize=5`;
  const listed = await driveJsonFetch<{ files?: { id: string; name: string }[] }>(
    listUrl,
    accessToken
  );
  const existing = listed.files?.[0];
  if (existing?.id) {
    return existing.id;
  }

  const created = await driveJsonFetch<{ id: string }>(
    'https://www.googleapis.com/drive/v3/files?fields=id',
    accessToken,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: DRIVE_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    }
  );
  await ensureAnyoneReadPermission(accessToken, created.id);
  return created.id;
}

async function uploadMultipartFile(
  accessToken: string,
  metadata: Record<string, unknown>,
  contentBlob: Blob
): Promise<{ id: string }> {
  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  form.append('file', contentBlob);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,parents',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    }
  );
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(
      `Gagal mengunggah file ke Google Drive (${res.status}): ${errText.slice(0, 180)}`
    );
  }
  return (await res.json()) as { id: string };
}

export async function readDriveDatasetAuthenticated(
  accessToken: string,
  fileId: string
): Promise<DriveAdminDataset> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    }
  );
  if (!res.ok) {
    throw new Error(`Gagal membaca data dari Google Drive (${res.status}).`);
  }
  const json = await res.json();
  return normalizeDataset(json);
}

export async function writeDriveDatasetAuthenticated(
  accessToken: string,
  fileId: string,
  dataset: DriveAdminDataset
): Promise<void> {
  const payload = JSON.stringify(dataset, null, 2);
  const res = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=media`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: payload,
    }
  );
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(
      `Gagal menyimpan perubahan ke Google Drive (${res.status}): ${errText.slice(0, 180)}`
    );
  }
}

export async function ensureDriveWorkspace(
  accessToken: string,
  userEmail?: string | null
): Promise<DriveWorkspaceInfo> {
  const folderId = await findOrCreateFolder(accessToken);

  const q = `name = '${escapeDriveQuery(DRIVE_DATA_FILE_NAME)}' and '${escapeDriveQuery(folderId)}' in parents and trashed = false`;
  const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)&pageSize=5`;
  const listed = await driveJsonFetch<{ files?: { id: string; name: string }[] }>(
    listUrl,
    accessToken
  );

  let fileId = listed.files?.[0]?.id;
  let dataset = createEmptyDataset();

  if (fileId) {
    dataset = await readDriveDatasetAuthenticated(accessToken, fileId);
    await ensureAnyoneReadPermission(accessToken, fileId);
  } else {
    const initialDataset: DriveAdminDataset = {
      ...createEmptyDataset(),
      ...(userEmail ? { updatedBy: userEmail } : {}),
    };
    const created = await uploadMultipartFile(
      accessToken,
      {
        name: DRIVE_DATA_FILE_NAME,
        mimeType: 'application/json',
        parents: [folderId],
        description: 'Data inputan admin PORDUS 2 Wanajaya Ke-IV 2026',
      },
      new Blob([JSON.stringify(initialDataset, null, 2)], {
        type: 'application/json',
      })
    );
    fileId = created.id;
    dataset = initialDataset;
    await ensureAnyoneReadPermission(accessToken, fileId);
  }

  return {
    folderId,
    folderUrl: `https://drive.google.com/drive/folders/${folderId}`,
    fileId,
    fileUrl: `https://drive.google.com/file/d/${fileId}/view`,
    dataset,
  };
}

function dataUrlToBlob(dataUrl: string): Blob | null {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;
  const mimeType = match[1];
  const base64 = match[2];
  const byteString = atob(base64);
  const bytes = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i += 1) {
    bytes[i] = byteString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

export async function uploadGalleryImageFileToDrive(
  accessToken: string,
  folderId: string,
  item: GalleryItem
): Promise<{ fileId?: string; publicUrl: string }> {
  const blob = dataUrlToBlob(item.imageUrl);
  if (!blob) {
    return { publicUrl: item.imageUrl };
  }

  const ext =
    blob.type === 'image/webp'
      ? 'webp'
      : blob.type === 'image/png'
        ? 'png'
        : 'jpg';
  const safeSlug = item.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  const fileName = `${item.id}_${safeSlug || 'foto'}.${ext}`;

  const created = await uploadMultipartFile(
    accessToken,
    {
      name: fileName,
      mimeType: blob.type,
      parents: [folderId],
      description: `${item.title} (${item.category} · ${item.date})`,
    },
    blob
  );

  await ensureAnyoneReadPermission(accessToken, created.id);
  return {
    fileId: created.id,
    publicUrl: `/api/drive-public/${created.id}`,
  };
}

export async function deleteFileFromDrive(
  accessToken: string,
  fileId: string
): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  if (!res.ok && res.status !== 404) {
    throw new Error(`Gagal menghapus file dari Google Drive (${res.status}).`);
  }
}

export async function publishDrivePointerToServer(
  accessToken: string,
  pointer: {
    fileId: string;
    folderId: string;
    folderName: string;
    updatedAt: string;
    updatedByEmail?: string;
  }
): Promise<void> {
  await fetch('/api/drive-config', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(pointer),
  });
}

export async function fetchPublicDriveDataset(): Promise<{
  fileId: string | null;
  folderId: string | null;
  dataset: DriveAdminDataset | null;
}> {
  const cfgRes = await fetch('/api/drive-config', { cache: 'no-store' });
  if (!cfgRes.ok) {
    return { fileId: null, folderId: null, dataset: null };
  }
  const cfgJson = (await cfgRes.json()) as {
    pointer?: { fileId?: string; folderId?: string } | null;
  };
  const fileId = cfgJson.pointer?.fileId || null;
  const folderId = cfgJson.pointer?.folderId || null;
  if (!fileId) {
    return { fileId: null, folderId: null, dataset: null };
  }
  const dataRes = await fetch(
    `/api/drive-public/${encodeURIComponent(fileId)}?type=json`,
    { cache: 'no-store' }
  );
  if (!dataRes.ok) {
    return { fileId, folderId, dataset: null };
  }
  const raw = await dataRes.json();
  return {
    fileId,
    folderId,
    dataset: normalizeDataset(raw),
  };
}

export async function fetchLegacyFirestoreSnapshot(): Promise<{
  customMatches: MatchItem[];
  defaultMatchOverrides: Record<string, MatchItem>;
  resultOverrides: Record<string, MatchResultPayload>;
  galleryCustomItems: DriveGalleryItem[];
  galleryDefaultOverrides: Record<string, DriveGalleryItem>;
}> {
  const [matchesSnap, resultsSnap, gallerySnap] = await Promise.all([
    getDocs(collection(db, 'custom_matches')),
    getDocs(collection(db, 'match_results')),
    getDocs(collection(db, 'gallery_items')),
  ]);

  const customMatches: MatchItem[] = [];
  const defaultMatchOverrides: Record<string, MatchItem> = {};
  matchesSnap.docs.forEach((d) => {
    const data = d.data() as Record<string, unknown>;
    const isCustomFlag = data.isCustom !== false;
    const mapped: MatchItem = {
      ...(data as unknown as MatchItem),
      id: d.id,
      isCustom: isCustomFlag,
    };
    if (isCustomFlag) customMatches.push(mapped);
    else defaultMatchOverrides[d.id] = mapped;
  });

  const resultOverrides: Record<string, MatchResultPayload> = {};
  resultsSnap.docs.forEach((d) => {
    const data = d.data() as Record<string, unknown>;
    resultOverrides[d.id] = {
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

  const galleryCustomWithTs: { item: DriveGalleryItem; createdAt: number }[] = [];
  const galleryDefaultOverrides: Record<string, DriveGalleryItem> = {};
  gallerySnap.docs.forEach((d) => {
    const data = d.data() as Record<string, unknown>;
    const isCustomFlag = data.isCustom !== false;
    const mapped: DriveGalleryItem = {
      id: d.id,
      title: String(data.title || ''),
      category: data.category as GalleryItem['category'],
      imageUrl: String(data.imageUrl || ''),
      caption: String(data.caption || ''),
      date: String(data.date || '15/11/2026'),
      isCustom: isCustomFlag,
    };
    if (isCustomFlag) {
      galleryCustomWithTs.push({
        item: mapped,
        createdAt: Number(data.createdAt || 0),
      });
    } else {
      galleryDefaultOverrides[d.id] = mapped;
    }
  });

  return {
    customMatches,
    defaultMatchOverrides,
    resultOverrides,
    galleryCustomItems: galleryCustomWithTs
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((x) => x.item),
    galleryDefaultOverrides,
  };
}
