// The callout layer of the store panels (bipe-chat/bipe#463): one or two elements of the screen, set
// again larger on tilted cards over the phone, each with a connector to the element in the phone.
//
// Where: scripts/scene-captures.mjs listed every element on the scene's screen with its frame
// (`<slug>.elements.json` next to the capture). An anchor names an element by its text, so a changed
// screen moves the connector with it, and a missing element stops the build.
// What: the card text comes from bipe-shared strings, the cast, or the label of an element on the
// screen. Nothing on a card is written here except the scam warning's short line (`line`).
//
// The cards are vector, not crops of the capture: a crop enlarged about 2x is soft. The sticker is the
// exception, because it is a photo: its crop is cut out of the chat background and gets a white edge.
// Satori sets each card flat; the card, its shadow and the connector are plain SVG in a rotated group.
// resvg 2.6 panics on a Satori box shadow inside a rotated element, so no Satori shadow is used here.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import { fonts, h } from "../og.mjs";
import { RAMPS, UI } from "./backdrop.mjs";
import { screenBox, shotOf } from "./panels.mjs";
import { encodeRgbaPng } from "./raster.mjs";

// The panel SPECS positions are set on: the iPhone 6.9" store panel and its capture size.
const REF_PANEL = { kind: "phone", width: 1320, height: 2868 };

const photos = join(dirname(fileURLToPath(import.meta.url)), "../../src/cast/photos");
const stickers = join(dirname(fileURLToPath(import.meta.url)), "../../src/cast/stickers");

/**
 * The callouts of each panel slug. Card positions are in units of a canvas 1320 wide.
 *   kind     alert | person | field | handle | seal | row | sticker (the card layouts below)
 *   anchor   the element the connector ends on: { text, type, nth, at, pick }. `text` is part of its label
 *            (pt-BR, the only captured locale), `type` an XCUIElement.ElementType raw value (48 static
 *            text, 9 button, 1 other), `nth` counts the matches from the top of the screen (-1 is the last),
 *            `at` is the point of its frame (x, y as fractions), `pick` is inner (default: the smallest
 *            match, a text) or outer (the largest, a row or a cell).
 *   card     { top, x (centre offset), width, height, tilt (degrees) }, in pixels of the iPhone 6.9" panel
 *            (1320 wide). place() moves and scales them with the phone screen, so other layouts (Play)
 *            put each card at the same place on the screen.
 *   from     the point of the card the connector leaves from, as fractions of the card
 *   buttons  (person) the button labels to show, found on the screen; default: the buttons under the
 *            anchor, or none when the screen has none there.
 *   image    (sticker) a file in src/cast/stickers/ (made with Codex image_gen, white die-cut edge
 *            included) in place of a cut-out of the capture; it needs no anchor.
 *   Text     { key } a bipe-shared string, { screen } the label of the element whose label contains it,
 *            or a value per locale. `cast` names a cast entry: its name, handle and photo.
 */
