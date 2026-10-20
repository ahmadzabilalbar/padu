"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { checkPassword, endAdminSession, isAdmin, requireAdmin, startAdminSession } from "@/lib/auth";
import { IMAGE_BUCKET, tags } from "@/lib/data";
import { db } from "@/lib/supabase";
import type { ActionState } from "@/lib/types";
import { httpUrl, image, location, multiline, slugify, text, uuid, ValidationError } from "@/lib/validate";

/** A category, or an item as placed in one category. */
export type RowRef = { kind: "category"; id: string } | { kind: "item"; id: string; categoryId: string };

function fail(err: unknown): ActionState {
  if (err instanceof ValidationError) return { ok: false, error: err.message };
  console.error(err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

/* ------------------------------------------------------------------ */
/* Everything here is admin only. Visitors can only read.              */
/* ------------------------------------------------------------------ */

const NOT_ADMIN: ActionState = { ok: false, error: "Only the admin can do that. Please sign in again." };

function invalidateAll() {
  updateTag(tags.categories);
  updateTag(tags.items);
}

function categoryFields(form: FormData) {
  return { name: text(form, "name", 60, true)!, description: text(form, "description", 200) };
}

/**
 * The parent chosen in a category form, or null for a top-level category.
 * Sub-categories go one level deep, so the parent must itself be top level.
 */
async function parentField(form: FormData, selfId?: string): Promise<string | null> {
  const raw = form.get("parentId");
  if (!raw) return null;
  const parentId = uuid(raw);
  if (parentId === selfId) throw new ValidationError("A category can't be inside itself.");

  const { data: parent, error } = await db().from("categories").select("parent_id").eq("id", parentId).maybeSingle();
  if (error) throw error;
  if (!parent) throw new ValidationError("That parent category no longer exists.");
  if (parent.parent_id) throw new ValidationError("Sub-categories can't have their own sub-categories.");

  if (selfId) {
    const { count, error: countError } = await db()
      .from("categories")
      .select("id", { count: "exact", head: true })
      .eq("parent_id", selfId);
    if (countError) throw countError;
    if (count) throw new ValidationError("This category has sub-categories, so it can't go inside another one.");
  }
  return parentId;
}

function itemFields(form: FormData) {
  return {
    title: text(form, "title", 120, true)!,
    body: multiline(form, "body", 1000),
    url: httpUrl(form, "url"),
    author: text(form, "author", 40),
    location: location(form, "location"),
  };
}

/** Upload the form's photo (if any) and return its storage path. */
async function uploadImage(form: FormData): Promise<string | null> {
  const photo = image(form, "image");
  if (!photo) return null;
  const path = `${randomUUID()}.${photo.ext}`;
  const { error } = await db()
    .storage.from(IMAGE_BUCKET)
    .upload(path, photo.file, { contentType: photo.file.type, cacheControl: "31536000" });
  if (error) throw error;
  return path;
}

async function removeImage(path: string | null) {
  if (!path) return;
  const { error } = await db().storage.from(IMAGE_BUCKET).remove([path]);
  if (error) console.error("Could not remove image", path, error); // an orphaned file is harmless
}

async function existingCategoryIds(ids: string[]) {
  if (!ids.length) return [];
  const { data, error } = await db().from("categories").select("id").in("id", ids);
  if (error) throw error;
  return data.map((c) => c.id as string);
}

/** Put an item into a category, optionally pinned to the top (after the current pins). */
async function place(categoryId: string, itemId: string, pin: boolean) {
  const { error } = await db()
    .from("category_items")
    .insert({
      category_id: categoryId,
      item_id: itemId,
      is_pinned: pin,
      pin_order: pin ? await nextPinOrder({ kind: "item", id: itemId, categoryId }) : 0,
    });
  if (error?.code === "23505") throw new ValidationError("That item is already in this category.");
  if (error) throw error;
}

export async function createCategory(_prev: ActionState, form: FormData): Promise<ActionState> {
  let slug = "";
  try {
    if (!(await isAdmin())) return NOT_ADMIN;
    const { name, description } = categoryFields(form);
    const parent_id = await parentField(form);
    const base = slugify(name);

    // Retry with a short suffix if the slug is already taken.
    for (let attempt = 0; ; attempt++) {
      slug = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
      const { error } = await db().from("categories").insert({ name, description, parent_id, slug });
      if (!error) break;
      if (error.code !== "23505" || attempt >= 3) throw error;
    }
    updateTag(tags.categories);
  } catch (err) {
    return fail(err);
  }
  redirect(`/c/${slug}`);
}

/** Save a new item to the library and place it in the chosen categories (none is fine). */
export async function createItem(_prev: ActionState, form: FormData): Promise<ActionState> {
  let imagePath: string | null = null;
  try {
    if (!(await isAdmin())) return NOT_ADMIN;
    const fields = itemFields(form);
    const requested = [...new Set(form.getAll("categoryId").map(uuid))];
    const categoryIds = await existingCategoryIds(requested);
    if (categoryIds.length < requested.length) throw new ValidationError("A chosen category no longer exists.");

    imagePath = await uploadImage(form);
    const { data, error } = await db()
      .from("items")
      .insert({ ...fields, image_path: imagePath })
      .select("id")
      .single();
    if (error) throw error;

    const pin = form.get("pin") === "on";
    for (const categoryId of categoryIds) await place(categoryId, data.id, pin);

    invalidateAll();
    const where = categoryIds.length ? "Added to the board" : "Saved to the library";
    return { ok: true, message: pin && categoryIds.length ? `${where} and pinned to the top.` : `${where}.` };
  } catch (err) {
    await removeImage(imagePath);
    return fail(err);
  }
}

/** Put an item that's already in the library into a category. */
export async function addExistingItem(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    if (!(await isAdmin())) return NOT_ADMIN;
    const categoryId = uuid(form.get("categoryId"));
    const itemId = form.get("itemId") ? uuid(form.get("itemId")) : null;
    if (!itemId) throw new ValidationError("Choose an item from the library.");
    if (!(await existingCategoryIds([categoryId])).length) throw new ValidationError("That category no longer exists.");

    const pin = form.get("pin") === "on";
    await place(categoryId, itemId, pin);
    invalidateAll();
    return { ok: true, message: pin ? "Added and pinned to the top." : "Added to the board." };
  } catch (err) {
    return fail(err);
  }
}

/** Edit a category's name, description and parent. The slug (its link) stays the same. */
export async function updateCategory(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    if (!(await isAdmin())) return NOT_ADMIN;
    const id = uuid(form.get("id"));
    const fields = categoryFields(form);
    const parent_id = await parentField(form, id);

    const { data: current, error: readError } = await db().from("categories").select("parent_id").eq("id", id).single();
    if (readError) throw readError;
    // Pins are ordered among siblings, so a category that moves starts unpinned in its new place.
    const moved = current.parent_id !== parent_id ? { is_pinned: false, pin_order: 0 } : {};

    const { error } = await db()
      .from("categories")
      .update({ ...fields, parent_id, ...moved })
      .eq("id", id);
    if (error) throw error;
    updateTag(tags.categories);
    return { ok: true, message: "Saved." };
  } catch (err) {
    return fail(err);
  }
}

