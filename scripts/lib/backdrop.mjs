// The brand backdrop for every rendered image: the link-preview cards (scripts/og.mjs) and the store
// panels (scripts/store-images.mjs). One module, so the cards and the panels have the same texture.
// The backdrop is plain SVG. compose() puts it under the Satori output before resvg rasterises it,
// so text and frames always paint on top of it.
//
// Textures (bipe-chat/bipe#463):
//   mesh     2 or 3 large radial blobs from the ramps, layered on the base step
//   grain    mesh plus a fine feTurbulence noise layer at low opacity
//   pattern  mesh plus the Bipe mark at large scale, cropped, tone on tone
//
// Ramps: açaí is acai in bipe-tokens. The fruit ramps are a proposal for marketing backgrounds only,
// solved like bipe-tokens/bipe/acai-ramp.mjs (OKLCH, the same WCAG step targets as Compound green on
// the light theme). They move to bipe-tokens when MZ picks them; until then they live only here.
// Never use them for trust or state colours (bipe/docs/design/trust-ui.md).

export const RAMPS = {
  acai: { 100: "#FFFAFF", 200: "#FFF5FF", 300: "#FAEFF9", 400: "#F5E0F2", 500: "#EFC7EA", 600: "#E8B3E2", 700: "#DB96D4", 800: "#BF6BB9", 900: "#A24A9C", 1000: "#913C8C", 1100: "#80307B", 1200: "#682264", 1300: "#4C1749", 1400: "#321030" },
  // Coral, OKLCH hue 33. Between Compound red (25) and orange (42): background fields only, never text or borders.
  pitanga: { 100: "#FFFBF7", 200: "#FFF7F3", 300: "#FFEFEB", 400: "#FFDFD8", 500: "#FFC6B8", 600: "#FEB19F", 700: "#F6927C", 800: "#DF634A", 900: "#C13F26", 1000: "#AE2F16", 1100: "#9B2208", 1200: "#7E1500", 1300: "#5D0E00", 1400: "#3E0B03" },
  // Deep violet, OKLCH hue 305, low chroma.
  jabuticaba: { 100: "#FFFAFF", 200: "#FCF6FF", 300: "#F5F0FD", 400: "#EAE3F5", 500: "#DBCDEE", 600: "#CFBCE7", 700: "#BBA2DA", 800: "#9B7BBF", 900: "#7E5DA2", 1000: "#6F5092", 1100: "#614381", 1200: "#4D3468", 1300: "#38244C", 1400: "#241832" },
  // Blue-black of the jenipapo dye, OKLCH hue 230.
  jenipapo: { 100: "#F0FFFF", 200: "#ECFBFF", 300: "#E6F5FB", 400: "#D1EAF4", 500: "#ACDAED", 600: "#8FCDE6", 700: "#62B8D8", 800: "#0A95BB", 900: "#00759B", 1000: "#006589", 1100: "#005778", 1200: "#004460", 1300: "#003145", 1400: "#00212E" },
};

export const TEXTURES = ["mesh", "grain", "pattern"];
const WHITE = "#FFFFFF";
const GRAIN_OPACITY = 0.1;
// Blobs never use a step lighter than 900, so white text keeps at least 5.25:1 under a blob.
const BLOB_OPACITY = 0.85;

/**
 * A tone: the base ramp fills the image and the accent ramp adds one blob and the highlight.
 * `ramp` and `accent` are keys of RAMPS.
 */
