// Renders a 1200x630 link-preview card (og:image) for a route: mark, wordmark, the route title and
// description. WhatsApp shows a large preview for a 1.91:1 image. Rendered with macOS Quick Look,
// like the icons in icon.mjs; elsewhere it returns false and the page keeps the app icon.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PLUM = "#80307B";
const W = 1200;
const H = 630;
// Quick Look draws an SVG on a square canvas, 768 points wide, scaled to the -s size.
const QL_POINTS = 768;

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Greedy wrap by character count: about 0.55 em per character for the 800 title, 0.47 em for the 500 body.
function wrap(text, maxChars, maxLines) {
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    if (line && (line + " " + word).length > maxChars) {
      lines.push(line);
      line = word;
    } else {
      line = line ? line + " " + word : word;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) throw new Error(`og.mjs: "${text}" needs ${lines.length} lines, max ${maxLines}`);
  return lines;
}

function cardSvg({ markPath, title, description, fontBase64 }) {
  const titleSize = 72;
  const descSize = 34;
  const titleLines = wrap(title, 26, 3);
  const descLines = wrap(description, 64, 2);
  // Baselines: the description sits one title line plus a gap below the last title line.
  const titleTop = 310;
  const descTop = titleTop + (titleLines.length - 1) * titleSize * 1.15 + 92;
  const text = (lines, y0, size, weight, opacity) =>
    lines.map((l, i) => `<text x="88" y="${y0 + i * size * 1.15}" font-size="${size}" font-weight="${weight}" opacity="${opacity}">${esc(l)}</text>`).join("");
  // Square canvas, card centred vertically; the PNG is cropped back to 1200x630.
  const pad = (W - H) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${QL_POINTS}" height="${QL_POINTS}" viewBox="0 ${-pad} ${W} ${W}">
<style>@font-face{font-family:Nunito;src:url(data:font/woff2;base64,${fontBase64}) format("woff2");font-weight:200 1000}
text{font-family:Nunito,sans-serif;fill:#fff}</style>
<rect x="0" y="${-pad}" width="${W}" height="${W}" fill="${PLUM}"/>
<g transform="translate(88 82) scale(1.5)"><path d="${markPath}" fill="#fff"/></g>
<text x="196" y="146" font-size="56" font-weight="800">bipe</text>
${text(titleLines, titleTop, titleSize, 800, 1)}
${text(descLines, descTop, descSize, 500, 0.85)}
</svg>`;
}

/** Writes the card PNG to outPath. Returns false when it cannot render (not macOS). */
export function writeOgCard({ outPath, markPath, title, description, fontPath }) {
  if (process.platform !== "darwin") {
    console.warn("og.mjs: not macOS, link-preview card not rendered");
    return false;
  }
  const tmp = mkdtempSync(join(tmpdir(), "proseio-og-"));
  const src = join(tmp, "card.svg");
  writeFileSync(src, cardSvg({ markPath, title, description, fontBase64: readFileSync(fontPath).toString("base64") }));
  execFileSync("qlmanage", ["-t", "-s", String(W), "-o", tmp, src], { stdio: "ignore" });
  const png = join(tmp, "card.svg.png");
  execFileSync("sips", ["-c", String(H), String(W), png], { stdio: "ignore" });
  renameSync(png, outPath);
  return true;
}
