// Site navigation: one entry per destination. The header, the footer, the current-page mark and
// the share-card footer label (entry-server.tsx ogFamily) all read from here.
import { chrome } from "./copy";
import { paths } from "./paths";
import { compare, dataRegister, product, type Lang } from "./shared";

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
    download: { href: paths.download(lang), label: c.download },
    audiences: { href: paths.audiences(lang), label: product.audiencesHub[lang].nav },
    business: { href: paths.business(lang), label: product.business[lang].nav },
    about: { href: paths.about(lang), label: c.about },
    partners: { href: paths.partners(lang), label: product.partners[lang].nav },
    contact: { href: `${paths.partners(lang)}#form`, label: c.contact },
    privacy: { href: paths.privacy(lang), label: c.privacy },
    lgpd: { href: paths.lgpd(lang), label: dataRegister[lang].nav },
    terms: { href: paths.terms(lang), label: c.terms },
  } satisfies Record<string, Link>;
}

export type LinkId = keyof ReturnType<typeof links>;

/** Header items in order. The last one renders as the call-to-action button. */
export const header = ["trust", "features", "compare", "about", "download"] as const satisfies readonly LinkId[];

/** Footer: three groups by what the reader looks for. Single audiences live on the hub, never here. */
export const footer = [
  { group: "product", links: ["trust", "scams", "features", "compare", "technology", "docs", "download"] },
  { group: "for", links: ["audiences", "business"] },
  { group: "bipe", links: ["about", "partners", "contact", "privacy", "lgpd", "terms"] },
] as const satisfies readonly { group: keyof (typeof chrome)["pt"]["footerGroups"]; links: readonly LinkId[] }[];

/** The nav item a page belongs to. A section is a link id, so its label is the link's label. */
export type Section = Extract<LinkId, "trust" | "features" | "compare" | "download" | "business" | "about">;
