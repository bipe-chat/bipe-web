// The brand backdrop for every rendered image: the link-preview cards (scripts/og.mjs) and the store
// panels (scripts/store-images.mjs). One module, so the cards and the panels have the same texture.
// The backdrop is plain SVG. compose() puts it under the Satori output before resvg rasterises it,
// so text and frames always paint on top of it.
//
// Textures (bipe-chat/bipe#463):
//   mesh     2 or 3 large radial blobs from the ramps, layered on the base step
//   pattern  mesh plus the Bipe mark at large scale, cropped, tone on tone
//
// Ramps come only from bipe-shared design/tokens.json (light theme): the app palettes (`appThemes`,
// bipe-chat/bipe#811), açaí first, so the images use the colours the user can pick in the app. Caju left
// the app palettes but stays for the neutral callout card (lib/callouts.mjs). The expressive ramps are
// for marketing backgrounds and callout accents only: never text or trust states (bipe-shared design/README.md).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const tokens = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../../bipe-shared/design/tokens.json"), "utf8"));
const light = (name) => tokens.ramps[name].light;
export const ACCENTS = Object.keys(tokens.appThemes.palettes).filter((k) => k !== "acai");
export const RAMPS = Object.fromEntries(["acai", ...ACCENTS, "caju"].map((k) => [k, light(k)]));

// App ramps for the store callouts (lib/callouts.mjs), so an enlarged element has the colours it has in
// the phone: amber is the caution colour of the scam warning, gray the text. The buttons and badges take
// the panel's palette from RAMPS (the app theme).
export const UI = Object.fromEntries(["amber", "gray"].map((k) => [k, light(k)]));

export const TEXTURES = ["mesh", "pattern"];
const WHITE = "#FFFFFF";
// On a dark tone, blobs never use a step lighter than 900, so white text keeps at least 5.25:1 under a blob.
const BLOB_OPACITY = 0.85;

// Palettes whose colour is only in the light steps: maracujá is yellow at 700 and olive at the dark
// steps that hold white text (MZ, 1 November 2026: "a muddy green, no yellow"). Their images take a
// light base and dark ink; checkTone() checks the ink the same way.
const LIGHT = new Set(["maracuja"]);

/**
 * A tone: the base ramp fills the image and the accent ramp adds one blob and the highlight.
 * `ramp` and `accent` are keys of RAMPS. `ink`, `sub` and `rule` are the text colours on it; `palette`
 * is the ramp the app theme of the image uses (lib/callouts.mjs).
 */
export function tone(ramp, accent = ramp) {
  const r = RAMPS[ramp];
  const a = RAMPS[accent];
  if (!r || !a) throw new Error(`backdrop: unknown ramp ${r ? accent : ramp}`);
  if (LIGHT.has(ramp)) {
    return {
      name: accent === ramp ? ramp : `${ramp}+${accent}`,
      palette: ramp,
      base: r[700],
      blobs: [r[600], a[accent === ramp ? 800 : 700], r[600]],
      mark: [r[600], r[800]],
      brandMark: r[600],
      ink: r[1400],
      sub: r[1200],
      rule: r[900],
      highlight: accent === ramp ? r[1200] : a[1100],
      connector: r[1100],
    };
  }
  return {
    name: accent === ramp ? ramp : `${ramp}+${accent}`,
    palette: ramp,
    base: r[1100],
    blobs: [r[900], a[1000], r[1300]],
    mark: [r[900], r[1300]],
    // The brand mark behind every panel and card: one step lighter than the base.
    brandMark: r[1000],
    ink: WHITE,
    sub: "rgba(255,255,255,0.88)",
    rule: "rgba(255,255,255,0.22)",
    highlight: accent === ramp ? r[500] : a[500],
    // The callout connector and its dots (lib/callouts.mjs): the panel's own palette (MZ, 1 November
    // 2026: the accents match the background), at a step that reads on the white screen, with a white
    // edge for the dark backdrop.
    connector: r[800],
  };
}

// Blob places per variant, as fractions of width and height, with the radius as a fraction of the
// longer side. Variants differ so that neighbouring panels in a set do not repeat.
const BLOB_PLACES = [
  [[0.95, 0.02, 0.62], [0.05, 0.55, 0.55], [0.7, 1.0, 0.7]],
  [[0.08, 0.05, 0.6], [0.95, 0.45, 0.5], [0.3, 1.0, 0.75]],
  [[0.5, -0.05, 0.55], [1.0, 0.8, 0.6], [0.0, 0.85, 0.6]],
];
// Mark places per variant: x, y as fractions, size as a fraction of the longer side.
const MARK_PLACES = [
  [[0.42, -0.14, 0.62], [-0.22, 0.58, 0.48]],
  [[-0.3, -0.06, 0.6], [0.55, 0.6, 0.55]],
  [[0.5, 0.42, 0.7], [-0.18, -0.1, 0.42]],
];

