# AGENTS.md

## Cursor Cloud specific instructions

This repo is a single **Next.js 16** frontend app (a client-side "Bill Splitter"). There is no backend, database, or other service — everything runs in the browser. Package manager is **pnpm** (see `pnpm-lock.yaml`).

### Running
- Dev server: `pnpm dev` (Next.js + Turbopack, serves on `http://localhost:3000`). This is the only service.
- The receipt "scan" is mock OCR — clicking **Upload Receipt** loads a hard-coded sample restaurant receipt (no image upload or network call needed to exercise the core flow: upload → assign items to people → calculate split summary).

### Lint / typecheck caveats (pre-existing, not environment issues)
- `pnpm lint` runs `eslint .`, but ESLint is **not** in `package.json` and there is no ESLint config, so it fails with `eslint: not found`. This is a pre-existing repo gap, not a setup problem.
- `pnpm exec tsc --noEmit` reports a pre-existing type error in `app/page.tsx`. This does **not** block builds/dev: `next.config.mjs` sets `typescript.ignoreBuildErrors: true` and `images.unoptimized: true` (so `sharp` is not required).
