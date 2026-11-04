// The parts of a store panel (bipe-chat/bipe#463), as Satori nodes for scripts/store-images.mjs.
// The text comes from the `## Screenshots` table in bipe-shared/product/appstore.md (`title`, `sub`).
//
// A panel, after Telegram and Signal: a short centred title, one subtitle sentence under it, and one
// large upright phone, centred, its top under the subtitle. On the store sets the whole phone shows,
// bottom bezel included, with a margin under it (MZ, 1 November 2026, after Telegram); the Instagram
// sets keep the phone cut by the panel edge. The phone is at the same place on every panel. The phone is an iPhone: a thin
// metallic rim and a thin black bezel with continuous corners, side buttons and the status bar (9:41, signal, Wi-Fi,
// battery), drawn here because the captures have none. No Dynamic Island (MZ, 1 November 2026: it says nothing
// about the app, and Apple's 2027 design drops it). The backdrop is scripts/lib/backdrop.mjs.
//
// The Instagram sets are posts, not store panels (MZ, 2 November 2026: "not very post-like"). They
// follow social/guide.md: left-aligned type, the Bipe mark and bipe.chat in a footer, and one of the
// layouts in POST_LAYOUTS, picked per row with the `layout` column.
import { SUB_FONT, h } from "../og.mjs";
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

/**
 * The Instagram layouts (social/guide.md). `phone`: headline, then a capture in a phone offset to the
 * right. `map`: headline and the Brazil network (lib/callouts.mjs draws it in postArtBox). `type`: large
 * type only. `bubble`: one chat bubble (the `bubble` column, `from` over it) and the headline under it.
 */
export const POST_LAYOUTS = ["phone", "map", "type", "bubble"];

/** The layout of a panel: the `layout` column, else `map` for a panel with no feature and `phone` for the others. */
export function layoutOf(panel) {
  const layout = panel.layout || (panel.feature === "-" ? "map" : "phone");
  if (!POST_LAYOUTS.includes(layout)) throw new Error(`panels: ${panel.slug} has layout ${layout}; use one of ${POST_LAYOUTS.join(", ")}`);
  if (layout === "bubble" && !panel.bubble) throw new Error(`panels: ${panel.slug} has layout bubble and no bubble text`);
  return layout;
}

/**
 * Captures a panel needs, by slug. A panel with no feature (`-`) has none: store-images.mjs puts the
 * Brazil network on its screen. A post with a layout other than `phone` has none either.
 */
export const captureSlugs = (panel) => (panel.feature === "-" || (panel.layout && panel.layout !== "phone") ? [] : [shotOf(panel)]);

// Layout per device kind, in units of a canvas 1320 wide; `s` scales them to the real width, so the
// type has the same proportion on every device. `frameTop` is the same on every panel and leaves
// room for a 1-line title and a 2-line sub. `frame` is the phone width with its bezel.
const LAYOUT = {
  // The sub is 60% of the title (MZ: the subtitle read like a caption). The store sizes went up about
  // 10% on 1 November 2026 (MZ: "a touch larger"); the copy is wider so the subs keep two lines. `bottom` is the margin under
  // the whole phone: the frame width is the largest that leaves it (at most `frame`), so the bottom
  // bezel and corners show. Without `bottom` the phone is `frame` wide and runs off the edge.
  phone: { top: 150, copy: 1200, title: 114, sub: 70, gap: 24, frameTop: 560, frame: 1180, bottom: 170, bezel: 16, rim: 8 },
  // Play: no device frame (Google advises against device imagery, and it counts for promotion
  // eligibility), so the screen alone, as wide as the iPhone screen, running off the bottom edge.
  play: { top: 120, copy: 1200, title: 106, sub: 64, gap: 22, frameTop: 520, frame: 950, bezel: 0, rim: 0, buttons: "none", bar: "android" },
};

