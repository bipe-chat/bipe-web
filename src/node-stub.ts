// Browser stand-in for node:fs and node:path. See vite.config.ts.
export function readFileSync(): never {
  throw new Error("node:fs is not available in the browser");
}
export function join(...parts: string[]): string {
  return parts.join("/");
}
