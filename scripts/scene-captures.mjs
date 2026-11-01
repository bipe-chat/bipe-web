// Captures the site's phone scenes (src/sim/scenes.ts, shown on /elenco/) as store captures, so the
// store panels have a second iPhone set made from the site's own simulations next to the app captures
// (MZ, 1 November 2026). Each scene screen is saved as 1320x2868 PNG with a <slug>.elements.json in
// the shape the app's UI test writes (labels and frames in points of a 440 pt screen), so the callouts
// in lib/callouts.mjs anchor on it the same way.
//
//   pnpm build && node scripts/scene-captures.mjs
//
// It serves dist/ itself and drives the installed Google Chrome over the DevTools protocol with Node's
// built-in WebSocket: no browser package. The output is committed in appstore/scenes/; the site build
// only reads it, so CI needs no browser. Run it again when a scene or the mapping below changes.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const dist = join(root, "dist");
const out = join(root, "appstore/scenes/iphone69/light/pt-BR");
const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

/** Store slug (bipe-shared product/appstore.md) -> the scene that shows the same feature. */
export const SCENE_FOR = {
  "aviso-golpe": "numero-novo",
  pedidos: "pedidos",
  "conferir-pix": "conferir-pix",
  "seu-arroba": "qr-conversa",
  "selo-cnpj": "empresa-pergunta",
  grupos: "grupo",
  stickers: "stickers",
};

const SIZE = { width: 1320, height: 2868, points: 440 };
// The panel draws its own status bar, as on the app captures; the scene's bar and home indicator go.
// The panel clips the corners itself, so the screen mask and the phone body go too.
const CSS = ".statusbar, .home-indicator { visibility: hidden !important; } .msg { animation: none !important; } .phone { background: none !important; filter: none !important; } .phone .screen { -webkit-mask: none !important; mask: none !important; }";

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".json": "application/json" };
function serve() {
  const server = createServer((req, res) => {
    let path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^(\.\.[/\\])+/, "");
    if (path.endsWith("/")) path += "index.html";
    const file = join(dist, path);
    if (!file.startsWith(dist) || !existsSync(file)) { res.writeHead(404).end(); return; }
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" }).end(readFileSync(file));
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

async function chrome() {
  const profile = mkdtempSync(join(tmpdir(), "scene-captures-"));
  const proc = spawn(CHROME, ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "--hide-scrollbars", "--force-color-profile=srgb", "about:blank"], { stdio: ["ignore", "ignore", "pipe"] });
  const ws = await new Promise((resolve, reject) => {
    let err = "";
    proc.stderr.on("data", (d) => {
      err += d;
      const m = err.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) resolve(m[1]);
    });
    proc.on("exit", (code) => reject(new Error(`Chrome exited (${code}): ${err.slice(-500)}`)));
  });
  const exited = new Promise((resolve) => proc.on("exit", resolve));
  return { ws, close: async () => { proc.kill(); await exited; rmSync(profile, { recursive: true, force: true, maxRetries: 5 }); } };
}

/** A minimal DevTools protocol client: send(method, params, sessionId) -> result. */
function cdp(url) {
  const socket = new WebSocket(url);
  let id = 0;
  const pending = new Map();
  socket.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(`${msg.error.message}`)) : resolve(msg.result);
    }
  };
  const ready = new Promise((resolve) => (socket.onopen = resolve));
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    pending.set(++id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params, ...(sessionId && { sessionId }) }));
  });
  return { ready, send, close: () => socket.close() };
}

