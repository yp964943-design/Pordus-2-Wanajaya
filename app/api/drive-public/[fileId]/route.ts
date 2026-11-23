import { NextRequest, NextResponse } from 'next/server';

const DRIVE_ID_REGEX = /^[a-zA-Z0-9_-]{10,128}$/;

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await context.params;
  if (!fileId || !DRIVE_ID_REGEX.test(fileId)) {
    return NextResponse.json({ error: 'Invalid fileId' }, { status: 400 });
  }

  const expectedType = req.nextUrl.searchParams.get('type');
  const downloadUrl = `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`;

  try {
    const res = await fetch(downloadUrl, {
      redirect: 'follow',
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'File tidak ditemukan atau belum dibagikan secara publik.' },
        { status: res.status === 404 ? 404 : 502 }
      );
    }

    const contentType = res.headers.get('content-type') || '';

    if (expectedType === 'json') {
      const text = await res.text();
      try {
        const parsed = JSON.parse(text);
        return NextResponse.json(parsed, {
          headers: {
            'Cache-Control': 'no-store',
          },
        });
      } catch {
        return NextResponse.json(
          { error: 'File Google Drive belum dapat dibaca publik sebagai JSON.' },
          { status: 502 }
        );
      }
    }

    if (contentType.startsWith('image/')) {
      const buffer = await res.arrayBuffer();
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        },
      });
    }

    // Fallback to lh3.googleusercontent.com if Google Drive returned an HTML wrapper for an image
    const thumbRes = await fetch(
      `https://lh3.googleusercontent.com/d/${encodeURIComponent(fileId)}=w1600`,
      {
        redirect: 'follow',
        cache: 'no-store',
      }
    );
    const thumbType = thumbRes.headers.get('content-type') || '';
    if (thumbRes.ok && thumbType.startsWith('image/')) {
      const buffer = await thumbRes.arrayBuffer();
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': thumbType,
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        },
      });
    }

    return NextResponse.json(
      { error: 'Konten file bukan gambar yang valid.' },
      { status: 415 }
    );
  } catch (err) {
    console.error('Drive public proxy error:', err);
    return NextResponse.json(
      { error: 'Gagal mengambil file dari Google Drive.' },
      { status: 502 }
    );
  }
}
