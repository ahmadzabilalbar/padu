import { Suspense } from "react";
import type { Metadata } from "next";
import { Pin } from "lucide-react";
import { AdminHeader, AdminSkeleton } from "@/components/AdminHeader";
import { CategoryManager } from "@/components/CategoryManager";
import { LoginForm } from "@/components/LoginForm";
import { isAdmin } from "@/lib/auth";
import { getCategories } from "@/lib/data";
import { googleConfig } from "@/lib/google";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default function AdminPage({ searchParams }: PageProps<"/admin">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Admin searchParams={searchParams} />
    </Suspense>
  );
}

async function Admin({ searchParams }: { searchParams: PageProps<"/admin">["searchParams"] }) {
  if (!(await isAdmin())) {
    const { error } = await searchParams;
    return <LoginForm googleEnabled={googleConfig() !== null} error={typeof error === "string" ? error : undefined} />;
  }
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <AdminHeader
        active="categories"
        intro={
          <>
            Arrows set the order. <Pin className="inline size-4 -translate-y-px" /> keeps a category on top.
          </>
        }
      />
      <div className="max-w-3xl">
        <CategoryManager categories={categories} />
      </div>
    </div>
  );
}
