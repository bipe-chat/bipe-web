import type { ReactNode } from "react";
import { chrome } from "./copy";
import { compare, product, type Lang } from "./shared";
import { Island } from "./island-registry";
import { paths } from "./paths";
import { ScamsPage, ScamTypePage, scams, scamsJsonLd } from "./pages/ScamsPage";
import { LegalPage, legal, legalTitle } from "./pages/LegalPage";
import { AboutPage, BusinessPage, OgCardsPage, PartnersPage, BrandPage, CastPage, CompareAppPage, ComparePage, AudiencePage, AudiencesPage, DownloadPage, FeaturePage, FeaturesPage, HomePage, TechnologyPage, TentpolePage } from "./pages";

export type Route = {
  path: string;
  lang: Lang;
  /** Same page in the other language. */
  alt: string | null;
  title: string;
  description: string;
  noindex?: boolean;
  /** Never send this URL as a referrer (invite and email links carry a secret). */
  noReferrer?: boolean;
  /** Name of the link-preview PNG under /og/ (scripts/og.mjs). Default: from the path. Every route gets a card. */
  ogCard?: string;
  /** Card text when it differs from the page title and description, and the label in the card's footer. */
  og?: { title?: string; description?: string; family?: string };
  /** The page's own Markdown source. The .md twin is this text as is. */
  markdown?: string;
  /** schema.org objects for the head, built from absolute URLs (entry-server.tsx renderJsonLd). */
  jsonLd?: (abs: (p: string) => string) => object[];
  /** The nav item this page belongs to. */
  section?: "trust" | "features" | "compare" | "download" | "business" | "about";
  body: () => ReactNode;
};

const other = (lang: Lang): Lang => (lang === "pt" ? "en" : "pt");