// Instagram (bipe-chat/bipe#465), all 1080 wide, in the same units. `pad` is the side margin, `foot`
// the margin under the footer. `title` is the headline size in the phone, map and bubble layouts,
// `type` the size in the type layout. `frameTop` leaves room for a 3-line headline and a 2-line sub.
// The phone is `frame` wide, `right` from the right edge, and runs off the bottom. The story keeps
// text out of the bands the IG bars cover: the top 250 px and the bottom 340 px (306 and 416 units).
const POST = {
  post: { pad: 100, top: 120, foot: 100, title: 120, type: 168, sub: 54, gap: 28, frameTop: 740, frame: 720, right: 90, mark: 76, bezel: 12, rim: 5 },
  square: { pad: 90, top: 100, foot: 90, title: 104, type: 148, sub: 48, gap: 24, frameTop: 610, frame: 600, right: 90, mark: 68, bezel: 11, rim: 5 },
  story: { pad: 100, top: 330, foot: 470, title: 136, type: 176, sub: 58, gap: 30, frameTop: 990, frame: 800, right: 90, mark: 72, bezel: 12, rim: 5 },
};
// There is no iPad layout: the store set is iPhone and Play only (MZ, 20 October 2026; bipe#419).

/** The phone width with its bezel, in panel pixels: `frame`, or less when `bottom` must stay free under it. */
function frameWidth(L, s, capture, height) {
  const edge = (L.bezel + L.rim) * s;
  if (L.bottom === undefined) return L.frame * s;
  const screenH = height - (L.frameTop + L.bottom) * s - 2 * edge;
  return Math.min(L.frame * s, screenH * (capture.width / capture.height) + 2 * edge);
}

const abs = (style, ...children) => h("div", { style: { position: "absolute", display: "flex", ...style } }, ...children);

function brandRow(markPath, size, color = WHITE) {
  return h("div", { style: { display: "flex", alignItems: "center", gap: size * 0.3 } },
    h("svg", { width: size, height: size, viewBox: "0 0 64 64" }, h("path", { d: markPath, fill: color })),
    h("div", { style: { display: "flex", fontSize: size * 0.95, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1 } }, "bipe"),
  );
}

function copyBlock({ panel, L, s, t }) {
  return h("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: L.gap * s, textAlign: "center" } },
    h("div", { style: { display: "block", fontSize: L.title * s, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.06 } }, panel.title),
    panel.sub ? h("div", { style: { display: "block", ...SUB_FONT, fontSize: L.sub * s, lineHeight: 1.25, color: t.sub } }, panel.sub) : null,
  );
}

/**
 * The status bar in `ink`, in points of a 440 pt wide screen (iPhone 6.9"), scaled to the screen width `w`.
 * The time and the icons sit on the line where the Dynamic Island's centre would be, as on the device.
 */
function statusBar(w, ink) {
  const k = w / 440;
  const cy = 29.5;
  const bars = [4, 6.2, 8.5, 11].map((bh, i) => h("rect", { x: 318 + i * 4.6, y: cy + 5.5 - bh, width: 3.2, height: bh, rx: 1, fill: ink }));
  // iOS 27: two Wi-Fi arcs over a small wedge, and a solid full battery with no outline.
  const wifi = "M340 27.7A10.6 10.6 0 0 1 355 27.7M342.9 30.6A6.5 6.5 0 0 1 352.1 30.6";
  const wedge = "M347.5 35.2L345.24 32.94A3.2 3.2 0 0 1 349.76 32.94Z";
  return [
    abs({ left: 0, top: 0, width: w, height: 62 * k },
      h("svg", { width: w, height: 62 * k, viewBox: "0 0 440 62" },
        ...bars,
        h("path", { d: wifi, fill: "none", stroke: ink, "stroke-width": 2.5, "stroke-linecap": "round" }),
        h("path", { d: wedge, fill: ink, stroke: ink, "stroke-width": 1.1, "stroke-linejoin": "round" }),
        h("rect", { x: 362, y: cy - 6, width: 25, height: 12, rx: 4, fill: ink }),
        h("rect", { x: 388.4, y: cy - 2.2, width: 1.9, height: 4.4, rx: 0.95, fill: ink }),
      )),
    // The time is Satori text (paths), so it needs no font in resvg.
    abs({ left: 40 * k, top: (cy - 11) * k, width: 80 * k, height: 22 * k, justifyContent: "center", alignItems: "center", fontSize: 17 * k, fontWeight: 700, color: ink, letterSpacing: "-0.01em" }, "9:41"),
  ];
}

