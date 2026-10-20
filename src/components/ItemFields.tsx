"use client";

import { useEffect, useEffectEvent, useRef, useState, type RefObject } from "react";
import { ImagePlus, MapPin, X } from "lucide-react";
import type { Item } from "@/lib/types";
import { mapsUrl } from "@/lib/maps";

type Values = Pick<Item, "title" | "location" | "image_url">;

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
      <PhotoField id={`${id}-image`} existingUrl={values?.image_url ?? null} />
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

/** Photo picker with a preview. Removing an existing photo sends removeImage=on. */
function PhotoField({ id, existingUrl }: { id: string; existingUrl: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const preview = picked ?? (removed ? null : existingUrl);

  // Free the preview's object URL when it's replaced or the field unmounts.
  useEffect(() => () => void (picked && URL.revokeObjectURL(picked)), [picked]);

  // Clear the preview when the form resets after a successful submit.
  useFormReset(inputRef, () => {
    setPicked(null);
    setRemoved(false);
  });

  const clear = () => {
    if (inputRef.current) inputRef.current.value = "";
    setPicked(null);
    setRemoved(true);
  };

  return (
    <div>
      <span className="label">
        Photo <span className="text-zinc-400">(optional)</span>
      </span>
      <input
        ref={inputRef}
        id={id}
        type="file"
        name="image"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          setPicked(file ? URL.createObjectURL(file) : null);
        }}
      />
      {removed && !picked && existingUrl && <input type="hidden" name="removeImage" value="on" />}
      {preview ? (
        <div className="relative overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          {/* A local blob preview, so next/image can't optimise it. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="aspect-video w-full object-cover" />
          <div className="absolute top-2 right-2 flex gap-1.5">
            <label htmlFor={id} className="btn cursor-pointer bg-white/90 px-3 py-1.5 text-xs text-zinc-900 shadow-sm hover:bg-white">
              Change
            </label>
            <button type="button" onClick={clear} aria-label="Remove photo" className="btn bg-white/90 px-2 py-1.5 text-zinc-900 shadow-sm hover:bg-white">
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={id}
          className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-dashed border-zinc-300 px-4 py-5 text-sm text-zinc-500 transition hover:border-accent-500 hover:text-accent-600 dark:border-zinc-700 dark:hover:text-accent-400"
        >
          <ImagePlus className="size-5" />
          Upload a photo
        </label>
      )}
    </div>
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
