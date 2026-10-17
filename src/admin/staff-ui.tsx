// Shared frame and formatters for the read-only staff pages. Copy rule (#368): data and labels only.
import type { ReactNode } from "react";
import { StaffGateView, useStaffData } from "./staff-auth";
import type { StaffPage } from "./staff-pages";

/** Title, sign-in gate, the report body once data is in, and Sair. */
export function StaffShell<T>({ page, api, title, children }: { page: StaffPage; api: string; title: string; children: (data: T) => ReactNode }) {
  const { state, signIn, signOut } = useStaffData<T>(page, api);
  return (
    <section className="wrap section staff">
      <h1>{title}</h1>
      <StaffGateView state={state} signIn={signIn} signOut={signOut} />
      {state.kind === "ready" && (
        <>
          {children(state.data)}
          <p className="small"><a href="/admin/">Equipe</a> · <button className="linklike" onClick={signOut}>Sair</button></p>
        </>
      )}
    </section>
  );
}

export function Tiles({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <div className="staff-tiles">
      {items.map((t) => <div className="card" key={t.label}><span className="small muted">{t.label}</span><strong>{t.value}</strong></div>)}
    </div>
  );
}

export const fmtDate = (iso: string | null) => (iso ? new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString("pt-BR") : "-");
export const daysSince = (iso: string | null) => (iso ? Math.floor((Date.now() - Date.parse(iso)) / 86_400_000) : null);
export const pct = (a: number | null, b: number | null) => (a === null || !b ? "-" : `${Math.round((100 * a) / b)}%`);
export const small = (n: number | null) => (n === null ? "< 3" : String(n));
