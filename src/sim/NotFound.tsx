// 404 page. Caddy serves /404/ (or /en/404/ under /en/) for every missing path, with status 404.
// On the client the page reads the address and either opens the real page (case, trailing
// punctuation from a pasted link, a missing slash, index.html) or lists the closest pages.
import { useEffect, useState } from "react";
import { chrome } from "../copy";
import type { Lang } from "../shared";

export type NotFoundPage = { path: string; title: string };
type Result = { redirect: string } | { suggestions: NotFoundPage[]; profile: boolean };

/** Same pattern as the Caddy rewrite for profile links (bipe-infra/compose/Caddyfile). */
const HANDLE = /^\/@[a-z0-9._]{2,30}$/;

/** The address as a site path: decoded, lower case, no accents, no file name, one trailing slash. */
export function normalizePath(raw: string): string {
  let p = raw;
  try { p = decodeURIComponent(p); } catch { /* keep the raw path */ }
  p = p.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  p = p.replace(/[\s.,;:!?)\]}"'»>*]+$/, "");
  p = p.replace(/\/index(\.html?|\.md)?$/, "/").replace(/\.html?$/, "");
  p = p.replace(/\s+/g, "-").replace(/\/{2,}/g, "/");
  return p.endsWith("/") ? p : `${p}/`;
}

function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cur = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
  }
  return row[b.length];
}

export function resolveMissing(rawPath: string, pages: NotFoundPage[]): Result {
  const path = normalizePath(rawPath);
  const handle = path.replace(/\/$/, "");
  if (handle.startsWith("/@")) {
    if (HANDLE.test(handle) && handle !== rawPath) return { redirect: handle };
    return { suggestions: [], profile: true };
  }
  const exact = pages.find((p) => p.path === path);
  if (exact && exact.path !== rawPath) return { redirect: exact.path };

  // Closest pages by edit distance; a path in the other language counts too (/download/ finds /en/download/).
  const limit = Math.max(2, Math.floor(path.length * 0.3));
  const close = pages
    .map((p) => ({ p, d: distance(path, p.path) }))
    .filter((x) => x.d <= limit && x.p.path !== "/" && x.p.path !== "/en/")
    .sort((a, b) => a.d - b.d)
    .slice(0, 3)
    .map((x) => x.p);
  // The nearest existing parent: /docs/old-page/ suggests /docs/.
  const segments = path.split("/").filter(Boolean);
  for (let n = segments.length - 1; n > 0; n--) {
    const parent = pages.find((p) => p.path === `/${segments.slice(0, n).join("/")}/`);
    if (parent && parent.path !== "/en/") {
      if (!close.includes(parent)) close.push(parent);
      break;
    }
  }
  return { suggestions: close, profile: false };
}

export function NotFound({ lang, pages, start }: { lang: Lang; pages: NotFoundPage[]; start: NotFoundPage[] }) {
  const c = chrome[lang].notFound;
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    const r = resolveMissing(location.pathname, pages);
    setResult(r);
    if ("redirect" in r) location.replace(r.redirect + location.search + location.hash);
  }, []);

  if (result && "redirect" in result) {
    return <section className="wrap narrow section"><p className="lede" role="status">{c.moving}</p></section>;
  }
  const suggestions = result?.suggestions ?? [];
  return (
    <section className="wrap narrow section">
      <h1>{c.title}</h1>
      <p className="lede">{c.lead}</p>
      {result?.profile && <p>{c.profile}</p>}
      {suggestions.length > 0 && (
        <>
          <h2 className="not-found-head">{c.didYouMean}</h2>
          <ul className="not-found-list">{suggestions.map((p) => <li key={p.path}><a href={p.path}>{p.title}</a> <span className="muted small">{p.path}</span></li>)}</ul>
        </>
      )}
      <h2 className="not-found-head">{c.startHere}</h2>
      <ul className="not-found-list">{start.map((p) => <li key={p.path}><a href={p.path}>{p.title}</a></li>)}</ul>
    </section>
  );
}
