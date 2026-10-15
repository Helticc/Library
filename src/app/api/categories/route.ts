import { type NextRequest } from "next/server";

import { db } from "@/db";
import { categories } from "@/db/schema";
import { listCategories } from "@/lib/library";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

export async function GET() {
  return Response.json({ categories: await listCategories() });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 60) {
    return Response.json(
      { error: "A category name between 1 and 60 characters is required" },
      { status: 400 },
    );
  }
  const color =
    typeof body.color === "string" && COLOR_RE.test(body.color)
      ? body.color
      : "#D9A441";

  try {
    const [created] = await db
      .insert(categories)
      .values({ name, color })
      .returning();
    return Response.json({ category: created }, { status: 201 });
  } catch {
    return Response.json(
      { error: `A shelf named “${name}” already exists` },
      { status: 409 },
    );
  }
}
