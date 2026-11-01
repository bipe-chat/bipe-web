// Renders the store panels and the social posts for /sobre/marca/ (bipe-chat/bipe#466) with
// scripts/store-images.mjs, into .brand-images/<group>/<device>/<locale>/. src/store.ts reads the
// manifests at build time and scripts/build.mjs copies the PNGs into dist/. The captures come from
// appstore/raw (the site's phone scenes, scripts/scene-captures.mjs); a missing or blank capture stops the build, as in store-images.mjs.
import { readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { renderSet } from "./store-images.mjs";

/** Group -> listing (relative to bipe-web, null for bipe-shared/product/appstore.md) and devices. */
export const BRAND_SETS = {
  loja: { listing: null, devices: ["iphone69", "asc-header", "play-phone", "play-feature"] },
  social: { listing: null, devices: ["ig-post", "ig-story", "ig-square"] },
  posts: { listing: "social/posts.md", devices: ["ig-post", "ig-story", "ig-square"] },
};
const SHOWN = new Set(["built", "testing", "policy"]);
// The store has pt-BR captures only. Add a locale here when appstore/raw has its captures.
const LOCALES = ["pt-BR"];

export async function writeBrandImages(root, outDir) {
  rmSync(outDir, { recursive: true, force: true });
  // The status of a feature is its parity ledger item (bipe-shared/product/parity.json, bipe#300): iOS and Android.
  const ledger = JSON.parse(readFileSync(join(root, "../bipe-shared/product/parity.json"), "utf8"));
  const surface = (v) => (typeof v === "string" ? v : v?.status);
  const status = new Map(ledger.items.map((i) => [i.id, [surface(i.ios), surface(i.android)]]));
  for (const [group, { listing, devices }] of Object.entries(BRAND_SETS)) {
    for (const device of devices) for (const locale of LOCALES) {
      const manifests = await renderSet({ device, locale, out: join(outDir, group), quiet: true, ...(listing && { listing }) });
      // Public images claim only features that ship (bipe-shared/product/appstore.md rule).
      for (const m of manifests) for (const e of m.exports) {
        if (e.feature !== "-" && !status.get(e.feature)?.some((s) => SHOWN.has(s))) throw new Error(`brand-images: ${group} ${device} ${e.file} shows feature ${e.feature}, which does not ship`);
      }
    }
  }
}
