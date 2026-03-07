# 瀹炴柦鐘舵€佺湅鏉匡紙瀹炴椂鍚屾锛?
> 鑷姩鍖虹敱 `npm run status:sync` 缁存姢銆傛瘡娆′唬鐮佸疄鏂藉悗绔嬪嵆鎵ц涓€娆″悓姝ャ€?
- Last Synced: 2026-03-07T16:18:38.352Z

## 鑷姩缁熻
<!-- AUTO:START -->
- Backend modules: 13
- Controllers: 15
- API endpoints: 44
- Prisma models: 15
- E2E files: 6
- Workspace note: use `git status --short` in shell for git details

### Module List
- ai
- app
- auth
- briefing
- child
- english
- family
- gamification
- health
- notification
- prisma
- push
- speech

### Prisma Models
- Family
- Parent
- Child
- ChildLearningSettings
- ChildProfile
- LearningPush
- ParentApprovalWorkflowRun
- LearningPushApproval
- LearningSession
- Word
- WordProgress
- LearningBriefing
- GameProfile
- PointLog
- NotificationLog

### API Endpoints
| Method | Path | Source |
|---|---|---|
| GET | /api/ai/evals/scenarios/cases | apps/backend/src/ai/evals/ai-eval.controller.ts |
| POST | /api/ai/evals/scenarios/run | apps/backend/src/ai/evals/ai-eval.controller.ts |
| POST | /api/ai/workflows/approval/auto-start/run | apps/backend/src/ai/workflows/parent-approval-workflow.controller.ts |
| POST | /api/ai/workflows/approval/resume/:runId | apps/backend/src/ai/workflows/parent-approval-workflow.controller.ts |
| POST | /api/ai/workflows/approval/start/:pushId | apps/backend/src/ai/workflows/parent-approval-workflow.controller.ts |
| POST | /api/auth/login | apps/backend/src/auth/auth.controller.ts |
| GET | /api/briefings/:childId | apps/backend/src/briefing/briefing.controller.ts |
| GET | /api/children/:childId/profile | apps/backend/src/child/child.controller.ts |
| GET | /api/children/:childId/settings | apps/backend/src/child/child.controller.ts |
| PUT | /api/children/:childId/settings | apps/backend/src/child/child.controller.ts |
| GET | /api/english/dialogue/progress/:childId | apps/backend/src/english/dialogue.controller.ts |
| POST | /api/english/dialogue/session/:sessionId/end | apps/backend/src/english/dialogue.controller.ts |
| POST | /api/english/dialogue/session/:sessionId/submit | apps/backend/src/english/dialogue.controller.ts |
| POST | /api/english/dialogue/session/start | apps/backend/src/english/dialogue.controller.ts |
| GET | /api/english/pronunciation/progress/:childId | apps/backend/src/english/pronunciation.controller.ts |
| POST | /api/english/pronunciation/session/:sessionId/end | apps/backend/src/english/pronunciation.controller.ts |
| POST | /api/english/pronunciation/session/:sessionId/submit | apps/backend/src/english/pronunciation.controller.ts |
| POST | /api/english/pronunciation/session/start | apps/backend/src/english/pronunciation.controller.ts |
| GET | /api/english/reading/progress/:childId | apps/backend/src/english/reading.controller.ts |
| POST | /api/english/reading/session/:sessionId/end | apps/backend/src/english/reading.controller.ts |
| POST | /api/english/reading/session/:sessionId/submit | apps/backend/src/english/reading.controller.ts |
| POST | /api/english/reading/session/start | apps/backend/src/english/reading.controller.ts |
| GET | /api/english/sentence/progress/:childId | apps/backend/src/english/sentence.controller.ts |
| POST | /api/english/sentence/session/:sessionId/end | apps/backend/src/english/sentence.controller.ts |
| POST | /api/english/sentence/session/:sessionId/submit | apps/backend/src/english/sentence.controller.ts |
| POST | /api/english/sentence/session/start | apps/backend/src/english/sentence.controller.ts |
| GET | /api/english/word-learning/progress/:childId | apps/backend/src/english/word-learning.controller.ts |
| POST | /api/english/word-learning/session/:sessionId/answer | apps/backend/src/english/word-learning.controller.ts |
| POST | /api/english/word-learning/session/:sessionId/end | apps/backend/src/english/word-learning.controller.ts |
| POST | /api/english/word-learning/session/start | apps/backend/src/english/word-learning.controller.ts |
| POST | /api/family/invite | apps/backend/src/family/family.controller.ts |
| GET | /api/family/me | apps/backend/src/family/family.controller.ts |
| GET | /api/gamification/:childId | apps/backend/src/gamification/gamification.controller.ts |
| GET | /api/notifications/me | apps/backend/src/notification/notification.controller.ts |
| POST | /api/pushes/:pushId/approve | apps/backend/src/push/push.controller.ts |
| POST | /api/pushes/:pushId/complete | apps/backend/src/push/push.controller.ts |
| POST | /api/pushes/:pushId/deliver | apps/backend/src/push/push.controller.ts |
| POST | /api/pushes/delivery/run | apps/backend/src/push/push.controller.ts |
| POST | /api/pushes/expiration/run | apps/backend/src/push/push.controller.ts |
| GET | /api/pushes/history/:childId | apps/backend/src/push/push.controller.ts |
| GET | /api/pushes/pending | apps/backend/src/push/push.controller.ts |
| POST | /api/pushes/postponed/requeue/run | apps/backend/src/push/push.controller.ts |
| POST | /api/pushes/scheduler/run | apps/backend/src/push/push.controller.ts |
| GET | /api/pushes/tasks/:childId | apps/backend/src/push/push.controller.ts |
<!-- AUTO:END -->

