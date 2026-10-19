// The business seal on the public link page (bipe#252). Verifies a badge envelope in the browser
// (bipe-shared docs/badge-attestation.md) against the trusted keys in registries/badge-keys.json.
// The build validates that registry at start (loadRegistries), so a test-only-* kid never ships.
//
// The web page checks less than the apps. It has no Matrix client, so it has no master key for step 7
// (msk binding), and GET /v1/profiles/{handle} never returns the Matrix ID, so step 6 checks only that
// `sub` is an account on the Bipe homeserver. The page checks v, kid, the signature, the cnpj fields,
// iat and exp, sub and lvl == "cnpj". Everything else is no seal (fail closed).
import badgeKeys from "@shared/registries/badge-keys.json";
import officialAccounts from "@shared/registries/official-accounts.json";

export type CompanyBadge = { name: string; legalName: string; tradeName?: string; cnpj: string };

const HOMESERVER = officialAccounts.accounts.support.userId.split(":")[1];
const METHODS = ["ecnpj", "partner", "staff"];

function base64url(s: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[A-Za-z0-9_-]*$/.test(s)) return null;
  try {
    const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4));
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

const str = (v: unknown): v is string => typeof v === "string" && v.length > 0;

/** The company fields of a valid lvl "cnpj" badge, else null. `keys` and `now` (Unix seconds) are for checks against test vectors. */
export async function verifyCompanyBadge(envelope: unknown, keys: Record<string, string> = badgeKeys.keys, now = Date.now() / 1000): Promise<CompanyBadge | null> {
  try {
    if (!envelope || typeof envelope !== "object") return null;
    const { v, kid, payload, sig } = envelope as Record<string, unknown>;
    if (v !== 1 || typeof kid !== "string" || !Object.hasOwn(keys, kid) || !str(payload) || !str(sig)) return null;
    const raw = base64url(keys[kid]);
    const bytes = base64url(payload);
    const signature = base64url(sig);
    if (!raw || !bytes || !signature) return null;
    const key = await crypto.subtle.importKey("raw", raw, { name: "Ed25519" }, false, ["verify"]);
    if (!(await crypto.subtle.verify({ name: "Ed25519" }, key, signature, bytes))) return null;
    const p = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as Record<string, unknown>;
    if (p.lvl !== "cnpj") return null;
    if (!str(p.sub) || !str(p.name) || !str(p.legal_name) || !str(p.msk)) return null;
    if (typeof p.cnpj !== "string" || !/^[0-9A-Z]{12}[0-9]{2}$/.test(p.cnpj)) return null;
    if (typeof p.method !== "string" || !METHODS.includes(p.method)) return null;
    if (typeof p.checked_month !== "string" || !/^[0-9]{4}-(0[1-9]|1[0-2])$/.test(p.checked_month)) return null;
    if (p.trade_name !== undefined && !str(p.trade_name)) return null;
    if (!Number.isInteger(p.iat) || !Number.isInteger(p.exp) || !((p.iat as number) <= now && now < (p.exp as number))) return null;
    const [local, server, ...rest] = p.sub.split(":");
    if (rest.length || server !== HOMESERVER || !/^@[^:\s]+$/.test(local)) return null;
    return { name: p.name, legalName: p.legal_name, ...(p.trade_name ? { tradeName: p.trade_name as string } : {}), cnpj: p.cnpj };
  } catch {
    // No Ed25519 in this browser, bad bytes or bad JSON: no seal.
    return null;
  }
}

/** 12.345.678/0001-90. Alphanumeric CNPJs (2026) keep the same mask. */
export const formatCnpj = (c: string) => `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12)}`;
