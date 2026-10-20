// The parts of a store panel (bipe-chat/bipe#463), as Satori nodes for scripts/store-images.mjs.
// The text and the layout name come from the `## Screenshots` table in bipe-shared/product/appstore.md
// (`layout`, `badge`, `callout`). What the builder needs to know about each capture (the region to
// show larger, the people at the frame, a second screen) is in SCENES below.
//
// Layouts: hero (brand row, then the largest callout of the set), phone, tilt-left, tilt-right,
// two-phones, text (no capture: an outline of Brazil with a server). The backdrop under the panel
// is scripts/lib/backdrop.mjs; panels paint no background of their own.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { h } from "../og.mjs";
import { RAMPS } from "./backdrop.mjs";
import { squirclePath } from "./squircle.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const WHITE = "#FFFFFF";
const BEZEL = "#0C0D0F";
// Text on a white chip. Always açaí: the fruit ramps never carry text (backdrop.mjs).
const CHIP_INK = RAMPS.acai[1100];

/**
 * Per capture slug: `region` is the part of the capture the callout shows larger, as fractions of
 * the capture (x, y, w, h); `people` are cast ids shown at the frame (names only, never a number);
 * `second` is the capture for the back phone of the two-phones layout. The regions match the
 * captures of bipe-ios/appstore/capture.sh (bipe-chat/bipe#462). Move a region when a screen moves.
 */
export const SCENES = {
  "aviso-golpe": { region: [0.03, 0.62, 0.94, 0.2], people: ["gabi"] },
  pedidos: { region: [0.02, 0.135, 0.96, 0.11], people: ["camila"] },
  "conferir-pix": { region: [0.05, 0.24, 0.9, 0.2], second: "conferir-pix-alterado" },
  "seu-arroba": { region: [0.2, 0.52, 0.6, 0.33] },
  "selo-cnpj": { region: [0.03, 0.05, 0.46, 0.07] },
  grupos: { region: [0.02, 0.175, 0.96, 0.095], people: ["antonio", "bia"] },
  stickers: { region: [0.05, 0.21, 0.7, 0.34] },
};

/** Captures a panel needs, by slug: its own and the back phone of two-phones. */
export function captureSlugs(panel) {
  if (panel.feature === "-") return [];
  const second = panel.layout === "two-phones" ? SCENES[panel.slug]?.second : null;
  if (panel.layout === "two-phones" && !second) throw new Error(`panels: ${panel.slug} has layout two-phones but no second capture in SCENES`);
  return second ? [panel.slug, second] : [panel.slug];
}

// Layout per device kind, in units of a canvas 1320 wide; `s` scales them to the real width, so the
// type has the same proportion on every device. Headlines get 2 lines (bipe-chat/bipe#463).
// The shadow has no negative spread: resvg 2.6 panics on one in the iPad layout.
const LAYOUT = {
  phone: { side: 96, top: 150, badge: 32, headline: 112, sub: 48, gap: 26, frameTop: 820, screen: 900, bezel: 22, person: 168, brand: 72 },
  // Play phone: 1080x1920 is shorter than the iPhone, so the phone is smaller and higher.
  play: { side: 96, top: 130, badge: 32, headline: 104, sub: 46, gap: 24, frameTop: 760, screen: 760, bezel: 20, person: 150, brand: 66 },
  tablet: { side: 96, top: 90, badge: 26, headline: 84, sub: 38, gap: 20, frameTop: 540, screen: 860, bezel: 20, person: 128, brand: 56 },
};
// Phone placement per layout: x offset of the phone centre from the canvas centre, rotation in
// degrees, and the screen width as a share of the layout screen. The callout moves to the other side.
const PLACE = {
  hero: { dx: 110, rotate: -2, scale: 0.9, top: 90 },
  phone: { dx: 0, rotate: 0, scale: 1, top: 0 },
  "tilt-left": { dx: 80, rotate: -3, scale: 1, top: 0 },
  "tilt-right": { dx: -80, rotate: 3, scale: 1, top: 0 },
  "two-phones": { dx: 150, rotate: 4, scale: 0.9, top: 40 },
};

