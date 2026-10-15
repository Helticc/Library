import { ArrowUpToLine, LibraryBig } from "lucide-react";
import Link from "next/link";

import { bookCount } from "@/lib/library";

import { NavLinks } from "./nav-links";

export async function SiteHeader() {
  let volumes = 0;
  try {
    volumes = await bookCount();
  } catch {
    volumes = 0;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-ink-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-md bg-amber-500 text-ink-950 shadow-[0_0_24px_-6px] shadow-amber-500/60 transition-transform duration-300 group-hover:-rotate-6">
            <LibraryBig className="size-5" strokeWidth={1.8} />
          </span>
          <span className="leading-none">
            <span className="block font-display text-[1.35rem] font-semibold tracking-tight">
              Libris
            </span>
            <span className="mt-1 hidden font-mono text-[0.58rem] uppercase tracking-[0.28em] text-cream-600 sm:block">
              Personal Athenaeum
            </span>
          </span>
        </Link>

        <NavLinks />

        <div className="flex items-center gap-4">
          <span className="hidden font-mono text-[0.62rem] uppercase tracking-[0.22em] text-cream-600 md:block">
            {volumes} {volumes === 1 ? "volume" : "volumes"}
          </span>
          <Link
            href="/upload"
            className="group flex items-center gap-2 rounded-full bg-amber-500 py-2 pl-4 pr-4 text-[0.8rem] font-medium text-ink-950 transition-all duration-300 hover:bg-amber-300 hover:shadow-[0_0_28px_-6px] hover:shadow-amber-400/50"
          >
            <ArrowUpToLine className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
            <span className="hidden sm:inline">Import books</span>
            <span className="sm:hidden">Import</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
