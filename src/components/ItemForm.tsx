"use client";

import { Pin, Plus } from "lucide-react";
import { createItem } from "@/app/actions";
import { FormMessage, Honeypot } from "./FormMessage";
import { useFormAction } from "./useFormAction";

type Props = {
  /** A fixed category (board page)… */
  categoryId?: string;
  /** …or a category picker (admin dashboard). */
  categories?: { id: string; name: string }[];
  isAdmin?: boolean;
};

export function ItemForm({ categoryId, categories, isAdmin }: Props) {
  const { state, pending, formRef, onSubmit } = useFormAction(createItem);

  return (
    <form ref={formRef} onSubmit={onSubmit} className="relative space-y-4">
      {categoryId ? (
        <input type="hidden" name="categoryId" value={categoryId} />
      ) : (
        <div>
          <label htmlFor="item-cat" className="label">Category</label>
          <select id="item-cat" name="categoryId" required defaultValue="" className="field">
            <option value="" disabled>
              Choose a category…
            </option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label htmlFor="item-title" className="label">Title</label>
        <input id="item-title" name="title" required maxLength={120} placeholder="What are you adding?" className="field" />
      </div>
      <div>
        <label htmlFor="item-body" className="label">
          Details <span className="text-zinc-400">(optional)</span>
        </label>
        <textarea id="item-body" name="body" rows={3} maxLength={1000} placeholder="A few words about it" className="field resize-y" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <div>
          <label htmlFor="item-url" className="label">
            Link <span className="text-zinc-400">(optional)</span>
          </label>
          <input id="item-url" name="url" inputMode="url" maxLength={500} placeholder="example.com" className="field" />
        </div>
        <div>
          <label htmlFor="item-author" className="label">
            Your name <span className="text-zinc-400">(optional)</span>
          </label>
          <input id="item-author" name="author" maxLength={40} placeholder="Anonymous" className="field" />
        </div>
      </div>
      {isAdmin && (
        <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-accent-500/30 bg-accent-500/5 px-3.5 py-2.5 text-sm">
          <input type="checkbox" name="pin" className="size-4 accent-accent-600" />
          <Pin className="size-4 text-accent-600" />
          Pin to the top
        </label>
      )}
      <Honeypot />
      <FormMessage state={state} />
      <button type="submit" disabled={pending} className="btn-accent w-full">
        <Plus className="size-4" />
        {pending ? "Adding…" : "Add item"}
      </button>
    </form>
  );
}
