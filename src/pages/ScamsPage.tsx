// /golpes-no-brasil/ and /en/scams-in-brazil/: digital scams in Brazil, from the sourced register
// bipe-shared/product/scams.json (research: bipe/docs/scams-brazil.md). Every number on the page
// comes from that file with its source; this file only lays it out. Each scam type also has its own page
// (ScamTypePage, /golpes-no-brasil/<slug>/). Charts are static: HTML labels and values, SVG marks, no script. Styles: ./scams.css (loaded by src/islands.tsx).
import scamsJson from "@shared/product/scams.json";
import { chrome } from "../copy";
import { paths } from "../paths";
import { product, type Lang } from "../shared";

type Copy<T> = { pt: T; en: T };
export type ScamSource = { id: string; name: string; publisher: string; url: string; date: string; kind: "primary" | "secondary" | "press" };
export type ScamStat = { id: string; source: string } & Copy<{ value: string; label: string; period: string }>;
type Row = { id: string; value: number; highlight?: boolean } & Copy<{ label: string; value: string }>;
export type ScamChart = { id: string; form: "columns" | "bars"; sources: string[]; rows: Row[] } & Copy<{ title: string; note: string }>;
type TypeCopy = { heading: string; body: string; title: string; headline: string; lede: string; how: string[]; signs: string[]; todo: string[] };
export type ScamType = { id: string; slug: Copy<string>; stats: string[]; protect: string[] } & Copy<TypeCopy>;
type PageCopy = {
  title: string; headline: string; lede: string; numbersTitle: string; chartsTitle: string;
  channelsTitle: string; channelsBody: string;
  typesTitle: string;
  typeNumbers: string; typeHow: string; typeSigns: string; typeTodo: string; typeOthers: string; typeMore: string;
  moreTitle: string; moreBody: string;
  protectTitle: string; protectLede: string; advice: string[];
  bipeTitle: string; bipeLede: string; limit: string;
  sourcesTitle: string; sourcesNote: string;
  source: string; table: string; kinds: Record<ScamSource["kind"], string>;
};

export const scams = scamsJson as unknown as {
  date: string;
  sources: ScamSource[];
  stats: ScamStat[];
  hero: string[];
  more: string[];
  charts: ScamChart[];
  channelCharts: string[];
  types: ScamType[];
  protect: ({ feature: string } & Copy<string>)[];
} & Copy<PageCopy>;

const sourceOf = (id: string) => scams.sources.find((s) => s.id === id)!;
const statOf = (id: string) => scams.stats.find((s) => s.id === id)!;
const chartOf = (id: string) => scams.charts.find((c) => c.id === id)!;
/** Sources in the order the page uses them. */
const usedSources = () => scams.sources.filter((s) => scams.stats.some((x) => x.source === s.id) || scams.charts.some((c) => c.sources.includes(s.id)));
/** Sources of one type page: only those its numbers cite. */
const typeSources = (t: ScamType) => scams.sources.filter((s) => t.stats.some((id) => statOf(id).source === s.id));

/** "Fonte: Publisher" with a link, and the kind when it is not a primary source. */
function SourceLine({ lang, ids, extra }: { lang: Lang; ids: string[]; extra?: string }) {
  const c = scams[lang];
  return (
    <p className="scam-source">
      {extra && <>{extra} · </>}
      {c.source}:{" "}
      {ids.map(sourceOf).map((s, i) => (
        <span key={s.id}>
          {i > 0 && "; "}
          <a href={s.url}>{s.publisher}</a>{s.kind !== "primary" && ` (${c.kinds[s.kind]})`}
        </span>
      ))}
    </p>
  );
}

function BigNumber({ lang, id }: { lang: Lang; id: string }) {
  const s = statOf(id);
  return (
    <div className="scam-stat">
      <p className="scam-value">{s[lang].value}</p>
      <p className="scam-label">{s[lang].label}</p>
      <SourceLine lang={lang} ids={[s.source]} extra={s[lang].period} />
    </div>
  );
}

