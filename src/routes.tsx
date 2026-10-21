import { STAFF_CONSOLE, staffPath } from "./admin/staff-pages";
import type { ReactNode } from "react";
import { chrome } from "./copy";
import { compare, dataRegister, distribution, privacyRegister, product, publicRepos, type Lang } from "./shared";
import { Island } from "./island-registry";
import { identityTentpoles, type Section } from "./nav";
import { paths } from "./paths";
import { ScamsPage, ScamTypePage, scams, scamsJsonLd } from "./pages/ScamsPage";
import { LegalPage, legal, legalTitle, lgpdMarkdown } from "./pages/LegalPage";
import { DocsPage, docs, docLede, docTitle } from "./pages/DocsPage";
import { WhoCanReadPage, whoCanReadMarkdown } from "./pages/PrivacyPage";
import { AboutPage, HelpPage, BrandKitPage, BusinessPage, PricingPage, OrganisationsPage, CastPage, CompareAppPage, ComparePage, AudiencePage, AudiencesPage, DownloadPage, FeaturePage, FeaturesPage, HomePage, TechnologyPage, TentpolePage } from "./pages";

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
  /** Load no Umami tracker on this page (ADR 0098): email tokens and staff pages. */
  noAnalytics?: boolean;
  /** Name of the link-preview JPEG under /og/ (scripts/og.mjs). Default: from the path. Every route gets a card. */
  ogCard?: string;
  /** Card text when it differs from the page title and description. */
  og?: { title?: string; description?: string };
  /** The page's own Markdown source. The .md twin is this text as is. */
  markdown?: string;
  /** schema.org objects for the head, built from absolute URLs (entry-server.tsx renderJsonLd). */
  jsonLd?: (abs: (p: string) => string) => object[];
  /** This page's name in the breadcrumb trail (src/nav.ts breadcrumbs). Default: the title without " · Bipe". */
  crumb?: string;
  /** A staff page: the staff header, no site nav, no footer (src/admin/staff-ui.tsx draws the staff nav). */
  staff?: boolean;
  /** The nav item this page belongs to. */
  section?: Section;
  body: () => ReactNode;
};

const other = (lang: Lang): Lang => (lang === "pt" ? "en" : "pt");