const photos = new Map();
const cast = JSON.parse(readFileSync(join(root, "src/cast/cast.json"), "utf8")).cast;
/** A cast person as the panels show them: the short name and the photo as a data URL. */
function person(id) {
  const e = cast.find((c) => c.id === id);
  if (!e?.photo) throw new Error(`panels: cast entry ${id} has no photo`);
  const file = join(root, "src/cast/photos", `${"copyOf" in e.photo ? e.photo.copyOf : e.id}.jpg`);
  if (!photos.has(file)) photos.set(file, `data:image/jpeg;base64,${readFileSync(file).toString("base64")}`);
  return { name: e.short ?? e.name, photo: photos.get(file) };
}

/** Text with `*highlight*` spans, as inline runs. */
const rich = (text, colour) =>
  text.split(/(\*[^*]+\*)/).filter(Boolean).map((part) => (part.startsWith("*") ? h("span", { style: { color: colour } }, part.slice(1, -1)) : part));

const abs = (style, ...children) => h("div", { style: { position: "absolute", display: "flex", ...style } }, ...children);

const chip = (text, size, s, style = {}) =>
  h("div", { style: { display: "flex", padding: `${size * 0.32}px ${size * 0.7}px`, borderRadius: 999, backgroundColor: WHITE, color: CHIP_INK, fontSize: size, fontWeight: 800, lineHeight: 1.1, boxShadow: `0 ${8 * s}px ${24 * s}px rgba(0,0,0,0.22)`, ...style } }, text);

function brandRow(markPath, size) {
  return h("div", { style: { display: "flex", alignItems: "center", gap: size * 0.3 } },
    h("svg", { width: size, height: size, viewBox: "0 0 64 64" }, h("path", { d: markPath, fill: WHITE })),
    h("div", { style: { display: "flex", fontSize: size * 0.95, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1 } }, "bipe"),
  );
}

function copyBlock({ panel, L, s, t, markPath, hero, align = "flex-start" }) {
  return h("div", { style: { display: "flex", flexDirection: "column", gap: L.gap * s, alignItems: align, textAlign: align === "center" ? "center" : "left" } },
    hero ? h("div", { style: { display: "flex", marginBottom: L.gap * s } }, brandRow(markPath, L.brand * s)) : null,
    panel.badge ? h("div", {
      style: { display: "flex", padding: `${L.badge * 0.38 * s}px ${L.badge * 0.8 * s}px`, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.16)", fontSize: L.badge * s, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", lineHeight: 1 },
    }, panel.badge) : null,
    h("div", { style: { display: "block", fontSize: L.headline * s, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.06 } }, ...rich(panel.headline, t.highlight)),
    panel.sub ? h("div", { style: { display: "block", fontSize: L.sub * s, fontWeight: 600, lineHeight: 1.25, color: t.sub } }, ...rich(panel.sub, t.ink)) : null,
  );
}

/** Rotates the point (x, y) by `deg` around (cx, cy), as CSS rotate() does with y down. */
function turn([x, y], [cx, cy], deg) {
  const a = (deg * Math.PI) / 180;
  return [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)];
}

/**
 * A phone as [shadow, body]. The bezel and the screen are continuous-corner paths (squircle.mjs)
 * with the screen radius of the capture device (bipe-ios/appstore/devices.mjs, `screenRadius`). The
 * capture is clipped with the screen path, not a CSS radius, so the corners match an iPhone. When
 * `region` is set, an outline marks the region the callout shows.
 */
