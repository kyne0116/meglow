# Child Create UI Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a mini-app child creation flow so first-time acceptance no longer depends on Swagger.

**Architecture:** Keep the backend contract unchanged and implement the feature on the mini-app side. Add a new parent-side page for child creation, a pure validation/payload helper covered by tests, a frontend API call, a home entry point, and a post-create redirect into learning settings with child preselection.

**Tech Stack:** uni-app, Vue 3, TypeScript, Node built-in test runner, NestJS existing `/children` API

---

## Chunk 1: TDD for create-child form logic

### Task 1: Add a failing test for create-child validation and payload shaping

**Files:**
- Create: `frontend/src/pages/parent/children/create/form.test.ts`
- Create: `frontend/src/pages/parent/children/create/form.ts`

- [ ] **Step 1: Write the failing test**

Test these behaviors:

```text
valid payload passes validation
empty name fails
invalid grade fails
invalid birthDate fails
payload builder trims name and normalizes optional birthDate
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node --experimental-strip-types --test frontend/src/pages/parent/children/create/form.test.ts
```

Expected: FAIL because the helper module does not exist or does not export the required functions yet.

- [ ] **Step 3: Implement the minimal helper**

Implement:

```text
validateCreateChildForm
buildCreateChildPayload
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
node --experimental-strip-types --test frontend/src/pages/parent/children/create/form.test.ts
```

Expected: PASS

## Chunk 2: Wire the mini-app flow

### Task 2: Add frontend API support and the new page

**Files:**
- Modify: `frontend/src/services/api.ts`
- Modify: `frontend/src/pages.json`
- Create: `frontend/src/pages/parent/children/create/index.vue`

- [ ] **Step 1: Add create-child API types and request function**

Add:

```text
CreateChildRequest
postCreateChild
```

- [ ] **Step 2: Add the create-child page route**

Route:

```text
pages/parent/children/create/index
```

- [ ] **Step 3: Build the page UI**

Include:

```text
姓名
性别
年级
出生日期（可选）
提交按钮
```

- [ ] **Step 4: Submit and redirect**

On success:

```text
show success toast
redirect to /pages/parent/settings/learning/index?childId=<id>
```

## Chunk 3: Add navigation entry and child preselection

### Task 3: Add home entry and support preselecting the newly created child

**Files:**
- Modify: `frontend/src/pages/parent/home/index.vue`
- Modify: `frontend/src/pages/parent/settings/learning/index.vue`

- [ ] **Step 1: Add a child-create entry to the parent home page**

Expected: Parent can enter the create-child flow directly from the home page.

- [ ] **Step 2: Support `childId` query in learning settings**

Expected: When redirected after creation, the settings page loads and selects the new child instead of always defaulting to index 0.

- [ ] **Step 3: Run the helper test again**

Run:

```bash
node --experimental-strip-types --test frontend/src/pages/parent/children/create/form.test.ts
```

Expected: PASS

## Chunk 4: Verify and document

### Task 4: Verify the changed surface and sync docs

**Files:**
- Modify: `docs/05-阶段三：AI学伴首个业务化落地.md`

- [ ] **Step 1: Update the phase-3 doc**

Reflect:

```text
child creation now has a UI entry
first-time acceptance dependency on Swagger is reduced or removed
current implementation mapping changes
```

- [ ] **Step 2: Verify the diff**

Run:

```bash
git diff -- frontend/src/services/api.ts frontend/src/pages.json frontend/src/pages/parent/home/index.vue frontend/src/pages/parent/settings/learning/index.vue frontend/src/pages/parent/children/create/index.vue frontend/src/pages/parent/children/create/form.ts frontend/src/pages/parent/children/create/form.test.ts docs/05-阶段三：AI学伴首个业务化落地.md
```

Expected: Only the intended files are changed.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/services/api.ts frontend/src/pages.json frontend/src/pages/parent/home/index.vue frontend/src/pages/parent/settings/learning/index.vue frontend/src/pages/parent/children/create/index.vue frontend/src/pages/parent/children/create/form.ts frontend/src/pages/parent/children/create/form.test.ts docs/05-阶段三：AI学伴首个业务化落地.md .claude/plans/2026-03-16-child-create-ui-plan.md
git commit -m "feat: add child creation flow to mini-app"
```
