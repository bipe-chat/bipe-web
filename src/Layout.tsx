import { chrome } from "./copy";
import { Wordmark } from "./components/brand";
import { footer, header, links } from "./nav";
import { paths } from "./paths";
import type { Route } from "./routes";
import { distribution, publicRepos } from "./shared";

export function Layout({ route }: { route: Route }) {
  const { lang } = route;
  const c = chrome[lang];
  const l = links(lang);
  const cta = header[header.length - 1];
  const current = (id: string) => (route.section === id ? "page" : undefined);
  // External and per-page links close the last footer group.
  const extra: { href: string; label: string; lang?: string }[] = [
    ...(publicRepos.length > 0 ? [{ href: distribution.source.org, label: c.source }] : []),
    ...(route.alt ? [{ href: route.alt, label: c.other.label, lang: c.other.lang === "pt" ? "pt-BR" : "en" }] : []),
  ];
  const groups = footer.map((g, i) => ({
    heading: c.footerGroups[g.group],
    links: [...g.links.map((id): (typeof extra)[number] => l[id]), ...(i === footer.length - 1 ? extra : [])],
  }));
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
            {groups.map((g) => (
              <div key={g.heading}>
                <h2>{g.heading}</h2>
                <ul>{g.links.map((l) => <li key={l.href}><a href={l.href} {...(l.lang ? { hrefLang: l.lang, lang: l.lang } : {})}>{l.label}</a></li>)}</ul>
              </div>
            ))}
          </nav>
          <p className="foot-note">{c.footerNote} {c.steward} <a href={distribution.steward.url}>{distribution.steward.name}</a>.{publicRepos.length > 0 && <> {c.sourceNote} <a href={distribution.source.org}>github.com/bipe-chat</a>.</>}</p>
        </div>
      </footer>
    </>
  );
}
