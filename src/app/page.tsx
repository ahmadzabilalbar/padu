import { Suspense } from "react";
import { CategoryForm } from "@/components/CategoryForm";
import { CategoryGrid, GridSkeleton } from "@/components/CategoryGrid";
import { isAdmin } from "@/lib/auth";
import { getCategories, homeCards, topLevel } from "@/lib/data";

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <Suspense fallback={<GridSkeleton />}>
      <Categories searchParams={searchParams} />
    </Suspense>
  );
}

async function Categories({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  // Reading the cookie first keeps the DB out of the build; the list itself is still served from cache.
  const admin = await isAdmin();
  const all = await getCategories();
  const parents = topLevel(all).map(({ id, name }) => ({ id, name }));

  // ?c=<main category slug> (the chips in the top bar) shows only that category's cards.
  const { c } = await searchParams;
  const main = topLevel(all).find((m) => m.slug === c);
  const cards = homeCards(all).filter((card) => !main || card.id === main.id || card.parent_id === main.id);

  const list = (
    <section aria-labelledby="categories-heading">
      <h1 id="categories-heading" className="sr-only">
        Categories
      </h1>
      <CategoryGrid categories={cards} all={all} showParent isAdmin={admin} wide={!admin} parents={parents} />
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
