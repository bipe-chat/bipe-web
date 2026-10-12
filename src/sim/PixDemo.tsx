import { useEffect, useState } from "react";
import { who } from "../cast";
import { chrome } from "../copy";
import { Bubble, Phone } from "../components/phone";
import { Icon, TrustCard } from "../components/ui";
import type { Lang } from "../shared";
import { brl, PixCard, type PixStatus } from "./PixCard";
import { ChatHead } from "./ScenePhone";
import { pixExamples, text, type PixExample } from "./scenes";
import { Stage } from "./Stage";
import "./PixDemo.css";

// The Pix request card (status "planned"; the card look is a draft). Each page load plays one
// example from the library, picked at random: ask, card, copy, bank check. When the bank shows the
// card's name, the payer marks "Enviei" and the card says "pago" only after the requester marks
// "Recebi". When the bank shows another name, the story stops there.
const beatsOf = (ex: PixExample) => (ex.bank === "match" ? 5 : 3);

function PixPhone({ lang, ex, b }: { lang: Lang; ex: PixExample; b: number }) {
  const c = chrome[lang].pix;
  const e = who(ex.from);
  const money = brl(ex.amount);
  const status: PixStatus = b >= 5 ? "received" : b >= 4 ? "sent" : "issued";
  return (
    <Phone lang={lang} head={<ChatHead lang={lang} id={ex.from} trust={e.trust} />}>
      {b >= 1 && <div className="msg"><Bubble lang={lang} out>{text(ex.ask, lang)}</Bubble></div>}
      {b >= 2 && <div className="msg card-item"><PixCard lang={lang} from={ex.from} amount={money} description={ex.description} status={status} copied={b === 3} /></div>}
      {b === 3 && (
        <div className="msg card-item">
          <div className="bank-sheet">
            <div className="bank-head">{c.bankApp}</div>
            <div className="bank-row"><span>{c.bankTo}</span><strong>{ex.bank === "match" ? e.name : c.otherName}</strong></div>
            <div className="bank-row"><span>{c.amount}</span><strong>{money}</strong></div>
            {ex.bank === "match"
              ? <div className="bank-ok"><Icon name="check" size={14} /> {c.match}</div>
              : <TrustCard level="danger" icon="warning" title={c.mismatch} />}
          </div>
        </div>
      )}
      {b >= 5 && ex.thanks && <div className="msg"><Bubble lang={lang}>{text(ex.thanks, lang)}</Bubble></div>}
    </Phone>
  );
}

export function PixDemo({ lang, caption }: { lang: Lang; caption: string }) {
  // The prerendered phone is empty. The client picks the example on mount, before the demo
  // (far down the page) scrolls into view, so a reader never sees one example swap for another.
  const [pick, setPick] = useState<number | null>(null);
  useEffect(() => setPick(Math.floor(Math.random() * pixExamples.length)), []);
  if (pick === null) {
    return (
      <div className="stage">
        <Phone lang={lang} head={null}>{null}</Phone>
        <p className="caption">{caption}</p>
      </div>
    );
  }
  const ex = pixExamples[pick];
  const steps = beatsOf(ex);
  const hold = (beat: number) => (beat === 0 ? 700 : beat >= steps ? 4200 : 2200);
  return (
    <Stage lang={lang} caption={caption} steps={steps} holdMs={hold}>
      {(beat) => <PixPhone lang={lang} ex={ex} b={beat} />}
    </Stage>
  );
}
