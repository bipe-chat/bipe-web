// Staff page /admin/crescimento/ (bipe#373, ADR 0098): sign-up funnel and retention by sign-up week.
// Aggregates only. The API returns null for a count of 1 or 2 and hides small weeks (bipe#371).
import { useState } from "react";
import { Periods, StaffShell } from "./staff-ui";

export type Growth = {
  since: string;
  min_cell: number;
  funnel: { step: string; users: number | null }[];
  retention: { week: string; signups: number | null; days: { day: number; kept: number | null; due: number }[] }[];
  totals: { event: string; users: number | null; count: number | null }[];
};

// Staff labels for the growth events in bipe-shared registries/growth-events.json.
const LABEL: Record<string, string> = {
  signup_done: "Criou a conta",
  onboarding_finished: "Terminou o início",
  first_message_sent: "Mandou a primeira mensagem",
  contact_verified: "Verificou um contato",
  invite_sent: "Mandou um convite",
  invite_redeemed: "Entrou por convite",
  group_created: "Criou um grupo",
  call_started: "Começou uma chamada",
  active_day: "Dia ativo",
};
export const eventLabel = (id: string) => LABEL[id] ?? id;

const PERIODS = [30, 90, 365] as const;
const dayAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
const pct = (a: number | null, b: number | null) => (a === null || !b ? "-" : `${Math.round((100 * a) / b)}%`);
const small = (n: number | null, min: number) => (n === null ? `< ${min}` : String(n));

export function GrowthReport(_: Record<string, never>) {
  const [days, setDays] = useState<(typeof PERIODS)[number]>(90);
  return (
    <StaffShell<Growth> page="crescimento" api={`/v1/admin/growth?since=${dayAgo(days)}`} title="Crescimento"
      tools={<Periods options={PERIODS} value={days} onChange={setDays} />}>
      {(g) => <Body g={g} />}
    </StaffShell>
  );
}

function Body({ g }: { g: Growth }) {
  const first = g.funnel[0]?.users ?? null;
  const days = g.retention.find((w) => w.days.length)?.days.map((d) => d.day) ?? [1, 7, 30];
  return (
    <>
      <h2>Funil</h2>
      <div className="staff-scroll">
        <table className="staff-table">
          <thead><tr><th>Passo</th><th className="num">Pessoas</th><th className="num">Total</th><th className="num">Passo</th><th aria-hidden="true"></th></tr></thead>
          <tbody>
            {g.funnel.map((f, k) => (
              <tr key={f.step}>
                <td>{eventLabel(f.step)}</td>
                <td className="num"><strong>{small(f.users, g.min_cell)}</strong></td>
                <td className="num">{pct(f.users, first)}</td>
                <td className="num">{k === 0 ? "-" : pct(f.users, g.funnel[k - 1]!.users)}</td>
                <td className="staff-bar-cell"><span className="staff-bar" style={{ width: f.users && first ? `${(100 * f.users) / first}%` : 0 }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Retenção</h2>
      {g.retention.length === 0 ? <p>Nenhum cadastro.</p> : (
        <div className="staff-scroll">
          <table className="staff-table">
            <thead><tr><th>Semana</th><th className="num">Cadastros</th>{days.map((d) => <th key={d} className="num">D{d}</th>)}</tr></thead>
            <tbody>
              {g.retention.map((w) => (
                <tr key={w.week}>
                  <td>{new Date(`${w.week}T12:00:00`).toLocaleDateString("pt-BR")}</td>
                  {w.signups === null
                    ? <td className="num muted" colSpan={days.length + 1}>{`< ${g.min_cell}`}</td>
                    : <>
                        <td className="num"><strong>{w.signups}</strong></td>
                        {w.days.map((d) => (
                          <td key={d.day} className="num">{d.due === 0 ? <span className="muted">-</span> : <>{pct(d.kept, d.due)} <span className="small muted">{small(d.kept, g.min_cell)}/{d.due}</span></>}</td>
                        ))}
                      </>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2>Eventos</h2>
      <div className="staff-scroll">
        <table className="staff-table">
          <thead><tr><th>Evento</th><th className="num">Pessoas</th><th className="num">Vezes</th></tr></thead>
          <tbody>
            {g.totals.map((t) => (
              <tr key={t.event}><td>{eventLabel(t.event)} <span className="mono small muted">{t.event}</span></td><td className="num">{small(t.users, g.min_cell)}</td><td className="num">{t.count ?? "-"}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