// The Android status bar (Material 3 / Pixel layout): the time at the left, signal, Wi-Fi and battery at
// the right, 24 dp of a 360 dp screen, drawn in the top band the captures leave free. Both ends sit
// 34 dp in and 4 dp lower than a flat screen would put them, clear of the rounded corners (MZ, 2 November 2026).
function androidStatusBar(w, ink) {
  const k = w / 360;
  return [
    abs({ left: 0, top: 8 * k, width: w, height: 24 * k },
      h("svg", { width: w, height: 24 * k, viewBox: "0 0 360 24" }, h("g", { transform: "translate(-18 4)" },
        h("path", { d: "M300 17h10V7Z", fill: ink }),
        h("path", { d: "M314 9.5a9 9 0 0 1 12 0L320 17Z", fill: ink }),
        h("rect", { x: 331, y: 7, width: 7, height: 11, rx: 1.4, fill: ink }),
        h("rect", { x: 333, y: 5.6, width: 3, height: 1.6, rx: 0.5, fill: ink }),
      ))),
    abs({ left: 34 * k, top: 16 * k, height: 16 * k, alignItems: "center", fontSize: 13 * k, fontWeight: 600, color: ink }, "9:41"),
  ];
}

// Side buttons, in points along a 440 x 956 pt screen: [side, top, length]. iPhone 6.9":
// Left: action button, volume up, volume down. Right: side button, camera control.
// Android: power and the volume rocker, both on the right. `none`: a bare screen (the Play panels).
const BUTTONS = {
  iphone: [["left", 120, 34], ["left", 190, 62], ["left", 268, 62], ["right", 215, 100], ["right", 520, 60]],
  android: [["right", 190, 56], ["right", 280, 120]],
  none: [],
};
const RIM = ["#8E8E93", "#F2F2F7", "#C7C7CC", "#F2F2F7", "#8E8E93"];

/**
 * The phone as [shadow, body], upright: a thin light metallic rim, a thin black bezel and the
 * screen, all continuous-corner paths (squircle.mjs) around the screen radius of the capture device
 * (appstore/devices.mjs, `screenRadius`), and the side buttons. The capture sits inset in
 * the bezel, clipped with the screen path (Satori writes CSS clip-path as an SVG clipPath; an <image>
 * inside an inline SVG does not render).
 */
