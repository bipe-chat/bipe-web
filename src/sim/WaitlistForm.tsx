import { useState, type FormEvent } from "react";
import { chrome } from "../copy";
import { API_URL } from "../config";
import { paths } from "../paths";
import type { Lang } from "../shared";

type State = "idle" | "sending" | "done" | "error";

/** POST /v1/waitlist (ADR 0025). The API answers 202 for every well-formed request. */
export function WaitlistForm({ lang, platform, source }: { lang: Lang; platform: "android" | "ios" | "other"; source: string }) {
  const c = chrome[lang].waitlist;
  const [state, setState] = useState<State>("idle");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setState("sending");
    try {
      const r = await fetch(`${API_URL}/v1/waitlist`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        referrerPolicy: "no-referrer",
        body: JSON.stringify({ email: String(form.get("email") ?? ""), platform, lang, source, website: String(form.get("website") ?? "") }),
      });
      setState(r.status === 202 ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") return <p className="waitlist-done" role="status">{c.done}</p>;
  return (
    <form className="waitlist" onSubmit={submit}>
      <label htmlFor={`wl-${platform}`} className="visually-hidden">{c.label}</label>
      <div className="row">
        <input id={`wl-${platform}`} name="email" type="email" required maxLength={254} autoComplete="email" placeholder={c.placeholder} />
        <button className="button primary" type="submit" disabled={state === "sending"}>{c.submit}</button>
      </div>
      {/* Honeypot: people never see or fill it. */}
      <input name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="visually-hidden" />
      {state === "error" && <p className="small" role="alert" style={{ color: "var(--cpd-color-text-critical-primary)" }}>{c.error}</p>}
      <p className="small muted">{c.note} <a href={paths.privacy(lang)}>{chrome[lang].privacy}</a></p>
    </form>
  );
}
