import { Suspense } from "react";
import { CategoryForm } from "@/components/CategoryForm";
import { CategoryGrid, GridSkeleton } from "@/components/CategoryGrid";
import { isAdmin } from "@/lib/auth";
import { getCategories } from "@/lib/data";

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
          One board.{" "}
          <span className="bg-linear-to-r from-accent-600 to-fuchsia-500 bg-clip-text text-transparent">
            Everyone’s picks.
          </span>
        </h1>
        <p className="mt-3 text-zinc-600 sm:text-lg dark:text-zinc-400">
          Open a category, add items, and sort them any way you like. The best ones get pinned to the top.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        <section aria-labelledby="categories-heading" className="space-y-4">
          <h2 id="categories-heading" className="text-sm font-medium text-zinc-500">
            Categories
          </h2>
          <Suspense fallback={<GridSkeleton />}>
            <Categories />
          </Suspense>
        </section>
        <aside className="lg:sticky lg:top-20">
          <CategoryForm />
        </aside>
      </div>
    </div>
  );
}

async function Categories() {
  // Reading the cookie first keeps the DB out of the build; the list itself is still served from cache.
  const admin = await isAdmin();
  const categories = await getCategories();
  return <CategoryGrid categories={categories} isAdmin={admin} />;
}
