import { eq } from "drizzle-orm";
import { type NextRequest } from "next/server";

import { db } from "@/db";
import { categories } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates: Partial<{ name: string; color: string }> = {};
  if (typeof body.name === "string" && body.name.trim()) {
    updates.name = body.name.trim().slice(0, 60);
  }
  if (typeof body.color === "string" && COLOR_RE.test(body.color)) {
    updates.color = body.color;
  }
  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "Nothing to update" }, { status: 400 });
  }

  try {
    const result = await db
      .update(categories)
      .set(updates)
      .where(eq(categories.id, id))
      .returning({ id: categories.id });
    if (result.length === 0) {
      return Response.json({ error: "Shelf not found" }, { status: 404 });
    }
  } catch {
    return Response.json(
      { error: "A shelf with that name already exists" },
      { status: 409 },
    );
  }
  return Response.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const result = await db
    .delete(categories)
    .where(eq(categories.id, id))
    .returning({ id: categories.id });
  if (result.length === 0) {
    return Response.json({ error: "Shelf not found" }, { status: 404 });
  }
  // Books on this shelf keep their place in the library and move to Unshelved.
  return Response.json({ ok: true });
}