export function tone(ramp, accent = ramp) {
  const r = RAMPS[ramp];
  const a = RAMPS[accent];
  if (!r || !a) throw new Error(`backdrop: unknown ramp ${r ? accent : ramp}`);
  return {
    name: accent === ramp ? ramp : `${ramp}+${accent}`,
    base: r[1100],
    blobs: [r[900], a[1000], r[1300]],
    mark: [r[900], r[1300]],
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
 * base, each blob at full blob opacity, each mark, each with the white grain on top.
 */
export function toneContrast(t, texture) {
  const fields = [t.base, ...t.blobs.map((b) => mixRgb(hexRgb(t.base), hexRgb(b), BLOB_OPACITY)), ...(texture === "pattern" ? t.mark : [])]
    .map((c) => (typeof c === "string" ? hexRgb(c) : c))
    .map((c) => (texture === "grain" ? mixRgb(c, [255, 255, 255], GRAIN_OPACITY) : c));
  const min = (fg) => Math.min(...fields.map((f) => contrast(hexRgb(fg), f)));
  return { ink: min(t.ink), highlight: min(t.highlight) };
}

/** Throws when the headline would fall below AA: 4.5:1 for the white ink, 3:1 for the large highlight. */
export function checkTone(t, texture) {
  const c = toneContrast(t, texture);
  if (c.ink < 4.5 || c.highlight < 3) throw new Error(`backdrop ${t.name}/${texture}: contrast ink ${c.ink.toFixed(2)}, highlight ${c.highlight.toFixed(2)}; AA needs 4.5 and 3`);
  return c;
}

/** SVG markup for the backdrop of a width x height image. `variant` picks the blob and mark places. */
export function backdropSvg({ width, height, texture = "grain", tone: t, markPath, variant = 0 }) {
  if (!TEXTURES.includes(texture)) throw new Error(`backdrop: unknown texture ${texture}`);
  checkTone(t, texture);
  const side = Math.max(width, height);
  const places = BLOB_PLACES[variant % BLOB_PLACES.length];
  const defs = [];
  const layers = [`<rect width="${width}" height="${height}" fill="${t.base}"/>`];
  places.forEach(([x, y, r], i) => {
    defs.push(`<radialGradient id="bd_blob${i}"><stop offset="0" stop-color="${t.blobs[i]}" stop-opacity="${BLOB_OPACITY}"/><stop offset="1" stop-color="${t.blobs[i]}" stop-opacity="0"/></radialGradient>`);
    layers.push(`<circle cx="${x * width}" cy="${y * height}" r="${r * side}" fill="url(#bd_blob${i})"/>`);
  });
  if (texture === "pattern") {
    MARK_PLACES[variant % MARK_PLACES.length].forEach(([x, y, size], i) => {
      const scale = (size * side) / 64;
      layers.push(`<path transform="translate(${x * width} ${y * height}) scale(${scale})" d="${markPath}" fill="${t.mark[i % t.mark.length]}" fill-opacity="0.6"/>`);
    });
  }
  if (texture === "grain") {
    // Two noise layers: light specks and dark specks, so the grain does not shift the tone.
    defs.push(
      `<filter id="bd_grain" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 2.2 0 0 0 -1.15"/></filter>`,
      `<filter id="bd_grain_dark" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="19" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 2.2 0 0 0 -1.15"/></filter>`,
    );
    layers.push(
      `<rect width="${width}" height="${height}" filter="url(#bd_grain)" opacity="${GRAIN_OPACITY}"/>`,
      `<rect width="${width}" height="${height}" filter="url(#bd_grain_dark)" opacity="${GRAIN_OPACITY}"/>`,
    );
  }
  return `<defs>${defs.join("")}</defs>${layers.join("")}`;
}

/** Puts the backdrop under a Satori SVG (whose root is transparent). */
export function compose(satoriSvg, backdrop) {
  const end = satoriSvg.indexOf(">") + 1;
  return `${satoriSvg.slice(0, end)}${backdrop}${satoriSvg.slice(end)}`;
}

/**
 * The brand choice for the cards and the panels. A store set alternates the tones panel by panel.
 * Default chosen (bipe#463): grain on açaí, alternating with pitanga, until MZ picks from the sheet.
 */
export const BRAND = { texture: "grain", tones: [tone("acai", "pitanga"), tone("pitanga", "acai")] };
