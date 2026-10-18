"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { checkPassword, endAdminSession, isAdmin, requireAdmin, startAdminSession } from "@/lib/auth";
import { tags } from "@/lib/data";
import { db } from "@/lib/supabase";
import type { ActionState } from "@/lib/types";
import { httpUrl, isBot, multiline, slugify, text, uuid, ValidationError } from "@/lib/validate";

type Kind = "category" | "item";

function fail(err: unknown): ActionState {
  if (err instanceof ValidationError) return { ok: false, error: err.message };
  console.error(err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

/* ------------------------------------------------------------------ */
/* Public: anyone can post categories and items (no login)             */
/* ------------------------------------------------------------------ */

export async function createCategory(_prev: ActionState, form: FormData): Promise<ActionState> {
  let slug = "";
  try {
    if (isBot(form)) return { ok: true };
    const name = text(form, "name", 60, true)!;
    const description = text(form, "description", 200);
    const base = slugify(name);

    // Retry with a short suffix if the slug is already taken.
    for (let attempt = 0; ; attempt++) {
      slug = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
      const { error } = await db().from("categories").insert({ name, description, slug });
      if (!error) break;
      if (error.code !== "23505" || attempt >= 3) throw error;
    }
    updateTag(tags.categories);
  } catch (err) {
    return fail(err);
  }
  redirect(`/c/${slug}`);
}

export async function createItem(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    if (isBot(form)) return { ok: true, message: "Added to the board." };
    const categoryId = uuid(form.get("categoryId"));
    const title = text(form, "title", 120, true)!;
    const body = multiline(form, "body", 1000);
    const url = httpUrl(form, "url");
    const author = text(form, "author", 40);

    const { data: category } = await db()
      .from("categories")
      .select("id")
      .eq("id", categoryId)
      .maybeSingle();
    if (!category) throw new ValidationError("That category no longer exists.");

    // Only the admin can put an item straight on top.
    const pin = form.get("pin") === "on" && (await isAdmin());
    const { error } = await db()
      .from("items")
      .insert({
        category_id: categoryId,
        title,
        body,
        url,
        author,
        is_pinned: pin,
        pin_order: pin ? await nextPinOrder("item", categoryId) : 0,
      });
    if (error) throw error;

    updateTag(tags.items(categoryId));
    updateTag(tags.categories); // item counts
    return { ok: true, message: pin ? "Added and pinned to the top." : "Added to the board." };
  } catch (err) {
    return fail(err);
  }
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

const table = (kind: Kind) => (kind === "item" ? "items" : "categories");

/** Category id that scopes an item's pin order (null for categories). Read from the DB, never the client. */
async function scopeOf(kind: Kind, id: string): Promise<string | null> {
  if (kind === "category") return null;
  const { data, error } = await db().from("items").select("category_id").eq("id", id).single();
  if (error) throw error;
  return data.category_id as string;
}

async function nextPinOrder(kind: Kind, scope: string | null) {
  let q = db()
    .from(table(kind))
    .select("pin_order")
    .eq("is_pinned", true)
    .order("pin_order", { ascending: false })
    .limit(1);
  if (scope) q = q.eq("category_id", scope);
  const { data, error } = await q;
  if (error) throw error;
  return (data?.[0]?.pin_order ?? 0) + 1;
}

function invalidate(kind: Kind, scope: string | null) {
  updateTag(tags.categories);
  if (kind === "item" && scope) updateTag(tags.items(scope));
}

export async function togglePin(kind: Kind, rawId: string) {
  await requireAdmin();
  const id = uuid(rawId);
  const scope = await scopeOf(kind, id);

  const { data, error } = await db().from(table(kind)).select("is_pinned").eq("id", id).single();
  if (error) throw error;

  const pinned = !data.is_pinned;
  const { error: updateError } = await db()
    .from(table(kind))
    .update({ is_pinned: pinned, pin_order: pinned ? await nextPinOrder(kind, scope) : 0 })
    .eq("id", id);
  if (updateError) throw updateError;
  invalidate(kind, scope);
}

/** Move a pinned row up or down within its pinned group, then renumber 1..n. */
export async function movePinned(kind: Kind, rawId: string, direction: "up" | "down") {
  await requireAdmin();
  const id = uuid(rawId);
  const scope = await scopeOf(kind, id);

  let q = db()
    .from(table(kind))
    .select("id, pin_order")
    .eq("is_pinned", true)
    .order("pin_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (scope) q = q.eq("category_id", scope);
  const { data, error } = await q;
  if (error) throw error;

  const rows = data as { id: string; pin_order: number }[];
  const from = rows.findIndex((r) => r.id === id);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from < 0 || to < 0 || to >= rows.length) return;
  [rows[from], rows[to]] = [rows[to], rows[from]];

  const updates = rows
    .map((r, i) => ({ id: r.id, order: i + 1, changed: r.pin_order !== i + 1 }))
    .filter((r) => r.changed)
    .map((r) => db().from(table(kind)).update({ pin_order: r.order }).eq("id", r.id));
  for (const { error: e } of await Promise.all(updates)) if (e) throw e;
  invalidate(kind, scope);
}

export async function deleteRow(kind: Kind, rawId: string) {
  await requireAdmin();
  const id = uuid(rawId);
  const scope = await scopeOf(kind, id);
  const { error } = await db().from(table(kind)).delete().eq("id", id);
  if (error) throw error;
  invalidate(kind, scope);
}
