# Phase 0/1 寮€鍙戝惎鍔ㄨ繘搴︼紙2026-03-07锛?
> 鐘舵€佸悓姝ヨ鍒欙細鏈枃浠剁敤浜庨樁娈佃鏄庯紱瀹炴椂杩涘害涓庝唬鐮佺粨鏋勪互 `live-implementation-status.md` 涓哄噯銆?
## 宸插畬鎴?
1. monorepo 鍩虹缁撴瀯
- 鏍圭洰褰?`package.json`銆乣turbo.json`銆乣tsconfig.base.json`
- `apps/backend`銆乣wechat-miniapp`銆乣shared` 鐩綍楠ㄦ灦

2. 鍩虹璁炬柦涓庣幆澧?- `.env.example`
- `docker-compose.yml`锛坧ostgres/redis/api锛?- `apps/backend/Dockerfile`

3. API 宸插疄鐜帮紙鍙仈璋冩渶灏忛棴鐜級
- `GET /api/health`
- `POST /api/auth/login`锛堝紑鍙戦獙璇佺爜 `123456`锛?- `GET /api/family/me`
- `POST /api/family/invite`
- `POST /api/children`
- `GET /api/children`
- `GET /api/children/:childId/profile`
- `POST /api/pushes`
- `GET /api/pushes/pending`
- `POST /api/pushes/:pushId/approve`
- `POST /api/pushes/:pushId/deliver`
- `POST /api/pushes/:pushId/complete`
- `GET /api/pushes/history/:childId`
- `GET /api/pushes/tasks/:childId`
- `POST /api/pushes/scheduler/run`
- `POST /api/pushes/delivery/run`
- `POST /api/pushes/postponed/requeue/run`
- `POST /api/pushes/expiration/run`
- `POST /api/english/word-learning/session/start`
- `POST /api/english/word-learning/session/:sessionId/answer`
- `POST /api/english/word-learning/session/:sessionId/end`
- `GET /api/english/word-learning/progress/:childId`
- `POST /api/english/pronunciation/session/start`
- `POST /api/english/pronunciation/session/:sessionId/submit`
- `POST /api/english/pronunciation/session/:sessionId/end`
- `GET /api/english/pronunciation/progress/:childId`
- `POST /api/english/sentence/session/start`
- `POST /api/english/sentence/session/:sessionId/submit`
- `POST /api/english/sentence/session/:sessionId/end`
- `GET /api/english/sentence/progress/:childId`
- `POST /api/english/reading/session/start`
- `POST /api/english/reading/session/:sessionId/submit`
- `POST /api/english/reading/session/:sessionId/end`
- `GET /api/english/reading/progress/:childId`
- `POST /api/english/dialogue/session/start`
- `POST /api/english/dialogue/session/:sessionId/submit`
- `POST /api/english/dialogue/session/:sessionId/end`
- `GET /api/english/dialogue/progress/:childId`
- `GET /api/briefings/:childId`
- `GET /api/gamification/:childId`
- `GET /api/notifications/me`
- `GET /api/ai/evals/scenarios/cases`
- `POST /api/ai/evals/scenarios/run`

4. 鏁版嵁妯″瀷棣栫増
- Prisma Schema锛欶amily銆丳arent銆丆hild銆丆hildProfile銆乄ord銆乄ordProgress銆丩earningPush銆丩earningPushApproval銆丩earningSession銆丩earningBriefing銆丟ameProfile銆丳ointLog銆丯otificationLog
- seed 鍗犱綅鑴氭湰

5. 鏂板杩愯鑳藉姏
- Push 鑷姩璋冨害鍣紙Cron 姣忓皬鏃惰Е鍙戯級
- Push 鐢熷懡鍛ㄦ湡璋冨害鍣紙鑷姩鎶曢€?寤跺悗閲嶅叆/鑷姩杩囨湡锛?- 4 涓嫳璇満鏅彁浜ゆ帴鍙ｆ敮鎸佺粨鏋勫寲 AI 鍙嶉锛坰core/feedback/correction/nextAction锛?- 鏂板 E2E 閾捐矾鐢ㄤ緥锛歚apps/backend/test/approval-learning-flow.e2e-spec.ts`
- 鏂板 E2E 鐢熷懡鍛ㄦ湡鐢ㄤ緥锛歚apps/backend/test/push-lifecycle.e2e-spec.ts`
- 鍙戦煶鍦烘櫙鎺ュ叆鍙厤缃闊宠瘎娴嬩緵搴斿晢锛坢ock/xunfei endpoint锛?- 鍏ㄥ眬璇锋眰ID銆侀敊璇爜缁撴瀯銆佽姹傛棩蹇楁嫤鎴櫒宸叉帴鍏?
5. 灏忕▼搴忛鏋?- 瀹堕暱绔椤点€佸瀛愮棣栭〉
- session store銆乤pi 瀹㈡埛绔崰浣?
## 鏈畬鎴愶紙涓嬩竴姝ワ級

