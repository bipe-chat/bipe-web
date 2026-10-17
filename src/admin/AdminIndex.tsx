// Staff dashboard /admin/ (bipe#372, bipe#394): growth rates and series from /v1/admin/metrics, queues from
// /v1/admin/summary. The API computes every rate from raw counts; a count of 1 or 2 arrives as null (bipe#371).
// A null part means its source is off or failed: its tiles show "-".
import { useState, type ReactNode } from "react";
import { STAFF_CONSOLE } from "./staff-pages";
import { delta, num, pctOf, Periods, Section, small, StaffShell, Tiles, type Tile } from "./staff-ui";

type Window = { now: number | null; before: number | null; change: number | null };
type Day = { day: string; signups: number | null; joins: number | null; waitlist: number | null; active: number | null; visitors: number | null };
type Week = { end: string; signups: number | null; joins: number | null; waitlist: number | null; visitors: number | null };
type Metrics = {
  min_cell: number;
  today: string;
  accounts: number | null;
  growth: {
    signups_7d: Window; signups_28d: Window; joins_28d: Window;
    accounts_weekly_pct: number | null; accounts_28d_pct: number | null; invite_share_28d_pct: number | null;
  };
  engagement: { dau: number | null; wau: number | null; mau: number | null; dau_mau_pct: number | null; wau_mau_pct: number | null; activation_28d_pct: number | null } | null;
  site: { visitors_7d: Window; visitors_28d: Window; signup_per_visitor_28d_pct: number | null } | null;
  waitlist: { joins_7d: Window; joins_28d: Window } | null;
  series: Day[];
  weeks: Week[];
  sources: Record<"signups" | "joins" | "waitlist" | "active" | "visitors", boolean>;
};
type Summary = {
  experimentos: { id: string; visitors: number } | null;
  espera: { waiting: number } | null;
  empresas: { awaiting_proof: number; verified: number } | null;
  denuncias: { reports_7d: number } | null;
  lgpd: { over: number } | null;
};

const PERIODS = [28, 91, 182, 364] as const;
const periodLabel = (d: number) => (d === 364 ? "1 ano" : `${Math.round(d / 7)} sem.`);
const path = (k: keyof typeof STAFF_CONSOLE) => (STAFF_CONSOLE[k] as { path?: string }).path;

export function AdminIndex(_: Record<string, never>) {
  const [days, setDays] = useState<(typeof PERIODS)[number]>(91);
  return (
    <StaffShell<[Metrics, Summary]> page="index" api={[`/v1/admin/metrics?days=${days}`, "/v1/admin/summary"]} title="Painel"
      tools={<Periods options={PERIODS} value={days} onChange={setDays} label={periodLabel} />}>
      {([m, s]) => <Dashboard m={m} s={s} />}
    </StaffShell>
  );
}

const windowTile = (label: string, w: Window | undefined, href?: string): Tile =>
  ({ label, value: w ? small(w.now) : "-", sub: w ? delta(w.change) : undefined, href });

function Dashboard({ m, s }: { m: Metrics; s: Summary }) {
  const g = m.growth, e = m.engagement;
  const [by, setBy] = useState<"week" | "day">("week");
  const queues: Tile[] = [
    { label: "Empresas sem prova", value: num(s.empresas?.awaiting_proof), href: path("empresas"), warn: Boolean(s.empresas?.awaiting_proof) },
    { label: "Denúncias, 7 dias", value: num(s.denuncias?.reports_7d), href: path("denuncias"), warn: Boolean(s.denuncias?.reports_7d) },
    { label: "LGPD fora do prazo", value: num(s.lgpd?.over), href: path("lgpd"), warn: Boolean(s.lgpd?.over) },
    { label: "Lista de espera", value: num(s.espera?.waiting), sub: "esperando", href: path("espera") },
    { label: "Título em teste", value: num(s.experimentos?.visitors), sub: s.experimentos?.id ?? "-", href: path("experimentos") },
  ];
  return (
    <>
      <Section title="Crescimento" aside={<a className="small" href={path("crescimento")}>Funil e retenção</a>}>
        <Tiles items={[
          { label: "Contas", value: small(m.accounts), sub: g.accounts_28d_pct === null ? undefined : `${delta(g.accounts_28d_pct)} em 28 d` },
          { label: "Crescimento semanal", value: pctOf(g.accounts_weekly_pct), sub: "média de 4 semanas" },
          windowTile("Cadastros, 7 dias", g.signups_7d),
          windowTile("Cadastros, 28 dias", g.signups_28d),
          { label: "Via convite, 28 dias", value: pctOf(g.invite_share_28d_pct), sub: `${small(g.joins_28d.now)} entradas`, href: path("convites") },
        ]} />
      </Section>

      <Section title="Ritmo" aside={
        <div className="staff-seg" role="group" aria-label="Agrupar">
          <button aria-pressed={by === "week"} onClick={() => setBy("week")}>Semana</button>
          <button aria-pressed={by === "day"} onClick={() => setBy("day")}>Dia</button>
        </div>}>
        <Charts m={m} by={by} />
      </Section>

      <Section title="Uso">
        <Tiles items={[
          { label: "Ativos ontem", value: e ? small(e.dau) : "-" },
          { label: "Ativos, 7 dias", value: e ? small(e.wau) : "-" },
          { label: "Ativos, 30 dias", value: e ? small(e.mau) : "-" },
          { label: "Diário / mensal", value: pctOf(e?.dau_mau_pct), sub: `semanal / mensal ${pctOf(e?.wau_mau_pct)}` },
          { label: "Ativação, 28 dias", value: pctOf(e?.activation_28d_pct), sub: "primeira mensagem" },
        ]} />
      </Section>

      <Section title="Site e espera" aside={<a className="small" href={path("visitas")}>Visitas por estado</a>}>
        <Tiles items={[
          windowTile("Visitas, 7 dias", m.site?.visitors_7d),
          windowTile("Visitas, 28 dias", m.site?.visitors_28d),
          { label: "Visita para cadastro", value: pctOf(m.site?.signup_per_visitor_28d_pct), sub: "28 dias" },
          windowTile("Lista de espera, 7 dias", m.waitlist?.joins_7d, path("espera")),
          windowTile("Lista de espera, 28 dias", m.waitlist?.joins_28d, path("espera")),
        ]} />
      </Section>

      <Section title="Filas">
        <Tiles items={queues} />
      </Section>
    </>
  );
}

