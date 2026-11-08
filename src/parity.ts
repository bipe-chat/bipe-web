// Pure comparison logic. Implementation status stays in bipe-shared/product/parity.json.
export const CLIENTS = ["ios", "android", "web", "macos", "windows"] as const;
export type Client = typeof CLIENTS[number];
export const LEVELS = ["testing", "built", "planned", "review", "policy", "n/a"] as const;
export type Level = typeof LEVELS[number];
export type Entry = { status: Exclude<Level, "review">; reason?: string; note?: string; evidence?: string[]; issue?: number };
export type ParityItem = { id: string; name: string; note?: string } & Record<Client, Entry | Entry["status"]>;
export type ParityPlan = { sequence: string; waves: { id: string; capabilities: string[] }[] };
export type AcceptanceRecord = { scenario: string; result: "passed" | "failed"; date: string; accountScope: string; clients: { id: Client; version: string; build: string | number; os: string }[]; evidence: string[] };
export type ClientAssessment = { reviewedOn: string; scenarios: { id: string; capabilities: string[]; checks: string[] }[]; acceptanceRecords: AcceptanceRecord[] };

export function entry(item: ParityItem, client: Client): Entry & { level: Level } {
  const raw = item[client];
  const value = typeof raw === "string" ? { status: raw } : raw;
  const stale = client === "web" && value.status === "n/a" && /No web chat|ADR 0004|stock Element Web/i.test(value.reason ?? "");
  return { ...value, level: stale ? "review" : value.status };
}

export function counts(items: ParityItem[], client: Client): Record<Level, number> {
  const result = Object.fromEntries(LEVELS.map(level => [level, 0])) as Record<Level, number>;
  for (const item of items) result[entry(item, client).level]++;
  return result;
}

/** Windows is a future client; including it would make every row a current-client gap. */
export function hasGap(item: ParityItem, client: Client | "all"): boolean {
  return (client === "all" ? CLIENTS.filter(c => c !== "windows") : [client]).some(c => ["planned", "review"].includes(entry(item, c).level));
}

export function groups(items: ParityItem[], plan: ParityPlan) {
  const byId = new Map(items.map(item => [item.id, item]));
  const assigned = new Set<string>();
  const result = plan.waves.map(wave => ({ id: wave.id, items: wave.capabilities.map(id => {
    const item = byId.get(id);
    if (!item || assigned.has(id)) throw new Error(`Invalid parity group assignment: ${id}`);
    assigned.add(id);
    return item;
  }) }));
  // New capabilities must never silently disappear when the plan has not caught up.
  const remaining = items.filter(item => !assigned.has(item.id));
  if (remaining.length) result.push({ id: "other", items: remaining });
  return result;
}

/** Records describe scenarios, exact clients and builds; they are never a global pass. */
export function recordsFor(item: ParityItem, assessment: ClientAssessment, clients: readonly Client[]) {
  const scenarios = new Set(assessment.scenarios.filter(s => s.capabilities.includes(item.id)).map(s => s.id));
  return assessment.acceptanceRecords.filter(record => scenarios.has(record.scenario) && record.clients.some(c => clients.includes(c.id)));
}

export function cleanName(name: string): string {
  return name.replace(/\s*\([^)]*(?:ADR |bipe#|MSC\d)[^)]*\)/g, "").replace(/[\u2013\u2014]/g, ",").trim();
}

