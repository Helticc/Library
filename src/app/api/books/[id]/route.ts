import fsp from "node:fs/promises";
import path from "node:path";

import { eq } from "drizzle-orm";
import { type NextRequest } from "next/server";

import { db } from "@/db";
import { books, categories } from "@/db/schema";
import { getBook } from "@/lib/library";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "books");

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const book = await getBook(id);
  if (!book) return Response.json({ error: "Book not found" }, { status: 404 });
  return Response.json({ book });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates: Partial<typeof books.$inferInsert> = {};

  if (typeof body.title === "string" && body.title.trim()) {
    updates.title = body.title.trim().slice(0, 240);
  }
  if (typeof body.author === "string") {
    updates.author = body.author.trim().slice(0, 180);
  }
  if (typeof body.description === "string") {
    updates.description = body.description.trim().slice(0, 4000);
  }
  if (Object.prototype.hasOwnProperty.call(body, "categoryId")) {
    if (body.categoryId === null || body.categoryId === "") {
      updates.categoryId = null;
    } else if (
      typeof body.categoryId === "string" &&
      /^[0-9a-f-]{36}$/i.test(body.categoryId)
    ) {
      const found = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.id, body.categoryId))
        .limit(1);
      updates.categoryId = found[0]?.id ?? null;
    }
  }
  if (body.touchOpened === true) {
    updates.lastOpenedAt = new Date();
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "Nothing to update" }, { status: 400 });
  }

  const result = await db.update(books).set(updates).where(eq(books.id, id)).returning({
    id: books.id,
  });
  if (result.length === 0) {
    return Response.json({ error: "Book not found" }, { status: 404 });
  }
  return Response.json({ book: await getBook(id) });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const book = await getBook(id);
  if (!book) return Response.json({ error: "Book not found" }, { status: 404 });

  await db.delete(books).where(eq(books.id, id));
  const filePath = path.join(UPLOAD_DIR, path.basename(book.fileUrl));
  await fsp.rm(filePath, { force: true });

  return Response.json({ ok: true });
}
