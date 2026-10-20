import Image from "next/image";
import Link from "next/link";
import { Library, MapPin } from "lucide-react";
import type { LibraryItem } from "@/lib/types";
import { AdminControls } from "./AdminControls";

/** Every stored item, with the categories it's in. Admin only. */
export function LibraryList({ items }: { items: LibraryItem[] }) {
  if (!items.length) {
    return (
      <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center">
        <Library className="size-8 text-zinc-300 dark:text-zinc-700" />
        <p className="font-medium">The library is empty</p>
        <p className="text-sm text-zinc-500">Items you add are stored here, ready to reuse in other categories.</p>
      </div>
    );
  }

  return (
    <ul className="card divide-y divide-zinc-200/80 dark:divide-zinc-800">
      {items.map((item, index) => (
        <li key={item.id} className="flex items-center gap-3 p-3 sm:px-4">
          {item.image_url ? (
            <Image src={item.image_url} alt="" width={48} height={48} className="size-12 shrink-0 rounded-lg object-cover" />
          ) : (
            <span className="size-12 shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800" aria-hidden />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{item.title}</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-zinc-500">
              {item.location && (
                <span className="inline-flex max-w-48 items-center gap-1">
                  <MapPin className="size-3 shrink-0" />
                  <span className="truncate">{item.location}</span>
                  <span aria-hidden>·</span>
                </span>
              )}
              {item.categories.length ? (
                item.categories.map((c, i) => (
                  <span key={c.id}>
                    <Link href={`/c/${c.slug}`} className="hover:text-accent-600 hover:underline dark:hover:text-accent-400">
                      {c.name}
                    </Link>
                    {i < item.categories.length - 1 && ","}
                  </span>
                ))
              ) : (
                <span className="italic">Not in any category</span>
              )}
            </p>
          </div>
          <AdminControls
            target={{ kind: "item", values: item }}
            row={null}
            canMoveUp={index > 0}
            canMoveDown={index < items.length - 1}
          />
        </li>
      ))}
    </ul>
  );
}
