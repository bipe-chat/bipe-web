// Landing pages for the links in account emails from the API (ADR 0057, 0059):
// /confirmar-email/#<token> and /recuperar/#<token>. The token is in the fragment, so the browser
// never sends it to bipe.chat. The confirm page sends it only to api.bipe.net.br. The recovery page
// sends it nowhere: the PIN and the claim belong in the app, which opens the link as a universal
// link (.well-known/apple-app-site-association in bipe-infra) before this page loads.
import { useEffect, useRef, useState } from "react";
import { chrome } from "../copy";
import { API_URL } from "../config";
import { detectPlatform, type Platform } from "../platform";
import { accountRules, distribution, type Lang } from "../shared";
import { InstallButton } from "./LinkPages";

/** Reads the token from the fragment, then removes it from the address bar and the history entry. */
function takeFragmentToken(): string | null {
  const raw = location.hash.slice(1);
  if (raw) history.replaceState(null, "", location.pathname + location.search);
  // Same shape as the API's tokens (base64url, at most 128 characters in the contract). The API decides.
  return /^[A-Za-z0-9_-]{1,128}$/.test(raw) ? raw : null;
}

function LangSwitch({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <p className="small muted" style={{ marginTop: 40 }}>
      <button type="button" className="linklike" lang={lang === "pt" ? "en" : "pt-BR"} onClick={() => setLang(lang === "pt" ? "en" : "pt")}>
        {chrome[lang].readOther}
      </button>
    </p>
  );
}

type ConfirmState = "working" | "done" | "failed" | "taken" | "error";

export function ConfirmEmailLanding(_: Record<string, never>) {
  const [lang, setLang] = useState<Lang>("pt");
  const [state, setState] = useState<ConfirmState>("working");
  const token = useRef<string | null>(null);
  const c = chrome[lang].confirmEmail;

  async function confirm() {
    if (!token.current) return setState("failed");
    setState("working");
    try {
      const r = await fetch(`${API_URL}/v1/email/verify`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: token.current }),
        credentials: "omit",
        referrerPolicy: "no-referrer",
      });
      if (r.ok) return setState("done");
      if (r.status === 403) return setState("failed");
      if (r.status === 409) return setState("taken");
      setState("error");
    } catch {
      setState("error");
    }
  }

  useEffect(() => {
    token.current = takeFragmentToken();
    void confirm();
  }, []);

  const title = state === "done" ? c.doneTitle : state === "working" ? c.title : c.failedTitle;
  return (
    <section className="wrap narrow section" lang={lang === "pt" ? "pt-BR" : "en"}>
      <h1>{title}</h1>
      <p className="lede" role="status">
        {state === "working" ? c.working : state === "done" ? c.done : state === "taken" ? c.taken : state === "error" ? c.error : c.failed}
      </p>
      {state === "error" && (
        <div className="actions"><button type="button" className="button secondary" onClick={() => void confirm()}>{c.retry}</button></div>
      )}
      <LangSwitch lang={lang} setLang={setLang} />
    </section>
  );
}

export function RecoverLanding(_: Record<string, never>) {
  const [lang, setLang] = useState<Lang>("pt");
  const [platform, setPlatform] = useState<Platform>("ios");
  const c = chrome[lang].recover;

  useEffect(() => {
    setPlatform(detectPlatform());
    // The token is for the app only. The page drops it so it stays out of the browser history.
    takeFragmentToken();
  }, []);

  const androidReady = Boolean(distribution.android.url);
  return (
    <section className="wrap narrow section" lang={lang === "pt" ? "pt-BR" : "en"}>
      <h1>{c.title}</h1>
      <p className="lede">{c.lead}</p>
      {(platform === "ios" || (platform === "android" && androidReady)) && (
        <ol className="steps">
          <li>{c.iosSteps[0]}<div style={{ marginTop: 10 }}>{platform === "ios" ? <InstallButton lang={lang} /> : <a className="button primary" href={distribution.android.url!}>{distribution.android[lang].label}</a>}</div></li>
          <li>{c.iosSteps[1]}</li>
          <li>{c.iosSteps[2]}</li>
        </ol>
      )}
      {platform === "android" && !androidReady && <p>{c.android}</p>}
      {platform === "other" && <p>{c.other}</p>}
      <p>{c.after(accountRules.recoveryDelayHours.email)}</p>
      <p className="small muted">{c.linkLife(accountRules.recoveryLinkMinutes)}</p>
      <p className="small muted">{c.safety}</p>
      <LangSwitch lang={lang} setLang={setLang} />
    </section>
  );
}