export const SPECS = {
  "aviso-golpe": [{
    kind: "alert",
    title: { key: "bipe_scam_warning_title" },
    line: { "pt-BR": "Confirme com a pessoa por outro meio.", "en-US": "Check with the person another way." },
    anchor: { text: "Pode ser um golpe", type: 48, at: [1, 0.5] },
    card: { top: 1700, width: 1250, height: 340, tilt: -3 },
    from: [0.86, 0],
  }],
  pedidos: [{
    kind: "person",
    cast: "golpista",
    anchor: { text: "Joana Lima", type: 48, at: [1, 0.5] },
    buttons: ["Ignorar", "Aceitar"],
    card: { top: 2020, width: 1150, height: 470, tilt: -3 },
    from: [0.92, 0],
  }],
  "conferir-pix": [{
    kind: "field",
    label: { key: "bipe_pix_check_field_name" },
    value: { screen: "RAFAEL OLIVEIRA" },
    anchor: { text: "RAFAEL OLIVEIRA", at: [1, 0.5] },
    card: { top: 1990, x: -60, width: 1100, height: 300, tilt: -3 },
    from: [0.12, 0],
  }, {
    kind: "field",
    label: { key: "bipe_pix_check_field_amount" },
    value: { screen: "R$" },
    anchor: { text: "R$", at: [1, 0.5] },
    card: { top: 1560, x: 240, width: 760, height: 300, tilt: 3 },
    from: [0.15, 0],
  }],
  "seu-arroba": [{
    kind: "handle",
    cast: "rafa",
    anchor: { text: "Rafa", type: 48, at: [0.5, 1] },
    card: { top: 1400, width: 1040, height: 220, tilt: -3 },
    from: [0.5, 0],
  }],
  "selo-cnpj": [{
    kind: "seal",
    cast: "clinica",
    pill: { key: "bipe_badge_company_cnpj" },
    anchor: { text: "Clínica Vida", type: 48, at: [0.5, 1] },
    card: { top: 1150, width: 1150, height: 320, tilt: -3 },
    from: [0.3, 0],
  }],
  grupos: [{
    kind: "row",
    cast: "familia",
    sub: { screen: "Bom dia, família!" },
    anchor: { text: "Família Lima", type: 48, at: [1, 0.5] },
    card: { top: 1450, width: 1110, height: 300, tilt: -3 },
    from: [0.9, 0],
  }],
  // A sticker with an `image` is placed by `card` alone, so it needs no anchor on the screen.
  stickers: [{
    kind: "sticker",
    image: "caio-bora",
    card: { top: 1000, x: -230, width: 780, tilt: -6 },
  }, {
    kind: "sticker",
    image: "vira-lata",
    card: { top: 1800, x: 200, width: 640, tilt: 6 },
  }],
};

const WARNING = "M12 3 2 21h20L12 3Zm0 6v5m0 3v.5";
const LINK = "M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7";
const INK = UI.gray[1400];
const WHITE = "#FFFFFF";
// The neutral card: the cream steps of caju (expressive, so fill only), as in the reference panels.
const CARD = { fill: RAMPS.caju[200], line: UI.gray[400], ink: INK };
// The app's açaí elements (the handle card, the pill, the primary button) take the panel's palette at
// the same step, as the app theme does (appThemes, bipe-chat/bipe#811; MZ, 1 November 2026). `accent`
// is that ramp. The scam warning stays amber: trust and caution colours are never themed.
// The rim (the outline of the card) is the panel's palette on every card (MZ, 1 November 2026: not white).
const cardStyle = (kind, accent) => ({
  rim: accent[300],
  ...({
    alert: { fill: UI.amber[200], line: UI.amber[500], ink: UI.amber[1200] },
    handle: { fill: accent[1100], line: accent[900], ink: WHITE },
  }[kind] ?? CARD),
});

// --- Elements ------------------------------------------------------------------------------------

const inside = (a, b) => a[0] >= b[0] - 0.5 && a[1] >= b[1] - 0.5 && a[0] + a[2] <= b[0] + b[2] + 0.5 && a[1] + a[3] <= b[1] + b[3] + 0.5;

/** The element an anchor or a { screen } text names, or an Error that says what is missing. */
export function findElement(list, { text, type, nth = 0, pick = "inner" }) {
  const seen = new Set();
  const matches = list.elements
    .filter((e) => e.label.includes(text) && (type === undefined || e.type === type) && !seen.has(e.frame.join()) && seen.add(e.frame.join()))
    .sort((a, b) => a.frame[1] - b.frame[1] || a.frame[0] - b.frame[0]);
  // inner: a match with no other match inside it; outer: a match inside no other match.
  const kept = matches.filter((e) => !matches.some((o) => o !== e && (pick === "outer" ? inside(e.frame, o.frame) : inside(o.frame, e.frame))));
  const found = kept.at(nth);
  if (!found) throw new Error(`no element with "${text}" (${pick}, type ${type ?? "any"}, nth ${nth}); ${matches.length} match(es)`);
  return found;
}

