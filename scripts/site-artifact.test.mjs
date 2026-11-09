import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { test } from "node:test";
import { selectDispatch, sourceKey, sourceSnapshot, verifyArtifact, verifyFreshMain, verifySource } from "./site-artifact.mjs";

const source = { web: "a".repeat(40), shared: "b".repeat(40), app: "c".repeat(40) };

test("registry-only and site-only changes invalidate the deployed source key", () => {
  assert.equal(sourceKey({ ...source, infra: "unused" }), sourceKey(source));
  for (const key of ["web", "shared", "app"]) {
    assert.notEqual(sourceKey({ ...source, [key]: "d".repeat(40) }), sourceKey(source));
  }
  assert.throws(() => sourceKey({ ...source, shared: undefined }), /Invalid shared/);
});

test("site dispatch selection excludes old, PR and different-head builds", () => {
  const run = { databaseId: 10, headSha: source.web, event: "workflow_dispatch", createdAt: "2026-11-09T08:00:00Z" };
  assert.deepEqual(selectDispatch([
    { ...run, databaseId: 13, event: "pull_request" },
    { ...run, databaseId: 12, headSha: source.app },
    { ...run, databaseId: 11, createdAt: "2026-11-09T07:59:59Z" }, run,
  ], source.web, run.createdAt), run);
  assert.equal(selectDispatch([run], source.web, "2026-11-09T08:00:01Z"), undefined);
});

test("a green web build cannot deploy stale shared or app data", () => {
  verifySource(source, source);
  for (const key of ["web", "shared", "app"]) {
    assert.throws(() => verifySource({ ...source, [key]: "d".repeat(40) }, source), /differs from selected/);
    const incomplete = { ...source };
    delete incomplete[key];
    assert.throws(() => verifySource(incomplete, source), /Invalid/);
  }
});

test("a matching artifact must contain both parity pages and a populated changelog", () => {
  const dir = mkdtempSync(join(tmpdir(), "bipe-site-artifact-"));
  try {
    writeFileSync(join(dir, "site-source.json"), JSON.stringify(source));
    for (const path of ["", "plataformas", "en/platforms", "versoes"]) mkdirSync(join(dir, "dist", path), { recursive: true });
    for (const path of ["index.html", "plataformas/index.html", "en/platforms/index.html"]) writeFileSync(join(dir, "dist", path), "<main>fixture</main>");
    writeFileSync(join(dir, "dist/versoes/changelog.json"), "[{}]");
    verifyArtifact(dir, source);
    writeFileSync(join(dir, "dist/en/platforms/index.html"), "");
    assert.throws(() => verifyArtifact(dir, source), /Empty site page/);
    writeFileSync(join(dir, "dist/en/platforms/index.html"), "<main>fixture</main>");
    writeFileSync(join(dir, "dist/versoes/changelog.json"), "[]");
    assert.throws(() => verifyArtifact(dir, source), /no app changelog/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("sources that move while CI runs stop deployment even when the artifact matches its original snapshot", () => {
  const root = mkdtempSync(join(tmpdir(), "bipe-site-sources-"));
  const git = (dir, ...args) => execFileSync("git", ["-C", dir, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  try {
    for (const repo of ["bipe-web", "bipe-shared", "bipe-app"]) {
      const dir = join(root, repo);
      const remote = join(root, `${repo}.git`);
      mkdirSync(dir);
      mkdirSync(remote);
      git(remote, "init", "--bare");
      git(dir, "init", "-b", "main");
      git(dir, "config", "user.name", "Synthetic CI test");
      git(dir, "config", "user.email", "fixture@example.invalid");
      git(dir, "-c", "commit.gpgsign=false", "commit", "--allow-empty", "-m", "fixture");
      git(dir, "remote", "add", "origin", remote);
      git(dir, "push", "origin", "main");
    }
    const expected = sourceSnapshot(root);
    verifyFreshMain(root, expected);
    for (const [key, repo] of Object.entries({ web: "bipe-web", shared: "bipe-shared", app: "bipe-app" })) {
      const dir = join(root, repo);
      git(dir, "-c", "commit.gpgsign=false", "commit", "--allow-empty", "-m", "new main");
      git(dir, "push", "origin", "main");
      git(dir, "reset", "--hard", expected[key]);
      assert.throws(() => verifyFreshMain(root, expected), new RegExp(`${repo} main moved`));
      git(dir, "push", "--force", "origin", "main");
    }
  } finally { rmSync(root, { recursive: true, force: true }); }
});
