# Platform Priority Backlog Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the new seven-document platform documentation structure into an execution-ready backlog covering the next recommended code and documentation work.

**Architecture:** Organize follow-up work by approved platform stage priority. Treat phase 2 and phase 3 as the immediate delivery focus, phase 1 as selective hardening, phase 4 as boundary extraction, and phase 5 as documentation-only for now.

**Tech Stack:** Markdown, Vue 3, uni-app, Vite, NestJS, Prisma, Element Plus, repository documentation

---

## Chunk 1: Immediate product and business closure work

### Task 1: Phase 3 first-priority backlog - child creation UI

**Files:**
- Read: `docs/05-阶段三：AI学伴首个业务化落地.md`
- Read: `frontend/src/pages/auth/login/index.vue`
- Read: `frontend/src/pages/parent/home/index.vue`
- Read: `frontend/src/pages/parent/settings/learning/index.vue`
- Read: `backend/apps/api/src/children`

- [ ] **Step 1: Add a dedicated backlog item for child creation UI**

Define:

```text
Priority: High
Stage: Phase 3
Why now: removes the largest live business-flow break
Outcome: first-time acceptance no longer depends on Swagger
```

- [ ] **Step 2: Record likely code touch points**

Include:

```text
frontend/src/pages/parent/*
frontend/src/pages.json
frontend/src/services/api.ts
backend/apps/api/src/children/*
```

- [ ] **Step 3: Define acceptance**

Acceptance should require:

```text
家长可在 UI 创建孩子
创建后能直接进入学习设置与任务流程
不再依赖 Swagger 完成首次验收
```

### Task 2: Phase 3 second-priority backlog - strengthen English learning flow

**Files:**
- Read: `docs/05-阶段三：AI学伴首个业务化落地.md`
- Read: `frontend/src/pages/child/session/index.vue`
- Read: `backend/apps/api/src/learning`
- Read: `backend/apps/api/src/content`

- [ ] **Step 1: Add a backlog item for learning-flow completion**

Define:

```text
Priority: High
Stage: Phase 3
Why now: current business loop is usable but still thin
Outcome: stronger learning experience without jumping to multi-subject scope
```

- [ ] **Step 2: Narrow the scope**

Include:

```text
发音链路
更完整英语互动
学习反馈增强
避免立即扩到语文/数学
```

- [ ] **Step 3: Define acceptance**

Acceptance should require:

```text
英语学习流程比当前最小题型更完整
端上反馈和学习体验连续
回归不破坏现有任务与会话链路
```

## Chunk 2: Platform common foundation expansion

### Task 3: Phase 2 first-priority backlog - strengthen admin/product common foundation

**Files:**
- Read: `docs/04-阶段二：产品共性底座.md`
- Read: `admin-web/src/pages/dashboard/DashboardPage.vue`
- Read: `admin-web/src/pages/textbooks/TextbooksPage.vue`
- Read: `admin-web/src/pages/content-items/ContentItemsPage.vue`
- Read: `admin-web/src/pages/knowledge-points/KnowledgePointsPage.vue`
- Read: `backend/apps/api/src/admin-overview`
- Read: `backend/apps/api/src/admin-content`
- Read: `backend/apps/api/src/content-ops`

- [ ] **Step 1: Add a backlog item for backend product-layer hardening**

Define:

```text
Priority: High
Stage: Phase 2
Why now: current admin and content foundation is real but still scenario-biased
Outcome: platform-level admin/product layer rather than one-off companion support tooling
```

- [ ] **Step 2: Scope the work to platform common capabilities**

Include:

```text
运营视图增强
审核状态治理
平台级配置对象
更清晰的后台产品边界
```

- [ ] **Step 3: Define acceptance**

Acceptance should require:

```text
后台能力不再只围绕当前单一 AI 学伴场景
关键运营/审核对象可持续扩展
新增后台功能继续落在平台共性层
```

### Task 4: Phase 1 selective hardening backlog - unify auth and common boundaries

**Files:**
- Read: `docs/03-阶段一：技术共性底座.md`
- Read: `backend/apps/api/src/auth`
- Read: `backend/apps/api/src/admin-auth`
- Read: `backend/apps/api/src/common/guards`
- Read: `backend/apps/api/src/common`

- [ ] **Step 1: Add a backlog item for auth boundary hardening**

Define:

```text
Priority: Medium
Stage: Phase 1
Why now: current parallel auth flows are enough to run but not enough to scale cleanly
Outcome: clearer shared identity and permission boundary
```

- [ ] **Step 2: Keep the scope narrow**

Include:

```text
统一鉴权边界
公共 guard 能力梳理
角色/身份边界澄清
不做大规模底座返工
```

- [ ] **Step 3: Define acceptance**

Acceptance should require:

```text
家长与管理员鉴权关系更清晰
公共安全能力归属更明确
后续阶段扩展不会继续复制鉴权模式
```

## Chunk 3: Future-facing preparation

### Task 5: Phase 4 pre-implementation backlog - extract AI platform candidates

**Files:**
- Read: `docs/06-阶段四：AI平台化.md`
- Read: `backend/apps/api/src/pushes`
- Read: `backend/apps/api/src/learning`

- [ ] **Step 1: Add a backlog item for AI-platform boundary extraction**

Define:

```text
Priority: Medium
Stage: Phase 4
Why now: prepare, do not overbuild
Outcome: identify what current business logic should later become platform AI capability
```

- [ ] **Step 2: Keep it documentation and extraction oriented**

Include:

```text
画像候选能力
策略候选能力
编排候选能力
不要立即重构成平台模块
```

- [ ] **Step 3: Define acceptance**

Acceptance should require:

```text
能明确指出哪些现有业务逻辑未来应平台化
不影响当前阶段二、三交付节奏
```

### Task 6: Phase 5 backlog rule - no implementation yet

**Files:**
- Read: `docs/07-阶段五：商业化与规模化运营.md`

- [ ] **Step 1: Add a backlog guardrail for phase 5**

Define:

```text
Priority: Deferred
Stage: Phase 5
Rule: do not start coding until real subscription or operating requirements exist
```

- [ ] **Step 2: Define acceptance**

Acceptance should require:

```text
商业化能力仅在真实需求出现后才进入开发
当前只维护文档边界，不抢跑编码
```

## Chunk 4: Backlog presentation and execution order

### Task 7: Create the final ordered execution queue

**Files:**
- Create: `.claude/plans/2026-03-16-platform-priority-backlog.md`

- [ ] **Step 1: Order the backlog**

Final queue should be:

```text
1. Phase 3 - child creation UI
2. Phase 3 - English learning flow strengthening
3. Phase 2 - admin/product common foundation strengthening
4. Phase 1 - auth/common boundary hardening
5. Phase 4 - AI-platform candidate extraction
6. Phase 5 - deferred
```

- [ ] **Step 2: Attach verification guidance**

Each queued item should state:

```text
Which docs to update
Which code areas to touch
What acceptance proves the item is complete
```

- [ ] **Step 3: Commit**

```bash
git add .claude/plans/2026-03-16-platform-priority-backlog.md
git commit -m "docs: add platform priority backlog plan"
```
