import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const product = JSON.parse(readFileSync(new URL("../../bipe-shared/product/product.json", import.meta.url), "utf8"));
const experiment = product.headlineTest;
const active = new Map([["h0", product.promise.pt.title], ...experiment.arms.map((arm) => [arm.id, arm.pt])]);
const home = readFileSync(new URL("../dist/index.html", import.meta.url), "utf8");
const inline = [...home.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]).find((script) => script.includes('document.getElementById("hero-title")'));

function visit(previous) {
  let arm = previous;
  const hero = { textContent: "" };
  const events = [];
  const key = `bipe.${experiment.experiment}`;
  assert.ok(inline, "the active test needs its before-paint assignment script");
  vm.runInNewContext(inline, {
    Math: { random: () => 0, floor: Math.floor },
    localStorage: {
      getItem: (name) => { assert.equal(name, key); return arm; },
      setItem: (name, value) => { assert.equal(name, key); arm = value; },
    },
    document: { getElementById: (id) => { assert.equal(id, "hero-title"); return hero; } },
    navigator: { sendBeacon: (_url, body) => { events.push(JSON.parse(body)); return true; } },
  });
  return { arm, title: hero.textContent, events };
}

test("retired guarantees remain archived and cannot reuse an active ID", () => {
  for (const id of ["h2", "h4"]) {
    const archived = experiment.retired.find((arm) => arm.id === id);
    assert.ok(archived?.pt && archived.en && archived.date && archived.why);
    assert.equal(active.has(id), false);
  }
});

test("a stored retired arm is reassigned before paint without changing historical labels", { skip: !experiment.active }, () => {
  for (const retired of experiment.retired) {
    const result = visit(retired.id);
    assert.equal(result.arm, "h0");
    assert.equal(result.title, product.promise.pt.title);
    assert.deepEqual(result.events, [{ experiment: experiment.experiment, arm: "h0", event: "assign" }]);
  }
});

test("existing active arms keep their headline and do not add another assignment", { skip: !experiment.active }, () => {
  for (const [arm, title] of active) assert.deepEqual(visit(arm), { arm, title, events: [] });
});
