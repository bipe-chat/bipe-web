// Staff index /admin/ (bipe#372): every staff page from the registry in staff-pages.ts, by group.
// Signing in here also checks the account is staff; the headline number comes from /v1/admin/growth.
import { StaffGateView, useStaffData } from "./staff-auth";
import { STAFF_CONSOLE, type StaffGroup, type StaffPageInfo } from "./staff-pages";
import type { Growth } from "./GrowthReport";

const GROUPS: StaffGroup[] = ["Crescimento", "Operação", "Empresas", "Confiança"];
const pages = Object.values(STAFF_CONSOLE as Record<string, StaffPageInfo>);
const since = () => new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);

export function AdminIndex(_: Record<string, never>) {
  const { state, signIn, signOut } = useStaffData<Growth>("index", `/v1/admin/growth?since=${since()}`);
  const signups = state.kind === "ready" ? state.data.funnel[0]?.users : undefined;

  return (
    <section className="wrap section staff">
      <h1>Equipe</h1>
      <StaffGateView state={state} signIn={signIn} signOut={signOut} />
      {state.kind === "ready" && (
        <>
          <div className="staff-tiles">
            <div className="card"><span className="small muted">Cadastros, 7 dias</span><strong>{signups === null ? `< ${state.data.min_cell}` : signups ?? 0}</strong></div>
          </div>
          {GROUPS.map((g) => (
            <div key={g} className="staff-group">
              <h2>{g}</h2>
              <div className="staff-cards">
                {pages.filter((p) => p.group === g).map((p) => p.path ? (
                  <a key={p.title} className="card staff-card" href={p.path}>
                    <strong>{p.title}</strong>
                  </a>
                ) : (
                  <div key={p.title} className="card staff-card planned">
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
