import { Suspense } from "react";
import { CategoryForm } from "@/components/CategoryForm";
import { CategoryGrid, GridSkeleton } from "@/components/CategoryGrid";
import { isAdmin } from "@/lib/auth";
import { getCategories, topLevel } from "@/lib/data";

export default function Home() {
  return (
    <Suspense fallback={<GridSkeleton />}>
      <Categories />
    </Suspense>
  );
}

async function Categories() {
  // Reading the cookie first keeps the DB out of the build; the list itself is still served from cache.
  const admin = await isAdmin();
  const categories = topLevel(await getCategories());
  const parents = categories.map(({ id, name }) => ({ id, name }));

  const list = (
    <section aria-labelledby="categories-heading">
      <h1 id="categories-heading" className="sr-only">
        Categories
      </h1>
      <CategoryGrid categories={categories} isAdmin={admin} wide={!admin} parents={parents} />
    </section>
  );

  if (!admin) return list;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
      {list}
      <aside className="lg:sticky lg:top-20">
        <CategoryForm parents={parents} />
      </aside>
    </div>
  );
}
