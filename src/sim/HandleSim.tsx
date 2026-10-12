import { useState } from "react";
import { chrome } from "../copy";
import { Mark } from "../components/brand";
import { Phone, TrustCard } from "../components/ui";
import { handleProblem, handleSkeleton, reg, t, type Lang } from "../shared";
import { Stage } from "./Stage";

// Sample directory for the simulation: one existing account. Real lookups happen on the server.
const TAKEN = ["ana.souza"];

type Check = { ok: true } | { ok: false; message: string; sameAs?: string };

export function checkHandle(lang: Lang, handle: string): Check {
  const problem = handleProblem(handle, reg);
  const h = reg.handles;
  if (problem === "too_short") return { ok: false, message: t(lang, "proseio_handle_too_short", String(h.minLength)) };
  if (problem === "too_long") return { ok: false, message: t(lang, "proseio_handle_too_long", String(h.maxLength)) };
  if (problem === "invalid_characters") return { ok: false, message: t(lang, "proseio_handle_invalid_characters") };
  if (problem === "reserved") return { ok: false, message: t(lang, "proseio_handle_reserved") };
  const sameAs = TAKEN.find((x) => handleSkeleton(x, reg) === handleSkeleton(handle, reg));
  if (sameAs) return { ok: false, message: t(lang, "proseio_handle_taken"), sameAs };
  return { ok: true };
}

function Result({ lang, handle }: { lang: Lang; handle: string }) {
  if (!handle) return null;
  const r = checkHandle(lang, handle);
  if (r.ok) return <TrustCard level="verified" title={t(lang, "proseio_handle_available")}><span className="mono">proseio.com.br/@{handle}</span></TrustCard>;
  return (
    <TrustCard level="caution" icon="warning" title={r.message}>
      {r.sameAs && r.sameAs !== handle && <>{chrome[lang].handleSame} <span className="mono">@{r.sameAs}</span></>}
    </TrustCard>
  );
}

const TYPED = ["ana.souza", "ana_souza", "ana.souza.rj"];
const hold = (beat: number) => (beat >= TYPED.length ? 5000 : 2600);

export function HandleSim({ lang, caption }: { lang: Lang; caption: string }) {
  return (
    <Stage lang={lang} caption={caption} steps={TYPED.length} holdMs={hold}>
      {(beat) => {
        const handle = TYPED[Math.max(0, Math.min(beat, TYPED.length) - 1)];
        return (
          <Phone lang={lang} layout="form" head={<div className="who"><div className="name">{t(lang, "proseio_settings_handle")}</div></div>}>
            <div className="handle-field mono">@{beat === 0 ? "" : handle}</div>
            <div className="msg" key={beat}>{beat > 0 && <Result lang={lang} handle={handle} />}</div>
            <p className="small muted handle-footer">{t(lang, "proseio_handle_screen_footer")}</p>
            {beat >= TYPED.length && (
              <div className="card msg handle-card">
                <Mark size={36} />
                <div>
                  <strong>@{handle}</strong>
                  <p className="mono">proseio.com.br/@{handle}</p>
                </div>
              </div>
            )}
          </Phone>
        );
      }}
    </Stage>
  );
}

export function HandleTry({ lang }: { lang: Lang }) {
  const c = chrome[lang];
  const [handle, setHandle] = useState("anasouza");
  return (
    <div className="tryit">
      <label htmlFor="handle-try">{c.tryHandle}</label>
      <input id="handle-try" value={handle} onChange={(e) => setHandle(e.target.value.replace(/^@/, ""))} placeholder={t(lang, "proseio_handle_placeholder")} autoComplete="off" autoCapitalize="none" spellCheck={false} />
      <div className="examples" aria-label={c.examples}>
        {["anasouza", "ana__souza", "itau", "ab", "Ana.Souza", "ana.souza.rj"].map((m) => <button type="button" key={m} onClick={() => setHandle(m)}>@{m}</button>)}
      </div>
      <div className="result" aria-live="polite"><Result lang={lang} handle={handle} /></div>
      <p className="small muted">{c.tryHandleHint}</p>
    </div>
  );
}
