import "server-only";

import { asc, count, desc, eq, isNotNull, sql } from "drizzle-orm";

import { db } from "@/db";
import { books, categories } from "@/db/schema";
import { seedForBook } from "@/lib/cover";

export interface CategoryDto {
  id: string;
  name: string;
  color: string;
  bookCount: number;
}

export interface BookDto {
  id: string;
  title: string;
  author: string;
  description: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  pageCount: number | null;
  coverSeed: number;
  lastOpenedAt: string | null;
  createdAt: string;
}

export interface LibraryStats {
  volumes: number;
  shelves: number;
  pages: number;
  bytes: number;
  beingRead: number;
}

export const DEFAULT_CATEGORIES: Array<{ name: string; color: string }> = [
  { name: "Fiction", color: "#C4572E" },
  { name: "Non-Fiction", color: "#8C9A5B" },
  { name: "Science", color: "#4E8C84" },
  { name: "Technology", color: "#5C7CA8" },
  { name: "History", color: "#B8862E" },
  { name: "Philosophy", color: "#8E5C7A" },
  { name: "Art & Design", color: "#A8443E" },
  { name: "Reference", color: "#D9A441" },
];

export async function ensureDefaultCategories(): Promise<void> {
  const [{ value }] = await db.select({ value: count() }).from(categories);
  if (value > 0) return;
  await db
    .insert(categories)
    .values(DEFAULT_CATEGORIES.map((c) => ({ name: c.name, color: c.color })))
    .onConflictDoNothing();
}

type BookRow = {
  book: typeof books.$inferSelect;
  category: typeof categories.$inferSelect | null;
};

function toDto(row: BookRow): BookDto {
  const { book, category } = row;
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    description: book.description,
    categoryId: book.categoryId,
    categoryName: category?.name ?? null,
    categoryColor: category?.color ?? null,
    fileName: book.fileName,
    fileUrl: `/api/files/${book.storedName}`,
    fileSize: Number(book.fileSize ?? 0),
    pageCount: book.pageCount,
    coverSeed: seedForBook(book.id, book.title),
    lastOpenedAt: book.lastOpenedAt ? book.lastOpenedAt.toISOString() : null,
    createdAt: book.createdAt.toISOString(),
  };
}

const bookSelection = {
  book: books,
  category: categories,
} as const;

export async function listBooks(): Promise<BookDto[]> {
  const rows = await db
    .select(bookSelection)
    .from(books)
    .leftJoin(categories, eq(books.categoryId, categories.id))
    .orderBy(desc(books.createdAt));
  return rows.map(toDto);
}

export async function getBook(id: string): Promise<BookDto | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const rows = await db
    .select(bookSelection)
    .from(books)
    .leftJoin(categories, eq(books.categoryId, categories.id))
    .where(eq(books.id, id))
    .limit(1);
  return rows[0] ? toDto(rows[0]) : null;
}

export async function listRelatedBooks(
  categoryId: string | null,
  excludeId: string,
  limit = 10,
): Promise<BookDto[]> {
  if (!categoryId) return [];
  const rows = await db
    .select(bookSelection)
    .from(books)
    .leftJoin(categories, eq(books.categoryId, categories.id))
    .where(sql`${books.categoryId} = ${categoryId} AND ${books.id} <> ${excludeId}`)
    .orderBy(desc(books.createdAt))
    .limit(limit);
  return rows.map(toDto);
}

export async function listCategories(): Promise<CategoryDto[]> {
  await ensureDefaultCategories();
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      color: categories.color,
      bookCount: count(books.id),
    })
    .from(categories)
    .leftJoin(books, eq(books.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(asc(categories.name));
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    color: row.color,
    bookCount: Number(row.bookCount),
  }));
}

export async function recentlyOpened(limit = 8): Promise<BookDto[]> {
  const rows = await db
    .select(bookSelection)
    .from(books)
    .leftJoin(categories, eq(books.categoryId, categories.id))
    .where(isNotNull(books.lastOpenedAt))
    .orderBy(desc(books.lastOpenedAt))
    .limit(limit);
  return rows.map(toDto);
}

export async function libraryStats(): Promise<LibraryStats> {
  const [bookAgg] = await db
    .select({
      volumes: count(books.id),
      pages: sql<number>`coalesce(sum(${books.pageCount}), 0)`,
      bytes: sql<number>`coalesce(sum(${books.fileSize}), 0)`,
      beingRead: sql<number>`count(${books.lastOpenedAt})`,
    })
    .from(books);
  return {
    volumes: Number(bookAgg?.volumes ?? 0),
    shelves: DEFAULT_CATEGORIES.length,
    pages: Number(bookAgg?.pages ?? 0),
    bytes: Number(bookAgg?.bytes ?? 0),
    beingRead: Number(bookAgg?.beingRead ?? 0),
  };
}

export async function bookCount(): Promise<number> {
  const [{ value }] = await db.select({ value: count() }).from(books);
  return value;
}
