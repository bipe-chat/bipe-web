// The app changelog for /versoes/ (/en/versions/): bipe-app tools/changelog.mjs --json, run in the sibling clone
// (../bipe-app) against its origin/main, written to .generated/changelog.json (gitignored, one source). A sibling
// that is not cloned gives an empty page with a warning, as check-code-links does (CI clones no bipe-app).
// scripts/deploy.sh refuses an empty page. A clone whose checkout has no tool while origin/main has one fails
// the build: on 2 November 2026 an old checkout shipped an empty /versoes/. Runs before tsc in `pnpm build`.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const app = join(root, "../bipe-app");
const out = join(root, ".generated/changelog.json");
const tool = join(app, "tools/changelog.mjs");

let json = "[]\n";
const cloned = existsSync(join(app, ".git"));
if (cloned && !existsSync(tool)) {
  const onMain = (() => {
    try {
      execFileSync("git", ["-C", app, "cat-file", "-e", "origin/main:tools/changelog.mjs"], { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  })();
  if (onMain) {
    console.error("changelog: ../bipe-app is checked out before tools/changelog.mjs; check out its origin/main");
    process.exit(1);
  }
}
if (existsSync(tool)) {
  try {
    execFileSync("git", ["-C", app, "fetch", "--quiet", "origin", "main", "--tags"], { stdio: "ignore" });
  } catch {
    console.warn("changelog: git fetch in ../bipe-app failed; using its last fetched origin/main");
  }
  json = execFileSync("node", [tool, "--json", "--ref", "origin/main"], { encoding: "utf8", maxBuffer: 64 << 20 });
} else {
  console.warn("changelog: ../bipe-app/tools/changelog.mjs not found, /versoes/ is empty");
}
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, json);
console.log(`changelog: ${JSON.parse(json).length} builds`);
