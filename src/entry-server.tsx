// Server entry for scripts/build.mjs: renders every route to static HTML and its Markdown twin.
import { renderToString } from "react-dom/server";
import { Layout } from "./Layout";
import { paths } from "./paths";
import { ogImageName, routes, type Route } from "./routes";
import { chrome } from "./copy";
import { breadcrumbs, footerGroups } from "./nav";
import { codeLinks, compare, distribution, product, publicRepos, type Lang } from "./shared";
import { bipeOn, tierPrice } from "./pages";

export { routes, ogImageName };
export { analyticsTags } from "./analytics";
export { storeSets } from "./store";
export const redirects = Object.fromEntries(Object.entries(product.redirects).filter(([k]) => k.startsWith("/")));

/** The share card illustration: the Brazil network (scripts/lib/brazil-network.mjs) on the privacy pages. */
export function ogIllustration(route: Route): "brazil" | undefined {
  const brazil = (["pt", "en"] as Lang[]).flatMap((l) => [paths.privacy(l), paths.lgpd(l), paths.whoCanRead(l)]);
  return brazil.includes(route.path) ? "brazil" : undefined;
}

import inviteCodes from "@shared/test-vectors/invite-codes.json";
import { extractInviteCode } from "./sim/LinkPages";
import { scams, scamsMarkdown, scamTypeMarkdown } from "./pages/ScamsPage";
import { isFigureId } from "./sim/scenes";

/** Fails the build when the invite page disagrees with the shared invite-code vectors. */
export function selfTest(): void {
  // Two indexed pages in one language never share a title or a description: search engines would treat them as one.
  const dupes: string[] = [];
  for (const key of ["title", "description"] as const) {
    const seen = new Map<string, string>();
    for (const r of routes.filter((x) => !x.noindex)) {
      const other = seen.get(`${r.lang} ${r[key]}`);
      if (other) dupes.push(`${key} of ${r.path} is the same as ${other}: ${r[key]}`);
      else seen.set(`${r.lang} ${r[key]}`, r.path);
    }
  }
  if (dupes.length) throw new Error(`duplicate titles or descriptions:\n${dupes.join("\n")}`);
  // Every indexed top-level page (one path segment under / or /en/) is in the footer of its language (src/nav.ts).
  for (const r of routes) {
    if (r.noindex || r.path === paths.home(r.lang) || !/^\/(en\/)?[^/]+\/$/.test(r.path)) continue;
    if (!footerGroups(r.lang).some((g) => g.links.some((l) => l.href === r.path))) throw new Error(`footer: top-level page ${r.path} is missing (src/nav.ts footer)`);
  }
  // Home highlights describe features already available in an iPhone tester build.
  for (const id of product.home.features) {
    const f = product.features.find((feature) => feature.id === id);
    if (!f || !["testing", "policy"].includes(f.status.ios)) throw new Error(`home: ${id} is not available in the test app`);
  }
  for (const v of inviteCodes.vectors as { input: string; code: string | null }[]) {
    const got = extractInviteCode(v.input);
    if (got !== v.code) throw new Error(`invite-codes vector failed: ${JSON.stringify(v.input)} gave ${got}, want ${v.code}`);
  }
  // Figure ids in product.json are typed only by a cast: check them against the scenes and sims (bipe#176).
  const figures: [string, string][] = [
    ...product.tentpoles.flatMap((tp) => tp.demos.map((id): [string, string] => [`tentpole ${tp.id}`, id])),
    ...product.features.flatMap((f) => (f.figures ?? []).map((id): [string, string] => [`feature ${f.id}`, id])),
    ...product.audiences.flatMap((a) => a.sections.flatMap((s) => (s.scene ? [[`audience ${a.id}`, s.scene] as [string, string]] : []))),
  ];
  for (const [where, id] of figures) if (!isFigureId(id)) throw new Error(`${where}: unknown figure ${id}`);
}

export function renderBody(route: Route): string {
  return renderToString(<Layout route={route} />);
}

const site = "https://bipe.chat";
const abs = (p: string) => site + p;

