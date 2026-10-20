import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "./supabase";
import type { BoardItem, Category, Item, LibraryItem } from "./types";

/** Items are shared between categories, so one tag covers every item read. */
export const tags = {
  categories: "categories",
  items: "items",
};

export const IMAGE_BUCKET = "item-images";

type CategoryRow = Omit<Category, "item_count" | "preview" | "subcategories"> & {
  category_items: { count: number }[];
  preview?: { is_pinned: boolean; item: { id: string; title: string } | null }[];
};

type ItemRow = Omit<Item, "image_url">;

const CATEGORY_COLUMNS =
  "id, name, slug, parent_id, is_pinned, pin_order, created_at, category_items(count)";

const ITEM_COLUMNS = "id, title, body, url, author, image_path, location, created_at";

/** Number of items shown on each category card. */
export const PREVIEW_SIZE = 3;

function toCategory({ category_items, preview, ...row }: CategoryRow): Category {
  return {
    ...row,
    subcategories: [],
    item_count: category_items?.[0]?.count ?? 0,
    preview: (preview ?? []).flatMap((p) => (p.item ? [{ ...p.item, is_pinned: p.is_pinned }] : [])),
  };
}

function toItem(row: ItemRow): Item {
  const image_url = row.image_path
    ? db().storage.from(IMAGE_BUCKET).getPublicUrl(row.image_path).data.publicUrl
    : null;
  return { ...row, image_url };
}

/**
 * Every category and sub-category, pinned first (admin order), then newest,
 * each with its top few items in board order and its sub-categories. One
 * query; cached and tag-invalidated. Use topLevel() for the home page.
 */
export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(tags.categories, tags.items);

  const { data, error } = await db()
    .from("categories")
    .select(`${CATEGORY_COLUMNS}, preview:category_items(is_pinned, item:items(id, title))`)
    .order("is_pinned", { ascending: false })
    .order("pin_order", { ascending: true })
    .order("created_at", { ascending: false })
    .order("is_pinned", { referencedTable: "preview", ascending: false })
    .order("pin_order", { referencedTable: "preview", ascending: true })
    .order("created_at", { referencedTable: "preview", ascending: false })
    .limit(PREVIEW_SIZE, { referencedTable: "preview" });
  if (error) throw new Error(error.message);

  const categories = (data as unknown as CategoryRow[]).map(toCategory);
  const byId = new Map(categories.map((c) => [c.id, c]));
  // Board order holds within each group of siblings, so children come out in order too.
  for (const c of categories) {
    if (c.parent_id) byId.get(c.parent_id)?.subcategories.push({ id: c.id, name: c.name, slug: c.slug });
  }
  return categories;
}

export const topLevel = (categories: Category[]) => categories.filter((c) => !c.parent_id);

/**
 * Home page cards, in board order: each main category's sub-categories in its
 * place. A main category gets its own card only if it has no sub-categories or
 * has items of its own (so those stay reachable).
 */
export function homeCards(categories: Category[]) {
  return topLevel(categories).flatMap((main) => {
    const children = categories.filter((c) => c.parent_id === main.id);
    return children.length === 0 || main.item_count > 0 ? [main, ...children] : children;
  });
}

/** A category with its parent (for the breadcrumb) and its sub-categories in full. */
export async function getCategoryBySlug(slug: string) {
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) return null;
  return {
    category,
    parent: categories.find((c) => c.id === category.parent_id) ?? null,
    children: categories.filter((c) => c.parent_id === category.id),
  };
}

/** Full category names for pickers, e.g. "Makan › Mi Goreng", parents followed by their children. */
export function categoryOptions(categories: Category[]) {
  return topLevel(categories).flatMap((parent) => [
    { id: parent.id, name: parent.name },
    ...categories
      .filter((c) => c.parent_id === parent.id)
      .map((c) => ({ id: c.id, name: `${parent.name} › ${c.name}` })),
  ]);
}

/** Items in a category, in board order. Viewer-side sorting happens on the client. */
export async function getItems(categoryId: string): Promise<BoardItem[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(tags.items);

  const { data, error } = await db()
    .from("category_items")
    .select(`category_id, is_pinned, pin_order, created_at, item:items!inner(${ITEM_COLUMNS})`)
    .eq("category_id", categoryId)
    .order("is_pinned", { ascending: false })
    .order("pin_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);

  type Row = Pick<BoardItem, "category_id" | "is_pinned" | "pin_order"> & { created_at: string; item: ItemRow };
  return (data as unknown as Row[]).map(({ item, created_at, ...placement }) => ({
    ...toItem(item),
    ...placement,
    added_at: created_at,
  }));
}

/** Every stored item in the admin's manual order, with the categories each one is in. */
export async function getLibrary(): Promise<LibraryItem[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(tags.items, tags.categories);

  const { data, error } = await db()
    .from("items")
    .select(`${ITEM_COLUMNS}, categories(id, name, slug)`)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw new Error(error.message);

  type Row = ItemRow & { categories: LibraryItem["categories"] };
  return (data as unknown as Row[]).map(({ categories, ...row }) => ({ ...toItem(row), categories }));
}
