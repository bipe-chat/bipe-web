import { useRef, type ReactNode } from "react";
import { chrome } from "../copy";
import type { Lang } from "../shared";
import { useScript } from "./use-script";

/** Wallpaper, controls and the "simulation" caption around a scripted phone. */
export function Stage({ lang, caption, steps, holdMs, children }: {
  lang: Lang; caption: string; steps: number; holdMs: (beat: number) => number; children: (beat: number) => ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { beat, playing, restart, toggle } = useScript(ref, steps, holdMs);
  const c = chrome[lang];
  return (
    <div className="stage" ref={ref}>
      {children(beat)}
      <div className="controls">
        <button type="button" onClick={toggle}>{playing ? c.pause : c.play}</button>
        <button type="button" onClick={restart}>{c.replay}</button>
      </div>
      <p className="caption">{caption}</p>
    </div>
  );
}
