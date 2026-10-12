import type { ReactNode } from "react";
import { chrome } from "./copy";
import { compare, product, type Lang } from "./shared";
import { Island } from "./island-registry";
import { paths } from "./paths";
import { AboutPage, BusinessPage, BrandPage, CastPage, CompareAppPage, ComparePage, AudiencePage, DownloadPage, FeaturePage, FeaturesPage, HomePage, TechnologyPage, TentpolePage } from "./pages";

export type Route = {
  path: string;
  lang: Lang;
  /** Same page in the other language. */
  alt: string | null;
  title: string;
  description: string;
  noindex?: boolean;
  /** Never send this URL as a referrer (invite links carry a secret code). */
  noReferrer?: boolean;
  /** Render a 1200x630 link-preview card from title and description (scripts/og.mjs). Name of the PNG under /og/. */
  ogCard?: string;
  /** The nav item this page belongs to. */
  section?: "trust" | "features" | "download" | "business" | "about";
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
    path: paths.technology(lang), alt: paths.technology(other(lang)), lang,
    title: `${product.technical[lang].nav} · Bipe`, description: product.technical[lang].lede,
    body: () => <TechnologyPage lang={lang} />,
  },
  {
    path: paths.compare(lang), alt: paths.compare(other(lang)), lang, section: "trust",
    title: `${compare[lang].title} · Bipe`, description: compare[lang].lede,
    body: () => <ComparePage lang={lang} />,
  },
  ...compare.apps.map((app): Route => ({
    path: paths.compareApp(lang, app), alt: paths.compareApp(other(lang), app), lang, section: "trust",
    title: `${app[lang].title} · Bipe`, description: app[lang].lede,
    body: () => <CompareAppPage lang={lang} app={app} />,
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
  // Staff only (proseio ADR 0056). The HTML holds no data; the island signs in and asks the API.
  path: "/admin/convites/", alt: null, lang: "pt", noindex: true, noReferrer: true,
  title: "Quem mais convida (equipe) · Bipe", description: "Relatório interno de convites.",
  body: () => <Island name="InviterReport" props={{}} />,
});