function textOf(source, { locale, strings, elements }) {
  if (source.key) return strings[source.key] ?? fail(`no string ${source.key}`);
  if (source.screen) return findElement(elements, { text: source.screen }).label;
  return source[locale] ?? fail(`no text for ${locale}`);
}

function fail(message) {
  throw new Error(message);
}

const photoUrl = (entry) => `data:image/jpeg;base64,${readFileSync(join(photos, `${entry.photo?.copyOf ?? entry.id}.jpg`)).toString("base64")}`;

// --- Cards ---------------------------------------------------------------------------------------

const col = (style, ...children) => h("div", { style: { display: "flex", flexDirection: "column", ...style } }, ...children);
const row = (style, ...children) => h("div", { style: { display: "flex", alignItems: "center", ...style } }, ...children);
const text = (style, value) => h("div", { style: { display: "block", lineHeight: 1.1, ...style } }, value);
const avatar = (src, size, radius = size / 2) => h("img", { src, width: size, height: size, style: { width: size, height: size, borderRadius: radius, objectFit: "cover", flexShrink: 0 } });
const pill = (value, s, accent, style = {}) => row({ padding: `${12 * s}px ${30 * s}px`, borderRadius: 999, backgroundColor: accent[1100], color: WHITE, fontSize: 50 * s, fontWeight: 900, flexShrink: 0, ...style }, value);

/** The content of each card kind, as a Satori node of the card size. */
const CONTENT = {
  alert: ({ spec, ctx, s }) => row({ gap: 44 * s },
    h("svg", { width: 150 * s, height: 150 * s, viewBox: "0 0 24 24", style: { flexShrink: 0 } },
      h("path", { d: WARNING, fill: "none", stroke: UI.amber[1100], "stroke-width": 2.2, "stroke-linejoin": "round", "stroke-linecap": "round" })),
    col({ gap: 10 * s },
      text({ fontSize: 98 * s, fontWeight: 900, letterSpacing: "-0.02em" }, textOf(spec.title, ctx)),
      text({ fontSize: 50 * s, fontWeight: 600, color: UI.amber[1100] }, textOf(spec.line, ctx)))),
  // A message request: photo, name and @, and the request's buttons as the screen labels them: the buttons
  // under the name, within 60 points (the last one is the primary action).
  person: ({ spec, entry, ctx, s, anchor }) => {
    const [, top, , height] = anchor.frame;
    const buttons = spec.buttons
      ? spec.buttons.map((text) => findElement(ctx.elements, { text, type: BUTTON }))
      : ctx.elements.elements.filter((e) => e.type === BUTTON && e.label && e.frame[1] >= top + height && e.frame[1] <= top + height + 60).sort((a, b) => a.frame[0] - b.frame[0]);
    if (buttons.length === 1) fail(`the ${entry.id} row has 1 button`);
    return col({ gap: 40 * s, flex: 1 },
      row({ gap: 40 * s },
        avatar(photoUrl(entry), 170 * s),
        col({ gap: 8 * s }, text({ fontSize: 88 * s, fontWeight: 900, letterSpacing: "-0.02em" }, entry.name), text({ fontSize: 52 * s, fontWeight: 600, color: UI.gray[1000] }, `@${entry.handle}`))),
      buttons.length === 0 ? null : row({ gap: 30 * s }, ...buttons.map((b, i) => {
        const primary = i === buttons.length - 1;
        return row({ flex: 1, height: 120 * s, justifyContent: "center", borderRadius: 999, fontSize: 56 * s, fontWeight: 800, backgroundColor: primary ? ctx.accent[1200] : WHITE, color: primary ? WHITE : INK, border: primary ? "none" : `${4 * s}px solid ${UI.gray[500]}` }, b.label);
      })));
  },
  field: ({ spec, ctx, s }) => col({ gap: 6 * s },
    text({ fontSize: 54 * s, fontWeight: 600, color: UI.gray[1000] }, textOf(spec.label, ctx)),
    text({ fontSize: 110 * s, fontWeight: 900, letterSpacing: "-0.02em" }, textOf(spec.value, ctx))),
  handle: ({ entry, s }) => row({ gap: 40 * s, flex: 1, justifyContent: "center" },
    h("svg", { width: 110 * s, height: 110 * s, viewBox: "0 0 24 24", style: { flexShrink: 0 } },
      h("path", { d: LINK, fill: "none", stroke: WHITE, "stroke-width": 2.4, "stroke-linejoin": "round", "stroke-linecap": "round" })),
    text({ fontSize: 100 * s, fontWeight: 900, letterSpacing: "-0.02em" }, `@${entry.handle}`)),
  seal: ({ spec, entry, ctx, s }) => row({ gap: 40 * s },
    avatar(photoUrl(entry), 170 * s, 44 * s),
    text({ fontSize: 88 * s, fontWeight: 900, letterSpacing: "-0.02em" }, entry.name),
    pill(textOf(spec.pill, ctx), s, ctx.accent)),
  row: ({ spec, entry, ctx, s }) => row({ gap: 36 * s, flex: 1 },
    avatar(photoUrl(entry), 150 * s),
    col({ gap: 8 * s, flex: 1, minWidth: 0 },
      text({ fontSize: 72 * s, fontWeight: 900, letterSpacing: "-0.02em" }, entry.name),
      text({ fontSize: 46 * s, fontWeight: 600, color: UI.gray[1000], lineHeight: 1.25 }, textOf(spec.sub, ctx))),
    pill("@", s, ctx.accent, { width: 96 * s, height: 96 * s, padding: 0, justifyContent: "center", fontSize: 56 * s })),
};

