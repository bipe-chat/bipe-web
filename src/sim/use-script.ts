import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

// A scripted demo: `steps` beats, each shown for `holdMs`, then a loop. The first render is the
// finished state, so the prerendered HTML shows the whole story without JavaScript. On the client the
// script restarts from beat 0 only when motion is allowed, and it pauses while the stage is offscreen.
export function useScript(stage: RefObject<HTMLElement | null>, steps: number, holdMs: (beat: number) => number) {
  const [beat, setBeat] = useState(steps);
  const [playing, setPlaying] = useState(false);
  const [visible, setVisible] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
      if (entry.isIntersecting && !started.current && !reduced) {
        started.current = true;
        setBeat(0);
        setPlaying(true);
      }
    }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, [stage]);

  useEffect(() => {
    if (!playing || !visible) return;
    const id = window.setTimeout(() => setBeat((b) => (b >= steps ? 0 : b + 1)), holdMs(beat));
    return () => window.clearTimeout(id);
  }, [beat, playing, visible, steps, holdMs]);

  const restart = useCallback(() => { setBeat(0); setPlaying(true); }, []);
  const toggle = useCallback(() => setPlaying((p) => !p), []);
  return { beat, playing, restart, toggle };
}
