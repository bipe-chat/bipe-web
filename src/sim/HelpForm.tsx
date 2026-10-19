import { useState, type FormEvent } from "react";
import { HELP_FORM_URL } from "../config";
import type { Lang } from "../shared";

type State = "idle" | "sending" | "done" | "error";
export type HelpFormCopy = { name: string; email: string; message: string; submit: string; done: string; error: string; note: string };

/**
 * The help form on /ajuda/ (bipe#273). Posts to the `contact` form of the Bipe workspace on Starlings, which files
 * each message as the sender's private conversation and mails them a link to continue it. Starlings answers 202 for
 * every well-formed request, the honeypot included. Copy: `help.form` in src/copy.ts.
 */
export function HelpForm({ lang, copy: c, privacy, privacyLabel }: { lang: Lang; copy: HelpFormCopy; privacy: string; privacyLabel: string }) {
  const [state, setState] = useState<State>("idle");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const field = (k: string) => String(form.get(k) ?? "").trim();
    setState("sending");
    try {
      const r = await fetch(HELP_FORM_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        referrerPolicy: "no-referrer",
        body: JSON.stringify({ name: field("name"), email: field("email"), message: field("message"), lang, website: field("website") }),
      });
      setState(r.status === 202 ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") return <p className="waitlist-done" role="status">{c.done}</p>;
  return (
    <form className="org-form" onSubmit={submit}>
      <label>{c.name}<input name="name" required maxLength={120} autoComplete="name" /></label>
      <label>{c.email}<input name="email" type="email" required maxLength={254} autoComplete="email" /></label>
      <label>{c.message}<textarea name="message" required rows={5} maxLength={4000} /></label>
      {/* Honeypot: people never see or fill it. */}
      <input name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="visually-hidden" />
      <div><button className="button primary" type="submit" disabled={state === "sending"}>{c.submit}</button></div>
      {state === "error" && <p className="small" role="alert" style={{ color: "var(--cpd-color-text-critical-primary)" }}>{c.error}</p>}
      <p className="small muted">{c.note} <a href={privacy}>{privacyLabel}</a></p>
    </form>
  );
}
