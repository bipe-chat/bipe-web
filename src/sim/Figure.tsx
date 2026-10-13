import { Island } from "../island-registry";
import type { Lang } from "../shared";
import { BusinessFigure } from "./BusinessFigure";
import { GroupsFigure } from "./GroupsFigure";
import { NoAdsFigure } from "./NoAdsFigure";
import { SCAM_REEL, SIMS, type FigureId, type SimId } from "./scenes";

const isSim = (id: FigureId): id is SimId => (SIMS as readonly string[]).includes(id);

/**
 * The one figure switch: a sim or static figure by id, else the phone scene with that id.
 * Tentpole demos and feature figures (product.json) both render through it.
 */
export function Figure({ lang, id, caption }: { lang: Lang; id: FigureId; caption: string }) {
  if (!isSim(id)) return <Island name="SceneSim" props={{ lang, id, caption }} />;
  switch (id) {
    case "scam": return <Island name="SceneReel" props={{ lang, ids: SCAM_REEL, caption }} />;
    case "identity": return <Island name="IdentitySim" props={{ lang, caption }} />;
    case "handle": return <Island name="HandleSim" props={{ lang, caption }} />;
    case "groups": return <GroupsFigure lang={lang} caption={caption} />;
    case "levels": return <Island name="TrustLevels" props={{ lang, caption }} />;
    case "pix": return <Island name="PixDemo" props={{ lang, caption }} />;
    case "business": return <BusinessFigure lang={lang} caption={caption} />;
    case "noAds": return <NoAdsFigure lang={lang} caption={caption} />;
  }
}
