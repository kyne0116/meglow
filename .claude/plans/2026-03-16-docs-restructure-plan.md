# Docs Restructure Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current topic-based `docs/` tree with seven platform-level master documents that let humans and AI understand platform goals, current implementation, gaps, and next actions.

**Architecture:** Rebuild the documentation system from the top down. First define the two parent documents that anchor platform vision and stage progression, then write five stage documents using one shared template, and finally remove the legacy docs tree so the new structure becomes the only active source of truth.

**Tech Stack:** Markdown, repository source code, existing docs as migration input, git

---

## Chunk 1: Build the new docs skeleton and source map

### Task 1: Capture the source material needed for the rewrite

**Files:**
- Modify: `docs/` legacy files as read-only input
- Create: `.claude/plans/2026-03-16-docs-restructure-plan.md`

- [ ] **Step 1: Review the existing docs tree and current implementation files that must be reflected in the new docs**

Run:

```powershell
Get-ChildItem docs -Recurse | Select-Object FullName
rg -n "pages/auth/login|admin-auth|admin-content|content-ops|learning|pushes|children|textbooks|subjects" frontend admin-web backend/apps/api
```

Expected: The command output identifies the current docs files and the code areas that must be mapped into stages 2 and 3.

- [ ] **Step 2: Confirm the target seven-file docs structure**

Files to create:

```text
docs/01-平台愿景蓝图.md
docs/02-平台总览里程碑实施方案.md
docs/03-阶段一：技术共性底座.md
docs/04-阶段二：产品共性底座.md
docs/05-阶段三：AI学伴首个业务化落地.md
docs/06-阶段四：AI平台化.md
docs/07-阶段五：商业化与规模化运营.md
```

Expected: The new structure matches the approved design exactly.

### Task 2: Define the shared writing contract for the seven documents

**Files:**
- Create: `docs/01-平台愿景蓝图.md`
- Create: `docs/02-平台总览里程碑实施方案.md`
- Create: `docs/03-阶段一：技术共性底座.md`
- Create: `docs/04-阶段二：产品共性底座.md`
- Create: `docs/05-阶段三：AI学伴首个业务化落地.md`
- Create: `docs/06-阶段四：AI平台化.md`
- Create: `docs/07-阶段五：商业化与规模化运营.md`

- [ ] **Step 1: Write a consistent status model into the docs**

Required status vocabulary:

```text
已实现
部分实现
已定义未实现
未开始
不纳入当前阶段
```

Required evidence vocabulary:

```text
依据：当前仓库代码
依据：现有历史文档
依据：平台目标定义
依据：阶段规划判断
```

- [ ] **Step 2: Use the same section contract across all stage docs**

Required stage doc sections:

```text
文档定位
阶段目标
本阶段要解决的核心问题
本阶段范围边界
本阶段关键能力建设
当前实现映射
目标形态 / 当前实现 / 下一步补齐
与前后阶段关系
当前主要缺口与风险
推荐后续动作
阶段完成标志
```

Expected: Every stage file shares the same interpretation model for readers and AI agents.

## Chunk 2: Write the two parent documents

### Task 3: Write `01-平台愿景蓝图.md`

**Files:**
- Create: `docs/01-平台愿景蓝图.md`
- Read: `docs/01-prd/ai-companion-prd-v1.0.md`
- Read: `docs/02-product-design/ai-companion-product-design-v1.0.md`
- Read: `docs/03-implementation/live-implementation-status.md`

- [ ] **Step 1: Draft the platform-level narrative**

Include:

```text
平台定位
平台愿景与使命
平台问题定义
目标用户与角色体系
平台产品版图
平台能力地图
五阶段演进总览
当前仓库在平台版图中的位置
目标形态 / 当前实现 / 下一步补齐
文档使用说明
```

- [ ] **Step 2: Explicitly position current code as partial realization of stages 2 and 3**

Expected: The document makes it clear that the repository is not the whole platform, and that current code spans product common foundation and the AI companion business landing.

### Task 4: Write `02-平台总览里程碑实施方案.md`

**Files:**
- Create: `docs/02-平台总览里程碑实施方案.md`
- Read: `docs/03-implementation/ai-companion-phase1-prd-implementation-plan-v1.0.md`
- Read: `docs/03-implementation/live-implementation-status.md`

