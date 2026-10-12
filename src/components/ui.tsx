import type { CSSProperties, ReactNode } from "react";
import { chrome } from "../copy";
import { useClock } from "./clock";
import { paths } from "../paths";
import { distribution, scamStringKey, t, type Lang, type Feature, type ScamKind } from "../shared";

export type IconName = "warning" | "check" | "person" | "send" | "apple" | "android" | "mail" | "globe" | "shield" | "pix" | "circle";

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const p = {
    warning: "M12 3 2 21h20L12 3Zm0 6v5m0 3v.5",
    check: "m5 12.5 4.5 4.5L19 7.5",
    person: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8c0-3.3 3.1-6 7-6s7 2.7 7 6",
    send: "M4 12 20 4l-6 16-3-7-7-1Z",
    apple: "M16 3c0 1.7-1.4 3.4-3.2 3.4-.2-1.8 1.4-3.4 3.2-3.4ZM19.5 16.8c-.6 1.3-.9 1.9-1.6 3-1 1.5-2.4 3.2-4.1 3.2-1.5 0-1.9-1-4-1s-2.5 1-4 1c-1.7 0-3-1.6-4-3.1-2.8-4.2-3-9.1-1.3-11.7 1.2-1.9 3.1-3 4.9-3 1.8 0 3 1 4.5 1s2.4-1 4.6-1c1.6 0 3.3.9 4.5 2.4-4 2.2-3.3 7.8.5 9.2Z",
    android: "M7 10h10v7.5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 17.5V10Zm0-1a5 5 0 0 1 10 0H7Zm-3 2v5m16-5v5M8.5 4.5 7.5 3m8 1.5 1-1.5",
    mail: "M3 6h18v12H3zm0 0 9 7 9-7",
    globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-9 9h18M12 3c2.4 2.5 3.5 5.5 3.5 9s-1.1 6.5-3.5 9c-2.4-2.5-3.5-5.5-3.5-9s1.1-6.5 3.5-9Z",
    shield: "M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6L12 3Zm-3 9.5a3 3 0 0 1 5.6-1.5m.4 2.5a3 3 0 0 1-5.6 1.5",
    pix: "M12 3.5 20.5 12 12 20.5 3.5 12 12 3.5Zm-3 8.5h6",
    circle: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z",
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

// iPhone 16 Pro in points: 402x874 screen, 62pt display corners, 15pt bezel.
const SCREEN_W = 402, SCREEN_H = 874, SCREEN_R = 62, BEZEL = 15;
const BODY_W = SCREEN_W + 2 * BEZEL, BODY_H = SCREEN_H + 2 * BEZEL;

/** Apple's continuous corner (the iOS 7 rounded-rect bezier): the curve starts 1.53r from the corner, not r. */
function squircle(x: number, y: number, w: number, h: number, r: number) {
  const corners = [
    [x + w, y, 1, 0, 0, 1],
    [x + w, y + h, 0, 1, -1, 0],
    [x, y + h, -1, 0, 0, -1],
    [x, y, 0, -1, 1, 0],
  ] as const;
  const curve = [[1.52866483, 0], [1.08849296, 0], [0.86840694, 0], [0.63149399, 0.074911], [0.37282392, 0.16905899], [0.16905899, 0.37282392], [0.074911, 0.63149399], [0, 0.86840694], [0, 1.08849296], [0, 1.52866483]];
  let d = `M${+(x + 1.52866483 * r).toFixed(2)} ${y}`;
  for (const [cx, cy, ux, uy, vx, vy] of corners) {
    const pt = ([a, b]: number[]) => `${+(cx - a * r * ux + b * r * vx).toFixed(2)} ${+(cy - a * r * uy + b * r * vy).toFixed(2)}`;
    d += `L${pt(curve[0])}`;
    for (let i = 1; i < curve.length; i += 3) d += `C${pt(curve[i])} ${pt(curve[i + 1])} ${pt(curve[i + 2])}`;
  }
  return `${d}Z`;
}

const svgUrl = (w: number, h: number, paths: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${paths}</svg>`)}")`;

// The phone keeps a fixed aspect ratio, so the stretched SVGs never distort the corners.
const PHONE_SHAPE = {
  "--phone-body": svgUrl(BODY_W, BODY_H,
    `<path fill="#3a3d44" d="${squircle(0, 0, BODY_W, BODY_H, SCREEN_R + BEZEL)}"/>` +
    `<path fill="#15171b" d="${squircle(2, 2, BODY_W - 4, BODY_H - 4, SCREEN_R + BEZEL - 2)}"/>`),
  "--phone-screen": svgUrl(SCREEN_W, SCREEN_H, `<path d="${squircle(0, 0, SCREEN_W, SCREEN_H, SCREEN_R)}"/>`),
  "--phone-ratio": `${BODY_W} / ${BODY_H}`,
  "--phone-bezel": `${(BEZEL / BODY_W) * 100}%`,
} as CSSProperties;

/**
 * The one phone frame. Every simulated screen renders through it.
 * `layout`: "chat" stacks the body from the bottom with a composer, "list" runs edge to edge from the top,
 * "form" runs padded from the top. `footer` replaces the composer.
 */
export function Phone({ lang, head, children, layout = "chat", footer }: { lang: Lang; head: ReactNode; children: ReactNode; layout?: "chat" | "list" | "form"; footer?: ReactNode }) {
  return (
    <div className="phone" style={PHONE_SHAPE} aria-hidden="true">
      <div className="screen">
        <StatusBar lang={lang} />
        <div className="chat-head">{head}</div>
        <div className={`screen-body ${layout}`}>{children}</div>
        {footer ?? (layout === "chat" && (
          <div className="composer">
            <div className="field">{lang === "pt" ? "Mensagem" : "Message"}</div>
            <div className="send"><Icon name="send" size={16} /></div>
          </div>
        ))}
        <div className="home-indicator" />
      </div>
    </div>
  );
}

/** iOS status bar: the viewer's time, the Dynamic Island, then signal, Wi-Fi and battery. */
function StatusBar({ lang }: { lang: Lang }) {
  return (
    <div className="statusbar">
      <time className="clock" data-clock={lang}>{useClock(lang)}</time>
      <span className="island" />
      <svg className="sysicons" width="66" height="12" viewBox="0 0 66 12" fill="currentColor">
        <rect x="0" y="8" width="3" height="4" rx="1" />
        <rect x="4.5" y="6" width="3" height="6" rx="1" />
        <rect x="9" y="3.5" width="3" height="8.5" rx="1" />
        <rect x="13.5" y="1" width="3" height="11" rx="1" />
        <path d="M28 2.2c2.4 0 4.6.9 6.3 2.5l1.1-1.2A10.6 10.6 0 0 0 28 .6c-2.8 0-5.4 1.1-7.4 2.9l1.1 1.2A9 9 0 0 1 28 2.2Zm0 3.4c1.5 0 2.8.5 3.9 1.5l1.1-1.2a7.3 7.3 0 0 0-10 0l1.1 1.2c1.1-1 2.4-1.5 3.9-1.5Zm0 3.4c.6 0 1.1.2 1.5.6L28 11.4l-1.5-1.8c.4-.4.9-.6 1.5-.6Z" />
        <rect x="40.5" y=".5" width="22" height="11" rx="3.5" fill="none" stroke="currentColor" opacity=".4" />
        <rect x="42.5" y="2.5" width="15" height="7" rx="2" />
        <path d="M64 4v4c.8-.3 1.3-1.1 1.3-2S64.8 4.3 64 4Z" opacity=".4" />
      </svg>
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