/** Plain-Markdown twin of a page, for people and agents that read text. */
export function renderMarkdown(route: Route): string {
  if (route.markdown) return route.markdown;
  const lang = route.lang;
  const c = chrome[lang];
  const out: string[] = [`# ${route.title}`, "", route.description, ""];
  const tp = product.tentpoles.find((t) => paths.tentpole(lang, t) === route.path);
  const cmpApp = compare.apps.find((a) => paths.compareApp(lang, a) === route.path);
  const feature = product.features.find((f) => paths.feature(lang, f) === route.path);
  const audience = product.audiences.find((a) => paths.audience(lang, a) === route.path);
  if (route.path === paths.home(lang)) {
    out.push(`## ${c.home.featuresTitle}`, "");
    for (const id of product.home.features) {
      const f = product.features.find((f) => f.id === id)!;
      out.push(`- [${f[lang].name}](${abs(paths.feature(lang, f))}): ${f[lang].body}`);
    }
    out.push("", `## ${product.origin[lang].title}`, "", product.origin[lang].body, "", `[${c.about}](${abs(paths.about(lang))})`, "");
    out.push(`## ${c.home.joinTitle}`, "", c.waitlist.heroLead, "", `[${c.waitlist.submit}](${abs(paths.home(lang))}#convite)`, "", `[${c.home.hasInvite}](${abs(paths.download(lang))})`, "");
  } else if (route.path === paths.download(lang)) {
    out.push(`## ${c.onboarding.title}`, "", c.onboarding.lead, "", ...c.onboarding.steps.map((step, i) => `${i + 1}. ${step}`), "", c.onboarding.codeNote, "");
    out.push(`[${c.waitlist.submit}](${abs(paths.download(lang))}#convite)`, "", `[${c.home.help}](${abs(paths.help(lang))})`, "");
  } else if (route.path === paths.help(lang)) {
    const h = c.help;
    const account = product.features.find((f) => f.id === "new-phone")!;
    return [...out, `${h.lede} ${abs(paths.help(lang))}`, "", h.message, "", h.safety, "", `## ${h.linksTitle}`, "", `- [${h.download}](${abs(paths.download(lang))})`, `- [${h.account}](${abs(paths.feature(lang, account))})`, `- [${h.data}](${abs(paths.lgpd(lang))})`, `- [${h.organisations}](${abs(paths.organisations(lang))})`, ""].join("\n");
  } else if (route.path === paths.features(lang)) {
    // Same grouping as the pages: the two sides of ADR 0047, then what sits outside them.
    const tpLine = (t: (typeof product.tentpoles)[number]) => `- [${t[lang].title}](${abs(paths.tentpole(lang, t))}) (${c.status[t.status]}): ${t[lang].summary}`;
    const fLine = (f: (typeof product.features)[number]) => `- [${f[lang].name}](${abs(paths.feature(lang, f))}) (iPhone: ${c.status[f.status.ios]}; Android: ${c.status[f.status.android]}): ${f[lang].body}`;
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
      if (f) out.push(`- [${f[lang].name}](${abs(paths.feature(lang, f))}) (${c.status[f.status.ios]}): ${f[lang].body}`);
    }
  } else if (route.path === paths.audiences(lang)) {
    for (const a of product.audiences) out.push(`- [${a[lang].title}](${abs(paths.audience(lang, a))}): ${a[lang].headline}`);
    out.push(`- [${product.business[lang].nav}](${abs(paths.business(lang))}): ${product.business[lang].title}`, "");
  } else if (audience) {
    const copy = audience[lang];
    out.push(`**${copy.headline}**`, "", `(${copy.note})`, "");
    audience.sections.forEach((s, i) => {
      out.push(`## ${copy.sections[i].heading}`, "", copy.sections[i].body, "");
      for (const f of s.features.map((id) => product.features.find((x) => x.id === id)!)) {
        out.push(`- [${f[lang].name}](${abs(paths.feature(lang, f))}) (iPhone: ${c.status[f.status.ios]}; Android: ${c.status[f.status.android]}): ${f[lang].body}`);
      }
      out.push("");
    });
    out.push(`${copy.cta} ${abs(paths.help(lang))}`, "");
  } else if (feature) {
    out.push(`iPhone: ${c.status[feature.status.ios]}; Android: ${c.status[feature.status.android]}`, "", `## ${c.howItWorks}`, "", ...feature[lang].points.map((p) => `- ${p}`), "");
    for (const t of product.tentpoles.filter((x) => x.features.includes(feature.id))) out.push(`${c.partOf} [${t[lang].name}](${abs(paths.tentpole(lang, t))})`, "");
  } else if (route.path === paths.business(lang)) {
    out.push(`(${product.business[lang].label})`, "");
    for (const sec of product.business[lang].sections) out.push(`## ${sec.heading}`, "", ...sec.points.map((p) => `- ${p}`), "");
    out.push(`${product.business[lang].cta} ${abs(paths.organisations(lang))}#form`, "");
  } else if (route.path === paths.pricing(lang)) {
    const p = product.pricing[lang];
    for (const sec of [p.principles, p.why]) out.push(`## ${sec.heading}`, "", ...sec.points.map((x) => `- ${x}`), "");
    out.push(`## ${p.tiersHeading}`, "");
    for (const tier of product.pricing.tiers) {
      const t = p.tiers[tier.id];
      out.push(`### ${t.name}`, "", t.who, "", `**${tierPrice(lang, tier)}**. ${t.billing}`, "", ...t.points.map((x) => `- ${x}`), "");
      out.push(tier.cta === "app" ? `${p.ctaApp}: ${abs(paths.download(lang))}` : `${p.ctaForm}: ${abs(paths.organisations(lang))}#form`, "");
    }
    out.push(p.nonprofit, "", `## ${p.tools.heading}`, "", p.tools.body, "");
    for (const f of product.pricing.tools.map((id) => product.features.find((x) => x.id === id)!)) out.push(`- [${f[lang].name}](${abs(paths.feature(lang, f))}) (${c.status[f.status.ios]})`);
    out.push("", `## ${p.pilot.heading}`, "", ...p.pilot.points.map((x) => `- ${x}`), "");
    out.push(`${product.business[lang].cta} ${abs(paths.organisations(lang))}#form`, "");
  } else if (route.path === paths.technology(lang)) {
    for (const g of product.technical.groups) {
      out.push(`## ${g[lang].heading}`, "", g[lang].line, "");
      for (const p of g.parts) {
        const repo = publicRepos.find((r) => r.id === p.repo);
        const refs = [...(p.upstream ?? []).map((u) => `${c.tech.basedOn} [${u.name}](${u.url})`), ...(repo ? [`[${c.tech.code}](${repo.url})`] : [])];
        out.push(`- **${p[lang].name}**: ${p[lang].body}${refs.length ? ` (${refs.join("; ")})` : ""}`);
      }
      out.push("");
    }
  } else if (cmpApp || route.path === paths.compare(lang)) {
    const apps = cmpApp ? [cmpApp] : compare.apps;
    if (!cmpApp) {
      const cc = compare[lang];
      out.push(`## ${cc.tableTitle}`, "", `| ${cc.threatCol} | Bipe | ${apps.map((a) => a.name).join(" | ")} |`, `|---|---|${apps.map(() => "---|").join("")}`);
      for (const t of compare.threats) {
        out.push(`| ${t[lang].threat} | ${bipeOn(t) ? cc.levels.on : c.status.planned} | ${apps.map((a) => (a.cells[t.id] ? cc.levels[a.cells[t.id].level] : "")).join(" | ")} |`);
      }
      out.push("");
      out.push(`## ${compare[lang].appsTitle}`, "", ...apps.map((a) => `- [${a.name}](${abs(paths.compareApp(lang, a))}): ${a[lang].line}`), "");
    }
    for (const t of compare.threats.filter((x) => !cmpApp || cmpApp.cells[x.id])) {
      out.push(`## ${t[lang].threat}`, "");
      for (const a of apps.filter((x) => x.cells[t.id])) out.push(`- **${a[lang].on}**: ${a.cells[t.id][lang]}`);
      out.push(`- **${compare[lang].bipe}**: ${t[lang].bipe}`);
      const soon = t.features.map((id) => product.features.find((x) => x.id === id)!).filter((f) => f.status.ios === "planned");
      if (soon.length) out.push(`  - ${c.status.planned}: ${soon.map((f) => f[lang].name).join(", ")}`);
      out.push("");
    }
    if (cmpApp?.[lang].ahead.length) out.push(`## ${compare[lang].aheadTitle.replace("{app}", cmpApp.name)}`, "", ...cmpApp[lang].ahead.map((x) => `- ${x}`), "");
    out.push(`## ${compare[lang].limitTitle}`, "", compare[lang].limit, "");
    const sources = [...new Map(apps.flatMap((a) => a.sources).map((x) => [x.url, x])).values()];
    out.push(`## ${compare[lang].sourcesTitle}`, "", compare[lang].sourcesNote, "", ...sources.map((x) => `- [${x.name}](${x.url})`), "");
  } else if (route.path === paths.scams(lang)) {
    out.push(...scamsMarkdown(lang, abs));
  } else if (scams.types.some((t) => route.path === paths.scamType(lang, t))) {
    out.push(...scamTypeMarkdown(lang, scams.types.find((t) => route.path === paths.scamType(lang, t))!, abs));
  } else if (route.path === paths.about(lang)) {
    for (const s of product.about[lang].sections) out.push(`## ${s.heading}`, "", s.body, "");
    out.push(`[${product.organisations[lang].aboutLink}](${abs(paths.organisations(lang))})`, "");
  } else if (route.path === paths.organisations(lang)) {
    const o = product.organisations[lang];
    out.push(`## ${o.why.heading}`, "", ...o.why.points.map((p) => `- ${p}`), "");
    for (const sec of [o.ask, o.steward]) out.push(`## ${sec.heading}`, "", sec.body, "");
    out.push(`## ${o.small.heading}`, "", `${o.small.body} ${abs(paths.download(lang))}`, "");
    out.push(`${o.cta} ${abs(paths.organisations(lang))}#form`, "");
  }
  out.push("", `## ${c.download}`, "");
  if (distribution.ios.url) out.push(`- ${distribution.ios[lang].label}: ${distribution.ios.url} (${distribution.ios[lang].note})`);
  if (distribution.android.status === "available" && distribution.android.url) out.push(`- ${distribution.android[lang].label}: ${distribution.android.url} (${distribution.android[lang].note})`);
  else out.push(`- ${distribution.android[lang].label}: ${distribution.android[lang].note} ${abs(paths.organisations(lang))}#form`);
  out.push("", `${c.steward} ${distribution.steward.name}: ${distribution.steward.url}`);
  if (publicRepos.length > 0 && route.path === paths.download(lang)) out.push("", `## ${c.sourceTitle}`, "", ...publicRepos.map((r) => `- ${r[lang]}: ${r.url}`));
  return out.join("\n") + "\n";
}

