import marks from "./marks.json";

// Draft marks; /marca/ shows them side by side. marks.json picks the one the site uses.
export const MARKS = marks.paths;
export type MarkId = keyof typeof MARKS;
export const MARK = marks.chosen as MarkId;

export function Mark({ id = MARK, size = 28, title }: { id?: MarkId; size?: number; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <path d={MARKS[id]} fill="currentColor" />
    </svg>
  );
}

/** App icon: white mark on brand plum, the iOS/Android default variant. */
export function AppIcon({ id = MARK, size = 60 }: { id?: MarkId; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#80307B" />
      <g transform="translate(10 10) scale(.6875)">
        <path d={MARKS[id]} fill="#fff" />
      </g>
    </svg>
  );
}

export function Wordmark({ id = MARK, size = 26 }: { id?: MarkId; size?: number }) {
  return (
    <span className="wordmark" style={{ fontSize: size }}>
      <Mark id={id} size={Math.round(size * 1.05)} />
      <span>bipe</span>
    </span>
  );
}

/** Verified seal next to a name: the mark at text size. */
export function Seal({ size = 16, label }: { size?: number; label: string }) {
  return (
    <span className="seal" title={label}>
      <Mark size={size} title={label} />
    </span>
  );
}
