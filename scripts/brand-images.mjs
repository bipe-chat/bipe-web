// Renders the store panels and the social posts for /sobre/marca/ (bipe-chat/bipe#466) with
// scripts/store-images.mjs, into .brand-images/<group>/<device>/<locale>/. src/store.ts reads the
// manifests at build time and scripts/build.mjs copies the PNGs into dist/. The captures come from
// appstore/raw (the site's phone scenes, scripts/scene-captures.mjs); a missing or blank capture stops the build, as in store-images.mjs.
import { readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { renderSet } from "./store-images.mjs";

/**
 * Group -> listing (relative to bipe-web, null for bipe-shared/product/appstore.md) and devices.
 * `everyPalette`: the header and the feature graphic in all six app palettes (MZ, 2 November 2026).
 * Instagram is social/posts.md only: the store panels are not posts (social/guide.md).
 */
export const BRAND_SETS = {
  loja: { listing: null, devices: ["iphone69", "asc-header", "play-phone", "play-feature"], everyPalette: true },
  posts: { listing: "social/posts.md", devices: ["ig-post", "ig-story", "ig-square"] },
};
const SHOWN = new Set(["built", "testing", "policy"]);
// The store has pt-BR captures only. Add a locale here when appstore/raw has its captures.
export const LOCALES = ["pt-BR"];

export async function writeBrandImages(root, outDir) {
  rmSync(outDir, { recursive: true, force: true });
  // The status of a feature is its parity ledger item (bipe-shared/product/parity.json, bipe#300): iOS and Android.
  const ledger = JSON.parse(readFileSync(join(root, "../bipe-shared/product/parity.json"), "utf8"));
  const surface = (v) => (typeof v === "string" ? v : v?.status);
  const status = new Map(ledger.items.map((i) => [i.id, [surface(i.ios), surface(i.android)]]));
  for (const [group, { listing, devices, everyPalette }] of Object.entries(BRAND_SETS)) {
    for (const device of devices) for (const locale of LOCALES) {
      const manifests = await renderSet({ device, locale, out: join(outDir, group), quiet: true, everyPalette, ...(listing && { listing }) });
      // Public images claim only features that ship (bipe-shared/product/appstore.md rule).
      for (const m of manifests) for (const e of m.exports) {
        if (e.feature !== "-" && !status.get(e.feature)?.some((s) => SHOWN.has(s))) throw new Error(`brand-images: ${group} ${device} ${e.file} shows feature ${e.feature}, which does not ship`);
      }
    }
  }
}
