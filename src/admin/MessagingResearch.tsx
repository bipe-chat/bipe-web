import { useState } from "react";
import type { MessagingResearch as Research, ResearchFeature, ResearchStatus } from "../../../bipe-shared/api/internal-research";
import { StaffShell } from "./staff-ui";
import "./research.css";

type View = "matrix" | "platforms" | "strategy" | "evidence";
const VIEWS: { id: View; label: string }[] = [{ id: "matrix", label: "Feature map" }, { id: "platforms", label: "Platform research" }, { id: "strategy", label: "Bipe strategy" }, { id: "evidence", label: "Evidence and method" }];
const STATUS: Record<ResearchStatus, string> = { available: "Documented", limited: "Conditional", announced: "Announced / rollout", unsupported: "Not supported", unknown: "Unverified" };
const SURFACES = ["ios", "android", "web", "server"];

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function MessagingResearch(_: Record<string, never>) {
  return <StaffShell<Research> page="pesquisa" api="/v1/admin/research/messaging" title="Pesquisa e estratégia">
    {(data) => <div className="research" lang="en"><ResearchContent data={data} /></div>}
  </StaffShell>;
}

/** Exported for the local visual fixture. Production only renders after the staff API succeeds. */
export function ResearchContent({ data }: { data: Research }) {
  const [view, setView] = useState<View>("matrix");
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("all");
  const [priority, setPriority] = useState("all");
  const [stance, setStance] = useState("all");
  const [readiness, setReadiness] = useState("all");
  const [selected, setSelected] = useState<string[]>(["whatsapp", "telegram", "signal"]);
  const sources = new Map(data.sources.map((s, i) => [s.id, { ...s, number: i + 1 }]));
  const ledger = new Map(data.snapshot.capabilities.map((c) => [c.id, c]));
  const visiblePlatforms = data.platforms.filter((p) => selected.includes(p.id));
  const term = query.trim().toLocaleLowerCase();
  const statusOf = (row: ResearchFeature) => row.bipe.ledger.flatMap((id) => {
    const item = ledger.get(id);
    return item ? [item.surfaces.ios?.status, item.surfaces.android?.status] : [];
  });
  const rows = data.features.filter((row) => {
    if (group !== "all" && row.group !== group) return false;
    if (priority !== "all" && row.priority !== priority) return false;
    if (stance !== "all" && row.stance !== stance) return false;
    const statuses = statusOf(row);
    if (readiness === "planned" && !statuses.includes("planned")) return false;
    if (readiness === "unverified" && statuses.length > 0 && statuses.every((s) => s === "testing" || s === "policy")) return false;
    return !term || [row.name, row.job, row.implication, row.acceptance, row.bipe.detail, ...Object.values(row.platforms).map((c) => c.detail)].join(" ").toLocaleLowerCase().includes(term);
  });
  const stale = new Date().toISOString().slice(0, 10) > data.reviewAfter;
  const unknowns = data.features.reduce((n, row) => n + Object.values(row.platforms).filter((c) => c.status === "unknown").length, 0);
  const jump = (id: string, target: View) => {
    setView(target);
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const refs = (ids: string[]) => <span className="research-refs">{ids.map((id) => {
    const s = sources.get(id);
    return s ? <a key={id} href={`#source-${id}`} title={s.title} onClick={(e) => { e.preventDefault(); jump(`source-${id}`, "evidence"); }}>[{s.number}]</a> : null;
  })}</span>;
  const issue = (number: number) => <a key={number} href={`https://github.com/bipe-chat/bipe/issues/${number}`} target="_blank" rel="noreferrer">#{number}</a>;
  const exportCsv = () => {
    const quote = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const list = [
      ["Reviewed", "Group", "Feature", "Job", "Priority (proposal)", "Stance (proposal)", "Bipe evidence", "Bipe mobile statuses", ...visiblePlatforms.flatMap((p) => [`${p.name}: status`, `${p.name}: detail`, `${p.name}: sources`]), "Implication", "Acceptance evidence", "Issues"],
      ...rows.map((row) => [data.reviewed, row.group, row.name, row.job, row.priority, row.stance, row.bipe.detail, row.bipe.ledger.map((id) => { const c = ledger.get(id); return `${id}: iOS ${c?.surfaces.ios?.status ?? "unverified"}, Android ${c?.surfaces.android?.status ?? "unverified"}`; }).join("; "), ...visiblePlatforms.flatMap((p) => { const c = row.platforms[p.id]!; return [STATUS[c.status], c.detail, c.sources.map((id) => sources.get(id)?.url ?? sources.get(id)?.path ?? id).join("; ")]; }), row.implication, row.acceptance, row.issues.map((n) => `https://github.com/bipe-chat/bipe/issues/${n}`).join("; ")]),
    ];
    download(`bipe-messaging-parity-${data.reviewed}.csv`, "\uFEFF" + list.map((row) => row.map(quote).join(",")).join("\r\n"), "text/csv;charset=utf-8");
  };
  return <>
    <div className="research-meta"><span>Internal research · {data.reviewed}</span><span>Review by {data.reviewAfter}</span></div>
    {stale ? <p className="research-alert" role="status">Review due. Treat this as the dated snapshot shown below until the evidence is refreshed.</p> : null}
    <p className="research-summary">{data.summary}</p>
    <div className="research-stats" aria-label="Research scope">
      <div><strong>{data.features.length}</strong><span>capabilities</span></div>
      <div><strong>{data.groups.length}</strong><span>feature groups</span></div>
      <div><strong>{data.platforms.length}</strong><span>comparison platforms</span></div>
      <div><strong>{data.sources.length}</strong><span>dated sources</span></div>
    </div>
    <nav className="research-tabs" aria-label="Research sections">{VIEWS.map((tab) => <button key={tab.id} className={view === tab.id ? "active" : ""} aria-current={view === tab.id ? "page" : undefined} onClick={() => setView(tab.id)}>{tab.label}</button>)}</nav>
    {view === "matrix" ? <>
      <h2>Feature map</h2>
      <p className="small muted">Bipe is always shown. Compare selected platforms, then open a row for source and release evidence. Priority and stance are proposals.</p>
      <div className="research-controls">
        <label className="research-search">Search features, evidence or implications<input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Try recovery, CNPJ or voice" /></label>
        <label>Feature group<select value={group} onChange={(e) => setGroup(e.target.value)}><option value="all">All groups</option>{data.groups.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}</select></label>
        <label>Priority<select value={priority} onChange={(e) => setPriority(e.target.value)}><option value="all">All priorities</option>{["P0", "P1", "P2", "Later"].map((p) => <option key={p}>{p}</option>)}</select></label>
        <label>Strategic stance<select value={stance} onChange={(e) => setStance(e.target.value)}><option value="all">All stances</option>{["Match", "Differentiate", "Validate", "Defer"].map((s) => <option key={s}>{s}</option>)}</select></label>
        <label>Bipe evidence<select value={readiness} onChange={(e) => setReadiness(e.target.value)}><option value="all">All evidence</option><option value="unverified">Not fully in tester builds</option><option value="planned">Includes planned work</option></select></label>
      </div>
      <fieldset className="research-platform-picker"><legend>Compare with Bipe</legend>{data.platforms.map((p) => <label key={p.id}><input type="checkbox" checked={selected.includes(p.id)} onChange={(e) => setSelected((prev) => e.target.checked ? [...prev, p.id] : prev.filter((id) => id !== p.id))} />{p.name}</label>)}</fieldset>
      <div className="research-table-actions"><p role="status" aria-live="polite">{rows.length} of {data.features.length} capabilities</p><button className="button secondary" onClick={exportCsv}>Export current view · CSV</button></div>
      <p className="small research-legend">{Object.entries(STATUS).map(([status, label]) => <span key={status} className={`research-status ${status}`}>{label}</span>)}</p>
      {rows.length === 0 ? <p className="card" role="status">No capabilities match these filters. Clear the search or change a filter.</p> : data.groups.filter((g) => rows.some((row) => row.group === g.id)).map((g) => <section className="research-group" key={g.id}>
        <h3>{g.title}</h3><p className="muted">{g.question}</p>
        <div className="research-table-scroll" tabIndex={0} role="region" aria-label={`${g.title} comparison table`}><table className="research-table">
          <caption className="research-sr">{g.question} Evidence reviewed {data.reviewed}.</caption>
          <thead><tr><th scope="col">Capability / intent</th><th scope="col">Bipe · current evidence</th>{visiblePlatforms.map((p) => <th scope="col" key={p.id}>{p.name}</th>)}</tr></thead>
          <tbody>{rows.filter((row) => row.group === g.id).map((row) => <tr key={row.id} id={`feature-${row.id}`}>
            <th scope="row"><strong>{row.name}</strong><p className="small muted">{row.job}</p><span className="research-priority">{row.priority}</span> <span className="small">{row.stance}</span>
              <details className="research-implication"><summary>Implication and next evidence</summary><p>{row.implication}</p><strong>Acceptance evidence</strong><p>{row.acceptance}</p><div className="research-refs">{row.issues.map(issue)}</div></details>
            </th>
            <td><p>{row.bipe.detail} {refs(row.bipe.sources)}</p><details><summary>Implementation evidence</summary>
              {row.bipe.ledger.length === 0 ? <p className="small muted">No dedicated release-status entry. Code or decision evidence does not certify release availability.</p> : row.bipe.ledger.map((id) => { const c = ledger.get(id); return c ? <div className="research-capability" key={id}><strong>{c.name}</strong><dl className="research-surface-list">{SURFACES.map((surface) => <div key={surface}><dt>{surface}</dt><dd><span className={`research-build ${c.surfaces[surface]?.status}`}>{c.surfaces[surface]?.status}</span></dd></div>)}</dl>{c.note ? <p className="small">{c.note}</p> : null}{SURFACES.map((surface) => c.surfaces[surface]?.evidence?.map((path) => <code key={path}>{path}</code>))}{c.issue ? <p>{issue(c.issue)}</p> : null}</div> : null; })}
              {row.bipe.evidence.map((path) => <code key={path}>{path}</code>)}
            </details></td>
            {visiblePlatforms.map((p) => { const c = row.platforms[p.id]!; return <td key={p.id}><span className={`research-status ${c.status}`}>{STATUS[c.status]}</span><p>{c.detail} {refs(c.sources)}</p></td>; })}
          </tr>)}</tbody>
        </table></div>
      </section>)}
    </> : null}
    {view === "platforms" ? <section><h2>Platform research</h2><p className="muted">The role and lesson are analyst judgments. Sources support the product facts.</p><div className="research-profiles">{data.platforms.map((p) => <article className="card" key={p.id}><p className="small muted">{p.role}</p><h3>{p.name}</h3><p className="small">Scope: {p.scope}</p><h4>What to learn from</h4><ul>{p.strengths.map((s) => <li key={s}>{s}</li>)}</ul><h4>Boundaries</h4><ul>{p.limits.map((s) => <li key={s}>{s}</li>)}</ul><p><strong>For Bipe:</strong> {p.lesson}</p>{refs(p.sources)}<button className="linklike research-compare" onClick={() => { setSelected([p.id]); setView("matrix"); }}>Compare this platform with Bipe →</button></article>)}</div></section> : null}
    {view === "strategy" ? <section><h2>Bipe strategy</h2><p className="research-alert">This is a dated synthesis of existing ADRs, followed by research recommendations. The canonical Starlings strategy was unavailable for rereading. It does not change accepted decisions or tracker milestones.</p><div className="research-profiles">{data.strategy.map((s) => <article className="card" key={s.title}><span className={`research-build ${s.status === "Proposal" ? "planned" : "policy"}`}>{s.status}</span><h3>{s.title}</h3><p>{s.detail}</p>{refs(s.sources)}</article>)}</div><h2>Recommended sequence</h2><p className="muted">Validation gates, not delivery dates or commitments.</p>{data.priorities.map((p) => <article className="card research-sequence" key={p.id}><h3>{p.title}</h3><p>{p.detail}</p><p><strong>Evidence to proceed:</strong> {p.gate}</p><div className="research-feature-links">{p.features.map((id) => <a key={id} href={`#feature-${id}`} onClick={(e) => { e.preventDefault(); setQuery(""); setGroup("all"); setPriority("all"); setStance("all"); setReadiness("all"); jump(`feature-${id}`, "matrix"); }}>{data.features.find((f) => f.id === id)?.name}</a>)}</div>{refs(p.sources)}</article>)}</section> : null}
    {view === "evidence" ? <section><h2>Evidence and method</h2><p>{unknowns} comparison cells remain unverified. They are research gaps, not claims that a platform lacks a feature.</p><ol className="research-method">{data.methodology.map((m) => <li key={m}>{m}</li>)}</ol><button className="button secondary" onClick={() => download(`bipe-messaging-research-${data.reviewed}.json`, JSON.stringify(data, null, 2), "application/json")}>Download complete research · JSON</button>
      <h3>Watchlist and contradictions</h3>{data.watchlist.map((w) => <article className="card research-sequence" key={w.title}><h4>{w.title}</h4><p>{w.detail}</p>{refs(w.sources)}</article>)}
      <h3>Bipe snapshot</h3><p>Registers captured {data.snapshot.captured}. {data.snapshot.capabilities.length} capability records; {data.snapshot.issues.length} open issue summaries from {data.snapshot.issuesCaptured}. Built and testing remain separate.</p><div className="research-table-scroll"><table><thead><tr><th>Register</th><th>Source revision</th><th>SHA-256</th></tr></thead><tbody>{data.snapshot.inputs.map((i) => <tr key={i.path}><td><code>{i.path}</code>{i.dirty ? " (local changes)" : ""}</td><td><code>{i.revision}</code></td><td><code>{i.sha256}</code></td></tr>)}</tbody></table></div>
      <h3>Source register</h3><ol className="research-source-list">{data.sources.map((s, i) => <li id={`source-${s.id}`} key={s.id}><strong>[{i + 1}] {s.title}</strong><p className="small muted">{s.kind === "primary" ? "Primary vendor source" : "Internal evidence"} · checked {s.checked}</p>{s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.url}</a> : <code>{s.path}</code>}{s.note ? <p>{s.note}</p> : null}</li>)}</ol>
    </section> : null}
  </>;
}