/** Edit a library item. The change shows in every category it's in. */
export async function updateItem(_prev: ActionState, form: FormData): Promise<ActionState> {
  let newImage: string | null = null;
  try {
    if (!(await isAdmin())) return NOT_ADMIN;
    const id = uuid(form.get("id"));
    const fields = itemFields(form);

    const { data: current, error: readError } = await db().from("items").select("image_path").eq("id", id).single();
    if (readError) throw readError;

    newImage = await uploadImage(form);
    const dropImage = newImage !== null || form.get("removeImage") === "on";
    const { error } = await db()
      .from("items")
      .update({ ...fields, ...(dropImage ? { image_path: newImage } : {}) })
      .eq("id", id);
    if (error) throw error;
    if (dropImage) await removeImage(current.image_path);

    invalidateAll(); // categories too: card previews show item titles
    return { ok: true, message: "Saved." };
  } catch (err) {
    await removeImage(newImage);
    return fail(err);
  }
}

/** Delete an item from the library and from every category it's in. */
export async function deleteItem(rawId: string) {
  await requireAdmin();
  const id = uuid(rawId);
  const { data, error } = await db().from("items").delete().eq("id", id).select("image_path").maybeSingle();
  if (error) throw error;
  await removeImage(data?.image_path ?? null);
  invalidateAll();
}

