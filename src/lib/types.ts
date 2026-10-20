export type Category = {
  id: string;
  name: string;
  slug: string;
  /** Set for a sub-category. Only one level deep. */
  parent_id: string | null;
  is_pinned: boolean;
  pin_order: number;
  created_at: string;
  item_count: number;
  /** Sub-categories in board order (empty for a sub-category). */
  subcategories: Pick<Category, "id" | "name" | "slug">[];
  /** All its items in board order, shown on its card (only filled on the category list). */
  preview: (Pick<Item, "id" | "title" | "location"> & { is_pinned: boolean })[];
};

/** An item in the library. The same item can sit in several categories. */
export type Item = {
  id: string;
  title: string;
  body: string | null;
  url: string | null;
  author: string | null;
  /** Place name, address, coordinates or a Google Maps link. */
  location: string | null;
  created_at: string;
};

/** An item as placed on one category's board. */
export type BoardItem = Item & {
  category_id: string;
  is_pinned: boolean;
  pin_order: number;
  /** When it was added to this category. */
  added_at: string;
};

/** A library item with the categories it's in. */
export type LibraryItem = Item & { categories: { id: string; name: string; slug: string }[] };

export type ActionState = { ok: boolean; error?: string; message?: string } | null;
