// The parts of a store panel (bipe-chat/bipe#463), as Satori nodes for scripts/store-images.mjs.
// The text and the layout name come from the `## Screenshots` table in bipe-shared/product/appstore.md
// (`headline`, `sub`, `layout`, `callout`). The region of each capture that a callout shows is in SCENES below.
//
// One device per panel: an upright phone at the same size and place on every panel, its top under
// the copy, running off the bottom edge. A callout (a row with text in the `callout` column) shows
// one region of the screen larger, in a white card over the phone, where the detail is too small to
// read at store size. Layouts: hero (brand row above the copy) and phone. The text layout (a panel
// with no capture) has no drawing: the Brazil outline was dropped on 20 October 2026 and can come
// back with a better drawing (bipe-chat/bipe#463). The backdrop is scripts/lib/backdrop.mjs.
import { h } from "../og.mjs";
import { RAMPS } from "./backdrop.mjs";
import { squirclePath } from "./squircle.mjs";

const WHITE = "#FFFFFF";
const BEZEL = "#0C0D0F";
// Text on a white chip. Always açaí: the fruit ramps never carry text (backdrop.mjs).
const CHIP_INK = RAMPS.acai[1100];

/**
 * Per capture slug: `region` is the part of the capture a callout shows larger, as fractions of the
 * capture (x, y, w, h). A panel shows the callout only when its `callout` column has text. The
 * regions match the pt-BR captures of bipe-ios/appstore/capture.sh from 20 October 2026
 * (bipe-chat/bipe#462). Move a region when a screen moves.
 */
export const SCENES = {
  "aviso-golpe": { region: [0.04, 0.672, 0.92, 0.22] },
  pedidos: { region: [0.02, 0.182, 0.96, 0.112] },
  "conferir-pix": { region: [0.06, 0.165, 0.89, 0.2] },
  "seu-arroba": { region: [0.2, 0.528, 0.6, 0.3] },
  "selo-cnpj": { region: [0.035, 0.06, 0.39, 0.058] },
  grupos: { region: [0.02, 0.185, 0.96, 0.095] },
  stickers: { region: [0.045, 0.222, 0.7, 0.322] },
};

/** Captures a panel needs, by slug. */
export const captureSlugs = (panel) => (panel.feature === "-" ? [] : [panel.slug]);

// Layout per device kind, in units of a canvas 1320 wide; `s` scales them to the real width, so the
// type has the same proportion on every device. Headlines get 2 lines. `frameTop` is the same on
// every panel and leaves room for the hero brand row, a 2-line headline and a 1-line sub.
// `margin` is the least gap between a callout card and the panel edge.
const LAYOUT = {
  phone: { side: 96, top: 140, label: 32, headline: 112, sub: 48, gap: 24, frameTop: 640, screen: 1000, bezel: 24, brand: 68, margin: 40 },
  // Play phone: 1080x1920 is shorter than the iPhone, so the phone is smaller.
  play: { side: 96, top: 120, label: 32, headline: 104, sub: 46, gap: 22, frameTop: 590, screen: 780, bezel: 22, brand: 62, margin: 40 },
  tablet: { side: 96, top: 84, label: 26, headline: 84, sub: 38, gap: 18, frameTop: 440, screen: 900, bezel: 22, brand: 52, margin: 40 },
};

/** Text with `*highlight*` spans, as inline runs. */
const rich = (text, colour) =>
  text.split(/(\*[^*]+\*)/).filter(Boolean).map((part) => (part.startsWith("*") ? h("span", { style: { color: colour } }, part.slice(1, -1)) : part));

const abs = (style, ...children) => h("div", { style: { position: "absolute", display: "flex", ...style } }, ...children);

const chip = (text, size, s) =>
  h("div", { style: { display: "flex", padding: `${size * 0.32}px ${size * 0.7}px`, borderRadius: 999, backgroundColor: WHITE, color: CHIP_INK, fontSize: size, fontWeight: 800, lineHeight: 1.1, boxShadow: `0 ${8 * s}px ${24 * s}px rgba(0,0,0,0.22)` } }, text);

function brandRow(markPath, size) {
  return h("div", { style: { display: "flex", alignItems: "center", gap: size * 0.3 } },
    h("svg", { width: size, height: size, viewBox: "0 0 64 64" }, h("path", { d: markPath, fill: WHITE })),
    h("div", { style: { display: "flex", fontSize: size * 0.95, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1 } }, "bipe"),
  );
}

