"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { updateCategory, updateItem } from "@/app/actions";
import type { Category, Item } from "@/lib/types";
import { FormMessage } from "./FormMessage";
import { useFormAction } from "./useFormAction";

export type EditTarget =
  | { kind: "category"; values: Pick<Category, "id" | "name" | "description"> }
  | { kind: "item"; values: Pick<Item, "id" | "title" | "body" | "url" | "author"> };

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
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-zinc-200 bg-white p-0 text-zinc-900 shadow-2xl backdrop:bg-zinc-950/60 backdrop:backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
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
            <Field label="Description" optional>
              <input name="description" maxLength={200} defaultValue={target.values.description ?? ""} className="field" />
            </Field>
          </>
        ) : (
          <>
            <Field label="Title">
              <input name="title" required maxLength={120} defaultValue={target.values.title} className="field" />
            </Field>
            <Field label="Details" optional>
              <textarea name="body" rows={4} maxLength={1000} defaultValue={target.values.body ?? ""} className="field resize-y" />
            </Field>
            <Field label="Link" optional>
              <input name="url" inputMode="url" maxLength={500} defaultValue={target.values.url ?? ""} className="field" />
            </Field>
            <Field label="Credit" optional>
              <input name="author" maxLength={40} defaultValue={target.values.author ?? ""} className="field" />
            </Field>
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
