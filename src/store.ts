// Store image sets for /elenco/loja/: the manifest.json files that scripts/store-images.mjs writes
// next to the panels in the app repos. A clone without them (CI checks out bipe-shared only) shows
// no sets. scripts/build.mjs copies the PNGs a manifest lists from `dir` to `href`.
export type StoreSet = {
  device: string;
  label: string;
  platform: "ios" | "android";
  locale: string;
  width: number;
  height: number;
  exports: { order: number; slug: string; file: string; title: string }[];
};

const manifests = import.meta.glob<StoreSet>(
  ["../../bipe-ios/appstore/screenshots/*/*/manifest.json", "../../bipe-android/appstore/screenshots/*/*/manifest.json"],
  { eager: true, import: "default" },
);

/** `dir` is relative to src/; `href` is the folder in dist/. */
export const storeSets: (StoreSet & { dir: string; href: string })[] = Object.entries(manifests)
  .map(([path, set]) => ({ ...set, dir: path.replace(/\/manifest\.json$/, ""), href: `/elenco/loja/${set.device}/${set.locale}/` }))
  .sort((a, b) => a.platform.localeCompare(b.platform) || a.device.localeCompare(b.device) || a.locale.localeCompare(b.locale));
