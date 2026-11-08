import { useEffect, useState } from "react";
import "./parity.css";
import { chrome } from "../copy";
import { Island } from "../island-registry";
import { MoreLink } from "../components/ui";
import { paths } from "../paths";
import { clientAssessment, parityItems, parityPlan, product, publicRepos, type Lang } from "../shared";
import { CLIENTS, LEVELS, cleanName, counts, entry, groups, hasGap, recordsFor, type Client, type Level, type ParityItem } from "../parity";

const clientLabels: Record<Client, string> = { ios: "iOS", android: "Android", web: "Web", macos: "Mac", windows: "Windows" };
const featureById = new Map(product.features.map(feature => [feature.id, feature]));
const allGroups = groups(parityItems, parityPlan);
const sourceRepo = publicRepos.find(repo => repo.id === "shared");
const normalize = (value: string) => value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const nameFor = (item: ParityItem, lang: Lang) => featureById.get(item.id)?.[lang].name ?? cleanName(item.name);
const date = (value: string, lang: Lang) => new Intl.DateTimeFormat(lang === "pt" ? "pt-BR" : "en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));

const symbols: Record<Level, string> = { testing: "T", built: "✓", planned: "○", review: "?", policy: "P", "n/a": "n/a" };
function Badge({ lang, level, compact = false }: { lang: Lang; level: Level; compact?: boolean }) {
  return <span title={chrome[lang].parity.labels[level]} className={`parity-badge parity-${level.replace("/", "")} ${compact ? "parity-compact" : ""}`}><span aria-hidden="true" className="parity-dot" /><span aria-hidden="true" className="parity-symbol">{symbols[level]}</span><span className="parity-label">{chrome[lang].parity.labels[level]}</span></span>;
}

export function ParityPage({ lang }: { lang: Lang }) {
  const c = chrome[lang].parity;
  return <>
    <section className="wrap narrow section parity-hero">
      <p className="parity-eyebrow">{parityItems.length} {c.inventory} <span aria-hidden="true">·</span> {CLIENTS.length} {c.clients}</p>
      <h1>{c.title}</h1>
      <p className="lede">{c.lede}</p>
      <p className="small muted">{c.reviewDate}: {date(clientAssessment.reviewedOn, lang)}. {parityPlan.sequence === "mac-first" ? c.next : ""}</p>
    </section>
    <section className="wrap section parity-explorer" id="comparison"><Island name="ParityExplorer" props={{ lang }} /></section>
    <section className="wrap section parity-method" id="method">
      <h2>{c.legend}</h2>
      <dl className="parity-legend">{LEVELS.map(level => <div key={level}><dt><Badge lang={lang} level={level} /></dt><dd>{c.definitions[level]}</dd></div>)}</dl>
      <div className="parity-acceptance">
        <h3>{c.acceptanceTitle}</h3>
        <p>{c.acceptanceNote}</p>
        <p><strong>{clientAssessment.acceptanceRecords.length ? `${clientAssessment.acceptanceRecords.length} ${c.records}` : c.noRecords}</strong></p>
      </div>
      <h2 className="sub">{c.sources}</h2>
      <p className="muted">{c.sourceNote} {c.technical}</p>
      <p className="more-links">{sourceRepo ? <MoreLink href={sourceRepo.url}>{c.source}</MoreLink> : null}<MoreLink href={paths.download(lang)}>{chrome[lang].downloadTitle}</MoreLink></p>
    </section>
  </>;
}

function FeatureDetails({ item, lang, clients }: { item: ParityItem; lang: Lang; clients: readonly Client[] }) {
  const c = chrome[lang].parity;
  const records = recordsFor(item, clientAssessment, clients);
  const feature = featureById.get(item.id);
  return <details className="parity-detail">
    <summary><span className="parity-disclosure" aria-hidden="true">▸</span><span className="parity-feature-name">{nameFor(item, lang)}</span></summary>
    <div className="parity-detail-body">
      {cleanName(item.name) !== nameFor(item, lang) ? <p>{cleanName(item.name)}</p> : null}
      {feature ? <a href={paths.feature(lang, feature)}>{chrome[lang].more}</a> : null}
      <p className="small muted">{records.length ? `${records.length} ${c.records}` : c.notRecorded}</p>
      {item.note ? <p>{cleanName(item.note)}</p> : null}
      {records.map((record, index) => <p className="small" key={index}>{record.date}: {record.result}. {record.clients.map(client => `${clientLabels[client.id]} ${client.version} (${client.build}), ${client.os}`).join("; ")}</p>)}
    </div>
  </details>;
}

/** Notes and evidence stay with their platform column; the status appears only once. */
function PlatformDetails({ item, lang, client }: { item: ParityItem; lang: Lang; client: Client }) {
  const value = entry(item, client);
  const repos = publicRepos.filter(repo => value.evidence?.some(path => path.startsWith(`bipe-${repo.id}/`)));
  if (!value.reason && !value.note && !repos.length) return null;
  const c = chrome[lang].parity;
  return <div className="parity-cell-details">
    {value.reason ? <p>{cleanName(value.reason)}</p> : null}
    {value.note ? <p>{cleanName(value.note)}</p> : null}
    {repos.map(repo => <a key={repo.id} href={repo.url} title={repo[lang]} aria-label={`${c.source}: ${clientLabels[client]}, ${repo[lang]}`}>{c.source}</a>)}
  </div>;
}

export function ParityExplorer({ lang }: { lang: Lang }) {
  const c = chrome[lang].parity;
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [platform, setPlatform] = useState<Client | "all">("all");
  const [gaps, setGaps] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get("q") ?? "");
    const area = params.get("area");
    if (allGroups.some(group => group.id === area)) setCategory(area!);
    const client = params.get("platform");
    if (CLIENTS.includes(client as Client)) setPlatform(client as Client);
    setGaps(params.get("gaps") === "1");
    setFiltersOpen(Boolean(params.get("area") || params.get("platform") || params.get("gaps")));
    setInitialized(true);
  }, []);
  useEffect(() => {
    if (!initialized) return;
    const url = new URL(window.location.href);
    for (const [key, value] of [["q", query], ["area", category === "all" ? "" : category], ["platform", platform === "all" ? "" : platform], ["gaps", gaps ? "1" : ""]]) {
      if (value) url.searchParams.set(key, value); else url.searchParams.delete(key);
    }
    window.history.replaceState(null, "", url);
  }, [query, category, platform, gaps, initialized]);

  const clients = platform === "all" ? CLIENTS : [platform];
  const search = normalize(query.trim());
  const visible = allGroups.filter(group => category === "all" || group.id === category).map(group => ({ ...group, items: group.items.filter(item => (!gaps || hasGap(item, platform)) && (!search || normalize(`${nameFor(item, lang)} ${item.name} ${item.id}`).includes(search))) })).filter(group => group.items.length);
  const total = visible.reduce((sum, group) => sum + group.items.length, 0);
  const clear = () => { setQuery(""); setCategory("all"); setPlatform("all"); setGaps(false); };
  return <>
    <h2 className="visually-hidden">{c.compare}</h2>
    <div className="parity-toolbar">
      <label className="parity-search">{c.search}<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={c.placeholder} /></label>
      <button className="button secondary compact" type="button" aria-expanded={filtersOpen} aria-controls="parity-filters" onClick={() => setFiltersOpen(!filtersOpen)}>{c.filters}</button>
      <p className="small muted" role="status">{total} {c.showing}</p>
    </div>
    <div id="parity-filters" hidden={!filtersOpen}>
    <div className="parity-filters">
      <label>{c.category}<select value={category} onChange={event => setCategory(event.target.value)}><option value="all">{c.allCategories}</option>{allGroups.map(group => <option key={group.id} value={group.id}>{c.categories[group.id]} ({group.items.length})</option>)}</select></label>
      <label>{c.platform}<select value={platform} onChange={event => setPlatform(event.target.value as Client | "all")}><option value="all">{c.allPlatforms}</option>{CLIENTS.map(client => <option key={client} value={client}>{clientLabels[client]}</option>)}</select></label>
    </div>
    <div className="parity-filter-meta"><label className="parity-toggle"><input type="checkbox" checked={gaps} onChange={event => setGaps(event.target.checked)} />{c.gaps}</label>{query || category !== "all" || platform !== "all" || gaps ? <button type="button" onClick={clear}>{c.clear}</button> : null}</div>
    {gaps ? <p className="small muted">{c.gapsNote}</p> : null}
    </div>
    <p className="parity-mobile-key">{LEVELS.map(level => <span key={level}><span aria-hidden="true">{symbols[level]}</span> {c.labels[level]}</span>)}</p>
    <div className={`parity-scroll ${platform !== "all" ? "parity-single" : ""}`} tabIndex={0} role="region" aria-label={c.compare}>
      <table className="parity-table">
        <caption className="visually-hidden">{c.title}</caption>
        <thead><tr><th scope="col">{c.feature}<span className="parity-header-note">{parityItems.length} {c.total}</span><span className="parity-total-label">{c.implemented} / {c.total}</span></th>{clients.map(client => {
          const values = counts(parityItems, client);
          return <th scope="col" key={client}><span className="parity-client-label">{clientLabels[client]}</span><span className="parity-short-label" aria-hidden="true">{client === "android" ? "And." : client === "windows" ? "Win." : clientLabels[client]}</span><span className="parity-header-value">{values.built + values.testing}<span> / {parityItems.length}</span></span><span className="parity-header-note">{c.implemented}</span></th>;
        })}</tr></thead>
        {visible.map(group => <tbody key={group.id}>
          <tr className="parity-group"><th colSpan={clients.length + 1} scope="colgroup">{c.categories[group.id]} <span>{group.items.length}</span></th></tr>
          {group.items.map(item => <tr key={item.id} id={`feature-${item.id}`}><th scope="row"><FeatureDetails item={item} lang={lang} clients={clients} /></th>{clients.map(client => <td key={client}><Badge lang={lang} level={entry(item, client).level} compact /><PlatformDetails item={item} lang={lang} client={client} /></td>)}</tr>)}
        </tbody>)}
      </table>
      {!total ? <p className="parity-empty">{c.empty}</p> : null}
    </div>
    <p className="small muted">{c.builtNote} <a href="#method">{clientAssessment.acceptanceRecords.length ? `${clientAssessment.acceptanceRecords.length} ${c.records}.` : c.noRecords}</a></p>
  </>;
}

export function parityMarkdown(lang: Lang): string {
  const c = chrome[lang].parity;
  return [`# ${c.title}`, c.lede, `${parityItems.length} ${c.inventory}. ${c.reviewDate}: ${clientAssessment.reviewedOn}.`,
    `## ${c.legend}`, ...LEVELS.map(level => `- **${c.labels[level]}**: ${c.definitions[level]}`), c.acceptanceNote,
    clientAssessment.acceptanceRecords.length ? `${clientAssessment.acceptanceRecords.length} ${c.records}.` : c.noRecords,
    ...allGroups.flatMap(group => [`## ${c.categories[group.id]}`, `| ${c.feature} | ${CLIENTS.map(client => clientLabels[client]).join(" | ")} |`, "|---|---|---|---|---|---|", ...group.items.map(item => `| ${nameFor(item, lang).replaceAll("|", "\\|")} | ${CLIENTS.map(client => c.labels[entry(item, client).level]).join(" | ")} |`)]),
    `## ${c.sources}`, c.sourceNote, sourceRepo ? `[${c.source}](${sourceRepo.url})` : ""].join("\n\n");
}
