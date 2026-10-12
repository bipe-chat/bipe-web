import { useState } from "react";
import { who } from "../cast";
import { chrome } from "../copy";
import { Bubble, Phone } from "../components/phone";
import { Icon, TrustCard } from "../components/ui";
import { t, type Lang } from "../shared";
import { brl, PixCard, type PixStatus } from "./PixCard";
import { ChatHead } from "./ScenePhone";
import "./PixDemo.css";

const FROM = "rafa";
type Step = "issued" | "copied" | "sent" | "received";

/**
 * Try-it for the Pix request card (status "planned"; the card look is a draft).
 * The visitor is the payer: set the amount, copy the code, choose what the bank app shows,
 * then mark "Enviei" and see why the card says "pago" only after the requester marks "Recebi".
 */
export function PixDemo({ lang, caption }: { lang: Lang; caption: string }) {
  const c = chrome[lang].pix;
  const e = who(FROM);
  const [amount, setAmount] = useState("850");
  const [description, setDescription] = useState(c.descriptionDefault);
  const [otherName, setOtherName] = useState(false);
  const [step, setStep] = useState<Step>("issued");

  const value = Math.min(Math.max(Number(amount.replace(",", ".")) || 0, 0.01), 99999);
  const money = brl(value);
  const status: PixStatus = step === "copied" ? "issued" : step;
  const bankName = otherName ? c.otherName : e.name!;
  const blocked = step === "copied" && otherName;
  const next = () => setStep(step === "issued" ? "copied" : step === "copied" ? "sent" : step === "sent" ? "received" : "issued");
  const nextLabel = { issued: c.stepCopy, copied: c.stepSent, sent: c.stepReceived(e.short!), received: c.stepRestart }[step];
  const statusText = {
    issued: t(lang, "proseio_pix_card_status_issued"),
    copied: t(lang, "proseio_pix_card_copied"),
    sent: t(lang, "proseio_pix_card_status_sent", e.short!),
    received: t(lang, "proseio_pix_card_status_paid"),
  }[step];

  return (
    <div className="pix-demo">
      <div className="pix-controls">
        <label>{c.amount}<input inputMode="decimal" value={amount} onChange={(ev) => setAmount(ev.target.value.replace(/[^\d,.]/g, "").slice(0, 8))} /></label>
        <label>{c.description}<input value={description} maxLength={40} onChange={(ev) => setDescription(ev.target.value)} /></label>
        <fieldset>
          <legend>{c.bankShows}</legend>
          <label className="radio"><input type="radio" name="pix-bank" checked={!otherName} onChange={() => setOtherName(false)} />{e.name}</label>
          <label className="radio"><input type="radio" name="pix-bank" checked={otherName} onChange={() => setOtherName(true)} />{c.otherName}</label>
        </fieldset>
        <button type="button" className="button primary" onClick={next} disabled={blocked}>{nextLabel}</button>
        {step !== "issued" && <button type="button" className="pix-restart" onClick={() => setStep("issued")}>{c.stepRestart}</button>}
        <p className="small" aria-live="polite">{blocked ? c.blocked : statusText}</p>
        <p className="small muted">{c.note}</p>
      </div>
      <div className="stage">
        <Phone lang={lang} head={<ChatHead lang={lang} id={FROM} trust={e.trust} />}>
          <div className="msg"><Bubble lang={lang} out>{c.ask}</Bubble></div>
          <div className="msg card-item"><PixCard lang={lang} from={FROM} amount={money} description={description.trim() || undefined} status={status} copied={step === "copied"} /></div>
          {step === "copied" && (
            <div className="msg card-item">
              <div className="bank-sheet">
                <div className="bank-head">{c.bankApp}</div>
                <div className="bank-row"><span>{c.bankTo}</span><strong>{bankName}</strong></div>
                <div className="bank-row"><span>{c.amount}</span><strong>{money}</strong></div>
                {otherName
                  ? <TrustCard level="danger" icon="warning" title={c.mismatch} />
                  : <div className="bank-ok"><Icon name="check" size={14} /> {c.match}</div>}
              </div>
            </div>
          )}
          {step === "received" && <div className="msg"><Bubble lang={lang}>{c.thanks}</Bubble></div>}
        </Phone>
        <p className="caption">{caption}</p>
      </div>
    </div>
  );
}
