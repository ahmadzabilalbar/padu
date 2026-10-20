import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminHeader, AdminSkeleton } from "@/components/AdminHeader";
import { ItemForm } from "@/components/ItemForm";
import { LibraryList } from "@/components/LibraryList";
import { isAdmin } from "@/lib/auth";
import { categoryOptions, getCategories, getLibrary } from "@/lib/data";

export const metadata: Metadata = { title: "Items · Admin", robots: { index: false } };

export default function AdminItemsPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <AdminItems />
    </Suspense>
  );
}

async function AdminItems() {
  if (!(await isAdmin())) redirect("/admin");
  const [categories, library] = await Promise.all([getCategories(), getLibrary()]);

  return (
    <div className="space-y-6">
      <AdminHeader
        active="items"
        intro="Every item is stored once. Arrows set the library order. Add an item to more categories from a category page with “From library”."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-zinc-500">Item library ({library.length})</h2>
          <LibraryList items={library} />
        </section>
        <aside className="card p-5 sm:p-6 lg:sticky lg:top-20">
          <h2 className="mb-4 font-semibold tracking-tight">Add a new item</h2>
          <ItemForm categories={categoryOptions(categories)} />
        </aside>
      </div>
    </div>
  );
}
