import type { ReactNode } from "react";
import { Island } from "../island-registry";
import paletteOrder from "../palette-order.json";
import type { Lang } from "../shared";
import { BusinessFigure } from "./BusinessFigure";
import { GroupsFigure } from "./GroupsFigure";
import { NoAdsFigure } from "./NoAdsFigure";
import { BrazilFigure, E2eeFigure, HandoffFigure, NoSmsFigure, OpenSourceFigure } from "./StaticFigures";
import { SCAM_REEL, SIMS, type FigureId, type SimId } from "./scenes";

const isSim = (id: FigureId): id is SimId => (SIMS as readonly string[]).includes(id);

/** The app palette of a figure's stage: one of src/palette-order.json, from the id, so a figure has the same colour on every page. */
export function figureTone(id: string): string {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return paletteOrder[h % paletteOrder.length];
}

/**
 * The one figure switch: a sim or static figure by id, else the phone scene with that id.
 * Tentpole demos and feature figures (product.json) both render through it. The wrapper sets the stage's
 * palette (site.css .tone-*) and takes no box of its own; `tone` names the palette where a page sets it.
 */
export function Figure({ lang, id, caption, tone }: { lang: Lang; id: FigureId; caption: string; tone?: string }) {
  return <div className={`tone-${tone ?? figureTone(id)}`} style={{ display: "contents" }}>{figureBody(lang, id, caption)}</div>;
}

function figureBody(lang: Lang, id: FigureId, caption: string): ReactNode {
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
    case "noSms": return <NoSmsFigure lang={lang} caption={caption} />;
    case "handoff": return <HandoffFigure lang={lang} caption={caption} />;
    case "e2ee": return <E2eeFigure lang={lang} caption={caption} />;
    case "brazil": return <BrazilFigure lang={lang} caption={caption} />;
    case "openSource": return <OpenSourceFigure lang={lang} caption={caption} />;
    case "bizInbox": return <Island name="InboxMini" props={{ lang, caption }} />;
    case "bizApi": return <Island name="ApiMini" props={{ lang, caption }} />;
    case "bizArrive": return <Island name="ArriveMini" props={{ lang, caption }} />;
  }
}
