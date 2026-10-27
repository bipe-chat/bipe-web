// The brand backdrop for every rendered image: the link-preview cards (scripts/og.mjs) and the store
// panels (scripts/store-images.mjs). One module, so the cards and the panels have the same texture.
// The backdrop is plain SVG. compose() puts it under the Satori output before resvg rasterises it,
// so text and frames always paint on top of it.
//
// Textures (bipe-chat/bipe#463):
//   mesh     2 or 3 large radial blobs from the ramps, layered on the base step
//   pattern  mesh plus the Bipe mark at large scale, cropped, tone on tone
//
// Ramps come only from bipe-shared design/tokens.json (light theme): açaí, and the expressive ramps
// (pitanga, caju, jabuticaba, jenipapo). The expressive ramps are for marketing backgrounds only: never
// text, borders or trust states (bipe-shared design/README.md).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ramps = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../../bipe-shared/design/tokens.json"), "utf8")).ramps;
const light = (name) => ramps[name].light;
export const ACCENTS = ["pitanga", "caju", "jabuticaba", "jenipapo"];
export const RAMPS = Object.fromEntries(["acai", ...ACCENTS].map((k) => [k, light(k)]));

// App ramps for the store callouts (lib/callouts.mjs), so an enlarged element has the colours it has in
// the phone: amber is the caution colour of the scam warning, gray the text, açaí the buttons and badges.
export const UI = Object.fromEntries(["amber", "gray", "acai"].map((k) => [k, light(k)]));

// The browser editor and build-time images use the same renderer.
import { toneForRamps } from "../../src/graphics/backdrop.mjs";
export { TEXTURES, backdropSvg, compose, toneContrast, checkTone } from "../../src/graphics/backdrop.mjs";
export const tone = (ramp, accent = ramp) => toneForRamps(RAMPS, ramp, accent);

/**
 * The brand tone for image number i of a set (store panels in order, link-preview cards by route):
 * even images are açaí-led with the next accent as a blob, odd images are led by that accent. So the
 * colour changes on every image, panel 1 is açaí, and the accents come in a fixed order.
 */
export function brandTone(i) {
  const accent = ACCENTS[Math.floor(i / 2) % ACCENTS.length];
  return i % 2 === 0 ? tone("acai", accent) : tone(accent, "acai");
}

/**
 * Default chosen (bipe#463): mesh on every panel and card (MZ removed the grain on 21 Oct 2026: "be lean"; it also made each card about 1.3 MB), tones from brandTone(), and the large
 * tone-on-tone brand mark behind the content (MZ: "bring back the logo shape on all").
 */
export const BRAND = { texture: "mesh", tone: brandTone, mark: true };