## 浜哄伐缁存姢鍖?### 褰撳墠鐩爣
- [ ] 淇濇寔鏂囨。涓庝唬鐮佺姸鎬佸悓姝?
### 闃诲椤?- 鏃?
### 涓嬩竴姝?1. 鎸夌収瀹炴柦璁″垝缁х画鎺ㄨ繘骞跺悓姝ョ姸鎬?## Manual Update (2026-03-07  Settings/Scheduler Round)

- [x] Implemented child settings API (`GET/PUT /api/children/:childId/settings`).
- [x] Integrated scheduler with settings (`autoApprove`, time windows, words-per-session).
- [x] Added e2e case for settings-driven scheduler behavior.
- [x] Updated API README with new endpoints and behavior.
- [ ] Execute e2e suite in a ready environment (blocked in current sandbox/runtime).

## Manual Update (2026-03-07  Miniapp Settings Integration Round)

- [x] Added parent learning settings page in miniapp.
- [x] Connected miniapp to backend child/settings APIs.
- [x] Added child picker + settings save interaction.
- [x] Fixed invalid miniapp page templates and refreshed page routes.
- [ ] Run miniapp dev build in local environment with dependencies installed.

## Manual Update (2026-03-07  Miniapp Login + Approval Round)

- [x] Added login page and persisted session store.
- [x] Added parent pending push center page with approve/reject/postpone actions.
- [x] Added parent home navigation and logout.
- [x] Added miniapp API calls for pending list and approval actions.
- [ ] Run miniapp build/dev after workspace dependencies are fully installed.

## Manual Update (2026-03-07  Approval-to-Execution Loop Round)

- [x] Added modify action in parent approval center.
- [x] Added child task board page with date-filtered task list.
- [x] Added complete-task action for delivered tasks.
- [x] Extended miniapp API client for task list and completion APIs.
- [ ] Run miniapp build/dev after dependencies are installed in workspace.

## Manual Update (2026-03-07  Modify Form + Delivery Link Round)

- [x] Added editable modify panel in parent approval center.
- [x] Added mark-delivered action in child task board.
- [x] Added deliver API wrapper in miniapp services.
- [x] Updated miniapp README endpoint coverage.
- [ ] Run miniapp build/dev when dependencies are available.

## Manual Update (2026-03-07  Modify JSON Preview + Task Filters Round)

- [x] Added editable extra JSON + preview for modify action.
- [x] Added JSON object validation for modify submit.
- [x] Added child task status/date quick filters and counters.
- [x] Kept deliver/complete actions compatible with existing task flow.
- [ ] Run miniapp build/dev when dependencies are available.

## Manual Update (2026-03-07  Build Verification Note)

- [ ] Miniapp build verification blocked in current environment: local workspace dependency `vite` module is missing for `apps/wechat-miniapp`.

## Manual Update (2026-03-07  Vite Recheck + Batch Ops Round)

- [x] Rechecked vite global/local status and captured blocking errors.
- [x] Added per-child filter persistence in child task board.
- [x] Added batch deliver/complete actions for filtered task list.
- [x] Updated miniapp README to reflect new child task board capabilities.
- [ ] Resolve local dependency/runtime blockers (`vite` local module and esbuild executable issue).

## Manual Update (2026-03-07  Original-Content Modify Editor Round)

- [x] Added `content` field in pending push API response.
- [x] Switched modify flow to edit original content JSON directly.
- [x] Added reset-to-original action and payload preview.
- [x] Updated API/miniapp README descriptions.
- [ ] Build verification still blocked by local dependency/runtime issues.

## Manual Update (2026-03-07  Pending Content Contract Test Round)

- [x] Added e2e assertion for pending push `content` field.
- [x] Added e2e assertion for pending payload mode marker.
- [ ] Execute e2e in an environment with ready dependencies/runtime.

## Manual Update (2026-03-07  Structured Fields JSON Editor Round)

- [x] Added structured field editors in parent modify panel.
- [x] Added field->JSON apply and JSON->field load actions.
- [x] Added structured field hydration/reset from original content.
- [x] Updated miniapp README to reflect editor capability.
- [ ] Build verification still blocked by local vite/esbuild dependency chain.

## Manual Update (2026-03-07  Vite Recheck Follow-up)

- [x] Confirmed global vite command exists.
- [x] Confirmed workspace-local vite module is still missing.
- [x] Confirmed miniapp build still fails on `Cannot find module 'vite'`.
- [ ] Resolve dependency installation/runtime blockers before next build check.



## Manual Update (2026-03-07  Engineering Standardization Round)

- [x] Added commit message convention gate via `.husky/commit-msg` + `tools/validate-commit-message.mjs`.
- [x] Expanded backend quality gate to include backend/shared format checks.
- [x] Added `tools/*.mjs` lint gate and integrated it into precommit + backend quality gate.
- [x] Added local default env wrappers for backend db push / e2e scripts.
- [x] Split backend CI quality gate into explicit steps for better failure visibility.
- [x] Added scheduled dependency audit workflow (`.github/workflows/dependency-audit.yml`).
- [ ] Verify dependency audit results on GitHub Actions run.