function phone({ capture, left, top, screenW, L, s, rotate, region }) {
  const screenH = screenW * (capture.height / capture.width);
  const bezel = L.bezel * s;
  const radius = capture.radius * (screenW / capture.width);
  const w = screenW + 2 * bezel;
  const hh = screenH + 2 * bezel;
  const frame = squirclePath(w, hh, radius + bezel);
  const outline = region
    ? abs({ left: bezel + region[0] * screenW - 8 * s, top: bezel + region[1] * screenH - 8 * s, width: region[2] * screenW + 16 * s, height: region[3] * screenH + 16 * s, border: `${6 * s}px solid ${CHIP_INK}`, borderRadius: 24 * s, boxShadow: `0 0 0 ${5 * s}px ${WHITE}` })
    : null;
  // resvg 2.6 panics on a box shadow inside a rotated element (iPad tilt), so the shadow is the
  // frame path, blurred, in its own SVG, turned with the same angle, behind the phone.
  const pad = 200 * s;
  const shadow = abs({ left: left - pad, top: top - pad, width: w + 2 * pad, height: hh + 2 * pad },
    h("svg", { width: w + 2 * pad, height: hh + 2 * pad, viewBox: `0 0 ${w + 2 * pad} ${hh + 2 * pad}` },
      h("defs", {}, h("filter", { id: "phone-shadow", x: "-50%", y: "-50%", width: "200%", height: "200%" }, h("feGaussianBlur", { stdDeviation: 40 * s }))),
      h("g", { transform: `rotate(${rotate ?? 0} ${pad + w / 2} ${pad + hh / 2}) translate(${pad} ${pad + 40 * s})` },
        h("path", { d: frame, fill: "rgba(0,0,0,0.35)", filter: "url(#phone-shadow)" })),
    ));
  // The bezel is an SVG path; the capture is a Satori image clipped with the screen path (Satori
  // writes CSS clip-path as an SVG clipPath). An <image> inside an inline SVG does not render.
  const body = abs({ left, top, width: w, height: hh, transform: rotate ? `rotate(${rotate}deg)` : undefined },
    h("svg", { width: w, height: hh, viewBox: `0 0 ${w} ${hh}`, style: { position: "absolute", left: 0, top: 0 } }, h("path", { d: frame, fill: BEZEL })),
    h("img", { src: capture.dataUrl, width: screenW, height: screenH, style: { position: "absolute", left: bezel, top: bezel, clipPath: `path("${squirclePath(screenW, screenH, radius)}")` } }),
    outline);
  return [shadow, body];
}

/** The region of the capture, shown larger in a white card, with the panel's callout label. */
function calloutCard({ capture, region, left, top, width, label, s, labelSize }) {
  const [rx, ry, rw, rh] = region;
  const imgW = width / rw;
  const imgH = imgW * (capture.height / capture.width);
  const height = rh * imgH;
  return abs({ left, top, width, height, flexDirection: "column" },
    abs({ left: 0, top: 0, width, height, overflow: "hidden", borderRadius: 32 * s, border: `${6 * s}px solid ${WHITE}`, boxShadow: `0 ${30 * s}px ${70 * s}px rgba(0,0,0,0.4)`, backgroundColor: WHITE },
      h("img", { src: capture.dataUrl, width: imgW, height: imgH, style: { position: "absolute", left: -rx * imgW, top: -ry * imgH } }),
    ),
    label ? abs({ left: 36 * s, top: -labelSize * 0.9 }, chip(label, labelSize, s)) : null,
  );
}

