import type { ReactNode } from "react";
import { chrome } from "../copy";
import { paths } from "../paths";
import { distribution, scamStringKey, t, type Lang, type Feature, type ScamKind } from "../shared";

export type IconName = "warning" | "check" | "person" | "send" | "apple" | "android" | "mail" | "globe" | "shield" | "pix" | "circle" | "back" | "plus" | "mic" | "search" | "chat" | "group";

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const p = {
    warning: "M12 3 2 21h20L12 3Zm0 6v5m0 3v.5",
    check: "m5 12.5 4.5 4.5L19 7.5",
    person: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8c0-3.3 3.1-6 7-6s7 2.7 7 6",
    send: "M4 12 20 4l-6 16-3-7-7-1Z",
    // Simple Icons "apple" (CC0).
    apple: "M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701",
    // Material Design Icons classic "android" robot (Apache 2.0).
    android: "M15 5h-1V4h1m-5 1H9V4h1m5.53-1.84 1.31-1.31a.5.5 0 0 0 0-.71.5.5 0 0 0-.71 0l-1.48 1.48A5.9 5.9 0 0 0 12 1c-.96 0-1.86.23-2.66.63L7.85.14a.5.5 0 0 0-.7 0 .5.5 0 0 0 0 .71l1.31 1.31A5.98 5.98 0 0 0 6 7h12c0-2-1-3.75-2.47-4.84M20.5 8A1.5 1.5 0 0 0 19 9.5v7a1.5 1.5 0 0 0 1.5 1.5 1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 20.5 8m-17 0A1.5 1.5 0 0 0 2 9.5v7A1.5 1.5 0 0 0 3.5 18 1.5 1.5 0 0 0 5 16.5v-7A1.5 1.5 0 0 0 3.5 8M6 18a1 1 0 0 0 1 1h1v3.5A1.5 1.5 0 0 0 9.5 24a1.5 1.5 0 0 0 1.5-1.5V19h2v3.5a1.5 1.5 0 0 0 1.5 1.5 1.5 1.5 0 0 0 1.5-1.5V19h1a1 1 0 0 0 1-1V8H6v10Z",
    mail: "M3 6h18v12H3zm0 0 9 7 9-7",
    globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-9 9h18M12 3c2.4 2.5 3.5 5.5 3.5 9s-1.1 6.5-3.5 9c-2.4-2.5-3.5-5.5-3.5-9s1.1-6.5 3.5-9Z",
    shield: "M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6L12 3Zm-3 9.5a3 3 0 0 1 5.6-1.5m.4 2.5a3 3 0 0 1-5.6 1.5",
    pix: "M12 3.5 20.5 12 12 20.5 3.5 12 12 3.5Zm-3 8.5h6",
    circle: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z",
    back: "M15 4.5 7.5 12l7.5 7.5",
    plus: "M12 5v14M5 12h14",
    mic: "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Zm-6 9a6 6 0 0 0 12 0m-6 6v3",
    search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm9 16-4-4",
    chat: "M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 3.5V17A2.5 2.5 0 0 1 4 14.5v-8Z",
    group: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 9c0-3 2.7-5.5 6-5.5s6 2.5 6 5.5m1-9a3 3 0 1 0 0-6m2.5 15H21c0-2.6-1.7-4.6-4-5.2",
  }[name];
  const filled = name === "apple" || name === "android";
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

/** Mirrors BipeScamWarningView (bipe-ios): caution card under the message. */
export function ScamWarningCard({ lang, kind }: { lang: Lang; kind: ScamKind }) {
  return (
    <div className="trust caution" role="note">
      <Icon name="warning" size={16} />
      <div>
        <strong>{t(lang, "bipe_scam_warning_title")}</strong>
        {t(lang, scamStringKey[kind])}
      </div>
    </div>
  );
}

export function TrustCard({ level, title, children, icon = "person" }: { level: "caution" | "danger" | "neutral" | "verified"; title?: string; children?: ReactNode; icon?: IconName }) {
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