1. 灏嗗満鏅鏋跺鎺ョ湡瀹?AI 鑳藉姏锛圥rompt/宸ュ叿璋冪敤/璇勬祴锛?2. 鎺ュ叆璇煶璇勬祴渚涘簲鍟嗕笌濯掍綋瀛樺偍
3. 鎺ュ叆 AI 缂栨帓灞傦紙Mastra/LangGraph 鍏朵竴锛変笌璇勬祴閾捐矾
4. 澧炲姞缁熶竴閿欒鐮併€佹棩蹇楁嫤鎴€佹帴鍙ｅ绾︽祴璇?
## Incremental Update (2026-03-07, Settings/Scheduler)

Completed in this round:

1. Child learning settings data model and API
- Added `ChildLearningSettings` model in Prisma schema and relation on `Child`.
- Added endpoints:
  - `GET /api/children/:childId/settings`
  - `PUT /api/children/:childId/settings`
- Added validation DTO for:
  - `autoApprove`
  - `weekdayTimeWindows`
  - `weekendTimeWindows`
  - `dailyDurationMin`
  - `wordsPerSession`

2. Push scheduler now respects child settings
- Reads ENGLISH settings per child before generating review pushes.
- Skips generation outside configured weekday/weekend windows.
- Uses `wordsPerSession` as scheduler `take` limit.
- Uses `APPROVED` directly when `autoApprove=true`.
- Keeps family pending notification only for manual-approval mode.
- Prevents re-generation when active push already exists (`PENDING/APPROVED/MODIFIED/POSTPONED/DELIVERED`).

3. Test coverage extension
- Added `apps/backend/test/child-settings-scheduler.e2e-spec.ts` to cover:
  - auto-approve generation
  - words-per-session limit
  - window-based skip behavior

4. API docs update
- Rewrote `apps/backend/README.md` with current APIs and scheduler/settings behavior.

## Incremental Update (2026-03-07, Miniapp Settings Integration)

Completed in this round:

1. Miniapp page and route
- Added page: `apps/wechat-miniapp/src/pages/parent/settings/learning/index.vue`
- Added route: `pages/parent/settings/learning/index`
- Added entry button from parent home page to learning settings page.

2. Miniapp API client integration
- Extended `apps/wechat-miniapp/src/services/api.ts`:
  - `getChildren`
  - `getChildSettings`
  - `putChildSettings`
- Added shared request wrapper with auth header handling.

3. Miniapp page-level interaction
- Supports selecting child from family child list.
- Supports editing and saving:
  - `autoApprove`
  - `wordsPerSession`
  - `dailyDurationMin`
  - weekday/weekend single time window
- Added input validation and save feedback.

4. Shared types and docs
- Added `packages/shared/src/types/settings.ts` and export in shared index.
- Updated `apps/wechat-miniapp/README.md` and fixed invalid home page templates.

## Incremental Update (2026-03-07, Miniapp Login + Approval Center)

Completed in this round:

1. Login and session persistence
- Added login page: `pages/auth/login/index`.
- Added session persistence in store (`loadFromStorage`, `setSession`, `clearSession`).
- Parent home and settings pages now enforce login state and redirect when missing token.

2. Parent approval center
- Added page: `pages/parent/approval/index`.
- Added pending push list API integration.
- Added push actions in miniapp:
  - approve
  - reject
  - postpone (1 hour)

3. Navigation and routes
- Updated `pages.json` and set login page as the first route.
- Parent home now includes entry buttons to:
  - pending push center
  - learning settings
  - logout

4. API client extension
- Extended miniapp `services/api.ts` with:
  - `getPendingPushes`
  - `postApprovePush`
  - plus consolidated request wrapper and typed payloads.

5. Miniapp docs update
- Updated `apps/wechat-miniapp/README.md` with current pages and API coverage.