/** Square at the baseline, 4px round at the data end: a rounded rect plus a square rect over its base half. */
function Mark({ pct, vertical }: { pct: number; vertical?: boolean }) {
  const p = `${Math.max(pct, 0.5)}%`;
  return vertical ? (
    <svg className="scam-mark" aria-hidden="true" width="100%" height="100%">
      <rect x="0" y={`${100 - pct}%`} width="100%" height={p} rx="4" />
      <rect x="0" y={`${100 - pct / 2}%`} width="100%" height={`${pct / 2}%`} />
    </svg>
  ) : (
    <svg className="scam-mark" aria-hidden="true" width="100%" height="100%">
      <rect x="0" y="0" width={p} height="100%" rx="4" />
      <rect x="0" y="0" width={`${pct / 2}%`} height="100%" />
    </svg>
  );
}

/** Clean axis ticks: 0 and steps of 1, 2 or 5 times a power of ten, up to the first tick at or above max. */
function ticks(max: number): number[] {
  const raw = max / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw)!;
  const out = [0];
  while (out[out.length - 1] < max) out.push(out[out.length - 1] + step);
  return out;
}

/** Axis tick label: 1,5 mi / 1.5M, 500 mil / 500k. */
function tickLabel(lang: Lang, v: number): string {
  const fmt = (n: number) => n.toLocaleString(lang === "pt" ? "pt-BR" : "en-US", { maximumFractionDigits: 1 });
  if (v >= 1e6) return lang === "pt" ? `${fmt(v / 1e6)} mi` : `${fmt(v / 1e6)}M`;
  if (v >= 1e3) return lang === "pt" ? `${fmt(v / 1e3)} mil` : `${fmt(v / 1e3)}k`;
  return fmt(v);
}

/** Change over time: one column per period, one hue. Values on the first and the last column; all in the table. */
function Columns({ lang, chart }: { lang: Lang; chart: ScamChart }) {
  const t = ticks(Math.max(...chart.rows.map((r) => r.value)));
  const top = t[t.length - 1];
  const last = chart.rows.length - 1;
  const y = (v: number) => (v / top) * 100;
  return (
    <div className="scam-columns" style={{ ["--n" as string]: chart.rows.length }}>
      <div className="scam-plot">
        <svg className="scam-grid" aria-hidden="true" width="100%" height="100%">
          {t.map((v) => <line key={v} x1="0" x2="100%" y1={`${100 - y(v)}%`} y2={`${100 - y(v)}%`} />)}
        </svg>
        <div className="scam-ticks" aria-hidden="true">
          {t.slice(1).map((v) => <span key={v} style={{ bottom: `${y(v)}%` }}>{tickLabel(lang, v)}</span>)}
        </div>
        {chart.rows.map((r, i) => (
          <div className="scam-col" key={r.id} title={`${r[lang].label}: ${r[lang].value}`}>
            <span className="scam-cap" style={{ bottom: `${y(r.value)}%` }}>{(i === 0 || i === last) && r[lang].value}</span>
            <Mark pct={y(r.value)} vertical />
          </div>
        ))}
      </div>
      <div className="scam-axis" aria-hidden="true">{chart.rows.map((r) => <span key={r.id}>{r[lang].label}</span>)}</div>
    </div>
  );
}

