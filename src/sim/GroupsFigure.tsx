import { Phone } from "../components/ui";
import { t, type Lang } from "../shared";

// Static illustration of a planned feature: a quiet group opened after a gap, with the
// "O que você perdeu" block above the unread messages. Sample data; the block lines are the app's own strings.
export function GroupsFigure({ lang, caption }: { lang: Lang; caption: string }) {
  const pt = lang === "pt";
  return (
    <div className="stage">
      <Phone
        lang={lang}
        head={<>
          <div className="avatar">GF</div>
          <div className="who">
            <div className="name">Galera da faculdade</div>
            <div className="sub">{pt ? "34 pessoas" : "34 people"}</div>
          </div>
        </>}
      >
        <div className="missed">
          <div className="missed-head">{t(lang, "proseio_group_missed_title")}</div>
          <div className="missed-row">
            <strong>{t(lang, "proseio_group_missed_mention", "Bia")}</strong>
            <span>@gabi você leva o carvão?</span>
          </div>
          <div className="missed-row">
            <strong>{t(lang, "proseio_group_missed_reply", "Léo")}</strong>
            <span>Fechado, 13h lá em casa</span>
          </div>
          <div className="missed-row">
            <strong>{t(lang, "proseio_group_missed_poll", "Sábado ou domingo?")}</strong>
          </div>
          <div className="missed-row">
            <strong>{t(lang, "proseio_group_missed_pinned", "Endereço do Léo")}</strong>
          </div>
          <div className="missed-more">{t(lang, "proseio_group_missed_more", "142")}</div>
        </div>
        <div className="bubble in"><strong>Caio</strong><br />Alguém viu o jogo ontem?</div>
        <div className="bubble in"><strong>Duda</strong><br />Vi, que sofrimento</div>
      </Phone>
      <p className="caption">{caption}</p>
    </div>
  );
}
