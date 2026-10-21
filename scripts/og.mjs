// Renders the 1200x630 link-preview card (og:image) for every route: mark and wordmark, the page
// title and description, and a footer rule with the page's section and the address. Satori lays the
// card out and turns the text into paths; resvg rasterises it. No system tool is involved, so the
// card is the same on every machine that builds the site.
// Style: docs/design/identity.md in the umbrella repo. Brand plum acai.1100, Nunito for the brand.
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { encodeJpeg } from "./lib/raster.mjs";
import satori from "satori";
import { BRAND, backdropSvg, compose } from "./lib/backdrop.mjs";
import { brazilNetworkSvg } from "./lib/brazil-network.mjs";

export const OG_SIZE = { width: 1200, height: 630 };
/** Gutter wide enough that a square centre crop (WhatsApp, iMessage) keeps the title. */
const PAD = 72;
const WHITE = "#FFFFFF";
const RULE = "rgba(255,255,255,0.22)";

const require = createRequire(import.meta.url);
const fontDir = join(dirname(require.resolve("@fontsource/nunito/package.json")), "files");
export const fonts = [600, 800, 900].map((weight) => ({
  name: "Nunito",
  data: readFileSync(join(fontDir, `nunito-latin-${weight}-normal.woff`)),
  weight,
  style: "normal",
}));

/** Minimal element factory: Satori takes React-shaped objects. */
const h = (type, props, ...children) => ({ type, props: { ...props, children: children.length > 1 ? children : children[0] } });

/** Step the headline down as it grows, so a long title stays inside three lines. */
function titleSize(text) {
  if (text.length <= 24) return 96;
  if (text.length <= 48) return 78;
  return 62;
}

/** A block of text clamped to N lines with an ellipsis. */
const clamp = (lines, style, text) => h("div", { style: { display: "block", lineClamp: lines, overflow: "hidden", textOverflow: "ellipsis", ...style } }, text);

function card({ markPath, title, description, illustration }) {
  const { width, height } = OG_SIZE;
  return h("div", {
    // No background: compose() puts the brand backdrop (scripts/lib/backdrop.mjs) under the card.
    style: { width, height, boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: PAD, color: WHITE, fontFamily: "Nunito", position: "relative" },
  },
    h("div", { style: { display: "flex", alignItems: "center", gap: 18 } },
      h("svg", { width: 64, height: 64, viewBox: "0 0 64 64" }, h("path", { d: markPath, fill: WHITE })),
      h("div", { style: { display: "flex", fontSize: 58, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1 } }, "bipe"),
    ),
    // With an illustration (the Brazil network on the right half) the text keeps to the left half.
    h("div", { style: { display: "flex", flexDirection: "column", gap: 22, width: illustration ? 560 : 880 } },
      // The clamp hides overflow, so the line box must hold the descenders of the last line.
      clamp(3, { fontSize: titleSize(title), fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.08, paddingBottom: "0.08em" }, title),
      description ? clamp(title.length > 30 ? 1 : 2, { fontSize: 34, fontWeight: 600, lineHeight: 1.3, color: "rgba(255,255,255,0.88)" }, description) : null,
    ),
    // Footer: the address only. No upper-case section label (MZ: no eyebrows).
    h("div", { style: { display: "flex", justifyContent: "flex-end", alignItems: "center", borderTop: `2px solid ${RULE}`, paddingTop: 22, fontSize: 26, fontWeight: 800, width: illustration ? 560 : "100%" } },
      h("div", { style: { display: "flex" } }, "bipe.chat"),
    ),
  );
}

export { h };

/**
 * Writes the card JPEG to outPath (lib/raster.mjs). `illustration: "brazil"` draws the Brazil network
 * (lib/brazil-network.mjs) on its own field in place of the brand backdrop.
 */
export async function writeOgCard({ outPath, markPath, title, description, illustration, texture = BRAND.texture, tone = BRAND.tone(0) }) {
  const back = illustration === "brazil" ? brazilNetworkSvg({ ...OG_SIZE }) : backdropSvg({ ...OG_SIZE, texture, tone, markPath, mark: BRAND.mark });
  const svg = compose(await satori(card({ markPath, title, description, illustration }), { ...OG_SIZE, fonts }), back);
  const img = new Resvg(svg, { fitTo: { mode: "width", value: OG_SIZE.width }, background: tone.base }).render();
  writeFileSync(outPath, encodeJpeg(img.pixels, img.width, img.height));
}
