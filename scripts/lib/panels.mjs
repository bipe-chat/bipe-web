// The parts of a store panel (bipe-chat/bipe#463), as Satori nodes for scripts/store-images.mjs.
// The text comes from the `## Screenshots` table in bipe-shared/product/appstore.md (`title`, `sub`).
//
// A panel, after Telegram and Signal: a short centred title, one subtitle sentence under it, and one
// large upright phone, centred, at 85% of the panel width (at 75% the whole phone fits above the edge), its top under the subtitle and its
// bottom cut by the panel edge, at the same place on every panel. The phone is an iPhone: a thin
// metallic rim and a thin black bezel with continuous corners, side buttons, the Dynamic Island and the status bar (9:41, signal, Wi-Fi,
// battery), drawn here because the captures have none. The backdrop is scripts/lib/backdrop.mjs.
import { h } from "../og.mjs";
import { squirclePath } from "./squircle.mjs";

const WHITE = "#FFFFFF";
const BEZEL = "#0C0D0F";
const INK = "#000000";

/**
 * The region of a capture that the Play feature graphic shows larger, as fractions of the capture
 * (x, y, w, h): the second scam message with its warning, in the pt-BR capture of 20 October 2026, 21:58.
 */
export const FEATURE_REGION = { "aviso-golpe": [0.03, 0.578, 0.84, 0.21] };

/** The capture slug of a panel: the `capture` column when set (social posts reuse store captures), else the slug. */
export const shotOf = (panel) => panel.capture || panel.slug;

/** Captures a panel needs, by slug. */
export const captureSlugs = (panel) => (panel.feature === "-" ? [] : [shotOf(panel)]);

// Layout per device kind, in units of a canvas 1320 wide; `s` scales them to the real width, so the
// type has the same proportion on every device. `frameTop` is the same on every panel and leaves
// room for a 1-line title and a 2-line sub. `frame` is the phone width with its bezel.
const LAYOUT = {
  // The sub is 60% of the title (MZ: the subtitle read like a caption). The phone is 1180 units
  // wide so that its bottom bezel and bottom corners fall off the panel: the screen runs out of
  // the bottom edge, about 180 units deep on every panel.
  phone: { top: 150, copy: 1120, title: 104, sub: 62, gap: 24, frameTop: 560, frame: 1180, bezel: 16, rim: 8, island: true },
  // Play phone: 1080x1920 is shorter than the iPhone.
  play: { top: 120, copy: 1120, title: 96, sub: 58, gap: 22, frameTop: 520, frame: 1000, bezel: 15, rim: 6, island: true },
  // Instagram (bipe-chat/bipe#465), all 1080 wide. The story keeps text out of the bands the IG bars
  // cover: the top 250 px and the bottom 340 px (306 and 416 units). Only the phone runs into them.
  post: { top: 120, copy: 1120, title: 96, sub: 58, gap: 22, frameTop: 510, frame: 900, bezel: 14, rim: 6, island: true },
  square: { top: 100, copy: 1120, title: 88, sub: 53, gap: 20, frameTop: 450, frame: 820, bezel: 13, rim: 5, island: true },
  story: { top: 330, copy: 1120, title: 100, sub: 60, gap: 24, frameTop: 780, frame: 960, bezel: 15, rim: 6, island: true },
};
// There is no iPad layout: the store set is iPhone and Play only (MZ, 20 October 2026; bipe#419).

const abs = (style, ...children) => h("div", { style: { position: "absolute", display: "flex", ...style } }, ...children);

function brandRow(markPath, size) {
  return h("div", { style: { display: "flex", alignItems: "center", gap: size * 0.3 } },
    h("svg", { width: size, height: size, viewBox: "0 0 64 64" }, h("path", { d: markPath, fill: WHITE })),
    h("div", { style: { display: "flex", fontSize: size * 0.95, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1 } }, "bipe"),
  );
}

function copyBlock({ panel, L, s, t }) {
  return h("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: L.gap * s, textAlign: "center" } },
    h("div", { style: { display: "block", fontSize: L.title * s, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.06 } }, panel.title),
    panel.sub ? h("div", { style: { display: "block", fontSize: L.sub * s, fontWeight: 600, lineHeight: 1.25, color: t.sub } }, panel.sub) : null,
  );
}

/**
 * The status bar and the Dynamic Island, in points of a 440 pt wide screen (iPhone 6.9"), scaled to
 * the screen width `w`. The island is 126 x 37 pt, 11 pt from the top; the time and the icons sit on
 * its centre line.
 */
