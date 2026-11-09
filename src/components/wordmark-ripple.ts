// Header wordmark flair: a click on the mark or a letter sends a ripple out from that part.
// Each neighbour rises, grows and takes the next palette colour one step later, and a ring expands from the touched part.
// The header is static HTML (no island), so this is a plain DOM script.

/** App palettes at their ink step, in the brand order (scripts/lib/backdrop.mjs ORDER). Maracujá is yellow only at its light steps, so it is left out. */
const TONES = ["--bipe-acai-1100", "--bipe-jenipapo-1100", "--bipe-jabuticaba-1100", "--bipe-goiaba-1100", "--bipe-pitanga-1100"];
const STEP = 70; // ms between neighbours
const DURATION = 520; // ms per part

let turn = 0;

function originIndex(parts: HTMLElement[], e: MouseEvent) {
  const hit = parts.findIndex((p) => p.contains(e.target as Node));
  if (hit >= 0) return hit;
  if (!e.detail) return 0; // keyboard: start at the mark
  const mid = (p: HTMLElement) => { const r = p.getBoundingClientRect(); return r.left + r.width / 2; };
  return parts.reduce((best, p, i) => (Math.abs(mid(p) - e.clientX) < Math.abs(mid(parts[best]) - e.clientX) ? i : best), 0);
}

function play(mark: HTMLElement, parts: HTMLElement[], origin: number) {
  const root = getComputedStyle(document.documentElement);
  const tone = (i: number) => root.getPropertyValue(TONES[(turn + i) % TONES.length]).trim();
  const base = getComputedStyle(mark).color;
  turn++;

  parts.forEach((p, i) => {
    const d = Math.abs(i - origin);
    p.getAnimations().forEach((a) => a.cancel());
    p.animate(
      [
        { transform: "none", color: base },
        { transform: `translateY(-${0.2 - d * 0.03}em) scale(${1.24 - d * 0.04})`, color: tone(d + 1), offset: 0.35 },
        { transform: "none", color: base },
      ],
      { duration: DURATION, delay: d * STEP, easing: "cubic-bezier(.3,.7,.4,1)" },
    );
  });

  const o = parts[origin].getBoundingClientRect();
  const m = mark.getBoundingClientRect();
  const ring = document.createElement("span");
  ring.className = "wm-ring";
  ring.style.left = `${o.left - m.left + o.width / 2}px`;
  ring.style.top = `${o.top - m.top + o.height / 2}px`;
  ring.style.color = tone(1);
  mark.append(ring);
  ring.animate(
    [{ transform: "translate(-50%, -50%) scale(.4)", opacity: 0.55 }, { transform: "translate(-50%, -50%) scale(4.5)", opacity: 0 }],
    { duration: DURATION + parts.length * STEP, easing: "cubic-bezier(.2,.6,.3,1)" },
  ).finished.finally(() => ring.remove());

  // When the wave has reached the far end.
  return Math.max(origin, parts.length - 1 - origin) * STEP + DURATION * 0.45;
}

export function runWordmarkRipple() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.addEventListener("click", (e) => {
    const mark = (e.target as Element | null)?.closest?.<HTMLElement>(".site-head .wordmark");
    if (!mark) return;
    const parts = [...mark.querySelectorAll<HTMLElement>(".wm-ch")];
    if (!parts.length) return;
    const wait = play(mark, parts, originIndex(parts, e));

    const link = mark.closest("a");
    if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    // Already on that page: keep it, go to the top. Else let the wave run out, then go.
    if (new URL(link.href).pathname === location.pathname) window.scrollTo({ top: 0, behavior: "smooth" });
    else setTimeout(() => location.assign(link.href), wait);
  });
}
