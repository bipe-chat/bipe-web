// Renders the store panels and the social posts for /sobre/marca/ (bipe-chat/bipe#466) with
// scripts/store-images.mjs, into .brand-images/<group>/<device>/<locale>/. src/store.ts reads the
// manifests at build time and scripts/build.mjs copies the PNGs into dist/. The captures come from
// bipe-ios/appstore/raw; a missing or blank capture stops the build, as in store-images.mjs.
import { readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { renderSet } from "./store-images.mjs";

/** Group -> listing (relative to bipe-web, null for bipe-shared/product/appstore.md) and devices. */
export const BRAND_SETS = {
  loja: { listing: null, devices: ["iphone69", "play-phone", "play-feature"] },
  social: { listing: null, devices: ["ig-post", "ig-story", "ig-square"] },
  posts: { listing: "social/posts.md", devices: ["ig-post", "ig-story", "ig-square"] },
};
const SHOWN = new Set(["built", "testing", "policy"]);

export async function writeBrandImages(root, outDir) {
  rmSync(outDir, { recursive: true, force: true });
  const product = JSON.parse(readFileSync(join(root, "../bipe-shared/product/product.json"), "utf8"));
  const status = new Map(product.features.map((f) => [f.id, Object.values(f.status ?? {})]));
  for (const [group, { listing, devices }] of Object.entries(BRAND_SETS)) {
    for (const device of devices) {
      const manifests = await renderSet({ device, out: join(outDir, group), quiet: true, ...(listing && { listing }) });
      // Public images claim only features that ship (bipe-shared/product/appstore.md rule).
      for (const m of manifests) for (const e of m.exports) {
        if (e.feature !== "-" && !status.get(e.feature)?.some((s) => SHOWN.has(s))) throw new Error(`brand-images: ${group} ${device} ${e.file} shows feature ${e.feature}, which does not ship`);
      }
    }
  }
}