function statusBar(w, island) {
  const k = w / 440;
  const cy = 29.5;
  const bars = [4, 6.2, 8.5, 11].map((bh, i) => h("rect", { x: 318 + i * 4.6, y: cy + 5.5 - bh, width: 3.2, height: bh, rx: 1, fill: INK }));
  const arc = (r) => {
    const a = Math.PI / 4;
    const [cx, by] = [347.5, cy + 5.5];
    return `M${cx - r * Math.sin(a)} ${by - r * Math.cos(a)}A${r} ${r} 0 0 1 ${cx + r * Math.sin(a)} ${by - r * Math.cos(a)}`;
  };
  return [
    abs({ left: 0, top: 0, width: w, height: 62 * k },
      h("svg", { width: w, height: 62 * k, viewBox: "0 0 440 62" },
        island ? h("rect", { x: 157, y: 11, width: 126, height: 37, rx: 18.5, fill: INK }) : null,
        ...bars,
        ...[4.5, 8, 11.5].map((r) => h("path", { d: arc(r), fill: "none", stroke: INK, "stroke-width": 2.1, "stroke-linecap": "round" })),
        h("rect", { x: 362, y: cy - 6, width: 25, height: 12, rx: 3.6, fill: "none", stroke: INK, "stroke-opacity": 0.4, "stroke-width": 1 }),
        h("rect", { x: 364, y: cy - 4, width: 21, height: 8, rx: 2.2, fill: INK }),
        h("rect", { x: 388.2, y: cy - 2, width: 1.6, height: 4, rx: 0.8, fill: INK, "fill-opacity": 0.4 }),
      )),
    // The time is Satori text (paths), so it needs no font in resvg.
    abs({ left: 40 * k, top: (cy - 11) * k, width: 80 * k, height: 22 * k, justifyContent: "center", alignItems: "center", fontSize: 17 * k, fontWeight: 700, color: INK, letterSpacing: "-0.01em" }, "9:41"),
  ];
}

// Side buttons of an iPhone 6.9", in points along a 440 x 956 pt screen: [side, top, length].
// Left: action button, volume up, volume down. Right: side button, camera control.
const BUTTONS = [["left", 120, 34], ["left", 190, 62], ["left", 268, 62], ["right", 215, 100], ["right", 520, 60]];
const RIM = ["#8E8E93", "#F2F2F7", "#C7C7CC", "#F2F2F7", "#8E8E93"];

/**
 * The phone as [shadow, body], upright: a thin light metallic rim, a thin black bezel and the
 * screen, all continuous-corner paths (squircle.mjs) around the screen radius of the capture device
 * (bipe-ios/appstore/devices.mjs, `screenRadius`), and the side buttons. The capture sits inset in
 * the bezel, clipped with the screen path (Satori writes CSS clip-path as an SVG clipPath; an <image>
 * inside an inline SVG does not render).
 */
function phone({ capture, left, top, screenW, bezel, rim, s, island }) {
  const screenH = screenW * (capture.height / capture.width);
  const radius = capture.radius * (screenW / capture.width);
  const edge = bezel + rim;
  const w = screenW + 2 * edge;
  const hh = screenH + 2 * edge;
  const outer = squirclePath(w, hh, radius + edge);
  const inner = squirclePath(w - 2 * rim, hh - 2 * rim, radius + bezel, 0.6, rim, rim);
  const pad = 200 * s;
  const shadow = abs({ left: left - pad, top: top - pad, width: w + 2 * pad, height: hh + 2 * pad },
    h("svg", { width: w + 2 * pad, height: hh + 2 * pad, viewBox: `0 0 ${w + 2 * pad} ${hh + 2 * pad}` },
      h("defs", {}, h("filter", { id: "phone-shadow", x: "-50%", y: "-50%", width: "200%", height: "200%" }, h("feGaussianBlur", { stdDeviation: 40 * s }))),
      h("path", { d: outer, transform: `translate(${pad} ${pad + 40 * s})`, fill: "rgba(0,0,0,0.35)", filter: "url(#phone-shadow)" }),
    ));
  // The buttons stand out of the rim, so the frame SVG is wider than the phone by `out` per side.
  const k = screenW / 440;
  const out = 5 * s;
  const metal = (id, x1, x2) => h("linearGradient", { id, x1, y1: "0", x2, y2: "0" },
    ...RIM.map((c, i) => h("stop", { offset: [0, 0.06, 0.5, 0.94, 1][i], "stop-color": c })));
  const buttons = BUTTONS.map(([side, y, len]) =>
    h("rect", { x: side === "left" ? 0 : out + w - 2 * s, y: edge + y * k, width: out + 2 * s, height: len * k, rx: 2 * s, fill: "url(#rim)" }));
  const body = abs({ left: left - out, top, width: w + 2 * out, height: hh },
    h("svg", { width: w + 2 * out, height: hh, viewBox: `0 0 ${w + 2 * out} ${hh}`, style: { position: "absolute", left: 0, top: 0 } },
      h("defs", {}, metal("rim", "0", "1")),
      ...buttons,
      h("g", { transform: `translate(${out} 0)` }, h("path", { d: outer, fill: "url(#rim)" }), h("path", { d: inner, fill: BEZEL })),
    ),
    h("img", { src: capture.dataUrl, width: screenW, height: screenH, style: { position: "absolute", left: out + edge, top: edge, clipPath: `path("${squirclePath(screenW, screenH, radius)}")` } }),
    abs({ left: out + edge, top: edge, width: screenW, height: screenH }, ...statusBar(screenW, island)),
  );
  return [shadow, body];
}

