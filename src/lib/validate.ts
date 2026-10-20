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

/** Place name, address, coordinates or a Google Maps link (but no other links). */
export function location(form: FormData, key: string): string | null {
  const value = text(form, key, 300);
  if (value && /^https?:\/\//i.test(value) && !isMapsLink(value)) {
    throw new ValidationError("Location must be a place, an address, or a Google Maps link.");
  }
  return value;
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

const LABELS: Record<string, string> = { location: "Location" };

function label(key: string) {
  return LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}
