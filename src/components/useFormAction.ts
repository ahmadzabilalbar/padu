"use client";

import { startTransition, useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import type { ActionState } from "@/lib/types";

/**
 * useActionState without React's automatic form reset, so typed values survive
 * a validation error. The form is reset only after a successful submit.
 * `prepare` can rework the data first (e.g. shrink a photo) and counts as pending.
 */
export function useFormAction(
  action: (prev: ActionState, form: FormData) => Promise<ActionState>,
  prepare?: (form: FormData) => Promise<void>,
) {
  const [state, dispatch, sending] = useActionState(action, null);
  const [preparing, setPreparing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    if (prepare) {
      setPreparing(true);
      try {
        await prepare(data);
      } finally {
        setPreparing(false);
      }
    }
    startTransition(() => dispatch(data));
  }

  return { state, pending: sending || preparing, formRef, onSubmit };
}
