"use client";

import { useActionState } from "react";
import { Lock } from "lucide-react";
import { login } from "@/app/actions";
import { FormMessage } from "./FormMessage";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null);

  return (
    <form action={action} className="card mx-auto mt-6 max-w-sm space-y-4 p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="grid size-11 place-items-center rounded-xl bg-accent-500/10 text-accent-600 dark:text-accent-400">
          <Lock className="size-5" />
        </span>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Admin sign-in</h1>
          <p className="mt-1 text-sm text-zinc-500">Only the admin can pin, reorder or delete.</p>
        </div>
      </div>
      <div>
        <label htmlFor="password" className="label">Password</label>
        <input id="password" name="password" type="password" required autoFocus autoComplete="current-password" className="field" />
      </div>
      <FormMessage state={state} />
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Checking…" : "Sign in"}
      </button>
    </form>
  );
}
