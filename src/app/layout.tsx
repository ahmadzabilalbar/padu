import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { LayoutGrid, Shield } from "lucide-react";
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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-zinc-50/70 backdrop-blur-xl dark:border-zinc-800/70 dark:bg-zinc-950/70">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="grid size-7 place-items-center rounded-lg bg-linear-to-br from-accent-500 to-fuchsia-500 text-white shadow-sm">
                <LayoutGrid className="size-4" />
              </span>
              Padu
            </Link>
            <nav>
              <Link href="/admin" aria-label="Admin" title="Admin" className="icon-btn size-9">
                <Shield className="size-4" />
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">{children}</main>
        <footer className="py-8 text-center text-xs text-zinc-500">
          Anyone can post. The admin decides what sits on top.
        </footer>
      </body>
    </html>
  );
}
