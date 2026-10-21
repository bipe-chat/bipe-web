// The callout layer of a store panel (prototype on aviso-golpe): one element of the screen, set again
// larger on a tilted card over the phone, with a connector from the card to the element in the phone.
//
// The callout is vector, not a crop of the capture: a crop enlarged about 2x from the 1320 px capture
// is soft (the region callouts of 4cdac24). Satori sets the card text flat; this module wraps it in an
// SVG group with the rotation and draws the card, its shadow, the connector and the accent strokes as
// plain SVG paths. resvg 2.6 panics on a Satori box shadow inside a rotated element, so no Satori
// shadow is used here. store-images.mjs puts the result over the panel with overlay().
//
// SPECS is prototype data. When the layer is approved, the spec moves to bipe-shared (a `## Callouts`
// table in product/appstore.md) and `anchor` comes from the element frames that the UI test exports.
import satori from "satori";
import { fonts, h } from "../og.mjs";
import { CAUTION, RAMPS } from "./backdrop.mjs";
import { screenBox, shotOf } from "./panels.mjs";

/**
 * One callout per panel slug, in units of a canvas 1320 wide.
 *   kind    the card layout (only `alert`, the scam warning, so far)
 *   title   a key in bipe-shared/strings
 *   line    one short line under the title, per locale
 *   top     the top of the card; the card is centred across the panel
 *   width, height, tilt (degrees)
 *   anchor  the point of the capture the connector ends on, as fractions of the capture (x, y).
 *           Hand-placed from the pt-BR capture of 20 October 2026: the right edge of the second warning.
 *   from    the point of the card the connector starts on, as fractions of the card (x, y)
 */
export const SPECS = {
  "aviso-golpe": {
    kind: "alert",
    title: "bipe_scam_warning_title",
    line: { "pt-BR": "Confirme com a pessoa por outro meio.", "en-US": "Check with the person another way." },
    top: 1360,
    width: 1190,
    height: 340,
    tilt: -3,
    anchor: [0.738, 0.704],
    from: [0.84, 1],
  },
};

const WARNING = "M12 3 2 21h20L12 3Zm0 6v5m0 3v.5";

/** The text and the icon of an alert card, as a transparent Satori SVG of the card size. */
async function alertCard({ spec, title, line, w, hh, s }) {
  const node = h("div", { style: { width: w, height: hh, display: "flex", alignItems: "center", gap: 44 * s, padding: `0 ${70 * s}px`, fontFamily: "Nunito", color: CAUTION[1200] } },
    h("svg", { width: 150 * s, height: 150 * s, viewBox: "0 0 24 24", style: { flexShrink: 0 } },
      h("path", { d: WARNING, fill: "none", stroke: CAUTION[1100], "stroke-width": 2.2, "stroke-linejoin": "round", "stroke-linecap": "round" })),
    h("div", { style: { display: "flex", flexDirection: "column", gap: 10 * s } },
      h("div", { style: { display: "block", fontSize: 98 * s, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.05 } }, title),
      h("div", { style: { display: "block", fontSize: 50 * s, fontWeight: 600, lineHeight: 1.2, color: CAUTION[1100] } }, line),
    ),
  );
  // Each Satori render numbers its ids from zero; a prefix keeps them apart from the panel's ids.
  return (await satori(node, { width: w, height: hh, fonts })).replace(/satori_/g, `callout_${spec.kind}_`);
}

const rounded = (x, y, w, hh, r) => `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + hh - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + hh}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + hh - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;

/** A point of the card after the tilt, in panel pixels. */
function onCard([fx, fy], box, tilt) {
  const a = (tilt * Math.PI) / 180;
  const [cx, cy] = [box.x + box.w / 2, box.y + box.hh / 2];
  const [dx, dy] = [box.x + fx * box.w - cx, box.y + fy * box.hh - cy];
  return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)];
}

/**
 * The callout of a panel as SVG markup in panel pixels, or "" when the panel has none. `strings` is
 * the `strings` object of bipe-shared/strings/<lang>.json.
 */
export async function calloutSvg({ panel, dev, captures, locale, strings }) {
  const spec = SPECS[panel.slug];
  const capture = captures.get(shotOf(panel));
  if (!spec || !capture || dev.kind === "feature") return "";
  const title = strings[spec.title];
  const line = spec.line[locale];
  if (!title || !line) throw new Error(`callouts: ${panel.slug} has no text for ${locale}`);

  const s = dev.width / 1320;
  const box = { x: (dev.width - spec.width * s) / 2, y: spec.top * s, w: spec.width * s, hh: spec.height * s };
  const r = 64 * s;
  const rim = 12 * s;
  const screen = screenBox(dev, capture);
  const end = [screen.left + spec.anchor[0] * screen.width, screen.top + spec.anchor[1] * screen.height];
  const start = onCard(spec.from, box, spec.tilt);
  // The connector leaves the card downwards and comes into the element from the right.
  const bend = Math.abs(end[1] - start[1]);
  const curve = `M${start[0]} ${start[1]}C${start[0]} ${start[1] + bend * 0.55} ${end[0] + 260 * s} ${end[1]} ${end[0]} ${end[1]}`;
  const ink = CAUTION[1200];
  const dot = (p, rr) => `<circle cx="${p[0]}" cy="${p[1]}" r="${rr}" fill="${ink}" stroke="#FFFFFF" stroke-width="${5 * s}"/>`;
  // Two short strokes off the top-right corner of the card, in caju (expressive, decoration only).
  const spark = [[0.93, -0.12, 0.96, -0.42], [0.99, -0.02, 1.03, -0.22]].map(([x1, y1, x2, y2]) => {
    const [a, b] = [onCard([x1, y1], box, spec.tilt), onCard([x2, y2], box, spec.tilt)];
    return `<path d="M${a[0]} ${a[1]}L${b[0]} ${b[1]}" stroke="${RAMPS.caju[700]}" stroke-width="${22 * s}" stroke-linecap="round"/>`;
  });
  const [cx, cy] = [box.x + box.w / 2, box.y + box.hh / 2];
  const text = await alertCard({ spec, title, line, w: box.w, hh: box.hh, s });
  return [
    `<defs><filter id="callout-shadow" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="${36 * s}"/></filter></defs>`,
    `<path d="${curve}" fill="none" stroke="${ink}" stroke-width="${7 * s}" stroke-linecap="round"/>`,
    dot(end, 16 * s),
    `<g transform="rotate(${spec.tilt} ${cx} ${cy})">`,
    `<path d="${rounded(box.x, box.y + 36 * s, box.w, box.hh, r)}" fill="rgba(40,0,20,0.45)" filter="url(#callout-shadow)"/>`,
    `<path d="${rounded(box.x, box.y, box.w, box.hh, r)}" fill="${CAUTION[100]}"/>`,
    `<path d="${rounded(box.x + rim, box.y + rim, box.w - 2 * rim, box.hh - 2 * rim, r - rim)}" fill="${CAUTION[200]}" stroke="${CAUTION[500]}" stroke-width="${4 * s}"/>`,
    `<g transform="translate(${box.x} ${box.y})">${text}</g>`,
    `</g>`,
    dot(start, 16 * s),
    ...spark,
  ].join("");
}

/** Puts SVG markup over a Satori SVG, before its closing tag. */
export const overlay = (svg, markup) => (markup ? `${svg.slice(0, svg.lastIndexOf("</svg>"))}${markup}</svg>` : svg);
