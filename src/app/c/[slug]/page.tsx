import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, Pin, Plus } from "lucide-react";
import { AdminControls } from "@/components/AdminControls";
import { CategoryForm } from "@/components/CategoryForm";
import { CategoryGrid } from "@/components/CategoryGrid";
import { ItemBoard } from "@/components/ItemBoard";
import { ItemForm } from "@/components/ItemForm";
import { isAdmin } from "@/lib/auth";
import { getCategories, getCategoryBySlug, getItems, getLibrary, topLevel } from "@/lib/data";

export async function generateMetadata({ params }: PageProps<"/c/[slug]">) {
  const found = await getCategoryBySlug((await params).slug);
  if (!found) return { title: "Not found" };
  const { category, parent } = found;
  return {
    title: parent ? `${category.name} · ${parent.name}` : category.name,
  };
}

export default function CategoryPage({ params }: PageProps<"/c/[slug]">) {
  return (
    <div className="space-y-6">
      <Suspense fallback={<BoardSkeleton />}>
        <Board params={params} />
      </Suspense>
    </div>
  );
}

async function Board({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = await getCategoryBySlug(slug);
  if (!found) notFound();
  const { category, parent, children } = found;
  const [items, admin] = await Promise.all([getItems(category.id), isAdmin()]);
  const [library, parents] = admin
    ? await Promise.all([getLibrary(), getCategories().then((all) => topLevel(all).map(({ id, name }) => ({ id, name })))])
    : [[], []];
  const hasChildren = children.length > 0;

  return (
    <>
      <nav aria-label="Breadcrumb" className="-ml-3 flex items-center gap-0.5 text-sm">
        <Link href="/" className="btn-ghost px-3 py-1.5">
          <ChevronLeft className="size-4" /> All categories
        </Link>
        {parent && (
          <>
            <ChevronRight className="size-4 text-zinc-400" aria-hidden />
            <Link href={`/c/${parent.slug}`} className="btn-ghost px-3 py-1.5">
              {parent.name}
            </Link>
          </>
        )}
      </nav>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {category.is_pinned && <Pin className="size-5 text-accent-600 dark:text-accent-400" aria-label="Pinned" />}
            <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-4xl">{category.name}</h1>
          </div>
        </div>
        {admin && (
          <div className="flex items-center gap-2">
            <div className="card px-1.5 py-1">
              <AdminControls
                target={{
                  kind: "category",
                  values: {
                    id: category.id,
                    name: category.name,
                    parent_id: category.parent_id,
                  },
                  parents: hasChildren ? undefined : parents,
                }}
                row={{ kind: "category", id: category.id }}
                pinned={category.is_pinned}
                canMoveUp={false}
                canMoveDown={false}
                afterDelete={parent ? `/c/${parent.slug}` : "/"}
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
          <div className="space-y-8">
            {hasChildren && (
              <section className="space-y-4">
                <h2 className="text-sm font-medium text-zinc-500">Sub-categories ({children.length})</h2>
                <CategoryGrid categories={children} isAdmin parents={parents} sub />
              </section>
            )}
            <section className="space-y-4">
              {hasChildren && <h2 className="text-sm font-medium text-zinc-500">Items in {category.name}</h2>}
              <ItemBoard items={items} categoryId={category.id} isAdmin />
            </section>
          </div>
          <aside className="space-y-6 lg:sticky lg:top-20">
            <div id="add" className="card scroll-mt-20 p-5 sm:p-6">
              <h2 className="mb-4 font-semibold tracking-tight">Add to {category.name}</h2>
              <ItemForm categoryId={category.id} library={library} />
            </div>
            {!parent && <CategoryForm parent={{ id: category.id, name: category.name }} />}
          </aside>
        </div>
      ) : (
        <div className="space-y-8">
          {hasChildren && (
            <section aria-label="Sub-categories">
              <CategoryGrid categories={children} isAdmin={false} wide sub />
            </section>
          )}
          {/* A parent that only groups sub-categories needn't show an empty board. */}
          {(items.length > 0 || !hasChildren) && (
            <section className="space-y-4">
              {hasChildren && <h2 className="text-sm font-medium text-zinc-500">More in {category.name}</h2>}
              <ItemBoard items={items} categoryId={category.id} isAdmin={false} />
            </section>
          )}
        </div>
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
