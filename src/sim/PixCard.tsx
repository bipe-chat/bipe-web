import { who } from "../cast";
import { Seal } from "../components/brand";
import { Icon } from "../components/ui";
import { t, type Lang } from "../shared";
import "./PixCard.css";

/**
 * Pix request card as the payer sees it (proseio/docs/payments.md item 1, ADRs 0046 and 0048).
 * DRAFT look: the design system has no artwork for it yet. The rules are decided:
 * only a verified requester sends one, the card names who the bank must show,
 * and "pago" appears only after the requester marks "recebi".
 */
export type PixStatus = "issued" | "sent" | "received";

export function PixCard({ lang, from, amount, description, status = "issued", copied = false, pause = false }: {
  lang: Lang; from: string; amount: string; description?: string; status?: PixStatus; copied?: boolean; pause?: boolean;
}) {
  const e = who(from);
  const name = e.name ?? "";
  return (
    <div className={`pixreq ${status}`}>
      <div className="pixreq-head">
        <span><Icon name="pix" size={14} /> {t(lang, "proseio_pix_card_title")}</span>
        {status === "received"
          ? <span className="pixreq-chip paid">{t(lang, "proseio_pix_card_status_paid")}</span>
          : status === "issued" && <span className="pixreq-chip">{t(lang, "proseio_pix_card_status_issued")}</span>}
      </div>
      <strong className="pixreq-amount">{amount}</strong>
      {description && <div className="pixreq-desc">{description}</div>}
      <div className="pixreq-to">{name} <Seal size={13} label={t(lang, "proseio_badge_verified")} /></div>
      <p className="pixreq-bank">{t(lang, "proseio_pix_card_bank_name", name)}</p>
      {status === "issued" && (pause
        ? <div className="pixreq-action wait">{t(lang, "proseio_pause_countdown", "5")}</div>
        : <div className={`pixreq-action${copied ? " done" : ""}`}>{t(lang, copied ? "proseio_pix_card_copied" : "proseio_pix_card_copy")}</div>)}
      {status === "sent" && <p className="pixreq-status">{t(lang, "proseio_pix_card_status_sent", e.short ?? name)}</p>}
    </div>
  );
}

/** "R$ 850,00" from a number of reais. */
export const brl = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value).replace(/ /g, " ");
