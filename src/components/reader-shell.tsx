"use client";

import { ArrowLeft, Download, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import type { BookDto } from "@/lib/library";

export function ReaderShell({ book }: { book: BookDto }) {
  // Mark the volume as opened so it appears in "Continue reading".
  useEffect(() => {
    fetch(`/api/books/${book.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ touchOpened: true }),
    }).catch(() => undefined);
  }, [book.id]);

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col bg-ink-900">
      <div className="flex h-13 shrink-0 items-center gap-3 border-b border-white/[0.07] bg-ink-950/90 px-4 py-3 backdrop-blur sm:px-6">
        <Link
          href={`/book/${book.id}`}
          className="group flex shrink-0 items-center gap-2 rounded-full border border-white/[0.08] px-3.5 py-1.5 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-cream-500 transition-colors hover:border-amber-500/40 hover:text-amber-300"
        >
          <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
          Back
        </Link>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="truncate font-display text-sm text-cream-100">{book.title}</p>
          <p className="hidden truncate font-mono text-[0.56rem] uppercase tracking-[0.2em] text-cream-600 sm:block">
            {book.author || "Unknown author"}
            {book.pageCount ? ` · ${book.pageCount.toLocaleString("en-US")} pages` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <a
            href={book.fileUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Open in a new tab"
            className="rounded-full border border-white/[0.08] p-2 text-cream-500 transition-colors hover:border-amber-500/40 hover:text-amber-300"
          >
            <ExternalLink className="size-3.5" />
          </a>
          <a
            href={book.fileUrl}
            download={book.fileName}
            aria-label="Download"
            className="rounded-full border border-white/[0.08] p-2 text-cream-500 transition-colors hover:border-amber-500/40 hover:text-amber-300"
          >
            <Download className="size-3.5" />
          </a>
        </div>
      </div>
      <iframe
        key={book.id}
        src={`${book.fileUrl}#view=Fit`}
        title={`Reading ${book.title}`}
        className="min-h-0 w-full flex-1 bg-[#2b2b2b]"
      />
    </div>
  );
}
