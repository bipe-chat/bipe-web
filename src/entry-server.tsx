// Server entry for scripts/build.mjs: renders every route to static HTML and its Markdown twin.
import { renderToString } from "react-dom/server";
import { Layout } from "./Layout";
import { paths } from "./paths";
import { routes, type Route } from "./routes";
import { chrome } from "./copy";
import { distribution, product, publicRepos, type Lang } from "./shared";

export { routes };
export const redirects = Object.fromEntries(Object.entries(product.redirects).filter(([k]) => k.startsWith("/")));

import inviteCodes from "@shared/test-vectors/invite-codes.json";
import { extractInviteCode } from "./sim/LinkPages";

/** Fails the build when the invite page disagrees with the shared invite-code vectors. */
export function selfTest(): void {
  for (const v of inviteCodes.vectors as { input: string; code: string | null }[]) {
    const got = extractInviteCode(v.input);
    if (got !== v.code) throw new Error(`invite-codes vector failed: ${JSON.stringify(v.input)} gave ${got}, want ${v.code}`);
  }
}

export function renderBody(route: Route): string {
  return renderToString(<Layout route={route} />);
}

const site = "https://proseio.com.br";
const abs = (p: string) => site + p;

/** Plain-Markdown twin of a page, for people and agents that read text. */
export function renderMarkdown(route: Route): string {
  const lang = route.lang;
  const c = chrome[lang];
  const out: string[] = [`# ${route.title}`, "", route.description, ""];
  const tp = product.tentpoles.find((t) => paths.tentpole(lang, t) === route.path);
  if (route.path === paths.home(lang) || route.path === paths.features(lang)) {
    // Same grouping as the pages: the two sides of ADR 0047, then what sits outside them.
    const tpLine = (t: (typeof product.tentpoles)[number]) => `- [${t[lang].title}](${abs(paths.tentpole(lang, t))}) (${c.status[t.status]}): ${t[lang].summary}`;
    const fLine = (f: (typeof product.features)[number]) => `- ${f[lang].name} (iPhone: ${c.status[f.status.ios]}; Android: ${c.status[f.status.android]}): ${f[lang].body}`;
    for (const side of product.sides) {
      out.push(`## ${side[lang].name}`, "", side[lang].line, "");
      for (const id of side.tentpoles) out.push(tpLine(product.tentpoles.find((t) => t.id === id)!));
      out.push("");
      for (const f of product.features.filter((x) => side.areas.includes(x.area))) out.push(fLine(f));
      out.push("");
    }
    const sidedAreas = product.sides.flatMap((s) => s.areas);
    out.push(`## ${c.tentpolesTitle}`, "");
    for (const t of product.tentpoles.filter((x) => !product.sides.some((s) => s.tentpoles.includes(x.id)))) out.push(tpLine(t));
    out.push("");
    for (const f of product.features.filter((x) => !sidedAreas.includes(x.area))) out.push(fLine(f));
  } else if (tp) {
    out.push(...tp[lang].points.map((p) => `- ${p}`), "");
    for (const id of tp.features) {
      const f = product.features.find((x) => x.id === id);
      if (f) out.push(`- ${f[lang].name} (${c.status[f.status.ios]}): ${f[lang].body}`);
    }
  } else if (route.path === paths.business(lang)) {
    out.push(`(${product.business[lang].label})`, "");
    for (const sec of product.business[lang].sections) out.push(`## ${sec.heading}`, "", ...sec.points.map((p) => `- ${p}`), "");
    out.push(`${product.business[lang].cta} ${distribution.contact}`, "");
  } else if (route.path === paths.about(lang)) {
    for (const s of product.about[lang].sections) out.push(`## ${s.heading}`, "", s.body, "");
  }
  out.push("", `## ${c.download}`, "");
  if (distribution.ios.url) out.push(`- ${distribution.ios[lang].label}: ${distribution.ios.url} (${distribution.ios[lang].note})`);
  out.push(`- ${distribution.android[lang].label}: ${distribution.android[lang].note} ${distribution.contact}`);
  out.push("", `${c.steward} ${distribution.steward.name}: ${distribution.steward.url}`);
  if (publicRepos.length > 0) out.push("", `## ${c.sourceTitle}`, "", ...publicRepos.map((r) => `- ${r[lang]}: ${r.url}`));
  return out.join("\n") + "\n";
}

export function llmsTxt(): string {
  const lines = ["# Proseio", "", `> ${product.promise.en.lede}`, "", `${chrome.en.steward} ${distribution.steward.name}: ${distribution.steward.url}`, ""];
  for (const lang of ["pt", "en"] as Lang[]) {
    lines.push(`## ${lang === "pt" ? "Português" : "English"}`, "");
    for (const r of routes.filter((x) => x.lang === lang && !x.noindex)) lines.push(`- [${r.title}](${abs(r.path)}index.md): ${r.description}`);
    lines.push("");
  }
  return lines.join("\n");
}

export function sitemap(): string {
  const urls = routes.filter((r) => !r.noindex).map((r) => `  <url><loc>${abs(r.path)}</loc></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}
