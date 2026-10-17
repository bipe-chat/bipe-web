// Staff index /admin/ (bipe#372): every staff page from the registry in staff-pages.ts, by group.
// Signing in here also checks the account is staff. The tile numbers come from one call, /v1/admin/summary (bipe#394).
// A null page object means its source is off or failed: the tile shows "-". A null count is below min_cell: "< 3".
import type { ReactNode } from "react";
import { StaffGateView, useStaffData } from "./staff-auth";
import { STAFF_CONSOLE, type StaffGroup, type StaffPageInfo } from "./staff-pages";
import { small } from "./staff-ui";

type Summary = {
  min_cell: number;
  crescimento: { signups_7d: number | null } | null;
  convites: { joins_30d: number | null } | null;
  visitas: { brazil_7d: number | null } | null;
  experimentos: { id: string; visitors: number } | null;
  espera: { waiting: number } | null;
  empresas: { awaiting_proof: number; verified: number } | null;
  denuncias: { reports_7d: number } | null;
  lgpd: { over: number } | null;
};

type PageKey = keyof typeof STAFF_CONSOLE;
type Stat = { value: string; label: string };

/** One or two numbers per built page. Pages without an entry show only their title. */
const STATS: Partial<Record<PageKey, (s: Summary) => Stat[]>> = {
  crescimento: (s) => [{ value: s.crescimento ? small(s.crescimento.signups_7d) : "-", label: "cadastros, 7 dias" }],
  convites: (s) => [{ value: s.convites ? small(s.convites.joins_30d) : "-", label: "entradas, 30 dias" }],
  visitas: (s) => [{ value: s.visitas ? small(s.visitas.brazil_7d) : "-", label: "Brasil, 7 dias" }],
  experimentos: (s) => [{ value: s.experimentos ? String(s.experimentos.visitors) : "-", label: s.experimentos?.id ?? "visitantes" }],
  espera: (s) => [{ value: s.espera ? String(s.espera.waiting) : "-", label: "esperando" }],
  empresas: (s) => [
    { value: s.empresas ? String(s.empresas.awaiting_proof) : "-", label: "sem prova" },
    { value: s.empresas ? String(s.empresas.verified) : "-", label: "verificadas" },
  ],
  denuncias: (s) => [{ value: s.denuncias ? String(s.denuncias.reports_7d) : "-", label: "7 dias" }],
  lgpd: (s) => [{ value: s.lgpd ? String(s.lgpd.over) : "-", label: "fora do prazo" }],
};

const GROUPS: StaffGroup[] = ["Crescimento", "Operação", "Empresas", "Confiança"];
const pages = Object.entries(STAFF_CONSOLE as Record<PageKey, StaffPageInfo>) as [PageKey, StaffPageInfo][];

function Stats({ items }: { items: Stat[] }): ReactNode {
  return (
    <span className="staff-stats">
      {items.map((t) => <span key={t.label} className="staff-stat"><b>{t.value}</b><span className="small muted">{t.label}</span></span>)}
    </span>
  );
}

export function AdminIndex(_: Record<string, never>) {
  const { state, signIn, signOut } = useStaffData<Summary>("index", "/v1/admin/summary");

  return (
    <section className="wrap section staff">
      <h1>Equipe</h1>
      <StaffGateView state={state} signIn={signIn} signOut={signOut} />
      {state.kind === "ready" && (
        <>
          {GROUPS.map((g) => (
            <div key={g} className="staff-group">
              <h2>{g}</h2>
              <div className="staff-cards">
                {pages.filter(([, p]) => p.group === g).map(([key, p]) => p.path ? (
                  <a key={key} className="card staff-card" href={p.path}>
                    <strong>{p.title}</strong>
                    {STATS[key] && <Stats items={STATS[key](state.data)} />}
                  </a>
                ) : (
                  <div key={key} className="card staff-card planned">
                    <strong>{p.title}</strong>
                    <span className="small muted">#{p.issue}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <h2>Outros</h2>
          <ul>
            <li><a href="https://stats.bipe.chat">Umami</a></li>
            <li><a href="https://admin.bipe.net.br">Element Admin</a></li>
          </ul>
          <p className="small"><button className="linklike" onClick={signOut}>Sair</button></p>
        </>
      )}
    </section>
  );
}
