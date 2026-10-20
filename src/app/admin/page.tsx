import { Suspense } from "react";
import type { Metadata } from "next";
import { LogOut, Pin } from "lucide-react";
import { logout } from "@/app/actions";
import { CategoryForm } from "@/components/CategoryForm";
import { CategoryGrid, GridSkeleton } from "@/components/CategoryGrid";
import { ItemForm } from "@/components/ItemForm";
import { LibraryList } from "@/components/LibraryList";
import { LoginForm } from "@/components/LoginForm";
import { isAdmin } from "@/lib/auth";
import { categoryOptions, getCategories, getLibrary, topLevel } from "@/lib/data";
import { googleConfig } from "@/lib/google";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default function AdminPage({ searchParams }: PageProps<"/admin">) {
  return (
    <Suspense fallback={<GridSkeleton count={2} />}>
      <Admin searchParams={searchParams} />
    </Suspense>
  );
}

async function Admin({ searchParams }: { searchParams: PageProps<"/admin">["searchParams"] }) {
  if (!(await isAdmin())) {
    const { error } = await searchParams;
    return <LoginForm googleEnabled={googleConfig() !== null} error={typeof error === "string" ? error : undefined} />;
  }
  const [all, library] = await Promise.all([getCategories(), getLibrary()]);
  const categories = topLevel(all);
  const parents = categories.map(({ id, name }) => ({ id, name }));

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-4xl">Admin</h1>
          <p className="mt-2 flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
            Use <Pin className="inline size-4" /> to put something on top, then the arrows to set its order.
          </p>
        </div>
        <form action={logout}>
          <button type="submit" className="btn-ghost">
            <LogOut className="size-4" /> Sign out
          </button>
        </form>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-sm font-medium text-zinc-500">Categories ({categories.length})</h2>
            <CategoryGrid categories={categories} isAdmin parents={parents} />
          </section>
          <section className="space-y-4">
            <div>
              <h2 className="text-sm font-medium text-zinc-500">Item library ({library.length})</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Every item is stored once. Use the arrows to set the order. Add an item to more categories from a category page with “From library”.
              </p>
            </div>
            <LibraryList items={library} />
          </section>
        </div>
        <aside className="space-y-6 lg:sticky lg:top-20">
          <CategoryForm parents={parents} />
          <div className="card p-5 sm:p-6">
            <h2 className="mb-4 font-semibold tracking-tight">Add a new item</h2>
            <ItemForm categories={categoryOptions(all)} />
          </div>
        </aside>
      </div>
    </div>
  );
}
