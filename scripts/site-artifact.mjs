// Fetch a successful site build for the selected main sources. Never compile on the deploy Mac.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";

const repos = { web: "bipe-web", shared: "bipe-shared", app: "bipe-app" };
const sha = /^[0-9a-f]{40}$/;
const git = (root, repo, ...args) => execFileSync("git", ["-C", join(root, repo), ...args], { encoding: "utf8" }).trim();
const gh = (...args) => execFileSync("gh", args, { encoding: "utf8" }).trim();

export function sourceSnapshot(root) {
  return Object.fromEntries(Object.entries(repos).map(([key, repo]) => [key, git(root, repo, "rev-parse", "HEAD")]));
}

export function sourceKey(source) {
  return Object.keys(repos).map(key => {
    if (!sha.test(source[key] ?? "")) throw new Error(`Invalid ${key} source revision`);
    return `${key}:${source[key]}`;
  }).join(" ");
}

export function verifySource(actual, expected) {
  sourceKey(actual);
  sourceKey(expected);
  for (const key of Object.keys(repos)) {
    if (actual[key] !== expected[key]) throw new Error(`Site artifact ${key} source differs from selected main snapshot`);
  }
}

export function selectDispatch(runs, head, since) {
  return runs.filter(run => run.headSha === head && run.event === "workflow_dispatch"
    && Date.parse(run.createdAt) >= Date.parse(since))
    .sort((a, b) => b.databaseId - a.databaseId)[0];
}

export function verifyArtifact(directory, expected) {
  verifySource(JSON.parse(readFileSync(join(directory, "site-source.json"), "utf8")), expected);
  for (const path of ["index.html", "plataformas/index.html", "en/platforms/index.html"]) {
    if (!readFileSync(join(directory, "dist", path), "utf8").trim()) throw new Error(`Empty site page: ${path}`);
  }
  const changelog = JSON.parse(readFileSync(join(directory, "dist/versoes/changelog.json"), "utf8"));
  if (!Array.isArray(changelog) || !changelog.length) throw new Error("Site artifact has no app changelog");
}

export function verifyFreshMain(root, expected) {
  for (const [key, repo] of Object.entries(repos)) {
    git(root, repo, "fetch", "--quiet", "origin", "main");
    if (git(root, repo, "rev-parse", "origin/main") !== expected[key]) {
      throw new Error(`${repo} main moved during the site build; retry with fresh sources`);
    }
  }
}

export async function downloadSite(root, directory) {
  const expected = sourceSnapshot(root);
  sourceKey(expected);
  verifyFreshMain(root, expected);
  // GitHub timestamps have second precision. A concurrent dispatch is safe to
  // reuse only if its artifact later proves all three exact source revisions.
  const since = new Date(Math.floor(Date.now() / 1000) * 1000).toISOString();
  gh("workflow", "run", "build.yml", "--repo", "bipe-chat/bipe-web", "--ref", "main");
  const deadline = Date.now() + 45 * 60 * 1000;
  let run;
  let previous;
  while (Date.now() < deadline) {
    if (!run) {
      run = selectDispatch(JSON.parse(gh("run", "list", "--repo", "bipe-chat/bipe-web", "--workflow", "build.yml",
        "--branch", "main", "--event", "workflow_dispatch", "--limit", "20", "--json", "databaseId,headSha,event,createdAt")), expected.web, since);
    }
    if (run) {
      const state = JSON.parse(gh("run", "view", String(run.databaseId), "--repo", "bipe-chat/bipe-web", "--json", "status,conclusion"));
      if (state.status !== previous) console.log(`Site CI ${run.databaseId}: ${state.status}`);
      previous = state.status;
      if (state.status === "completed") {
        if (state.conclusion !== "success") throw new Error(`Site CI ${run.databaseId}: ${state.conclusion}; deployment stopped`);
        gh("run", "download", String(run.databaseId), "--repo", "bipe-chat/bipe-web", "--name", "bipe-site", "--dir", directory);
        verifyArtifact(directory, expected);
        verifyFreshMain(root, expected);
        console.log(`Verified CI artifact ${run.databaseId}: ${sourceKey(expected)}`);
        return;
      }
    }
    await new Promise(done => setTimeout(done, 10000));
  }
  throw new Error("Timed out waiting for site CI; deployment stopped");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const root = resolve(import.meta.dirname, "../..");
  if (process.argv[2] === "--key") console.log(sourceKey(sourceSnapshot(root)));
  else if (process.argv[2] === "--out" && process.argv[3]) await downloadSite(root, resolve(process.argv[3]));
  else throw new Error("Usage: node scripts/site-artifact.mjs --key | --out <empty directory>");
}