/** Magnitude across categories: one bar per row, value at the tip. Highlighted rows carry the accent, the rest stay gray. */
function Bars({ lang, chart }: { lang: Lang; chart: ScamChart }) {
  const max = Math.max(...chart.rows.map((r) => r.value));
  const any = chart.rows.some((r) => r.highlight);
  return (
    <ul className="scam-bars">
      {chart.rows.map((r) => (
        <li key={r.id} className={any && !r.highlight ? "dim" : undefined} title={`${r[lang].label}: ${r[lang].value}`}>
          <span className="scam-bar-label">{r[lang].label}</span>
          <span className="scam-bar">
            <span className="scam-bar-track" style={{ width: `calc((100% - 5.5em) * ${r.value / max})` }}><Mark pct={100} /></span>
            <span className="scam-bar-value">{r[lang].value}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function Chart({ lang, chart }: { lang: Lang; chart: ScamChart }) {
  const c = scams[lang];
  return (
    <figure className="card scam-chart" id={chart.id}>
      <figcaption>
        <h3>{chart[lang].title}</h3>
        <p className="small muted">{chart[lang].note}</p>
      </figcaption>
      {chart.form === "columns" ? <Columns lang={lang} chart={chart} /> : <Bars lang={lang} chart={chart} />}
      {chart.form === "columns" && (
        <details className="scam-table">
          <summary>{c.table}</summary>
          <table>
            <tbody>{chart.rows.map((r) => <tr key={r.id}><th scope="row">{r[lang].label}</th><td>{r[lang].value}</td></tr>)}</tbody>
          </table>
        </details>
      )}
      <SourceLine lang={lang} ids={chart.sources} />
    </figure>
  );
}

/** A Bipe feature that protects against the scam, with its status per platform from product.json. */
function ProtectCard({ lang, feature }: { lang: Lang; feature: string }) {
  const st = chrome[lang].status;
  const f = product.features.find((x) => x.id === feature)!;
  const p = scams.protect.find((x) => x.feature === feature)!;
  return (
    <a className="card feature" href={paths.feature(lang, f)}>
      <h3>{f[lang].name}</h3>
      <p>{p[lang]}</p>
      <p className="small">iPhone: {st[f.status.ios]} · Android: {st[f.status.android]}</p>
    </a>
  );
}

export function ScamsPage({ lang }: { lang: Lang }) {
  const c = scams[lang];
  return (
    <section className="wrap section scams">
      <h1>{c.headline}</h1>
      <p className="lede">{c.lede}</p>

      <h2 className="visually-hidden">{c.numbersTitle}</h2>
      <div className="scam-stats">{scams.hero.map((id) => <BigNumber lang={lang} id={id} key={id} />)}</div>

      <div className="side narrow">
        <h2>{c.channelsTitle}</h2>
        <p>{c.channelsBody}</p>
      </div>
      <div className="scam-charts">{scams.channelCharts.map((id) => <Chart lang={lang} chart={chartOf(id)} key={id} />)}</div>

      <div className="side">
        <h2>{c.chartsTitle}</h2>
        <div className="scam-charts">
          {scams.charts.filter((x) => !scams.channelCharts.includes(x.id)).map((x) => <Chart lang={lang} chart={x} key={x.id} />)}
        </div>
      </div>

      <div className="side narrow">
        <h2>{c.typesTitle}</h2>
        {scams.types.map((t) => {
          const s = statOf(t.stats[0]);
          return (
            <div className="scam-type" key={t.id} id={t.id}>
              <h3><a href={paths.scamType(lang, t)}>{t[lang].heading}</a></h3>
              <p>{t[lang].body}</p>
              <p className="scam-type-stat"><strong>{s[lang].value}</strong> {s[lang].label}</p>
              <SourceLine lang={lang} ids={[s.source]} extra={s[lang].period} />
              <p className="scam-type-more"><a href={paths.scamType(lang, t)}>{c.typeMore}</a></p>
            </div>
          );
        })}
      </div>

      <div className="side narrow">
        <h2>{c.moreTitle}</h2>
        <p>{c.moreBody}</p>
        <ul className="scam-more">
          {scams.more.map(statOf).map((s) => (
            <li key={s.id}>
              <strong>{s[lang].value}</strong> {s[lang].label}
              <SourceLine lang={lang} ids={[s.source]} extra={s[lang].period} />
            </li>
          ))}
        </ul>
      </div>

      <div className="side narrow">
        <h2>{c.protectTitle}</h2>
        <p>{c.protectLede}</p>
        <ul className="scam-advice">{c.advice.map((a) => <li key={a}>{a}</li>)}</ul>
      </div>

      <div className="side">
        <h2>{c.bipeTitle}</h2>
        <p className="side-line">{c.bipeLede}</p>
        <div className="grid">
          {scams.protect.map((p) => <ProtectCard lang={lang} feature={p.feature} key={p.feature} />)}
        </div>
        <p className="small muted scam-limit">{c.limit}</p>
      </div>

      <div className="side narrow">
        <h2>{c.sourcesTitle}</h2>
        <p className="small muted">{c.sourcesNote}</p>
        <ul className="small">
          {usedSources().map((s) => (
            <li key={s.id}><a href={s.url}>{s.name}</a> ({s.publisher}, {s.date}){s.kind !== "primary" && `, ${c.kinds[s.kind]}`}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** /golpes-no-brasil/<slug>/: one scam type. How it works, how to spot it, what to do, its numbers, and
 *  the Bipe features that protect against it. Copy and numbers come from the type's entry in scams.json. */
export function ScamTypePage({ lang, t }: { lang: Lang; t: ScamType }) {
  const c = scams[lang];
  const x = t[lang];
  return (
    <section className="wrap section scams">
      <div className="narrow">
        <p className="small"><a href={paths.scams(lang)}>{c.title}</a> · {x.heading}</p>
        <h1>{x.headline}</h1>
        <p className="lede">{x.lede}</p>
      </div>

      <h2 className="visually-hidden">{c.typeNumbers}</h2>
      <div className="scam-stats">{t.stats.map((id) => <BigNumber lang={lang} id={id} key={id} />)}</div>

      <div className="side narrow">
        <h2>{c.typeHow}</h2>
        <ol className="scam-advice">{x.how.map((a) => <li key={a}>{a}</li>)}</ol>
      </div>

      <div className="side narrow">
        <h2>{c.typeSigns}</h2>
        <ul className="scam-advice">{x.signs.map((a) => <li key={a}>{a}</li>)}</ul>
      </div>

      <div className="side narrow">
        <h2>{c.typeTodo}</h2>
        <ul className="scam-advice">{x.todo.map((a) => <li key={a}>{a}</li>)}</ul>
      </div>

      <div className="side">
        <h2>{c.bipeTitle}</h2>
        <p className="side-line">{c.bipeLede}</p>
        <div className="grid">{t.protect.map((id) => <ProtectCard lang={lang} feature={id} key={id} />)}</div>
        <p className="small muted scam-limit">{c.limit}</p>
      </div>

      <div className="side narrow">
        <h2>{c.typeOthers}</h2>
        <ul className="scam-others">
          {scams.types.filter((o) => o.id !== t.id).map((o) => <li key={o.id}><a href={paths.scamType(lang, o)}>{o[lang].heading}</a></li>)}
        </ul>
        <p><a href={paths.scams(lang)}>{c.title}</a></p>
      </div>

      <div className="side narrow">
        <h2>{c.sourcesTitle}</h2>
        <p className="small muted">{c.sourcesNote}</p>
        <ul className="small">
          {typeSources(t).map((s) => (
            <li key={s.id}><a href={s.url}>{s.name}</a> ({s.publisher}, {s.date}){s.kind !== "primary" && `, ${c.kinds[s.kind]}`}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** schema.org data for the hub and the type pages: an Article that cites its sources, and the breadcrumb. */
export function scamsJsonLd(lang: Lang, t: ScamType | null, abs: (p: string) => string): object[] {
  const c = scams[lang];
  const url = abs(t ? paths.scamType(lang, t) : paths.scams(lang));
  const crumbs = [{ name: c.title, url: abs(paths.scams(lang)) }, ...(t ? [{ name: t[lang].heading, url }] : [])];
  return [
    {
      "@context": "https://schema.org", "@type": "Article", mainEntityOfPage: url, url,
      headline: t ? t[lang].headline : c.headline, description: t ? t[lang].lede : c.lede,
      inLanguage: lang === "pt" ? "pt-BR" : "en", datePublished: scams.date, dateModified: scams.date,
      author: { "@type": "Organization", name: "Bipe", url: abs(paths.home(lang)) },
      publisher: { "@type": "Organization", name: "Bipe", url: abs(paths.home(lang)) },
      citation: (t ? typeSources(t) : usedSources()).map((s) => s.url),
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: crumbs.map((x, i) => ({ "@type": "ListItem", position: i + 1, name: x.name, item: x.url })),
    },
  ];
}

/** Markdown twin for entry-server.tsx renderMarkdown. */
const mdSources = (lang: Lang, ids: string[]) =>
  ids.map(sourceOf).map((s) => `[${s.publisher}](${s.url})${s.kind !== "primary" ? ` (${scams[lang].kinds[s.kind]})` : ""}`).join("; ");
const mdStat = (lang: Lang, id: string) => {
  const s = statOf(id);
  return `**${s[lang].value}** ${s[lang].label} (${s[lang].period}. ${scams[lang].source}: ${mdSources(lang, [s.source])})`;
};
const mdSourceList = (lang: Lang, list: ScamSource[]) =>
  list.map((s) => `- [${s.name}](${s.url}) (${s.publisher}, ${s.date})${s.kind !== "primary" ? `, ${scams[lang].kinds[s.kind]}` : ""}`);
function protectLine(lang: Lang, feature: string, abs: (p: string) => string): string {
  const st = chrome[lang].status;
  const f = product.features.find((x) => x.id === feature)!;
  const p = scams.protect.find((x) => x.feature === feature)!;
  return `- [${f[lang].name}](${abs(paths.feature(lang, f))}) (iPhone: ${st[f.status.ios]}; Android: ${st[f.status.android]}): ${p[lang]}`;
}

export function scamsMarkdown(lang: Lang, abs: (p: string) => string): string[] {
  const c = scams[lang];
  const src = (ids: string[]) => mdSources(lang, ids);
  const statLine = (id: string) => mdStat(lang, id);
  const out: string[] = [`**${c.headline}**`, "", `## ${c.numbersTitle}`, "", ...scams.hero.map((id) => `- ${statLine(id)}`), ""];
  out.push(`## ${c.channelsTitle}`, "", c.channelsBody, "");
  const chartMd = (ch: ScamChart) => [`### ${ch[lang].title}`, "", ch[lang].note, "", ...ch.rows.map((r) => `- ${r[lang].label}: ${r[lang].value}`), "", `${c.source}: ${src(ch.sources)}`, ""];
  for (const id of scams.channelCharts) out.push(...chartMd(chartOf(id)));
  out.push(`## ${c.chartsTitle}`, "");
  for (const ch of scams.charts.filter((x) => !scams.channelCharts.includes(x.id))) out.push(...chartMd(ch));
  out.push(`## ${c.typesTitle}`, "");
  scams.types.forEach((t) => out.push(`### [${t[lang].heading}](${abs(paths.scamType(lang, t))})`, "", t[lang].body, "", statLine(t.stats[0]), ""));
  out.push(`## ${c.moreTitle}`, "", c.moreBody, "", ...scams.more.map((id) => `- ${statLine(id)}`), "");
  out.push(`## ${c.protectTitle}`, "", c.protectLede, "", ...c.advice.map((a) => `- ${a}`), "");
  out.push(`## ${c.bipeTitle}`, "", c.bipeLede, "");
  for (const p of scams.protect) out.push(protectLine(lang, p.feature, abs));
  out.push("", c.limit, "", `## ${c.sourcesTitle}`, "", c.sourcesNote, "");
  out.push(...mdSourceList(lang, usedSources()), "");
  return out;
}

/** Markdown twin of ScamTypePage. */
export function scamTypeMarkdown(lang: Lang, t: ScamType, abs: (p: string) => string): string[] {
  const c = scams[lang];
  const x = t[lang];
  const out: string[] = [`**${x.headline}**`, "", `## ${c.typeNumbers}`, "", ...t.stats.map((id) => `- ${mdStat(lang, id)}`), ""];
  out.push(`## ${c.typeHow}`, "", ...x.how.map((a, i) => `${i + 1}. ${a}`), "");
  out.push(`## ${c.typeSigns}`, "", ...x.signs.map((a) => `- ${a}`), "");
  out.push(`## ${c.typeTodo}`, "", ...x.todo.map((a) => `- ${a}`), "");
  out.push(`## ${c.bipeTitle}`, "", c.bipeLede, "", ...t.protect.map((id) => protectLine(lang, id, abs)), "", c.limit, "");
  out.push(`## ${c.typeOthers}`, "", ...scams.types.filter((o) => o.id !== t.id).map((o) => `- [${o[lang].heading}](${abs(paths.scamType(lang, o))})`), `- [${c.title}](${abs(paths.scams(lang))})`, "");
  out.push(`## ${c.sourcesTitle}`, "", c.sourcesNote, "", ...mdSourceList(lang, typeSources(t)), "");
  return out;
}
