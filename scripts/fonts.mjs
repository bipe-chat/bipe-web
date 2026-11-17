// Allo, the site and image face (bipe ADR 0295). One source: the allo-font package.
// The package ships one variable WOFF2 of about 440 KB with every script Allo draws. The site needs
// Latin only and two roundness values, so this file cuts one web font per face (roundness and optical
// size fixed, weight axis kept, about 82 KB each) and static instances for Satori, which reads no
// variable fonts and no WOFF2.
// Output goes to .generated/ (gitignored), so no copy can drift from the package.
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import subsetFont from "subset-font";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const source = join(dirname(require.resolve("allo-font/package.json")), "fonts/webfonts/AlloVariable.woff2");

/** Roundness (ROND axis, 0 to 100). Titles are round like the bubble; body text stays near Inter. */
export const ROND = { title: 100, body: 30 };

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => String.fromCodePoint(a + i)).join("");
/** Basic Latin, Latin-1, Latin Extended-A, punctuation, currency, arrows, maths, the symbols the site uses. */
const CHARS = [
  range(0x20, 0x7e), range(0xa0, 0xff), range(0x100, 0x17f),
  range(0x2000, 0x206f), range(0x20a0, 0x20bf), range(0x2190, 0x21ff), range(0x2200, 0x22ff),
  "ˆ˜˚˙˝ı™℗№★♥✓✕✗⌘⌥⇧⌫⏎",
].join("");

const SOURCE_MTIME = statSync(source).mtimeMs;
const fresh = (path) => existsSync(path) && statSync(path).mtimeMs >= SOURCE_MTIME && statSync(path).mtimeMs >= statSync(fileURLToPath(import.meta.url)).mtimeMs;

/** Web faces: CSS family, roundness and fixed optical size. Titles take display size, text takes text size. */
export const FACES = [
  { family: "Allo Round", file: "allo-round.woff2", rond: ROND.title, opsz: 32 },
  { family: "Allo Text", file: "allo-text.woff2", rond: ROND.body, opsz: 16 },
];

/** Writes the web faces and .generated/fonts/allo.css with their @font-face rules. Returns the CSS path. */
export async function writeWebFonts() {
  const dir = join(root, ".generated/fonts");
  mkdirSync(dir, { recursive: true });
  for (const f of FACES) {
    const out = join(dir, f.file);
    if (!fresh(out)) writeFileSync(out, await subsetFont(readFileSync(source), CHARS, { targetFormat: "woff2", variationAxes: { ROND: f.rond, opsz: f.opsz } }));
  }
  const css = join(dir, "allo.css");
  writeFileSync(css, FACES.map((f) => `@font-face { font-family: "${f.family}"; src: url("./${f.file}") format("woff2"); font-weight: 100 900; font-style: normal; font-display: swap; }`).join("\n") + "\n");
  return css;
}

/** A static instance (TrueType) for Satori: weight and roundness pinned, display optical size. */
export async function staticFont(weight, rond) {
  const out = join(root, `.generated/fonts/allo-${weight}-r${rond}.ttf`);
  if (!fresh(out)) {
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, await subsetFont(readFileSync(source), CHARS, { targetFormat: "truetype", variationAxes: { wght: weight, ROND: rond, opsz: 32 } }));
  }
  return readFileSync(out);
}
