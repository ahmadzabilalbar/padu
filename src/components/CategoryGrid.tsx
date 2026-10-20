import Link from "next/link";
import { FolderOpen, Pin } from "lucide-react";
import type { Category } from "@/lib/types";
import { isHiddenIn } from "@/lib/visibility";
import { moveBounds } from "@/lib/order";
import { AdminControls } from "./AdminControls";
import { CardItems } from "./CardItems";
import { HiddenTag } from "./HiddenTag";

type Props = {
  /** The cards to show, in order. */
  categories: Category[];
  /** Every category, for parent names and each card's siblings (for the arrows). Defaults to `categories`. */
  all?: Category[];
  /** Show the main category's name under a sub-category's name. */
  showParent?: boolean;
  isAdmin: boolean;
  /** Full-width layout (no sidebar): up to 4 columns. With a sidebar, 4 only on very wide screens. */
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
    <ul className={`grid gap-3 sm:grid-cols-2 ${wide ? "lg:grid-cols-3 xl:grid-cols-4" : "xl:grid-cols-3 2xl:grid-cols-4"}`}>
      {categories.map((c) => {
        const parent = showParent && c.parent_id ? byId.get(c.parent_id) : undefined;
        const siblings = all.filter((s) => s.parent_id === c.parent_id);
        const hidden = isHiddenIn(all, c);
        return (
          <li key={c.id}>
            {/* The card lists its items itself, so it doesn't open a page. Only the admin gets a link, to manage items. */}
            <div
              className={`card flex h-full flex-col p-5 ${hidden ? "border-dashed opacity-60" : ""} ${
                c.is_pinned ? "border-accent-500/40 ring-1 ring-accent-500/10 dark:border-accent-500/30" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                {c.is_pinned && <Pin className="size-4 shrink-0 text-accent-600 dark:text-accent-400" aria-label="Pinned" />}
                <h3 className="min-w-0 truncate font-semibold tracking-tight">
                  {isAdmin ? (
                    <Link href={`/c/${c.slug}`} className="hover:text-accent-600 hover:underline dark:hover:text-accent-400">
                      {c.name}
                    </Link>
                  ) : (
                    c.name
                  )}
                </h3>
                {isAdmin && (
                  <div className="-my-1.5 -mr-2 ml-auto shrink-0">
                    <AdminControls
                      target={{
                        kind: "category",
                        values: { id: c.id, name: c.name, parent_id: c.parent_id },
                        parents: c.subcategories.length ? undefined : parents,
                      }}
                      row={{ kind: "category", id: c.id }}
                      pinned={c.is_pinned}
                      hidden={c.is_hidden}
                      {...moveBounds(siblings, c)}
                    />
                  </div>
                )}
              </div>
              {(parent || hidden) && (
                <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-zinc-500">
                  {parent?.name}
                  {hidden && <HiddenTag />}
                </p>
              )}
              <div className="mt-3 flex-1">
                <CardItems items={c.preview} />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function GridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton h-36" />
      ))}
    </div>
  );
}
