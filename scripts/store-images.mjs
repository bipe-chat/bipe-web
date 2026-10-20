// Renders the App Store and Google Play images (bipe-chat/bipe#455): one captioned panel per row of
// the `## Screenshots` table in bipe-shared/product/appstore.md, from the raw captures that
// bipe-ios/appstore/capture.sh makes. A panel is the açaí background, the headline with its
// *highlight*, the sub and the capture in a device frame drawn in code. A text panel (feature `-`)
// shows the mark instead of a capture. Satori lays the panel out and resvg rasterises it, as in
// scripts/og.mjs, so the output is the same on every machine and needs no browser.
//
//   pnpm store:images --device iphone69 --locale pt-BR
//   pnpm store:images --device play-phone --shared ../../.factory/bipe-shared
//
// Options (paths are relative to bipe-web):
//   --device      iphone69 | ipad13 | play-phone | play-feature (default iphone69)
//   --locale      pt-BR | en-US (default: every locale in appstore.md)
//   --shared      bipe-shared clone; gives the parser and the listing (default ../bipe-shared)
//   --listing     the listing file (default <shared>/product/appstore.md)
//   --raw         captures, as <raw>/<device>/<appearance>/<slug>.png (default ../bipe-ios/appstore/raw)
//   --appearance  light | dark (default light)
//   --out         output root (default ../bipe-ios/appstore/screenshots for iOS, ../bipe-android/appstore/screenshots for Play)
//
// Writes <out>/<device>/<locale>/NN-<slug>-WxH.png and manifest.json. Each PNG is RGB with no alpha
// channel at the exact store size. The builder stops on a missing, blank or wrong-size capture
// and never writes a placeholder: a blank iPad set once passed the size checks in another app.
import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { deflateSync, crc32 } from "node:zlib";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import { fonts, h } from "./og.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PLUM = "#80307B"; // acai.1100 light
const PLUM_DEEP = "#682264"; // acai.1200 light
const PLUM_SOFT = "#913C8C"; // acai.1000 light
const HIGHLIGHT = "#EFC7EA"; // acai.500 light
const WHITE = "#FFFFFF";
const BEZEL = "#0C0D0F";

// Google Play targets. Play has no capture tool yet, so the phone panels use the iPhone captures
// (`captureFrom`) for layout checks only. They move to bipe-android with the Android capture issue.
const PLAY_DEVICES = {
  "play-phone": { label: "Play phone", kind: "phone", width: 1080, height: 1920, captureFrom: "iphone69" },
  "play-feature": { label: "Play feature graphic", kind: "feature", width: 1024, height: 500 },
};

// Layout per device kind, in units of a canvas 1320 wide; `s` scales them to the real width, so the
// type has the same proportion on every phone. `frameTop` is fixed so the phones line up across the
// set; a headline gets 3 lines and a sub 2 above it. On a tablet the copy stays left of the backdrop mark. The frame runs off the bottom edge on purpose.
// The shadow has no negative spread: resvg 2.6 panics on one in the iPad layout.
const LAYOUT = {
  phone: { side: 104, copyWidth: 1112, top: 168, headline: 124, sub: 54, gap: 36, frameTop: 800, screen: 992, bezel: 24, screenRadius: 124 },
  tablet: { side: 104, top: 104, headline: 92, sub: 42, gap: 26, copyWidth: 880, frameTop: 560, screen: 940, bezel: 22, screenRadius: 44 },
};

function args(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const m = argv[i].match(/^--(.+)$/);
    if (!m || argv[i + 1] === undefined || argv[i + 1].startsWith("--")) throw new Error(`store-images: bad argument ${argv[i]}`);
    out[m[1]] = argv[++i];
  }
  return out;
}

// --- PNG -----------------------------------------------------------------------------------------

/** Width, height and colour type from the IHDR chunk. Colour types 4 and 6 carry alpha. */
export function pngInfo(buf) {
  if (buf.length < 33 || buf.readUInt32BE(0) !== 0x89504e47 || buf.toString("latin1", 12, 16) !== "IHDR") throw new Error("not a PNG");
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), colorType: buf[25], alpha: buf[25] === 4 || buf[25] === 6 };
}

function chunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, "latin1");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])) >>> 0, 0);
  return Buffer.concat([head, data, crc]);
}

/**
 * Encodes RGBA pixels as an RGB PNG (colour type 2, no alpha channel), which is what App Store
 * Connect asks for: resvg always writes RGBA. Fails if a pixel is not opaque. Each row takes the
 * filter (None, Sub, Up, Paeth) with the smallest sum, as libpng does.
 */
export function encodeRgbPng(rgba, width, height) {
  const stride = width * 3;
  const rgb = Buffer.alloc(stride * height);
  for (let p = 0, q = 0; p < rgba.length; p += 4, q += 3) {
    if (rgba[p + 3] !== 255) throw new Error(`pixel ${p / 4} is not opaque (alpha ${rgba[p + 3]})`);
    rgb[q] = rgba[p]; rgb[q + 1] = rgba[p + 1]; rgb[q + 2] = rgba[p + 2];
  }
  const raw = Buffer.alloc((stride + 1) * height);
  const cand = [0, 1, 2, 4].map(() => Buffer.alloc(stride));
  for (let y = 0; y < height; y++) {
    const row = rgb.subarray(y * stride, (y + 1) * stride);
    const up = y ? rgb.subarray((y - 1) * stride, y * stride) : null;
    let best = 0;
    let bestSum = Infinity;
    [0, 1, 2, 4].forEach((type, k) => {
      const c = cand[k];
      let sum = 0;
      for (let i = 0; i < stride; i++) {
        const a = i >= 3 ? row[i - 3] : 0;
        const b = up ? up[i] : 0;
        const d = i >= 3 && up ? up[i - 3] : 0;
        let pred = 0;
        if (type === 1) pred = a;
        else if (type === 2) pred = b;
        else if (type === 4) {
          const pa = Math.abs(b - d), pb = Math.abs(a - d), pc = Math.abs(a + b - 2 * d);
          pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : d;
        }
        const v = (row[i] - pred) & 0xff;
        c[i] = v;
        sum += v < 128 ? v : 256 - v;
      }
      if (sum < bestSum) { bestSum = sum; best = k; }
    });
    raw[y * (stride + 1)] = [0, 1, 2, 4][best];
    cand[best].copy(raw, y * (stride + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** True when every pixel of a small render of the capture has the same colour. */
function isBlank(dataUrl, width, height) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><image href="${dataUrl}" width="${width}" height="${height}"/></svg>`;
  const px = new Resvg(svg, { fitTo: { mode: "width", value: 66 } }).render().pixels;
  for (let i = 4; i < px.length; i += 4) if (px.readUInt32LE(i) !== px.readUInt32LE(0)) return false;
  return true;
}

// --- Panels --------------------------------------------------------------------------------------

/** Headline text with `*highlight*` spans, as inline runs. */
const rich = (text, colour) =>
  text.split(/(\*[^*]+\*)/).filter(Boolean).map((part) => (part.startsWith("*") ? h("span", { style: { color: colour } }, part.slice(1, -1)) : part));

/** The mark, large and low-contrast, bleeding off the top right, as on the link-preview cards. */
const backdrop = (width, height, markPath, s) =>
  h("div", { style: { position: "absolute", left: 0, top: 0, width, height, display: "flex" } },
    h("svg", { width, height, viewBox: `0 0 ${width} ${height}` },
      h("g", { transform: `translate(${width - 520 * s} ${-300 * s}) scale(${12 * s})` }, h("path", { d: markPath, fill: PLUM_SOFT })),
      h("g", { transform: `translate(${width - 330 * s} ${-90 * s}) scale(${5.6 * s})` }, h("path", { d: markPath, fill: PLUM_DEEP })),
    ),
  );

const copy = (panel, L, s, align = "left") =>
  h("div", { style: { display: "flex", flexDirection: "column", gap: L.gap * s, alignItems: align === "center" ? "center" : "flex-start", textAlign: align } },
    h("div", { style: { display: "block", fontSize: L.headline * s, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.06, textWrap: "balance" } }, ...rich(panel.headline, HIGHLIGHT)),
    panel.sub ? h("div", { style: { display: "block", fontSize: L.sub * s, fontWeight: 600, lineHeight: 1.25, color: "rgba(255,255,255,0.86)", textWrap: "balance" } }, ...rich(panel.sub, WHITE)) : null,
  );

function capturePanel({ panel, width, height, kind, capture, markPath }) {
  const s = width / 1320;
  const L = LAYOUT[kind];
  const screenW = L.screen * s;
  const screenH = screenW * (capture.height / capture.width);
  const bezel = L.bezel * s;
  const frameW = screenW + 2 * bezel;
  return h("div", { style: { width, height, boxSizing: "border-box", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", backgroundColor: PLUM, color: WHITE, fontFamily: "Nunito" } },
    backdrop(width, height, markPath, s),
    h("div", { style: { position: "absolute", left: L.side * s, top: L.top * s, width: L.copyWidth * s, display: "flex" } }, copy(panel, L, s)),
    h("div", {
      style: {
        position: "absolute", left: (width - frameW) / 2, top: L.frameTop * s, width: frameW, padding: bezel, boxSizing: "border-box", display: "flex",
        backgroundColor: BEZEL, borderRadius: L.screenRadius * s + bezel, boxShadow: `0 ${40 * s}px ${80 * s}px rgba(0,0,0,0.35)`,
      },
    }, h("img", { src: capture.dataUrl, width: screenW, height: screenH, style: { borderRadius: L.screenRadius * s } })),
  );
}

function textPanel({ panel, width, height, kind, markPath }) {
  const s = width / 1320;
  const L = LAYOUT[kind];
  const mark = (kind === "tablet" ? 260 : 340) * s;
  return h("div", { style: { width, height, boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 96 * s, position: "relative", overflow: "hidden", backgroundColor: PLUM, color: WHITE, fontFamily: "Nunito", padding: `0 ${L.side * s}px` } },
    backdrop(width, height, markPath, s),
    h("svg", { width: mark, height: mark, viewBox: "0 0 64 64" }, h("path", { d: markPath, fill: WHITE })),
    copy(panel, { ...L, headline: L.headline * 1.15, sub: L.sub * 1.1 }, s, "center"),
  );
}

/** Play feature graphic: mark and wordmark on the left, the text panel's headline on the right. No backdrop: at 500 high it covers the headline. */
function featureGraphic({ panel, width, height, markPath }) {
  return h("div", { style: { width, height, boxSizing: "border-box", display: "flex", alignItems: "center", gap: 56, padding: "0 72px", position: "relative", overflow: "hidden", backgroundColor: PLUM, color: WHITE, fontFamily: "Nunito" } },
    h("div", { style: { display: "flex", alignItems: "center", gap: 22 } },
      h("svg", { width: 112, height: 112, viewBox: "0 0 64 64" }, h("path", { d: markPath, fill: WHITE })),
      h("div", { style: { display: "flex", fontSize: 104, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1 } }, "bipe"),
    ),
    h("div", { style: { display: "block", flex: 1, fontSize: 58, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.08, textWrap: "balance" } }, ...rich(panel.headline, HIGHLIGHT)),
  );
}

/** Renders one panel and returns RGB PNG bytes at exactly width x height. */
export async function renderPanel(node, width, height) {
  const svg = await satori(node, { width, height, fonts });
  const img = new Resvg(svg, { fitTo: { mode: "width", value: width }, background: PLUM }).render();
  if (img.width !== width || img.height !== height) throw new Error(`rendered ${img.width}x${img.height}, expected ${width}x${height}`);
  const png = encodeRgbPng(img.pixels, width, height);
  const info = pngInfo(png);
  if (info.alpha || info.width !== width || info.height !== height) throw new Error("encoded PNG does not match the store rules");
  return png;
}

// --- Run -----------------------------------------------------------------------------------------

async function main() {
  const opt = args(process.argv.slice(2));
  const rel = (p) => resolve(root, p);
  const shared = rel(opt.shared ?? "../bipe-shared");
  const { parseAppstore, LOCALES } = await import(pathToFileURL(join(shared, "tools/lib/appstore.mjs")).href);
  const listing = parseAppstore(readFileSync(opt.listing ? rel(opt.listing) : join(shared, "product/appstore.md"), "utf8"));
  const { device: iosDevice } = await import(pathToFileURL(rel("../bipe-ios/appstore/devices.mjs")).href);

  const key = opt.device ?? "iphone69";
  const play = PLAY_DEVICES[key];
  const dev = play ? { key, ...play } : iosDevice(key);
  const captureDev = play?.captureFrom ? iosDevice(play.captureFrom) : play ? null : dev;
  const outRoot = rel(opt.out ?? (play ? "../bipe-android/appstore/screenshots" : "../bipe-ios/appstore/screenshots"));
  const rawRoot = rel(opt.raw ?? "../bipe-ios/appstore/raw");
  const appearance = opt.appearance ?? "light";
  const locales = opt.locale ? [opt.locale] : LOCALES;
  const marks = JSON.parse(readFileSync(join(root, "src/components/marks.json"), "utf8"));
  const markPath = marks.paths[marks.chosen];

  for (const locale of locales) {
    const panels = listing.screenshots[locale];
    if (!panels?.length) throw new Error(`appstore.md has no screenshot table for ${locale}`);

    // Check every capture before anything is written, so a failed run leaves the old set in place.
    const captures = new Map();
    if (captureDev) {
      const problems = [];
      for (const p of panels.filter((p) => p.feature !== "-")) {
        const file = join(rawRoot, captureDev.key, appearance, `${p.slug}.png`);
        if (!existsSync(file)) { problems.push(`missing ${file}`); continue; }
        const buf = readFileSync(file);
        const info = pngInfo(buf);
        if (info.width !== captureDev.width || info.height !== captureDev.height) {
          problems.push(`${file} is ${info.width}x${info.height}, devices.mjs says ${captureDev.width}x${captureDev.height}`);
          continue;
        }
        const dataUrl = `data:image/png;base64,${buf.toString("base64")}`;
        if (isBlank(dataUrl, info.width, info.height)) { problems.push(`${file} is blank`); continue; }
        captures.set(p.slug, { dataUrl, width: info.width, height: info.height, file });
      }
      if (problems.length) throw new Error(`store-images: ${dev.key} ${locale}: ${problems.length} capture problem(s). Run bipe-ios/appstore/capture.sh ${captureDev.key} ${appearance}.\n  ${problems.join("\n  ")}`);
    }

    const dir = join(outRoot, dev.key, locale);
    mkdirSync(dir, { recursive: true });
    for (const f of readdirSync(dir)) if (f.endsWith(".png") || f === "manifest.json") unlinkSync(join(dir, f));

    const { width, height } = dev;
    const size = `${width}x${height}`;
    const jobs = dev.kind === "feature"
      ? [{ panel: panels.find((p) => p.feature === "-") ?? panels[0], slug: "feature-graphic" }]
      : panels.map((panel) => ({ panel, slug: panel.slug }));
    const exports = [];
    for (const [i, { panel, slug }] of jobs.entries()) {
      const capture = captures.get(panel.slug);
      const node = dev.kind === "feature" ? featureGraphic({ panel, width, height, markPath })
        : panel.feature === "-" ? textPanel({ panel, width, height, kind: dev.kind, markPath })
        : capturePanel({ panel, width, height, kind: dev.kind, capture, markPath });
      const file = `${String(i + 1).padStart(2, "0")}-${slug}-${size}.png`;
      writeFileSync(join(dir, file), await renderPanel(node, width, height));
      exports.push({ order: i + 1, slug, feature: panel.feature, file, headline: panel.headline, sub: panel.sub || null, capture: capture ? `${captureDev.key}/${appearance}/${panel.slug}.png` : null });
      console.log(`${dev.key} ${locale} ${file}`);
    }
    const manifest = { device: dev.key, label: dev.label, platform: play ? "android" : "ios", ascDeviceType: dev.ascDeviceType ?? null, locale, appearance, width, height, exports };
    writeFileSync(join(dir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