const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = (rgb) => {
  const [r, g, b] = rgb.map((v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const mixRgb = (a, b, t) => a.map((v, i) => v * (1 - t) + b[i] * t);
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

/**
 * The lowest contrast of the ink and the highlight against any colour the backdrop can show: the
 * base, each blob at full blob opacity, each mark.
 */
export function toneContrast(t, texture, mark = false) {
  const fields = [t.base, ...t.blobs.map((b) => mixRgb(hexRgb(t.base), hexRgb(b), BLOB_OPACITY)), ...(texture === "pattern" ? t.mark : []), ...(mark ? [t.brandMark] : [])]
    .map((c) => (typeof c === "string" ? hexRgb(c) : c));
  const min = (fg) => Math.min(...fields.map((f) => contrast(hexRgb(fg), f)));
  return { ink: min(t.ink), highlight: min(t.highlight) };
}

/** Throws when the headline would fall below AA: 4.5:1 for the white ink, 3:1 for the large highlight. */
export function checkTone(t, texture, mark = false) {
  const c = toneContrast(t, texture, mark);
  if (c.ink < 4.5 || c.highlight < 3) throw new Error(`backdrop ${t.name}/${texture}: contrast ink ${c.ink.toFixed(2)}, highlight ${c.highlight.toFixed(2)}; AA needs 4.5 and 3`);
  return c;
}

/** SVG markup for the backdrop of a width x height image. `variant` picks the blob and mark places. */
export function backdropSvg({ width, height, texture = "mesh", tone: t, markPath, variant = 0, mark = false }) {
  if (!TEXTURES.includes(texture)) throw new Error(`backdrop: unknown texture ${texture}`);
  checkTone(t, texture, mark);
  const side = Math.max(width, height);
  const places = BLOB_PLACES[variant % BLOB_PLACES.length];
  const defs = [];
  const layers = [`<rect width="${width}" height="${height}" fill="${t.base}"/>`];
  places.forEach(([x, y, r], i) => {
    defs.push(`<radialGradient id="bd_blob${i}"><stop offset="0" stop-color="${t.blobs[i]}" stop-opacity="${BLOB_OPACITY}"/><stop offset="1" stop-color="${t.blobs[i]}" stop-opacity="0"/></radialGradient>`);
    layers.push(`<circle cx="${x * width}" cy="${y * height}" r="${r * side}" fill="url(#bd_blob${i})"/>`);
  });
  if (mark) {
    // The Bipe bubble mark, large and tone on tone, at the same place and scale on every image:
    // 1.15 times the shorter side, from 30% across and 30% down, so the panel edge crops it.
    const size = 1.15 * Math.min(width, height);
    layers.push(`<path transform="translate(${0.3 * width} ${0.3 * height}) scale(${size / 64})" d="${markPath}" fill="${t.brandMark}"/>`);
  }
  if (texture === "pattern") {
    MARK_PLACES[variant % MARK_PLACES.length].forEach(([x, y, size], i) => {
      const scale = (size * side) / 64;
      layers.push(`<path transform="translate(${x * width} ${y * height}) scale(${scale})" d="${markPath}" fill="${t.mark[i % t.mark.length]}" fill-opacity="0.6"/>`);
    });
  }
  return `<defs>${defs.join("")}</defs>${layers.join("")}`;
}

/** Puts the backdrop under a Satori SVG (whose root is transparent). */
export function compose(satoriSvg, backdrop) {
  const end = satoriSvg.indexOf(">") + 1;
  return `${satoriSvg.slice(0, end)}${backdrop}${satoriSvg.slice(end)}`;
}

// The order of the app palettes in a set: the order with the largest OKLab distance (base step 1100)
// between neighbouring images, the last one included, with açaí first (MZ, 1 November 2026: picker order
// read as purple, pink, orange; then maracujá third, MZ the same day). It must hold every app palette once.
const ORDER = ["acai", "jenipapo", "maracuja", "jabuticaba", "goiaba", "pitanga"];
if (ORDER.length !== ACCENTS.length + 1 || !["acai", ...ACCENTS].every((k) => ORDER.includes(k)))
  throw new Error(`backdrop: ORDER must list the app palettes once each (${["acai", ...ACCENTS].join(", ")})`);

/**
 * The brand tone for image number i of a set (store panels in order, link-preview cards by route):
 * each image is one palette of ORDER, base, blobs and accents alike (MZ, 1 November 2026: no second
 * palette blended into a background). Every palette leads one image in turn and panel 1 is açaí.
 */
export function brandTone(i) {
  return tone(ORDER[i % ORDER.length]);
}

/**
 * Default chosen (bipe#463): mesh on every panel and card (MZ removed the grain on 21 Oct 2026: "be lean"; it also made each card about 1.3 MB), tones from brandTone(), and the large
 * tone-on-tone brand mark behind the content (MZ: "bring back the logo shape on all").
 */
export const BRAND = { texture: "mesh", tone: brandTone, mark: true };
