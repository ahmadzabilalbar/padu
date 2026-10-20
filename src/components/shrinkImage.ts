/** Every item photo is stored square, at most 600×600. */
const PHOTO_RATIO = 1;
const MAX_WIDTH = 600;
const QUALITY = 0.82;

/**
 * Crop the form's photo to a centred square, scale it down to at most 600×600
 * and re-encode it as WebP in the browser, so every stored photo has the same
 * shape and stays small (typically 40–70 KB). Small photos are never enlarged.
 */
export async function shrinkImage(form: FormData, key: string) {
  const file = form.get(key);
  if (!(file instanceof File) || file.size === 0) return;

  try {
    const bitmap = await createImageBitmap(file);

    // Largest centred area of the original with the photo's ratio.
    let sw = bitmap.width;
    let sh = Math.round(sw / PHOTO_RATIO);
    if (sh > bitmap.height) {
      sh = bitmap.height;
      sw = Math.round(sh * PHOTO_RATIO);
    }
    const sx = Math.round((bitmap.width - sw) / 2);
    const sy = Math.round((bitmap.height - sh) / 2);

    const width = Math.min(MAX_WIDTH, sw);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = Math.round(width / PHOTO_RATIO);
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", QUALITY));
    if (!blob || blob.type !== "image/webp") return; // browser can't make WebP: send the original
    form.set(key, new File([blob], file.name.replace(/\.\w+$/, "") + ".webp", { type: "image/webp" }));
  } catch {
    // Unsupported format (e.g. HEIC in some browsers): send it as is and let the server decide.
  }
}
