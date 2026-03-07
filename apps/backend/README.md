# Backend Service

管理后台平台中的后端服务，基于 NestJS + Prisma。

## Start

```bash
npm install
npm run prisma:generate --workspace @meglow/backend
npm run prisma:migrate --workspace @meglow/backend
npm run dev --workspace @meglow/backend
```

## Location

- Path: `apps/backend`
- Workspace: `@meglow/backend`

## LLM Provider Config

后端 AI 评估支持 `openai` / `litellm` / `openai_compatible`（均走 OpenAI Chat Completions 协议）。

### OpenAI

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
# OPENAI_BASE_URL=https://api.openai.com/v1
```

### LiteLLM

```env
AI_PROVIDER=litellm
LITELLM_BASE_URL=http://localhost:4000
LITELLM_API_KEY=sk-...
LITELLM_MODEL=gpt-4o-mini
```

### OpenAI-Compatible Mode

```env
AI_PROVIDER=openai_compatible
OPENAI_COMPAT_BASE_URL=http://localhost:8000/v1
OPENAI_COMPAT_API_KEY=your-key
OPENAI_COMPAT_MODEL=your-model
```

也支持通用兜底变量：`AI_BASE_URL`、`AI_API_KEY`、`AI_MODEL`。

## Parent Approval Workflow API

基于 Mastra 的家长审批工作流，支持挂起/恢复与数据库持久化运行状态（`@mastra/pg`，默认使用 `DATABASE_URL` 与 `MASTRA_PG_SCHEMA`）。
系统还会每分钟自动扫描 `PENDING_APPROVAL` 推送并自动创建工作流运行记录。
可通过 `MASTRA_DURABLE_REQUIRED=true` 启用 durable-only 模式（禁止 fallback，要求 snapshot 恢复链路可用）。

```http
POST /api/ai/workflows/approval/auto-start/run
POST /api/ai/workflows/approval/start/:pushId
POST /api/ai/workflows/approval/resume/:runId
```

