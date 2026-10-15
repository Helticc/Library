import { LibraryBig } from "lucide-react";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-ink-900/60">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-5 py-12 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-md bg-ink-700 text-amber-400">
              <LibraryBig className="size-4" strokeWidth={1.8} />
            </span>
            <div>
              <p className="font-display text-lg font-semibold leading-none">Libris</p>
              <p className="mt-1 font-mono text-[0.58rem] uppercase tracking-[0.28em] text-cream-600">
                Est. {new Date().getFullYear()} · Shelf &amp; Spine
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-6 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-cream-500">
            <Link href="/" className="transition-colors hover:text-amber-300">
              Shelves
            </Link>
            <Link href="/upload" className="transition-colors hover:text-amber-300">
              Import
            </Link>
          </nav>
        </div>
        <p className="max-w-xl text-sm leading-relaxed text-cream-600">
          Every PDF you own, shelved by category and readable in the browser —
          your files stay on your own machine, never touching a third party.
        </p>
        <div className="h-px w-full bg-gradient-to-r from-transparent via-line to-transparent" />
        <p className="font-mono text-[0.58rem] uppercase tracking-[0.24em] text-cream-600/70">
          “A library is not a luxury but one of the necessities of life.” — H. W. Beecher
        </p>
      </div>
    </footer>
  );
}
