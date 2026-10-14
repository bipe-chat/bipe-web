import { chrome } from "../copy";
import { codeLinks, type Lang } from "../shared";

/** "Source code" with deep links into the public repos. Renders nothing while the repos are private. */
export function CodeList({ lang, ids }: { lang: Lang; ids?: string[] }) {
  const links = codeLinks(ids);
  if (!links.length) return null;
  return (
    <div style={{ marginTop: 32 }}>
      <h2>{chrome[lang].sourceTitle}</h2>
      <ul className="small">{links.map((l) => <li key={l.id}><a href={l.url}>{l[lang]}</a></li>)}</ul>
    </div>
  );
}
