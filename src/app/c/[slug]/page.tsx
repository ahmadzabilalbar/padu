import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Pin, Plus } from "lucide-react";
import { AdminControls } from "@/components/AdminControls";
import { ItemBoard } from "@/components/ItemBoard";
import { ItemForm } from "@/components/ItemForm";
import { isAdmin } from "@/lib/auth";
import { getCategoryBySlug, getItems } from "@/lib/data";

export async function generateMetadata({ params }: PageProps<"/c/[slug]">) {
  const category = await getCategoryBySlug((await params).slug);
  return { title: category?.name ?? "Not found", description: category?.description ?? undefined };
}

export default function CategoryPage({ params }: PageProps<"/c/[slug]">) {
  return (
    <div className="space-y-6">
      <Link href="/" className="btn-ghost -ml-3 px-3 py-1.5">
        <ChevronLeft className="size-4" /> All categories
      </Link>
      <Suspense fallback={<BoardSkeleton />}>
        <Board params={params} />
      </Suspense>
    </div>
  );
}

async function Board({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();
  const [items, admin] = await Promise.all([getItems(category.id), isAdmin()]);

  return (
    <>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {category.is_pinned && <Pin className="size-5 text-accent-600 dark:text-accent-400" aria-label="Pinned" />}
            <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-4xl">{category.name}</h1>
          </div>
          {category.description && <p className="mt-2 text-zinc-600 dark:text-zinc-400">{category.description}</p>}
        </div>
        {admin && (
          <div className="flex items-center gap-2">
            <div className="card px-1.5 py-1">
              <AdminControls
                target={{
                  kind: "category",
                  values: { id: category.id, name: category.name, description: category.description },
                }}
                pinned={category.is_pinned}
                canMoveUp={false}
                canMoveDown={false}
                afterDelete="/"
              />
            </div>
            <a href="#add" className="btn-accent lg:hidden">
              <Plus className="size-4" /> Add item
            </a>
          </div>
        )}
      </header>

      {admin ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
          <ItemBoard items={items} isAdmin />
          <aside id="add" className="card scroll-mt-20 p-5 sm:p-6 lg:sticky lg:top-20">
            <h2 className="mb-4 font-semibold tracking-tight">Add to {category.name}</h2>
            <ItemForm categoryId={category.id} />
          </aside>
        </div>
      ) : (
        <ItemBoard items={items} isAdmin={false} />
      )}
    </>
  );
}

function BoardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-12 w-2/3 max-w-md" />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-2.5">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="skeleton h-24" />
          ))}
        </div>
        <div className="skeleton h-96" />
      </div>
    </div>
  );
}