export const routes: Route[] = (["pt", "en"] as Lang[]).flatMap((lang): Route[] => [
  {
    path: paths.home(lang), alt: paths.home(other(lang)), lang,
    title: `Bipe · ${product.promise[lang].title}`, description: product.promise[lang].lede,
    body: () => <HomePage lang={lang} />,
  },
  ...product.tentpoles.map((tp): Route => ({
    path: paths.tentpole(lang, tp), alt: paths.tentpole(other(lang), tp), lang,
    section: product.sides.find((s) => s.id === "other")!.tentpoles.includes(tp.id) ? "trust" : "features",
    title: `${tp[lang].name} · Bipe`, description: tp[lang].summary,
    body: () => <TentpolePage lang={lang} tp={tp} />,
  })),
  {
    path: paths.features(lang), alt: paths.features(other(lang)), lang, section: "features",
    title: `${chrome[lang].allFeatures} · Bipe`, description: product.promise[lang].lede,
    body: () => <FeaturesPage lang={lang} />,
  },
  ...product.features.map((f): Route => ({
    path: paths.feature(lang, f), alt: paths.feature(other(lang), f), lang, section: "features",
    title: `${f[lang].name} · Bipe`, description: f[lang].body,
    body: () => <FeaturePage lang={lang} f={f} />,
  })),
  {
    path: paths.audiences(lang), alt: paths.audiences(other(lang)), lang,
    title: `${product.audiencesHub[lang].title} · Bipe`, description: product.audiencesHub[lang].lede,
    body: () => <AudiencesPage lang={lang} />,
  },
  ...product.audiences.map((a): Route => ({
    path: paths.audience(lang, a), alt: paths.audience(other(lang), a), lang,
    title: a[lang].title, description: a[lang].lede,
    body: () => <AudiencePage lang={lang} a={a} />,
  })),
  {
    path: paths.download(lang), alt: paths.download(other(lang)), lang, section: "download",
    title: `${chrome[lang].downloadTitle} · Bipe`, description: chrome[lang].downloadLede,
    body: () => <DownloadPage lang={lang} />,
  },
  {
    path: paths.business(lang), alt: paths.business(other(lang)), lang, section: "business",
    title: `${product.business[lang].nav} · Bipe`, description: product.business[lang].lede,
    body: () => <BusinessPage lang={lang} />,
  },
  {
    path: paths.partners(lang), alt: paths.partners(other(lang)), lang, section: "about",
    title: `${product.partners[lang].nav} · Bipe`, description: product.partners[lang].lede,
    og: { title: product.partners[lang].card.title, description: product.partners[lang].card.line, family: product.partners[lang].nav },
    body: () => <PartnersPage lang={lang} />,
  },
  {
    path: paths.technology(lang), alt: paths.technology(other(lang)), lang,
    title: `${product.technical[lang].nav} · Bipe`, description: product.technical[lang].lede,
    body: () => <TechnologyPage lang={lang} />,
  },
  {
    path: paths.compare(lang), alt: paths.compare(other(lang)), lang, section: "compare",
    title: `${compare[lang].title} · Bipe`, description: compare[lang].description,
    body: () => <ComparePage lang={lang} />,
  },
  ...compare.apps.map((app): Route => ({
    path: paths.compareApp(lang, app), alt: paths.compareApp(other(lang), app), lang, section: "compare",
    title: `${app[lang].title} · Bipe`, description: app[lang].lede,
    body: () => <CompareAppPage lang={lang} app={app} />,
  })),
  {
    path: paths.scams(lang), alt: paths.scams(other(lang)), lang, section: "trust",
    title: `${scams[lang].title} · Bipe`, description: scams[lang].lede,
    jsonLd: (abs) => scamsJsonLd(lang, null, abs),
    body: () => <ScamsPage lang={lang} />,
  },
  ...scams.types.map((t): Route => ({
    path: paths.scamType(lang, t), alt: paths.scamType(other(lang), t), lang, section: "trust",
    title: `${t[lang].title} · Bipe`, description: t[lang].lede,
    jsonLd: (abs) => scamsJsonLd(lang, t, abs),
    body: () => <ScamTypePage lang={lang} t={t} />,
  })),
  ...(["privacy", "terms"] as const).map((doc): Route => ({
    path: paths[doc](lang), alt: paths[doc](other(lang)), lang,
    title: `${legalTitle(legal[doc][lang])} · Bipe`, description: legal[doc][lang].split("\n\n")[1],
    markdown: legal[doc][lang],
    body: () => <LegalPage md={legal[doc][lang]} />,
  })),
  {
    path: paths.about(lang), alt: paths.about(other(lang)), lang, section: "about",
    title: `${chrome[lang].about} · Bipe`, description: product.about[lang].lede,
    body: () => <AboutPage lang={lang} />,
  },
]).concat({
  path: "/marca/", alt: null, lang: "pt", noindex: true,
  title: "Marca (rascunho) · Bipe", description: "Rascunhos do símbolo do Bipe.",
  body: () => <BrandPage />,
}, {
  path: "/cartoes/", alt: null, lang: "pt", noindex: true,
  title: "Cartões de link (interno) · Bipe", description: "A imagem que aparece quando alguém compartilha cada página.",
  body: () => <OgCardsPage cards={routes.map((r) => ({ path: r.path, title: r.title, image: `/og/${ogImageName(r)}.png` }))} />,
}, {
  path: "/elenco/", alt: null, lang: "pt", noindex: true,
  title: "Elenco e cenas (interno) · Bipe", description: "Pessoas de exemplo e cenas das simulações do site.",
  body: () => <CastPage />,
}, {
  // Target of the Caddy rewrite for /@handle.
  path: "/perfil/", alt: null, lang: "pt", noindex: true,
  title: "Bipe", description: chrome.pt.profile.lead,
  body: () => <Island name="ProfileLanding" props={{}} />,
}, {
  // Target of the Caddy rewrite for /convite/<code>.
  path: "/convite/", alt: null, lang: "pt", noindex: true, noReferrer: true, ogCard: "convite",
  title: "Convite para o Bipe", description: chrome.pt.invite.lead,
  body: () => <Island name="InviteLanding" props={{}} />,
}, {
  // Email links from the API (ADR 0057). The token is in the fragment, so no Caddy rewrite.
  path: "/confirmar-email/", alt: null, lang: "pt", noindex: true, noReferrer: true,
  title: `${chrome.pt.confirmEmail.title} · Bipe`, description: chrome.pt.confirmEmail.lead,
  body: () => <Island name="ConfirmEmailLanding" props={{}} />,
}, {
  // The app opens this link (universal link); the page only explains. Recovery never runs in the browser.
  path: "/recuperar/", alt: null, lang: "pt", noindex: true, noReferrer: true,
  title: `${chrome.pt.recover.title} · Bipe`, description: chrome.pt.recover.lead,
  body: () => <Island name="RecoverLanding" props={{}} />,
}, {
  // Staff only (ADR 0056 in bipe/docs/adr). The HTML holds no data; the island signs in and asks the API.
  path: "/admin/convites/", alt: null, lang: "pt", noindex: true, noReferrer: true,
  title: "Quem mais convida (equipe) · Bipe", description: "Relatório interno de convites.",
  body: () => <Island name="InviterReport" props={{}} />,
});

/** Where a route's link-preview card is served: `/og/home.png` for `/`, else `/og/<path with dashes>.png`. */
export function ogImageName(route: Route): string {
  return route.ogCard ?? (route.path.replace(/^\/|\/$/g, "").replace(/\//g, "-") || "home");
}
