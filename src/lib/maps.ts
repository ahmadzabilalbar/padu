/**
 * Google Maps links for an item's location. The admin can type a place name,
 * an address, "lat, lng" coordinates, or paste a Google Maps share link.
 */

const MAPS_LINK = /^https?:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl\/maps)/i;

export function isMapsLink(location: string) {
  return MAPS_LINK.test(location);
}

/** Link that opens the location in Google Maps (the app on phones). */
export function mapsUrl(location: string) {
  if (isMapsLink(location)) return location;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

/**
 * Keyless embeddable map, or null for share links (they can't be embedded
 * without resolving them first).
 */
export function mapsEmbedUrl(location: string) {
  if (isMapsLink(location)) return null;
  return `https://maps.google.com/maps?q=${encodeURIComponent(location)}&z=15&output=embed`;
}

/** Short label for the location chip. */
export function locationLabel(location: string) {
  return isMapsLink(location) ? "View on Google Maps" : location;
}
