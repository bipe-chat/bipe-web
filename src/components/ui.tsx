import type { ReactNode } from "react";
import { chrome } from "../copy";
import { paths } from "../paths";
import { distribution, scamStringKey, t, type Lang, type Feature, type ScamKind } from "../shared";

export type IconName = "warning" | "check" | "person" | "send" | "apple" | "android" | "mail" | "globe" | "shield" | "pix" | "circle" | "back" | "plus" | "mic" | "search" | "chat" | "group"
  | "phone" | "call" | "bag" | "key" | "heart" | "scales" | "bank" | "box" | "briefcase" | "headset" | "tag" | "receipt"
  | "house" | "swap" | "barcode" | "cash" | "trend" | "dice" | "link" | "cursor" | "sim" | "lock" | "eye" | "gift";

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
    // Scam types on /golpes-no-brasil/ (ScamsPage.tsx scamIcon).
    phone: "M8 3h8a1.5 1.5 0 0 1 1.5 1.5v15A1.5 1.5 0 0 1 16 21H8a1.5 1.5 0 0 1-1.5-1.5v-15A1.5 1.5 0 0 1 8 3Zm3 15h2",
    call: "M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z",
    bag: "M5 8h14l-1 12H6L5 8Zm4 0V6.5a3 3 0 0 1 6 0V8",
    key: "M8 11a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm2.8 1.2L20 3m-4 4 2.5 2.5M14 9l1.5 1.5",
    heart: "M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.2a4.2 4.2 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z",
    scales: "M12 4v16m-4 0h8M5 7h14M7 7l-3 6a3 3 0 0 0 6 0L7 7Zm10 0-3 6a3 3 0 0 0 6 0l-3-6Z",
    bank: "M3 9l9-5 9 5M5.5 10.5v6.5m4.3-6.5v6.5m4.4-6.5v6.5m4.3-6.5v6.5M3 20h18",
    box: "M4 7.5 12 4l8 3.5v9L12 20l-8-3.5v-9Zm0 0 8 3.5 8-3.5M12 11v9",
    briefcase: "M4 8h16v11H4V8Zm5 0V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-11 5h16",
    headset: "M5 14v-2a7 7 0 0 1 14 0v2M5 14h2.5v4.5H5V14Zm11.5 0H19v4.5h-2.5V14Zm2.5 4.5c0 1.5-1.5 2.5-4 2.5h-2",
    tag: "M3.6 12.4 11 5h8v8l-7.4 7.4a1.4 1.4 0 0 1-2 0l-6-6a1.4 1.4 0 0 1 0-2ZM15.5 8.5v.01",
    receipt: "M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21V3Zm3 5h6m-6 4h6m-6 4h3",
    house: "M4 11l8-7 8 7v9H4v-9Zm6 9v-5h4v5",
    swap: "M4 9h15l-3.5-3.5M20 15H5l3.5 3.5",
    barcode: "M4 6v12m3-12v12m3-12v12m4-12v12m3-12v12m3-12v12",
    cash: "M3 7h18v10H3V7Zm9 2.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM6 10v.01M18 14v.01",
    trend: "M3 17l6-6 4 4 8-8m-5 0h5v5",
    dice: "M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm4 5v.01M15 9v.01M12 12v.01M9 15v.01M15 15v.01",
    link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
    cursor: "M5 3l14 7-6.2 1.8L11 18 5 3Zm8 9 6 6",
    sim: "M7 3h7l4 4v14H7V3Zm3 9h5v5h-5v-5Z",
    lock: "M6 11h12v9H6v-9Zm2.5 0V8a3.5 3.5 0 0 1 7 0v3m-3.5 3.5v2",
    eye: "M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Zm9.5-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
    gift: "M4 10h16v10H4V10Zm-1-3h18v3H3V7Zm9 0v13m0-13c-1.5-3-5-3-5-1s3 1 5 1Zm0 0c1.5-3 5-3 5-1s-3 1-5 1Z",
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
