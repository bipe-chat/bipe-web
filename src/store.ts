// Store panels and social posts for /sobre/marca/ (bipe#466): the manifest.json files that
// scripts/brand-images.mjs writes into .brand-images/<group>/<device>/<locale>/ at the start of the
// build. scripts/build.mjs copies the PNGs a manifest lists from `dir` to `href`.
export type StoreSet = {
  device: string;
  label: string;
  platform: "ios" | "android" | "social";
  locale: string;
  width: number;
  height: number;
  exports: { order: number; slug: string; file: string; title: string }[];
};

const manifests = import.meta.glob<StoreSet>("../.brand-images/*/*/*/manifest.json", { eager: true, import: "default" });

/** App Store first, then Play, then Instagram; on each Instagram format the store posts come before the social-only ones. */
const ORDER = ["iphone69", "play-phone", "play-feature", "ig-post", "ig-story", "ig-square"];
function rank(s: { device: string; group: string }) {
  return ORDER.indexOf(s.device) * 2 + (s.group === "posts" ? 1 : 0);
}

/** `group` is the folder under .brand-images (loja, social, posts); `dir` is relative to src/; `href` is the folder in dist/. */
export const storeSets: (StoreSet & { group: string; dir: string; href: string })[] = Object.entries(manifests)
  .map(([path, set]) => {
    const group = path.split("/")[2];
    return { ...set, group, dir: path.replace(/\/manifest\.json$/, ""), href: `/sobre/marca/imagens/${group}/${set.device}/${set.locale}/` };
  })
  .sort((a, b) => rank(a) - rank(b) || a.locale.localeCompare(b.locale));

