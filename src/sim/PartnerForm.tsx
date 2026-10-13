import { useState, type FormEvent } from "react";
import { API_URL } from "../config";
import type { Lang } from "../shared";

type State = "idle" | "sending" | "done" | "error";
export const PARTNER_KINDS = ["funder", "tech", "bank", "research", "civil", "public", "other"] as const;
export type PartnerFormCopy = {
  organisation: string; name: string; email: string; kind: string; kinds: Record<(typeof PARTNER_KINDS)[number], string>;
  message: string; submit: string; done: string; error: string; note: string; orEmail: string;
};

/** POST /v1/partners (bipe#177). The API answers 202 for every well-formed request. Copy: `partners.form` in product.json. */
export function PartnerForm({ lang, copy: c, contact, privacy, privacyLabel }: { lang: Lang; copy: PartnerFormCopy; contact: string; privacy: string; privacyLabel: string }) {
  const [state, setState] = useState<State>("idle");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const field = (k: string) => String(form.get(k) ?? "");
    setState("sending");
    try {
      const r = await fetch(`${API_URL}/v1/partners`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        referrerPolicy: "no-referrer",
        body: JSON.stringify({
          organisation: field("organisation"), name: field("name"), email: field("email"), kind: field("kind"),
          message: field("message"), lang, website: field("website"),
        }),
      });
      setState(r.status === 202 ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") return <p className="waitlist-done" role="status">{c.done}</p>;
  return (
    <form className="partner-form" onSubmit={submit}>
      <label>{c.organisation}<input name="organisation" required maxLength={200} autoComplete="organization" /></label>
      <label>{c.name}<input name="name" required maxLength={120} autoComplete="name" /></label>
      <label>{c.email}<input name="email" type="email" required maxLength={254} autoComplete="email" /></label>
      <label>{c.kind}
        <select name="kind" required defaultValue="">
          <option value="" disabled />
          {PARTNER_KINDS.map((k) => <option key={k} value={k}>{c.kinds[k]}</option>)}
        </select>
      </label>
      <label>{c.message}<textarea name="message" rows={4} maxLength={2000} /></label>
      {/* Honeypot: people never see or fill it. */}
      <input name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="visually-hidden" />
      <div><button className="button primary" type="submit" disabled={state === "sending"}>{c.submit}</button></div>
      {state === "error" && <p className="small" role="alert" style={{ color: "var(--cpd-color-text-critical-primary)" }}>{c.error}</p>}
      <p className="small muted">{c.note} <a href={privacy}>{privacyLabel}</a></p>
      <p className="small muted">{c.orEmail} <a href={`mailto:${contact}`}>{contact}</a></p>
    </form>
  );
}
