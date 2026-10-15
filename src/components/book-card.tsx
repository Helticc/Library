import Link from "next/link";

import type { BookDto } from "@/lib/library";

import { BookCover } from "./book-cover";

interface BookCardProps {
  book: BookDto;
  /** Rendered height in rem — width follows the 2:3 cover ratio. */
  heightRem?: number;
  mode?: "shelf" | "grid";
}

export function BookCard({ book, heightRem = 17, mode = "grid" }: BookCardProps) {
  return (
    <Link
      href={`/book/${book.id}`}
      className="group/card relative block shrink-0 outline-none"
      style={{ height: `${heightRem}rem` }}
      title={`${book.title}${book.author ? ` — ${book.author}` : ""}`}
    >
      <div
        className="relative h-full transition-transform duration-500 ease-[cubic-bezier(0.22,0.61,0.21,1)] group-hover/card:-translate-y-2.5 group-hover/card:rotate-[0.6deg]"
        style={
          {
            width: `${heightRem * (2 / 3)}rem`,
            "--glow": book.categoryColor ?? "#8A8070",
          } as React.CSSProperties
        }
      >
        <div className="h-full w-full transition-all duration-500 group-hover/card:shadow-[0_26px_50px_-16px_var(--glow)] group-hover/card:brightness-[1.07]">
          <BookCover
            title={book.title}
            author={book.author}
            categoryName={book.categoryName}
            categoryColor={book.categoryColor}
            seed={book.coverSeed}
          />
        </div>
      </div>
      {mode === "grid" ? (
        <div className="mt-3 pr-1" style={{ width: `${heightRem * (2 / 3)}rem` }}>
          <p className="line-clamp-2 font-display text-[0.92rem] font-medium leading-snug text-cream-100 transition-colors group-hover/card:text-amber-300">
            {book.title}
          </p>
          <p className="mt-1 truncate font-mono text-[0.58rem] uppercase tracking-[0.18em] text-cream-600">
            {book.author || "Unknown Author"}
          </p>
        </div>
      ) : null}
    </Link>
  );
}
