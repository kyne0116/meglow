# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Meglow is a multi-platform AI companion learning product (K-12 education). It uses an npm workspaces monorepo with Turbo for orchestration. Documentation is in Chinese; code is in English. Requires Node >= 20.

## Build & Development Commands

```bash
# Install & setup
npm install
npm run prepare                  # Setup husky git hooks (required after clone)
cp .env.example .env             # Configure environment

# Start infrastructure
docker compose up -d postgres redis

# Development servers
npm run dev:backend              # NestJS watch mode (port 3000)
npm run dev:wechat-miniapp       # Vite dev server

# Full quality gate (matches CI)
npm run check:backend            # Runs: lint → format → build → e2e → status:check

# Linting & formatting
npm run lint:backend             # ESLint backend (--max-warnings=0)
npm run lint:shared              # ESLint shared package
npm run lint:tools               # ESLint tools/*.mjs
npm run format:backend           # Prettier check backend
npm run format:shared            # Prettier check shared
npm run format:write             # Prettier fix all files

# Testing
npm run test:e2e:backend         # Jest e2e tests (auto-applies DATABASE_URL if unset)

# Database
npm run build:backend            # NestJS build (nest build)
npm run check:backend:db         # Prisma db push (auto-applies DATABASE_URL)
```

### Workspace-specific commands

```bash
npm run <script> --workspace @meglow/backend
npm run <script> --workspace @meglow/shared
npm run <script> --workspace @meglow/wechat-miniapp
```

### Backend workspace scripts (run from apps/backend or via --workspace)

```bash
npm run prisma:generate          # Generate Prisma client
npm run prisma:migrate           # Run Prisma migrations (prisma migrate dev)
npm run prisma:seed              # Seed database (ts-node prisma/seed.ts)
```

## Architecture

### Monorepo Structure

```
apps/
  backend/          # NestJS API server (the active app)
  wechat-miniapp/   # Vue 3 + uni-app WeChat Mini Program
  android-app/      # Placeholder
  ios-app/          # Placeholder
  admin-ui/         # Placeholder
packages/
  shared/           # @meglow/shared — cross-platform TypeScript types (family, child, auth, settings)
tools/              # Engineering scripts (husky setup, commit validation, db push, e2e runner, status sync)
docs/               # PRD, product design, architecture, implementation docs
```

### Backend (NestJS + Prisma + Mastra)

All API routes are prefixed with `/api`. Global pipes: `ValidationPipe` (whitelist + transform + forbidNonWhitelisted). Global filter: `HttpExceptionFilter`. Global interceptor: `RequestLoggingInterceptor`. Global middleware: `RequestIdMiddleware`.

**Feature modules** (in `apps/backend/src/`):
- `auth/` — JWT authentication (Passport)
- `family/` — Family management
- `child/` — Child profiles and learning settings
- `english/` — English learning sessions and word progress
- `speech/` — Speech evaluation (mock/Xunfei providers)
- `briefing/` — Daily briefing generation
- `push/` — Learning push lifecycle with scheduler
- `notification/` — Notification logging
- `gamification/` — Game profiles and achievements
- `ai/` — AI integration layer:
  - `llm-gateway.service.ts` — Multi-provider LLM gateway (mock, openai, litellm, openai_compatible)
  - `ai-tutor.service.ts` — Tutoring logic
  - `workflows/` — Mastra durable workflows (parent approval flow)
  - `prompts/` — Scenario prompt templates
  - `evals/` — AI evaluation framework
- `prisma/` — Prisma service (global DB access)
- `common/` — Shared filters, interceptors, middleware, store
- `health/` — Health check endpoint

**Database**: PostgreSQL 15 via Prisma. Schema at `apps/backend/prisma/schema.prisma`. Key models: Family → Parent/Child, Child → ChildProfile/LearningPush/LearningSession/WordProgress/GameProfile/ChildLearningSettings.

**AI provider**: Controlled by `AI_PROVIDER` env var. Set to `mock` for local dev without API keys.

**Mastra workflows**: Durable workflow state stored in PostgreSQL under `mastra` schema. `MASTRA_DURABLE_REQUIRED=true` in CI/production.

### Frontend (WeChat Mini Program)

Vue 3 + Pinia + uni-app + Vite. Source in `apps/wechat-miniapp/src/` with `pages/`, `stores/`, `services/` directories.

### Shared Package

`packages/shared/` exports TypeScript types via `dist/index.js`. No bundler — compiled with plain `tsc`. Path alias: `@shared/*` maps to `packages/shared/src/*` (configured in `tsconfig.base.json`).

## Code Style

- **Prettier**: double quotes, semicolons, no trailing commas, 100 char width, 2-space indent
- **ESLint**: TypeScript recommended rules, `no-explicit-any` is allowed, unused vars with `_` prefix are allowed
- **Line endings**: LF
- **Commit messages**: Conventional Commits — `<type>(<scope>): <subject>` (max 100 chars). Types: `feat|fix|docs|style|refactor|perf|test|chore|ci|build|revert`. Validated by `tools/validate-commit-message.mjs` via husky commit-msg hook.

## CI Pipeline

GitHub Actions workflow `backend-quality.yml` triggers on PR/push to main when backend/shared/tools/config files change. Runs against PostgreSQL 15 service container. Steps: install (`npm ci --legacy-peer-deps`) → db push → lint (backend, shared, tools) → format check → build → e2e tests → status sync check. Uses `MASTRA_DURABLE_REQUIRED=true`.

## Key Environment Variables

`AI_PROVIDER` (mock|openai|litellm|openai_compatible), `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `SPEECH_EVAL_PROVIDER` (mock|xunfei), `MASTRA_DURABLE_REQUIRED`, `LANGFUSE_*` (observability). See `.env.example` for full list.

## Status Tracking

`npm run status:sync` updates `docs/04-implementation/live-implementation-status.md` from code. `npm run status:check` verifies consistency (runs in CI).
