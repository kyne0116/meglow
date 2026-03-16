# Dashboard Version Trend Summary Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 7-day version trend summary to the admin dashboard without introducing new review workflow complexity.

**Architecture:** Extend the existing `/api/admin-overview` response with a compact trend summary computed from `ContentItemVersion.createdAt` and `publishedAt`. Render that summary in the current dashboard as a lightweight operations card, then align the phase-two documentation with the new capability.

**Tech Stack:** NestJS, Prisma, Vue 3, Element Plus, Node test runner, Jest e2e

---

## Chunk 1: Backend Contract

### Task 1: Add failing e2e coverage

**Files:**
- Modify: `backend/apps/api/test/app.e2e-spec.ts`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run the targeted e2e to verify it fails**
- [ ] **Step 3: Assert `versionTrendSummary` last-7 / previous-7 / delta values**

### Task 2: Implement backend summary

**Files:**
- Modify: `backend/apps/api/src/admin-overview/admin-overview.service.ts`

- [ ] **Step 1: Add date-window counting for created versions and published versions**
- [ ] **Step 2: Return `versionTrendSummary` from `getOverview()`**
- [ ] **Step 3: Re-run targeted e2e to verify it passes**

## Chunk 2: Frontend and Docs

### Task 3: Sync frontend contract and UI

**Files:**
- Modify: `admin-web/src/services/admin-overview-api.ts`
- Modify: `admin-web/src/pages/dashboard/DashboardPage.vue`

- [ ] **Step 1: Add frontend response typing for `versionTrendSummary`**
- [ ] **Step 2: Render a dashboard card showing last 7 days, previous 7 days, and delta**
- [ ] **Step 3: Run `pnpm build` in `admin-web`**

### Task 4: Align docs

**Files:**
- Modify: `docs/04-阶段二：产品共性底座.md`

- [ ] **Step 1: Update phase-two wording to mention trend summary**
- [ ] **Step 2: Keep wording aligned with draft-to-publish-only flow**

## Chunk 3: Verification

### Task 5: Final checks

**Files:**
- Review only

- [ ] **Step 1: Re-run targeted backend e2e**
- [ ] **Step 2: Re-run `pnpm build` in `admin-web`**
- [ ] **Step 3: Inspect `git status --short` for scope**
