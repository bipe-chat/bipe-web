// Read-only staff pages on existing data (bipe#374, #375, #376, #380, #381). Frame: staff-ui.tsx.
import { dataRegister } from "../shared";
import { daysSince, fmtDate, pct, small, StaffShell, Tiles } from "./staff-ui";

type Experiments = { experiments: { id: string; first_day: string; last_day: string; arms: { arm: string; visitors: number; install_clicks: number; waitlist: number | null }[] }[] };

export function ExperimentsReport(_: Record<string, never>) {
  return (
    <StaffShell<Experiments> page="experimentos" api="/v1/admin/experiments" title="Títulos">
      {(d) => d.experiments.length === 0 ? <p>Nenhum teste.</p> : d.experiments.map((e) => (
        <div key={e.id}>
          <h2>{e.id} <span className="small muted">{fmtDate(e.first_day)} a {fmtDate(e.last_day)}</span></h2>
          <div className="staff-scroll">
            <table className="staff-table">
              <thead><tr><th>Versão</th><th className="num">Visitas</th><th className="num">Cliques</th><th className="num">Taxa</th><th className="num">Espera</th><th className="num">Taxa</th></tr></thead>
              <tbody>
                {e.arms.map((a) => (
                  <tr key={a.arm}>
                    <td><strong>{a.arm}</strong></td>
                    <td className="num">{a.visitors}</td>
                    <td className="num">{a.install_clicks}</td>
                    <td className="num">{pct(a.install_clicks, a.visitors)}</td>
                    <td className="num">{small(a.waitlist)}</td>
                    <td className="num">{pct(a.waitlist, a.visitors)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </StaffShell>
  );
}

type Waitlist = {
  platforms: { platform: string; waiting: number; invited: number; oldest: string | null }[];
  batches: { note: string; sent: number; joined: number | null; expired: number; revoked: number }[];
};

export function WaitlistReport(_: Record<string, never>) {
  return (
    <StaffShell<Waitlist> page="espera" api="/v1/admin/waitlist" title="Lista de espera">
      {(d) => (
        <>
          <Tiles items={d.platforms.map((p) => ({ label: p.platform, value: p.waiting }))} />
          <div className="staff-scroll">
            <table className="staff-table">
              <thead><tr><th>Plataforma</th><th className="num">Esperando</th><th className="num">Convidados</th><th className="num">Mais antigo</th></tr></thead>
              <tbody>
                {d.platforms.map((p) => (
                  <tr key={p.platform}><td><strong>{p.platform}</strong></td><td className="num">{p.waiting}</td><td className="num">{p.invited}</td><td className="num">{p.oldest ? `${daysSince(p.oldest)} d` : "-"}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <h2>Lotes</h2>
          {d.batches.length === 0 ? <p>Nenhum lote.</p> : (
            <div className="staff-scroll">
              <table className="staff-table">
                <thead><tr><th>Lote</th><th className="num">Enviados</th><th className="num">Entraram</th><th className="num">Taxa</th><th className="num">Expirados</th><th className="num">Revogados</th></tr></thead>
                <tbody>
                  {d.batches.map((b) => (
                    <tr key={b.note}>
                      <td>{fmtDate(b.note.replace(/^waitlist-/, ""))}</td>
                      <td className="num">{b.sent}</td>
                      <td className="num"><strong>{small(b.joined)}</strong></td>
                      <td className="num">{pct(b.joined, b.sent)}</td>
                      <td className="num">{b.expired}</td>
                      <td className="num">{b.revoked}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </StaffShell>
  );
}

type Claim = {
  user_id: string; cnpj: string; status: string; reason: string | null; method: string | null;
  created_at: string; verified_at: string | null; ended_at: string | null; legal_name: string | null; trade_name: string | null;
  registry_active: boolean | null; release_month: string | null; domains: number; domains_verified: number; last_checked: string | null;
};
const STATUS: Record<string, string> = {
  registry_pending: "Aguardando registro", awaiting_proof: "Aguardando prova", verified: "Verificada", rejected: "Recusada", revoked: "Revogada",
};
const cnpjFmt = (c: string) => c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");

export function BusinessReport(_: Record<string, never>) {
  return (
    <StaffShell<{ claims: Claim[] }> page="empresas" api="/v1/admin/business" title="Empresas">
      {(d) => (
        <>
          <Tiles items={Object.keys(STATUS).map((s) => ({ label: STATUS[s]!, value: d.claims.filter((c) => c.status === s).length }))} />
          {d.claims.length === 0 ? <p>Nenhum pedido.</p> : (
            <div className="staff-scroll">
              <table className="staff-table">
                <thead><tr><th>Empresa</th><th>CNPJ</th><th>Situação</th><th>Via</th><th className="num">Domínios</th><th className="num">Pedido</th><th className="num">Verificada</th><th>Receita</th></tr></thead>
                <tbody>
                  {d.claims.map((c) => (
                    <tr key={c.user_id}>
                      <td><strong>{c.trade_name || c.legal_name || "-"}</strong>{c.trade_name && c.legal_name ? <div className="small muted">{c.legal_name}</div> : null}<div className="mono small muted">{c.user_id}</div></td>
                      <td className="mono">{cnpjFmt(c.cnpj)}</td>
                      <td>{STATUS[c.status] ?? c.status}{c.reason ? <div className="small muted">{c.reason}</div> : null}</td>
                      <td>{c.method ?? "-"}</td>
                      <td className="num">{c.domains_verified}/{c.domains}</td>
                      <td className="num small">{fmtDate(c.created_at)}</td>
                      <td className="num small">{fmtDate(c.verified_at)}</td>
                      <td className="small">{c.registry_active === null ? "-" : c.registry_active ? "Ativa" : "Inativa"} {c.release_month ? <span className="muted">{c.release_month}</span> : null}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </StaffShell>
  );
}

type Reports = { days: number; reports: { id: number; received_at: string; room_id: string; reason: string | null; score: number | null }[] };

export function UserReports(_: Record<string, never>) {
  return (
    <StaffShell<Reports> page="denuncias" api="/v1/admin/reports?days=90" title="Denúncias">
      {(d) => (
        <>
          <Tiles items={[
            { label: "90 dias", value: d.reports.length },
            { label: "7 dias", value: d.reports.filter((r) => (daysSince(r.received_at) ?? 99) < 7).length },
          ]} />
          {d.reports.length === 0 ? <p>Nenhuma denúncia.</p> : (
            <div className="staff-scroll">
              <table className="staff-table">
                <thead><tr><th>Quando</th><th>Motivo</th><th className="num">Nota</th><th>Sala</th></tr></thead>
                <tbody>
                  {d.reports.map((r) => (
                    <tr key={r.id}>
                      <td className="small">{new Date(r.received_at).toLocaleString("pt-BR")}</td>
                      <td>{r.reason || <span className="muted">-</span>}</td>
                      <td className="num">{r.score ?? "-"}</td>
                      <td className="mono small">{r.room_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </StaffShell>
  );
}

type Retention = { items: { id: string; limit_days: number | null; rows: number; oldest: string | null; over: number }[] };
const itemName = (id: string) => dataRegister.items.find((i) => i.id === id)?.pt.name ?? id;

export function RetentionReport(_: Record<string, never>) {
  return (
    <StaffShell<Retention> page="lgpd" api="/v1/admin/retention" title="LGPD">
      {(d) => (
        <>
          <Tiles items={[{ label: "Fora do prazo", value: d.items.reduce((n, i) => n + i.over, 0) }]} />
          <div className="staff-scroll">
            <table className="staff-table">
              <thead><tr><th>Dado</th><th className="num">Prazo</th><th className="num">Linhas</th><th className="num">Mais antiga</th><th className="num">Fora do prazo</th></tr></thead>
              <tbody>
                {d.items.map((i) => (
                  <tr key={i.id} className={i.over ? "warn" : undefined}>
                    <td>{itemName(i.id)} <span className="mono small muted">{i.id}</span></td>
                    <td className="num">{i.limit_days === null ? "-" : `${i.limit_days} d`}</td>
                    <td className="num">{i.rows}</td>
                    <td className="num">{i.oldest ? `${daysSince(i.oldest)} d` : "-"}</td>
                    <td className="num"><strong>{i.over}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </StaffShell>
  );
}
