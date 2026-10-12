// Headline test (issue #77, ADR 0026). The home page shows one arm per browser; the arm is kept in
// localStorage and travels with install clicks and waitlist sign-ups. The server keeps only counts.
import { API_URL } from "./config";
import { product } from "./shared";

export const HEADLINE = product.headlineTest;
const KEY = `proseio.${HEADLINE.experiment}`;

export function currentArm(): string | null {
  try {
    const a = localStorage.getItem(KEY);
    return a && /^h[0-9]$/.test(a) ? a : null;
  } catch {
    return null;
  }
}

/** sendBeacon posts text/plain, so there is no CORS preflight and no response to read. */
export function sendEvent(event: "assign" | "install_click", arm = currentArm()): void {
  if (!arm) return;
  try { navigator.sendBeacon(`${API_URL}/v1/events`, JSON.stringify({ experiment: HEADLINE.experiment, arm, event })); } catch { /* best effort */ }
}

/**
 * Inline script placed right after the hero <h1>: it picks or reads the arm and swaps the title
 * before the first paint, so no visitor sees the control flash. h0 is promise.pt.title.
 */
export function assignScript(): string {
  const arms = ["h0", ...HEADLINE.arms.map((a) => a.id)];
  const titles = [product.promise.pt.title, ...HEADLINE.arms.map((a) => a.pt)];
  const data = JSON.stringify({ k: KEY, x: HEADLINE.experiment, u: `${API_URL}/v1/events`, a: arms, t: titles }).replace(/</g, "\\u003c");
  return `(function(d){var a,n=false;try{a=localStorage.getItem(d.k)}catch(e){}if(d.a.indexOf(a)<0){a=d.a[Math.floor(Math.random()*d.a.length)];n=true;try{localStorage.setItem(d.k,a)}catch(e){}}var h=document.getElementById("hero-title");if(h)h.textContent=d.t[d.a.indexOf(a)];if(n)try{navigator.sendBeacon(d.u,JSON.stringify({experiment:d.x,arm:a,event:"assign"}))}catch(e){}})(${data});`;
}
