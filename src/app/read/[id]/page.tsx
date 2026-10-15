import { notFound } from "next/navigation";

import { ReaderShell } from "@/components/reader-shell";
import { getBook } from "@/lib/library";

export const dynamic = "force-dynamic";

export default async function ReadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const book = await getBook(id);
  if (!book) notFound();
  return <ReaderShell book={book} />;
}
