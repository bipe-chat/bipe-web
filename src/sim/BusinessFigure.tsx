import { ScenePhone } from "./ScenePhone";
import type { Lang } from "../shared";

// Static illustration of the proposed business messaging (bipe/docs/business-messaging.md):
// a verified institution, an automated reminder marked as such, no link, a reply. Scene "instituicao".
export function BusinessFigure({ lang, caption }: { lang: Lang; caption: string }) {
  return (
    <div className="stage">
      <ScenePhone lang={lang} id="empresa-pergunta" />
      <p className="caption">{caption}</p>
    </div>
  );
}
