"use client";

import { useEffect, useEffectEvent, useRef, useState, type RefObject } from "react";
import { MapPin } from "lucide-react";
import type { Item } from "@/lib/types";
import { mapsUrl } from "@/lib/maps";

type Values = Pick<Item, "title" | "location">;

/** The item's own fields, shared by the add form and the edit dialog. */
export function ItemFields({ id, values }: { id: string; values?: Values }) {
  const [location, setLocation] = useState(values?.location ?? "");
  const locationRef = useRef<HTMLInputElement>(null);
  useFormReset(locationRef, () => setLocation(""));

  return (
    <>
      <div>
        <label htmlFor={`${id}-title`} className="label">Title</label>
        <input id={`${id}-title`} name="title" required maxLength={120} defaultValue={values?.title} placeholder="What are you adding?" className="field" />
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor={`${id}-location`} className="label">
            Location <span className="text-zinc-400">(optional)</span>
          </label>
          {location.trim() && (
            <a href={mapsUrl(location.trim())} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-accent-600 hover:underline dark:text-accent-400">
              Check on map
            </a>
          )}
        </div>
        <div className="relative">
          <MapPin className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
          <input
            ref={locationRef}
            id={`${id}-location`}
            name="location"
            maxLength={300}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Place name, address or Google Maps link"
            className="field pl-9"
          />
        </div>
      </div>
    </>
  );
}


/** Run `onReset` when the field's form is reset (controlled state doesn't reset by itself). */
function useFormReset(ref: RefObject<HTMLInputElement | null>, onReset: () => void) {
  const handle = useEffectEvent(onReset);
  useEffect(() => {
    const form = ref.current?.form;
    const listener = () => handle();
    form?.addEventListener("reset", listener);
    return () => form?.removeEventListener("reset", listener);
  }, [ref]);
}
