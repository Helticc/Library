import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BookCard } from "@/components/book-card";
import { BookCover } from "@/components/book-cover";
import { BookDetail } from "@/components/book-detail";
import { SiteFooter } from "@/components/site-footer";
import { getBook, listCategories, listRelatedBooks } from "@/lib/library";

export const dynamic = "force-dynamic";

export default async function BookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [book, categories] = await Promise.all([getBook(id), listCategories()]);
  if (!book) notFound();

  const related = await listRelatedBooks(book.categoryId, book.id, 10);

  return (
    <div>
      <section className="mx-auto w-full max-w-[1440px] px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
        <Link
          href="/"
          className="group mb-12 inline-flex items-center gap-2 font-mono text-[0.62rem] uppercase tracking-[0.24em] text-cream-600 transition-colors hover:text-amber-300"
        >
          <ChevronLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
          Back to the stacks
        </Link>

        <div className="grid gap-12 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-16 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="rise relative mx-auto w-full max-w-[300px] lg:mx-0 lg:max-w-none">
            <div
              aria-hidden
              className="absolute -inset-8 rounded-full opacity-70 blur-3xl"
              style={{
                background: `radial-gradient(50% 50% at 50% 45%, ${(book.categoryColor ?? "#8A8070") + "2e"}, transparent 70%)`,
              }}
            />
            <div className="relative rotate-[0.8deg] transition-transform duration-700 hover:rotate-0">
              <BookCover
                title={book.title}
                author={book.author}
                categoryName={book.categoryName}
                categoryColor={book.categoryColor}
                seed={book.coverSeed}
                size="lg"
              />
            </div>
          </div>

          <div className="rise" style={{ animationDelay: "120ms" }}>
            <BookDetail book={book} categories={categories} />
          </div>
        </div>

        {related.length > 0 ? (
          <section className="mt-28">
            <header className="mb-8 flex items-end gap-4">
              <h2 className="font-display text-3xl font-semibold tracking-tight">
                More from {book.categoryName}
              </h2>
              <span className="mb-3 hidden h-px min-w-16 flex-1 bg-gradient-to-r from-line to-transparent sm:block" />
            </header>
            <div className="no-scrollbar flex gap-6 overflow-x-auto pb-2 pt-2">
              {related.map((item) => (
                <BookCard key={item.id} book={item} mode="grid" heightRem={14} />
              ))}
            </div>
          </section>
        ) : null}
      </section>
      <SiteFooter />
    </div>
  );
}
