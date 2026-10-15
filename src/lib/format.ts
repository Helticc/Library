/** Formatting + filename heuristics shared by client and server. */

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const precision = value >= 100 || unit === 0 ? 0 : 1;
  return `${value.toFixed(precision)} ${units[unit]}`;
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function timeAgo(value: string | Date | null | undefined): string {
  if (!value) return "never";
  const date = typeof value === "string" ? new Date(value) : value;
  const seconds = Math.max(0, (Date.now() - date.getTime()) / 1000);
  if (seconds < 90) return "just now";
  const minutes = seconds / 60;
  if (minutes < 90) return `${Math.round(minutes)} min ago`;
  const hours = minutes / 60;
  if (hours < 36) return `${Math.round(hours)} hr ago`;
  const days = hours / 24;
  if (days < 30) return `${Math.round(days)} d ago`;
  const months = days / 30.4;
  if (months < 12) return `${Math.round(months)} mo ago`;
  return `${Math.round(months / 12)} yr ago`;
}

/** Turn "the_name-of-wind_10th_anniversary.PDF" into "The Name of Wind 10th Anniversary". */
export function deriveTitleFromFilename(filename: string): string {
  const stem = filename.replace(/\.[^./\\]+$/, "");
  const cleaned = stem
    .replace(/[[\](){},;!]+/g, " ")
    .replace(/[._+]+/g, " ")
    .replace(/\s*-\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (!cleaned) return "Untitled Volume";
  const small = new Set([
    "a", "an", "and", "as", "at", "but", "by", "for", "in", "nor", "of",
    "on", "or", "per", "the", "to", "v", "vs", "via",
  ]);
  return cleaned
    .split(" ")
    .map((word, index) => {
      if (/^\d/.test(word) || word.length <= 1) return word.toUpperCase();
      const lower = word.toLowerCase();
      if (index > 0 && small.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}
