import { relations } from "drizzle-orm";
import {
  bigint,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  color: text("color").notNull().default("#D9A441"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const books = pgTable(
  "books",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    author: text("author").notNull().default(""),
    description: text("description").notNull().default(""),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    // Original filename as uploaded and the randomized name on disk.
    fileName: text("file_name").notNull(),
    storedName: text("stored_name").notNull(),
    fileSize: bigint("file_size", { mode: "number" }).notNull().default(0),
    pageCount: integer("page_count"),
    format: text("format").notNull().default("pdf"),
    // Deterministic index into the cover-art palette.
    coverSeed: integer("cover_seed").notNull().default(0),
    lastOpenedAt: timestamp("last_opened_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("books_category_id_idx").on(table.categoryId),
    index("books_created_at_idx").on(table.createdAt),
    index("books_last_opened_at_idx").on(table.lastOpenedAt),
  ],
);

export const categoriesRelations = relations(categories, ({ many }) => ({
  books: many(books),
}));

export const booksRelations = relations(books, ({ one }) => ({
  category: one(categories, {
    fields: [books.categoryId],
    references: [categories.id],
  }),
}));

export type Category = typeof categories.$inferSelect;
export type Book = typeof books.$inferSelect;
export type NewBook = typeof books.$inferInsert;
export type NewCategory = typeof categories.$inferInsert;
