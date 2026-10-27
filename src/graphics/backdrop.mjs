// Shared SVG renderer for the banner maker, link previews and store panels.
// Receives the shared palette from its caller; works in browsers and Node.
export const TEXTURES = ["mesh", "pattern"];
const WHITE = "#FFFFFF";
// Blobs never use a step lighter than 900, so white text keeps at least 5.25:1 under a blob.
const BLOB_OPACITY = 0.85;

/**
 * A tone: the base ramp fills the image and the accent ramp adds one blob and the highlight.
 * `ramp` and `accent` are keys of RAMPS.
 */
export function toneForRamps(ramps, ramp, accent = ramp) {
  const r = ramps[ramp];
  const a = ramps[accent];
  if (!r || !a) throw new Error(`backdrop: unknown ramp ${r ? accent : ramp}`);
  return {
    name: accent === ramp ? ramp : `${ramp}+${accent}`,
    base: r[1100],
    blobs: [r[900], a[1000], r[1300]],
    mark: [r[900], r[1300]],
    // The brand mark behind every panel and card: one step lighter than the base.
    brandMark: r[1000],
    ink: WHITE,
    sub: "rgba(255,255,255,0.88)",
    highlight: accent === ramp ? r[500] : a[500],
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