/**
 * Where the capture sits on a panel of `dev`, in panel pixels: { left, top, width, height }. The
 * callouts (lib/callouts.mjs) map a point of the capture to the panel with it.
 */
export function screenBox(dev, capture) {
  const s = dev.width / 1320;
  const L = LAYOUT[dev.kind];
  const edge = (L.bezel + L.rim) * s;
  const width = L.frame * s - 2 * edge;
  return { left: (dev.width - L.frame * s) / 2 + edge, top: L.frameTop * s + edge, width, height: width * (capture.height / capture.width) };
}

function capturePanel({ panel, width, height, kind, captures, tone: t }) {
  const s = width / 1320;
  const L = LAYOUT[kind];
  const capture = captures.get(shotOf(panel));
  const bezel = L.bezel * s;
  const rim = L.rim * s;
  const frameW = L.frame * s;
  const screenW = frameW - 2 * (bezel + rim);
  return h("div", { style: { width, height, display: "flex", position: "relative", overflow: "hidden", color: t.ink, fontFamily: "Nunito" } },
    ...phone({ capture, left: (width - frameW) / 2, top: L.frameTop * s, screenW, bezel, rim, s, island: L.island }),
    abs({ left: (width - L.copy * s) / 2, top: L.top * s, width: L.copy * s, justifyContent: "center" }, copyBlock({ panel, L, s, t })),
  );
}

/**
 * A panel with no capture (feature `-`): the title and the sub at the same place as on the other
 * panels. The Brazil network fills the space under them; store-images.mjs draws it as the backdrop
 * of this panel, in the box that illustrationBox() gives.
 */
function textPanel({ panel, width, height, kind, tone: t }) {
  const s = width / 1320;
  const L = LAYOUT[kind];
  return h("div", { style: { width, height, display: "flex", position: "relative", overflow: "hidden", color: t.ink, fontFamily: "Nunito" } },
    abs({ left: (width - L.copy * s) / 2, top: L.top * s, width: L.copy * s, justifyContent: "center" }, copyBlock({ panel, L, s, t })),
  );
}

/** Where the illustration of a panel with no capture goes: under the copy, from the phone top line down. */
export function illustrationBox(dev) {
  const L = LAYOUT[dev.kind];
  const s = dev.width / 1320;
  const top = L.frameTop * s;
  return { x: dev.width * 0.05, y: top, w: dev.width * 0.9, h: dev.height - top - dev.height * 0.03 };
}

/** Play feature graphic: mark and wordmark with the store subtitle, and one region of panel 1. */
function featureGraphic({ panel, subtitle, width, height, captures, tone: t, markPath }) {
  const capture = captures.get(shotOf(panel));
  const region = FEATURE_REGION[shotOf(panel)];
  const cardW = 440;
  let card = null;
  if (capture && region) {
    const [rx, ry, rw, rh] = region;
    const imgW = cardW / rw;
    const imgH = imgW * (capture.height / capture.width);
    const cardH = rh * imgH;
    card = abs({ left: width - cardW - 56, top: (height - cardH) / 2, width: cardW, height: cardH, overflow: "hidden", borderRadius: 16, border: `3px solid ${WHITE}`, boxShadow: "0 15px 35px rgba(0,0,0,0.4)", backgroundColor: WHITE },
      h("img", { src: capture.dataUrl, width: imgW, height: imgH, style: { position: "absolute", left: -rx * imgW, top: -ry * imgH } }));
  }
  return h("div", { style: { width, height, display: "flex", position: "relative", overflow: "hidden", color: t.ink, fontFamily: "Nunito" } },
    abs({ left: 64, top: 0, width: 470, height, flexDirection: "column", justifyContent: "center", gap: 28 },
      brandRow(markPath, 96),
      h("div", { style: { display: "block", fontSize: 46, fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1.12 } }, subtitle),
    ),
    card,
  );
}

/** The Satori node for one panel. `captures` maps slug to { dataUrl, width, height, radius }. */
export function panelNode({ panel, dev, captures, tone: t, markPath, subtitle }) {
  const { width, height } = dev;
  if (!LAYOUT[dev.kind] && dev.kind !== "feature") throw new Error(`panels: no layout for ${dev.key} (${dev.kind}); the store set is iPhone and Play only (bipe#419)`);
  if (dev.kind === "feature") return featureGraphic({ panel, subtitle, width, height, captures, tone: t, markPath });
  if (panel.feature === "-") return textPanel({ panel, width, height, kind: dev.kind, tone: t });
  return capturePanel({ panel, width, height, kind: dev.kind, captures, tone: t });
}