function phone({ capture, left, top, screenW, bezel, rim, s, buttons: kind = "iphone", bar = "ios" }) {
  // The captures leave room at the top for the status bar, which is drawn over them: iOS or Android.
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
  const buttons = BUTTONS[kind].map(([side, y, len]) =>
    h("rect", { x: side === "left" ? 0 : out + w - 2 * s, y: edge + y * k, width: out + 2 * s, height: len * k, rx: 2 * s, fill: "url(#rim)" }));
  const body = abs({ left: left - out, top, width: w + 2 * out, height: hh },
    h("svg", { width: w + 2 * out, height: hh, viewBox: `0 0 ${w + 2 * out} ${hh}`, style: { position: "absolute", left: 0, top: 0 } },
      h("defs", {}, metal("rim", "0", "1")),
      ...buttons,
      // A bare screen (no rim, no bezel) draws no frame paths, so no grey shows at its corners.
      edge ? h("g", { transform: `translate(${out} 0)` }, h("path", { d: outer, fill: "url(#rim)" }), h("path", { d: inner, fill: BEZEL })) : null,
    ),
    h("img", { src: capture.dataUrl, width: screenW, height: screenH, style: { position: "absolute", left: out + edge, top: edge, clipPath: `path("${squirclePath(screenW, screenH, radius)}")` } }),
    abs({ left: out + edge, top: edge, width: screenW, height: screenH }, ...(bar === "android" ? androidStatusBar(screenW, capture.barInk ?? INK) : statusBar(screenW, capture.barInk ?? INK))),
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
  const frameW = frameWidth(L, s, capture, dev.height);
  const width = frameW - 2 * edge;
  return { left: (dev.width - frameW) / 2 + edge, top: L.frameTop * s + edge, width, height: width * (capture.height / capture.width) };
}

function capturePanel({ panel, width, height, kind, captures, tone: t }) {
  const s = width / 1320;
  const L = LAYOUT[kind];
  const capture = captures.get(shotOf(panel));
  const bezel = L.bezel * s;
  const rim = L.rim * s;
  const frameW = frameWidth(L, s, capture, height);
  const screenW = frameW - 2 * (bezel + rim);
  return h("div", { style: { width, height, display: "flex", position: "relative", overflow: "hidden", color: t.ink, fontFamily: "Nunito" } },
    ...phone({ capture, left: (width - frameW) / 2, top: L.frameTop * s, screenW, bezel, rim, s, buttons: L.buttons, bar: L.bar }),
    abs({ left: (width - L.copy * s) / 2, top: L.top * s, width: L.copy * s, justifyContent: "center" }, copyBlock({ panel, L, s, t })),
  );
}

// --- Instagram posts (social/guide.md) ---------------------------------------------------------------

/** The headline and the sub, left-aligned. `size` is the headline size in units. */
function postCopy({ panel, P, s, t, size }) {
  return h("div", { style: { display: "flex", flexDirection: "column", gap: P.gap * s } },
    h("div", { style: { display: "block", fontSize: size * s, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.02 } }, panel.title),
    panel.sub ? h("div", { style: { display: "block", ...SUB_FONT, fontSize: P.sub * s, lineHeight: 1.28, color: t.sub, maxWidth: 1000 * s } }, panel.sub) : null,
  );
}

/** The footer: the mark and the wordmark, bipe.chat under them, at the bottom left. */
function postFooter({ P, s, t, markPath, height }) {
  return abs({ left: P.pad * s, top: height - (P.foot + P.mark * 1.9) * s, flexDirection: "column", gap: 14 * s },
    brandRow(markPath, P.mark * s, t.ink),
    h("div", { style: { display: "flex", fontSize: P.mark * 0.5 * s, fontWeight: 700, color: t.sub } }, "bipe.chat"),
  );
}

/** Where the art of a map post goes, in panel pixels: right of the footer, from under the copy to the bottom edge. */
export function postArtBox(dev) {
  const P = POST[dev.kind];
  const s = dev.width / 1320;
  const top = P.frameTop * s;
  const w = dev.width * 0.82;
  return { x: dev.width - w + dev.width * 0.04, y: top, w, h: Math.min(w, dev.height - top - 20 * s) };
}

/** One incoming chat bubble, as the app draws it: white, the corner at the sender flat, the time at the end. */
function bubble({ panel, P, s }) {
  const size = P.sub * 1.12;
  return h("div", { style: { display: "flex", flexDirection: "column", gap: 10 * s, alignSelf: "flex-start", maxWidth: 1020 * s, padding: `${34 * s}px ${44 * s}px ${26 * s}px`, backgroundColor: WHITE, color: INK, borderRadius: `${54 * s}px ${54 * s}px ${54 * s}px ${12 * s}px`, boxShadow: `0 ${24 * s}px ${60 * s}px rgba(0,0,0,0.22)`, transform: "rotate(-2deg)" } },
    panel.from ? h("div", { style: { display: "flex", fontSize: size * 0.62 * s, fontWeight: 800, color: "#6E6E78" } }, panel.from) : null,
    h("div", { style: { display: "block", fontSize: size * s, fontWeight: 700, lineHeight: 1.25 } }, panel.bubble),
    h("div", { style: { display: "flex", justifyContent: "flex-end", fontSize: size * 0.5 * s, fontWeight: 600, color: "#8E8E96" } }, "21:58"),
  );
}

function postPanel({ panel, dev, captures, tone: t, markPath }) {
  const { width, height } = dev;
  const P = POST[dev.kind];
  const s = width / 1320;
  const layout = layoutOf(panel);
  const root = (...children) => h("div", { style: { width, height, display: "flex", position: "relative", overflow: "hidden", color: t.ink, fontFamily: "Nunito" } }, ...children);
  const copyW = (1320 - 2 * P.pad) * s;
  const footer = postFooter({ P, s, t, markPath, height });
  // The type and bubble layouts centre their block between the top margin and the footer.
  const middle = (...children) => abs({ left: P.pad * s, top: P.top * s, width: copyW, height: height - (P.top + P.foot + P.mark * 2.6) * s, flexDirection: "column", justifyContent: "center", gap: 84 * s }, ...children);
  if (layout === "type") return root(middle(postCopy({ panel, P, s, t, size: P.type })), footer);
  if (layout === "bubble") return root(middle(bubble({ panel, P, s }), postCopy({ panel, P, s, t, size: P.title })), footer);
  const copy = abs({ left: P.pad * s, top: P.top * s, width: copyW }, postCopy({ panel, P, s, t, size: P.title }));
  if (layout === "map") return root(copy, footer);
  const capture = captures.get(shotOf(panel));
  const bezel = P.bezel * s;
  const rim = P.rim * s;
  const frameW = P.frame * s;
  return root(
    ...phone({ capture, left: width - (P.right + P.frame) * s, top: P.frameTop * s, screenW: frameW - 2 * (bezel + rim), bezel, rim, s }),
    copy,
    footer,
  );
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

/**
 * App Store product page header and search results art (iOS 27 creative assets): one universal 16:9
 * image at 5244x2950 that App Store Connect crops to 21:9 (header) and 3:2 (search). Three phones of
 * the first panels with captures, the middle one in front, no text (the product page sets the name).
 * Everything stays inside the area both crops keep: the middle 4425x2247.
 */
export const HEADER = { phones: 3, screenH: 2050, sideScale: 0.86, sideOffset: 1150, sideDrop: 150 };

/** The capture slugs the header shows, in order: middle, left, right. */
export const headerSlugs = (panels) => panels.filter((p) => p.feature !== "-").slice(0, HEADER.phones).map(shotOf);

function headerArt({ panels, width, height, captures, tone: t }) {
  const [mid, left, right] = headerSlugs(panels).map((slug) => captures.get(slug));
  const at = (capture, scale, dx, dy) => {
    const screenW = (HEADER.screenH * scale) / (capture.height / capture.width);
    const s = screenW / 950;
    return phone({ capture, left: width / 2 + dx - screenW / 2 - 24 * s, top: (height - HEADER.screenH) / 2 + dy, screenW, bezel: 16 * s, rim: 8 * s, s });
  };
  return h("div", { style: { width, height, display: "flex", position: "relative", overflow: "hidden", color: t.ink, fontFamily: "Nunito" } },
    ...at(left, HEADER.sideScale, -HEADER.sideOffset, HEADER.sideDrop),
    ...at(right, HEADER.sideScale, HEADER.sideOffset, HEADER.sideDrop),
    ...at(mid, 1, 0, 0),
  );
}

/** The Satori node for one panel. `captures` maps slug to { dataUrl, width, height, radius }. */
export function panelNode({ panel, panels, dev, captures, tone: t, markPath, subtitle }) {
  const { width, height } = dev;
  if (dev.kind === "header") return headerArt({ panels, width, height, captures, tone: t });
  if (POST[dev.kind]) return postPanel({ panel, dev, captures, tone: t, markPath });
  if (!LAYOUT[dev.kind] && dev.kind !== "feature") throw new Error(`panels: no layout for ${dev.key} (${dev.kind}); the store set is iPhone and Play only (bipe#419)`);
  if (dev.kind === "feature") return featureGraphic({ panel, subtitle, width, height, captures, tone: t, markPath });
  return capturePanel({ panel, width, height, kind: dev.kind, captures, tone: t });
}
