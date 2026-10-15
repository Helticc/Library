import { randomUUID } from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

import Busboy from "busboy";
import { eq } from "drizzle-orm";
import { type NextRequest } from "next/server";

import { db } from "@/db";
import { books, categories } from "@/db/schema";
import { hashString } from "@/lib/cover";
import { deriveTitleFromFilename } from "@/lib/format";
import { ensureDefaultCategories, getBook } from "@/lib/library";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "books");
/** Skip metadata scanning for truly enormous files — they get shelved instantly. */
const MAX_METADATA_BYTES = 90 * 1024 * 1024;

interface ParsedUpload {
  fields: Record<string, string>;
  fileName: string;
  fileSize: number;
}

/**
 * Stream a multipart request straight to disk. Memory usage stays flat no
 * matter how large the book is.
 */
function parseMultipart(req: NextRequest, destPath: string): Promise<ParsedUpload> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    const bb = Busboy({
      headers: { "content-type": req.headers.get("content-type") ?? "" },
      limits: { files: 1, fields: 12 },
    });

    const fields: Record<string, string> = {};
    let fileName = "";
    let fileSize = 0;
    let sawFile = false;
    let writeFinished: Promise<void> | null = null;

    bb.on("field", (name, value) => {
      fields[name] = value;
    });

    bb.on("file", (_field, stream, info) => {
      sawFile = true;
      fileName = info.filename || "book.pdf";
      const writer = fs.createWriteStream(destPath);
      stream.on("data", (chunk: Buffer) => {
        fileSize += chunk.length;
      });
      writeFinished = new Promise<void>((res, rej) => {
        stream.on("error", rej);
        writer.on("error", rej);
        writer.on("finish", () => res());
        stream.pipe(writer);
      });
    });

    bb.on("error", () => fail(new Error("Could not read the upload stream")));
    bb.on("close", async () => {
      if (settled) return;
      try {
        if (writeFinished) await writeFinished;
        settled = true;
        if (!sawFile) {
          reject(new Error("No file was attached to the request"));
          return;
        }
        resolve({ fields, fileName, fileSize });
      } catch (error) {
        reject(error instanceof Error ? error : new Error("Failed while saving the file"));
      }
    });

    if (!req.body) {
      fail(new Error("The request body is empty"));
      return;
    }
    Readable.fromWeb(req.body as Parameters<typeof Readable.fromWeb>[0]).pipe(bb);
  });
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    return Response.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  await ensureDefaultCategories();
  await fsp.mkdir(UPLOAD_DIR, { recursive: true });

  const storedName = `${randomUUID()}.pdf`;
  const destPath = path.join(UPLOAD_DIR, storedName);

  let parsed: ParsedUpload;
  try {
    parsed = await parseMultipart(req, destPath);
  } catch (error) {
    await fsp.rm(destPath, { force: true });
    return Response.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 },
    );
  }

  const { fields, fileName, fileSize } = parsed;

  if (!/\.pdf$/i.test(fileName)) {
    await fsp.rm(destPath, { force: true });
    return Response.json(
      { error: `"${fileName}" is not a PDF. Only PDF books can be shelved.` },
      { status: 415 },
    );
  }
  if (fileSize < 256) {
    await fsp.rm(destPath, { force: true });
    return Response.json({ error: "The uploaded file appears to be empty" }, { status: 400 });
  }

  // Resolve the requested shelf, if any.
  let categoryId: string | null = null;
  if (fields.categoryId && /^[0-9a-f-]{36}$/i.test(fields.categoryId)) {
    const found = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, fields.categoryId))
      .limit(1);
    categoryId = found[0]?.id ?? null;
  }

  const title =
    (fields.title ?? "").trim().slice(0, 240) || deriveTitleFromFilename(fileName);
  const author = (fields.author ?? "").trim().slice(0, 180);

  const [created] = await db
    .insert(books)
    .values({
      title,
      author,
      categoryId,
      fileName: path.basename(fileName).slice(0, 300),
      storedName,
      fileSize,
      coverSeed: hashString(`${title}::${fileSize}`),
    })
    .returning({ id: books.id });

  // Best-effort metadata backfill (page count, embedded title/author).
  if (fileSize <= MAX_METADATA_BYTES) {
    try {
      const { PDFParse } = await import("pdf-parse");
      const buffer = await fsp.readFile(destPath);
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      try {
        const meta = await parser.getInfo();
        const updates: Partial<typeof books.$inferInsert> = {};
        if (Number.isFinite(meta.total) && meta.total > 0) {
          updates.pageCount = meta.total;
        }
        const metaInfo = (meta.info ?? {}) as { Title?: unknown; Author?: unknown };
        const metaTitle = String(metaInfo.Title ?? "").trim();
        const metaAuthor = String(metaInfo.Author ?? "").trim();
        if (!fields.title && metaTitle.length > 2) {
          updates.title = metaTitle.slice(0, 240);
        }
        if (!author && metaAuthor.length > 0) {
          updates.author = metaAuthor.slice(0, 180);
        }
        if (Object.keys(updates).length > 0) {
          await db.update(books).set(updates).where(eq(books.id, created.id));
        }
      } finally {
        await parser.destroy().catch(() => undefined);
      }
    } catch {
      // Scanning is optional — the book is already safely shelved.
    }
  }

  const book = await getBook(created.id);
  return Response.json({ book }, { status: 201 });
}
