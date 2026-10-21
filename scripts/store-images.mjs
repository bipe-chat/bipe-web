// Renders the App Store, Google Play and Instagram images (bipe-chat/bipe#455, #463, #465): one captioned panel per
// row of the `## Screenshots` table in bipe-shared/product/appstore.md, from the raw captures that
// bipe-ios/appstore/capture.sh makes. The panel parts (title, sub, phone with status bar) are in
// scripts/lib/panels.mjs; the backdrop is scripts/lib/backdrop.mjs, shared with the
// link-preview cards. Satori lays the panel out and resvg rasterises it, as in scripts/og.mjs, so the
// output is the same on every machine and needs no browser.
//
//   pnpm store:images --device iphone69 --locale pt-BR
//   pnpm store:images --device play-phone --shared ../../.factory/bipe-shared
//   pnpm store:images --device ig-story --locale pt-BR --listing social/posts.md
//
// Options (paths are relative to bipe-web):
//   --device      iphone69 | play-phone | play-feature | ig-post | ig-story | ig-square (default iphone69).
//                 No iPad: the store set is iPhone and Play only (bipe#419).
//   --locale      pt-BR | en-US (default: every locale in appstore.md)
//   --shared      bipe-shared clone; gives the parser and the listing (default ../bipe-shared)
//   --listing     the listing file (default <shared>/product/appstore.md). Any file with a `## Screenshots`
//                 table works: social/posts.md holds the social-only posts. A `capture` column reuses a
//                 store capture under another slug.
//   --ios         bipe-ios clone; gives devices.mjs and the captures (default ../bipe-ios)
//   --raw         captures, as <raw>/<device>/<appearance>/<locale>/<slug>.png (default <ios>/appstore/raw)
//   --appearance  light | dark (default light)
//   --texture     mesh | grain | pattern for every panel (default: BRAND.texture)
//   --accent      pitanga | jabuticaba | jenipapo: alternate açaí with this one ramp (default: brandTone, all three)
//   --out         output root (default ../bipe-ios/appstore/screenshots for iOS, ../bipe-android/appstore/screenshots
//                 for Play, out/social for Instagram, which is gitignored and never a store folder)
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
import { fonts } from "./og.mjs";
import { captureSlugs, illustrationBox, panelNode, shotOf } from "./lib/panels.mjs";
import { brazilNetworkSvg } from "./lib/brazil-network.mjs";
import { BRAND, backdropSvg, compose, tone } from "./lib/backdrop.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Targets that are not in bipe-ios/appstore/devices.mjs. Play has no capture tool yet, so the phone
// panels use the iPhone captures (`captureFrom`) for layout checks only. They move to bipe-android
// with the Android capture issue. The Instagram targets (bipe-chat/bipe#465) use the iPhone captures
// too; the story keeps text out of the bands the IG bars cover (LAYOUT.story in lib/panels.mjs).
const OTHER_DEVICES = {
  "play-phone": { label: "Play phone", platform: "android", kind: "play", width: 1080, height: 1920, captureFrom: "iphone69" },
  "play-feature": { label: "Play feature graphic", platform: "android", kind: "feature", width: 1024, height: 500, captureFrom: "iphone69" },
  "ig-post": { label: "Instagram post", platform: "social", kind: "post", width: 1080, height: 1350, captureFrom: "iphone69" },
  "ig-story": { label: "Instagram story", platform: "social", kind: "story", width: 1080, height: 1920, captureFrom: "iphone69" },
  "ig-square": { label: "Instagram square", platform: "social", kind: "square", width: 1080, height: 1080, captureFrom: "iphone69" },
};
const OUT = { ios: "../bipe-ios/appstore/screenshots", android: "../bipe-android/appstore/screenshots", social: "out/social" };

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

/**
 * Renders one panel on the brand backdrop (scripts/lib/backdrop.mjs) and returns RGB PNG bytes at
 * exactly width x height. Without `backdrop` the node must paint its own opaque background.
 */
export async function renderPanel(node, width, height, backdrop) {
  let svg = await satori(node, { width, height, fonts });
  if (backdrop?.svg) svg = compose(svg, backdrop.svg);
  else if (backdrop) svg = compose(svg, backdropSvg({ width, height, ...backdrop }));
  const img = new Resvg(svg, { fitTo: { mode: "width", value: width }, background: backdrop?.tone.base ?? "#000000" }).render();
  if (img.width !== width || img.height !== height) throw new Error(`rendered ${img.width}x${img.height}, expected ${width}x${height}`);
  const png = encodeRgbPng(img.pixels, width, height);
  const info = pngInfo(png);
  if (info.alpha || info.width !== width || info.height !== height) throw new Error("encoded PNG does not match the store rules");
  return png;
}

/** One panel as PNG bytes: the layout for the device kind and the panel type, on the backdrop. */
export function panelPng({ panel, dev, captures, markPath, tone: t, texture, index, subtitle }) {
  const node = panelNode({ panel, dev, captures, tone: t, markPath, subtitle });
  // A panel with no capture shows the Brazil network on its own jabuticaba field, with no brand
  // mark behind it (every such panel is about data in Brazil: dados-no-brasil, social text posts).
  if (panel.feature === "-" && dev.kind !== "feature")
    return renderPanel(node, dev.width, dev.height, { svg: brazilNetworkSvg({ width: dev.width, height: dev.height, box: illustrationBox(dev) }), tone: t });
  return renderPanel(node, dev.width, dev.height, { texture, tone: t, markPath, variant: index, mark: BRAND.mark });
}

