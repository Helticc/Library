import { FileStack, HardDriveDownload, Rows3, ScanText } from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { Uploader } from "@/components/uploader";
import { listCategories } from "@/lib/library";

export const dynamic = "force-dynamic";

const STEPS = [
  {
    n: "01",
    title: "Drop the files",
    body: "One PDF or fifty — drag a whole folder's worth in at once. Large books are streamed, never stuck.",
  },
  {
    n: "02",
    title: "Choose the shelf",
    body: "Titles and authors fill themselves in from the filenames. Just confirm the category for each volume.",
  },
  {
    n: "03",
    title: "Read anywhere",
    body: "Every imported book lands on its shelf, instantly searchable and readable in the browser.",
  },
];

export default async function UploadPage() {
  const categories = await listCategories();

  return (
    <div>
      <section className="mx-auto w-full max-w-[1100px] px-5 pb-20 pt-16 sm:px-8 sm:pt-24">
        <p className="rise mb-5 flex items-center gap-3 font-mono text-[0.62rem] uppercase tracking-[0.32em] text-amber-400">
          <span className="h-px w-10 bg-amber-500/70" />
          Import · New acquisitions
        </p>
        <h1
          className="rise font-display text-[clamp(2.6rem,6.5vw,5.2rem)] font-semibold leading-[1.02] tracking-tight"
          style={{ animationDelay: "80ms" }}
        >
          Add to <em className="font-light italic text-amber-300">the stacks.</em>
        </h1>
        <p
          className="rise mt-6 max-w-2xl text-base leading-relaxed text-cream-500 sm:text-lg"
          style={{ animationDelay: "160ms" }}
        >
          Stop hunting through folders. Bring every PDF book into one beautiful
          library — shelved by category and readable with a single click.
        </p>

        <div className="rise mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.05] sm:grid-cols-3" style={{ animationDelay: "240ms" }}>
          {STEPS.map((step) => (
            <div key={step.n} className="bg-ink-900 p-6">
              <p className="font-mono text-[0.6rem] tracking-[0.3em] text-amber-500">
                {step.n}
              </p>
              <h2 className="mt-3 font-display text-xl font-semibold">{step.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-cream-600">{step.body}</p>
            </div>
          ))}
        </div>

        <div className="rise mt-10" style={{ animationDelay: "320ms" }}>
          <Uploader categories={categories} />
        </div>

        <div className="rise mt-12 grid gap-6 border-t border-white/[0.06] pt-10 sm:grid-cols-3" style={{ animationDelay: "400ms" }}>
          <div className="flex items-start gap-3.5">
            <HardDriveDownload className="mt-0.5 size-5 shrink-0 text-amber-400" strokeWidth={1.5} />
            <p className="text-sm leading-relaxed text-cream-500">
              <span className="text-cream-100">Files stay on this machine.</span>{" "}
              Books are stored in your own deployment — no third-party cloud.
            </p>
          </div>
          <div className="flex items-start gap-3.5">
            <ScanText className="mt-0.5 size-5 shrink-0 text-amber-400" strokeWidth={1.5} />
            <p className="text-sm leading-relaxed text-cream-500">
              <span className="text-cream-100">Auto titles &amp; page counts.</span>{" "}
              Embedded PDF metadata is picked up during import wherever possible.
            </p>
          </div>
          <div className="flex items-start gap-3.5">
            <FileStack className="mt-0.5 size-5 shrink-0 text-amber-400" strokeWidth={1.5} />
            <p className="text-sm leading-relaxed text-cream-500">
              <span className="text-cream-100">Built for big libraries.</span>{" "}
              Multi-hundred-megabyte books stream to disk without breaking a sweat.
            </p>
          </div>
        </div>

        <div className="rise mt-10 flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-ink-900/60 px-6 py-5" style={{ animationDelay: "460ms" }}>
          <Rows3 className="size-5 shrink-0 text-amber-400" strokeWidth={1.5} />
          <p className="text-sm text-cream-500">
            <span className="text-cream-100">Available shelves:</span>{" "}
            {categories.map((c) => c.name).join(" · ")} — you can create your own any
            time from the library page.
          </p>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
