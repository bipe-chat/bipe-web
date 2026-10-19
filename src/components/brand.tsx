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

/** Verified company (CNPJ badge, bipe#252): the solid seal with a building glyph (design/trust-ui.md). Same drawing as BipeSealMark in bipe-ios. */
export function CompanySeal({ size = 16, label }: { size?: number; label: string }) {
  return (
    <span className="seal company" title={label}>
      <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={label}>
        <path d={MARKS[MARK]} fill="currentColor" />
        <path className="seal-glyph" d="M21 46V21.5c0-.8.7-1.5 1.5-1.5h12c.8 0 1.5.7 1.5 1.5V28h6.5c.8 0 1.5.7 1.5 1.5V46Z" />
        <path fill="currentColor" d="M25 24h3v3h-3zm5 0h3v3h-3zm-5 6h3v3h-3zm5 0h3v3h-3zm-5 6h3v3h-3zm5 0h3v3h-3zm9-4h3v3h-3zm0 6h3v3h-3z" />
      </svg>
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
