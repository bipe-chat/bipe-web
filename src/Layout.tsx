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
    { key: "compare", href: paths.compare(lang), label: compare[lang].nav },
    { key: "about", href: paths.about(lang), label: c.about },
  ] as const;
  // Footer: three groups by what the reader looks for. Single audiences live on the hub, never here.
  const footer = [
    { heading: c.footerGroups.product, links: [
      { href: paths.tentpole(lang, trust), label: trust[lang].name },
      { href: paths.features(lang), label: c.features },
      { href: paths.compare(lang), label: compare[lang].nav },
      { href: paths.technology(lang), label: product.technical[lang].nav },
      { href: paths.download(lang), label: c.download },
    ] },
    { heading: c.footerGroups.for, links: [
      { href: paths.audiences(lang), label: product.audiencesHub[lang].nav },
      { href: paths.business(lang), label: product.business[lang].nav },
    ] },
    { heading: c.footerGroups.bipe, links: [
      { href: paths.about(lang), label: c.about },
      { href: `mailto:${distribution.contact}`, label: c.contact },
      { href: paths.privacy(lang), label: c.privacy },
      { href: paths.terms(lang), label: c.terms },
      ...(publicRepos.length > 0 ? [{ href: distribution.source.org, label: c.source }] : []),
      ...(route.alt ? [{ href: route.alt, label: c.other.label, lang: c.other.lang === "pt" ? "pt-BR" : "en" }] : []),
    ] },
  ];
  return (
    <>
      <a className="visually-hidden" href="#main">{c.skip}</a>
      <header className="site-head">
        <div className="wrap">
          <a href={paths.home(lang)} aria-label="Bipe" style={{ textDecoration: "none" }}><Wordmark size={26} /></a>
          <nav aria-label={lang === "pt" ? "Principal" : "Main"}>
            {nav.map((n) => <a key={n.key} href={n.href} aria-current={route.section === n.key ? "page" : undefined}>{n.label}</a>)}
            <a className="nav-cta" href={paths.download(lang)} aria-current={route.section === "download" ? "page" : undefined}>{c.download}</a>
          </nav>
        </div>
      </header>
      <main id="main">{route.body()}</main>
      <footer className="site-foot">
        <div className="wrap">
          <nav className="foot-groups" aria-label={c.footerGroups.bipe}>
            {footer.map((g) => (
              <div key={g.heading}>
                <h2>{g.heading}</h2>
                <ul>{g.links.map((l) => <li key={l.href}><a href={l.href} {...("lang" in l ? { hrefLang: l.lang, lang: l.lang } : {})}>{l.label}</a></li>)}</ul>
              </div>
            ))}
          </nav>
          <p className="foot-note">{c.footerNote} {c.steward} <a href={distribution.steward.url}>{distribution.steward.name}</a>.</p>
        </div>
      </footer>
    </>
  );
}