function copyBlock({ panel, L, s, t, markPath, hero }) {
  return h("div", { style: { display: "flex", flexDirection: "column", gap: L.gap * s, alignItems: "flex-start" } },
    hero ? h("div", { style: { display: "flex", marginBottom: L.gap * 0.5 * s } }, brandRow(markPath, L.brand * s)) : null,
    h("div", { style: { display: "block", fontSize: L.headline * s, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.06 } }, ...rich(panel.headline, t.highlight)),
    panel.sub ? h("div", { style: { display: "block", fontSize: L.sub * s, fontWeight: 600, lineHeight: 1.25, color: t.sub } }, ...rich(panel.sub, t.ink)) : null,
  );
}

/**
 * The phone as [shadow, body], upright. The bezel and the screen are continuous-corner paths
 * (squircle.mjs) with the screen radius of the capture device (bipe-ios/appstore/devices.mjs,
 * `screenRadius`). The capture sits inset in the bezel, clipped with the screen path (Satori writes
 * CSS clip-path as an SVG clipPath; an <image> inside an inline SVG does not render).
 */
function phone({ capture, left, top, screenW, bezel, s }) {
  const screenH = screenW * (capture.height / capture.width);
  const radius = capture.radius * (screenW / capture.width);
  const w = screenW + 2 * bezel;
  const hh = screenH + 2 * bezel;
  const frame = squirclePath(w, hh, radius + bezel);
  const pad = 200 * s;
  const shadow = abs({ left: left - pad, top: top - pad, width: w + 2 * pad, height: hh + 2 * pad },
    h("svg", { width: w + 2 * pad, height: hh + 2 * pad, viewBox: `0 0 ${w + 2 * pad} ${hh + 2 * pad}` },
      h("defs", {}, h("filter", { id: "phone-shadow", x: "-50%", y: "-50%", width: "200%", height: "200%" }, h("feGaussianBlur", { stdDeviation: 40 * s }))),
      h("path", { d: frame, transform: `translate(${pad} ${pad + 40 * s})`, fill: "rgba(0,0,0,0.35)", filter: "url(#phone-shadow)" }),
    ));
  const body = abs({ left, top, width: w, height: hh },
    h("svg", { width: w, height: hh, viewBox: `0 0 ${w} ${hh}`, style: { position: "absolute", left: 0, top: 0 } }, h("path", { d: frame, fill: BEZEL })),
    h("img", { src: capture.dataUrl, width: screenW, height: screenH, style: { position: "absolute", left: bezel, top: bezel, clipPath: `path("${squirclePath(screenW, screenH, radius)}")` } }),
  );
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

const cardHeight = (capture, region, width) => width * (region[3] / region[2]) * (capture.height / capture.width);

function capturePanel({ panel, width, height, kind, captures, tone: t, markPath }) {
  const s = width / 1320;
  const L = LAYOUT[kind];
  const capture = captures.get(panel.slug);
  const bezel = L.bezel * s;
  const screenW = L.screen * s;
  const screenH = screenW * (capture.height / capture.width);
  const frameW = screenW + 2 * bezel;
  const frameLeft = (width - frameW) / 2;
  const frameTop = L.frameTop * s;
  const parts = phone({ capture, left: frameLeft, top: frameTop, screenW, bezel, s });

  const region = SCENES[panel.slug]?.region;
  if (panel.callout && region) {
    // The card is a little wider than the phone and stays inside the panel. It sits over the lower
    // half of the visible phone, unless the region it enlarges is there: then it sits above it.
    const margin = L.margin * s;
    const labelSize = L.label * 1.15 * s;
    const cardW = Math.min(frameW + 100 * s, width - 2 * margin);
    const cardH = cardHeight(capture, region, cardW);
    const cardLeft = (width - cardW) / 2;
    const visibleBottom = Math.min(frameTop + screenH + 2 * bezel, height);
    const lowerMid = (frameTop + (visibleBottom - frameTop) * 0.5 + visibleBottom) / 2;
    const regionTop = frameTop + bezel + region[1] * screenH;
    const regionBottom = regionTop + region[3] * screenH;
    let cardTop = lowerMid - cardH / 2;
    if (cardTop < regionBottom + 40 * s && cardTop + cardH > regionTop - 40 * s) cardTop = regionTop - 60 * s - cardH;
    cardTop = Math.max(frameTop + labelSize, Math.min(height - margin - cardH, cardTop));
    parts.push(calloutCard({ capture, region, left: cardLeft, top: cardTop, width: cardW, label: panel.callout, s, labelSize }));
  }

  return h("div", { style: { width, height, display: "flex", position: "relative", overflow: "hidden", color: t.ink, fontFamily: "Nunito" } },
    ...parts,
    abs({ left: L.side * s, top: L.top * s, width: width - 2 * L.side * s }, copyBlock({ panel, L, s, t, markPath, hero: panel.layout === "hero" })),
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
  if (panel.feature === "-") throw new Error(`panels: ${panel.slug} is a text panel, and the builder has no drawing for it (bipe#463)`);
  return capturePanel({ panel, width, height, kind, captures, tone: t, markPath });
}
