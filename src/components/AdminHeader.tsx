import Link from "next/link";
import { FolderTree, Library, LogOut } from "lucide-react";
import { logout } from "@/app/actions";

const TABS = [
  { key: "categories", href: "/admin", label: "Categories", Icon: FolderTree },
  { key: "items", href: "/admin/items", label: "Items", Icon: Library },
] as const;

export function AdminHeader({ active, intro }: { active: (typeof TABS)[number]["key"]; intro: React.ReactNode }) {
  return (
    <header className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-4xl">Admin</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">{intro}</p>
        </div>
        <form action={logout}>
          <button type="submit" className="btn-ghost">
            <LogOut className="size-4" /> Sign out
          </button>
        </form>
      </div>
      <nav aria-label="Admin sections" className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
        {TABS.map(({ key, href, label, Icon }) => (
          <Link
            key={key}
            href={href}
            aria-current={active === key ? "page" : undefined}
            className={`-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition ${
              active === key
                ? "border-accent-600 text-zinc-900 dark:border-accent-400 dark:text-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <Icon className="size-4" /> {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function AdminSkeleton() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-24" />
      <div className="skeleton h-12" />
      <div className="skeleton h-72 max-w-3xl" />
    </div>
  );
}
