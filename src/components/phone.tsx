// The simulated Bipe iOS app. Sizes inside the phone are iOS points (1px = 1pt) and the
// whole phone is scaled with CSS zoom, so every value can be copied 1:1 from the SwiftUI source
// (proseio-ios: TimelineItemBubbledStylerView, RoomHeaderView, MessageComposer, HomeScreenRoomCell).
import type { CSSProperties, ReactNode } from "react";
import { Avatar, decor, label, who } from "../cast";
import { t, type Lang } from "../shared";
import { useClock } from "./clock";
import { Icon } from "./ui";

// iPhone 16 Pro in points: 402x874 screen, 62pt display corners. The bezel is half the real one, so the screen reads larger.
const SCREEN_W = 402, SCREEN_H = 874, SCREEN_R = 62, BEZEL = 7.5;
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
    `<path fill="#15171b" d="${squircle(1.5, 1.5, BODY_W - 3, BODY_H - 3, SCREEN_R + BEZEL - 1.5)}"/>`),
  "--phone-screen": svgUrl(SCREEN_W, SCREEN_H, `<path d="${squircle(0, 0, SCREEN_W, SCREEN_H, SCREEN_R)}"/>`),
  "--phone-ratio": `${BODY_W} / ${BODY_H}`,
  "--phone-bezel": `${BEZEL}px`,
} as CSSProperties;

type Layout = "chat" | "list" | "form";

/**
 * The one phone frame. Every simulated screen renders through it.
 * `layout`: "chat" is a room (back button, header pill, timeline from the bottom, composer).
 * "list" is a tab root (large title, rows from the top). "form" is a pushed screen (back button, inline title).
 * `head` is the header pill content, the large title or the inline title. `footer` replaces the composer.
 */
export function Phone({ lang, head, children, layout = "chat", footer }: { lang: Lang; head: ReactNode; children: ReactNode; layout?: Layout; footer?: ReactNode }) {
  return (
    <div className="phone" style={PHONE_SHAPE} aria-hidden="true">
      <div className="screen">
        <StatusBar lang={lang} />
        <NavBar layout={layout}>{head}</NavBar>
        <div className={`screen-body ${layout}`}>{children}</div>
        {footer ?? (layout === "chat" && <Composer lang={lang} />)}
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
      <svg className="sysicons" width="77" height="14" viewBox="0 0 66 12" fill="currentColor">
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

/** iOS 26 navigation bar: glass back button, then the room header pill or an inline title. A tab root has a large title. */
function NavBar({ layout, children }: { layout: Layout; children: ReactNode }) {
  if (layout === "list") return <div className="navbar large">{children}</div>;
  return (
    <div className={`navbar ${layout}`}>
      <span className="glass round"><Icon name="back" size={22} /></span>
      {layout === "chat" ? <div className="glass header-pill">{children}</div> : <div className="nav-title">{children}</div>}
    </div>
  );
}

/** Empty composer: attachment button, text field with the placeholder, voice message button. */
function Composer({ lang }: { lang: Lang }) {
  return (
    <div className="composer">
      <span className="glass round"><Icon name="plus" size={22} /></span>
      <div className="glass field">{lang === "pt" ? "Mensagem…" : "Message…"}</div>
      <span className="glass round"><Icon name="mic" size={22} /></span>
    </div>
  );
}

/** Floating iOS 26 tab bar (ADR 0053): Conversas, Grupos, Você, and search on its own. */
export function TabBar({ lang, active }: { lang: Lang; active: "chats" | "you" }) {
  const tabs = [["chats", "chat", "bipe_tab_chats"], ["groups", "group", "bipe_tab_groups"], ["you", "person", "bipe_tab_you"]] as const;
  return (
    <div className="tabbar">
      <div className="glass tabs">
        {tabs.map(([id, icon, key]) => (
          <span key={id} className={id === active ? "on" : ""}><Icon name={icon} size={24} />{t(lang, key)}</span>
        ))}
      </div>
      <span className="glass round search"><Icon name="search" size={22} /></span>
    </div>
  );
}

/** Where a timeline item sits in a run of messages from one sender. Decides the square corners and the gap above. */
export type Run = "single" | "first" | "middle" | "last";

/** Runs for a timeline. `null` is an item that is not a message (a card), which breaks a run. */
export function runs(senders: (string | null)[]): Run[] {
  return senders.map((s, i) => {
    const prev = s !== null && senders[i - 1] === s;
    const next = s !== null && senders[i + 1] === s;
    return prev ? (next ? "middle" : "last") : next ? "first" : "single";
  });
}

/**
 * A message bubble with its time. In a group room, an incoming run starts with the sender's avatar and name.
 * `sender` is a cast id; pass it only in group rooms.
 */
export function Bubble({ lang, out = false, run = "single", sender, savedAs, mark, children }: {
  lang: Lang; out?: boolean; run?: Run; sender?: string; savedAs?: string; mark?: ReactNode; children: ReactNode;
}) {
  const time = useClock(lang);
  const head = sender && !out && (run === "single" || run === "first");
  const e = sender ? who(sender) : null;
  return (
    <div className={`bubble-row ${out ? "out" : "in"} ${run}${sender && !out ? " grouped" : ""}`}>
      {head && e && (
        <div className="sender-head">
          <Avatar id={e.id} size={32} savedAs={savedAs} />
          <span className={`sender-name d${decor(e)}`}>{label(e, savedAs)}</span>
          {mark}
        </div>
      )}
      <div className={`bubble ${out ? "out" : "in"} ${run}`}>
        <span className="text">{children}</span>
        <time className="time" data-clock={lang}>{time}</time>
      </div>
    </div>
  );
}
