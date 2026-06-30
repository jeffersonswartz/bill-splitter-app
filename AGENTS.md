# AGENTS.md

## Cursor Cloud specific instructions

This repo is a single **Next.js 16** frontend app (a client-side "Bill Splitter"). There is no backend, database, or other service — everything runs in the browser. Package manager is **pnpm** (see `pnpm-lock.yaml`).

### Running
- Dev server: `pnpm dev` (Next.js + Turbopack, serves on `http://localhost:3000`). This is the only service.
- Core flow: upload/scan a receipt photo → items are auto-itemized → assign items to people → calculate split summary.
- Receipt OCR runs **client-side in the browser** via `tesseract.js` (dynamically imported in `app/page.tsx`). On first scan it downloads the OCR engine/worker + English language data from a CDN, so the browser needs network access and the first scan can take ~10-30s. There is also a "Try a sample receipt" link that loads a hard-coded sample with no upload/network needed (handy for offline testing).

### Lint / typecheck caveats (pre-existing, not environment issues)
- `pnpm lint` runs `eslint .`, but ESLint is **not** in `package.json` and there is no ESLint config, so it fails with `eslint: not found`. This is a pre-existing repo gap, not a setup problem.
- `pnpm exec tsc --noEmit` reports a pre-existing type error in `app/page.tsx`. This does **not** block builds/dev: `next.config.mjs` sets `typescript.ignoreBuildErrors: true` and `images.unoptimized: true` (so `sharp` is not required).
