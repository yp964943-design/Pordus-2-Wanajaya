import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

export interface StoredComment {
  id: string;
  parentId?: string;
  name: string;
  rw: string;
  message: string;
  createdAt: number;
}

interface CommentsStoreData {
  comments: StoredComment[];
  deletedIds: string[];
}

const COMMENTS_FILE_PATH = path.join(os.tmpdir(), 'pordus2-comments.json');
const POINTER_FILE_PATH = path.join(os.tmpdir(), 'pordus2-drive-sync.json');

let memoryStore: CommentsStoreData | null = null;
let driveSeedChecked = false;

function sanitizeComment(raw: unknown): StoredComment | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const cleanId = String(obj.id || '')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 128);
  const name = String(obj.name || '').trim().slice(0, 80);
  const message = String(obj.message || '').trim().slice(0, 500);
  if (!cleanId || name.length < 2 || message.length < 1) return null;

  const cleanParentId =
    typeof obj.parentId === 'string'
      ? obj.parentId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128)
      : '';
  const rw = String(obj.rw || 'Umum / Warga').trim().slice(0, 32) || 'Umum / Warga';
  const createdAt =
    Number(obj.createdAt) > 0 ? Number(obj.createdAt) : Date.now();

  return {
    id: cleanId,
    ...(cleanParentId ? { parentId: cleanParentId } : {}),
    name,
    rw,
    message,
    createdAt,
  };
}

async function readStore(): Promise<CommentsStoreData> {
  if (!memoryStore) {
    try {
      const raw = await fs.readFile(COMMENTS_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<CommentsStoreData>;
      const comments = Array.isArray(parsed.comments)
        ? parsed.comments
            .map(sanitizeComment)
            .filter((c): c is StoredComment => c !== null)
        : [];
      const deletedIds = Array.isArray(parsed.deletedIds)
        ? parsed.deletedIds.filter((id): id is string => typeof id === 'string')
        : [];
      memoryStore = { comments, deletedIds };
    } catch {
      memoryStore = { comments: [], deletedIds: [] };
    }
  }

  // On cold start, optionally merge comments backed up inside the public Drive JSON if present
  if (!driveSeedChecked) {
    driveSeedChecked = true;
    try {
      const pointerRaw = await fs.readFile(POINTER_FILE_PATH, 'utf-8');
      const pointer = JSON.parse(pointerRaw) as { fileId?: string };
      if (pointer?.fileId && /^[a-zA-Z0-9_-]{10,128}$/.test(pointer.fileId)) {
        const res = await fetch(
          `https://drive.google.com/uc?export=download&id=${encodeURIComponent(pointer.fileId)}`,
          { redirect: 'follow', cache: 'no-store' }
        );
        if (res.ok) {
          const text = await res.text();
          const data = JSON.parse(text) as { comments?: unknown[] };
          if (Array.isArray(data.comments) && data.comments.length > 0) {
            const deletedSet = new Set(memoryStore.deletedIds);
            const existingMap = new Map(
              memoryStore.comments.map((c) => [c.id, c])
            );
            for (const rawC of data.comments) {
              const sanitized = sanitizeComment(rawC);
              if (sanitized && !deletedSet.has(sanitized.id) && !existingMap.has(sanitized.id)) {
                existingMap.set(sanitized.id, sanitized);
              }
            }
            memoryStore.comments = Array.from(existingMap.values()).sort(
              (a, b) => b.createdAt - a.createdAt
            );
          }
        }
      }
    } catch {
      // Ignore if pointer or Drive comments are unavailable
    }
  }

  return memoryStore;
}

async function writeStore(data: CommentsStoreData): Promise<void> {
  const sorted: CommentsStoreData = {
    comments: [...data.comments].sort((a, b) => b.createdAt - a.createdAt),
    deletedIds: Array.from(new Set(data.deletedIds)).slice(-500),
  };
  memoryStore = sorted;
  try {
    await fs.writeFile(COMMENTS_FILE_PATH, JSON.stringify(sorted, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist comments file:', err);
  }
}

export async function GET() {
  const store = await readStore();
  return NextResponse.json(
    {
      comments: store.comments,
      deletedIds: store.deletedIds,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Payload komentar tidak valid.' }, { status: 400 });
  }

  const sanitized = sanitizeComment(body);
  if (!sanitized) {
    return NextResponse.json(
      { error: 'Nama dan isi komentar wajib diisi dengan benar.' },
      { status: 400 }
    );
  }

  const store = await readStore();
  const nextComments = [
    sanitized,
    ...store.comments.filter((c) => c.id !== sanitized.id),
  ];
  const nextDeleted = store.deletedIds.filter((id) => id !== sanitized.id);

  await writeStore({
    comments: nextComments,
    deletedIds: nextDeleted,
  });

  return NextResponse.json({ ok: true, comment: sanitized });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')?.trim() || '';
  const cleanId = id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
  if (!cleanId) {
    return NextResponse.json({ error: 'ID komentar tidak valid.' }, { status: 400 });
  }

  const store = await readStore();
  const idsToDelete = new Set<string>([cleanId]);
  store.comments.forEach((c) => {
    if (c.parentId === cleanId) {
      idsToDelete.add(c.id);
    }
  });

  const nextComments = store.comments.filter((c) => !idsToDelete.has(c.id));
  const nextDeleted = [...store.deletedIds, ...Array.from(idsToDelete)];

  await writeStore({
    comments: nextComments,
    deletedIds: nextDeleted,
  });

  return NextResponse.json({ ok: true, deletedIds: Array.from(idsToDelete) });
}
