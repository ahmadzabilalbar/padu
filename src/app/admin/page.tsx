import { Suspense } from "react";
import type { Metadata } from "next";
import { LogOut, Pin } from "lucide-react";
import { logout } from "@/app/actions";
import { CategoryForm } from "@/components/CategoryForm";
import { CategoryGrid, GridSkeleton } from "@/components/CategoryGrid";
import { ItemForm } from "@/components/ItemForm";
import { LoginForm } from "@/components/LoginForm";
import { isAdmin } from "@/lib/auth";
import { getCategories } from "@/lib/data";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default function AdminPage() {
  return (
    <Suspense fallback={<GridSkeleton count={2} />}>
      <Admin />
    </Suspense>
  );
}

async function Admin() {
  if (!(await isAdmin())) return <LoginForm />;
  const categories = await getCategories();

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
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-zinc-500">Categories ({categories.length})</h2>
          <CategoryGrid categories={categories} isAdmin />
        </section>
        <aside className="space-y-6 lg:sticky lg:top-20">
          <CategoryForm />
          <div className="card p-5 sm:p-6">
            <h2 className="mb-4 font-semibold tracking-tight">Add an item to a category</h2>
            {categories.length ? (
              <ItemForm categories={categories.map(({ id, name }) => ({ id, name }))} isAdmin />
            ) : (
              <p className="text-sm text-zinc-500">Create a category first.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
