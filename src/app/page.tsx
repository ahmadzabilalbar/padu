import { Suspense } from "react";
import { CategoryGrid, GridSkeleton } from "@/components/CategoryGrid";
import { isAdmin } from "@/lib/auth";
import { getCategories, homeCards, topLevel } from "@/lib/data";
import { visibleCategories } from "@/lib/visibility";

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
  const everything = await getCategories();
  const parents = topLevel(everything).map(({ id, name }) => ({ id, name }));
  // The admin sees hidden categories (faded); visitors don't see them at all.
  const all = admin ? everything : visibleCategories(everything);

  // ?c=<main category slug> (the chips in the top bar) shows only that category's cards.
  const { c } = await searchParams;
  const main = topLevel(all).find((m) => m.slug === c);
  const cards = homeCards(all).filter((card) => !main || card.id === main.id || card.parent_id === main.id);

  // New categories are added in Admin → Categories, so the admin gets the same full-width grid.
  return (
    <section aria-labelledby="categories-heading">
      <h1 id="categories-heading" className="sr-only">
        Categories
      </h1>
      <CategoryGrid categories={cards} all={all} showParent isAdmin={admin} wide parents={parents} />
    </section>
  );
}
