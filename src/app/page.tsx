import { Suspense } from "react";
import { CategoryForm } from "@/components/CategoryForm";
import { CategoryGrid, GridSkeleton } from "@/components/CategoryGrid";
import { isAdmin } from "@/lib/auth";
import { getCategories } from "@/lib/data";

export default function Home() {
  return (
    <div className="space-y-10">
      <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        <section aria-labelledby="categories-heading" className="space-y-4">
          <h1 id="categories-heading" className="text-sm font-medium text-zinc-500">
            Categories
          </h1>
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
