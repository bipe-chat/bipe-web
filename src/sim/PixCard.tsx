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
      <div className="pixreq-main">
        <div>
          <strong className="pixreq-amount">{amount}</strong>
          {description && <div className="pixreq-desc">{description}</div>}
          <div className="pixreq-to">{name} <Seal size={13} label={t(lang, "proseio_badge_verified")} /></div>
        </div>
        <FakeQr seed={`${from}${amount}`} />
      </div>
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

/**
 * Looks like a Pix QR code, but cannot be scanned: three finder squares and seeded random modules,
 * with no format or error-correction data. Never draw a real BR Code on the site: a sample key
 * could belong to a real person.
 */
function FakeQr({ seed, size = 56 }: { seed: string; size?: number }) {
  const N = 21;
  let h = [...seed].reduce((acc, ch) => (acc * 31 + (ch.codePointAt(0) ?? 0)) >>> 0, 2166136261);
  const rand = () => ((h = (Math.imul(h, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  const finder = (x: number, y: number) => `M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5zM${x + 2} ${y + 2}h3v3h-3z`;
  const inFinder = (x: number, y: number) => (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9);
  let d = finder(0, 0) + finder(N - 7, 0) + finder(0, N - 7);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!inFinder(x, y) && rand() < 0.45) d += `M${x} ${y}h1v1h-1z`;
  return (
    <svg className="pixreq-qr" width={size} height={size} viewBox={`-1 -1 ${N + 2} ${N + 2}`} aria-hidden="true">
      <rect x="-1" y="-1" width={N + 2} height={N + 2} fill="#fff" />
      <path d={d} fill="#000" fillRule="evenodd" />
    </svg>
  );
}