function capturePanel({ panel, width, height, kind, captures, tone: t, markPath }) {
  const s = width / 1320;
  const L = LAYOUT[kind];
  const layout = panel.layout || "phone";
  const P = PLACE[layout];
  if (!P) throw new Error(`panels: ${panel.slug}: layout ${layout} needs a capture-free panel`);
  const scene = SCENES[panel.slug] ?? {};
  const capture = captures.get(panel.slug);
  const screenW = L.screen * P.scale * s;
  const screenH = screenW * (capture.height / capture.width);
  const frameW = screenW + 2 * L.bezel * s;
  const frameH = screenH + 2 * L.bezel * s;
  const frameLeft = (width - frameW) / 2 + P.dx * s;
  const frameTop = (L.frameTop + P.top) * s;
  const centre = [frameLeft + frameW / 2, frameTop + frameH / 2];
  const parts = [];
  // Vertical spans the callout card takes, so the people do not cover it.
  const taken = [];

  if (layout === "two-phones") {
    const back = captures.get(scene.second);
    const backW = screenW * 0.86;
    parts.push(...phone({ capture: back, left: frameLeft - 330 * s, top: frameTop - 60 * s, screenW: backW, L, s, rotate: -7 }));
  }
  parts.push(...phone({ capture, left: frameLeft, top: frameTop, screenW, L, s, rotate: P.rotate, region: scene.region }));

  if (scene.region) {
    // The card is wider than the region on the screen: the hero card is the largest object on the
    // panel. It sits beside the region (above it in the lower half, below it in the upper half), on
    // the side away from the phone, with a thin connector to the outlined region.
    const [rx, ry, rw, rh] = scene.region;
    const bezel = L.bezel * s;
    const regionW = rw * screenW;
    const regionH = rh * screenH;
    const cardW = layout === "hero" ? width - 2 * 56 * s : Math.min(width - 2 * 64 * s, Math.max(620 * s, regionW * 1.4));
    const cardH = regionH * (cardW / regionW);
    const anchorTop = turn([frameLeft + bezel + (rx + rw / 2) * screenW, frameTop + bezel + ry * screenH - 8 * s], centre, P.rotate);
    const anchorBottom = turn([frameLeft + bezel + (rx + rw / 2) * screenW, frameTop + bezel + (ry + rh) * screenH + 8 * s], centre, P.rotate);
    const visibleMid = (frameTop + height) / 2;
    const above = anchorTop[1] > visibleMid;
    const gap = 90 * s;
    let cardTop = above ? anchorTop[1] - gap - cardH : anchorBottom[1] + gap;
    cardTop = Math.max(frameTop - 40 * s, Math.min(height - cardH - 48 * s, cardTop));
    const cardLeft = Math.max(56 * s, Math.min(width - cardW - 56 * s, (width - cardW) / 2 - P.dx * 0.8 * s));
    const anchor = above ? anchorTop : anchorBottom;
    const cardEdge = [Math.max(cardLeft + 60 * s, Math.min(cardLeft + cardW - 60 * s, anchor[0])), above ? cardTop + cardH : cardTop];
    parts.push(abs({ left: 0, top: 0, width, height },
      h("svg", { width, height, viewBox: `0 0 ${width} ${height}` },
        // An açaí core with a white halo, so the line shows on the light screen and on the backdrop.
        h("line", { x1: anchor[0], y1: anchor[1], x2: cardEdge[0], y2: cardEdge[1], stroke: WHITE, "stroke-width": 13 * s, "stroke-linecap": "round" }),
        h("line", { x1: anchor[0], y1: anchor[1], x2: cardEdge[0], y2: cardEdge[1], stroke: CHIP_INK, "stroke-width": 5 * s, "stroke-linecap": "round" }),
        h("circle", { cx: anchor[0], cy: anchor[1], r: 16 * s, fill: WHITE }),
        h("circle", { cx: anchor[0], cy: anchor[1], r: 10 * s, fill: CHIP_INK }),
      )));
    parts.push(calloutCard({ capture, region: scene.region, left: cardLeft, top: cardTop, width: cardW, label: panel.callout, s, labelSize: L.badge * 1.15 * s }));
    taken.push([cardTop - L.badge * 1.2 * s, cardTop + cardH]);
  }

  // People at the frame edge, on the side the phone leaves free.
  (scene.people ?? []).forEach((id, i) => {
    const p = person(id);
    const d = L.person * s;
    const onLeft = P.dx >= 0;
    const x = onLeft ? Math.max(40 * s, frameLeft - d * 0.55) : Math.min(width - d - 40 * s, frameLeft + frameW - d * 0.45);
    // Photo with its ring, the gap and the name chip.
    const blockH = d + 14 * s + 12 * s + L.badge * 1.1 * 1.64 * s + 24 * s;
    const free = (y) => y + blockH < height - 40 * s && taken.every(([a, b]) => y + blockH < a - 20 * s || y > b + 20 * s);
    const y = [frameTop + 140 * s, ...taken.flatMap(([a, b]) => [b + 40 * s, a - blockH - 40 * s]), frameTop + frameH * 0.55]
      .filter((v) => v >= frameTop).find(free) ?? frameTop + 140 * s;
    taken.push([y, y + blockH]);
    parts.push(abs({ left: x, top: y, flexDirection: "column", alignItems: onLeft ? "flex-start" : "flex-end", gap: 12 * s },
      h("img", { src: p.photo, width: d, height: d, style: { borderRadius: d / 2, border: `${7 * s}px solid ${WHITE}`, objectFit: "cover", boxShadow: `0 ${16 * s}px ${40 * s}px rgba(0,0,0,0.3)` } }),
      chip(p.name, L.badge * 1.1 * s, s),
    ));
  });

  return h("div", { style: { width, height, display: "flex", position: "relative", overflow: "hidden", color: t.ink, fontFamily: "Nunito" } },
    ...parts,
    abs({ left: L.side * s, top: L.top * s, width: width - 2 * L.side * s }, copyBlock({ panel, L, s, t, markPath, hero: layout === "hero" })),
  );
}