/** A capture file as the panels use it. Throws on a wrong size or a blank image. */
export function loadCapture(file, captureDev) {
  const buf = readFileSync(file);
  const info = pngInfo(buf);
  if (info.width !== captureDev.width || info.height !== captureDev.height) throw new Error(`${file} is ${info.width}x${info.height}, devices.mjs says ${captureDev.width}x${captureDev.height}`);
  const dataUrl = `data:image/png;base64,${buf.toString("base64")}`;
  if (isBlank(dataUrl, info.width, info.height)) throw new Error(`${file} is blank`);
  if (!(captureDev.screenRadius > 0)) throw new Error(`devices.mjs: ${captureDev.key} has no screenRadius`);
  return { dataUrl, width: info.width, height: info.height, radius: captureDev.screenRadius, file };
}

/** The panel the feature graphic shows: panel 1. */
const heroPanel = (panels) => panels[0];

// --- Run -----------------------------------------------------------------------------------------

async function main() {
  const opt = args(process.argv.slice(2));
  const rel = (p) => resolve(root, p);
  const shared = rel(opt.shared ?? "../bipe-shared");
  const { parseAppstore, LOCALES } = await import(pathToFileURL(join(shared, "tools/lib/appstore.mjs")).href);
  const listing = parseAppstore(readFileSync(opt.listing ? rel(opt.listing) : join(shared, "product/appstore.md"), "utf8"));
  const ios = rel(opt.ios ?? "../bipe-ios");
  const { device: iosDevice } = await import(pathToFileURL(join(ios, "appstore/devices.mjs")).href);

  const key = opt.device ?? "iphone69";
  const other = OTHER_DEVICES[key];
  const dev = other ? { key, ...other } : { platform: "ios", ...iosDevice(key) };
  const captureDev = other?.captureFrom ? iosDevice(other.captureFrom) : other ? null : dev;
  const outRoot = rel(opt.out ?? OUT[dev.platform]);
  const rawRoot = opt.raw ? rel(opt.raw) : join(ios, "appstore/raw");
  const appearance = opt.appearance ?? "light";
  const locales = opt.locale ? [opt.locale] : LOCALES;
  const marks = JSON.parse(readFileSync(join(root, "src/components/marks.json"), "utf8"));
  const markPath = marks.paths[marks.chosen];
  const texture = opt.texture ?? BRAND.texture;
  const toneFor = opt.accent ? (i) => (i % 2 ? tone(opt.accent, "acai") : tone("acai", opt.accent)) : BRAND.tone;

  for (const locale of locales) {
    const panels = listing.screenshots[locale];
    if (!panels?.length) throw new Error(`appstore.md has no screenshot table for ${locale}`);

    // Check every capture before anything is written, so a failed run leaves the old set in place.
    const captures = new Map();
    if (captureDev) {
      const problems = [];
      const need = dev.kind === "feature" ? [shotOf(heroPanel(panels))] : panels.flatMap(captureSlugs);
      for (const slug of need) {
        const file = join(rawRoot, captureDev.key, appearance, locale, `${slug}.png`);
        if (!existsSync(file)) { problems.push(`missing ${file}`); continue; }
        try { captures.set(slug, loadCapture(file, captureDev)); } catch (e) { problems.push(e.message); }
      }
      if (problems.length) throw new Error(`store-images: ${dev.key} ${locale}: ${problems.length} capture problem(s). Run bipe-ios/appstore/capture.sh ${captureDev.key} ${appearance} --locale ${locale}.\n  ${problems.join("\n  ")}`);
    }

    const dir = join(outRoot, dev.key, locale);
    mkdirSync(dir, { recursive: true });
    for (const f of readdirSync(dir)) if (f.endsWith(".png") || f === "manifest.json") unlinkSync(join(dir, f));

    const { width, height } = dev;
    const size = `${width}x${height}`;
    const jobs = dev.kind === "feature"
      ? [{ panel: heroPanel(panels), slug: "feature-graphic" }]
      : panels.map((panel) => ({ panel, slug: panel.slug }));
    const exports = [];
    for (const [i, { panel, slug }] of jobs.entries()) {
      const capture = captures.get(shotOf(panel));
      const subtitle = listing.platforms.ios?.locales[locale]?.subtitle ?? "";
      // The tone changes on every panel (brandTone), and the backdrop variant moves the blobs.
      const t = toneFor(i);
      const file = `${String(i + 1).padStart(2, "0")}-${slug}-${size}.png`;
      writeFileSync(join(dir, file), await panelPng({ panel, dev, captures, markPath, tone: t, texture, index: i, subtitle }));
      exports.push({ order: i + 1, slug, feature: panel.feature, file, title: panel.title, sub: panel.sub || null, capture: capture ? `${captureDev.key}/${appearance}/${locale}/${shotOf(panel)}.png` : null });
      console.log(`${dev.key} ${locale} ${file}`);
    }
    const manifest = { device: dev.key, label: dev.label, platform: dev.platform, ascDeviceType: dev.ascDeviceType ?? null, locale, appearance, width, height, exports };
    writeFileSync(join(dir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
