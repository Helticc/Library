import {
  ArrowDown,
  ArrowUpToLine,
  BookMarked,
  Flame,
  FileText,
  Folder,
  File,
  FileQuestionMark,
  CirclePlay,
  FileImage
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { BookCard } from "@/components/book-card";
import { LibraryBrowser } from "@/components/library-browser";
import { SiteFooter } from "@/components/site-footer";
import { formatBytes } from "@/lib/format";
import {
  libraryStats,
  listBooks,
  listCategories,
  recentlyOpened,
} from "@/lib/library";

export const dynamic = "force-dynamic";

const compact = new Intl.NumberFormat("en", { notation: "compact" });

export default async function LibraryPage() {
  const [books, categories, stats, recent] = await Promise.all([
    listBooks(),
    listCategories(),
    libraryStats(),
    recentlyOpened(8),
  ]);

  const statItems: Array<[string, string]> = [
    ["Volumes", stats.volumes.toLocaleString("en-US")],
    ["Shelves", stats.shelves.toString().padStart(2, "0")],
    ["Pages", stats.pages > 0 ? compact.format(stats.pages) : "—"],
    ["Storage", formatBytes(stats.bytes)],
  ];

  const marqueeEntries = categories.flatMap((c) => [c.name, c.name]);

  return (
    <div>
      {/* ————————————— HERO ————————————— */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/hero.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="animate-drift object-cover object-center"
          />
          <div className="hero-vignette absolute inset-0" />
        </div>

        <div className="relative mx-auto flex min-h-[92dvh] w-full max-w-[1440px] flex-col justify-end px-5 pb-16 pt-28 sm:px-8">
          <p className="rise mb-6 flex items-center gap-3 font-mono text-[0.62rem] uppercase tracking-[0.32em] text-amber-400">
            <span className="h-px w-10 bg-amber-500/70" />
            Your private athenaeum
          </p>
          <h1
            className="rise max-w-4xl font-display text-[clamp(2.9rem,8.5vw,7rem)] font-semibold leading-[0.98] tracking-[-0.015em]"
            style={{ animationDelay: "90ms" }}
          >
            Every book you own,
            <br />
            <em className="font-light italic text-amber-300">one shelf away.</em>
          </h1>
          <p
            className="rise mt-7 max-w-xl text-base leading-relaxed text-cream-300/90 sm:text-lg"
            style={{ animationDelay: "180ms" }}
          >
            Import your PDF books once and forget the file explorer. Libris shelves
            them by category, dresses each one in its own cover, and lets you read
            right here in the browser.
          </p>
          <div
            className="rise mt-10 flex flex-wrap items-center gap-4"
            style={{ animationDelay: "270ms" }}
          >
            <a
              href="#shelves"
              className="group flex items-center gap-2.5 rounded-full bg-cream-100 px-7 py-3.5 text-sm font-medium text-ink-950 transition-all duration-300 hover:bg-amber-300"
            >
              Browse the shelves
              <ArrowDown className="size-4 transition-transform duration-300 group-hover:translate-y-0.5" />
            </a>
            <Link
              href="/upload"
              className="group flex items-center gap-2.5 rounded-full border border-cream-100/25 px-7 py-3.5 text-sm text-cream-100 backdrop-blur-sm transition-all duration-300 hover:border-amber-400/60 hover:text-amber-300"
            >
              <ArrowUpToLine className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
              Import your books
            </Link>
          </div>

          <dl
            className="rise mt-14 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-6 border-t border-cream-100/15 pt-7 sm:grid-cols-4"
            style={{ animationDelay: "360ms" }}
          >
            {statItems.map(([label, value]) => (
              <div key={label}>
                <dd className="font-display text-3xl font-medium text-cream-100">{value}</dd>
                <dt className="mt-1 font-mono text-[0.58rem] uppercase tracking-[0.26em] text-cream-500">
                  {label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="overflow-hidden border-y border-white/6 bg-ink-900/60"> </div>

      {/* ————————————— CONTINUE READING ————————————— */}
      {recent.length > 0 ? (
        <section className="mx-auto w-full max-w-[1440px] px-5 pt-16 sm:px-8 sm:pt-20">
          <header className="mb-8 flex items-end gap-4">
            <Flame className="mb-1 size-5 text-amber-400" strokeWidth={1.6} />
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              On your nightstand
            </h2>
            <span className="mb-2 font-mono text-[0.58rem] uppercase tracking-[0.24em] text-cream-600">
              recently opened
            </span>
            <span className="mb-3 hidden h-px min-w-16 flex-1 bg-linear-to-r from-line to-transparent sm:block" />
          </header>
          <div className="no-scrollbar flex gap-6 overflow-x-auto pb-2 pt-2">
            {recent.map((book) => (
              <BookCard key={book.id} book={book} mode="grid" heightRem={13.5} />
            ))}
          </div>
        </section>
      ) : null}

      {/* ————————————— THE STACKS ————————————— */}
      <section className="mx-auto w-full max-w-[1440px] px-5 py-16 sm:px-8 sm:py-24">
        {books.length === 0 ? (
          <div className="relative flex min-h-[450px] w-full flex-col items-center justify-center overflow-hidden rounded-3xl border border-white/[0.07] text-center">
            <div className="absolute inset-0 bg-ink-950/35" />
            <div className="relative z-10 flex max-w-xl flex-col items-center gap-6 px-8 py-20 sm:px-14 sm:py-28">
              <FileText className="size-24 text-amber-400" strokeWidth={1.4} />
              <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                No Files Found.
              </h2>
              <p className="leading-relaxed text-cream-300/90">
                Drag your first PDFs into Libris and watch them line up on the right
                shelves: auto-titled, auto-covered, and ready to read in one click.
              </p>
              <Link
                href="/upload"
                className="group flex items-center gap-2.5 rounded-full bg-amber-500 px-7 py-3.5 text-sm font-medium text-ink-950 transition-all duration-300 hover:bg-amber-300 hover:shadow-[0_0_36px_-8px] hover:shadow-amber-400/60"
              >
                <ArrowUpToLine className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
                Import your first books
              </Link>
            </div>
          </div>
        ) : (
          <>
            <header className="mb-14 flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="mb-3 font-mono text-[0.62rem] uppercase tracking-[0.32em] text-amber-400">
                  Catalogue
                </p>
                <h2 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
                  The stacks
                </h2>
              </div>
              <p className="max-w-xs text-sm leading-relaxed text-cream-600">
                Volumes gather under their shelves automatically. Search the whole
                library, or filter to a single category.
              </p>
            </header>
            <LibraryBrowser books={books} categories={categories} />
          </>
        )}
      </section>

      {/* ————————————— OUTRO ————————————— */}
      <section className="border-t border-white/6 bg-ink-900/50">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center gap-8 px-5 py-24 text-center sm:px-8">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.32em] text-amber-400">
            New acquisitions desk
          </p>
          <h2 className="max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
            Got a folder full of PDFs?
            <br />
            <em className="font-light italic text-amber-300">Give them a home.</em>
          </h2>
          <Link
            href="/upload"
            className="group mt-2 flex items-center gap-2.5 rounded-full bg-amber-500 px-8 py-4 text-sm font-medium text-ink-950 transition-all duration-300 hover:bg-amber-300 hover:shadow-[0_0_40px_-6px] hover:shadow-amber-400/60"
          >
            <ArrowUpToLine className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
            Start importing
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
