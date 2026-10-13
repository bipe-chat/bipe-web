// Static figures for feature pages (bipe#176): two phones side by side, and simple diagrams with no phone.
import type { ReactNode } from "react";
// App text comes through t(); diagram labels are site copy in chrome[lang].diagrams.
import { Avatar, label, who } from "../cast";
import { Bubble, Phone } from "../components/phone";
import { Icon, TrustCard, type IconName } from "../components/ui";
import { chrome } from "../copy";
import { t, type Lang } from "../shared";
import { Ledger } from "./NoAdsFigure";
import { FakeQr } from "./PixCard";

function Pair({ items, caption }: { items: { label: string; phone: ReactNode }[]; caption: string }) {
  return (
    <div className="stage">
      <div className="pair">
        {items.map((x) => <figure key={x.label}><figcaption>{x.label}</figcaption>{x.phone}</figure>)}
      </div>
      <p className="caption">{caption}</p>
    </div>
  );
}

/** Another app sends a code by SMS, and the scammer asks for it. Bipe creates the account with a name and no code. */
export function NoSmsFigure({ lang, caption }: { lang: Lang; caption: string }) {
  const d = chrome[lang].diagrams;
  const scammer = who("golpista");
  return (
    <Pair caption={caption} items={[
      {
        label: d.otherApp,
        phone: (
          <Phone lang={lang} head={<><Avatar id={scammer.id} size={32} /><div className="who"><div className="name">{label(scammer)}</div></div></>}>
            <div className="msg card-item"><div className="sms-banner"><strong>SMS</strong> {d.smsCode}</div></div>
            <div className="msg"><Bubble lang={lang}>Oi, te mandei um código sem querer. Me passa o código que chegou?</Bubble></div>
          </Phone>
        ),
      },
      {
        label: "Bipe",
        phone: (
          <Phone lang={lang} layout="form" head={t(lang, "bipe_signup_title")}>
            <p className="sub msg">{t(lang, "bipe_signup_device_header")}</p>
            <div className="msg"><div className="sub">{t(lang, "bipe_signup_display_name")}</div><div className="handle-field">Gabriela</div></div>
            <div className="msg"><span className="pill wide">{t(lang, "bipe_signup_submit")}</span></div>
            <div className="msg"><TrustCard level="verified" icon="check">{t(lang, "bipe_signup_device_success")}</TrustCard></div>
          </Phone>
        ),
      },
    ]} />
  );
}

/** New phone: the old phone shows a QR code, the new one scans it. No SMS code anywhere. */
export function HandoffFigure({ lang, caption }: { lang: Lang; caption: string }) {
  const d = chrome[lang].diagrams;
  return (
    <Pair caption={caption} items={[
      {
        label: d.oldPhone,
        phone: (
          <Phone lang={lang} layout="form" head={t(lang, "bipe_recovery_qr")}>
            <p className="sub msg">{d.oldPhoneLine}</p>
            <div className="viewfinder plain msg"><FakeQr seed="handoff" size={170} /></div>
          </Phone>
        ),
      },
      {
        label: d.newPhone,
        phone: (
          <Phone lang={lang} layout="form" head={t(lang, "bipe_recovery_qr")}>
            <p className="sub msg">{t(lang, "bipe_recovery_qr_body")}</p>
            <div className="viewfinder msg"><FakeQr seed="handoff" size={120} /></div>
            <div className="msg"><TrustCard level="neutral" icon="shield">{t(lang, "bipe_recovery_qr_never_from_others")}</TrustCard></div>
          </Phone>
        ),
      },
    ]} />
  );
}

/** A flow of three steps with arrows, as plain HTML. */
function Flow({ steps, caption }: { steps: readonly { title: string; sub: string; icon: string }[]; caption: string }) {
  return (
    <div className="stage">
      <ol className="flow">
        {steps.map((s) => (
          <li key={s.title} className="card">
            <span className="flow-icon"><Icon name={s.icon as IconName} size={22} /></span>
            <strong>{s.title}</strong>
            <span className="small muted">{s.sub}</span>
          </li>
        ))}
      </ol>
      <p className="caption">{caption}</p>
    </div>
  );
}

export function E2eeFigure({ lang, caption }: { lang: Lang; caption: string }) {
  return <Flow steps={chrome[lang].diagrams.e2ee} caption={caption} />;
}

export function OpenSourceFigure({ lang, caption }: { lang: Lang; caption: string }) {
  return <Flow steps={chrome[lang].diagrams.openSource} caption={caption} />;
}

/** Servers in Brazil: data stays in Brazil comes first. */
export function BrazilFigure({ lang, caption }: { lang: Lang; caption: string }) {
  return <Ledger rows={chrome[lang].diagrams.brazil} caption={caption} />;
}

