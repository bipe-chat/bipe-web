// Checks every link into github.com/bipe-chat in the built site (ADR 0028): the repo must be public
// in distribution.json, and a file or folder path must exist on origin/main of the sibling clone
// (../<repo>). A sibling that is not cloned is skipped with a warning. Fails the build otherwise.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const LOCAL = { "compound-design-tokens": "bipe-tokens" };
const PATTERN = /https:\/\/github\.com\/bipe-chat\/([A-Za-z0-9._-]+)(?:\/(?:blob|tree)\/main\/([^\s"'<>)#?]+))?/g;

export function checkCodeLinks(dist, distribution) {
  const open = new Set(distribution.source.repos.filter((r) => r.public).map((r) => r.url.split("/").pop()));
  const links = new Map();
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(html|md|txt)$/.test(name)) for (const m of readFileSync(p, "utf8").matchAll(PATTERN)) links.set(m[0], [m[1], m[2] && decodeURIComponent(m[2])]);
    }
  };
  walk(dist);
  const errors = [];
  const skipped = new Set();
  for (const [url, [repo, path]] of links) {
    if (!open.has(repo)) { errors.push(`${url}: repo ${repo} is not public in distribution.json`); continue; }
    if (!path) continue;
    const dir = join(dist, "..", "..", LOCAL[repo] ?? repo);
    if (!existsSync(join(dir, ".git"))) { skipped.add(repo); continue; }
    try { execFileSync("git", ["-C", dir, "cat-file", "-e", `origin/main:${path}`], { stdio: "ignore" }); }
    catch { errors.push(`${url}: ${path} is not on origin/main of ${repo}`); }
  }
  for (const repo of skipped) console.warn(`check-code-links: ../${LOCAL[repo] ?? repo} not cloned, its paths were not checked`);
  if (errors.length) throw new Error(`Broken code links:\n${errors.join("\n")}`);
  console.log(`check-code-links: ${links.size} links ok`);
}