/* ------------------------------------------------------------------ */
/* Admin: has the last say on what sits on top                         */
/* ------------------------------------------------------------------ */

export async function login(_prev: ActionState, form: FormData): Promise<ActionState> {
  const password = form.get("password");
  if (typeof password !== "string" || !checkPassword(password)) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return { ok: false, error: "Wrong password." };
  }
  await startAdminSession();
  redirect("/admin");
}

export async function logout() {
  await endAdminSession();
  redirect("/");
}

/** Refs come from the client, so check their ids. */
function checkRef(ref: RowRef): RowRef {
  return ref.kind === "item"
    ? { kind: "item", id: uuid(ref.id), categoryId: uuid(ref.categoryId) }
    : { kind: "category", id: uuid(ref.id) };
}

const table = (ref: RowRef) => (ref.kind === "item" ? "category_items" : "categories");

function update(ref: RowRef, values: Record<string, unknown>) {
  const q = db().from(table(ref)).update(values);
  return ref.kind === "item" ? q.eq("category_id", ref.categoryId).eq("item_id", ref.id) : q.eq("id", ref.id);
}

/**
 * Pinned rows in the same group as ref, in pin order: one category's items, or
 * a category's siblings (the top level, or one parent's sub-categories).
 */
async function pinnedGroup(ref: RowRef) {
  const idColumn = ref.kind === "item" ? "item_id" : "id";
  let q = db()
    .from(table(ref))
    .select(`${idColumn}, pin_order`)
    .eq("is_pinned", true)
    .order("pin_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (ref.kind === "item") {
    q = q.eq("category_id", ref.categoryId);
  } else {
    const { data, error } = await db().from("categories").select("parent_id").eq("id", ref.id).single();
    if (error) throw error;
    q = data.parent_id ? q.eq("parent_id", data.parent_id) : q.is("parent_id", null);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data as unknown as Record<string, string | number>[]).map((r) => ({
    id: r[idColumn] as string,
    pin_order: r.pin_order as number,
  }));
}

async function nextPinOrder(ref: RowRef) {
  const rows = await pinnedGroup(ref);
  return Math.max(0, ...rows.map((r) => r.pin_order)) + 1;
}

export async function togglePin(rawRef: RowRef) {
  await requireAdmin();
  const ref = checkRef(rawRef);

  let q = db().from(table(ref)).select("is_pinned");
  q = ref.kind === "item" ? q.eq("category_id", ref.categoryId).eq("item_id", ref.id) : q.eq("id", ref.id);
  const { data, error } = await q.single();
  if (error) throw error;

  const pinned = !data.is_pinned;
  const { error: updateError } = await update(ref, {
    is_pinned: pinned,
    pin_order: pinned ? await nextPinOrder(ref) : 0,
  });
  if (updateError) throw updateError;
  invalidateAll();
}

/** Move a pinned row up or down within its pinned group, then renumber 1..n. */
export async function movePinned(rawRef: RowRef, direction: "up" | "down") {
  await requireAdmin();
  const ref = checkRef(rawRef);
  const rows = await pinnedGroup(ref);

  const from = rows.findIndex((r) => r.id === ref.id);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from < 0 || to < 0 || to >= rows.length) return;
  [rows[from], rows[to]] = [rows[to], rows[from]];

  const updates = rows
    .map((r, i) => ({ id: r.id, order: i + 1, changed: r.pin_order !== i + 1 }))
    .filter((r) => r.changed)
    .map((r) => update({ ...ref, id: r.id }, { pin_order: r.order }));
  for (const { error: e } of await Promise.all(updates)) if (e) throw e;
  invalidateAll();
}

/** Delete a category and its sub-categories (their items stay in the library), or take an item off one category's board. */
export async function removeRow(rawRef: RowRef) {
  await requireAdmin();
  const ref = checkRef(rawRef);
  let q = db().from(table(ref)).delete();
  q = ref.kind === "item" ? q.eq("category_id", ref.categoryId).eq("item_id", ref.id) : q.eq("id", ref.id);
  const { error } = await q;
  if (error) throw error;
  invalidateAll();
}
