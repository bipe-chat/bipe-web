export type Platform = "ios" | "android" | "other";

/** The visitor's phone platform. iPadOS reports a Mac user agent, so touch support decides there. */
export function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return "ios";
  return "other";
}

/** True when the person asked for reduced motion (bipe#492). Browser only. */
export function reducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Scroll with no animation under reduced motion. Browser only. */
export function scrollBehavior(): ScrollBehavior {
  return reducedMotion() ? "auto" : "smooth";
}