/** <script type="application/ld+json"> tags for the head. "<" is escaped so the JSON cannot close the tag. */
export function renderJsonLd(route: Route): string {
  const trail = breadcrumbs(route);
  const crumbs = trail.length === 0 ? [] : [{
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [{ href: paths.home(route.lang), label: "Bipe" }, ...trail].map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.label, item: abs(t.href) })),
  }];
  return [...(route.jsonLd?.(abs) ?? []), ...crumbs].map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`).join("\n");
}

export function llmsTxt(): string {
  const lines = ["# Bipe", "", `> ${product.promise.en.lede}`, "", `${chrome.en.steward} ${distribution.steward.name}: ${distribution.steward.url}`, ""];
  // Docs first: how Bipe works (domains, architecture, links), for agents.
  const isDoc = (r: Route) => r.path.startsWith(paths.docs(r.lang));
  lines.push("## Docs", "");
  for (const r of routes.filter((x) => isDoc(x) && !x.noindex)) lines.push(`- [${r.title}](${abs(r.path)}index.md): ${r.description}`);
  lines.push("");
  // The code (ADR 0028): repos, then deep links to the files behind each feature. Only public repos.
  if (publicRepos.length > 0) {
    lines.push(`## ${chrome.en.sourceTitle}`, "", `${chrome.en.sourceNote} ${distribution.source.org}`, "");
    for (const r of publicRepos) lines.push(`- [${r.url.split("/").pop()}](${r.url}): ${r.en}`);
    const files = codeLinks(distribution.source.code?.map((x) => x.id));
    if (files.length > 0) lines.push("", "### Code map", "", ...files.map((f) => `- [${f.en}](${f.url})`));
    lines.push("");
  }
  for (const lang of ["pt", "en"] as Lang[]) {
    lines.push(`## ${lang === "pt" ? "Português" : "English"}`, "");
    for (const r of routes.filter((x) => x.lang === lang && !x.noindex && !isDoc(x))) lines.push(`- [${r.title}](${abs(r.path)}index.md): ${r.description}`);
    lines.push("");
  }
  return lines.join("\n");
}

export function sitemap(): string {
  const urls = routes.filter((r) => !r.noindex).map((r) => `  <url><loc>${abs(r.path)}</loc></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}
