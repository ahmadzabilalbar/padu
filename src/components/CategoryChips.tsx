"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export type ChipCategory = { name: string; slug: string; subSlugs: string[] };

/**
 * Small filter chips for the main categories, in the top bar. A chip shows the
 * home page filtered to that category (/?c=slug), so it works from any page.
 */
export function CategoryChips({ categories }: { categories: ChipCategory[] }) {
  const pathname = usePathname();
  const filter = useSearchParams().get("c");

  // Highlight the filtered category on home, or the one being browsed on a category page.
  const viewing = pathname.startsWith("/c/") ? decodeURIComponent(pathname.slice(3)) : null;
  const active =
    pathname === "/"
      ? (filter ?? "")
      : (categories.find((c) => c.slug === viewing || c.subSlugs.includes(viewing ?? ""))?.slug ?? null);

  const chip = (selected: boolean) =>
    `shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition ${
      selected
        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
        : "text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
    }`;

  return (
    <nav aria-label="Filter by category" className="-mx-1 flex gap-1 overflow-x-auto px-1 mask-r-from-85% [scrollbar-width:none]">
      <Link href="/" scroll={false} aria-current={active === "" ? "page" : undefined} className={chip(active === "")}>
        All
      </Link>
      {categories.map((c) => (
        <Link
          key={c.slug}
          href={`/?c=${encodeURIComponent(c.slug)}`}
          scroll={false}
          aria-current={active === c.slug ? "page" : undefined}
          className={chip(active === c.slug)}
        >
          {c.name}
        </Link>
      ))}
    </nav>
  );
}
