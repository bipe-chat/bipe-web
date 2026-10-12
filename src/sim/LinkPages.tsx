// Landing pages for links shared from the app. Caddy rewrites /@handle to /perfil/ and
// /convite/<code> to /convite/, so both read the real path in the browser. With the app installed,
// universal links (.well-known/apple-app-site-association) open the app before these pages load.
import { useEffect, useState } from "react";
import inviteCodes from "@shared/test-vectors/invite-codes.json";
import { chrome } from "../copy";
import { detectPlatform, type Platform } from "../platform";
import { Icon } from "../components/ui";
import { API_URL } from "../config";
import { distribution, reg } from "../shared";

/** Same rule as the apps and the API: proseio-shared/test-vectors/invite-codes.json. */
export function extractInviteCode(text: string): string | null {
  const m = new RegExp(inviteCodes.pattern).exec(text.toUpperCase());
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}


// The Clipboard API needs a secure context and some in-app browsers block it; fall back to a selection copy.
async function copyText(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* fall back */ }
  const t = document.createElement("textarea");
  t.value = text; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
  document.body.appendChild(t); t.select(); t.setSelectionRange(0, text.length);
  let ok = false;
  try { ok = document.execCommand("copy"); } catch { /* nothing */ }
  document.body.removeChild(t);
  return ok;
}

function InstallButton() {
  const { ios } = distribution;
  return ios.url ? <a className="button primary" href={ios.url}><Icon name="apple" />{ios.pt.label}</a> : null;
}

export function ProfileLanding(_: Record<string, never>) {
  const c = chrome.pt.profile;
  const [handle, setHandle] = useState<string | null>(null);
  useEffect(() => {
    // Never looks the handle up: the page must not reveal whether an account exists (no directory).
    const m = location.pathname.match(/^\/@([^/]+)$/);
    if (m && new RegExp(reg.handles.pattern).test(m[1])) setHandle(m[1]);
  }, []);
  return (
    <section className="wrap narrow section">
      <h1 style={{ overflowWrap: "anywhere" }}>{handle ? `@${handle}` : "Proseio"}</h1>
      <p className="lede">{c.lead}</p>
      <p>{c.noApp}</p>
      <div className="actions"><InstallButton /></div>
    </section>
  );
}

export function InviteLanding(_: Record<string, never>) {
  const c = chrome.pt.invite;
  const [code, setCode] = useState<string | null>(null);
  const [platform, setPlatform] = useState<Platform>("ios");
  const [valid, setValid] = useState<boolean | null>(null);
  const [inviter, setInviter] = useState<string | null>(null);
  const [copyLabel, setCopyLabel] = useState(c.copy);

  useEffect(() => {
    setPlatform(detectPlatform());
    const found = extractInviteCode(decodeURIComponent(location.pathname));
    setCode(found);
    if (!found) return setValid(false);
    // The code is a secret the inviter shared. The page sends it only to api.proseio.com.br.
    fetch(`${API_URL}/v1/invites/${encodeURIComponent(found)}`, { referrerPolicy: "no-referrer" })
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (!p) return; // API down or rate-limited: keep the steps visible.
        setValid(p.valid === true);
        if (p.valid && typeof p.inviter_handle === "string" && new RegExp(reg.handles.pattern).test(p.inviter_handle)) setInviter(p.inviter_handle);
      })
      .catch(() => {});
  }, []);

  if (valid === false) {
    return (
      <section className="wrap narrow section">
        <h1>{c.title}</h1>
        <p className="lede">{c.invalid}</p>
        <p>{c.askNew}</p>
      </section>
    );
  }
  return (
    <section className="wrap narrow section">
      <h1>{inviter ? c.titleFrom(inviter) : c.title}</h1>
      <p className="lede">{c.lead}</p>
      <p style={{ marginTop: 32 }}>{c.yourCode}</p>
      <div className="actions" style={{ marginTop: 8 }}>
        <output className="mono invite-code">{code ?? "····-····-····"}</output>
        <button type="button" className="button secondary" disabled={!code} onClick={async () => setCopyLabel((await copyText(code!)) ? c.copied : c.copyFailed)}>{copyLabel}</button>
      </div>
      <p className="small muted">{c.oneUse}</p>
      {platform === "ios" && (
        <ol className="steps">
          <li>{c.iosSteps[0]}<div style={{ marginTop: 10 }}><InstallButton /></div></li>
          <li>{c.iosSteps[1]}</li>
          <li>{c.iosSteps[2]}</li>
        </ol>
      )}
      {platform === "android" && <p>{c.android}</p>}
      {platform === "other" && <p>{c.other}</p>}
    </section>
  );
}
