"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, FolderOpen, FolderPlus, Pin, Plus, Search, X } from "lucide-react";
import { createCategory } from "@/app/actions";
import type { Category } from "@/lib/types";
import { moveBounds } from "@/lib/order";
import { AdminControls } from "./AdminControls";
import { FormMessage } from "./FormMessage";
import { useFormAction } from "./useFormAction";

type Parent = { id: string; name: string };

/**
 * Every main category with its sub-categories nested underneath, in board
 * order. Reorder, pin, edit, delete and add sub-categories in place.
 */
export function CategoryManager({ categories }: { categories: Category[] }) {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [addingTo, setAddingTo] = useState<string | null>(null);

  const mains = useMemo(() => categories.filter((c) => !c.parent_id), [categories]);
  const childrenOf = useMemo(() => {
    const map = new Map<string, Category[]>();
    for (const c of categories) if (c.parent_id) map.set(c.parent_id, [...(map.get(c.parent_id) ?? []), c]);
    return map;
  }, [categories]);
  const parents: Parent[] = mains.map(({ id, name }) => ({ id, name }));

  const q = query.trim().toLowerCase();
  const matches = (c: Category) => !q || c.name.toLowerCase().includes(q);

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const visible = mains.filter((m) => matches(m) || (childrenOf.get(m.id) ?? []).some(matches));

  return (
    <div className="space-y-4">
      <QuickAdd placeholder="New main category, e.g. Makan" />

      {categories.length > 0 && (
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Filter ${categories.length} categor${categories.length === 1 ? "y" : "ies"}…`}
            aria-label="Filter categories"
            className="field pl-9"
          />
        </div>
      )}

      {mains.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 px-6 py-16 text-center">
          <FolderOpen className="size-8 text-zinc-300 dark:text-zinc-700" />
          <p className="font-medium">No categories yet</p>
          <p className="text-sm text-zinc-500">Add the first main category above.</p>
        </div>
      ) : visible.length === 0 ? (
        <p className="card px-6 py-10 text-center text-sm text-zinc-500">No categories match “{query}”.</p>
      ) : (
        <ul className="card divide-y divide-zinc-200/80 overflow-hidden dark:divide-zinc-800">
          {visible.map((main) => {
            const children = childrenOf.get(main.id) ?? [];
            // While filtering, show every match; otherwise respect collapsed state.
            const shownChildren = q ? children.filter((c) => matches(c) || matches(main)) : children;
            const open = q ? true : !collapsed.has(main.id);
            return (
              <li key={main.id}>
                <Row
                  category={main}
                  siblings={mains}
                  parents={children.length ? undefined : parents}
                  expander={
                    children.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => toggle(main.id)}
                        aria-expanded={open}
                        aria-label={open ? `Collapse ${main.name}` : `Expand ${main.name}`}
                        className="icon-btn size-7 shrink-0"
                      >
                        <ChevronRight className={`size-4 transition ${open ? "rotate-90" : ""}`} />
                      </button>
                    ) : (
                      <span className="size-7 shrink-0" aria-hidden />
                    )
                  }
                  extra={
                    <button
                      type="button"
                      title="Add a sub-category"
                      aria-label={`Add a sub-category to ${main.name}`}
                      className={`icon-btn ${addingTo === main.id ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100" : ""}`}
                      onClick={() => {
                        setAddingTo(addingTo === main.id ? null : main.id);
                        setCollapsed((prev) => {
                          const next = new Set(prev);
                          next.delete(main.id);
                          return next;
                        });
                      }}
                    >
                      <FolderPlus className="size-4" />
                    </button>
                  }
                />
                {open && (shownChildren.length > 0 || addingTo === main.id) && (
                  <ul className="ml-6 border-l border-zinc-200 pb-2 sm:ml-9 dark:border-zinc-800">
                    {shownChildren.map((child) => (
                      <li key={child.id}>
                        <Row category={child} siblings={children} parents={parents} sub />
                      </li>
                    ))}
                    {addingTo === main.id && (
                      <li className="py-2 pr-3 pl-4">
                        <QuickAdd
                          parent={{ id: main.id, name: main.name }}
                          placeholder={`New sub-category in ${main.name}, e.g. Mi Goreng`}
                          onClose={() => setAddingTo(null)}
                          autoFocus
                        />
                      </li>
                    )}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Row({
  category: c,
  siblings,
  parents,
  sub,
  expander,
  extra,
}: {
  category: Category;
  siblings: Category[];
  parents: Parent[] | undefined;
  sub?: boolean;
  expander?: React.ReactNode;
  extra?: React.ReactNode;
}) {
  const subs = c.subcategories.length;
  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 py-2.5 pr-2 sm:pr-3 ${sub ? "pl-4" : "pl-2"}`}>
      {expander}
      <div className="flex min-w-0 flex-1 basis-40 items-center gap-2">
        {c.is_pinned && <Pin className="size-3.5 shrink-0 text-accent-600 dark:text-accent-400" aria-label="Pinned" />}
        <div className="min-w-0">
          <Link
            href={`/c/${c.slug}`}
            className={`block truncate hover:text-accent-600 hover:underline dark:hover:text-accent-400 ${sub ? "text-sm" : "font-medium"}`}
          >
            {c.name}
          </Link>
          <p className="truncate text-xs text-zinc-500">
            {subs > 0 && `${subs} sub-categor${subs === 1 ? "y" : "ies"} · `}
            {c.item_count} item{c.item_count === 1 ? "" : "s"}
          </p>
        </div>
      </div>
      <div className="ml-auto flex items-center">
        {extra}
        <AdminControls
          target={{
            kind: "category",
            values: { id: c.id, name: c.name, parent_id: c.parent_id },
            parents,
          }}
          row={{ kind: "category", id: c.id }}
          pinned={c.is_pinned}
          {...moveBounds(siblings, c)}
        />
      </div>
    </div>
  );
}

/** One-line form to add a main category, or a sub-category of `parent`, without leaving the page. */
function QuickAdd({
  parent,
  placeholder,
  onClose,
  autoFocus,
}: {
  parent?: Parent;
  placeholder: string;
  onClose?: () => void;
  autoFocus?: boolean;
}) {
  const { state, pending, formRef, onSubmit } = useFormAction(createCategory);
  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-2">
      <input type="hidden" name="stay" value="1" />
      {parent && <input type="hidden" name="parentId" value={parent.id} />}
      <div className="flex gap-2">
        <input
          name="name"
          required
          maxLength={60}
          placeholder={placeholder}
          aria-label={parent ? `Sub-category name for ${parent.name}` : "Main category name"}
          autoFocus={autoFocus}
          onKeyDown={(e) => e.key === "Escape" && onClose?.()}
          className={`field ${parent ? "py-2" : ""}`}
        />
        <button type="submit" disabled={pending} className={`${parent ? "btn-accent py-2" : "btn-primary"} shrink-0`}>
          <Plus className="size-4" />
          <span className="hidden sm:inline">{pending ? "Adding…" : "Add"}</span>
        </button>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Cancel" className="icon-btn size-auto shrink-0 px-2">
            <X className="size-4" />
          </button>
        )}
      </div>
      <FormMessage state={state} />
    </form>
  );
}
