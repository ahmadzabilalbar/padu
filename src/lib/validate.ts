export function text(form: FormData, key: string, max: number, required = false): string | null {
  const raw = form.get(key);
  const value = typeof raw === "string" ? raw.trim().replace(/\s+/g, " ") : "";
  if (!value) {
    if (required) throw new ValidationError(`${label(key)} is required.`);
    return null;
  }
  if (value.length > max) throw new ValidationError(`${label(key)} must be ${max} characters or fewer.`);
  return value;
}

export function multiline(form: FormData, key: string, max: number): string | null {
  const raw = form.get(key);
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) return null;
  if (value.length > max) throw new ValidationError(`${label(key)} must be ${max} characters or fewer.`);
  return value;
}

export function httpUrl(form: FormData, key: string): string | null {
  const value = text(form, key, 500);
  if (!value) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error();
    return u.toString();
  } catch {
    throw new ValidationError("Link must be a valid web address.");
  }
}

export function uuid(value: unknown): string {
  if (typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value)) return value;
  throw new ValidationError("Invalid id.");
}

export function slugify(name: string) {
  return (
    name
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "category"
  );
}

/** Bots fill hidden fields; humans don't. */
export function isBot(form: FormData) {
  return Boolean(form.get("website"));
}

export class ValidationError extends Error {}

const LABELS: Record<string, string> = { body: "Details", url: "Link", author: "Name" };

function label(key: string) {
  return LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}
