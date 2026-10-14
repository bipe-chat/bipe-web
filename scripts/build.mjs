// Builds the static site into dist/: client bundle for the islands, server bundle, then one
// prerendered index.html and index.md per route, plus llms.txt, sitemap.xml and robots.txt.
// dist/ is copied over the Caddy site directory by scripts/deploy.sh; pages it does not own
// (.well-known, icone.png) stay in bipe-infra.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "vite";
import { writeIcons } from "./icon.mjs";
import { writeOgCard } from "./og.mjs";
import { checkCodeLinks } from "./check-code-links.mjs";
import { writeBrandAssets } from "./brand.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const ssrOut = join(root, ".ssr");

const marks = JSON.parse(readFileSync(join(root, "src/components/marks.json"), "utf8"));
writeIcons(join(root, "public"), marks.paths[marks.chosen]);

rmSync(dist, { recursive: true, force: true });
await build({
  root, logLevel: "warn",
  build: { outDir: dist, manifest: true, emptyOutDir: true, rollupOptions: { input: join(root, "src/islands.tsx") } },
});
await build({
  root, logLevel: "warn",
  build: { ssr: join(root, "src/entry-server.tsx"), outDir: ssrOut, emptyOutDir: true },
  ssr: { noExternal: true },
});

const manifest = JSON.parse(readFileSync(join(dist, ".vite/manifest.json"), "utf8"));
const entry = manifest["src/islands.tsx"];
const css = (entry.css ?? []).map((f) => `<link rel="stylesheet" href="/${f}">`).join("\n");
const js = `<script type="module" src="/${entry.file}"></script>`;
const fonts = Object.values(manifest).flatMap((m) => m.assets ?? []).filter((f) => /nunito.*latin-wght.*\.woff2$/.test(f) && !/ext/.test(f));
const preload = fonts.map((f) => `<link rel="preload" href="/${f}" as="font" type="font/woff2" crossorigin>`).join("\n");

const ssr = await import(pathToFileURL(join(ssrOut, "entry-server.js")).href);
ssr.selfTest();
const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const site = "https://bipe.chat";
mkdirSync(join(dist, "og"), { recursive: true });
// Logo downloads for /sobre/marca/ (scripts/brand.mjs).
await writeBrandAssets(join(dist, "brand"), marks.paths[marks.chosen], JSON.parse(readFileSync(join(root, "src/components/brand-assets.json"), "utf8")).assets);

// Link-preview image: every route gets its own 1200x630 card (scripts/og.mjs).
// The card shows the title without the " · Bipe" suffix: the wordmark is on the card.
const cardTitle = (title) => title.replace(/^Bipe · /, "").replace(/ · Bipe$/, "");
async function ogImageTags(route) {
  const name = ssr.ogImageName(route);
  await writeOgCard({ outPath: join(dist, "og", `${name}.png`), markPath: marks.paths[marks.chosen], title: route.og?.title ?? cardTitle(route.title), description: route.og?.description ?? route.description, family: ssr.ogFamily(route) });
  return [
    `<meta property="og:image" content="${site}/og/${name}.png">`,
    '<meta property="og:image:type" content="image/png">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    `<meta property="og:image:alt" content="${esc(route.title)}">`,
    '<meta name="twitter:card" content="summary_large_image">',
  ].join("\n");
}

for (const route of ssr.routes) {
  const body = ssr.renderBody(route);
  const htmlLang = route.lang === "pt" ? "pt-BR" : "en";
  const alternates = route.alt
    ? [[route.lang, route.path], [route.lang === "pt" ? "en" : "pt", route.alt]]
        .map(([l, p]) => `<link rel="alternate" hreflang="${l === "pt" ? "pt-BR" : "en"}" href="${site}${p}">`).join("\n")
    : "";
  const html = `<!doctype html>
<html lang="${htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(route.title)}</title>
<meta name="description" content="${esc(route.description)}">
${route.noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${site}${route.path}">`}
${route.noReferrer ? '<meta name="referrer" content="no-referrer">' : ""}
${alternates}
${route.noindex ? "" : `<link rel="alternate" type="text/markdown" href="${route.path}index.md">`}
<meta property="og:title" content="${esc(route.title)}">
<meta property="og:description" content="${esc(route.description)}">
<meta property="og:url" content="${site}${route.path}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Bipe">
<meta property="og:locale" content="${route.lang === "pt" ? "pt_BR" : "en_US"}">
${await ogImageTags(route)}
${ssr.renderJsonLd(route)}
<meta name="theme-color" content="#80307B" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#101317" media="(prefers-color-scheme: dark)">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/brand/app-icon.png">
${preload}
${css}
</head>
<body>
${body}
${js}
</body>
</html>
`;
  const dir = join(dist, route.path);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html.replace(/\n{2,}/g, "\n"));
  if (!route.noindex) writeFileSync(join(dir, "index.md"), ssr.renderMarkdown(route));
}

// Old paths keep working: a static page that sends the browser on (Caddy needs no change).
for (const [from, to] of Object.entries(ssr.redirects)) {
  if (ssr.routes.some((r) => r.path === from)) throw new Error(`redirect ${from} shadows a page`);
  if (!ssr.routes.some((r) => r.path === to)) throw new Error(`redirect ${from} points to missing page ${to}`);
  mkdirSync(join(dist, from), { recursive: true });
  writeFileSync(join(dist, from, "index.html"), `<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><link rel="canonical" href="${site}${to}"><meta http-equiv="refresh" content="0; url=${to}"><a href="${to}">${site}${to}</a>\n`);
}

writeFileSync(join(dist, "llms.txt"), ssr.llmsTxt());
writeFileSync(join(dist, "sitemap.xml"), ssr.sitemap());
writeFileSync(join(dist, "robots.txt"), `User-agent: *\nDisallow: /marca/\nDisallow: /elenco/\nDisallow: /cartoes/\nDisallow: /convite/\nDisallow: /confirmar-email/\nDisallow: /recuperar/\nSitemap: ${site}/sitemap.xml\n`);
rmSync(join(dist, ".vite"), { recursive: true, force: true });
rmSync(ssrOut, { recursive: true, force: true });
checkCodeLinks(dist, JSON.parse(readFileSync(join(root, "../bipe-shared/product/distribution.json"), "utf8")));
console.log(`built ${ssr.routes.length} pages into dist/`);
