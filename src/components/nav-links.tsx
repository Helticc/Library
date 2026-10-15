"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Shelves" },
  { href: "/upload", label: "Import" },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full border border-white/[0.06] bg-ink-900/70 p-1 sm:flex">
      {LINKS.map((link) => {
        const active =
          link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-full px-4 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.2em] transition-colors duration-300 ${
              active
                ? "bg-ink-700 text-amber-300"
                : "text-cream-500 hover:text-cream-100"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
