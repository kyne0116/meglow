# CLAUDE.md

Meglow is a multi-platform children's education app with frontend and backend.

## Working Rules

1. No Legacy Burden
2. Minimal Files
3. Complete Features
4. Simplest Code
5. Test Early, Test Often

Apply them literally:

- delete obsolete code instead of preserving compatibility
- prefer fewer files and direct code paths
- avoid placeholder abstractions
- verify with builds immediately after changes

## Commands

```bash
cd frontend && pnpm install
cd frontend && pnpm dev:mp-weixin
cd frontend && pnpm build:mp-weixin
cd frontend && pnpm build:app-android
cd frontend && pnpm build:app-ios
```

## Structure

- `frontend/` — uni-app frontend (Vue 3, WeChat/Android/iOS)
  - `src/`: app source
  - `package.json`: scripts and dependencies
  - `vite.config.js`: uni-app vite config
  - `tsconfig.json`: TypeScript config
- `backend/` — backend service (user-managed)
- `docs/` — product requirements, design, architecture, implementation plans
