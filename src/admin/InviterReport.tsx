// Staff page /admin/convites/ (ADR 0056 in bipe/docs/adr): inviters ranked by joins, to find hypergrowers.
// Sign-in and the staff gate are in staff-auth.tsx.
import { useMemo, useState } from "react";
import { StaffShell, Tiles } from "./staff-ui";

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
  return (
    <StaffShell<{ inviters: Inviter[] }> page="convites" api="/v1/admin/inviters?limit=1000" title="Convites">
      {(d) => <Report inviters={d.inviters} />}
    </StaffShell>
  );
}

function Report({ inviters }: { inviters: Inviter[] }) {
  const [sort, setSort] = useState<SortKey>("joined");
  const rows = useMemo(() => {
    const v = (r: Inviter) => (sort === "last_join" ? (r.last_join ? Date.parse(r.last_join) : 0) : (r[sort] ?? -1));
    return [...inviters].sort((a, b) => v(b) - v(a) || b.joined - a.joined);
  }, [inviters, sort]);
  const sent = rows.reduce((n, r) => n + r.sent, 0), joined = rows.reduce((n, r) => n + r.joined, 0);
  const tiles = [
    { label: "Pessoas que convidaram", value: rows.length },
    { label: "Convites enviados", value: sent },
    { label: "Entraram", value: joined },
    { label: "Taxa geral", value: sent ? `${Math.round((100 * joined) / sent)}%` : "-" },
  ];
  return (
    <>
      <Tiles items={tiles} />
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
    </>
  );
}
