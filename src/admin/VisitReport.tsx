// Staff page /admin/visitas/ (ADR 0098 in bipe/docs/adr): site visits in Brazil by state and city, from Umami.
// Sign-in and the staff gate are in staff-auth.tsx. The state shapes load only on this page (a separate chunk).
import { useEffect, useMemo, useState } from "react";
import { Periods, StaffShell, Tiles } from "./staff-ui";

type Count = { visitors: number; views: number };
type Report = {
  days: number;
  brazil: Count;
  other_countries: Count;
  states: (Count & { state: string | null })[];
  cities: (Count & { state: string | null; city: string | null })[];
};
type Shapes = typeof import("./brazil-states");

const PERIODS = [7, 30, 90, 400] as const;
const periodLabel = (d: number) => (d === 400 ? "Tudo" : `${d} dias`);

export function VisitReport(_: Record<string, never>) {
  const [days, setDays] = useState<(typeof PERIODS)[number]>(30);
  return (
    <StaffShell<Report> page="visitas" api={`/v1/admin/visits?days=${days}`} title="Visitas"
      tools={<Periods options={PERIODS} value={days} onChange={setDays} label={periodLabel} />}>
      {(r) => <Body report={r} />}
    </StaffShell>
  );
}

function Body({ report }: { report: Report }) {
  const [shapes, setShapes] = useState<Shapes | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  useEffect(() => { import("./brazil-states").then(setShapes).catch(() => setShapes(null)); }, []);

  const byUf = useMemo(() => new Map(report.states.map((s) => [s.state ?? "", s])), [report]);
  const names = useMemo(() => new Map(shapes?.BR_STATES.map((s) => [s.uf, s.name]) ?? []), [shapes]);
  const max = Math.max(1, ...report.states.filter((s) => s.state).map((s) => s.visitors));
  const total = report.brazil.visitors;
  const pct = (n: number) => (total ? `${Math.round((100 * n) / total)}%` : "-");
  const cities = focus ? report.cities.filter((c) => c.state === focus) : report.cities;

  const tiles = [
    { label: "Brasil", value: total },
    { label: "Páginas", value: report.brazil.views },
    { label: "Estados", value: report.states.filter((s) => s.state).length },
    { label: "Fora do Brasil", value: report.other_countries.visitors },
  ];

  return (
    <>
      <Tiles items={tiles} />
      {total === 0 ? <p>Nenhuma visita.</p> : (
        <div className="staff-geo">
          <figure className="staff-map">
            {shapes ? (
              <svg viewBox={shapes.BR_VIEWBOX} role="img" aria-label="Mapa do Brasil com visitantes por estado">
                {shapes.BR_STATES.map((s) => {
                  const n = byUf.get(s.uf)?.visitors ?? 0;
                  // Square root, so one big state does not wash out the rest.
                  const shade = n ? 0.15 + 0.85 * Math.sqrt(n / max) : 0;
                  return (
                    <path key={s.uf} d={s.d} className={`${n ? "has" : ""}${focus === s.uf ? " focus" : ""}`} style={{ fillOpacity: n ? shade : undefined }}
                      onClick={() => setFocus(focus === s.uf ? null : s.uf)}>
                      <title>{`${s.name}: ${n} visitante${n === 1 ? "" : "s"}`}</title>
                    </path>
                  );
                })}
              </svg>
            ) : <p className="muted">Carregando o mapa…</p>}
          </figure>
          <div className="staff-scroll">
            <table className="staff-table">
              <thead><tr><th>Estado</th><th className="num">Visitantes</th><th className="num">Parte</th><th className="num">Páginas</th></tr></thead>
              <tbody>
                {report.states.map((s) => (
                  <tr key={s.state ?? "-"} className={focus && s.state === focus ? "focus" : undefined}>
                    <td>{s.state ? <button className="linklike" onClick={() => setFocus(focus === s.state ? null : s.state)}><strong>{s.state}</strong> {names.get(s.state) ?? ""}</button> : <span className="muted">Sem estado</span>}</td>
                    <td className="num"><strong>{s.visitors}</strong></td>
                    <td className="num">{pct(s.visitors)}</td>
                    <td className="num">{s.views}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {total > 0 && (
        <>
          <h2>Cidades{focus ? ` em ${names.get(focus) ?? focus}` : ""}</h2>
          {focus && <p className="small"><button className="linklike" onClick={() => setFocus(null)}>Todas</button></p>}
          {cities.length === 0 ? <p>Nenhuma cidade.</p> : (
            <div className="staff-scroll">
              <table className="staff-table">
                <thead><tr><th>#</th><th>Cidade</th><th>Estado</th><th className="num">Visitantes</th><th className="num">Parte</th><th className="num">Páginas</th></tr></thead>
                <tbody>
                  {cities.map((c, i) => (
                    <tr key={`${c.state}-${c.city}`}>
                      <td className="muted">{i + 1}</td>
                      <td>{c.city ? <strong>{c.city}</strong> : <span className="muted">Outras cidades</span>}</td>
                      <td>{c.state ?? "-"}</td>
                      <td className="num"><strong>{c.visitors}</strong></td>
                      <td className="num">{pct(c.visitors)}</td>
                      <td className="num">{c.views}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
        </>
      )}
    </>
  );
}
