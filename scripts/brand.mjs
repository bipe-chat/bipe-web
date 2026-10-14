// Renders the brand downloads listed in src/components/brand-assets.json into dist/brand/, as SVG
// and PNG. The wordmark comes from Satori, so the "bipe" text is paths and needs no font on the
// reader's machine; resvg finds its bounding box and the SVG is cropped to it. Same on every machine.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import { iconSvg } from "./icon.mjs";
import { fonts, h } from "./og.mjs";

/** Mark and "bipe" as on the site header (.wordmark): weight 900, mark 1.05em, gap .3em. */
async function wordmarkSvg(markPath, fg) {
  const size = 200;
  const svg = await satori(
    h("div", { style: { display: "flex", alignItems: "center", gap: size * 0.3, fontFamily: "Nunito", fontWeight: 900, fontSize: size, letterSpacing: "-0.02em", lineHeight: 1, color: fg, padding: 40 } },
      h("svg", { width: size * 1.05, height: size * 1.05, viewBox: "0 0 64 64" }, h("path", { d: markPath, fill: fg })),
      h("div", { style: { display: "flex" } }, "bipe"),
    ),
    { width: 1200, height: 320, fonts },
  );
  // Crop to the ink plus a margin of 6% of the height, so nothing touches the edge.
  const box = new Resvg(svg).getBBox();
  const m = box.height * 0.06;
  const [x, y, w, hh] = [box.x - m, box.y - m, box.width + 2 * m, box.height + 2 * m].map((n) => Math.round(n * 100) / 100);
  return svg.replace(/^<svg[^>]*?width="\d+" height="\d+" viewBox="[^"]+"/, `<svg width="${w}" height="${hh}" viewBox="${x} ${y} ${w} ${hh}"`);
}

const markSvg = (markPath, fg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="${markPath}" fill="${fg}"/></svg>`;

export async function writeBrandAssets(outDir, markPath, assets) {
  mkdirSync(outDir, { recursive: true });
  for (const a of assets) {
    const svg =
      a.kind === "wordmark" ? await wordmarkSvg(markPath, a.fg)
      : a.kind === "mark" ? markSvg(markPath, a.fg)
      : iconSvg(markPath, a.kind === "icon" ? 14 : 0, a.bg, a.fg);
    writeFileSync(join(outDir, `${a.file}.svg`), svg);
    writeFileSync(join(outDir, `${a.file}.png`), new Resvg(svg, { fitTo: { mode: "width", value: a.png } }).render().asPng());
  }
}
