import { useSyncExternalStore } from "react";
import type { Lang } from "../shared";

// The phone status bar shows the viewer's time. Prerendered HTML shows Apple's 9:41 until the client takes over.
export const STATIC_CLOCK = "9:41";

/** iOS status-bar format: 24-hour in pt-BR ("14:05"), 12-hour without AM/PM in English ("2:05"). */
export function formatClock(lang: Lang, d = new Date()) {
  const m = String(d.getMinutes()).padStart(2, "0");
  return lang === "pt" ? `${String(d.getHours()).padStart(2, "0")}:${m}` : `${d.getHours() % 12 || 12}:${m}`;
}

// One timer for every phone on the page, aligned to the minute.
const listeners = new Set<() => void>();
let minute = 0;
let timer: ReturnType<typeof setTimeout> | undefined;

function tick() {
  minute = Math.floor(Date.now() / 60000);
  listeners.forEach((l) => l());
  timer = setTimeout(tick, 60000 - (Date.now() % 60000) + 50);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) tick();
  return () => {
    listeners.delete(listener);
    if (!listeners.size) { clearTimeout(timer); timer = undefined; }
  };
}

const snapshot = () => minute || Math.floor(Date.now() / 60000);

/** Current status-bar time inside a hydrated island. Server render and hydration use STATIC_CLOCK. */
export function useClock(lang: Lang) {
  const now = useSyncExternalStore(subscribe, snapshot, () => 0);
  return now ? formatClock(lang, new Date(now * 60000)) : STATIC_CLOCK;
}

/** Phones outside islands are never hydrated. This keeps their `[data-clock]` text current. */
export function runStaticClocks() {
  const els = [...document.querySelectorAll<HTMLElement>("[data-clock]")].filter((el) => !el.closest("[data-island]"));
  if (!els.length) return;
  subscribe(() => els.forEach((el) => { el.textContent = formatClock(el.dataset.clock as Lang); }));
}
