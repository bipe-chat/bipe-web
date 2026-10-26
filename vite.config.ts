import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { generateColors } from "../bipe-shared/tools/lib/gen-tokens.mjs";
import { loadRegistries } from "../bipe-shared/tools/lib/registries.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const shared = join(root, "../bipe-shared");

// The colour variables (--bipe-*) come from bipe-shared design/tokens.json, written on every run.
// .generated/ is gitignored: one source, no copy that can drift.
const colors = join(root, ".generated/colors.css");
mkdirSync(dirname(colors), { recursive: true });
writeFileSync(colors, generateColors("css"));

// Fail the build when a registry is invalid, the same check the app generators run.
function validateRegistries(): Plugin {
  return { name: "bipe-validate-registries", buildStart() { loadRegistries(shared); } };
}

export default defineConfig({
  plugins: [react(), validateRegistries()],
  resolve: {
    alias: {
      "@shared": shared,
      "@colors": colors,
      // registries.mjs reads files with node:fs in loadRegistries(). The site never calls it in the
      // browser; it passes the JSON in. These stubs keep the reference logic importable as-is.
      "node:fs": join(root, "src/node-stub.ts"),
      "node:path": join(root, "src/node-stub.ts"),
    },
  },
  server: { fs: { allow: [join(root, "..")] } },
});
