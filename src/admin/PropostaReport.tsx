// Staff page /admin/propostas/ (ADR 0158, ADR 0160 in bipe/docs/adr): who read the pitch pages at /proposta/, per
// visitor and per sitting, and the time per deck slide. Named visitors, so no MIN_CELL (ADR 0157).
import { useMemo, useState } from "react";
import { num, Periods, Section, StaffShell, Tiles } from "./staff-ui";

type Visitor = { id: number; email: string; created_at: string; last_seen_at: string | null; page_views: number; max_slide: number | null };
type Step = { at: string; path: string; slide: number | null; title: string | null; seconds: number };
type Sitting = {
  visitor_id: number; email: string; started_at: string; ended_at: string; seconds: number;
  place: string | null; referrer: string | null; utm: Record<string, string>; steps: Step[];
};
type Report = { days: number; visitors: Visitor[]; sittings: Sitting[] };

const PERIODS = [7, 30, 90, 365] as const;
const periodLabel = (d: number) => (d === 365 ? "1 ano" : `${d} dias`);
// Same threshold as the summary email in bipe-api (SKIP_MS).
const SKIP_S = 5;

const PAGES: Record<string, string> = { "/proposta/": "Página inicial", "/proposta/deck/": "Apresentação", "/proposta/caso/": "Caso" };
const pageName = (path: string) => PAGES[path] ?? path;
const stepName = (s: Step) => (s.slide === null ? pageName(s.path) : `${s.slide}. ${s.title ?? "Slide"}`);
const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "-");
const host = (origin: string | null) => (origin ? origin.replace(/^https?:\/\//, "") : null);
const tags = (utm: Record<string, string>) => Object.entries(utm).map(([k, v]) => `${k.replace(/^utm_/, "")}=${v}`).join(" ");

type SlideRow = { slide: number; title: string | null; seconds: number; seen: number; skipped: number; left: number };

/** Per deck slide over the given sittings: total time, sittings that showed it, quick skips and exits. */
function slideRows(sittings: Sitting[]): SlideRow[] {
  const rows = new Map<number, SlideRow>();
  for (const s of sittings) {
    const seen = new Set<number>();
    s.steps.forEach((t, i) => {
      if (t.slide === null) return;
      const r = rows.get(t.slide) ?? { slide: t.slide, title: null, seconds: 0, seen: 0, skipped: 0, left: 0 };
      r.title ??= t.title;
      r.seconds += t.seconds;
      if (!seen.has(t.slide)) { r.seen++; seen.add(t.slide); }
      const last = i === s.steps.length - 1;
      if (last) r.left++;
      else if (t.seconds < SKIP_S) r.skipped++;
      rows.set(t.slide, r);
    });
  }
  return [...rows.values()].sort((a, b) => a.slide - b.slide);
}

export function PropostaReport(_: Record<string, never>) {
  const [days, setDays] = useState<(typeof PERIODS)[number]>(30);
  return (
    <StaffShell<Report> page="propostas" api={`/v1/admin/proposta?days=${days}`} title="Propostas"
      tools={<Periods options={PERIODS} value={days} onChange={setDays} label={periodLabel} />}>
      {(r) => <Body report={r} />}
    </StaffShell>
  );
}

function Body({ report }: { report: Report }) {
  const [focus, setFocus] = useState<number | null>(null);
  const byVisitor = useMemo(() => {
    const m = new Map<number, { sittings: number; seconds: number }>();
    for (const s of report.sittings) {
      const v = m.get(s.visitor_id) ?? { sittings: 0, seconds: 0 };
      v.sittings++; v.seconds += s.seconds;
      m.set(s.visitor_id, v);
    }
    return m;
  }, [report]);
  const sittings = focus === null ? report.sittings : report.sittings.filter((s) => s.visitor_id === focus);
  const slides = useMemo(() => slideRows(sittings), [sittings]);
  const who = focus === null ? null : report.visitors.find((v) => v.id === focus)?.email ?? null;
  const active = report.visitors.filter((v) => v.page_views > 0);
  const total = report.sittings.reduce((t, s) => t + s.seconds, 0);
  const furthest = Math.max(0, ...report.visitors.map((v) => v.max_slide ?? 0));

  const tiles = [
    { label: "Pessoas", value: num(active.length), sub: `${num(report.visitors.length)} com acesso` },
    { label: "Sessões", value: num(report.sittings.length) },
    { label: "Tempo total", value: clock(total) },
    { label: "Slide mais longe", value: furthest || "-" },
  ];
  const toggle = (id: number) => setFocus(focus === id ? null : id);

  return (
    <>
      <Tiles items={tiles} />

      <Section title="Pessoas">
        {report.visitors.length === 0 ? <p>Nenhuma pessoa.</p> : (
          <div className="staff-scroll">
            <table className="staff-table">
              <thead><tr><th>Email</th><th>Última visita</th><th className="num">Páginas</th><th className="num">Slide mais longe</th><th className="num">Sessões</th><th className="num">Tempo</th></tr></thead>
              <tbody>
                {report.visitors.map((v) => {
                  const t = byVisitor.get(v.id);
                  return (
                    <tr key={v.id} className={focus === v.id ? "focus" : undefined}>
                      <td>{t ? <button className="linklike" onClick={() => toggle(v.id)}><strong>{v.email}</strong></button> : <span className="muted">{v.email}</span>}</td>
                      <td>{when(v.last_seen_at)}</td>
                      <td className="num">{num(v.page_views)}</td>
                      <td className="num">{v.max_slide ?? "-"}</td>
                      <td className="num">{t ? num(t.sittings) : "-"}</td>
                      <td className="num">{t ? clock(t.seconds) : "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title={who ? `Slides, ${who}` : "Slides"} aside={who && <button className="linklike small" onClick={() => setFocus(null)}>Todas as pessoas</button>}>
        <Slides rows={slides} />
      </Section>

      <Section title={who ? `Sessões, ${who}` : "Sessões"}>
        {sittings.length === 0 ? <p>Nenhuma sessão.</p> : sittings.map((s, i) => <SittingCard key={`${s.visitor_id}-${s.started_at}`} s={s} open={i === 0} showEmail={focus === null} />)}
      </Section>
    </>
  );
}

function Slides({ rows }: { rows: SlideRow[] }) {
  if (rows.length === 0) return <p>Nenhum slide.</p>;
  const max = Math.max(1, ...rows.map((r) => r.seconds));
  return (
    <div className="staff-scroll">
      <table className="staff-table">
        <thead><tr><th>Slide</th><th className="num">Tempo</th><th className="num">Média</th><th className="num">Sessões</th><th className="num">Menos de {SKIP_S} s</th><th className="num">Saiu aqui</th><th aria-hidden="true"></th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.slide}>
              <td><span className="muted">{r.slide}.</span> {r.title ?? <span className="muted">Sem título</span>}</td>
              <td className="num"><strong>{clock(r.seconds)}</strong></td>
              <td className="num">{clock(Math.round(r.seconds / r.seen))}</td>
              <td className="num">{num(r.seen)}</td>
              <td className="num">{r.skipped || <span className="muted">0</span>}</td>
              <td className="num">{r.left || <span className="muted">0</span>}</td>
              <td className="staff-bar-cell"><span className="staff-bar" style={{ width: `${(100 * r.seconds) / max}%` }} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SittingCard({ s, open, showEmail }: { s: Sitting; open: boolean; showEmail: boolean }) {
  const max = Math.max(1, ...s.steps.map((t) => t.seconds));
  const utm = tags(s.utm);
  return (
    <details className="staff-sitting" open={open}>
      <summary>
        <span className="staff-sitting-head">
          {showEmail && <strong>{s.email}</strong>}
          <span>{when(s.started_at)}</span>
          <span className="num"><strong>{clock(s.seconds)}</strong></span>
        </span>
        <span className="staff-sitting-meta small muted">
          <span>{s.place ?? "Lugar desconhecido"}</span>
          <span>{host(s.referrer) ?? "Direto"}</span>
          {utm && <span className="mono">{utm}</span>}
        </span>
      </summary>
      <div className="staff-scroll">
        <table className="staff-table">
          <thead><tr><th>#</th><th>Página ou slide</th><th className="num">Tempo</th><th aria-hidden="true"></th></tr></thead>
          <tbody>
            {s.steps.map((t, i) => (
              <tr key={`${t.at}-${i}`}>
                <td className="muted">{i + 1}</td>
                <td>{stepName(t)}{t.slide !== null && i === 0 && <span className="small muted"> {pageName(t.path)}</span>}</td>
                <td className="num">{i === s.steps.length - 1 && t.seconds === 0 ? <span className="muted">-</span> : clock(t.seconds)}</td>
                <td className="staff-bar-cell"><span className="staff-bar" style={{ width: `${(100 * t.seconds) / max}%` }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