- [ ] **Step 1: Draft the five-stage implementation blueprint**

Include:

```text
文档定位
平台建设原则
五阶段总览
各阶段定位与里程碑摘要
阶段递进关系
当前仓库映射
目标形态 / 当前实现 / 下一步补齐
文档体系映射
```

- [ ] **Step 2: Keep this document at stage level only**

Expected: It should define phase intent, order, and milestones without collapsing into task-level execution detail.

## Chunk 3: Write stages 1 to 3 from code reality

### Task 5: Write `03-阶段一：技术共性底座.md`

**Files:**
- Create: `docs/03-阶段一：技术共性底座.md`
- Read: `backend/apps/api/src/main.ts`
- Read: `backend/apps/api/src/app.module.ts`
- Read: `backend/apps/api/prisma/schema.prisma`
- Read: `backend/docker-compose.yml`

- [ ] **Step 1: Describe the intended technical foundation**

Include:

```text
服务入口
环境与部署基础
数据持久化基础
鉴权与基础安全框架
通用请求处理与异常处理
开发联调与基础验证能力
```

- [ ] **Step 2: Mark the current repo as partially covering this phase**

Expected: The doc clearly states that some foundational pieces exist, but the full platform-grade common foundation is not complete.

### Task 6: Write `04-阶段二：产品共性底座.md`

**Files:**
- Create: `docs/04-阶段二：产品共性底座.md`
- Read: `admin-web/src/router/index.ts`
- Read: `admin-web/src/pages/dashboard/DashboardPage.vue`
- Read: `admin-web/src/pages/textbooks/TextbooksPage.vue`
- Read: `admin-web/src/pages/knowledge-points/KnowledgePointsPage.vue`
- Read: `admin-web/src/pages/content-items/ContentItemsPage.vue`
- Read: `admin-web/src/pages/admin-users/AdminUsersPage.vue`
- Read: `admin-web/src/pages/audit-logs/AuditLogsPage.vue`
- Read: `backend/apps/api/src/admin-auth`
- Read: `backend/apps/api/src/admin-users`
- Read: `backend/apps/api/src/admin-overview`
- Read: `backend/apps/api/src/admin-audit`
- Read: `backend/apps/api/src/admin-content`
- Read: `backend/apps/api/src/content-ops`
- Read: `backend/apps/api/src/textbooks`
- Read: `backend/apps/api/src/subjects`

- [ ] **Step 1: Define stage 2 as platform product common foundation**

Include:

```text
内容后台
教材与内容资产中心
审核与运营流程
管理员体系
平台通用内容运营能力
```

- [ ] **Step 2: Tie current code directly to this phase**

Expected: The document makes clear that content admin, textbook domain, and audit/admin capabilities are stage-2 platform assets rather than AI-companion-only helpers.

### Task 7: Write `05-阶段三：AI学伴首个业务化落地.md`

**Files:**
- Create: `docs/05-阶段三：AI学伴首个业务化落地.md`
- Read: `frontend/src/pages/auth/login/index.vue`
- Read: `frontend/src/pages/parent/home/index.vue`
- Read: `frontend/src/pages/parent/approval/index.vue`
- Read: `frontend/src/pages/parent/settings/learning/index.vue`
- Read: `frontend/src/pages/child/home/index.vue`
- Read: `frontend/src/pages/child/session/index.vue`
- Read: `frontend/src/services/api.ts`
- Read: `backend/apps/api/src/auth`
- Read: `backend/apps/api/src/family`
- Read: `backend/apps/api/src/children`
- Read: `backend/apps/api/src/pushes`
- Read: `backend/apps/api/src/learning`
- Read: `backend/apps/api/src/content`
- Read: `docs/03-implementation/meglow-beginner-acceptance-guide-v1.0.md`

- [ ] **Step 1: Define AI companion as the first business landing**

Include:

```text
家长端
孩子端
审批与任务流
学习设置
英语学习会话
真实可验收闭环
```

- [ ] **Step 2: Mark missing product pieces explicitly**

Expected: The doc should state what is not yet available in UI or in the business journey, such as child creation in UI and broader subject expansion.

## Chunk 4: Write stages 4 and 5 as target-led docs

