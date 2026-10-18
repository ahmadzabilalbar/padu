"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Loader2, Pencil, Pin, PinOff, Trash2 } from "lucide-react";
import { deleteRow, movePinned, togglePin } from "@/app/actions";
import { EditDialog, type EditTarget } from "./EditDialog";

type Props = {
  /** The row these controls act on, with its current values for the edit form. */
  target: EditTarget;
  pinned: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  /** Where to go after deleting (e.g. leave a deleted category's page). */
  afterDelete?: string;
};

export function AdminControls({ target, pinned, canMoveUp, canMoveDown, afterDelete }: Props) {
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const closeEdit = useCallback(() => setEditing(false), []);
  const router = useRouter();
  const { kind } = target;
  const { id } = target.values;
  const name = target.kind === "item" ? target.values.title : target.values.name;

  const run = (fn: () => Promise<void>) =>
    start(async () => {
      try {
        await fn();
      } catch {
        alert("That didn’t work. Your admin session may have expired, so please sign in again.");
      }
    });

  const remove = () => {
    const extra = kind === "category" ? " and every item in it" : "";
    if (!confirm(`Delete “${name}”${extra}? This can’t be undone.`)) return;
    run(async () => {
      await deleteRow(kind, id);
      if (afterDelete) router.push(afterDelete);
    });
  };

  return (
    <div className="flex items-center gap-0.5" aria-busy={pending}>
      {pending && <Loader2 className="mr-1 size-4 animate-spin text-zinc-400" />}
      {editing && <EditDialog target={target} onClose={closeEdit} />}
      <button
        type="button"
        title="Edit"
        aria-label="Edit"
        className="icon-btn"
        disabled={pending}
        onClick={() => setEditing(true)}
      >
        <Pencil className="size-4" />
      </button>
      {pinned && (
        <>
          <button
            type="button"
            title="Move up"
            aria-label="Move up"
            className="icon-btn"
            disabled={pending || !canMoveUp}
            onClick={() => run(() => movePinned(kind, id, "up"))}
          >
            <ArrowUp className="size-4" />
          </button>
          <button
            type="button"
            title="Move down"
            aria-label="Move down"
            className="icon-btn"
            disabled={pending || !canMoveDown}
            onClick={() => run(() => movePinned(kind, id, "down"))}
          >
            <ArrowDown className="size-4" />
          </button>
        </>
      )}
      <button
        type="button"
        title={pinned ? "Unpin" : "Pin to top"}
        aria-label={pinned ? "Unpin" : "Pin to top"}
        className={`icon-btn ${pinned ? "text-accent-600 dark:text-accent-400" : ""}`}
        disabled={pending}
        onClick={() => run(() => togglePin(kind, id))}
      >
        {pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
      </button>
      <button
        type="button"
        title="Delete"
        aria-label="Delete"
        className="icon-btn hover:bg-red-500/10! hover:text-red-600!"
        disabled={pending}
        onClick={remove}
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
