"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { updateCategory, updateItem } from "@/app/actions";
import type { Category, Item } from "@/lib/types";
import { FormMessage } from "./FormMessage";
import { ItemFields } from "./ItemFields";
import { useFormAction } from "./useFormAction";


export type EditTarget =
  | {
      kind: "category";
      values: Pick<Category, "id" | "name" | "parent_id">;
      /** Top-level categories it can move into. Omit for a category with sub-categories (it must stay top level). */
      parents?: { id: string; name: string }[];
    }
  | { kind: "item"; values: Pick<Item, "id" | "title" | "location"> };

/** Modal edit form. Mounted only while open, so it always starts from the current values. */
export function EditDialog({ target, onClose }: { target: EditTarget; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { state, pending, onSubmit } = useFormAction(target.kind === "item" ? updateItem : updateCategory);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  const v = target.values;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => e.target === dialogRef.current && onClose()}
      className="m-auto w-[calc(100%-2rem)] max-h-[calc(100dvh-2rem)] max-w-md rounded-2xl border border-zinc-200 bg-white p-0 text-zinc-900 shadow-2xl backdrop:bg-zinc-950/60 backdrop:backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
    >
      <form onSubmit={onSubmit} className="space-y-4 p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold tracking-tight">Edit {target.kind}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="icon-btn -mr-2">
            <X className="size-4" />
          </button>
        </div>
        <input type="hidden" name="id" value={v.id} />

        {target.kind === "category" ? (
          <>
            <Field label="Name">
              <input name="name" required maxLength={60} defaultValue={target.values.name} className="field" />
            </Field>
            {target.parents ? (
              <Field label="Inside">
                <select name="parentId" defaultValue={target.values.parent_id ?? ""} className="field">
                  <option value="">Nothing (a main category)</option>
                  {target.parents
                    .filter((p) => p.id !== v.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </Field>
            ) : (
              <p className="text-xs text-zinc-500">It has sub-categories, so it stays a main category.</p>
            )}
          </>
        ) : (
          <>
            <p className="-mt-1 text-xs text-zinc-500">Changes show everywhere this item is used.</p>
            <ItemFields id="edit" values={target.values} />
          </>
        )}

        <FormMessage state={state?.ok ? null : state} />
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button type="submit" disabled={pending} className="btn-primary">
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">
        {label} {optional && <span className="text-zinc-400">(optional)</span>}
      </span>
      {children}
    </label>
  );
}
