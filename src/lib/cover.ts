/**
 * Deterministic generative cover-art system.
 *
 * Every book gets a typographic cover derived from its category colour and a
 * numeric seed, so a shelf of one category reads as a coordinated edition set
 * while each volume keeps its own character.
 */

export interface CoverPalette {
  base: string;
  deep: string;
  ink: string;
  hairline: string;
  accent: string;
  variant: number;
}

export const UNSHELVED_COLOR = "#8A8070";

export function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  // Keep inside signed 32-bit range — the seed is persisted in an int4 column.
  return hash & 0x7fffffff;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const raw = hex.replace("#", "");
  const full = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hsl(h: number, s: number, l: number): string {
  const clamp = (v: number, min: number, max: number) =>
    Math.min(max, Math.max(min, v));
  return `hsl(${Math.round((((h % 360) + 360) % 360) * 10) / 10} ${clamp(s, 0, 100).toFixed(1)}% ${clamp(l, 0, 100).toFixed(1)}%)`;
}

export function coverPalette(categoryColor: string | null, seed: number): CoverPalette {
  const source = categoryColor ?? UNSHELVED_COLOR;
  const { h, s, l } = hexToHsl(source);
  const drift = (seed % 17) - 8; // ±8° hue drift per volume

  return {
    base: hsl(h + drift, Math.min(s + 6, 72), Math.min(Math.max(l, 34), 52)),
    deep: hsl(h + drift - 6, Math.min(s + 10, 78), Math.max(l * 0.42, 13)),
    ink: "hsl(43 38% 90%)",
    hairline: "hsla(43 38% 90% / 0.34)",
    accent: hsl(h + drift + 26, Math.min(s + 18, 84), 72),
    variant: seed % 4,
  };
}

/** Consistent per-book seeds used for both palette and shelf proportions. */
export function seedForBook(id: string, title: string): number {
  return hashString(`${id}::${title}`);
}

/** Varied shelf heights (like physical editions) in the 15.5–20rem range. */
export function shelfHeightRem(seed: number): number {
  return 15.5 + ((seed >> 3) % 9) * 0.55;
}
