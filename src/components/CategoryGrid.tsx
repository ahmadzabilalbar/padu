import Link from "next/link";
import { FolderOpen, MapPin, Pin } from "lucide-react";
import { mapsUrl } from "@/lib/maps";
import type { Category } from "@/lib/types";
import { moveBounds } from "@/lib/order";
import { AdminControls } from "./AdminControls";

/** Gold, silver and bronze for the top three items on each card (the admin's order). */
const MEDALS = [
  { label: "Best", className: "bg-linear-to-br from-amber-200 to-amber-400 text-amber-900 ring-amber-500/40" },
  { label: "2nd best", className: "bg-linear-to-br from-zinc-100 to-zinc-300 text-zinc-700 ring-zinc-400/50" },
  { label: "3rd best", className: "bg-linear-to-br from-orange-300 to-orange-500 text-orange-950 ring-orange-600/40" },
];

/** Map icon in a card's item row. */
const ICON_LINK =
  "grid size-7 place-items-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-accent-600 dark:hover:bg-zinc-800 dark:hover:text-accent-400";

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
            {/* The card lists every item, so it doesn't open a page. Only the admin gets a link, to manage items. */}
            <div
              className={`card flex h-full flex-col p-5 ${
                c.is_pinned ? "border-accent-500/40 ring-1 ring-accent-500/10 dark:border-accent-500/30" : ""
              }`}
            >
              <div className={`flex items-center gap-2 ${isAdmin ? "pr-24" : ""}`}>
                {c.is_pinned && <Pin className="size-4 shrink-0 text-accent-600 dark:text-accent-400" aria-label="Pinned" />}
                <h3 className="truncate font-semibold tracking-tight">
                  {isAdmin ? (
                    <Link href={`/c/${c.slug}`} className="hover:text-accent-600 hover:underline dark:hover:text-accent-400">
                      {c.name}
                    </Link>
                  ) : (
                    c.name
                  )}
                </h3>
              </div>
              {parent && <p className="mt-0.5 truncate text-xs text-zinc-500">{parent.name}</p>}
              <div className="mt-3 flex-1">
                {c.preview.length ? (
                  <ul className="space-y-1.5 text-sm">
                    {c.preview.map((item, rank) => (
                      <li key={item.id} className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                        <span className="grid w-5 shrink-0 place-items-center">
                          {rank < MEDALS.length ? (
                            <span
                              title={MEDALS[rank].label}
                              aria-label={MEDALS[rank].label}
                              className={`grid size-5 place-items-center rounded-full text-[10px] font-bold shadow-sm ring-1 ring-inset ${MEDALS[rank].className}`}
                            >
                              {rank + 1}
                            </span>
                          ) : item.is_pinned ? (
                            <Pin className="size-3.5 text-accent-600 dark:text-accent-400" aria-label="Pinned" />
                          ) : (
                            <span className="size-1 rounded-full bg-zinc-400 dark:bg-zinc-600" aria-hidden />
                          )}
                        </span>
                        <span className={`min-w-0 flex-1 truncate ${rank === 0 ? "font-medium text-zinc-900 dark:text-zinc-100" : ""}`}>
                          {item.title}
                        </span>
                        {/* Fixed slot on the right, so the icons line up across rows. */}
                        <span className="-my-1 flex shrink-0 items-center">
                          {item.location ? (
                            <a
                              href={mapsUrl(item.location)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Google Maps"
                              aria-label={`${item.title} on Google Maps`}
                              className={ICON_LINK}
                            >
                              <MapPin className="size-4" />
                            </a>
                          ) : (
                            <span className="size-7" aria-hidden />
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-zinc-400 dark:text-zinc-600">No items yet.</p>
                )}
              </div>
            </div>
            {isAdmin && (
              <div className="absolute top-3 right-3 z-10">
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
