import type { ReactNode } from "react";
import { chrome } from "../copy";
import { paths } from "../paths";
import { distribution, scamStringKey, t, type Lang, type Feature, type ScamKind } from "../shared";

export function Icon({ name, size = 18 }: { name: "warning" | "check" | "person" | "send" | "apple" | "android" | "mail"; size?: number }) {
  const p = {
    warning: "M12 3 2 21h20L12 3Zm0 6v5m0 3v.5",
    check: "m5 12.5 4.5 4.5L19 7.5",
    person: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8c0-3.3 3.1-6 7-6s7 2.7 7 6",
    send: "M4 12 20 4l-6 16-3-7-7-1Z",
    apple: "M16 3c0 1.7-1.4 3.4-3.2 3.4-.2-1.8 1.4-3.4 3.2-3.4ZM19.5 16.8c-.6 1.3-.9 1.9-1.6 3-1 1.5-2.4 3.2-4.1 3.2-1.5 0-1.9-1-4-1s-2.5 1-4 1c-1.7 0-3-1.6-4-3.1-2.8-4.2-3-9.1-1.3-11.7 1.2-1.9 3.1-3 4.9-3 1.8 0 3 1 4.5 1s2.4-1 4.6-1c1.6 0 3.3.9 4.5 2.4-4 2.2-3.3 7.8.5 9.2Z",
    android: "M7 10h10v7.5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 17.5V10Zm0-1a5 5 0 0 1 10 0H7Zm-3 2v5m16-5v5M8.5 4.5 7.5 3m8 1.5 1-1.5",
    mail: "M3 6h18v12H3zm0 0 9 7 9-7",
  }[name];
  const filled = name === "apple";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill={filled ? "currentColor" : "none"} stroke={filled ? "none" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={p} />
    </svg>
  );
}

/** Status per platform as plain text, no pill. A policy feature has no platform status to show. */
export function PlatformStatus({ lang, f }: { lang: Lang; f: Feature }) {
  const c = chrome[lang];
  if (f.status.ios === "policy" && f.status.android === "policy") return null;
  return <p className="small muted">iPhone: {c.status[f.status.ios]} · Android: {c.status[f.status.android]}</p>;
}

/** Mirrors ProseioScamWarningView (proseio-ios): caution card under the message. */
export function ScamWarningCard({ lang, kind }: { lang: Lang; kind: ScamKind }) {
  return (
    <div className="trust caution" role="note">
      <Icon name="warning" size={16} />
      <div>
        <strong>{t(lang, "proseio_scam_warning_title")}</strong>
        {t(lang, scamStringKey[kind])}
      </div>
    </div>
  );
}

export function TrustCard({ level, title, children, icon = "person" }: { level: "caution" | "danger" | "neutral" | "verified"; title?: string; children?: ReactNode; icon?: "person" | "warning" }) {
  return (
    <div className={`trust ${level}`} role="note">
      <Icon name={icon} size={16} />
      <div>
        {title && <strong>{title}</strong>}
        {children}
      </div>
    </div>
  );
}

export function Phone({ lang, head, children, composer = true }: { lang: Lang; head: ReactNode; children: ReactNode; composer?: boolean }) {
  return (
    <div className="phone" aria-hidden="true">
      <div className="screen">
        <div className="statusbar"><span>9:41</span><span className="island" /><span>5G</span></div>
        <div className="chat-head">{head}</div>
        <div className="timeline">{children}</div>
        {composer && (
          <div className="composer">
            <div className="field">{lang === "pt" ? "Mensagem" : "Message"}</div>
            <div className="send"><Icon name="send" size={16} /></div>
          </div>
        )}
      </div>
    </div>
  );
}

export function DownloadButtons({ lang }: { lang: Lang }) {
  const { ios, android } = distribution;
  return (
    <div className="actions">
      {ios.url && (
        <a className="button primary" href={ios.url}>
          <Icon name="apple" />
          <span>{ios[lang].label}<span className="sub">TestFlight</span></span>
        </a>
      )}
      {android.status === "available" && android.url ? (
        <a className="button secondary" href={android.url}><Icon name="android" />{android[lang].label}</a>
      ) : (
        <a className="button secondary" href={`${paths.download(lang)}#android`}>
          <Icon name="android" />
          <span>{android[lang].label}<span className="sub">{chrome[lang].waitlist.submit}</span></span>
        </a>
      )}
    </div>
  );
}
