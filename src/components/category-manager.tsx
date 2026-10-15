"use client";

import { Check, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { CategoryDto } from "@/lib/library";

const COLOR_CHOICES = [
  "#C4572E", "#8C9A5B", "#4E8C84", "#5C7CA8",
  "#B8862E", "#8E5C7A", "#A8443E", "#D9A441",
  "#C98F5B", "#7C7460",
];

interface CategoryManagerProps {
  open: boolean;
  onClose: () => void;
  categories: CategoryDto[];
}

export function CategoryManager({ open, onClose, categories }: CategoryManagerProps) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(COLOR_CHOICES[7]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, { name: string; color: string }>>({});

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setError(null);
      setConfirmDelete(null);
      setEdits({});
    }
  }, [open]);

  if (!open) return null;

  const draft = (category: CategoryDto) =>
    edits[category.id] ?? { name: category.name, color: category.color };

  const setDraft = (category: CategoryDto, patch: Partial<{ name: string; color: string }>) =>
    setEdits((prev) => ({
      ...prev,
      [category.id]: { ...draft(category), ...patch },
    }));

  const isDirty = (category: CategoryDto) => {
    const d = draft(category);
    return d.name !== category.name || d.color !== category.color;
  };

  async function call(input: RequestInfo, init?: RequestInit) {
    const res = await fetch(input, init);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error ?? "Something went wrong");
    }
  }

  async function addCategory() {
    if (!newName.trim()) return;
    setBusy("new");
    setError(null);
    try {
      await call("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), color: newColor }),
      });
      setNewName("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add the shelf");
    } finally {
      setBusy(null);
    }
  }

  async function saveCategory(category: CategoryDto) {
    const d = draft(category);
    setBusy(category.id);
    setError(null);
    try {
      await call(`/api/categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: d.name, color: d.color }),
      });
      setEdits((prev) => {
        const next = { ...prev };
        delete next[category.id];
        return next;
      });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save changes");
    } finally {
      setBusy(null);
    }
  }

  async function deleteCategory(category: CategoryDto) {
    setBusy(category.id);
    setError(null);
    try {
      await call(`/api/categories/${category.id}`, { method: "DELETE" });
      setConfirmDelete(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete the shelf");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-ink-950/80 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-ink-850 p-6 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal
        aria-label="Manage shelves"
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold">Shelves</h2>
            <p className="mt-1 text-xs text-cream-600">
              Rename, recolour, add or remove categories.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 text-cream-500 transition-colors hover:bg-white/5 hover:text-cream-100"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex max-h-[46vh] flex-col gap-1.5 overflow-y-auto pr-1">
          {categories.map((category) => {
            const d = draft(category);
            return (
              <div
                key={category.id}
                className="flex items-center gap-2.5 rounded-xl border border-white/[0.05] bg-ink-900/60 px-3 py-2.5"
              >
                <div className="relative">
                  <span
                    className="block size-4 rounded-full ring-1 ring-white/20"
                    style={{ backgroundColor: d.color }}
                  />
                </div>
                <input
                  value={d.name}
                  onChange={(e) => setDraft(category, { name: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && isDirty(category)) saveCategory(category);
                  }}
                  className="min-w-0 flex-1 bg-transparent text-sm text-cream-100 focus:outline-none"
                />
                <span className="hidden shrink-0 font-mono text-[0.58rem] uppercase tracking-widest text-cream-600 sm:block">
                  {category.bookCount} vol
                </span>
                <div className="flex shrink-0 items-center gap-1">
                  {COLOR_CHOICES.map((color) => (
                    <button
                      key={color}
                      aria-label={`Set colour ${color}`}
                      onClick={() => setDraft(category, { color })}
                      className={`hidden size-3 rounded-full transition-transform hover:scale-125 lg:block ${
                        d.color === color ? "ring-1 ring-offset-2 ring-offset-ink-850 ring-cream-100" : ""
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  {isDirty(category) ? (
                    <button
                      aria-label="Save changes"
                      onClick={() => saveCategory(category)}
                      disabled={busy === category.id}
                      className="ml-1 rounded-full bg-amber-500 p-1.5 text-ink-950 transition-colors hover:bg-amber-300 disabled:opacity-40"
                    >
                      <Check className="size-3" />
                    </button>
                  ) : null}
                  {confirmDelete === category.id ? (
                    <button
                      onClick={() => deleteCategory(category)}
                      disabled={busy === category.id}
                      className="ml-1 rounded-full bg-red-500/90 px-2 py-1 font-mono text-[0.55rem] uppercase tracking-wider text-ink-950 transition-colors hover:bg-red-400"
                    >
                      Confirm
                    </button>
                  ) : (
                    <button
                      aria-label={`Delete ${category.name}`}
                      onClick={() => setConfirmDelete(category.id)}
                      className="ml-1 rounded-full p-1.5 text-cream-600 transition-colors hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {error ? (
          <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </p>
        ) : null}

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-white/[0.12] px-3 py-2.5">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addCategory();
            }}
            placeholder="New shelf name…"
            className="min-w-0 flex-1 bg-transparent text-sm text-cream-100 placeholder:text-cream-600/60 focus:outline-none"
          />
          {COLOR_CHOICES.map((color) => (
            <button
              key={color}
              aria-label={`Choose colour ${color}`}
              onClick={() => setNewColor(color)}
              className={`hidden size-3.5 shrink-0 rounded-full transition-transform hover:scale-125 sm:block ${
                newColor === color ? "ring-1 ring-offset-2 ring-offset-ink-850 ring-cream-100" : ""
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
          <button
            onClick={addCategory}
            disabled={!newName.trim() || busy === "new"}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-medium text-ink-950 transition-colors hover:bg-amber-300 disabled:opacity-40"
          >
            <Plus className="size-3.5" />
            Add
          </button>
        </div>

        <p className="mt-4 font-mono text-[0.56rem] uppercase leading-relaxed tracking-[0.18em] text-cream-600/80">
          Deleting a shelf never deletes books — they move to Unshelved.
        </p>
      </div>
    </div>
  );
}
