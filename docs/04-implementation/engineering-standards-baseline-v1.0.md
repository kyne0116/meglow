# 工程化标准基线（v1.0）

更新时间：2026-03-07

## 目标

在不阻塞当前功能迭代的前提下，建立可执行、可校验、可追溯的工程质量门，确保后端主干可持续交付。

## 当前强制质量门

统一命令：
- 本地：`npm run check:backend`
- CI：`npm run ci:backend`

本地执行顺序（`check:backend`）：
1. `npm run build --workspace @meglow/backend`
2. `npm run test:e2e --workspace @meglow/backend -- --runInBand`
3. `npm run status:check`

CI 执行顺序（`ci:backend`）：
1. `npx prisma db push --schema apps/backend/prisma/schema.prisma`
2. `npm run check:backend`

## 代码规范与提交门禁

已落地：
1. ESLint（TS）  
  作用范围：`apps/backend`、`packages/shared`、`tools`
2. Prettier（统一格式）
3. Husky（提交前自动执行）

提交前自动执行内容：
1. `npm run lint:backend`
2. `npm run lint:shared`

可选快速命令：
1. `npm run precommit:staged`（lint-staged，按变更文件执行格式化和自动修复）

安装后需执行一次：
1. `npm run prepare`

环境要求：
- 必需：`DATABASE_URL`
- 推荐（预发/生产一致性验证）：`MASTRA_DURABLE_REQUIRED=true`

## CI 标准

流水线文件：`.github/workflows/backend-quality.yml`

规则：
- PR / Push 到 `main` 时触发（后端相关路径变更）
- 使用 PostgreSQL 服务容器
- 执行 `npm run ci:backend`（即本地同构质量门）
- CI 默认启用 `MASTRA_DURABLE_REQUIRED=true`

## 通过标准（Definition of Done）

后端相关变更合并前必须满足：
1. `check:backend` 本地可通过
2. `backend-quality` CI 通过
3. `docs/04-implementation/live-implementation-status.md` 状态一致

## 下一阶段（v1.1 建议）

1. 引入 ESLint + Prettier 并纳入质量门
2. 增加 API contract test（OpenAPI/Schema）
3. 增加依赖漏洞扫描与镜像安全扫描
4. 增加发布前 migration 审核与回滚演练

## Engineering Update Addendum (2026-03-07)

1. Backend quality gate now includes formatting checks for backend/shared TypeScript code:
   - `npm run format:backend`
   - `npm run format:shared`
2. Backend CI (`backend-quality`) now executes gates as separate steps:
   - db schema prepare
   - lint backend/shared
   - lint tools
   - format check backend/shared
   - backend build
   - backend e2e
   - status sync check
3. Commit message rule is enforced via husky `commit-msg` hook:
   - Pattern: `<type>(<scope>): <subject>`
   - Validator: `tools/validate-commit-message.mjs`
4. Dependency security baseline is added:
   - Workflow: `.github/workflows/dependency-audit.yml`
   - Trigger: weekly schedule + manual dispatch
