import { chrome } from "./copy";
import { Wordmark } from "./components/brand";
import { footerGroups, header, links } from "./nav";
import { paths } from "./paths";
import type { Route } from "./routes";
import { distribution, publicRepos } from "./shared";

export function Layout({ route }: { route: Route }) {
  const { lang } = route;
  const c = chrome[lang];
  const l = links(lang);
  const cta = header[header.length - 1];
  const current = (id: string) => (route.section === id ? "page" : undefined);
  const otherLang = c.other.lang === "pt" ? "pt-BR" : "en";
  return (
    <>
      <a className="visually-hidden" href="#main">{c.skip}</a>
      <header className="site-head">
        <div className="wrap">
          <a href={paths.home(lang)} aria-label="Bipe" style={{ textDecoration: "none" }}><Wordmark size={26} /></a>
          <nav aria-label={c.navLabel.header}>
            {header.map((id) => <a key={id} className={id === cta ? "nav-cta" : undefined} href={l[id].href} aria-current={current(id)}>{l[id].label}</a>)}
          </nav>
        </div>
      </header>
      <main id="main">{route.body()}</main>
      <footer className="site-foot">
        <div className="wrap">
          <nav className="foot-groups" aria-label={c.navLabel.footer}>
            {footerGroups(lang).map((g) => (
              <div key={g.heading}>
                <h2>{g.heading}</h2>
                <ul>{g.links.map((l) => <li key={l.href}><a href={l.href}>{l.label}</a></li>)}</ul>
              </div>
            ))}
          </nav>
          <div className="foot-bottom">
            <p className="foot-note">{publicRepos.length > 0 ? c.footerNote.open : c.footerNote.closed} <a href={distribution.steward.url}>{distribution.steward.name}</a>{publicRepos.length > 0 && " (AGPL-3.0)"}.</p>
            {route.alt && <a href={route.alt} hrefLang={otherLang} lang={otherLang}>{c.other.label}</a>}
          </div>
        </div>
      </footer>
    </>
  );
}
