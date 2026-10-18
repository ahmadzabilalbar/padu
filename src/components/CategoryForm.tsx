"use client";

import { Plus } from "lucide-react";
import { createCategory } from "@/app/actions";
import { FormMessage, Honeypot } from "./FormMessage";
import { useFormAction } from "./useFormAction";

export function CategoryForm() {
  const { state, pending, formRef, onSubmit } = useFormAction(createCategory);

  return (
    <form ref={formRef} onSubmit={onSubmit} className="card relative space-y-4 p-5 sm:p-6">
      <div>
        <h2 className="font-semibold tracking-tight">Start a new category</h2>
        <p className="mt-1 text-sm text-zinc-500">No sign-up needed. Give it a clear name.</p>
      </div>
      <div>
        <label htmlFor="cat-name" className="label">Name</label>
        <input id="cat-name" name="name" required maxLength={60} placeholder="e.g. Best coffee spots" className="field" />
      </div>
      <div>
        <label htmlFor="cat-desc" className="label">
          Description <span className="text-zinc-400">(optional)</span>
        </label>
        <input id="cat-desc" name="description" maxLength={200} placeholder="What belongs here?" className="field" />
      </div>
      <Honeypot />
      <FormMessage state={state} />
      <button type="submit" disabled={pending} className="btn-primary w-full">
        <Plus className="size-4" />
        {pending ? "Creating…" : "Create category"}
      </button>
    </form>
  );
}
