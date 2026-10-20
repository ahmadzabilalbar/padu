"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Eye, EyeOff, Loader2, Pencil, Pin, PinOff, Trash2 } from "lucide-react";
import { deleteItem, moveLibraryItem, moveRow, removeRow, toggleHidden, togglePin, type RowRef } from "@/app/actions";
import { EditDialog, type EditTarget } from "./EditDialog";

type Props = {
  /** The record these controls edit, with its current values for the edit form. */
  target: EditTarget;
  /**
   * The row to pin, reorder and remove: a category, or an item on one category's
   * board. Null for an item in the library, where delete removes it everywhere.
   */
  row: RowRef | null;
  pinned?: boolean;
  /** For categories: whether it's hidden from visitors (shows the show/hide button). */
  hidden?: boolean;
  /** Whether to show the up/down arrows (default: yes). */
  movable?: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  /** Where to go after deleting (e.g. leave a deleted category's page). */
  afterDelete?: string;
};

export function AdminControls({ target, row, pinned = false, hidden, movable = true, canMoveUp, canMoveDown, afterDelete }: Props) {
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const closeEdit = useCallback(() => setEditing(false), []);
  const router = useRouter();
  const name = target.kind === "item" ? target.values.title : target.values.name;

  const run = (fn: () => Promise<void>) =>
    start(async () => {
      try {
        await fn();
      } catch {
        alert("That didn’t work. Your admin session may have expired, so please sign in again.");
      }
    });

  const remove = {
    category: {
      label: "Delete",
      confirm: `Delete the category “${name}” and any sub-categories in it? Their items stay in the library. This can’t be undone.`,
    },
    item: { label: "Remove from this category", confirm: `Remove “${name}” from this category? It stays in the library.` },
    library: {
      label: "Delete everywhere",
      confirm: `Delete “${name}” for good? It will be removed from every category. This can’t be undone.`,
    },
  }[row?.kind ?? "library"];

  const move = (direction: "up" | "down") =>
    run(() => (row ? moveRow(row, direction) : moveLibraryItem(target.values.id, direction)));

  const onRemove = () => {
    if (!confirm(remove.confirm)) return;
    run(async () => {
      await (row ? removeRow(row) : deleteItem(target.values.id));
      if (afterDelete) router.push(afterDelete);
    });
  };

  return (
    <div className="flex items-center" aria-busy={pending}>
      {pending && <Loader2 className="mr-1 size-3.5 animate-spin text-zinc-400" />}
      {editing && <EditDialog target={target} onClose={closeEdit} />}
      <button
        type="button"
        title="Edit"
        aria-label="Edit"
        className="icon-btn size-7"
        disabled={pending}
        onClick={() => setEditing(true)}
      >
        <Pencil className="size-3.5" />
      </button>
      {movable && (
        <>
          <button
            type="button"
            title="Move up"
            aria-label="Move up"
            className="icon-btn size-7"
            disabled={pending || !canMoveUp}
            onClick={() => move("up")}
          >
            <ArrowUp className="size-3.5" />
          </button>
          <button
            type="button"
            title="Move down"
            aria-label="Move down"
            className="icon-btn size-7"
            disabled={pending || !canMoveDown}
            onClick={() => move("down")}
          >
            <ArrowDown className="size-3.5" />
          </button>
        </>
      )}
      {row?.kind === "category" && hidden !== undefined && (
        <button
          type="button"
          title={hidden ? "Hidden from visitors. Show it" : "Hide from visitors"}
          aria-label={hidden ? "Show to visitors" : "Hide from visitors"}
          aria-pressed={hidden}
          className={`icon-btn size-7 ${hidden ? "text-amber-600 dark:text-amber-400" : ""}`}
          disabled={pending}
          onClick={() => run(() => toggleHidden(row.id))}
        >
          {hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </button>
      )}
      {row && (
        <button
          type="button"
          title={pinned ? "Unpin" : "Pin to top"}
          aria-label={pinned ? "Unpin" : "Pin to top"}
          className={`icon-btn size-7 ${pinned ? "text-accent-600 dark:text-accent-400" : ""}`}
          disabled={pending}
          onClick={() => run(() => togglePin(row))}
        >
          {pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
        </button>
      )}
      <button
        type="button"
        title={remove.label}
        aria-label={remove.label}
        className="icon-btn size-7 hover:bg-red-500/10! hover:text-red-600!"
        disabled={pending}
        onClick={onRemove}
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}
