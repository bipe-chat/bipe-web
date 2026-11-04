import { useRef, type ReactNode } from "react";
import { chrome } from "../copy";
import { Icon } from "../components/ui";
import type { Lang } from "../shared";
import { useScript } from "./use-script";

/** Wallpaper, the play/pause corner button and the "simulation" caption around a scripted phone. The script loops, so it needs no restart. */
export function Stage({ lang, caption, steps, holdMs, children }: {
  lang: Lang; caption: string; steps: number; holdMs: (beat: number) => number; children: (beat: number) => ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { beat, playing, toggle } = useScript(ref, steps, holdMs);
  const c = chrome[lang];
  return (
    <div className="stage" ref={ref}>
      <button type="button" className="stage-toggle" onClick={toggle} aria-label={playing ? c.pause : c.play} title={playing ? c.pause : c.play}>
        <Icon name={playing ? "pause" : "play"} size={16} />
      </button>
      {children(beat)}
      <p className="caption">{caption}</p>
    </div>
  );
}
