# Meglow Monorepo

面向多端学习产品的统一仓库，当前优先支持微信小程序，后续扩展 Android/iOS，并提供统一管理后台（API + Admin UI）。

## 一级目录规划

- `apps/`：应用层
- `packages/`：共享包
- `docs/`：产品、架构、实施文档
- `tools/`：工程脚本

## apps 结构

- `apps/wechat-miniapp/`：微信小程序前端（uni-app）
- `apps/android-app/`：Android 原生应用目录（占位）
- `apps/ios-app/`：iOS 原生应用目录（占位）
- `apps/backend/`：管理后端服务（NestJS + Prisma）
- `apps/admin-ui/`：管理员 Web UI（占位）

## packages 结构

- `packages/shared/`：跨端共享类型与通用代码

## 快速开始

1. 安装依赖

```bash
npm install
```

2. 启动基础设施

```bash
docker compose up -d postgres redis
```

3. 启动后端

```bash
npm run dev:backend
```

4. 启动微信小程序前端

```bash
npm run dev:wechat-miniapp
```

## 状态同步

```bash
npm run status:sync
npm run status:check
```

看板文件：`docs/04-implementation/live-implementation-status.md`

## 工程化质量门

本地执行后端质量门（与 CI 对齐）：

```bash
set DATABASE_URL=postgresql://ai_companion:ai_companion_dev@localhost:5432/ai_companion
npm run check:backend
```

说明：
- 本地 `check:backend` 会按顺序执行 `backend build`、`backend e2e`、`status:check`
- CI `ci:backend` 会先执行 `check:backend:db`（`prisma db push`）再执行 `check:backend`
- CI 使用 `.github/workflows/backend-quality.yml`，并开启 `MASTRA_DURABLE_REQUIRED=true`

## 提交前钩子

已接入 `husky`，提交前默认执行：
- `npm run lint:backend`
- `npm run lint:shared`

可选（按变更文件快速修复）：
- `npm run precommit:staged`（`lint-staged`）

首次拉取后执行：

```bash
npm install
npm run prepare
```

## Engineering Updates (2026-03-07)

- `check:backend` now includes:
  - `lint:backend`
  - `lint:shared`
  - `lint:tools`
  - `format:backend`
  - `format:shared`
  - `build:backend`
  - `test:e2e:backend`
  - `status:check`
- `check:backend:db` and `test:e2e:backend` now auto-apply a default local `DATABASE_URL` when env is not provided.
- CI workflow `.github/workflows/backend-quality.yml` now runs each backend gate step separately for clearer failure visibility.
- Added commit message convention gate:
  - hook: `.husky/commit-msg`
  - validator: `tools/validate-commit-message.mjs`
  - format: `<type>(<scope>): <subject>` (Conventional Commits style)
- Added scheduled dependency audit workflow:
  - `.github/workflows/dependency-audit.yml`

