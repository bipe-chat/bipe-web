# proseio-web: agent notes

Static site for proseio.com.br. Vite + React 19 + TypeScript, prerendered to HTML; only `data-island` elements hydrate. Plain CSS on proseio-tokens (no Tailwind). See `../proseio/docs/website.md`.

## Commands

- `pnpm build`: typecheck, then `scripts/build.mjs` writes `dist/` (pages, `.md` twins, `llms.txt`, sitemap, icons).
- `pnpm preview`: serves `dist/` on port 4321.
- `pnpm run deploy` (not `pnpm deploy`, which is a pnpm built-in): needs `scripts/deploy.env` (git-ignored, from `deploy.env.example`). Build, then `scripts/deploy.sh` copies `dist/` into `../proseio-infra/compose/site/` and rsyncs it to the dev node. No `--delete`.

## Rules

- pt-BR is the default at `/`. English is secondary under `/en/`. Never redirect by browser language.
- Product copy, feature status and download links come only from `../proseio-shared/product/`. Do not write feature copy in a page. Chrome copy (nav, labels) is in `src/copy.ts`.
- UI strings in simulations come from `../proseio-shared/strings/` through `t()`. Scam, handle and name results come from the reference logic in `../proseio-shared/tools/lib/registries.mjs`, never from hand-written results.
- Colours only from proseio-tokens CSS variables. Nunito only for the wordmark and titles.
- Rendered copy: no em or en dashes; run the humanizer rubric before it ships.
- Source links come from `source` in `../proseio-shared/product/distribution.json`. The site links a repo only when its `public` flag is true. Set the flag when the GitHub repo goes public (ADR 0024).
- A feature is "No app de testes" only when it is in a TestFlight build.

## Traps

- `registries.mjs` imports `node:fs`. `vite.config.ts` aliases it to `src/node-stub.ts` for the browser; `loadRegistries` runs only at build start to validate.
- @vitejs/plugin-react 6 needs Vite 8.
- PNG icons are rendered with macOS `qlmanage` in `scripts/icon.mjs`. On other systems they are skipped.
- Link-preview cards (`ogCard` on a route, `scripts/og.mjs`) render the same way. Quick Look draws an SVG on a 768-point square canvas, so the SVG is square, the card is centred, and `sips` crops it to 1200x630. The card uses only the route's static title and description: never an invite code or a handle (crawlers fetch the URL with the code in it). Off macOS the route falls back to the app icon.
- CSS entrance animations do not run in a hidden browser tab, so a screenshot of a hidden preview shows an empty phone.
