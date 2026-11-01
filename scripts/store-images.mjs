// Renders the App Store, Google Play and Instagram images (bipe-chat/bipe#455, #463, #465): one captioned panel per
// row of the `## Screenshots` table in bipe-shared/product/appstore.md, from the raw captures in
// appstore/raw (moved from bipe-ios, archived). The panel parts (title, sub, phone with status bar) are in
// scripts/lib/panels.mjs; the backdrop is scripts/lib/backdrop.mjs, shared with the
// link-preview cards. Satori lays the panel out and resvg rasterises it, as in scripts/og.mjs, so the
// output is the same on every machine and needs no browser.
//
//   pnpm store:images --device iphone69 --locale pt-BR
//   pnpm store:images --device play-phone --shared ../../.factory/bipe-shared
//   pnpm store:images --device ig-story --locale pt-BR --listing social/posts.md
//
// Options (paths are relative to bipe-web):
//   --device      iphone69 | asc-header | play-phone | play-feature | ig-post | ig-story | ig-square (default iphone69).
//                 No iPad: the store set is iPhone and Play only (bipe#419).
//   --locale      pt-BR | en-US (default: every locale in appstore.md)
//   --shared      bipe-shared clone; gives the parser and the listing (default ../bipe-shared)
//   --listing     the listing file (default <shared>/product/appstore.md). Any file with a `## Screenshots`
//                 table works: social/posts.md holds the social-only posts. A `capture` column reuses a
//                 store capture under another slug.
//   --appstore    folder with devices.mjs and raw/ (default appstore)
//   --raw         captures, as <raw>/<device>/<appearance>/<locale>/<slug>.png (default <appstore>/raw)
//   --appearance  light | dark (default light)
//   --texture     mesh | pattern for every panel (default: BRAND.texture)
//   --accent      goiaba | pitanga | maracuja | jenipapo | jabuticaba: alternate açaí with this one app palette
//                 (default: brandTone, all six)
//   --out         output root (default out/appstore for iOS and Play, out/social for Instagram; out/ is gitignored)
//
// Writes <out>/<device>/<locale>/NN-<slug>-WxH.png (.jpg for social posts) and manifest.json. Each PNG is RGB with no alpha
// channel at the exact store size. The builder stops on a missing, blank or wrong-size capture
// and never writes a placeholder: a blank iPad set once passed the size checks in another app.
import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { deflateSync } from "node:zlib";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import { fonts } from "./og.mjs";
import { captureSlugs, headerSlugs, illustrationBox, panelNode, shotOf } from "./lib/panels.mjs";
import { brazilNetworkSvg } from "./lib/brazil-network.mjs";
import { BRAND, backdropSvg, compose, tone } from "./lib/backdrop.mjs";
import { chunk, encodeJpeg } from "./lib/raster.mjs";
import { calloutSvg, overlay, SPECS } from "./lib/callouts.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Targets that are not in appstore/devices.mjs. They all use the iPhone captures (`captureFrom`), which
// are the site's phone scenes (scripts/scene-captures.mjs); the story keeps text out of the bands the IG bars cover (LAYOUT.story in lib/panels.mjs).
const OTHER_DEVICES = {
  "play-phone": { label: "Play phone", platform: "android", kind: "play", width: 1080, height: 1920, captureFrom: "iphone69" },
  "play-feature": { label: "Play feature graphic", platform: "android", kind: "feature", width: 1024, height: 500, captureFrom: "iphone69" },
  // App Store product page header and search results (iOS 27 creative assets): one universal 16:9 PNG.
  "asc-header": { label: "App Store header", platform: "ios", kind: "header", width: 5244, height: 2950, captureFrom: "iphone69" },
  "ig-post": { label: "Instagram post", platform: "social", kind: "post", width: 1080, height: 1350, captureFrom: "iphone69" },
  "ig-story": { label: "Instagram story", platform: "social", kind: "story", width: 1080, height: 1920, captureFrom: "iphone69" },
  "ig-square": { label: "Instagram square", platform: "social", kind: "square", width: 1080, height: 1080, captureFrom: "iphone69" },
};
const OUT = { ios: "out/appstore", android: "out/appstore", social: "out/social" };

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
 * exactly width x height, or JPEG bytes with format "jpeg" (social posts, lib/raster.mjs). Without `backdrop` the node must paint its own opaque background.
 * `top` is SVG markup that paints over the panel (the callout layer, lib/callouts.mjs).
 */
