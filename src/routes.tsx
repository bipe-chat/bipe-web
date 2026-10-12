import type { ReactNode } from "react";
import { chrome } from "./copy";
import { product, type Lang } from "./shared";
import { Island } from "./island-registry";
import { paths } from "./paths";
import { AboutPage, BrandPage, DownloadPage, FeaturesPage, HomePage, TentpolePage } from "./pages";

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
  section?: "features" | "download" | "about";
  body: () => ReactNode;
};

const other = (lang: Lang): Lang => (lang === "pt" ? "en" : "pt");

export const routes: Route[] = (["pt", "en"] as Lang[]).flatMap((lang): Route[] => [
  {
    path: paths.home(lang), alt: paths.home(other(lang)), lang,
    title: `Proseio · ${product.promise[lang].title}`, description: product.promise[lang].lede,
    body: () => <HomePage lang={lang} />,
  },
  ...product.tentpoles.map((tp): Route => ({
    path: paths.tentpole(lang, tp), alt: paths.tentpole(other(lang), tp), lang, section: "features",
    title: `${tp[lang].name} · Proseio`, description: tp[lang].summary,
    body: () => <TentpolePage lang={lang} tp={tp} />,
  })),
  {
    path: paths.features(lang), alt: paths.features(other(lang)), lang, section: "features",
    title: `${chrome[lang].allFeatures} · Proseio`, description: product.promise[lang].lede,
    body: () => <FeaturesPage lang={lang} />,
  },
  {
    path: paths.download(lang), alt: paths.download(other(lang)), lang, section: "download",
    title: `${chrome[lang].downloadTitle} · Proseio`, description: chrome[lang].downloadLede,
    body: () => <DownloadPage lang={lang} />,
  },
  {
    path: paths.about(lang), alt: paths.about(other(lang)), lang, section: "about",
    title: `${chrome[lang].about} · Proseio`, description: product.about[lang].lede,
    body: () => <AboutPage lang={lang} />,
  },
]).concat({
  path: "/marca/", alt: null, lang: "pt", noindex: true,
  title: "Marca (rascunho) · Proseio", description: "Rascunhos do símbolo do Proseio.",
  body: () => <BrandPage />,
}, {
  // Target of the Caddy rewrite for /@handle.
  path: "/perfil/", alt: null, lang: "pt", noindex: true,
  title: "Proseio", description: chrome.pt.profile.lead,
  body: () => <Island name="ProfileLanding" props={{}} />,
}, {
  // Target of the Caddy rewrite for /convite/<code>.
  path: "/convite/", alt: null, lang: "pt", noindex: true, noReferrer: true, ogCard: "convite",
  title: "Convite para o Proseio", description: chrome.pt.invite.lead,
  body: () => <Island name="InviteLanding" props={{}} />,
});
