"use client";

import { Search, Settings2, X } from "lucide-react";
import { useMemo, useState } from "react";

import { UNSHELVED_COLOR } from "@/lib/cover";
import type { BookDto, CategoryDto } from "@/lib/library";

import { BookCard } from "./book-card";
import { Bookshelf } from "./bookshelf";
import { CategoryManager } from "./category-manager";

interface LibraryBrowserProps {
  books: BookDto[];
  categories: CategoryDto[];
}

export function LibraryBrowser({ books, categories }: LibraryBrowserProps) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string>("all");
  const [managerOpen, setManagerOpen] = useState(false);

  const unshelved = useMemo(
    () => books.filter((b) => b.categoryId === null),
    [books],
  );

  const visibleBooks = useMemo(() => {
    const q = query.trim().toLowerCase();
    let pool = books;
    if (active === "unshelved") pool = unshelved;
    else if (active !== "all") pool = books.filter((b) => b.categoryId === active);
    if (!q) return pool;
    return pool.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.fileName.toLowerCase().includes(q),
    );
  }, [books, query, active, unshelved]);

  const searching = query.trim().length > 0;

  const chips: Array<{ id: string; name: string; color: string; count: number }> = [
    { id: "all", name: "All shelves", color: "#D9A441", count: books.length },
    ...categories
      .filter((c) => c.bookCount > 0)
      .map((c) => ({ id: c.id, name: c.name, color: c.color, count: c.bookCount })),
    ...(unshelved.length > 0
      ? [
          {
            id: "unshelved",
            name: "Unshelved",
            color: UNSHELVED_COLOR,
            count: unshelved.length,
          },
        ]
      : []),
  ];

  const showShelves =
    !searching && active === "all" ? (
      <div className="flex flex-col gap-16 sm:gap-20">
        {categories.map((category, i) => (
          <Bookshelf
            key={category.id}
            index={i}
            name={category.name}
            color={category.color}
            books={books.filter((b) => b.categoryId === category.id)}
          />
        ))}
        {unshelved.length > 0 ? (
          <Bookshelf
            index={categories.length}
            name="Unshelved"
            color={UNSHELVED_COLOR}
            books={unshelved}
          />
        ) : null}
      </div>
    ) : (
      <div>
        <p className="mb-8 font-mono text-[0.62rem] uppercase tracking-[0.26em] text-cream-600">
          {searching
            ? `${visibleBooks.length} result${visibleBooks.length === 1 ? "" : "s"} for “${query.trim()}”`
            : `${visibleBooks.length} volume${visibleBooks.length === 1 ? "" : "s"}`}
        </p>
        {visibleBooks.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-line py-20 text-center">
            <Search className="size-6 text-cream-600" strokeWidth={1.5} />
            <p className="font-display text-xl text-cream-300">
              Nothing matches “{query.trim()}”
            </p>
            <p className="max-w-sm text-sm text-cream-600">
              Try a different title, author, or filename — your library searches
              across all three.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-x-5 gap-y-12">
            {visibleBooks.map((book) => (
              <BookCard key={book.id} book={book} mode="grid" heightRem={15.5} />
            ))}
          </div>
        )}
      </div>
    );

  return (
    <div id="shelves" className="scroll-mt-24">
      <div className="mb-12 flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-4">
          <label className="group relative flex min-w-64 max-w-md flex-1 items-center">
            <Search
              className="pointer-events-none absolute left-4 size-4 text-cream-600 transition-colors group-focus-within:text-amber-300"
              strokeWidth={1.8}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles, authors, filenames…"
              className="w-full rounded-full border border-white/[0.08] bg-ink-900/80 py-3 pl-11 pr-10 text-sm text-cream-100 placeholder:text-cream-600/70 focus:border-amber-500/50 focus:outline-none"
            />
            {query ? (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-3 rounded-full p-1 text-cream-600 transition-colors hover:text-cream-100"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </label>
          <button
            onClick={() => setManagerOpen(true)}
            className="flex items-center gap-2 rounded-full border border-white/[0.08] px-4 py-3 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-cream-500 transition-colors hover:border-amber-500/40 hover:text-amber-300"
          >
            <Settings2 className="size-3.5" strokeWidth={1.8} />
            Manage shelves
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => {
            const isActive = active === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setActive(isActive ? "all" : chip.id)}
                className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-[0.78rem] transition-all duration-300 ${
                  isActive
                    ? "border-transparent text-ink-950"
                    : "border-white/[0.08] text-cream-300 hover:border-white/20"
                }`}
                style={
                  isActive
                    ? { backgroundColor: chip.color }
                    : { backgroundColor: `${chip.color}0d` }
                }
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: isActive ? "#0A0906" : chip.color }}
                />
                {chip.name}
                <span
                  className={`font-mono text-[0.62rem] ${isActive ? "opacity-70" : "text-cream-600"}`}
                >
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {showShelves}

      <CategoryManager
        open={managerOpen}
        onClose={() => setManagerOpen(false)}
        categories={categories}
      />
    </div>
  );
}