type Point = { key: string; label: string; value: number | null };
type Series = { title: string; points: Point[]; live: boolean };

function Charts({ m, by }: { m: Metrics; by: "week" | "day" }) {
  const dayLabel = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
  const weekly = (f: keyof Omit<Week, "end">): Point[] => m.weeks.map((w) => ({ key: w.end, label: `semana até ${dayLabel(w.end)}`, value: w[f] }));
  const daily = (f: keyof Omit<Day, "day">): Point[] => m.series.map((d) => ({ key: d.day, label: dayLabel(d.day), value: d[f] }));
  const pick = (f: keyof Omit<Week, "end">) => (by === "week" ? weekly(f) : daily(f));
  const charts: Series[] = [
    { title: "Cadastros", points: pick("signups"), live: m.sources.signups },
    { title: "Entradas por convite", points: pick("joins"), live: m.sources.joins },
    { title: "Visitas do Brasil", points: pick("visitors"), live: m.sources.visitors },
    { title: "Lista de espera", points: pick("waitlist"), live: m.sources.waitlist },
    // A weekly sum of daily active people counts a person once per day, so this chart is daily only.
    { title: "Ativos por dia", points: daily("active"), live: m.sources.active },
  ];
  return (
    <div className="staff-charts">
      {charts.map((c) => <Bars key={c.title} series={c} minCell={m.min_cell} />)}
    </div>
  );
}

/** One series as bars, newest on the right. A null in a live source is a count below min_cell: a short pale bar. */
function Bars({ series, minCell }: { series: Series; minCell: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const { points, live } = series;
  const max = Math.max(minCell, ...points.map((p) => p.value ?? 0));
  const last = points[points.length - 1];
  const shown = hover === null ? last : points[hover];
  const read = (p: Point | undefined): ReactNode => (p ? <><b>{p.value === null ? `< ${minCell}` : num(p.value)}</b> <span className="muted">{p.label}</span></> : null);
  return (
    <figure className="staff-chart">
      <figcaption>
        <span className="staff-chart-title">{series.title}</span>
        <span className="staff-chart-read">{live ? read(shown) : <span className="muted">-</span>}</span>
      </figcaption>
      {live ? (
        <>
          <div className="staff-bars" onMouseLeave={() => setHover(null)} role="img"
            aria-label={`${series.title}: ${points.map((p) => `${p.label} ${p.value ?? `< ${minCell}`}`).join(", ")}`}>
            <span className="staff-bars-max">{num(max)}</span>
            {points.map((p, i) => (
              <span key={p.key} className={`staff-bar-col${hover === i ? " on" : ""}`} onMouseEnter={() => setHover(i)}>
                <span className={`staff-bar-v${p.value === null ? " low" : ""}`}
                  style={{ height: `${p.value === null ? (100 * (minCell - 1)) / max : (100 * p.value) / max}%` }} />
              </span>
            ))}
          </div>
          <div className="staff-bars-axis"><span>{points[0]?.label.replace(/^semana até /, "")}</span><span>{last?.label.replace(/^semana até /, "")}</span></div>
        </>
      ) : <p className="muted small">Fonte desligada.</p>}
    </figure>
  );
}
