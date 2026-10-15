import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

import { type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FILES_DIR = path.join(process.cwd(), "uploads", "books");

type Params = { params: Promise<{ name: string }> };

function asWebStream(stream: fs.ReadStream): ReadableStream {
  return Readable.toWeb(stream) as unknown as ReadableStream;
}

function baseHeaders(size: number): Headers {
  return new Headers({
    "Content-Type": "application/pdf",
    "Content-Length": String(size),
    "Accept-Ranges": "bytes",
    "Content-Disposition": 'inline; filename="book.pdf"',
    "Cache-Control": "public, max-age=31536000, immutable",
  });
}

async function locate(name: string): Promise<{ path: string; size: number } | null> {
  const safe = path.basename(name);
  // Uploaded files are always stored under a uuid name we generated.
  if (!/^[0-9a-f-]{36}\.pdf$/i.test(safe)) return null;
  const filePath = path.join(FILES_DIR, safe);
  try {
    const stat = await fsp.stat(filePath);
    if (!stat.isFile()) return null;
    return { path: filePath, size: stat.size };
  } catch {
    return null;
  }
}

/**
 * Streams stored PDFs with Range support, so the browser's viewer can fetch
 * large books chunk by chunk instead of downloading them whole.
 */
export async function GET(req: NextRequest, { params }: Params) {
  const { name } = await params;
  const located = await locate(name);
  if (!located) return new Response("Not found", { status: 404 });

  const range = req.headers.get("range");
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (match && (match[1] || match[2])) {
      const size = located.size;
      const start = match[1]
        ? Number.parseInt(match[1], 10)
        : Math.max(0, size - (Number.parseInt(match[2], 10) || 0));
      const end = match[1]
        ? Math.min(match[2] ? Number.parseInt(match[2], 10) : size - 1, size - 1)
        : size - 1;
      if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= size) {
        return new Response(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${size}` },
        });
      }
      const headers = baseHeaders(end - start + 1);
      headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
      return new Response(asWebStream(fs.createReadStream(located.path, { start, end })), {
        status: 206,
        headers,
      });
    }
  }

  return new Response(asWebStream(fs.createReadStream(located.path)), {
    headers: baseHeaders(located.size),
  });
}

export async function HEAD(_req: NextRequest, { params }: Params) {
  const { name } = await params;
  const located = await locate(name);
  if (!located) return new Response("Not found", { status: 404 });
  return new Response(null, { headers: baseHeaders(located.size) });
}
