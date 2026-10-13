import { Avatar, who } from "../cast";
import { chrome } from "../copy";
import { Bubble, Phone } from "../components/phone";
import { t, type Lang } from "../shared";

// Static illustration of a planned feature: a quiet group opened after a gap, with the
// "O que você perdeu" block above the unread messages. Sample data; the block lines are the app's own strings.
export function GroupsFigure({ lang, caption }: { lang: Lang; caption: string }) {
  const group = who("faculdade");
  return (
    <div className="stage">
      <Phone
        lang={lang}
        head={<>
          <Avatar id="faculdade" size={32} />
          <div className="who">
            <div className="name">{group.name}</div>
            <div className="sub">{chrome[lang].people(group.members ?? 0)}</div>
          </div>
        </>}
      >
        <div className="card-item">
          <div className="missed">
            <div className="missed-head">{t(lang, "bipe_group_missed_title")}</div>
            <div className="missed-row">
              <strong>{t(lang, "bipe_group_missed_mention", "Bia")}</strong>
              <span>@gabi você leva o carvão?</span>
            </div>
            <div className="missed-row">
              <strong>{t(lang, "bipe_group_missed_reply", "Léo")}</strong>
              <span>Fechado, 13h lá em casa</span>
            </div>
            <div className="missed-row">
              <strong>{t(lang, "bipe_group_missed_poll", "Sábado ou domingo?")}</strong>
            </div>
            <div className="missed-more">{t(lang, "bipe_group_missed_more", "142")}</div>
          </div>
        </div>
        <div className="msg"><Bubble lang={lang} sender="caio">Alguém viu o jogo ontem?</Bubble></div>
        <div className="msg"><Bubble lang={lang} sender="duda">Vi, que sofrimento</Bubble></div>
      </Phone>
      <p className="caption">{caption}</p>
    </div>
  );
}
