import { Seal } from "../components/brand";
import { Phone } from "../components/ui";
import { t, type Lang } from "../shared";

// Static illustration of a planned feature: a Prédio group with a notice kept apart from the chat
// and a Pix request card. Sample data; the Pix line is the app's own string.
export function GroupsFigure({ lang, caption }: { lang: Lang; caption: string }) {
  const pt = lang === "pt";
  return (
    <div className="stage">
      <Phone
        lang={lang}
        head={<>
          <div className="avatar">PJ</div>
          <div className="who">
            <div className="name">Prédio Jardim</div>
            <div className="sub">{pt ? "Prédio · 48 moradores" : "Building · 48 residents"}</div>
          </div>
        </>}
      >
        <div className="notice">
          <div className="notice-band"><Seal size={12} label={t(lang, "proseio_badge_institution")} /> {pt ? "Aviso do condomínio" : "Building notice"}</div>
          <p>Manutenção da caixa d'água no sábado, das 8h às 12h.</p>
        </div>
        <div className="bubble in"><strong>Rita, 302</strong><br />Alguém tem uma escada pra emprestar?</div>
        <div className="bubble out">Tenho, passo aí às 18h</div>
        <div className="pix-card">
          <div className="pix-head"><span>Pix</span><strong>R$ 45,00</strong></div>
          <p>Taxa do salão de festas</p>
          <p className="small">{t(lang, "proseio_pix_card_bank_name", "Condomínio Jardim")}</p>
        </div>
      </Phone>
      <p className="caption">{caption}</p>
    </div>
  );
}
