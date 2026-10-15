// Conferir no Bipe (pix-check): a Pix code shared into Bipe from another app, then the result screen.
// The result comes from pixCheck() in bipe-shared (tools/lib/pix.mjs), the same logic as the apps. Labels are app strings.
import { who } from "../cast";
import { Mark } from "../components/brand";
import { Bubble, Phone } from "../components/phone";
import { TrustCard } from "../components/ui";
import { chrome } from "../copy";
import { pixCheck, reg, t, type Lang } from "../shared";
import { text, type Text } from "./scenes";
import "./Agenda.css";

const brl = (amount: string) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(amount));

/** Beat 1: the message in another app, with the share sheet open on Bipe. Beat 2: the check result. */
export function PixCheckFlow({ lang, from, message, code, beat }: { lang: Lang; from: string; message: Text; code: string; beat: number }) {
  if (beat <= 1) {
    return (
      <Phone lang={lang} layout="form" head={`${chrome[lang].diagrams.otherApp} · ${who(from).short}`} footer={<span />}>
        <div className="pixcheck-other">
          <div className="msg"><Bubble lang={lang}>{text(message, lang)}</Bubble></div>
          <div className="msg"><Bubble lang={lang}><span className="pixcheck-code">{code}</span></Bubble></div>
        </div>
        <div className="pixcheck-share msg">
          <span className="pixcheck-app on"><span className="push-icon big"><Mark size={22} /></span>{t(lang, "bipe_pix_check_title")}</span>
          <span className="pixcheck-app"><span className="pixcheck-blank" /></span>
          <span className="pixcheck-app"><span className="pixcheck-blank" /></span>
          <span className="pixcheck-app"><span className="pixcheck-blank" /></span>
        </div>
      </Phone>
    );
  }
  const result = pixCheck(code, reg).code;
  if (!result) return null;
  const rows: [string, string][] = [
    ["bipe_pix_check_field_name", result.name ?? ""],
    ["bipe_pix_check_field_amount", result.amount ? brl(result.amount) : t(lang, "bipe_pix_check_amount_open")],
    ["bipe_pix_check_field_key", result.key ?? ""],
    ["bipe_pix_check_field_city", result.city ?? ""],
  ];
  return (
    <Phone lang={lang} layout="form" head={t(lang, "bipe_pix_check_title")} footer={<span />}>
      <strong className="msg">{t(lang, "bipe_pix_check_code_title")}</strong>
      {result.status === "badCrc" && <div className="msg"><TrustCard level="danger" icon="warning" title={t(lang, "bipe_pix_check_code_bad_crc")} /></div>}
      {result.status === "malformed" && <div className="msg"><TrustCard level="danger" icon="warning" title={t(lang, "bipe_pix_check_code_malformed")} /></div>}
      <div className="agenda-rows msg">
        {rows.map(([k, v]) => (
          <div className="agenda-row" key={k}><div className="agenda-row-main"><span className="sub">{t(lang, k)}</span><strong>{v}</strong></div></div>
        ))}
      </div>
      <p className="sub msg">{t(lang, "bipe_pix_check_name_hint")}</p>
      <p className="sub msg">{t(lang, "bipe_pix_check_private")}</p>
      <span className="pill wide agenda-confirm">{t(lang, "bipe_pix_check_close")}</span>
    </Phone>
  );
}
