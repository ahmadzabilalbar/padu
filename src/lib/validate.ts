import { isMapsLink } from "./maps";

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

/** Place name, address, coordinates or a Google Maps link (but no other links). */
export function location(form: FormData, key: string): string | null {
  const value = text(form, key, 300);
  if (value && /^https?:\/\//i.test(value) && !isMapsLink(value)) {
    throw new ValidationError("Location must be a place, an address, or a Google Maps link.");
  }
  return value;
}

const IMAGE_TYPES: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
};
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/** An uploaded photo, or null when the field was left empty. Returns the file and its extension. */
export function image(form: FormData, key: string): { file: File; ext: string } | null {
  const file = form.get(key);
  if (!(file instanceof File) || file.size === 0) return null;
  const ext = IMAGE_TYPES[file.type];
  if (!ext) throw new ValidationError("Photo must be a JPEG, PNG, WebP or GIF image.");
  if (file.size > MAX_IMAGE_BYTES) throw new ValidationError("Photo must be 4 MB or smaller.");
  return { file, ext };
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

export class ValidationError extends Error {}

const LABELS: Record<string, string> = { body: "Details", url: "Link", author: "Credit", location: "Location" };

function label(key: string) {
  return LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}