## Incremental Update (2026-03-07, Approval-to-Execution Miniapp Loop)

Completed in this round:

1. Parent approval center enhancement
- Added `MODIFY` action in miniapp approval center.
- Existing actions now cover: approve/reject/modify/postpone.

2. Child task board
- Implemented child task list page using backend tasks API.
- Supports child selection and optional date filter.
- Added task completion action for `DELIVERED` tasks.

3. API client extension
- Added miniapp API methods:
  - `getChildTasks`
  - `postCompletePush`
- Added child task types for miniapp rendering.

4. Parent home navigation
- Added direct navigation entry to child task board for verification.

5. Miniapp docs refresh
- Updated `apps/wechat-miniapp/README.md` with pages and APIs.

## Incremental Update (2026-03-07, Approval Modify Form + Delivery Link)

Completed in this round:

1. Parent modify form
- Upgraded approval center `MODIFY` from fixed payload to editable form.
- Added adjustable fields for mode/comment/optional words limit.
- Form payload is submitted as `modifiedContent` to backend approve API.

2. Child task board delivery step
- Added `Mark Delivered` action for `APPROVED`/`MODIFIED` tasks.
- Existing `Mark Completed` action remains for `DELIVERED` tasks.

3. Miniapp API extension
- Added `postDeliverPush` API method.

4. Docs refresh
- Updated miniapp README API list with deliver endpoint.

## Incremental Update (2026-03-07, Modify JSON Preview + Task Filters)

Completed in this round:

1. Parent modify UX upgrade
- Added extra JSON input for modify action (must be object JSON).
- Added real-time modified-content preview.
- Added client-side JSON validation and submit blocking when invalid.

2. Child task board filters
- Added status filter: ALL/APPROVED/MODIFIED/DELIVERED.
- Added quick date actions: today and clear date.
- Added total/filtered task counters.

3. Scope continuity
- Existing deliver and complete actions remain available and unchanged.

## Incremental Update (2026-03-07, Vite Recheck + Batch Task Ops)

Completed in this round:

1. Vite environment recheck
- Verified global `vite` command exists.
- Verified local workspace `apps/wechat-miniapp` still has no resolvable `vite` module.
- Installation attempts were blocked by dependency/runtime issues (`peer conflict`, `esbuild spawn EFTYPE`).

2. Child task board productivity upgrade
- Added filter persistence per child (date + status saved in local storage).
- Added batch actions for currently filtered tasks:
  - deliver filtered tasks
  - complete filtered tasks
- Added richer counters (total/filtered/deliverable/completable).

3. Parent modify continuity
- Kept editable modify JSON preview flow unchanged and compatible.

## Incremental Update (2026-03-07, Original-Content Modify Editing)

Completed in this round:

1. Pending API payload enhancement
- Extended `GET /api/pushes/pending` response to include `content` field.
- Enables parent-side edit workflow based on real push payload.

2. Parent modify editor upgrade
- `startModify` now loads the selected push's original `content` JSON.
- Added editable `Modified Content JSON` textarea.
- Added `Reset Content` action to restore from original.
- Submit now sends modified JSON (with parent meta) as `modifiedContent`.

3. Docs update
- Updated API README to indicate pending list includes content.
- Updated miniapp README wording for original-content modify editor.

## Incremental Update (2026-03-07, Pending Content Contract Test)

Completed in this round:

1. E2E contract coverage
- Extended `push-lifecycle.e2e-spec.ts` to assert `GET /api/pushes/pending` returns `content`.
- Added assertion on expected payload marker (`content.mode = word_review`) for pending row.

2. Contract stability purpose
- Protects the parent-side original-content modify editor from API regression.

## Incremental Update (2026-03-07, Structured Fields <-> JSON Editor)

Completed in this round:

1. Parent modify editor upgrade
- Added structured fields section in approval modify panel:
  - mode
  - dueWords
  - words CSV
  - coachHint
  - priority
- Added two-way operations:
  - Apply Fields To JSON
  - Load Fields From JSON

2. Original-content workflow enhancement
- `startModify` now hydrates structured fields from selected push content.
- `Reset Content` also rehydrates structured fields from original JSON.

3. Payload consistency
- `buildModifyContent` keeps parent meta and carries structured hint/priority values.
- Submit path still validates JSON object before sending `modifiedContent`.

4. Docs refresh
- Updated miniapp README wording for structured-fields/JSON linked editing.


