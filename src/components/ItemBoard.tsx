"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ExternalLink, Inbox, Map as MapIcon, MapPin, Pin, Search } from "lucide-react";
import type { BoardItem } from "@/lib/types";
import { locationLabel, mapsEmbedUrl, mapsUrl } from "@/lib/maps";
import { moveBounds } from "@/lib/order";
import { AdminControls } from "./AdminControls";

type Item = BoardItem;

const date = new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" });

export function ItemBoard({ items, categoryId, isAdmin }: { items: Item[]; categoryId: string; isAdmin: boolean }) {
  const [query, setQuery] = useState("");

  // Items arrive in the admin's order: pinned first, then the rest. Search only filters.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter((i) => [i.title, i.location].some((v) => v?.toLowerCase().includes(q))) : items;
  }, [items, query]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${items.length} item${items.length === 1 ? "" : "s"}…`}
          aria-label="Search items"
          className="field pl-9"
        />
      </div>

      {visible.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 px-6 py-16 text-center">
          <Inbox className="size-8 text-zinc-300 dark:text-zinc-700" />
          <p className="font-medium">{items.length ? "No matches" : "Nothing here yet"}</p>
          <p className="text-sm text-zinc-500">
            {items.length ? "Try a different search." : isAdmin ? "Add the first item." : "Check back soon."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {visible.map((item) => {
            return (
              <li key={item.id}>
                <ItemCard item={item}>
                  {isAdmin && (
                    <AdminControls
                      target={{ kind: "item", values: item }}
                      row={{ kind: "item", id: item.id, categoryId }}
                      pinned={item.is_pinned}
                      movable={!query.trim()}
                      {...moveBounds(items, item)}
                    />
                  )}
                </ItemCard>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function ItemCard({ item, children }: { item: Item; children?: React.ReactNode }) {
  const host = item.url ? hostOf(item.url) : null;
  const [showMap, setShowMap] = useState(false);
  const embed = item.location ? mapsEmbedUrl(item.location) : null;

  return (
    <article
      className={`card group p-4 transition hover:border-zinc-300 sm:p-5 dark:hover:border-zinc-700 ${
        item.is_pinned
          ? "border-accent-500/40 bg-linear-to-br from-accent-50/80 to-white/80 ring-1 ring-accent-500/10 dark:border-accent-500/30 dark:from-accent-500/10 dark:to-zinc-900/60"
          : ""
      }`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {item.image_url && (
          <a
            href={item.image_url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 overflow-hidden rounded-xl border border-zinc-200/80 dark:border-zinc-800"
            aria-label={`Open photo of ${item.title}`}
          >
            <Image
              src={item.image_url}
              alt=""
              width={112}
              height={112}
              sizes="(min-width: 640px) 112px, 80px"
              className="size-20 object-cover transition group-hover:scale-[1.03] sm:size-28"
            />
          </a>
        )}
        <div className="min-w-0 flex-1">
          {item.is_pinned && (
            <span className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-accent-600 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-white uppercase">
              <Pin className="size-3" /> Top pick
            </span>
          )}
          <h3 className="leading-snug font-semibold tracking-tight break-words">
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer nofollow ugc"
                className="hover:text-accent-600 dark:hover:text-accent-400"
              >
                {item.title}
                <ExternalLink className="ml-1.5 inline size-3.5 -translate-y-px opacity-40 group-hover:opacity-80" />
              </a>
            ) : (
              item.title
            )}
          </h3>
          {item.body && (
            <p className="mt-1.5 text-sm leading-relaxed break-words whitespace-pre-line text-zinc-600 dark:text-zinc-400">
              {item.body}
            </p>
          )}
          {item.location && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <a
                href={mapsUrl(item.location)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 transition hover:bg-accent-500/10 hover:text-accent-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:text-accent-400"
              >
                <MapPin className="size-3.5 shrink-0" />
                <span className="truncate">{locationLabel(item.location)}</span>
              </a>
              {embed && (
                <button
                  type="button"
                  onClick={() => setShowMap((v) => !v)}
                  aria-expanded={showMap}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                >
                  <MapIcon className="size-3.5" />
                  {showMap ? "Hide map" : "Show map"}
                </button>
              )}
            </div>
          )}
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
            {item.author && (
              <>
                <span className="font-medium text-zinc-700 dark:text-zinc-300">{item.author}</span>
                <span aria-hidden>·</span>
              </>
            )}
            <time dateTime={item.added_at} suppressHydrationWarning>
              {date.format(new Date(item.added_at))}
            </time>
            {host && (
              <>
                <span aria-hidden>·</span>
                <span className="font-mono">{host}</span>
              </>
            )}
          </p>
        </div>
        {children && <div className="-mt-1 -mr-1 shrink-0">{children}</div>}
      </div>
      {showMap && embed && (
        <iframe
          src={embed}
          title={`Map of ${item.location}`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="mt-4 aspect-video w-full rounded-xl border border-zinc-200 dark:border-zinc-800"
        />
      )}
    </article>
  );
}
