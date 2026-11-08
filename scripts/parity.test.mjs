import test from "node:test";
import assert from "node:assert/strict";
import { counts, entry, groups, hasGap, recordsFor } from "../src/parity.ts";

const item = (overrides = {}) => ({ id: "calls", name: "Calls", ios: "built", android: "testing", web: "built", macos: "testing", windows: "planned", ...overrides });

test("a future Windows client does not turn every implemented feature into a current gap", () => {
  assert.equal(hasGap(item(), "all"), false);
  assert.equal(hasGap(item(), "windows"), true);
  assert.equal(hasGap(item({ web: "planned" }), "all"), true);
});

test("retired web exclusions need review; actual platform exclusions remain not applicable", () => {
  const legacy = item({ web: { status: "n/a", reason: "No web chat (ADR 0004)" } });
  assert.equal(entry(legacy, "web").level, "review");
  assert.equal(hasGap(legacy, "all"), true);
  const valid = item({ web: { status: "n/a", reason: "Requires the phone's address book" } });
  assert.equal(entry(valid, "web").level, "n/a");
  const totals = counts([legacy, valid, item()], "web");
  assert.deepEqual([totals.review, totals["n/a"], totals.built], [1, 1, 1]);
  assert.equal(Object.values(totals).reduce((a, b) => a + b), 3);
});

test("new ledger capabilities stay visible before the desktop plan catches up", () => {
  const rows = [item(), item({ id: "new-feature" })];
  const plan = { sequence: "mac-first", waves: [{ id: "calls", capabilities: ["calls"] }] };
  assert.deepEqual(groups(rows, plan).map(group => group.items.map(row => row.id)), [["calls"], ["new-feature"]]);
  assert.throws(() => groups(rows, { ...plan, waves: [{ id: "bad", capabilities: ["calls", "calls"] }] }));
});

test("acceptance evidence is scoped to the scenario and exact clients, never inferred from built status", () => {
  const record = { scenario: "calls", result: "failed", clients: [{ id: "ios" }] };
  const assessment = { scenarios: [{ id: "calls", capabilities: ["calls"] }], acceptanceRecords: [record] };
  assert.deepEqual(recordsFor(item(), assessment, ["web"]), []);
  assert.deepEqual(recordsFor(item(), assessment, ["ios"]), [record]);
});
