"use client";

import { Plus } from "lucide-react";
import { createCategory } from "@/app/actions";
import { FormMessage } from "./FormMessage";
import { useFormAction } from "./useFormAction";

type Parent = { id: string; name: string };

type Props =
  /** Home/admin: a new category, optionally inside one of these top-level categories. */
  | { parents: Parent[]; parent?: never }
  /** Category page: a new sub-category of this one. */
  | { parent: Parent; parents?: never };

export function CategoryForm({ parents, parent }: Props) {
  const { state, pending, formRef, onSubmit } = useFormAction(createCategory);

  return (
    <form ref={formRef} onSubmit={onSubmit} className="card relative space-y-4 p-5 sm:p-6">
      <div>
        <h2 className="font-semibold tracking-tight">{parent ? `Add a sub-category to ${parent.name}` : "Start a new category"}</h2>
        <p className="mt-1 text-sm text-zinc-500">
          {parent ? "e.g. Mi Goreng inside Makan. It gets its own page and items." : "Only you can see this form."}
        </p>
      </div>
      {parent ? (
        <input type="hidden" name="parentId" value={parent.id} />
      ) : (
        parents.length > 0 && (
          <div>
            <label htmlFor="cat-parent" className="label">Inside</label>
            <select id="cat-parent" name="parentId" defaultValue="" className="field">
              <option value="">Nothing (a main category)</option>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )
      )}
      <div>
        <label htmlFor="cat-name" className="label">Name</label>
        <input id="cat-name" name="name" required maxLength={60} placeholder={parent ? "e.g. Mi Goreng" : "e.g. Makan"} className="field" />
      </div>
      <div>
        <label htmlFor="cat-desc" className="label">
          Description <span className="text-zinc-400">(optional)</span>
        </label>
        <input id="cat-desc" name="description" maxLength={200} placeholder="What belongs here?" className="field" />
      </div>
      <FormMessage state={state} />
      <button type="submit" disabled={pending} className="btn-primary w-full">
        <Plus className="size-4" />
        {pending ? "Creating…" : parent ? "Create sub-category" : "Create category"}
      </button>
    </form>
  );
}
