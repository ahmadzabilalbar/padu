import Link from "next/link";
import { FolderOpen, Layers, Pin } from "lucide-react";
import type { Category } from "@/lib/types";
import { AdminControls } from "./AdminControls";

type Props = {
  categories: Category[];
  isAdmin: boolean;
  /** Full-width layout (no sidebar), so allow a third column on large screens. */
  wide?: boolean;
  /** Top-level categories, offered as "Inside" choices when editing. */
  parents?: { id: string; name: string }[];
  /** Sub-category grid: shorter empty state wording. */
  sub?: boolean;
};

export function CategoryGrid({ categories, isAdmin, wide, parents = [], sub }: Props) {
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
              <div className={`flex items-center gap-2 ${isAdmin ? "pr-24" : ""}`}>
                {c.is_pinned && <Pin className="size-4 shrink-0 text-accent-600 dark:text-accent-400" aria-label="Pinned" />}
                <h3 className="truncate font-semibold tracking-tight">{c.name}</h3>
              </div>
              {c.description && <p className="mt-1 line-clamp-1 text-sm text-zinc-500">{c.description}</p>}
              {c.subcategories.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Sub-categories">
                  {c.subcategories.slice(0, 5).map((s) => (
                    <li
                      key={s.id}
                      className="inline-flex items-center gap-1 rounded-full bg-accent-500/10 px-2 py-0.5 text-xs font-medium text-accent-700 dark:text-accent-400"
                    >
                      <Layers className="size-3" />
                      {s.name}
                    </li>
                  ))}
                  {c.subcategories.length > 5 && (
                    <li className="px-1 py-0.5 text-xs text-zinc-500">+{c.subcategories.length - 5} more</li>
                  )}
                </ul>
              )}
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
                  !c.subcategories.length && <p className="text-sm text-zinc-400 dark:text-zinc-600">No items yet.</p>
                )}
              </div>
            </Link>
            {isAdmin && (
              <div className="absolute top-3 right-3">
                <AdminControls
                  target={{
                    kind: "category",
                    values: { id: c.id, name: c.name, description: c.description, parent_id: c.parent_id },
                    parents: c.subcategories.length ? undefined : parents,
                  }}
                  row={{ kind: "category", id: c.id }}
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
