// Writes the favicon, mark and app-icon files for the chosen mark (src/components/marks.json) into
// public/. PNGs (apple-touch-icon, og:image) are rendered with macOS Quick Look; elsewhere they are skipped.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, renameSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PLUM = "#80307B";
const iconSvg = (path, rx) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="${rx}" fill="${PLUM}"/><g transform="translate(10 10) scale(.6875)"><path d="${path}" fill="#fff"/></g></svg>`;

export function writeIcons(publicDir, path) {
  const brand = join(publicDir, "brand");
  mkdirSync(brand, { recursive: true });
  writeFileSync(join(publicDir, "favicon.svg"), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><style>path{fill:${PLUM}}@media(prefers-color-scheme:dark){path{fill:#D993D2}}</style><path d="${path}"/></svg>`);
  writeFileSync(join(brand, "mark.svg"), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="${path}" fill="${PLUM}"/></svg>`);
  writeFileSync(join(brand, "app-icon.svg"), iconSvg(path, 14));
  if (process.platform !== "darwin") return console.warn("icon.mjs: not macOS, PNG icons not rendered");
  // Square source: iOS masks the corners itself.
  const tmp = mkdtempSync(join(tmpdir(), "proseio-icon-"));
  const src = join(tmp, "app-icon.svg");
  writeFileSync(src, iconSvg(path, 0));
  execFileSync("qlmanage", ["-t", "-s", "512", "-o", tmp, src], { stdio: "ignore" });
  renameSync(join(tmp, "app-icon.svg.png"), join(brand, "app-icon.png"));
}