### Task 8: Write `06-阶段四：AI平台化.md`

**Files:**
- Create: `docs/06-阶段四：AI平台化.md`
- Read: `docs/02-product-design/ai-companion-product-design-v1.0.md`

- [ ] **Step 1: Define the target AI platformization layer**

Include:

```text
画像与记忆
推荐与策略
智能编排
AI工具能力治理
反馈闭环
平台级 AI 能力复用
```

- [ ] **Step 2: Keep current implementation status honest**

Expected: Most capabilities in this phase are marked as `已定义未实现` or `未开始` with evidence tied to current code reality.

### Task 9: Write `07-阶段五：商业化与规模化运营.md`

**Files:**
- Create: `docs/07-阶段五：商业化与规模化运营.md`
- Read: `docs/02-product-design/ai-companion-product-design-v1.0.md`

- [ ] **Step 1: Define the target scale and monetization phase**

Include:

```text
订阅与权益
商业化产品能力
增长与留存
运营与渠道
规模化交付与服务支撑
```

- [ ] **Step 2: Mark this phase as mostly future-facing**

Expected: The document should not pretend that current code has already entered commercialization at platform scale.

## Chunk 5: Replace the legacy docs tree and verify

### Task 10: Delete the legacy docs files after the new seven-file set is complete

**Files:**
- Delete: `docs/01-prd/ai-companion-prd-v1.0.md`
- Delete: `docs/01-prd/ai-companion-textbook-content-management-prd-v1.0.md`
- Delete: `docs/02-product-design/ai-companion-product-design-v1.0.md`
- Delete: `docs/03-implementation/ai-companion-content-admin-plan-v1.0.md`
- Delete: `docs/03-implementation/ai-companion-phase1-a-d1-task-breakdown-v1.0.md`
- Delete: `docs/03-implementation/ai-companion-phase1-prd-implementation-plan-v1.0.md`
- Delete: `docs/03-implementation/ai-companion-textbook-content-seed-guide-v1.0.md`
- Delete: `docs/03-implementation/live-implementation-status.md`
- Delete: `docs/03-implementation/meglow-beginner-acceptance-guide-v1.0.md`
- Delete: `docs/04-architecture/ai-companion-phase1-a-d1-prisma-schema-draft-v1.0.md`
- Delete: `docs/04-architecture/ai-companion-phase1-a-d1-technical-architecture-v1.0.md`
- Delete: `docs/04-architecture/ai-companion-textbook-content-data-model-draft-v1.0.md`
- Delete: `docs/04-architecture/ai-companion-textbook-content-prisma-schema-proposal-v1.0.md`
- Delete: `docs/05-api/ai-companion-phase1-a-d1-nestjs-api-list-v1.0.md`
- Delete: `docs/05-api/ai-companion-textbook-content-api-list-v1.0.md`

- [ ] **Step 1: Verify all seven new docs exist before deleting legacy docs**

Run:

```powershell
Get-ChildItem docs | Select-Object Name
```

Expected: The output lists the seven new markdown files.

- [ ] **Step 2: Remove the old topic-based docs tree**

Expected: `docs/` no longer contains the old subdirectories or old markdown files.

### Task 11: Verify structure and content expectations

**Files:**
- Test: `docs/*.md`

- [ ] **Step 1: Verify docs structure**

Run:

```powershell
Get-ChildItem docs -Force | Select-Object Name,Mode
```

Expected: Only seven markdown files remain in `docs/`.

- [ ] **Step 2: Verify required markers exist in the stage documents**

Run:

```powershell
rg -n "目标形态|当前实现|下一步补齐|推荐后续动作|依据：" docs/*.md
```

Expected: The stage documents and top-level docs contain the required execution-oriented sections and evidence markers.

- [ ] **Step 3: Review git diff to ensure only intended docs changes landed**

Run:

```powershell
git status --short
git diff -- docs .claude/plans/2026-03-16-docs-restructure-plan.md
```

Expected: The diff shows the new seven-file docs structure, legacy doc removal, and the implementation plan file.

- [ ] **Step 4: Commit**

```bash
git add docs .claude/plans/2026-03-16-docs-restructure-plan.md
git commit -m "docs: rebuild platform documentation structure"
```
