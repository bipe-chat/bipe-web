// Sign-in for the staff pages (ADR 0056 in bipe/docs/adr): OAuth 2.0 code + PKCE against MAS as a
// self-registered public client, like Element Admin. The API lets only MAS admins through; everyone
// else gets 404. The token lives in this tab only.
import { useEffect, useState } from "react";
import { API_URL, MAS_ISSUER, STAFF_SITE_URL } from "../config";
import { STAFF_PATHS, staffPath, type StaffPage } from "./staff-pages";

const url = (page: StaffPage) => `${STAFF_SITE_URL}${staffPath(page)}`;
const SCOPE = "openid urn:matrix:org.matrix.msc2967.client:api:*";
// The client key carries the page list: a new staff page makes a new key, so the browser registers a
// client that knows every redirect URI. MAS refuses a redirect URI the client did not register.
const KEY = { client: `bipe-staff-client-${STAFF_PATHS.join(",")}`, token: "bipe-staff-token", pkce: "bipe-staff-pkce" };

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
  return (await r.json()) as { authorization_endpoint: string; token_endpoint: string; registration_endpoint: string; revocation_endpoint?: string };
}

/** Ends the token at MAS (RFC 7009, bipe#370). The caller deletes the stored copy also when this fails. */
async function revoke(token: string) {
  const d = await discovery();
  const client = store.get(localStorage, KEY.client);
  if (!d.revocation_endpoint || !client) return;
  await fetch(d.revocation_endpoint, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token, token_type_hint: "access_token", client_id: client }),
  });
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
      redirect_uris: STAFF_PATHS.map((p) => `${STAFF_SITE_URL}${p}`),
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

async function signIn(page: StaffPage) {
  const d = await discovery();
  const id = await clientId(d.registration_endpoint);
  const verifier = random(48), state = random(16);
  const challenge = b64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))));
  store.set(sessionStorage, KEY.pkce, JSON.stringify({ verifier, state }));
  const q = new URLSearchParams({ response_type: "code", response_mode: "query", client_id: id, redirect_uri: url(page), scope: SCOPE, state, code_challenge: challenge, code_challenge_method: "S256" });
  location.assign(`${d.authorization_endpoint}?${q}`);
}

/** Finishes the redirect from MAS. Returns the access token, or null when this load is not a callback. */
async function finishSignIn(page: StaffPage): Promise<string | null> {
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
    body: new URLSearchParams({ grant_type: "authorization_code", code: q.get("code")!, redirect_uri: url(page), client_id: await clientId(d.registration_endpoint), code_verifier: saved.verifier }),
  });
  // A client MAS no longer knows: register again on the next sign-in.
  if (r.status === 400 || r.status === 401) store.del(localStorage, KEY.client);
  if (!r.ok) throw new Error("token");
  return ((await r.json()) as { access_token: string }).access_token;
}

// After the first page has hydrated, a page that StaffApp switches to may read the tab's storage in its
// first render (no server HTML to match), so it starts signed in and with the data it had before.
let hydrated = false;
export const markHydrated = () => { hydrated = true; };
const cache = new Map<string, unknown>();

export type StaffState<T> = { kind: "loading" } | { kind: "signedOut"; error?: string } | { kind: "notStaff" } | { kind: "ready"; data: T };

/** Signs in when needed and reads `path` from the API. A list of paths reads them all and gives a list. A new path reads again. */
export function useStaffData<T>(page: StaffPage, path: string | readonly string[]) {
  const key = JSON.stringify(path);
  const [state, setState] = useState<StaffState<T>>(() =>
    hydrated && cache.has(key) && store.get(sessionStorage, KEY.token) ? { kind: "ready", data: cache.get(key) as T } : { kind: "loading" });
  const [signedIn, setSignedIn] = useState<boolean | null>(() => (hydrated ? Boolean(store.get(sessionStorage, KEY.token)) : null));

  useEffect(() => {
    // The API allows only the main site origin (CORS), so the page runs there.
    if (location.origin !== STAFF_SITE_URL) { location.replace(url(page) + location.search); return; }
    (async () => {
      try {
        const fresh = await finishSignIn(page);
        if (fresh) store.set(sessionStorage, KEY.token, fresh);
        setSignedIn(Boolean(store.get(sessionStorage, KEY.token)));
        if (!store.get(sessionStorage, KEY.token)) setState({ kind: "signedOut" });
      } catch {
        setSignedIn(false);
        setState({ kind: "signedOut", error: "Login falhou." });
      }
    })();
  }, [page]);

  useEffect(() => {
    if (!signedIn) return;
    const token = store.get(sessionStorage, KEY.token);
    if (!token) { setState({ kind: "signedOut" }); return; }
    let live = true;
    const paths = JSON.parse(key) as string | string[];
    (async () => {
      try {
        const answers = await Promise.all((Array.isArray(paths) ? paths : [paths]).map((p) => fetch(`${API_URL}${p}`, { headers: { authorization: `Bearer ${token}` } })));
        if (!live) return;
        if (answers.some((r) => r.status === 401)) { store.del(sessionStorage, KEY.token); setState({ kind: "signedOut" }); return; }
        if (answers.some((r) => r.status === 404)) { setState({ kind: "notStaff" }); return; }
        const bad = answers.find((r) => !r.ok);
        if (bad) throw new Error(String(bad.status));
        const bodies = await Promise.all(answers.map((r) => r.json()));
        const data = (Array.isArray(paths) ? bodies : bodies[0]) as T;
        cache.set(key, data);
        if (live) setState({ kind: "ready", data });
      } catch {
        if (live) setState({ kind: "signedOut", error: "API fora do ar." });
      }
    })();
    return () => { live = false; };
  }, [signedIn, key]);

  const signOut = () => {
    const token = store.get(sessionStorage, KEY.token);
    store.del(sessionStorage, KEY.token);
    cache.clear();
    setSignedIn(false);
    setState({ kind: "signedOut" });
    if (token) revoke(token).catch(() => { /* the token is gone from the tab either way */ });
  };
  const start = () => { signIn(page).catch(() => setState({ kind: "signedOut", error: "Login fora do ar." })); };
  return { state, signedIn, signOut, signIn: start };
}

/** The sign-in, not-staff and loading states that every staff page shows the same way. */
export function StaffGateView({ state, signIn, signOut }: { state: StaffState<unknown>; signIn: () => void; signOut: () => void }) {
  if (state.kind === "loading") return <p className="muted">Carregando…</p>;
  if (state.kind === "signedOut") return (
    <>
      {state.error && <p>{state.error}</p>}
      <div className="actions"><button className="button primary" onClick={signIn}>Entrar</button></div>
    </>
  );
  if (state.kind === "notStaff") return (
    <>
      <p>Sem acesso.</p>
      <div className="actions"><button className="button secondary" onClick={signOut}>Sair</button></div>
    </>
  );
  return null;
}
