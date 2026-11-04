// A quote shared as a link (bipe-shared spec loja-web, ADR 0185): bipe.chat/@loja?orcamento=<link>, for a person with no
// Bipe account. The link is the only key. Accepting makes a name-only order at the shop. No login, card or password
// field, and no payment until the Pix in chat milestone.
import { useEffect, useState } from "react";
import { API_URL } from "../config";
import { t } from "../shared";

type Line = { name: string; quantity: number; total_amount_cents: number };
type WebQuote = {
  business_name: string;
  customer_name: string;
  status: "offered" | "accepted" | "refused" | "expired";
  version: { version: number; valid_until: string; lines: Line[]; total_amount_cents: number };
};

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const day = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" });

export function QuoteLanding({ handle, link }: { handle: string; link: string }) {
  const base = `${API_URL}/v1/businesses/${encodeURIComponent(handle)}/quote-links/${encodeURIComponent(link)}`;
  const [quote, setQuote] = useState<WebQuote>();
  const [gone, setGone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    fetch(base, { referrerPolicy: "no-referrer" })
      .then((r) => (r.ok ? (r.json() as Promise<WebQuote>) : Promise.reject(new Error(String(r.status)))))
      .then(setQuote, () => setGone(true));
  }, [base]);

  const decide = (action: "accept" | "refuse") => {
    if (!quote) return;
    setBusy(true);
    setError(undefined);
    fetch(`${base}/${action}`, {
      method: "POST",
      referrerPolicy: "no-referrer",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ version: quote.version.version }),
    })
      .then(async (r) => {
        const body = (await r.json().catch(() => undefined)) as (WebQuote & { error?: string }) | undefined;
        if (r.ok && body) setQuote(body);
        else if (body?.error === "quote_version_changed") setError(t("pt", "bipe_quote_error_version"));
        else if (body?.error === "quote_expired") setError(t("pt", "bipe_quote_error_expired"));
        else setError(t("pt", "bipe_quote_error"));
      }, () => setError(t("pt", "bipe_error_network")))
      .finally(() => setBusy(false));
  };

  if (gone) return <section className="wrap narrow section"><p className="lede">{t("pt", "bipe_quote_link_gone")}</p></section>;
  if (!quote) return <section className="wrap narrow section" />;
  return (
    <section className="wrap narrow section">
      <h1 style={{ overflowWrap: "anywhere" }}>{quote.business_name}</h1>
      <div className="shop-form">
        <p className="small muted">{t("pt", "bipe_quote_card_title")} · {t("pt", "bipe_quote_version", String(quote.version.version))} · {quote.customer_name}</p>
        <ul className="quote-lines">
          {quote.version.lines.map((line, i) => (
            <li key={i}>
              <span>{t("pt", "bipe_order_line", String(line.quantity), line.name)}</span>
              <span>{money.format(line.total_amount_cents / 100)}</span>
            </li>
          ))}
        </ul>
        <p><strong>{t("pt", "bipe_quote_total")}: {money.format(quote.version.total_amount_cents / 100)}</strong></p>
        <p className="small muted">{t("pt", "bipe_quote_valid_until", day.format(Date.parse(quote.version.valid_until)))}</p>
        {error && <p className="small" role="alert">{error}</p>}
        {quote.status === "offered" ? (
          <div className="shop-actions">
            <button type="button" className="button primary" disabled={busy} onClick={() => decide("accept")}>{t("pt", "bipe_quote_accept")}</button>
            <button type="button" className="button" disabled={busy} onClick={() => decide("refuse")}>{t("pt", "bipe_quote_decline")}</button>
          </div>
        ) : (
          <p>
            <strong>
              {quote.status === "accepted" ? t("pt", "bipe_quote_link_accepted")
                : quote.status === "refused" ? t("pt", "bipe_quote_link_refused")
                : t("pt", "bipe_quote_status_expired")}
            </strong>
          </p>
        )}
      </div>
    </section>
  );
}
