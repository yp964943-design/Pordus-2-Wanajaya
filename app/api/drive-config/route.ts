import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

export interface DriveSyncPointer {
  fileId: string;
  folderId: string;
  folderName: string;
  updatedAt: string;
  updatedByEmail?: string;
}

const POINTER_FILE_PATH = path.join(os.tmpdir(), 'pordus2-drive-sync.json');
const DRIVE_ID_REGEX = /^[a-zA-Z0-9_-]{10,128}$/;

let memoryPointer: DriveSyncPointer | null = null;

async function readPointer(): Promise<DriveSyncPointer | null> {
  if (memoryPointer) return memoryPointer;
  try {
    const raw = await fs.readFile(POINTER_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<DriveSyncPointer>;
    if (
      typeof parsed.fileId === 'string' &&
      DRIVE_ID_REGEX.test(parsed.fileId) &&
      typeof parsed.folderId === 'string' &&
      DRIVE_ID_REGEX.test(parsed.folderId)
    ) {
      memoryPointer = {
        fileId: parsed.fileId,
        folderId: parsed.folderId,
        folderName:
          typeof parsed.folderName === 'string'
            ? parsed.folderName.slice(0, 120)
            : 'PORDUS 2 Wanajaya - Admin Data',
        updatedAt:
          typeof parsed.updatedAt === 'string'
            ? parsed.updatedAt
            : new Date().toISOString(),
        ...(typeof parsed.updatedByEmail === 'string'
          ? { updatedByEmail: parsed.updatedByEmail.slice(0, 120) }
          : {}),
      };
      return memoryPointer;
    }
  } catch {
    // Pointer file not created yet
  }
  return null;
}

async function writePointer(pointer: DriveSyncPointer): Promise<void> {
  memoryPointer = pointer;
  try {
    await fs.writeFile(POINTER_FILE_PATH, JSON.stringify(pointer, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist Drive pointer file:', err);
  }
}

export async function GET() {
  const pointer = await readPointer();
  return NextResponse.json(
    { pointer },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Partial<DriveSyncPointer>;
  try {
    body = (await req.json()) as Partial<DriveSyncPointer>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const fileId = typeof body.fileId === 'string' ? body.fileId.trim() : '';
  const folderId = typeof body.folderId === 'string' ? body.folderId.trim() : '';

  if (!DRIVE_ID_REGEX.test(fileId) || !DRIVE_ID_REGEX.test(folderId)) {
    return NextResponse.json(
      { error: 'Invalid Google Drive fileId or folderId' },
      { status: 400 }
    );
  }

  // Verify with Google Drive API that the provided Bearer token actually owns/reads this file
  const verifyRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,trashed`,
    {
      headers: {
        Authorization: authHeader,
      },
      cache: 'no-store',
    }
  );

  if (!verifyRes.ok) {
    return NextResponse.json(
      { error: 'Unable to verify Google Drive file access with provided token' },
      { status: 403 }
    );
  }

  const verifiedMeta = (await verifyRes.json()) as {
    id?: string;
    name?: string;
    trashed?: boolean;
  };
  if (verifiedMeta.id !== fileId || verifiedMeta.trashed) {
    return NextResponse.json({ error: 'Google Drive file not active' }, { status: 400 });
  }

  const nextPointer: DriveSyncPointer = {
    fileId,
    folderId,
    folderName:
      typeof body.folderName === 'string' && body.folderName.trim()
        ? body.folderName.trim().slice(0, 120)
        : 'PORDUS 2 Wanajaya - Admin Data',
    updatedAt:
      typeof body.updatedAt === 'string' && body.updatedAt.trim()
        ? body.updatedAt.trim()
        : new Date().toISOString(),
    ...(typeof body.updatedByEmail === 'string' && body.updatedByEmail.trim()
      ? { updatedByEmail: body.updatedByEmail.trim().slice(0, 120) }
      : {}),
  };

  await writePointer(nextPointer);

  return NextResponse.json({ pointer: nextPointer });
}
