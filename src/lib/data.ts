import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "./supabase";
import type { Category, Item } from "./types";

export const tags = {
  categories: "categories",
  items: (categoryId: string) => `items:${categoryId}`,
};

type CategoryRow = Omit<Category, "item_count"> & { items: { count: number }[] };

const CATEGORY_COLUMNS =
  "id, name, slug, description, is_pinned, pin_order, created_at, items(count)";

function toCategory({ items, ...row }: CategoryRow): Category {
  return { ...row, item_count: items?.[0]?.count ?? 0 };
}

/** All categories, pinned first (admin order), then newest. Cached + tag-invalidated. */
export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(tags.categories);

  const { data, error } = await db()
    .from("categories")
    .select(CATEGORY_COLUMNS)
    .order("is_pinned", { ascending: false })
    .order("pin_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as unknown as CategoryRow[]).map(toCategory);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(tags.categories);

  const { data, error } = await db()
    .from("categories")
    .select(CATEGORY_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toCategory(data as unknown as CategoryRow) : null;
}

/** Items in a category, in board order. Viewer-side sorting happens on the client. */
export async function getItems(categoryId: string): Promise<Item[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(tags.items(categoryId));

  const { data, error } = await db()
    .from("items")
    .select("id, category_id, title, body, url, author, is_pinned, pin_order, created_at")
    .eq("category_id", categoryId)
    .order("is_pinned", { ascending: false })
    .order("pin_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return data as Item[];
}
