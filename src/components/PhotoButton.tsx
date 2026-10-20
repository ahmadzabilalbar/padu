"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";

type Props = {
  src: string;
  /** What the photo shows, e.g. the item's title. */
  title: string;
  className?: string;
  children: React.ReactNode;
};

/** A button that shows a photo in a full-screen pop-up. Tap anywhere (or Esc) to close. */
export function PhotoButton({ src, title, className, children }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        title="Photo"
        aria-label={`Photo of ${title}`}
        className={className}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
      >
        {children}
      </button>
      {open && <PhotoDialog src={src} title={title} onClose={() => setOpen(false)} />}
    </>
  );
}

function PhotoDialog({ src, title, onClose }: { src: string; title: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    ref.current?.showModal();
    // Stop the page behind from scrolling (showModal doesn't on iOS).
    const { overflow } = document.documentElement.style;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = overflow;
    };
  }, []);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        e.stopPropagation();
        ref.current?.close();
      }}
      aria-label={title}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 backdrop:bg-black/85 backdrop:backdrop-blur-sm"
    >
      <div className="flex h-full flex-col items-center justify-center gap-3 p-4">
        {/* Photos are stored square at up to 600px, so show them square and not much larger. */}
        <div className="relative aspect-square w-full max-w-[min(480px,75dvh)] overflow-hidden rounded-2xl">
          <Image src={src} alt={title} fill sizes="480px" className="object-cover" priority />
        </div>
        <p className="max-w-full truncate px-4 text-center text-sm font-medium text-white">{title}</p>
      </div>
      <button
        type="button"
        aria-label="Close"
        autoFocus
        className="absolute top-3 right-3 grid size-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
      >
        <X className="size-5" />
      </button>
    </dialog>
  );
}
