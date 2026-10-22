// JPEG output for images that ship on the web (link-preview cards, social posts). Smooth gradients
// and glow compress badly as PNG: a 1200x630 card was 300 to 550 KB, and WhatsApp drops preview
// images above about 300 KB. Store panels stay PNG: App Store Connect takes them as uploads.
import { crc32, deflateSync } from "node:zlib";
import jpeg from "jpeg-js";

export const JPEG_QUALITY = 82;

/** RGBA pixels from resvg as JPEG bytes. Alpha is dropped: every image paints an opaque field. */
export function encodeJpeg(pixels, width, height, quality = JPEG_QUALITY) {
  return jpeg.encode({ data: pixels, width, height }, quality).data;
}

/** One PNG chunk: length, type, data and CRC. */
export function chunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, "latin1");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])) >>> 0, 0);
  return Buffer.concat([head, data, crc]);
}

/** RGBA pixels as a PNG with alpha (colour type 6, no row filter), for images inside a panel SVG. */
export function encodeRgbaPng(rgba, width, height) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
