import Link from "next/link";
import { FolderOpen, Pin } from "lucide-react";
import type { Category } from "@/lib/types";
import { moveBounds } from "@/lib/order";
import { AdminControls } from "./AdminControls";

type Props = {
  /** The cards to show, in order. */
  categories: Category[];
  /** Every category, for parent names and each card's siblings (for the arrows). Defaults to `categories`. */
  all?: Category[];
  /** Show the main category's name under a sub-category's name. */
  showParent?: boolean;
  isAdmin: boolean;
  /** Full-width layout (no sidebar), so allow a third column on large screens. */
  wide?: boolean;
  /** Top-level categories, offered as "Inside" choices when editing. */
  parents?: { id: string; name: string }[];
  /** Sub-category grid: shorter empty state wording. */
  sub?: boolean;
};

export function CategoryGrid({ categories, all = categories, showParent, isAdmin, wide, parents = [], sub }: Props) {
  const byId = new Map(all.map((c) => [c.id, c]));

  if (categories.length === 0) {
    if (sub) return null;
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

  return (
    <ul className={`grid gap-3 sm:grid-cols-2 ${wide ? "lg:grid-cols-3" : ""}`}>
      {categories.map((c) => {
        const parent = showParent && c.parent_id ? byId.get(c.parent_id) : undefined;
        const siblings = all.filter((s) => s.parent_id === c.parent_id);
        return (
          <li key={c.id} className="relative">
            <Link
              href={`/c/${c.slug}`}
              className={`card group flex h-full flex-col p-5 transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:hover:border-zinc-700 ${
                c.is_pinned ? "border-accent-500/40 ring-1 ring-accent-500/10 dark:border-accent-500/30" : ""
              }`}
            >
              <div className={`flex items-center gap-2 ${isAdmin ? "pr-24" : ""}`}>
                {c.is_pinned && <Pin className="size-4 shrink-0 text-accent-600 dark:text-accent-400" aria-label="Pinned" />}
                <h3 className="truncate font-semibold tracking-tight">{c.name}</h3>
              </div>
              {parent && <p className="mt-0.5 truncate text-xs text-zinc-500">{parent.name}</p>}
              <div className="mt-3 flex-1">
                {c.preview.length ? (
                  <ul className="space-y-1.5 text-sm">
                    {c.preview.map((item) => (
                      <li key={item.id} className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                        {item.is_pinned ? (
                          <Pin className="size-3.5 shrink-0 text-accent-600 dark:text-accent-400" aria-label="Pinned" />
                        ) : (
                          <span className="mx-[5px] size-1 shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-600" aria-hidden />
                        )}
                        <span className="truncate">{item.title}</span>
                      </li>
                    ))}
                    {c.item_count > c.preview.length && (
                      <li className="pl-[22px] text-xs text-zinc-500">+{c.item_count - c.preview.length} more</li>
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-zinc-400 dark:text-zinc-600">No items yet.</p>
                )}
              </div>
            </Link>
            {isAdmin && (
              <div className="absolute top-3 right-3">
                <AdminControls
                  target={{
                    kind: "category",
                    values: { id: c.id, name: c.name, parent_id: c.parent_id },
                    parents: c.subcategories.length ? undefined : parents,
                  }}
                  row={{ kind: "category", id: c.id }}
                  pinned={c.is_pinned}
                  {...moveBounds(siblings, c)}
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
