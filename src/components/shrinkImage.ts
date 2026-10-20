const MAX_SIDE = 1600;

/**
 * Phone photos are often 5–10 MB. Resize the form's photo in the browser to
 * at most 1600px and re-encode it as WebP, so uploads are fast and stay well
 * under the server's limit. GIFs are left alone (they may be animated).
 */
export async function shrinkImage(form: FormData, key: string) {
  const file = form.get(key);
  if (!(file instanceof File) || file.size === 0 || file.type === "image/gif") return;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
    if (!blob || blob.type !== "image/webp" || blob.size >= file.size) return; // keep the original
    form.set(key, new File([blob], file.name.replace(/\.\w+$/, "") + ".webp", { type: "image/webp" }));
  } catch {
    // Unsupported format (e.g. HEIC in some browsers): send it as is and let the server decide.
  }
}
