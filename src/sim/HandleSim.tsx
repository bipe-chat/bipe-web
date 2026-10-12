import { chrome } from "../copy";
import { Mark } from "../components/brand";
import { TrustCard } from "../components/ui";
import { Phone } from "../components/phone";
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

// Handles typed one after another, each checked live by the reference logic: the same name with
// another separator, capitals, a reserved bank name, too short, then one that is free.
const TYPED = ["ana_souza", "Ana.Souza", "itau", "ab", "ana.souza.rj"];
const hold = (beat: number) => (beat >= TYPED.length ? 5000 : 2600);

export function HandleSim({ lang, caption }: { lang: Lang; caption: string }) {
  return (
    <Stage lang={lang} caption={caption} steps={TYPED.length} holdMs={hold}>
      {(beat) => {
        const handle = TYPED[Math.max(0, Math.min(beat, TYPED.length) - 1)];
        return (
          <Phone lang={lang} layout="form" head={t(lang, "proseio_settings_handle")}>
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
