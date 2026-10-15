"use client";

import {
  AlertCircle,
  ArrowUpToLine,
  CheckCircle2,
  FileBadge,
  FileText,
  LibraryBig,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

import { deriveTitleFromFilename, formatBytes } from "@/lib/format";
import type { CategoryDto } from "@/lib/library";

interface QueueItem {
  id: string;
  file: File;
  title: string;
  author: string;
  categoryId: string;
  progress: number;
  status: "queued" | "uploading" | "done" | "error";
  error?: string;
}

interface UploaderProps {
  categories: CategoryDto[];
}

function uploadOne(
  item: QueueItem,
  onProgress: (fraction: number) => void,
): Promise<{ bookId: string }> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("title", item.title);
    form.append("author", item.author);
    form.append("categoryId", item.categoryId);
    form.append("file", item.file, item.file.name);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.responseType = "json";
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(Math.min(0.99, event.loaded / event.total));
      }
    };
    xhr.onload = () => {
      const body = xhr.response as { book?: { id: string }; error?: string } | null;
      if (xhr.status >= 200 && xhr.status < 300 && body?.book) {
        resolve({ bookId: body.book.id });
      } else {
        reject(new Error(body?.error ?? `Import failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error while importing"));
    xhr.ontimeout = () => reject(new Error("Import timed out"));
    xhr.send(form);
  });
}

export function Uploader({ categories }: UploaderProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [running, setRunning] = useState(false);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [defaultCategory, setDefaultCategory] = useState(categories[0]?.id ?? "");

  const patch = (id: string, partial: Partial<QueueItem>) =>
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...partial } : item)),
    );

  const enqueue = (files: FileList | File[]) => {
    const incoming = Array.from(files);
    const rejected: string[] = [];
    const additions: QueueItem[] = [];
    for (const file of incoming) {
      if (!/\.pdf$/i.test(file.name)) {
        rejected.push(file.name);
        continue;
      }
      if (
        items.some(
          (item) => item.file.name === file.name && item.file.size === file.size,
        ) ||
        additions.some(
          (item) => item.file.name === file.name && item.file.size === file.size,
        )
      ) {
        continue;
      }
      additions.push({
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 9)}`,
        file,
        title: deriveTitleFromFilename(file.name),
        author: "",
        categoryId: defaultCategory,
        progress: 0,
        status: "queued",
      });
    }
    if (rejected.length > 0) setSkipped(rejected);
    if (additions.length > 0) setItems((prev) => [...prev, ...additions]);
  };

  const pendingCount = items.filter((i) => i.status === "queued" || i.status === "error").length;
  const doneCount = items.filter((i) => i.status === "done").length;
  const uploading = items.find((i) => i.status === "uploading");
  const totalBytes = useMemo(
    () => items.reduce((sum, item) => sum + item.file.size, 0),
    [items],
  );

  async function startImport() {
    if (running || pendingCount === 0) return;
    setRunning(true);
    setSkipped([]);
    for (const item of items) {
      if (item.status === "done") continue;
      patch(item.id, { status: "uploading", progress: 0, error: undefined });
      try {
        await uploadOne(item, (fraction) =>
          patch(item.id, { progress: fraction }),
        );
        patch(item.id, { status: "done", progress: 1 });
      } catch (error) {
        patch(item.id, {
          status: "error",
          error: error instanceof Error ? error.message : "Import failed",
        });
      }
    }
    setRunning(false);
    router.refresh();
  }

  const finished = items.length > 0 && !running && doneCount === items.length;

  return (
    <div className="flex flex-col gap-8">
      {/* ——— Drop zone ——— */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Choose PDF files"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          enqueue(e.dataTransfer.files);
        }}
        className={`group relative flex cursor-pointer flex-col items-center justify-center gap-5 overflow-hidden rounded-3xl border-2 border-dashed px-6 py-16 text-center transition-all duration-300 sm:py-20 ${
          dragging
            ? "border-amber-500 bg-amber-500/[0.06] shadow-[0_0_60px_-20px] shadow-amber-500/40"
            : "border-line bg-ink-900/40 hover:border-cream-600/50 hover:bg-ink-900/70"
        }`}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(50% 60% at 50% 0%, rgba(217,164,65,0.08), transparent 70%)",
          }}
        />
        <span
          className={`grid size-16 place-items-center rounded-2xl border transition-all duration-300 ${
            dragging
              ? "rotate-3 border-amber-500/60 bg-amber-500/15 text-amber-300"
              : "border-white/10 bg-ink-800 text-cream-500 group-hover:text-amber-300"
          }`}
        >
          <ArrowUpToLine className="size-7" strokeWidth={1.4} />
        </span>
        <div className="space-y-2">
          <p className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {dragging ? "Release to add to the pile" : "Drop your PDF books here"}
          </p>
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-cream-600">
            or click to browse · multiple files welcome · no size limits
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) enqueue(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {skipped.length > 0 ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p>
            Skipped {skipped.length} non-PDF {skipped.length === 1 ? "file" : "files"}:{" "}
            <span className="text-red-200/80">{skipped.slice(0, 3).join(", ")}
              {skipped.length > 3 ? ` +${skipped.length - 3} more` : ""}</span>
          </p>
        </div>
      ) : null}

      {/* ——— Queue ——— */}
      {items.length > 0 ? (
        <div className="rounded-3xl border border-white/[0.06] bg-ink-900/50">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] px-5 py-4 sm:px-7">
            <div className="flex items-center gap-3">
              <FileBadge className="size-4 text-amber-400" strokeWidth={1.8} />
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-cream-500">
                {items.length} {items.length === 1 ? "book" : "books"} in the pile ·{" "}
                {formatBytes(totalBytes)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-cream-600">
                Shelve new files under
              </label>
              <select
                value={defaultCategory}
                onChange={(e) => setDefaultCategory(e.target.value)}
                className="rounded-full border border-white/10 bg-ink-800 px-3 py-1.5 text-xs text-cream-100 focus:border-amber-500/50 focus:outline-none"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
                <option value="">Unshelved</option>
              </select>
            </div>
          </div>

          <ul className="divide-y divide-white/[0.05]">
            {items.map((item, index) => (
              <li key={item.id} className="px-5 py-4 sm:px-7">
                <div className="flex items-start gap-4">
                  <span
                    className={`mt-0.5 grid size-10 shrink-0 place-items-center rounded-lg border ${
                      item.status === "done"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : item.status === "error"
                          ? "border-red-500/30 bg-red-500/10 text-red-400"
                          : "border-white/[0.07] bg-ink-800 text-amber-400"
                    }`}
                  >
                    <FileText className="size-4.5" strokeWidth={1.6} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate font-mono text-[0.66rem] tracking-wide text-cream-500">
                        <span className="mr-2 text-cream-600/70">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        {item.file.name}
                      </p>
                      <p className="shrink-0 font-mono text-[0.6rem] text-cream-600">
                        {formatBytes(item.file.size)}
                      </p>
                    </div>

                    {item.status !== "done" ? (
                      <div className="mt-2.5 grid gap-2 sm:grid-cols-[1.6fr_1fr_0.8fr_auto]">
                        <input
                          value={item.title}
                          disabled={running}
                          onChange={(e) => patch(item.id, { title: e.target.value })}
                          placeholder="Book title"
                          className="min-w-0 rounded-lg border border-white/[0.07] bg-ink-800/80 px-3 py-2 text-sm text-cream-100 placeholder:text-cream-600/60 focus:border-amber-500/50 focus:outline-none disabled:opacity-50"
                        />
                        <input
                          value={item.author}
                          disabled={running}
                          onChange={(e) => patch(item.id, { author: e.target.value })}
                          placeholder="Author (optional)"
                          className="min-w-0 rounded-lg border border-white/[0.07] bg-ink-800/80 px-3 py-2 text-sm text-cream-100 placeholder:text-cream-600/60 focus:border-amber-500/50 focus:outline-none disabled:opacity-50"
                        />
                        <select
                          value={item.categoryId}
                          disabled={running}
                          onChange={(e) => patch(item.id, { categoryId: e.target.value })}
                          className="rounded-lg border border-white/[0.07] bg-ink-800/80 px-2 py-2 text-xs text-cream-100 focus:border-amber-500/50 focus:outline-none disabled:opacity-50"
                        >
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                          <option value="">Unshelved</option>
                        </select>
                        <button
                          onClick={() =>
                            setItems((prev) => prev.filter((x) => x.id !== item.id))
                          }
                          disabled={running}
                          aria-label="Remove from pile"
                          className="rounded-lg p-2 text-cream-600 transition-colors hover:bg-white/5 hover:text-cream-100 disabled:opacity-40"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    ) : null}

                    {item.status === "error" ? (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-red-300">
                        <AlertCircle className="size-3.5" /> {item.error}
                      </p>
                    ) : null}

                    {item.status === "uploading" || item.status === "done" ? (
                      <div className="mt-3 flex items-center gap-3">
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-ink-700">
                          <div
                            className={`h-full rounded-full transition-[width] duration-200 ${
                              item.status === "done" ? "bg-emerald-400" : "bg-amber-500"
                            }`}
                            style={{ width: `${Math.round(item.progress * 100)}%` }}
                          />
                        </div>
                        <span className="w-10 shrink-0 text-right font-mono text-[0.6rem] text-cream-500">
                          {item.status === "done" ? (
                            <CheckCircle2 className="ml-auto size-3.5 text-emerald-400" />
                          ) : (
                            `${Math.round(item.progress * 100)}%`
                          )}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.06] px-5 py-4 sm:px-7">
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-cream-600">
              {running && uploading
                ? `Importing ${Math.min(doneCount + 1, items.length)} of ${items.length}…`
                : finished
                  ? "All books are on their shelves"
                  : `${pendingCount} ready to import`}
            </p>
            <div className="flex items-center gap-3">
              {finished ? (
                <>
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                    <Sparkles className="size-3.5" /> Shelved successfully
                  </span>
                  <button
                    onClick={() => setItems([])}
                    className="rounded-full border border-white/10 px-4 py-2 text-xs text-cream-300 transition-colors hover:border-white/25"
                  >
                    Import more
                  </button>
                  <Link
                    href="/"
                    className="flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2 text-xs font-medium text-ink-950 transition-colors hover:bg-amber-300"
                  >
                    <LibraryBig className="size-3.5" />
                    Browse your shelves
                  </Link>
                </>
              ) : (
                <button
                  onClick={startImport}
                  disabled={running || pendingCount === 0}
                  className="flex items-center gap-2 rounded-full bg-amber-500 px-6 py-2.5 text-sm font-medium text-ink-950 transition-all hover:bg-amber-300 hover:shadow-[0_0_28px_-6px] hover:shadow-amber-400/50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {running ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Importing…
                    </>
                  ) : (
                    <>
                      <ArrowUpToLine className="size-4" />
                      Import {pendingCount} {pendingCount === 1 ? "book" : "books"}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
