"use client";

import { useState } from "react";
import { ChevronDown, MapPin, Pin } from "lucide-react";
import { mapsUrl } from "@/lib/maps";
import type { Category } from "@/lib/types";

/** Items shown on a card before "Show all". */
const VISIBLE = 10;

/** Gold, silver and bronze for the top three items on each card (the admin's order). */
const MEDALS = [
  { label: "Best", className: "bg-linear-to-br from-amber-200 to-amber-400 text-amber-900 ring-amber-500/40" },
  { label: "2nd best", className: "bg-linear-to-br from-zinc-100 to-zinc-300 text-zinc-700 ring-zinc-400/50" },
  { label: "3rd best", className: "bg-linear-to-br from-orange-300 to-orange-500 text-orange-950 ring-orange-600/40" },
];

/** A card's items, ranked: the first 10, then a button to show the rest in place. */
export function CardItems({ items }: { items: Category["preview"] }) {
  const [expanded, setExpanded] = useState(false);
  if (!items.length) return <p className="text-sm text-zinc-400 dark:text-zinc-600">No items yet.</p>;

  const shown = expanded ? items : items.slice(0, VISIBLE);
  const hidden = items.length - VISIBLE;

  return (
    <>
      <ul className="space-y-1.5 text-sm">
        {shown.map((item, rank) => (
          <li key={item.id} className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
            <span className="grid w-5 shrink-0 place-items-center">
              {rank < MEDALS.length ? (
                <span
                  title={MEDALS[rank].label}
                  aria-label={MEDALS[rank].label}
                  className={`grid size-5 place-items-center rounded-full text-[10px] font-bold shadow-sm ring-1 ring-inset ${MEDALS[rank].className}`}
                >
                  {rank + 1}
                </span>
              ) : item.is_pinned ? (
                <Pin className="size-3.5 text-accent-600 dark:text-accent-400" aria-label="Pinned" />
              ) : (
                <span className="size-1 rounded-full bg-zinc-400 dark:bg-zinc-600" aria-hidden />
              )}
            </span>
            <span className={`min-w-0 flex-1 truncate ${rank === 0 ? "font-medium text-zinc-900 dark:text-zinc-100" : ""}`}>
              {item.title}
            </span>
            {/* Fixed slot on the right, so the icons line up across rows. */}
            <span className="-my-1 flex shrink-0 items-center">
              {item.location ? (
                <a
                  href={mapsUrl(item.location)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Google Maps"
                  aria-label={`${item.title} on Google Maps`}
                  className="grid size-7 place-items-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-accent-600 dark:hover:bg-zinc-800 dark:hover:text-accent-400"
                >
                  <MapPin className="size-4" />
                </a>
              ) : (
                <span className="size-7" aria-hidden />
              )}
            </span>
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-3 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-accent-600 transition hover:bg-accent-500/10 dark:text-accent-400"
        >
          {expanded ? "Show less" : `Show all (${items.length})`}
          <ChevronDown className={`size-3.5 transition ${expanded ? "rotate-180" : ""}`} />
        </button>
      )}
    </>
  );
}
