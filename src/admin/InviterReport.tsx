// Staff page /admin/convites/ (ADR 0056 in bipe/docs/adr): inviters ranked by joins, to find hypergrowers.
// Sign-in is OAuth 2.0 code + PKCE against MAS as a self-registered public client, like Element Admin.
// The API lets only MAS admins through; everyone else gets 404. The token lives in this tab only.
import { useEffect, useMemo, useState } from "react";
import { API_URL, MAS_ISSUER, STAFF_SITE_URL } from "../config";

const PAGE = `${STAFF_SITE_URL}/admin/convites/`;
const SCOPE = "openid urn:matrix:org.matrix.msc2967.client:api:*";
const KEY = { client: "bipe-staff-client", token: "bipe-staff-token", pkce: "bipe-staff-pkce" };

type Inviter = { user_id: string; handle: string | null; sent: number; joined: number; rate_pct: number | null; downstream: number; depth: number; last_join: string | null };
type SortKey = "joined" | "downstream" | "sent" | "rate_pct" | "depth" | "last_join";
type State = { kind: "loading" } | { kind: "signedOut"; error?: string } | { kind: "notStaff" } | { kind: "ready"; rows: Inviter[] };

// Storage can throw in private windows; the page then signs in again on each load.
const store = {
  get: (s: Storage, k: string) => { try { return s.getItem(k); } catch { return null; } },
  set: (s: Storage, k: string, v: string) => { try { s.setItem(k, v); } catch { /* nothing */ } },
  del: (s: Storage, k: string) => { try { s.removeItem(k); } catch { /* nothing */ } },
};

const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const random = (n = 32) => b64url(crypto.getRandomValues(new Uint8Array(n)));

async function discovery() {
  const r = await fetch(`${MAS_ISSUER}.well-known/openid-configuration`);
  if (!r.ok) throw new Error("discovery");
  return (await r.json()) as { authorization_endpoint: string; token_endpoint: string; registration_endpoint: string };
}

async function clientId(registrationEndpoint: string): Promise<string> {
  const cached = store.get(localStorage, KEY.client);
  if (cached) return cached;
  const r = await fetch(registrationEndpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_name: "Bipe staff",
      client_uri: `${STAFF_SITE_URL}/`,
      redirect_uris: [PAGE],
      application_type: "web",
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code"],
      response_types: ["code"],
    }),
  });
  if (!r.ok) throw new Error("registration");
  const id = String(((await r.json()) as { client_id: string }).client_id);
  store.set(localStorage, KEY.client, id);
  return id;
}

async function signIn() {
  const d = await discovery();
  const id = await clientId(d.registration_endpoint);
  const verifier = random(48), state = random(16);
  const challenge = b64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))));
  store.set(sessionStorage, KEY.pkce, JSON.stringify({ verifier, state }));
  const q = new URLSearchParams({ response_type: "code", response_mode: "query", client_id: id, redirect_uri: PAGE, scope: SCOPE, state, code_challenge: challenge, code_challenge_method: "S256" });
  location.assign(`${d.authorization_endpoint}?${q}`);
}

/** Finishes the redirect from MAS. Returns the access token, or null when this load is not a callback. */
async function finishSignIn(): Promise<string | null> {
  const q = new URLSearchParams(location.search);
  if (!q.has("code") && !q.has("error")) return null;
  history.replaceState(null, "", location.pathname);
  const saved = JSON.parse(store.get(sessionStorage, KEY.pkce) ?? "null") as { verifier: string; state: string } | null;
  store.del(sessionStorage, KEY.pkce);
  if (q.has("error") || !saved || q.get("state") !== saved.state) throw new Error("callback");
  const d = await discovery();
  const r = await fetch(d.token_endpoint, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "authorization_code", code: q.get("code")!, redirect_uri: PAGE, client_id: await clientId(d.registration_endpoint), code_verifier: saved.verifier }),
  });
  // A client MAS no longer knows: register again on the next sign-in.
  if (r.status === 400 || r.status === 401) store.del(localStorage, KEY.client);
  if (!r.ok) throw new Error("token");
  return ((await r.json()) as { access_token: string }).access_token;
}

const COLS: { key: SortKey; label: string; hint: string }[] = [
  { key: "sent", label: "Enviados", hint: "Convites pessoais criados" },
  { key: "joined", label: "Entraram", hint: "Pessoas que criaram conta com esses convites" },
  { key: "rate_pct", label: "Taxa", hint: "Entraram dividido por enviados" },
  { key: "downstream", label: "Árvore", hint: "Todo mundo abaixo dessa pessoa na árvore de convites" },
  { key: "depth", label: "Níveis", hint: "Quantos níveis a árvore tem" },
  { key: "last_join", label: "Última entrada", hint: "Quando a última pessoa convidada entrou" },
];

export function InviterReport(_: Record<string, never>) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [sort, setSort] = useState<SortKey>("joined");

  useEffect(() => {
    // The API allows only the main site origin (CORS), so the page runs there.
    if (location.origin !== STAFF_SITE_URL) { location.replace(PAGE + location.search); return; }
    (async () => {
      try {
        const fresh = await finishSignIn();
        if (fresh) store.set(sessionStorage, KEY.token, fresh);
      } catch {
        setState({ kind: "signedOut", error: "O login não terminou. Tente de novo." });
        return;
      }
      const token = store.get(sessionStorage, KEY.token);
      if (!token) { setState({ kind: "signedOut" }); return; }
      try {
        const r = await fetch(`${API_URL}/v1/admin/inviters?limit=1000`, { headers: { authorization: `Bearer ${token}` } });
        if (r.status === 401) { store.del(sessionStorage, KEY.token); setState({ kind: "signedOut" }); return; }
        if (r.status === 404) { setState({ kind: "notStaff" }); return; }
        if (!r.ok) throw new Error(String(r.status));
        setState({ kind: "ready", rows: ((await r.json()) as { inviters: Inviter[] }).inviters });
      } catch {
        setState({ kind: "signedOut", error: "A API não respondeu. Tente de novo." });
      }
    })();
  }, []);

  const rows = useMemo(() => {
    if (state.kind !== "ready") return [];
    const v = (r: Inviter) => (sort === "last_join" ? (r.last_join ? Date.parse(r.last_join) : 0) : (r[sort] ?? -1));
    return [...state.rows].sort((a, b) => v(b) - v(a) || b.joined - a.joined);
  }, [state, sort]);

  const signOut = () => { store.del(sessionStorage, KEY.token); setState({ kind: "signedOut" }); };

  return (
    <section className="wrap section staff">
      <h1>Quem mais convida</h1>
      <p className="lede">Pessoas que trazem mais gente para o Bipe. Só convites pessoais; convites criados pela equipe ficam de fora.</p>
      {state.kind === "loading" && <p className="muted">Carregando…</p>}
      {state.kind === "signedOut" && (
        <>
          {state.error && <p>{state.error}</p>}
          <p>Só para a equipe. Entre com uma conta marcada como admin.</p>
          <div className="actions"><button className="button primary" onClick={() => { signIn().catch(() => setState({ kind: "signedOut", error: "O servidor de contas não respondeu." })); }}>Entrar com a conta Bipe</button></div>
        </>
      )}
      {state.kind === "notStaff" && (
        <>
          <p>Esta conta não é admin. Peça a marca de admin ou entre com outra conta.</p>
          <div className="actions"><button className="button secondary" onClick={signOut}>Sair</button></div>
        </>
      )}
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
