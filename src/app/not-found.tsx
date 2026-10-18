import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <p className="font-mono text-sm text-accent-600">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">Not on this board</h1>
      <p className="text-zinc-500">That category may have been removed by the admin.</p>
      <Link href="/" className="btn-primary mt-2">
        Back to categories
      </Link>
    </div>
  );
}