// Runs in the page: the screen rect of one scene and its elements, in points of a 440 pt screen.
// Text leaves are static text (48), buttons are buttons (9), as in the app's element files.
const MEASURE = `(id) => {
  const fig = [...document.querySelectorAll(".scene-grid figure")].find((f) => f.querySelector("figcaption .mono")?.textContent.trim() === id);
  const screen = fig?.querySelector(".phone .screen");
  if (!screen) return null;
  fig.scrollIntoView({ block: "center" });
  const r = screen.getBoundingClientRect();
  const k = ${SIZE.points} / r.width;
  const frame = (e) => { const b = e.getBoundingClientRect(); return [b.x - r.x, b.y - r.y, b.width, b.height].map((v) => Math.round(v * k * 10) / 10); };
  const visible = (e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && b.bottom > r.top && b.top < r.bottom && getComputedStyle(e).visibility !== "hidden"; };
  const elements = [];
  for (const e of screen.querySelectorAll("*")) {
    if (!visible(e)) continue;
    const own = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join("").replace(/\\s+/g, " ").trim();
    const label = (e.getAttribute("aria-label") ?? "").trim();
    if (e.matches("button, [role=button], .request-buttons > *")) elements.push({ type: 9, label: (label || e.textContent).replace(/\\s+/g, " ").trim(), frame: frame(e) });
    else if (own || label) elements.push({ type: own ? 48 : 1, label: own || label, frame: frame(e) });
    if (e.children.length && e.textContent.trim()) elements.push({ type: 1, label: e.textContent.replace(/\\s+/g, " ").trim(), frame: frame(e) });
  }
  return { rect: { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height }, elements };
}`;

async function main() {
  if (!existsSync(join(dist, "elenco/index.html"))) throw new Error("scene-captures: no dist/elenco/; run pnpm build first");
  if (!existsSync(CHROME)) throw new Error(`scene-captures: no Chrome at ${CHROME} (set CHROME)`);
  const server = await serve();
  const browser = await chrome();
  const c = cdp(browser.ws);
  await c.ready;
  try {
    const { targetId } = await c.send("Target.createTarget", { url: "about:blank" });
    const { sessionId: s } = await c.send("Target.attachToTarget", { targetId, flatten: true });
    await c.send("Page.enable", {}, s);
    await c.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }, { name: "prefers-color-scheme", value: "light" }] }, s);
    await c.send("Emulation.setDeviceMetricsOverride", { width: 1400, height: 1600, deviceScaleFactor: 1, mobile: false }, s);
    await c.send("Page.navigate", { url: `http://127.0.0.1:${server.address().port}/elenco/` }, s);
    await new Promise((r) => setTimeout(r, 2500));
    await c.send("Runtime.evaluate", { expression: `document.head.insertAdjacentHTML("beforeend", ${JSON.stringify(`<style>${CSS}</style>`)}); document.fonts.ready`, awaitPromise: true }, s);
    mkdirSync(out, { recursive: true });
    for (const [slug, id] of Object.entries(SCENE_FOR)) {
      const { result } = await c.send("Runtime.evaluate", { expression: `(${MEASURE})(${JSON.stringify(id)})`, returnByValue: true }, s);
      if (!result.value) throw new Error(`scene-captures: no scene ${id} on /elenco/ (for ${slug})`);
      await new Promise((r) => setTimeout(r, 400));
      const { rect, elements } = result.value;
      // The site screen is 402x874, the store capture 1320x2868: scale by width, crop the height.
      const scale = SIZE.width / rect.width;
      const shot = await c.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: rect.x, y: rect.y, width: rect.width, height: SIZE.height / scale, scale } }, s);
      const raw = Buffer.from(shot.data, "base64");
      // Chrome rounds the clip to whole device pixels; resvg sets it to the exact store size.
      const [w, h] = [raw.readUInt32BE(16), raw.readUInt32BE(20)];
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE.width}" height="${SIZE.height}"><rect width="100%" height="100%" fill="#fff"/><image href="data:image/png;base64,${shot.data}" width="${SIZE.width}" height="${(h * SIZE.width) / w}"/></svg>`;
      const png = new Resvg(svg, { fitTo: { mode: "width", value: SIZE.width } }).render().asPng();
      writeFileSync(join(out, `${slug}.png`), png);
      writeFileSync(join(out, `${slug}.elements.json`), `${JSON.stringify({ source: `scene ${id}`, width: SIZE.points, height: Math.round(SIZE.points * (SIZE.height / SIZE.width)), elements }, null, 1)}\n`);
      console.log(`${slug} <- ${id} (${elements.length} elements)`);
    }
  } finally {
    c.close();
    await browser.close();
    server.close();
  }
}

main().catch((e) => { console.error(e.message); process.exit(1); });
