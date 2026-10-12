// Makes profile photos for the sample cast (src/cast/cast.json) with the ChatGPT app's bundled
// Codex CLI and its built-in image_gen tool. It uses the ChatGPT login, not an API key.
//
//   node scripts/cast.mjs                    list every entry and whether it has a photo
//   node scripts/cast.mjs --missing          make every missing photo
//   node scripts/cast.mjs joana rafa         make (or remake) these photos
//   options: --note "older, no glasses"      add to the prompt of this run only
//            --ref path/to/image.jpg         attach a reference image (same person, same style)
//            --jobs 3                        parallel Codex runs (default 3)
//            --dry                           print the prompts, make nothing
//
// The full PNG goes to cast-originals/<id>/ (git-ignored). The site photo is a 256 px JPEG at
// src/cast/photos/<id>.jpg. macOS only: it uses sips.
import { spawn, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cast = JSON.parse(readFileSync(join(root, "src/cast/cast.json"), "utf8"));
const photos = join(root, "src/cast/photos");
const originals = join(root, "cast-originals");
const codexHome = process.env.CODEX_HOME ?? join(homedir(), ".codex");
const CODEX = [process.env.CODEX, "/Applications/ChatGPT.app/Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS/codex"]
  .find((p) => p && existsSync(p)) ?? "codex";

const { values: opt, positionals: ids } = parseArgs({
  allowPositionals: true,
  options: { missing: { type: "boolean" }, note: { type: "string" }, ref: { type: "string" }, jobs: { type: "string", default: "3" }, dry: { type: "boolean" } },
});

const byId = new Map(cast.cast.map((e) => [e.id, e]));
const generated = (e) => e.photo && !e.photo.copyOf;
const has = (e) => existsSync(join(photos, `${e.id}.jpg`));

export function prompt(e, note) {
  const style = cast.styles[e.photo.style];
  if (!style) throw new Error(`${e.id}: unknown style ${e.photo.style}`);
  return [style.replace("{look}", e.photo.look), cast.base, note].filter(Boolean).join(" ");
}

if (!ids.length && !opt.missing) {
  for (const e of cast.cast) {
    const state = !e.photo ? "no photo (initials)" : e.photo.copyOf ? `copy of ${e.photo.copyOf}` : has(e) ? "ok" : "MISSING";
    console.log(`${e.id.padEnd(12)} ${(e.photo?.style ?? "").padEnd(9)} ${state}`);
  }
  process.exit(0);
}

const targets = opt.missing ? cast.cast.filter((e) => generated(e) && !has(e)) : ids.map((id) => {
  const e = byId.get(id);
  if (!e) throw new Error(`no cast entry ${id}`);
  if (!generated(e)) throw new Error(`${id} has no photo to make (photo is null or copyOf)`);
  return e;
});
if (opt.ref && !existsSync(opt.ref)) throw new Error(`no file ${opt.ref}`);

function run(e) {
  const p = prompt(e, opt.note);
  if (opt.dry) { console.log(`\n# ${e.id}\n${p}`); return Promise.resolve(); }
  const instruction = [
    "Call the built-in image_gen tool exactly once with the prompt below, verbatim, square 1:1.",
    opt.ref ? "Use the attached image as the reference: keep the same person, place and photo style unless the prompt says otherwise." : null,
    "Do nothing else. Reply only with DONE.", "", `PROMPT: ${p}`,
  ].filter((l) => l !== null).join("\n");
  const args = ["exec", "--skip-git-repo-check", "-s", "read-only", "-c", 'model_reasoning_effort="low"', ...(opt.ref ? ["-i", opt.ref] : []), instruction];
  console.log(`${e.id}: generating`);
  return new Promise((resolve, reject) => {
    const child = spawn(CODEX, args, { cwd: tmpdir(), stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    child.on("error", reject);
    child.on("close", () => {
      const session = out.match(/session id:\s*(\S+)/)?.[1];
      const dir = session && join(codexHome, "generated_images", session);
      const png = dir && existsSync(dir) && readdirSync(dir).filter((f) => f.endsWith(".png")).sort().at(-1);
      if (!png) return reject(new Error(`${e.id}: Codex made no image.\n${out.slice(-1500)}`));
      const keep = join(originals, e.id);
      mkdirSync(keep, { recursive: true });
      const original = join(keep, `${new Date().toISOString().replace(/[:.]/g, "-")}.png`);
      copyFileSync(join(dir, png), original);
      toJpeg(original, join(photos, `${e.id}.jpg`));
      console.log(`${e.id}: src/cast/photos/${e.id}.jpg`);
      resolve();
    });
  });
}

/** Centre-crop to a square, 256 px, JPEG quality 82. */
export function toJpeg(src, dest) {
  mkdirSync(dirname(dest), { recursive: true });
  const info = spawnSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", src], { encoding: "utf8" }).stdout;
  const w = Number(info.match(/pixelWidth: (\d+)/)?.[1]);
  const h = Number(info.match(/pixelHeight: (\d+)/)?.[1]);
  const side = Math.min(w, h);
  const r = spawnSync("sips", ["--cropToHeightWidth", String(side), String(side), "-Z", "256", "-s", "format", "jpeg", "-s", "formatOptions", "82", src, "--out", dest], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`sips failed for ${src}: ${r.stderr}`);
}

const queue = [...targets];
const failures = [];
await Promise.all(Array.from({ length: Math.max(1, Number(opt.jobs)) }, async () => {
  // One retry: Codex sometimes answers without calling the tool, and moderation sometimes blocks a borderline output.
  for (let e = queue.shift(); e; e = queue.shift()) await run(e).catch(() => run(e)).catch((err) => failures.push(err.message));
}));
if (failures.length) { console.error(failures.join("\n\n")); process.exit(1); }
