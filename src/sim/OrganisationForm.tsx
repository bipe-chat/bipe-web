import { useState, type FormEvent } from "react";
import { API_URL } from "../config";
import { normalizeCnpj, type Lang } from "../shared";

type State = "idle" | "sending" | "done" | "error";
// The enums of OrganisationRequest in bipe-shared/api/openapi.yaml.
export const ORGANISATION_KINDS = ["company", "institution", "association", "public_body", "partner", "other"] as const;
export const CUSTOMER_BANDS = ["lt_100", "100_1k", "1k_10k", "10k_100k", "gt_100k"] as const;
export const CHANNELS = ["whatsapp_app", "whatsapp_api", "sms", "email", "phone", "own_app", "other"] as const;
export const SPEND_BANDS = ["zero", "lt_500", "500_2k", "2k_10k", "10k_50k", "gt_50k", "unknown"] as const;
type Kind = (typeof ORGANISATION_KINDS)[number];
export type OrganisationFormCopy = {
  organisation: string; name: string; email: string; role: string; cnpj: string; cnpjInvalid: string;
  kind: string; kinds: Record<Kind, string>;
  customers: string; customersBands: Record<(typeof CUSTOMER_BANDS)[number], string>;
  channels: string; channelOptions: Record<(typeof CHANNELS)[number], string>;
  spend: string; spendBands: Record<(typeof SPEND_BANDS)[number], string>; spendNote: string;
  message: string; submit: string; done: string; error: string; note: string;
};

/**
 * POST /v1/organisations (ADR 0126, bipe#410). The API answers 202 for every well-formed request.
 * The customer and spend questions are for organisations that want to use Bipe; a partner skips them.
 * Copy: `organisations.form` in product.json.
 */
export function OrganisationForm({ lang, copy: c, privacy, privacyLabel }: { lang: Lang; copy: OrganisationFormCopy; privacy: string; privacyLabel: string }) {
  const [state, setState] = useState<State>("idle");
  const [kind, setKind] = useState<Kind | "">("");
  const [cnpjBad, setCnpjBad] = useState(false);
  const asks = kind !== "partner";

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const field = (k: string) => String(form.get(k) ?? "").trim();
    const cnpj = field("cnpj");
    if (cnpj && !normalizeCnpj(cnpj)) return setCnpjBad(true);
    setState("sending");
    try {
      const r = await fetch(`${API_URL}/v1/organisations`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        referrerPolicy: "no-referrer",
        body: JSON.stringify({
          organisation: field("organisation"), name: field("name"), email: field("email"),
          role: field("role") || undefined, cnpj: cnpj || undefined, kind: field("kind"),
          ...(asks && {
            customers_band: field("customers_band") || undefined,
            channels: form.getAll("channels").map(String),
            spend_band: field("spend_band") || undefined,
            spend_note: field("spend_note") || undefined,
          }),
          message: field("message") || undefined, lang, website: field("website"),
        }),
      });
      setState(r.status === 202 ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") return <p className="waitlist-done" role="status">{c.done}</p>;
  return (
    <form className="org-form" onSubmit={submit}>
      <label>{c.organisation}<input name="organisation" required maxLength={200} autoComplete="organization" /></label>
      <label>{c.kind}
        <select name="kind" required value={kind} onChange={(e) => setKind(e.currentTarget.value as Kind)}>
          <option value="" disabled />
          {ORGANISATION_KINDS.map((k) => <option key={k} value={k}>{c.kinds[k]}</option>)}
        </select>
      </label>
      <label>{c.cnpj}
        <input name="cnpj" maxLength={32} inputMode="text" autoComplete="off" aria-invalid={cnpjBad} onChange={() => setCnpjBad(false)} />
        {cnpjBad && <span className="small" role="alert" style={{ color: "var(--cpd-color-text-critical-primary)", fontWeight: 400 }}>{c.cnpjInvalid}</span>}
      </label>
      <label>{c.name}<input name="name" required maxLength={120} autoComplete="name" /></label>
      <label>{c.role}<input name="role" maxLength={120} autoComplete="organization-title" /></label>
      <label>{c.email}<input name="email" type="email" required maxLength={254} autoComplete="email" /></label>
      {asks && (
        <>
          <label>{c.customers}
            <select name="customers_band" required defaultValue="">
              <option value="" disabled />
              {CUSTOMER_BANDS.map((b) => <option key={b} value={b}>{c.customersBands[b]}</option>)}
            </select>
          </label>
          <fieldset>
            <legend>{c.channels}</legend>
            {CHANNELS.map((ch) => <label className="check" key={ch}><input type="checkbox" name="channels" value={ch} />{c.channelOptions[ch]}</label>)}
          </fieldset>
          <label>{c.spend}
            <select name="spend_band" required defaultValue="">
              <option value="" disabled />
              {SPEND_BANDS.map((b) => <option key={b} value={b}>{c.spendBands[b]}</option>)}
            </select>
          </label>
          <label>{c.spendNote}<textarea name="spend_note" rows={2} maxLength={500} /></label>
        </>
      )}
      <label>{c.message}<textarea name="message" rows={4} maxLength={2000} /></label>
      {/* Honeypot: people never see or fill it. */}
      <input name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="visually-hidden" />
      <div><button className="button primary" type="submit" disabled={state === "sending"}>{c.submit}</button></div>
      {state === "error" && <p className="small" role="alert" style={{ color: "var(--cpd-color-text-critical-primary)" }}>{c.error}</p>}
      <p className="small muted">{c.note} <a href={privacy}>{privacyLabel}</a></p>
    </form>
  );
}
