import { STAFF_HOME, STAFF_INDEX } from "./admin/staff-pages";
import { chrome } from "./copy";
import { Wordmark } from "./components/brand";
import { Icon, type IconName } from "./components/ui";
import { breadcrumbs, footerGroups, header, headerCta, links } from "./nav";
import { paths } from "./paths";
import type { Route } from "./routes";
import { distribution, publicRepos } from "./shared";

export function Layout({ route }: { route: Route }) {
  const { lang } = route;
  const c = chrome[lang];
  const l = links(lang);
  const trail = breadcrumbs(route);
  const current = (id: string) => (route.section === id ? "page" : undefined);
  const otherLang = c.other.lang === "pt" ? "pt-BR" : "en";
  if (route.staff) return (
    <>
      <a className="visually-hidden" href="#main">{c.skip}</a>
      <header className="site-head staff-top">
        <div className="staff-top-row">
          <a href={STAFF_INDEX} aria-label="Bipe, equipe" style={{ textDecoration: "none" }}><Wordmark size={22} /></a>
          <span className="staff-top-name">{STAFF_HOME}</span>
          <a className="staff-top-site small" href={paths.home(lang)}>bipe.chat ↗</a>
        </div>
      </header>
      <main id="main">{route.body()}</main>
    </>
  );
  return (
    <>
      <a className="visually-hidden" href="#main">{c.skip}</a>
      <header className="site-head">
        <div className="wrap">
          <a href={paths.home(lang)} aria-label="Bipe" style={{ textDecoration: "none" }}><Wordmark size={26} /></a>
          <nav aria-label={c.navLabel.header}>
            {header.map((id) => <a key={id} href={l[id].href} aria-current={current(id)}>{l[id].label}</a>)}
          </nav>
          <a className="nav-cta" href={l[headerCta].href} aria-current={current(headerCta)}>{l[headerCta].label}</a>
        </div>
      </header>
      <main id="main">
        {trail.length > 0 && (
          <nav className="wrap crumbs small" aria-label={c.navLabel.crumbs}>
            <ol>{trail.map((t, i) => <li key={t.href}>{i < trail.length - 1 ? <a href={t.href}>{t.label}</a> : <span aria-current="page">{t.label}</span>}</li>)}</ol>
          </nav>
        )}
        {route.body()}
      </main>
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
            <div className="foot-end">
              <p className="foot-accounts">{distribution.social.accounts.map((a) => <a key={a.id} href={a.url} rel="me" aria-label={`${a.name} ${a.handle}`} title={`${a.name} ${a.handle}`}><Icon name={a.id as IconName} size={a.id === "instagram" ? 20 : 18} /></a>)}{publicRepos.length > 0 && <a href={distribution.source.org} aria-label="GitHub bipe-chat" title="GitHub bipe-chat"><Icon name="github" size={18} /></a>}</p>
              {route.alt && <a href={route.alt} hrefLang={otherLang} lang={otherLang}>{c.other.label}</a>}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
