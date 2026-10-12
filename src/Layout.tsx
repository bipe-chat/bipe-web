import { chrome } from "./copy";
import { Wordmark } from "./components/brand";
import { paths } from "./paths";
import type { Route } from "./routes";
import { distribution, product, publicRepos, compare } from "./shared";

/** The nav leads with the identity side (ADR 0047): its first tentpole page. */
const trustId = product.sides.find((s) => s.id === "other")!.tentpoles[0];
const trust = product.tentpoles.find((tp) => tp.id === trustId)!;

export function Layout({ route }: { route: Route }) {
  const { lang } = route;
  const c = chrome[lang];
  const nav = [
    { key: "trust", href: paths.tentpole(lang, trust), label: trust[lang].name },
    { key: "features", href: paths.features(lang), label: c.features },
    { key: "download", href: paths.download(lang), label: c.download },
    { key: "business", href: paths.business(lang), label: product.business[lang].nav },
    { key: "about", href: paths.about(lang), label: c.about },
  ] as const;
  return (
    <>
      <a className="visually-hidden" href="#main">{c.skip}</a>
      <header className="site-head">
        <div className="wrap">
          <a href={paths.home(lang)} aria-label="Bipe" style={{ textDecoration: "none" }}><Wordmark size={26} /></a>
          <nav aria-label={lang === "pt" ? "Principal" : "Main"}>
            {nav.map((n) => <a key={n.key} href={n.href} aria-current={route.section === n.key ? "page" : undefined}>{n.label}</a>)}
            {route.alt && <a className="lang" href={route.alt} hrefLang={c.other.lang === "pt" ? "pt-BR" : "en"} lang={c.other.lang === "pt" ? "pt-BR" : "en"}>{c.other.label}</a>}
          </nav>
        </div>
      </header>
      <main id="main">{route.body()}</main>
      <footer className="site-foot">
        <div className="wrap">
          <span>{c.footerNote}</span>
          <span>{c.steward} <a href={distribution.steward.url}>{distribution.steward.name}</a></span>
          {product.audiences.map((a) => <a key={a.id} href={paths.audience(lang, a)}>{a[lang].title}</a>)}
          <a href={paths.compare(lang)}>{compare[lang].nav}</a>
          <a href={paths.technology(lang)}>{product.technical[lang].nav}</a>
          <a href={paths.privacy(lang)}>{c.privacy}</a>
          <a href={paths.terms(lang)}>{c.terms}</a>
          <a href={`mailto:${distribution.contact}`}>{c.contact}</a>
          {publicRepos.length > 0 && <a href={distribution.source.org}>{c.source}</a>}
        </div>
      </footer>
    </>
  );
}
