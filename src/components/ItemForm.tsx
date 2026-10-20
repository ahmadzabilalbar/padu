"use client";

import { useMemo, useState } from "react";
import { Library, MapPin, Pin, Plus, Search } from "lucide-react";
import { addExistingItem, createItem } from "@/app/actions";
import type { LibraryItem } from "@/lib/types";
import { FormMessage } from "./FormMessage";
import { ItemFields } from "./ItemFields";
import { useFormAction } from "./useFormAction";

type Props =
  /** Board page: add to this category, either a new item or one from the library. */
  | { categoryId: string; library: LibraryItem[]; categories?: never }
  /** Admin dashboard: a new item, placed in any of these categories (or none). */
  | { categoryId?: never; library?: never; categories: { id: string; name: string }[] };

export function ItemForm(props: Props) {
  const [mode, setMode] = useState<"new" | "library">("new");

  if (!props.categoryId) return <NewItemForm categories={props.categories} />;

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Add item" className="grid grid-cols-2 gap-1 rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-950">
        {(
          [
            ["new", "New item", Plus],
            ["library", "From library", Library],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={mode === key}
            onClick={() => setMode(key)}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              mode === key
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>
      {mode === "new" ? (
        <NewItemForm categoryId={props.categoryId} />
      ) : (
        <LibraryPicker categoryId={props.categoryId} library={props.library} />
      )}
    </div>
  );
}

function NewItemForm({ categoryId, categories }: { categoryId?: string; categories?: { id: string; name: string }[] }) {
  const { state, pending, formRef, onSubmit } = useFormAction(createItem);

  return (
    <form ref={formRef} onSubmit={onSubmit} className="relative space-y-4">
      {categoryId ? (
        <input type="hidden" name="categoryId" value={categoryId} />
      ) : (
        <fieldset>
          <legend className="label">
            Categories <span className="text-zinc-400">(pick any, or none to just save it to the library)</span>
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {categories?.map((c) => (
              <label
                key={c.id}
                className="cursor-pointer rounded-full border border-zinc-200 px-3 py-1 text-sm transition has-checked:border-accent-500 has-checked:bg-accent-500/10 has-checked:text-accent-700 dark:border-zinc-800 dark:has-checked:text-accent-400"
              >
                <input type="checkbox" name="categoryId" value={c.id} className="sr-only" />
                {c.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <ItemFields id="item" />
      <PinToggle />
      <FormMessage state={state} />
      <button type="submit" disabled={pending} className="btn-accent w-full">
        <Plus className="size-4" />
        {pending ? "Adding…" : categoryId ? "Add item" : "Save item"}
      </button>
    </form>
  );
}

/** Pick a stored item to put on this category's board. */
function LibraryPicker({ categoryId, library }: { categoryId: string; library: LibraryItem[] }) {
  const { state, pending, formRef, onSubmit } = useFormAction(addExistingItem);
  const [query, setQuery] = useState("");

  const available = useMemo(() => library.filter((i) => !i.categories.some((c) => c.id === categoryId)), [library, categoryId]);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return available.filter((i) => !q || [i.title, i.body, i.location].some((v) => v?.toLowerCase().includes(q)));
  }, [available, query]);

  if (!available.length) {
    return (
      <p className="rounded-xl bg-zinc-100 px-4 py-6 text-center text-sm text-zinc-500 dark:bg-zinc-800/50">
        {library.length ? "Every item in the library is already here." : "The library is empty. Add a new item first."}
      </p>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="categoryId" value={categoryId} />
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${available.length} stored item${available.length === 1 ? "" : "s"}…`}
          aria-label="Search the library"
          className="field pl-9"
        />
      </div>
      <fieldset className="max-h-72 space-y-1 overflow-y-auto rounded-xl border border-zinc-200 p-1 dark:border-zinc-800">
        <legend className="sr-only">Stored items</legend>
        {matches.length ? (
          matches.map((item) => (
            <label
              key={item.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition hover:bg-zinc-100 has-checked:bg-accent-500/10 has-checked:ring-1 has-checked:ring-accent-500/40 dark:hover:bg-zinc-800"
            >
              <input type="radio" name="itemId" value={item.id} required className="sr-only" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{item.title}</span>
                <span className="flex items-center gap-1 truncate text-xs text-zinc-500">
                  {item.location && <MapPin className="size-3 shrink-0" />}
                  {item.categories.length
                    ? `In ${item.categories.map((c) => c.name).join(", ")}`
                    : "Not in any category yet"}
                </span>
              </span>
            </label>
          ))
        ) : (
          <p className="px-3 py-6 text-center text-sm text-zinc-500">No matches.</p>
        )}
      </fieldset>
      <PinToggle />
      <FormMessage state={state} />
      <button type="submit" disabled={pending} className="btn-accent w-full">
        <Plus className="size-4" />
        {pending ? "Adding…" : "Add to this category"}
      </button>
    </form>
  );
}

function PinToggle() {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-accent-500/30 bg-accent-500/5 px-3.5 py-2.5 text-sm">
      <input type="checkbox" name="pin" className="size-4 accent-accent-600" />
      <Pin className="size-4 text-accent-600" />
      Pin to the top
    </label>
  );
}