// Brazil, simplified to 59 border points (longitude, latitude), for the text panel. A plain outline:
// the Brazil point is proof, not a slogan (ADR 0047), so there is no flag and no national colour.
const BRAZIL = [
  [-51.6, 4.4], [-50.0, 1.8], [-49.9, -0.5], [-48.0, -0.7], [-44.5, -2.5], [-41.5, -2.9], [-38.5, -3.7], [-35.2, -5.2], [-34.8, -7.1],
  [-35.3, -9.7], [-37.0, -11.0], [-38.5, -13.0], [-39.0, -17.5], [-40.3, -20.3], [-42.0, -22.9], [-43.2, -23.0], [-46.3, -24.0],
  [-48.5, -26.2], [-48.6, -28.5], [-50.2, -30.5], [-52.1, -32.2], [-53.4, -33.7], [-53.5, -32.5], [-55.5, -30.9], [-57.6, -30.2],
  [-56.0, -28.0], [-53.8, -27.2], [-54.6, -25.6], [-54.3, -24.0], [-55.4, -23.9], [-55.7, -22.3], [-57.9, -22.1], [-58.0, -19.9],
  [-57.6, -18.0], [-58.4, -16.3], [-60.2, -16.3], [-60.4, -13.5], [-61.9, -13.5], [-65.0, -11.9], [-65.4, -10.0], [-66.6, -9.9],
  [-69.5, -11.0], [-70.6, -11.0], [-72.5, -9.5], [-73.9, -7.4], [-72.9, -5.2], [-70.0, -4.2], [-69.4, -1.3], [-69.8, 0.6],
  [-67.0, 2.0], [-64.0, 2.0], [-63.4, 3.9], [-60.7, 5.2], [-59.8, 4.0], [-58.0, 1.5], [-56.0, 2.0], [-54.0, 2.2], [-52.0, 2.5],
];
const SAO_PAULO = [-46.6, -23.5];
const project = ([lon, lat]) => [(lon + 74) * Math.cos((15 * Math.PI) / 180), 5.3 - lat];

