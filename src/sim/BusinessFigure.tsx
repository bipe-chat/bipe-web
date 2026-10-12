import { Seal } from "../components/brand";
import { Phone } from "../components/ui";
import { t, type Lang } from "../shared";

// Static illustration of the proposed business messaging (proseio/docs/business-messaging.md):
// a verified institution, an automated reminder marked as such, no link, a reply. Sample data.
export function BusinessFigure({ lang, caption }: { lang: Lang; caption: string }) {
  const pt = lang === "pt";
  return (
    <div className="stage">
      <Phone
        lang={lang}
        head={<>
          <div className="avatar">CV</div>
          <div className="who">
            <div className="name">Clínica Vida <Seal size={14} label={t(lang, "proseio_badge_institution")} /></div>
            <div className="sub">{t(lang, "proseio_badge_institution")} · CNPJ 00.000.000/0001-00</div>
          </div>
        </>}
      >
        <div className="notice">
          <div className="notice-band"><Seal size={12} label={t(lang, "proseio_badge_institution")} /> {pt ? "Mensagem automática" : "Automated message"}</div>
          <p>Sua consulta é amanhã, às 14h, com a Dra. Ana. Responda 1 para confirmar ou 2 para remarcar.</p>
        </div>
        <div className="bubble out">1</div>
        <div className="bubble in">Consulta confirmada. Até amanhã.</div>
      </Phone>
      <p className="caption">{caption}</p>
    </div>
  );
}
