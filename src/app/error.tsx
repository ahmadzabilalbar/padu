"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">The board couldn’t load</h1>
      <p className="text-zinc-500">Please try again in a moment.</p>
      <button type="button" onClick={reset} className="btn-primary mt-2">
        Try again
      </button>
    </div>
  );
}
