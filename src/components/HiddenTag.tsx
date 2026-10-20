import { EyeOff } from "lucide-react";

/** Marks a category visitors can't see. */
export function HiddenTag() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-px text-[10px] font-semibold text-amber-700 uppercase dark:text-amber-400">
      <EyeOff className="size-3" /> Hidden
    </span>
  );
}
