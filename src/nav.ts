// Site navigation: one entry per destination. The header, the footer, the current-page mark and
// the share-card footer label (entry-server.tsx ogFamily) all read from here.
import { chrome } from "./copy";
import { paths } from "./paths";
import type { Route } from "./routes";
import { accessibilityRegister, compare, dataRegister, distribution, privacyRegister, product, publicRepos, type Lang } from "./shared";

/** Tentpoles of the identity side. Their pages belong to the "trust" section. */
export const identityTentpoles: readonly string[] = product.sides.find((s) => s.id === "other")!.tentpoles;

/** The nav leads with the identity side (ADR 0047): its first tentpole page. */
const trust = product.tentpoles.find((tp) => tp.id === identityTentpoles[0])!;

type Link = { href: string; label: string };

/** Every internal destination the header or the footer links to. */
export function links(lang: Lang) {
  const c = chrome[lang];
  return {
    trust: { href: paths.tentpole(lang, trust), label: trust[lang].name },
    scams: { href: paths.scams(lang), label: c.scams },
    features: { href: paths.features(lang), label: c.features },
    compare: { href: paths.compare(lang), label: compare[lang].nav },
    technology: { href: paths.technology(lang), label: product.technical[lang].nav },
    docs: { href: paths.docs(lang), label: c.docs },
    llms: { href: "/llms.txt", label: c.llms },
    download: { href: paths.download(lang), label: c.download },
    audiences: { href: paths.audiences(lang), label: product.audiencesHub[lang].nav },
    business: { href: paths.business(lang), label: product.business[lang].nav },
    pricing: { href: paths.pricing(lang), label: product.pricing[lang].nav },
    about: { href: paths.about(lang), label: c.about },
    brand: { href: paths.brand(lang), label: c.brand.link },
    organisations: { href: paths.organisations(lang), label: product.organisations[lang].nav },
    contact: { href: paths.help(lang), label: c.help.title },
    whoCanRead: { href: paths.whoCanRead(lang), label: privacyRegister[lang].nav },
    privacy: { href: paths.privacy(lang), label: c.privacy },
    lgpd: { href: paths.lgpd(lang), label: dataRegister[lang].nav },
    terms: { href: paths.terms(lang), label: c.terms },
    accessibility: { href: paths.accessibility(lang), label: accessibilityRegister[lang].nav },
    source: { href: distribution.source.org, label: c.source },
  } satisfies Record<string, Link>;
}

export type LinkId = keyof ReturnType<typeof links>;

/** Header links in order, then the call-to-action button. On a phone the button sits beside the wordmark. */
export const header = ["trust", "features", "about"] as const satisfies readonly LinkId[];
export const headerCta = "download" satisfies LinkId;

/**
 * Footer: one group per question a reader has at the bottom of a page. Every top-level page is in it
 * (entry-server.tsx selfTest fails the build otherwise); subpages live on their hub, never here.
 * "tentpoles" expands to every tentpole page in product.json order.
 */
export const footer = [
  { group: "product", links: ["tentpoles", "features", "download"] }, // What does it do, and how do I get it?
  { group: "for", links: ["audiences", "business", "pricing"] }, // Is it for me?
  { group: "learn", links: ["scams", "technology", "docs", "llms", "compare", "source"] }, // How does it work, can I check it?
  { group: "bipe", links: ["about", "brand", "organisations", "accessibility", "contact"] }, // Who is behind it?
  { group: "legal", links: ["whoCanRead", "privacy", "lgpd", "terms"] }, // What happens to my data?
] as const satisfies readonly { group: keyof (typeof chrome)["pt"]["footerGroups"]; links: readonly (LinkId | "tentpoles")[] }[];

/** The footer groups with their headings and links, ready to render. The source link shows only when a repo is public. */
export function footerGroups(lang: Lang): { heading: string; links: Link[] }[] {
  const l = links(lang);
  return footer.map((g) => ({
    heading: chrome[lang].footerGroups[g.group],
    links: g.links.flatMap((id): Link[] => {
      if (id === "tentpoles") return product.tentpoles.map((tp) => ({ href: paths.tentpole(lang, tp), label: tp[lang].name }));
      if (id === "source" && publicRepos.length === 0) return [];
      return [l[id]];
    }),
  }));
}

/** The nav item a page belongs to. A section is a link id, so its label is the link's label. */
export type Section = Extract<LinkId, "trust" | "features" | "compare" | "download" | "business" | "about">;

/**
 * Breadcrumb trail of a subpage: the hub pages whose path contains it, then the page itself.
 * Empty on a top-level page. Layout.tsx renders it; entry-server.tsx renderJsonLd sends it as a BreadcrumbList.
 */
export function breadcrumbs(route: Route): Link[] {
  const above = Object.values(links(route.lang))
    .filter((l) => l.href !== paths.home(route.lang) && l.href !== route.path && route.path.startsWith(l.href))
    .sort((a, b) => a.href.length - b.href.length);
  if (above.length === 0) return [];
  return [...above, { href: route.path, label: route.crumb ?? route.title.replace(/ · Bipe$/, "") }];
}
