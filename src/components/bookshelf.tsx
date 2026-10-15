import { shelfHeightRem } from "@/lib/cover";
import type { BookDto } from "@/lib/library";

import { BookCard } from "./book-card";

interface BookshelfProps {
  index: number;
  name: string;
  color: string;
  books: BookDto[];
}

export function Bookshelf({ index, name, color, books }: BookshelfProps) {
  if (books.length === 0) return null;
  return (
    <section className="rise relative">
      {/* ambient wash behind the shelf */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 left-0 h-56 w-2/3 rounded-full opacity-60 blur-3xl"
        style={{ background: `radial-gradient(60% 60% at 30% 50%, ${color}14, transparent 70%)` }}
      />
      <header className="relative flex flex-wrap items-end gap-x-5 gap-y-2 pb-2">
        <span className="font-mono text-[0.62rem] tracking-[0.3em] text-cream-600">
          {String(index + 1).padStart(2, "0")} /
        </span>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-cream-100 sm:text-4xl">
          {name}
        </h2>
        <span
          className="mb-2 rounded-full border px-2.5 py-0.5 font-mono text-[0.58rem] uppercase tracking-[0.18em]"
          style={{ borderColor: `${color}55`, color }}
        >
          {books.length} {books.length === 1 ? "volume" : "volumes"}
        </span>
        <span className="mb-3 hidden h-px min-w-16 flex-1 bg-gradient-to-r from-line to-transparent sm:block" />
      </header>

      <div className="no-scrollbar relative overflow-x-auto">
        <div className="inline-flex min-w-full items-end gap-5 px-1 pb-3 pt-7 sm:gap-7">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              mode="shelf"
              heightRem={shelfHeightRem(book.coverSeed)}
            />
          ))}
        </div>
        <div className="shelf-plank min-w-full rounded-full" />
      </div>
    </section>
  );
}
