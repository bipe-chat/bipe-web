import marks from "./marks.json";

// Draft marks. marks.json picks the one the site uses.
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

/** Verified company (CNPJ badge, bipe#252): the solid seal with a building glyph (design/trust-ui.md). Same drawing as the BipeSealMark of the old iOS app. */
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

// Phosphor seal-check and seal-check-fill (MIT), as in the apps (ADR 0275): regular for assurance bank, fill for state.
const SEAL_CHECK = {
  regular: "M225.86,102.82c-3.77-3.94-7.67-8-9.14-11.57-1.36-3.27-1.44-8.69-1.52-13.94-.15-9.76-.31-20.82-8-28.51s-18.75-7.85-28.51-8c-5.25-.08-10.67-.16-13.94-1.52-3.56-1.47-7.63-5.37-11.57-9.14C146.28,23.51,138.44,16,128,16s-18.27,7.51-25.18,14.14c-3.94,3.77-8,7.67-11.57,9.14C88,40.64,82.56,40.72,77.31,40.8c-9.76.15-20.82.31-28.51,8S41,67.55,40.8,77.31c-.08,5.25-.16,10.67-1.52,13.94-1.47,3.56-5.37,7.63-9.14,11.57C23.51,109.72,16,117.56,16,128s7.51,18.27,14.14,25.18c3.77,3.94,7.67,8,9.14,11.57,1.36,3.27,1.44,8.69,1.52,13.94.15,9.76.31,20.82,8,28.51s18.75,7.85,28.51,8c5.25.08,10.67.16,13.94,1.52,3.56,1.47,7.63,5.37,11.57,9.14C109.72,232.49,117.56,240,128,240s18.27-7.51,25.18-14.14c3.94-3.77,8-7.67,11.57-9.14,3.27-1.36,8.69-1.44,13.94-1.52,9.76-.15,20.82-.31,28.51-8s7.85-18.75,8-28.51c.08-5.25.16-10.67,1.52-13.94,1.47-3.56,5.37-7.63,9.14-11.57C232.49,146.28,240,138.44,240,128S232.49,109.73,225.86,102.82Zm-11.55,39.29c-4.79,5-9.75,10.17-12.38,16.52-2.52,6.1-2.63,13.07-2.73,19.82-.1,7-.21,14.33-3.32,17.43s-10.39,3.22-17.43,3.32c-6.75.1-13.72.21-19.82,2.73-6.35,2.63-11.52,7.59-16.52,12.38S132,224,128,224s-9.15-4.92-14.11-9.69-10.17-9.75-16.52-12.38c-6.1-2.52-13.07-2.63-19.82-2.73-7-.1-14.33-.21-17.43-3.32s-3.22-10.39-3.32-17.43c-.1-6.75-.21-13.72-2.73-19.82-2.63-6.35-7.59-11.52-12.38-16.52S32,132,32,128s4.92-9.15,9.69-14.11,9.75-10.17,12.38-16.52c2.52-6.1,2.63-13.07,2.73-19.82.1-7,.21-14.33,3.32-17.43S70.51,56.9,77.55,56.8c6.75-.1,13.72-.21,19.82-2.73,6.35-2.63,11.52-7.59,16.52-12.38S124,32,128,32s9.15,4.92,14.11,9.69,10.17,9.75,16.52,12.38c6.1,2.52,13.07,2.63,19.82,2.73,7,.1,14.33.21,17.43,3.32s3.22,10.39,3.32,17.43c.1,6.75.21,13.72,2.73,19.82,2.63,6.35,7.59,11.52,12.38,16.52S224,124,224,128,219.08,137.15,214.31,142.11ZM173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34Z",
  fill: "M225.86,102.82c-3.77-3.94-7.67-8-9.14-11.57-1.36-3.27-1.44-8.69-1.52-13.94-.15-9.76-.31-20.82-8-28.51s-18.75-7.85-28.51-8c-5.25-.08-10.67-.16-13.94-1.52-3.56-1.47-7.63-5.37-11.57-9.14C146.28,23.51,138.44,16,128,16s-18.27,7.51-25.18,14.14c-3.94,3.77-8,7.67-11.57,9.14C88,40.64,82.56,40.72,77.31,40.8c-9.76.15-20.82.31-28.51,8S41,67.55,40.8,77.31c-.08,5.25-.16,10.67-1.52,13.94-1.47,3.56-5.37,7.63-9.14,11.57C23.51,109.72,16,117.56,16,128s7.51,18.27,14.14,25.18c3.77,3.94,7.67,8,9.14,11.57,1.36,3.27,1.44,8.69,1.52,13.94.15,9.76.31,20.82,8,28.51s18.75,7.85,28.51,8c5.25.08,10.67.16,13.94,1.52,3.56,1.47,7.63,5.37,11.57,9.14C109.72,232.49,117.56,240,128,240s18.27-7.51,25.18-14.14c3.94-3.77,8-7.67,11.57-9.14,3.27-1.36,8.69-1.44,13.94-1.52,9.76-.15,20.82-.31,28.51-8s7.85-18.75,8-28.51c.08-5.25.16-10.67,1.52-13.94,1.47-3.56,5.37-7.63,9.14-11.57C232.49,146.28,240,138.44,240,128S232.49,109.73,225.86,102.82Zm-52.2,6.84-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z",
};

/** A person's verified name on the public profile: the same two marks as the apps. The icon carries the level, never the colour alone. */
export function PersonSeal({ mark, size = 16, label }: { mark: "regular" | "fill"; size?: number; label?: string }) {
  return (
    <span className="seal" title={label}>
      <svg width={size} height={size} viewBox="0 0 256 256" {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}>
        <path d={SEAL_CHECK[mark]} fill="currentColor" />
      </svg>
    </span>
  );
}