export async function renderPanel(node, width, height, backdrop, format = "png", top = "") {
  let svg = overlay(await satori(node, { width, height, fonts }), top);
  if (backdrop?.svg) svg = compose(svg, backdrop.svg);
  else if (backdrop) svg = compose(svg, backdropSvg({ width, height, ...backdrop }));
  const img = new Resvg(svg, { fitTo: { mode: "width", value: width }, background: backdrop?.tone.base ?? "#000000" }).render();
  if (img.width !== width || img.height !== height) throw new Error(`rendered ${img.width}x${img.height}, expected ${width}x${height}`);
  if (format === "jpeg") return encodeJpeg(img.pixels, width, height);
  const png = encodeRgbPng(img.pixels, width, height);
  const info = pngInfo(png);
  if (info.alpha || info.width !== width || info.height !== height) throw new Error("encoded PNG does not match the store rules");
  return png;
}

/** One panel as PNG bytes: the layout for the device kind and the panel type, on the backdrop. */
export async function panelPng({ panel, panels, dev, captures, markPath, tone: t, texture, index, subtitle, format, ctx }) {
  // A panel with no capture shows the Brazil network on its own jabuticaba field, with no brand
  // mark behind it (every such panel is about data in Brazil: dados-no-brasil, social text posts).
  // Its text takes the jabuticaba tone, so a light tone (maracujá) never puts dark ink on that field.
  if (panel.feature === "-" && dev.kind !== "feature") {
    const field = tone("jabuticaba");
    return renderPanel(panelNode({ panel, dev, captures, tone: field, markPath, subtitle }), dev.width, dev.height, { svg: brazilNetworkSvg({ width: dev.width, height: dev.height, box: illustrationBox(dev) }), tone: field }, format);
  }
  const node = panelNode({ panel, panels, dev, captures, tone: t, markPath, subtitle });
  const top = ctx ? await calloutSvg({ panel, dev, captures, ctx, tone: t }) : "";
  return renderPanel(node, dev.width, dev.height, { texture, tone: t, markPath, variant: index, mark: BRAND.mark }, format, top);
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

/**
 * Renders one device set per locale; `opt` takes the CLI options above. Returns the manifests it wrote,
 * or with `needs: true` only the captures the set needs, as { slug, palette, locale } (scene-captures).
 */
export async function renderSet(opt) {
  const rel = (p) => resolve(root, p);
  const shared = rel(opt.shared ?? "../bipe-shared");
  const { parseAppstore, LOCALES } = await import(pathToFileURL(join(shared, "tools/lib/appstore.mjs")).href);
  const listing = parseAppstore(readFileSync(opt.listing ? rel(opt.listing) : join(shared, "product/appstore.md"), "utf8"));
  const appstore = rel(opt.appstore ?? "appstore");
  const { device: iosDevice } = await import(pathToFileURL(join(appstore, "devices.mjs")).href);

  const key = opt.device ?? "iphone69";
  const other = OTHER_DEVICES[key];
  const dev = other ? { key, ...other } : { platform: "ios", ...iosDevice(key) };
  const captureDev = other?.captureFrom ? iosDevice(other.captureFrom) : other ? null : dev;
  const outRoot = rel(opt.out ?? OUT[dev.platform]);
  const rawRoot = opt.raw ? rel(opt.raw) : join(appstore, "raw");
  const appearance = opt.appearance ?? "light";
  const locales = opt.locale ? [opt.locale] : LOCALES;
  const marks = JSON.parse(readFileSync(join(root, "src/components/marks.json"), "utf8"));
  const cast = new Map(JSON.parse(readFileSync(join(shared, "product/cast.json"), "utf8")).cast.map((e) => [e.id, e]));
  const markPath = marks.paths[marks.chosen];
  const texture = opt.texture ?? BRAND.texture;
  const toneFor = opt.accent ? (i) => (i % 2 ? tone(opt.accent, "acai") : tone("acai", opt.accent)) : BRAND.tone;

  const written = [];
  for (const locale of locales) {
    const panels = listing.screenshots[locale];
    const strings = JSON.parse(readFileSync(join(shared, `strings/${locale === "pt-BR" ? "pt-BR" : "en"}.json`), "utf8")).strings;
    const ctx = { locale, strings, cast };
    if (!panels?.length) throw new Error(`appstore.md has no screenshot table for ${locale}`);

    // Each image is themed in its backdrop's palette, as the app themes the accent and the own bubble:
    // the capture of a slug comes in that palette, `<slug>@<palette>.png` (scripts/scene-captures.mjs).
    const jobs = dev.kind === "feature" || dev.kind === "header"
      ? [{ panel: heroPanel(panels), slug: dev.kind === "feature" ? "feature-graphic" : "header" }]
      : panels.map((panel) => ({ panel, slug: panel.slug }));
    for (const [i, job] of jobs.entries()) {
      job.palette = toneFor(i).palette;
      job.shots = !captureDev ? [] : dev.kind === "feature" ? [shotOf(job.panel)] : dev.kind === "header" ? headerSlugs(panels) : captureSlugs(job.panel);
    }
    if (opt.needs) {
      written.push(...jobs.flatMap((j) => j.shots.map((slug) => ({ slug, palette: j.palette, locale }))));
      continue;
    }

    // Check every capture before anything is written, so a failed run leaves the old set in place.
    const captures = new Map();
    if (captureDev) {
      const problems = [];
      for (const { shots, palette } of jobs) for (const slug of shots) {
        const id = `${slug}@${palette}`;
        if (captures.has(id)) continue;
        const file = join(rawRoot, captureDev.key, appearance, locale, `${id}.png`);
        if (!existsSync(file)) { problems.push(`missing ${file}`); continue; }
        try { captures.set(id, loadCapture(file, captureDev)); } catch (e) { problems.push(e.message); continue; }
        // A panel with callouts places them on the element list next to the captures (one per slug).
        const elements = join(rawRoot, captureDev.key, appearance, locale, `${slug}.elements.json`);
        if (panels.some((p) => shotOf(p) === slug && SPECS[p.slug])) {
          if (existsSync(elements)) captures.get(id).elements = JSON.parse(readFileSync(elements, "utf8"));
          else problems.push(`missing ${elements}`);
        }
      }
      if (problems.length) throw new Error(`store-images: ${dev.key} ${locale}: ${problems.length} capture problem(s). Run scripts/scene-captures.mjs.\n  ${problems.join("\n  ")}`);
    }

    const dir = join(outRoot, dev.key, locale);
    mkdirSync(dir, { recursive: true });
    for (const f of readdirSync(dir)) if (f.endsWith(".png") || f.endsWith(".jpg") || f === "manifest.json") unlinkSync(join(dir, f));

    const { width, height } = dev;
    const size = `${width}x${height}`;
    // Social posts ship on the web, so they are JPEG; store panels stay PNG for App Store Connect.
    const format = dev.platform === "social" ? "jpeg" : "png";
    const ext = format === "jpeg" ? "jpg" : "png";
    const exports = [];
    for (const [i, { panel, slug, shots, palette }] of jobs.entries()) {
      // The captures of this image, by slug, in its palette.
      const themed = new Map(shots.map((shot) => [shot, captures.get(`${shot}@${palette}`)]));
      const capture = themed.get(shotOf(panel));
      const subtitle = listing.platforms.ios?.locales[locale]?.subtitle ?? "";
      // The tone changes on every panel (brandTone), and the backdrop variant moves the blobs.
      const t = toneFor(i);
      const file = `${String(i + 1).padStart(2, "0")}-${slug}-${size}.${ext}`;
      writeFileSync(join(dir, file), await panelPng({ panel, panels, dev, captures: themed, markPath, tone: t, texture, index: i, subtitle, format, ctx }));
      exports.push({ order: i + 1, slug, feature: panel.feature, file, title: panel.title, sub: panel.sub || null, capture: capture ? `${captureDev.key}/${appearance}/${locale}/${shotOf(panel)}@${palette}.png` : null });
      if (!opt.quiet) console.log(`${dev.key} ${locale} ${file}`);
    }
    const manifest = { device: dev.key, label: dev.label, platform: dev.platform, ascDeviceType: dev.ascDeviceType ?? null, locale, appearance, width, height, exports };
    writeFileSync(join(dir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
    written.push(manifest);
  }
  return written;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  renderSet(args(process.argv.slice(2))).catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
