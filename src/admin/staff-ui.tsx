// Shared frame and formatters for every staff page. Copy rule (#368): data and labels only.
// The frame (nav, trail, header) renders before sign-in: it holds no data.
import type { ReactNode } from "react";
import { StaffGateView, useStaffData } from "./staff-auth";
import { STAFF_CONSOLE, STAFF_GROUPS, STAFF_INDEX, STAFF_LINKS, type StaffPage, type StaffPageInfo } from "./staff-pages";

const pages = Object.entries(STAFF_CONSOLE as Record<string, StaffPageInfo>);

function StaffNav({ page }: { page: StaffPage }) {
  const here = (key: string) => (key === page ? "page" : undefined);
  return (
    <nav className="staff-nav" aria-label="Equipe">
      <a className="staff-nav-home" href={STAFF_INDEX} aria-current={here("index")}>Painel</a>
      {STAFF_GROUPS.map((g) => (
        <div key={g} className="staff-nav-group">
          <span className="staff-nav-label">{g}</span>
          {pages.filter(([, p]) => p.group === g && p.path).map(([key, p]) => <a key={key} href={p.path} aria-current={here(key)}>{p.title}</a>)}
        </div>
      ))}
      <div className="staff-nav-group">
        <span className="staff-nav-label">Outros</span>
        {STAFF_LINKS.map((l) => <a key={l.href} href={l.href}>{l.title} ↗</a>)}
      </div>
    </nav>
  );
}

/** Painel, group, page. The index has no trail. */
function Trail({ page, title }: { page: Exclude<StaffPage, "index">; title: string }) {
  return (
    <nav className="crumbs small staff-crumbs" aria-label="Trilha">
      <ol>
        <li><a href={STAFF_INDEX}>Painel</a></li>
        <li>{(STAFF_CONSOLE[page] as StaffPageInfo).group}</li>
        <li><span aria-current="page">{title}</span></li>
      </ol>
    </nav>
  );
}

/**
 * Signed in as staff: nav, trail, title row with the page's controls and Sair, then the report.
 * Before that: the title and the sign-in gate only. The static HTML names no other staff page.
 */
export function StaffShell<T>({ page, api, title, tools, children }: {
  page: StaffPage; api: string | readonly string[]; title: string; tools?: ReactNode; children: (data: T) => ReactNode;
}) {
  const { state, signedIn, signIn, signOut } = useStaffData<T>(page, api);
  // Signed in and still loading: keep the frame, so a page switch does not flash.
  if (state.kind !== "ready" && !(state.kind === "loading" && signedIn)) return (
    <div className="staff-app staff-gate">
      <div className="staff-main">
        <h1>{title}</h1>
        <StaffGateView state={state} signIn={signIn} signOut={signOut} />
      </div>
    </div>
  );
  return (
    <div className="staff-app">
      <StaffNav page={page} />
      <div className="staff-main">
        {page !== "index" && <Trail page={page} title={title} />}
        <header className="staff-head">
          <h1>{title}</h1>
          <div className="staff-head-tools">
            {tools}
            <button className="button secondary compact" onClick={signOut}>Sair</button>
          </div>
        </header>
        {state.kind === "ready" ? children(state.data) : <p className="muted">Carregando…</p>}
      </div>
    </div>
  );
}

/** One section of a staff page: a heading, optional controls on the right, then the body. */
export function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="staff-section">
      <div className="staff-section-head"><h2>{title}</h2>{aside}</div>
      {children}
    </section>
  );
}

/** Period buttons in the title row. */
export function Periods<V extends number>({ options, value, onChange, label = (v) => `${v} dias` }: {
  options: readonly V[]; value: V; onChange: (v: V) => void; label?: (v: V) => string;
}) {
  return (
    <div className="staff-seg" role="group" aria-label="Período">
      {options.map((v) => <button key={v} aria-pressed={v === value} onClick={() => onChange(v)}>{label(v)}</button>)}
    </div>
  );
}

export type Tile = { label: string; value: ReactNode; sub?: ReactNode; href?: string; warn?: boolean };

export function Tiles({ items }: { items: Tile[] }) {
  return (
    <div className="staff-tiles">
      {items.map((t) => {
        const body = <><span className="staff-tile-label">{t.label}</span><strong>{t.value}</strong>{t.sub !== undefined && <span className="staff-tile-sub">{t.sub}</span>}</>;
        const cls = `staff-tile${t.warn ? " warn" : ""}`;
        return t.href ? <a className={cls} key={t.label} href={t.href}>{body}</a> : <div className={cls} key={t.label}>{body}</div>;
      })}
    </div>
  );
}

const nf = new Intl.NumberFormat("pt-BR");
const pf = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
export const num = (n: number | null | undefined) => (n === null || n === undefined ? "-" : nf.format(n));
/** A percent value from the API (already in percent). */
export const pctOf = (n: number | null | undefined) => (n === null || n === undefined ? "-" : `${pf.format(n)}%`);
/** A percent change with its sign and arrow. */
export const delta = (n: number | null | undefined) => (n === null || n === undefined ? "-" : `${n > 0 ? "▲ +" : n < 0 ? "▼ " : ""}${pf.format(n)}%`);
export const fmtDate = (iso: string | null) => (iso ? new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString("pt-BR") : "-");
export const daysSince = (iso: string | null) => (iso ? Math.floor((Date.now() - Date.parse(iso)) / 86_400_000) : null);
export const pct = (a: number | null, b: number | null) => (a === null || !b ? "-" : `${Math.round((100 * a) / b)}%`);
export const small = (n: number | null) => (n === null ? "< 3" : String(n));