export const routes: Route[] = (["pt", "en"] as Lang[]).flatMap((lang): Route[] => [
  {
    path: paths.home(lang), alt: paths.home(other(lang)), lang,
    title: `Bipe · ${product.promise[lang].title}`, description: product.promise[lang].lede,
    jsonLd: (abs) => homeJsonLd(lang, abs),
    body: () => <HomePage lang={lang} />,
  },
  ...product.tentpoles.map((tp): Route => ({
    path: paths.tentpole(lang, tp), alt: paths.tentpole(other(lang), tp), lang,
    section: identityTentpoles.includes(tp.id) ? "trust" : "features",
    title: `${tp[lang].name} · Bipe`, description: tp[lang].summary,
    body: () => <TentpolePage lang={lang} tp={tp} />,
  })),
  {
    path: paths.features(lang), alt: paths.features(other(lang)), lang, section: "features",
    title: `${chrome[lang].allFeatures} · Bipe`, description: product.featuresHub[lang].lede,
    body: () => <FeaturesPage lang={lang} />,
  },
  ...product.features.map((f): Route => ({
    path: paths.feature(lang, f), alt: paths.feature(other(lang), f), lang, section: "features",
    // The hub name in the title keeps a feature apart from a tentpole of the same name (Sem anúncio).
    title: `${f[lang].name} · ${chrome[lang].features} · Bipe`, description: f[lang].body,
    crumb: f[lang].name, og: { title: f[lang].name },
    body: () => <FeaturePage lang={lang} f={f} />,
  })),
  {
    path: paths.audiences(lang), alt: paths.audiences(other(lang)), lang,
    title: `${product.audiencesHub[lang].title} · Bipe`, description: product.audiencesHub[lang].lede,
    body: () => <AudiencesPage lang={lang} />,
  },
  ...product.audiences.map((a): Route => ({
    path: paths.audience(lang, a), alt: paths.audience(other(lang), a), lang,
    title: a[lang].title, description: a[lang].lede, crumb: a[lang].name,
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
    path: paths.pricing(lang), alt: paths.pricing(other(lang)), lang, section: "business",
    title: `${product.pricing[lang].nav} · Bipe`, description: product.pricing[lang].lede,
    body: () => <PricingPage lang={lang} />,
  },
  {
    path: paths.organisations(lang), alt: paths.organisations(other(lang)), lang, section: "about",
    title: `${product.organisations[lang].nav} · Bipe`, description: product.organisations[lang].lede,
    og: { title: product.organisations[lang].card.title, description: product.organisations[lang].card.line },
    body: () => <OrganisationsPage lang={lang} />,
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
    path: paths.compareApp(lang, app), alt: paths.compareApp(other(lang), app), lang, section: "compare", crumb: app.name,
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
    path: paths.scamType(lang, t), alt: paths.scamType(other(lang), t), lang, section: "trust", crumb: t[lang].heading,
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
    path: paths.whoCanRead(lang), alt: paths.whoCanRead(other(lang)), lang,
    title: `${privacyRegister[lang].title} · Bipe`, description: privacyRegister[lang].lede,
    markdown: whoCanReadMarkdown(lang),
    body: () => <WhoCanReadPage lang={lang} />,
  },
  {
    path: paths.lgpd(lang), alt: paths.lgpd(other(lang)), lang,
    title: `${dataRegister[lang].title} · Bipe`, description: dataRegister[lang].lede,
    markdown: lgpdMarkdown(lang),
    body: () => <LegalPage md={lgpdMarkdown(lang)} />,
  },
  ...docs.map((d): Route => ({
    path: paths.docs(lang, d.slug[lang]), alt: paths.docs(other(lang), d.slug[other(lang)]), lang,
    title: `${docTitle(d.md[lang])} · Bipe`, description: docLede(d.md[lang]),
    markdown: d.md[lang],
    body: () => <DocsPage lang={lang} doc={d} />,
  })),
  {
    path: paths.help(lang), alt: paths.help(other(lang)), lang,
    title: `${chrome[lang].help.title} · Bipe`, description: chrome[lang].help.lede,
    body: () => <HelpPage lang={lang} />,
  },
  {
    path: paths.about(lang), alt: paths.about(other(lang)), lang, section: "about",
    title: `${chrome[lang].about} · Bipe`, description: product.about[lang].lede,
    body: () => <AboutPage lang={lang} />,
  },
  {
    path: paths.brand(lang), alt: paths.brand(other(lang)), lang, section: "about",
    title: `${chrome[lang].brand.title} · Bipe`, description: chrome[lang].brand.lede,
    // Every indexed page's link-preview card in this language (scripts/og.mjs).
    body: () => <BrandKitPage lang={lang} cards={routes.filter((r) => !r.noindex && r.lang === lang).map((r) => ({ path: r.path, title: r.title, image: `/og/${ogImageName(r)}.jpg` }))} />,
  },
]).concat({
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
  path: "/confirmar-email/", alt: null, lang: "pt", noindex: true, noReferrer: true, noAnalytics: true,
  title: `${chrome.pt.confirmEmail.title} · Bipe`, description: chrome.pt.confirmEmail.lead,
  body: () => <Island name="ConfirmEmailLanding" props={{}} />,
}, {
  // The app opens this link (universal link); the page only explains. Recovery never runs in the browser.
  path: "/recuperar/", alt: null, lang: "pt", noindex: true, noReferrer: true, noAnalytics: true,
  title: `${chrome.pt.recover.title} · Bipe`, description: chrome.pt.recover.lead,
  body: () => <Island name="RecoverLanding" props={{}} />,
}, {
  // Staff only (ADR 0056 in bipe/docs/adr). The HTML holds no data; the island signs in and asks the API.
  path: "/admin/convites/", alt: null, lang: "pt", noindex: true, noReferrer: true, noAnalytics: true, staff: true,
  title: "Convites · Bipe", description: "Relatório interno de convites.",
  body: () => <Island name="StaffApp" props={{ page: "convites" }} />,
}, {
  // Staff index (bipe#372): every page in src/admin/staff-pages.ts. The HTML holds no data.
  path: "/admin/", alt: null, lang: "pt", noindex: true, noReferrer: true, noAnalytics: true, staff: true,
  title: "Equipe · Bipe", description: "Equipe.",
  body: () => <Island name="StaffApp" props={{ page: "index" }} />,
}, ...([
  // Read-only staff pages (bipe#368). Paths and titles come from src/admin/staff-pages.ts.
  "experimentos", "espera", "empresas", "denuncias", "lgpd", "pesquisa",
] as const).map((page): Route => ({
  path: staffPath(page), alt: null, lang: "pt", noindex: true, noReferrer: true, noAnalytics: true, staff: true,
  title: `${STAFF_CONSOLE[page].title} · Bipe`, description: "Equipe.",
  body: () => <Island name="StaffApp" props={{ page }} />,
})), {
  // Staff only (bipe#373, ADR 0098): growth funnel and retention, aggregates only.
  path: "/admin/crescimento/", alt: null, lang: "pt", noindex: true, noReferrer: true, noAnalytics: true, staff: true,
  title: "Funil · Bipe", description: "Equipe.",
  body: () => <Island name="StaffApp" props={{ page: "crescimento" }} />,
}, {
  // Staff only (ADR 0098 in bipe/docs/adr): Umami visits in Brazil by state and city. The HTML holds no data.
  path: "/admin/visitas/", alt: null, lang: "pt", noindex: true, noReferrer: true, noAnalytics: true, staff: true,
  title: "Visitas · Bipe", description: "Relatório interno de visitas ao site.",
  body: () => <Island name="StaffApp" props={{ page: "visitas" }} />,
}, ...(["pt", "en"] as Lang[]).map((lang): Route => ({
  // Caddy serves this page with status 404 for every missing path (handle_errors in bipe-infra/compose/Caddyfile).
  path: `${paths.home(lang)}404/`, alt: null, lang, noindex: true,
  title: `${chrome[lang].notFound.title} · Bipe`, description: chrome[lang].notFound.lead,
  body: () => (
    <Island name="NotFound" props={{
      lang,
      pages: routes.filter((r) => !r.noindex).map((r) => ({ path: r.path, title: r.title.replace(/^Bipe · /, "").replace(/ · Bipe$/, "") })),
      start: [
        { path: paths.home(lang), title: chrome[lang].notFound.home },
        { path: paths.features(lang), title: chrome[lang].allFeatures },
        { path: paths.download(lang), title: chrome[lang].downloadTitle },
        { path: paths.docs(lang), title: chrome[lang].docs },
      ],
    }} />
  ),
})));

/** schema.org data for the home page: the organisation, the site and the app, so a search result can show Bipe as an app. */
function homeJsonLd(lang: Lang, abs: (p: string) => string): object[] {
  const org = { "@type": "Organization", name: "Bipe", url: abs(paths.home(lang)), logo: abs("/brand/app-icon.png"),
    parentOrganization: { "@type": "Organization", name: distribution.steward.name, url: distribution.steward.url },
    ...(publicRepos.length > 0 ? { sameAs: [distribution.source.org] } : {}) };
  const os = [distribution.ios.status === "available" && "iOS", distribution.android.status === "available" && "Android"].filter(Boolean).join(", ");
  return [
    { "@context": "https://schema.org", ...org },
    { "@context": "https://schema.org", "@type": "WebSite", name: "Bipe", url: abs(paths.home(lang)), inLanguage: lang === "pt" ? "pt-BR" : "en" },
    { "@context": "https://schema.org", "@type": "MobileApplication", name: "Bipe", description: product.promise[lang].lede,
      applicationCategory: "CommunicationApplication", operatingSystem: os, url: abs(paths.download(lang)),
      offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" }, publisher: org },
  ];
}

/** Where a route's link-preview card is served: `/og/home.jpg` for `/`, else `/og/<path with dashes>.jpg`. */
export function ogImageName(route: Route): string {
  return route.ogCard ?? (route.path.replace(/^\/|\/$/g, "").replace(/\//g, "-") || "home");
}
