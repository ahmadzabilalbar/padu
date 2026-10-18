import Link from "next/link";
import { ArrowUpRight, FolderOpen, Pin } from "lucide-react";
import type { Category } from "@/lib/types";
import { AdminControls } from "./AdminControls";

type Props = {
  categories: Category[];
  isAdmin: boolean;
  /** Full-width layout (no sidebar), so allow a third column on large screens. */
  wide?: boolean;
};

export function CategoryGrid({ categories, isAdmin, wide }: Props) {
  if (categories.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-2 px-6 py-16 text-center">
        <FolderOpen className="size-8 text-zinc-300 dark:text-zinc-700" />
        <p className="font-medium">No categories yet</p>
        <p className="text-sm text-zinc-500">
          {isAdmin ? "Create the first one to get the board started." : "Check back soon."}
        </p>
      </div>
    );
  }

  const pinned = categories.filter((c) => c.is_pinned);

  return (
    <ul className={`grid gap-3 sm:grid-cols-2 ${wide ? "lg:grid-cols-3" : ""}`}>
      {categories.map((c) => {
        const idx = pinned.findIndex((p) => p.id === c.id);
        return (
          <li key={c.id} className="relative">
            <Link
              href={`/c/${c.slug}`}
              className={`card group flex h-full flex-col p-5 transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:hover:border-zinc-700 ${
                c.is_pinned ? "border-accent-500/40 ring-1 ring-accent-500/10 dark:border-accent-500/30" : ""
              }`}
            >
              <div className="flex items-center gap-2 pr-24">
                {c.is_pinned && <Pin className="size-4 shrink-0 text-accent-600 dark:text-accent-400" aria-label="Pinned" />}
                <h3 className="truncate font-semibold tracking-tight">{c.name}</h3>
              </div>
              <p className="mt-1 line-clamp-2 flex-1 text-sm text-zinc-500">{c.description || "No description."}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {c.item_count} item{c.item_count === 1 ? "" : "s"}
                </span>
                <ArrowUpRight className="size-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-zinc-900 dark:group-hover:text-zinc-100" />
              </div>
            </Link>
            {isAdmin && (
              <div className="absolute top-3 right-3">
                <AdminControls
                  kind="category"
                  id={c.id}
                  name={c.name}
                  pinned={c.is_pinned}
                  canMoveUp={idx > 0}
                  canMoveDown={idx >= 0 && idx < pinned.length - 1}
                />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function GridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton h-36" />
      ))}
    </div>
  );
}
