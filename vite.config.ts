import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { loadRegistries } from "../bipe-shared/tools/lib/registries.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const shared = join(root, "../bipe-shared");

// Fail the build when a registry is invalid, the same check the app generators run.
function validateRegistries(): Plugin {
  return { name: "bipe-validate-registries", buildStart() { loadRegistries(shared); } };
}

export default defineConfig({
  plugins: [react(), validateRegistries()],
  resolve: {
    alias: {
      "@shared": shared,
      "@tokens": join(root, "../bipe-tokens/assets/web/css"),
      // registries.mjs reads files with node:fs in loadRegistries(). The site never calls it in the
      // browser; it passes the JSON in. These stubs keep the reference logic importable as-is.
      "node:fs": join(root, "src/node-stub.ts"),
      "node:path": join(root, "src/node-stub.ts"),
    },
  },
  server: { fs: { allow: [join(root, "..")] } },
});