function brazilMap({ size, s, t }) {
  const pts = BRAZIL.map(project);
  const w = Math.max(...pts.map((p) => p[0]));
  const hh = Math.max(...pts.map((p) => p[1]));
  const k = size / Math.max(w, hh);
  const d = `M${pts.map(([x, y]) => `${(x * k).toFixed(1)} ${(y * k).toFixed(1)}`).join("L")}Z`;
  const [px, py] = project(SAO_PAULO).map((v) => v * k);
  const server = 150 * s;
  // Satori passes an <svg> through to resvg; the server glyph is plain markup inside it.
  return h("svg", { width: w * k, height: hh * k, viewBox: `0 0 ${w * k} ${hh * k}`, style: { overflow: "visible" } },
    h("path", { d, fill: "rgba(255,255,255,0.12)", stroke: WHITE, "stroke-width": 6 * s, "stroke-linejoin": "round" }),
    ...[1, 2, 3].map((n) => h("circle", { cx: px, cy: py, r: (60 + n * 70) * s, fill: "none", stroke: WHITE, "stroke-opacity": 0.5 / n, "stroke-width": 4 * s })),
    h("rect", { x: px - server / 2, y: py - server * 0.75, width: server, height: server * 0.98, rx: 22 * s, fill: WHITE }),
    ...[0, 1, 2].flatMap((i) => [
      h("rect", { x: px - server / 2 + 14 * s, y: py - server * 0.62 + i * 40 * s, width: server - 28 * s, height: 30 * s, rx: 8 * s, fill: CHIP_INK }),
      h("circle", { cx: px + server / 2 - 34 * s, cy: py - server * 0.62 + 15 * s + i * 40 * s, r: 5 * s, fill: WHITE }),
    ]),
  );
}

function textPanel({ panel, width, height, kind, tone: t, markPath }) {
  const s = width / 1320;
  const L = LAYOUT[kind];
  const mapSize = Math.min(width - 2 * L.side * s, height * 0.5);
  return h("div", { style: { width, height, display: "flex", position: "relative", overflow: "hidden", color: t.ink, fontFamily: "Nunito" } },
    abs({ left: L.side * s, top: L.top * s, width: width - 2 * L.side * s }, copyBlock({ panel, L, s, t, markPath })),
    abs({ left: (width - mapSize) / 2, top: height - mapSize - (kind === "tablet" ? 70 : 220) * s, width: mapSize, height: mapSize, justifyContent: "center" }, brazilMap({ size: mapSize, s, t })),
  );
}

/** Play feature graphic: mark and wordmark with the store subtitle, and the hero callout. */
function featureGraphic({ panel, subtitle, width, height, captures, tone: t, markPath }) {
  const capture = captures.get(panel.slug);
  const region = SCENES[panel.slug]?.region;
  const cardW = 440;
  return h("div", { style: { width, height, display: "flex", position: "relative", overflow: "hidden", color: t.ink, fontFamily: "Nunito" } },
    abs({ left: 64, top: 0, width: 470, height, flexDirection: "column", justifyContent: "center", gap: 28 },
      brandRow(markPath, 96),
      h("div", { style: { display: "block", fontSize: 46, fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1.12 } }, subtitle),
    ),
    capture && region
      ? calloutCard({ capture, region, left: width - cardW - 56, top: (height - cardW * (region[3] / region[2]) * (capture.height / capture.width)) / 2, width: cardW, label: panel.callout, s: 0.5, labelSize: 26 })
      : null,
  );
}

/** The Satori node for one panel. `captures` maps slug to { dataUrl, width, height }. */
export function panelNode({ panel, dev, captures, tone: t, markPath, subtitle }) {
  const { width, height } = dev;
  if (dev.kind === "feature") return featureGraphic({ panel, subtitle, width, height, captures, tone: t, markPath });
  const kind = dev.kind;
  if (panel.feature === "-") return textPanel({ panel, width, height, kind, tone: t, markPath });
  return capturePanel({ panel, width, height, kind, captures, tone: t, markPath });
}