// XCUIElement.ElementType.button.
const BUTTON = 9;

async function cardText({ spec, ctx, s, box, anchor, entry, index }) {
  const style = cardStyle(spec.kind, ctx.accent);
  // Satori adds padding to a fixed width, so the content gets a fixed inner width instead.
  const node = h("div", { style: { width: box.w, height: box.hh, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Nunito", color: style.ink } },
    h("div", { style: { width: box.w - 128 * s, display: "flex" } }, CONTENT[spec.kind]({ spec, ctx, s, anchor, entry })));
  // Each Satori render numbers its ids from zero; a prefix keeps them apart from the panel's ids.
  return (await satori(node, { width: box.w, height: box.hh, fonts })).replace(/satori_/g, `callout${index}_`);
}

const rounded = (x, y, w, hh, r) => `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + hh - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + hh}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + hh - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;

/** A point of the card after the tilt, in panel pixels. */
function onCard([fx, fy], box, tilt) {
  const a = (tilt * Math.PI) / 180;
  const [cx, cy] = [box.x + box.w / 2, box.y + box.hh / 2];
  const [dx, dy] = [box.x + fx * box.w - cx, box.y + fy * box.hh - cy];
  return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)];
}

/** The connector: it leaves the card straight up or down and comes into the element from the side `at` names. */
function connector(start, end, at, s) {
  const out = at[0] >= 1 ? [1, 0] : at[0] <= 0 ? [-1, 0] : at[1] <= 0 ? [0, -1] : at[1] >= 1 ? [0, 1] : [0, Math.sign(start[1] - end[1])];
  const bend = Math.abs(end[1] - start[1]) * 0.55;
  const c2 = [end[0] + out[0] * 260 * s, end[1] + out[1] * 260 * s];
  return `M${start[0]} ${start[1]}C${start[0]} ${start[1] + Math.sign(end[1] - start[1]) * bend} ${c2[0]} ${c2[1]} ${end[0]} ${end[1]}`;
}

/**
 * The sticker as it is on the screen, cut out of the chat background: a flood fill from the crop's
 * edges clears every pixel within a small distance of the corner colour. Returns a PNG data URL.
 */
function stickerCut(capture, frame) {
  const [x, y, w, hh] = frame.map(Math.round);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${hh}"><image href="${capture.dataUrl}" x="${-x}" y="${-y}" width="${capture.width}" height="${capture.height}"/></svg>`;
  const px = Buffer.from(new Resvg(svg).render().pixels);
  const bg = [px[0], px[1], px[2]];
  const near = (i) => Math.abs(px[i] - bg[0]) + Math.abs(px[i + 1] - bg[1]) + Math.abs(px[i + 2] - bg[2]) <= 18;
  const stack = [];
  for (let i = 0; i < w; i++) stack.push(i, (hh - 1) * w + i);
  for (let j = 0; j < hh; j++) stack.push(j * w, j * w + w - 1);
  while (stack.length) {
    const p = stack.pop();
    if (px[p * 4 + 3] === 0 || !near(p * 4)) continue;
    px[p * 4 + 3] = 0;
    const [cx, cy] = [p % w, Math.floor(p / w)];
    if (cx > 0) stack.push(p - 1);
    if (cx < w - 1) stack.push(p + 1);
    if (cy > 0) stack.push(p - w);
    if (cy < hh - 1) stack.push(p + w);
  }
  return { url: `data:image/png;base64,${encodeRgbaPng(px, w, hh).toString("base64")}`, w, hh };
}

/** A sticker file (src/cast/stickers/<id>.png, RGBA) as { url, w, hh }. */
function stickerFile(id) {
  const buf = readFileSync(join(stickers, `${id}.png`));
  return { url: `data:image/png;base64,${buf.toString("base64")}`, w: buf.readUInt32BE(16), hh: buf.readUInt32BE(20) };
}

/** The sticker callout: the cut-out larger, with a white die-cut edge and a soft shadow (SVG filters). */
function stickerSvg({ spec, capture, el, dev, s, index, place }) {
  const scale = capture.width / dev.screenPoints;
  const cut = spec.image ? stickerFile(spec.image) : stickerCut(capture, el.frame.map((v) => v * scale));
  const w = spec.card.width * s;
  const hh = w * (cut.hh / cut.w);
  const { x, y } = place(spec.card, w);
  const id = `sticker${index}`;
  return [
    `<defs><filter id="${id}" x="-20%" y="-20%" width="140%" height="140%">`,
    // A sticker file has its own white edge; a cut-out of the capture gets one here.
    `<feMorphology in="SourceAlpha" operator="dilate" radius="${(spec.image ? 0 : 18) * s}" result="grow"/>`,
    `<feFlood flood-color="${WHITE}"/><feComposite in2="grow" operator="in" result="edge"/>`,
    `<feGaussianBlur in="grow" stdDeviation="${30 * s}" result="blur"/><feOffset in="blur" dy="${30 * s}" result="drop"/>`,
    `<feFlood flood-color="rgba(40,0,20,0.45)"/><feComposite in2="drop" operator="in" result="shadow"/>`,
    `<feMerge><feMergeNode in="shadow"/><feMergeNode in="edge"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`,
    `<g transform="rotate(${spec.card.tilt} ${x + w / 2} ${y + hh / 2})"><image href="${cut.url}" x="${x}" y="${y}" width="${w}" height="${hh}" filter="url(#${id})"/></g>`,
  ].join("");
}

/**
 * The callouts of a panel as SVG markup in panel pixels, or "" when it has none. `ctx` holds the
 * locale, the `strings` object of bipe-shared/strings/<lang>.json and the cast entries by id. `tone` is
 * the panel's backdrop tone (lib/backdrop.mjs): the connector and its dots take its `connector` colour.
 */
export async function calloutSvg({ panel, dev, captures, ctx, tone }) {
  const specs = SPECS[panel.slug];
  const capture = captures.get(shotOf(panel));
  // The store sets get callouts; the Instagram sets keep the plain panel.
  if (!specs || !capture || !["phone", "play"].includes(dev.kind)) return "";
  if (!capture.elements) throw new Error(`callouts: ${panel.slug} has no elements file`);
  const elements = capture.elements;
  const screen = screenBox(dev, capture);
  const k = screen.width / elements.width;
  const toPanel = (frame, [ax, ay]) => [screen.left + (frame[0] + ax * frame[2]) * k, screen.top + (frame[1] + ay * frame[3]) * k];
  // SPECS positions are pixels of the iPhone panel. `s` scales them by the screen width against the
  // iPhone screen, and place() puts a card at the same place relative to the screen.
  const ref = screenBox(REF_PANEL, REF_PANEL);
  const s = screen.width / ref.width;
  const place = (card, w) => ({ x: screen.left + (screen.width - w) / 2 + (card.x ?? 0) * s, y: screen.top + (card.top - ref.top) * s });
  const out = [];
  for (const [index, spec] of specs.entries()) {
    const at = (e) => `callouts: ${panel.slug} ${spec.kind}: ${e.message}`;
    let anchor;
    if (!(spec.kind === "sticker" && spec.image)) try { anchor = findElement(elements, spec.anchor); } catch (e) { throw new Error(at(e)); }
    if (spec.kind === "sticker") {
      out.push(stickerSvg({ spec, capture, el: anchor, dev: { ...dev, screenPoints: elements.width }, s, index, place }));
      continue;
    }
    const entry = spec.cast ? ctx.cast.get(spec.cast) ?? fail(at({ message: `no cast entry ${spec.cast}` })) : null;
    const { card } = spec;
    const box = { ...place(card, card.width * s), w: card.width * s, hh: card.height * s };
    const style = cardStyle(spec.kind, RAMPS[tone.palette]);
    const r = Math.min(64 * s, box.hh / 2);
    const rim = 12 * s;
    const end = toPanel(anchor.frame, spec.anchor.at);
    const start = onCard(spec.from, box, card.tilt);
    const [cx, cy] = [box.x + box.w / 2, box.y + box.hh / 2];
    let content;
    try { content = await cardText({ spec, ctx: { ...ctx, elements, accent: RAMPS[tone.palette] }, s, box, anchor, entry, index }); } catch (e) { throw new Error(at(e)); }
    const ink = tone.connector;
    const dot = (p) => `<circle cx="${p[0]}" cy="${p[1]}" r="${18 * s}" fill="${ink}" stroke="${WHITE}" stroke-width="${6 * s}"/>`;
    out.push(
      `<defs><filter id="callout-shadow${index}" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="${36 * s}"/></filter></defs>`,
      `<path d="${connector(start, end, spec.anchor.at, s)}" fill="none" stroke="${WHITE}" stroke-width="${15 * s}" stroke-linecap="round"/>`,
      `<path d="${connector(start, end, spec.anchor.at, s)}" fill="none" stroke="${ink}" stroke-width="${8 * s}" stroke-linecap="round"/>`,
      dot(end),
      `<g transform="rotate(${card.tilt} ${cx} ${cy})">`,
      `<path d="${rounded(box.x, box.y + 36 * s, box.w, box.hh, r)}" fill="rgba(40,0,20,0.45)" filter="url(#callout-shadow${index})"/>`,
      `<path d="${rounded(box.x, box.y, box.w, box.hh, r)}" fill="${style.rim}"/>`,
      `<path d="${rounded(box.x + rim, box.y + rim, box.w - 2 * rim, box.hh - 2 * rim, r - rim)}" fill="${style.fill}" stroke="${style.line}" stroke-width="${4 * s}"/>`,
      `<g transform="translate(${box.x} ${box.y})">${content}</g>`,
      `</g>`,
      dot(start),
    );
  }
  return out.join("");
}

/** Puts SVG markup over a Satori SVG, before its closing tag. */
export const overlay = (svg, markup) => (markup ? `${svg.slice(0, svg.lastIndexOf("</svg>"))}${markup}</svg>` : svg);
