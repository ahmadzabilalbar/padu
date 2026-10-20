import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import Link from "next/link";
import { LayoutGrid, Shield } from "lucide-react";
import { CategoryChips } from "@/components/CategoryChips";
import { ThemeToggle, themeScript } from "@/components/ThemeToggle";
import { getCategories, topLevel } from "@/lib/data";
import { visibleCategories } from "@/lib/visibility";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Changlun Best", template: "%s · Changlun Best" },
  description: "A shared board. Post a category, add items, sort them.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The theme script adds the "dark" class before React hydrates, hence suppressHydrationWarning.
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-zinc-50/70 backdrop-blur-xl dark:border-zinc-800/70 dark:bg-zinc-950/70">
          <div className="flex h-14 items-center gap-3 px-4 sm:gap-5 sm:px-6">
            <Link href="/" aria-label="Changlun Best" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight">
              <span className="grid size-7 place-items-center rounded-lg bg-linear-to-br from-accent-500 to-fuchsia-500 text-white shadow-sm">
                <LayoutGrid className="size-4" />
              </span>
              {/* Icon only on phones, so the category chips fit beside it. */}
              <span className="hidden sm:inline">Changlun Best</span>
            </Link>
            {/* Takes the space between logo and buttons; scrolls sideways when there are many. */}
            <div className="min-w-0 flex-1">
              <Suspense fallback={null}>
                <CategoryNav />
              </Suspense>
            </div>
            <nav className="flex shrink-0 items-center gap-1">
              <ThemeToggle />
              <Link href="/admin" aria-label="Admin" title="Admin" className="icon-btn size-9">
                <Shield className="size-4" />
              </Link>
            </nav>
          </div>
        </header>
        <main className="w-full flex-1 px-4 py-8 sm:px-6 sm:py-12">{children}</main>
        <footer className="py-8 text-center text-xs text-zinc-500">
          The best of Changlun, curated by me 🙂
        </footer>
      </body>
    </html>
  );
}

/** Main categories for the filter chips in the top bar. */
async function CategoryNav() {
  // Visitors' view: hidden categories never get a chip.
  const all = visibleCategories(await getCategories());
  const chips = topLevel(all).map((main) => ({
    name: main.name,
    slug: main.slug,
    subSlugs: main.subcategories.map((s) => s.slug),
  }));
  return chips.length ? <CategoryChips categories={chips} /> : null;
}
