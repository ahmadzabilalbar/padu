import type { Category } from "./types";

/** True if visitors can't see this category: it's hidden, or its main category is. */
export function isHiddenIn(categories: Category[], c: Category) {
  return c.is_hidden || (!!c.parent_id && !!categories.find((p) => p.id === c.parent_id)?.is_hidden);
}

/** What a visitor sees: everything except hidden categories (and sub-categories of hidden ones). */
export function visibleCategories(categories: Category[]) {
  return categories.filter((c) => !isHiddenIn(categories, c));
}
