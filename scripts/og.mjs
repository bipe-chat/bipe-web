// Renders the 1200x630 link-preview card (og:image) for every route: mark and wordmark, the page
// title and description, and a footer rule with the page's section and the address. Satori lays the
// card out and turns the text into paths; resvg rasterises it. No system tool is involved, so the
// card is the same on every machine that builds the site.
// Style: docs/design/identity.md in the umbrella repo. Brand plum acai.1100, Nunito for the brand.
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";

export const OG_SIZE = { width: 1200, height: 630 };
/** Gutter wide enough that a square centre crop (WhatsApp, iMessage) keeps the title. */
const PAD = 72;
const PLUM = "#80307B"; // acai.1100 light
const PLUM_DEEP = "#682264"; // acai.1200 light
const PLUM_SOFT = "#913C8C"; // acai.1000 light
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

function card({ markPath, title, description, family }) {
  const { width, height } = OG_SIZE;
  return h("div", {
    style: { width, height, boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: PAD, backgroundColor: PLUM, color: WHITE, fontFamily: "Nunito", position: "relative" },
  },
    // The mark, large and low-contrast, bleeding off the top right: the brand without a second logo.
    // A positioned div holds the decoration, so it stays out of the flex flow.
    h("div", { style: { position: "absolute", left: 0, top: 0, width, height, display: "flex" } },
      h("svg", { width, height, viewBox: `0 0 ${width} ${height}` },
        h("g", { transform: `translate(${width - 300} -170) scale(7)` }, h("path", { d: markPath, fill: PLUM_SOFT })),
        h("g", { transform: `translate(${width - 190} -40) scale(3.4)` }, h("path", { d: markPath, fill: PLUM_DEEP })),
      ),
    ),
    h("div", { style: { display: "flex", alignItems: "center", gap: 18 } },
      h("svg", { width: 64, height: 64, viewBox: "0 0 64 64" }, h("path", { d: markPath, fill: WHITE })),
      h("div", { style: { display: "flex", fontSize: 58, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1 } }, "bipe"),
    ),
    h("div", { style: { display: "flex", flexDirection: "column", gap: 22, width: 880 } },
      // The clamp hides overflow, so the line box must hold the descenders of the last line.
      clamp(3, { fontSize: titleSize(title), fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.08, paddingBottom: "0.08em" }, title),
      description ? clamp(title.length > 30 ? 1 : 2, { fontSize: 34, fontWeight: 600, lineHeight: 1.3, color: "rgba(255,255,255,0.88)" }, description) : null,
    ),
    h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `2px solid ${RULE}`, paddingTop: 22, fontSize: 26, fontWeight: 800 } },
      h("div", { style: { display: "flex", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.88)" } }, family ?? ""),
      h("div", { style: { display: "flex" } }, "bipe.chat"),
    ),
  );
}

export { h };

/** Writes the card PNG to outPath. */
export async function writeOgCard({ outPath, markPath, title, description, family }) {
  const svg = await satori(card({ markPath, title, description, family }), { ...OG_SIZE, fonts });
  writeFileSync(outPath, new Resvg(svg, { fitTo: { mode: "width", value: OG_SIZE.width } }).render().asPng());
}
