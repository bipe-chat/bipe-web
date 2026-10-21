// JPEG output for images that ship on the web (link-preview cards, social posts). Smooth gradients
// and glow compress badly as PNG: a 1200x630 card was 300 to 550 KB, and WhatsApp drops preview
// images above about 300 KB. Store panels stay PNG: App Store Connect takes them as uploads.
import jpeg from "jpeg-js";

export const JPEG_QUALITY = 82;

/** RGBA pixels from resvg as JPEG bytes. Alpha is dropped: every image paints an opaque field. */
export function encodeJpeg(pixels, width, height, quality = JPEG_QUALITY) {
  return jpeg.encode({ data: pixels, width, height }, quality).data;
}
