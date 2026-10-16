// Staff page /admin/convites/ (ADR 0056 in bipe/docs/adr): inviters ranked by joins, to find hypergrowers.
// Sign-in and the staff gate are in staff-auth.tsx.
import { useMemo, useState } from "react";
import { StaffGateView, useStaffData } from "./staff-auth";

type Inviter = { user_id: string; handle: string | null; sent: number; joined: number; rate_pct: number | null; downstream: number; depth: number; last_join: string | null };
type SortKey = "joined" | "downstream" | "sent" | "rate_pct" | "depth" | "last_join";

const COLS: { key: SortKey; label: string; hint: string }[] = [
  { key: "sent", label: "Enviados", hint: "Convites pessoais criados" },
  { key: "joined", label: "Entraram", hint: "Pessoas que criaram conta com esses convites" },
  { key: "rate_pct", label: "Taxa", hint: "Entraram dividido por enviados" },
  { key: "downstream", label: "Árvore", hint: "Todo mundo abaixo dessa pessoa na árvore de convites" },
  { key: "depth", label: "Níveis", hint: "Quantos níveis a árvore tem" },
  { key: "last_join", label: "Última entrada", hint: "Quando a última pessoa convidada entrou" },
];

export function InviterReport(_: Record<string, never>) {
  const { state, signIn, signOut } = useStaffData<{ inviters: Inviter[] }>("convites", "/v1/admin/inviters?limit=1000");
  const [sort, setSort] = useState<SortKey>("joined");

  const rows = useMemo(() => {
    if (state.kind !== "ready") return [];
    const v = (r: Inviter) => (sort === "last_join" ? (r.last_join ? Date.parse(r.last_join) : 0) : (r[sort] ?? -1));
    return [...state.data.inviters].sort((a, b) => v(b) - v(a) || b.joined - a.joined);
  }, [state, sort]);

  return (
    <section className="wrap section staff">
      <h1>Quem mais convida</h1>
      <p className="lede">Pessoas que trazem mais gente para o Bipe. Só convites pessoais; convites criados pela equipe ficam de fora.</p>
      <StaffGateView state={state} signIn={signIn} signOut={signOut} />
      {state.kind === "ready" && <Report rows={rows} sort={sort} setSort={setSort} signOut={signOut} />}
    </section>
  );
}

function Report({ rows, sort, setSort, signOut }: { rows: Inviter[]; sort: SortKey; setSort: (k: SortKey) => void; signOut: () => void }) {
  const sent = rows.reduce((n, r) => n + r.sent, 0), joined = rows.reduce((n, r) => n + r.joined, 0);
  const tiles = [
    { label: "Pessoas que convidaram", value: rows.length },
    { label: "Convites enviados", value: sent },
    { label: "Entraram", value: joined },
    { label: "Taxa geral", value: sent ? `${Math.round((100 * joined) / sent)}%` : "-" },
  ];
  return (
    <>
      <div className="staff-tiles">
        {tiles.map((t) => <div className="card" key={t.label}><span className="small muted">{t.label}</span><strong>{t.value}</strong></div>)}
      </div>
      {rows.length === 0 ? <p>Ninguém criou convite pessoal ainda.</p> : (
        <div className="staff-scroll">
          <table className="staff-table">
            <thead>
              <tr>
                <th>#</th><th>Pessoa</th>
                {COLS.map((c) => (
                  <th key={c.key} className="num" title={c.hint} aria-sort={sort === c.key ? "descending" : "none"}>
                    <button onClick={() => setSort(c.key)}>{c.label}{sort === c.key ? " ↓" : ""}</button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.user_id}>
                  <td className="muted">{i + 1}</td>
                  <td>{r.handle ? <strong>@{r.handle}</strong> : null} <span className="mono small muted">{r.user_id}</span></td>
                  <td className="num">{r.sent}</td>
                  <td className="num"><strong>{r.joined}</strong></td>
                  <td className="num">{r.rate_pct === null ? "-" : `${r.rate_pct}%`}</td>
                  <td className="num">{r.downstream}</td>
                  <td className="num">{r.depth}</td>
                  <td className="num small">{r.last_join ? new Date(r.last_join).toLocaleDateString("pt-BR") : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="small muted">Também no CLI da API: <span className="mono">node dist/cli.js invite top</span>. <button className="linklike" onClick={signOut}>Sair</button></p>
    </>
  );
}
