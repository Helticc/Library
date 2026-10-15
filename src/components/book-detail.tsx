"use client";

import {
  BookOpen,
  CircleCheck,
  Download,
  Loader2,
  PencilLine,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { formatBytes, formatDate, timeAgo } from "@/lib/format";
import type { BookDto, CategoryDto } from "@/lib/library";

interface BookDetailProps {
  book: BookDto;
  categories: CategoryDto[];
}

export function BookDetail({ book, categories }: BookDetailProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: book.title,
    author: book.author,
    description: book.description,
    categoryId: book.categoryId ?? "",
  });

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/books/${book.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          author: form.author,
          description: form.description,
          categoryId: form.categoryId || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Could not save changes");
      }
      setEditing(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save changes");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      const res = await fetch(`/api/books/${book.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not remove the book");
      router.push("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove the book");
      setBusy(false);
      setConfirming(false);
    }
  }

  const meta: Array<[string, string]> = [
    ["Format", book.fileName.toLowerCase().endsWith(".pdf") ? "PDF" : "PDF"],
    ["Size", formatBytes(book.fileSize)],
    ["Pages", book.pageCount ? book.pageCount.toLocaleString("en-US") : "—"],
    ["Added", formatDate(book.createdAt)],
    ["Last opened", book.lastOpenedAt ? timeAgo(book.lastOpenedAt) : "Never"],
  ];

  return (
    <div className="min-w-0">
      <p className="mb-4 flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-[0.28em] text-cream-600">
        Library
        <span className="text-cream-600/50">/</span>
        <span
          className="flex items-center gap-1.5"
          style={{ color: book.categoryColor ?? "#8A8070" }}
        >
          <span
            className="size-1.5 rounded-full"
            style={{ backgroundColor: book.categoryColor ?? "#8A8070" }}
          />
          {book.categoryName ?? "Unshelved"}
        </span>
      </p>

      <h1 className="font-display text-4xl font-semibold leading-[1.04] tracking-tight sm:text-5xl lg:text-[3.4rem]">
        {book.title}
      </h1>
      <p className="mt-4 font-display text-xl italic text-cream-300">
        {book.author || "Unknown author"}
      </p>

      <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-y border-white/[0.07] py-6 sm:grid-cols-5">
        {meta.map(([label, value]) => (
          <div key={label}>
            <dt className="font-mono text-[0.56rem] uppercase tracking-[0.24em] text-cream-600">
              {label}
            </dt>
            <dd className="mt-1.5 text-sm text-cream-100">{value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-6 max-w-xl text-[0.95rem] leading-relaxed text-cream-500">
        {book.description ||
          "No notes on this volume yet. Open it straight from the shelf — it reads right here in the browser."}
      </p>

      <p className="mt-4 truncate font-mono text-[0.58rem] tracking-[0.14em] text-cream-600/70">
        FILE — {book.fileName}
      </p>

      <div className="mt-9 flex flex-wrap items-center gap-3">
        <Link
          href={`/read/${book.id}`}
          className="group flex items-center gap-2.5 rounded-full bg-amber-500 px-7 py-3.5 text-sm font-medium text-ink-950 transition-all duration-300 hover:bg-amber-300 hover:shadow-[0_0_36px_-8px] hover:shadow-amber-400/60"
        >
          <BookOpen className="size-4 transition-transform duration-300 group-hover:-rotate-6" />
          Read now
        </Link>
        <a
          href={book.fileUrl}
          download={book.fileName}
          className="flex items-center gap-2 rounded-full border border-white/[0.12] px-5 py-3.5 text-sm text-cream-100 transition-colors hover:border-amber-500/50 hover:text-amber-300"
        >
          <Download className="size-4" />
          Download
        </a>
        <button
          onClick={() => setEditing((v) => !v)}
          className="flex items-center gap-2 rounded-full border border-white/[0.12] px-5 py-3.5 text-sm text-cream-100 transition-colors hover:border-white/30"
        >
          <PencilLine className="size-4" />
          {editing ? "Close editor" : "Edit details"}
        </button>
        {confirming ? (
          <span className="flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 py-2 pl-4 pr-2 text-xs text-red-300">
            Remove this book and its file?
            <button
              onClick={remove}
              disabled={busy}
              className="rounded-full bg-red-500 px-3 py-1.5 font-medium text-ink-950 transition-colors hover:bg-red-400 disabled:opacity-50"
            >
              {busy ? "Removing…" : "Yes, remove"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="rounded-full px-2 py-1.5 text-red-300/80 hover:text-red-200"
            >
              Keep
            </button>
          </span>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="flex items-center gap-2 rounded-full px-4 py-3.5 text-sm text-cream-600 transition-colors hover:text-red-400"
          >
            <Trash2 className="size-4" />
            Remove
          </button>
        )}
      </div>

      {editing ? (
        <div className="mt-8 rounded-2xl border border-white/[0.08] bg-ink-900/60 p-6">
          <p className="mb-5 font-mono text-[0.6rem] uppercase tracking-[0.26em] text-cream-600">
            Catalogue entry
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="mb-1.5 block font-mono text-[0.56rem] uppercase tracking-[0.2em] text-cream-600">
                Title
              </span>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-white/[0.08] bg-ink-800 px-3.5 py-2.5 text-sm text-cream-100 focus:border-amber-500/50 focus:outline-none"
              />
            </label>
            <label>
              <span className="mb-1.5 block font-mono text-[0.56rem] uppercase tracking-[0.2em] text-cream-600">
                Author
              </span>
              <input
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                className="w-full rounded-lg border border-white/[0.08] bg-ink-800 px-3.5 py-2.5 text-sm text-cream-100 focus:border-amber-500/50 focus:outline-none"
              />
            </label>
            <label>
              <span className="mb-1.5 block font-mono text-[0.56rem] uppercase tracking-[0.2em] text-cream-600">
                Shelf
              </span>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full rounded-lg border border-white/[0.08] bg-ink-800 px-3.5 py-2.5 text-sm text-cream-100 focus:border-amber-500/50 focus:outline-none"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
                <option value="">Unshelved</option>
              </select>
            </label>
            <label className="sm:col-span-2">
              <span className="mb-1.5 block font-mono text-[0.56rem] uppercase tracking-[0.2em] text-cream-600">
                Notes / description
              </span>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full resize-none rounded-lg border border-white/[0.08] bg-ink-800 px-3.5 py-2.5 text-sm text-cream-100 focus:border-amber-500/50 focus:outline-none"
              />
            </label>
          </div>
          {error ? <p className="mt-3 text-xs text-red-300">{error}</p> : null}
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={save}
              disabled={busy || !form.title.trim()}
              className="flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-medium text-ink-950 transition-colors hover:bg-amber-300 disabled:opacity-40"
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CircleCheck className="size-4" />
              )}
              Save changes
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-full px-4 py-2.5 text-sm text-cream-500 hover:text-cream-100"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
