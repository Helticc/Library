import { coverPalette, UNSHELVED_COLOR } from "@/lib/cover";

interface BookCoverProps {
  title: string;
  author: string;
  categoryName: string | null;
  categoryColor: string | null;
  seed: number;
  size?: "sm" | "lg";
  className?: string;
}

/**
 * Generative typographic cover. Four layout variants are chosen from the
 * book's seed so every volume on a shelf looks like its own edition while
 * staying inside the category's colour family.
 */
export function BookCover({
  title,
  author,
  categoryName,
  categoryColor,
  seed,
  size = "sm",
  className = "",
}: BookCoverProps) {
  const palette = coverPalette(categoryColor ?? UNSHELVED_COLOR, seed);
  const lg = size === "lg";
  const initial = (title.trim().charAt(0) || "L").toUpperCase();

  const titleCls = lg
    ? "font-display font-semibold leading-[1.06] text-[1.75rem]"
    : "font-display font-semibold leading-[1.12] text-[clamp(0.8rem,1.05cqw,1.05rem)]";
  const catCls = lg
    ? "font-mono uppercase tracking-[0.3em] text-[0.62rem]"
    : "font-mono uppercase tracking-[0.24em] text-[clamp(0.34rem,0.5cqw,0.5rem)]";
  const authorCls = lg
    ? "font-mono uppercase tracking-[0.22em] text-[0.66rem]"
    : "font-mono uppercase tracking-[0.18em] text-[clamp(0.36rem,0.52cqw,0.52rem)]";

  const shared = {
    containerType: "inline-size" as const,
    background: `linear-gradient(158deg, ${palette.base} 0%, ${palette.deep} 88%)`,
    color: palette.ink,
  };

  const spine = (
    <>
      <span
        className="pointer-events-none absolute inset-y-0 left-0 w-[8%]"
        style={{
          background: `linear-gradient(to right, hsla(0 0% 0% / 0.42), hsla(0 0% 0% / 0.12) 55%, transparent)`,
        }}
      />
      <span
        className="pointer-events-none absolute inset-y-0 left-[8%] w-px"
        style={{ background: "hsla(43 38% 92% / 0.22)" }}
      />
      {/* page block on the fore edge */}
      <span
        className="pointer-events-none absolute inset-y-[1px] right-0 w-[3.5%] min-w-[3px]"
        style={{
          background:
            "repeating-linear-gradient(to right, hsla(43 38% 88% / 0.5) 0 1px, hsla(43 38% 88% / 0.08) 1px 2px, transparent 2px 3px)",
        }}
      />
      {/* candlelight sheen + bottom shadow */}
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(120% 60% at 30% -6%, hsla(43 45% 94% / 0.16), transparent 60%), linear-gradient(to top, hsla(0 0% 0% / 0.32), transparent 26%)`,
        }}
      />
    </>
  );

  const diamond = (
    <span
      className={`inline-block rotate-45 ${lg ? "size-1.5" : "size-1"}`}
      style={{ backgroundColor: palette.accent }}
    />
  );

  const label = categoryName ?? "Unshelved";
  const byline = author || "Unknown Author";

  let body: React.ReactNode;

  switch (palette.variant) {
    case 1: {
      // ——— Edition band: deep block across the head of the cover
      body = (
        <div className="relative flex h-full flex-col">
          <div
            className={`flex items-center justify-between ${lg ? "p-4" : "p-[7%]"} pb-[5%]`}
            style={{ background: `${palette.deep}` }}
          >
            <span className={`${catCls} ${lg ? "" : "line-clamp-1"}`}>{label}</span>
            {diamond}
          </div>
          <div className={`flex flex-1 flex-col justify-between ${lg ? "p-5" : "p-[8%]"} pt-[6%]`}>
            <h3 className={`${titleCls} ${lg ? "line-clamp-6" : "line-clamp-5"}`}>{title}</h3>
            <div className="flex items-end justify-between gap-2">
              <p className={`${authorCls} line-clamp-1 opacity-80`}>{byline}</p>
              <span
                className={`${lg ? "text-[0.6rem]" : "text-[0.42rem]"} font-mono tracking-[0.2em] opacity-50`}
              >
                LBR
              </span>
            </div>
          </div>
        </div>
      );
      break;
    }
    case 2: {
      // ——— Watermark initial
      body = (
        <div className="relative flex h-full flex-col justify-between overflow-hidden">
          <span
            aria-hidden
            className={`pointer-events-none absolute -right-[6%] top-[-12%] font-display font-black italic leading-none ${
              lg ? "text-[11rem]" : "text-[24cqi]"
            }`}
            style={{ color: palette.accent, opacity: 0.22, fontVariationSettings: '"WONK" 1' }}
          >
            {initial}
          </span>
          <div className={`flex items-center justify-between ${lg ? "p-5" : "p-[8%]"}`}>
            <span className={catCls}>{label}</span>
            {diamond}
          </div>
          <div className={`${lg ? "p-5" : "p-[8%]"} relative`}>
            <h3 className={`${titleCls} ${lg ? "line-clamp-5" : "line-clamp-4"}`}>{title}</h3>
            <div
              className={`${lg ? "my-3 h-px w-10" : "my-[6%] h-px w-[26%]"}`}
              style={{ background: palette.accent }}
            />
            <p className={`${authorCls} line-clamp-1 opacity-80`}>{byline}</p>
          </div>
        </div>
      );
      break;
    }
    case 3: {
      // ——— Ruled: hairline rules bracketing the title
      body = (
        <div className={`flex h-full flex-col justify-between ${lg ? "p-5" : "p-[8%]"}`}>
          <div className="flex items-center gap-2">
            <span className="h-px flex-1" style={{ background: palette.hairline }} />
            <span className={`${catCls} line-clamp-1 shrink-0`}>{label}</span>
            <span className="h-px flex-1" style={{ background: palette.hairline }} />
          </div>
          <div className="text-left">
            <h3 className={`${titleCls} ${lg ? "line-clamp-6" : "line-clamp-5"}`}>{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-px flex-1" style={{ background: palette.hairline }} />
            <p className={`${authorCls} line-clamp-1 shrink-0 opacity-80`}>{byline}</p>
            <span className="h-px flex-[0.3]" style={{ background: palette.hairline }} />
            {diamond}
          </div>
        </div>
      );
      break;
    }
    default: {
      // ——— Framed: double hairline frame, centred composition
      body = (
        <div className={`flex h-full flex-col ${lg ? "p-5" : "p-[8%]"}`}>
          <div
            className={`flex flex-1 flex-col items-center justify-between border ${
              lg ? "p-6" : "p-[10%]"
            }`}
            style={{ borderColor: palette.hairline }}
          >
            <div className="flex w-full items-center justify-between">
              {diamond}
              <span className={`${catCls} line-clamp-1`}>{label}</span>
              {diamond}
            </div>
            <h3
              className={`${titleCls} ${lg ? "line-clamp-6" : "line-clamp-5"} text-center`}
            >
              {title}
            </h3>
            <div className="flex w-full flex-col items-center gap-[0.4em]">
              <span
                className={`h-px ${lg ? "w-14" : "w-[30%]"}`}
                style={{ background: palette.accent }}
              />
              <p className={`${authorCls} line-clamp-1 max-w-full text-center opacity-80`}>
                {byline}
              </p>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div
      className={`cover-shadow relative aspect-[2/3] w-full overflow-hidden rounded-[3px] ${className}`}
      style={shared}
    >
      {spine}
      {body}
    </div>
  );
}
