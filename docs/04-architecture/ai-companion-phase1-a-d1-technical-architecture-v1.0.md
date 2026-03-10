# AI智慧学伴 Phase 1 A-D1 技术架构设计

**版本**: v1.0  
**日期**: 2026-03-10  
**适用阶段**: 阶段 A - 阶段 D1  
**对应文档**:  
- `docs/03-implementation/ai-companion-phase1-prd-implementation-plan-v1.0.md`
- `docs/01-prd/ai-companion-prd-v1.0.md`
- `docs/02-product-design/ai-companion-product-design-v1.0.md`

---

## 1. 文档目标

本文档定义 Phase 1 在阶段 A-D1 的技术架构边界，用于支撑以下能力落地：

- 家长登录与家庭初始化
- 孩子建档与学习设置
- 推送建议生成、家长审批、任务下发
- 孩子端英语最小学习闭环
  - 单词学习
  - 单词复习
  - 基础发音跟读

本文档只覆盖 A-D1，不覆盖：

- 完整五大英语场景中的阅读、造句、主题对话
- 完整 AI 全人化画像分析
- 游戏化 v1 全量能力
- 月报、成长时间线、社交功能

---

## 2. 架构目标

### 2.1 业务目标

- 用最少模块打通“系统推荐 -> 家长审批 -> 孩子学习 -> 结果沉淀”的闭环
- 为后续 E/F/D2 阶段保留扩展点，但不提前引入复杂平台化设计

### 2.2 工程目标

- 前后端可独立开发、稳定联调
- 数据模型边界清晰，不把推送、任务、学习会话混在一起
- 支持后续替换规则引擎为 AI 规划引擎
- 支持后续接入更多英语场景，而不推翻当前会话模型

---

## 3. 总体架构

## 3.1 系统组成

阶段 A-D1 采用单体 API + 单前端小程序架构：

```text
uni-app Frontend
  |
  | HTTPS JSON API
  v
NestJS API
  |
  +-- Auth Module
  +-- Family Module
  +-- Children Module
  +-- Push Module
  +-- Learning Module
  +-- Content Module
  +-- Speech Adapter
  |
  v
PostgreSQL + Prisma
```

### 3.2 关键设计选择

- 后端采用模块化单体，不拆微服务
- 统一由 `backend/apps/api` 提供业务 API
- 数据库存储业务主数据和学习进度
- 外部语音评测服务通过适配器接口接入
- 推送建议在 A-C 阶段采用规则引擎，不依赖 LLM

---

## 4. 仓库目标结构

## 4.1 前端目录建议

```text
frontend/src
  app/
    guards/
    config/
  pages/
    auth/
    onboarding/
    parent/
    child/
  components/
    child-selector/
    task-card/
    setting-form/
    learning/
  services/
    http/
    api/
  stores/
    session.ts
    child.ts
  types/
  utils/
```

### 4.2 后端目录建议

```text
backend/apps/api/src
  common/
    dto/
    filters/
    guards/
    interceptors/
  auth/
  family/
  children/
  pushes/
  learning/
  content/
  speech/
  health/
  prisma/
```

说明：

- `content` 负责英语词库和静态学习素材
- `pushes` 负责建议、审批、任务流转
- `learning` 负责学习会话与词汇进度
- `speech` 负责第三方语音评测适配

---

## 5. 领域划分

## 5.1 核心领域对象

### 身份与家庭域

- `Parent`
- `Family`
- `FamilyMembership`
- `VerificationCode`

### 孩子与画像域

- `Child`
- `ChildProfile`
- `ChildGameProfile`
- `ChildLearningSettings`

### 推送与任务域

- `LearningPush`
- `LearningPushActionLog`
- `LearningTask`

### 英语学习域

- `EnglishWord`
- `EnglishWordSet`
- `ChildWordProgress`
- `LearningSession`
- `LearningSessionItem`
- `PronunciationAttempt`

---

## 6. 核心业务流

## 6.1 登录与初始化流

```text
家长输入手机号
  -> 请求发送验证码
  -> 验证码校验通过
  -> 查询 Parent 是否存在
    -> 不存在: 创建 Parent + Family + FamilyMembership(owner)
    -> 存在: 读取已有 Family
  -> 生成 JWT
  -> 返回 accessToken + parentId + familyId
```

### 技术要求

- 验证码有效期 60 秒
- 同手机号发送频率限制
- JWT 有效期 7 天
- 登录返回当前家庭上下文

## 6.2 孩子建档流

```text
家长提交孩子资料
  -> 服务端校验家庭归属
  -> 根据年级映射 K12 阶段
  -> 创建 Child
  -> 创建 ChildProfile
  -> 创建 ChildGameProfile
  -> 返回 ChildSummary
```

### 技术要求

- 一个家庭最多 5 个孩子
- 年级范围 1-9
- 画像与游戏化档案自动初始化

## 6.3 学习设置流

```text
家长选择孩子
  -> 读取 ChildLearningSettings
  -> 修改时间窗口 / 每日时长 / 每次词量 / 是否自动审批
  -> 保存设置
  -> 后续推送引擎读取该设置
```

## 6.4 推送与审批流

```text
规则引擎扫描孩子设置与词汇状态
  -> 生成 LearningPush(PENDING_APPROVAL)
  -> 家长查看待审批
  -> 审批动作:
      APPROVE / MODIFY / REJECT / POSTPONE
  -> 通过或修改后生成 LearningTask
  -> 孩子端拉取任务
  -> 任务状态改为 DELIVERED
```

### 规则引擎输入

- 孩子时间窗口
- 每次学习词量上限
- 当天学习时长上限
- 当前待复习单词数
- 当前可下发的新单词数

### 规则引擎输出

- 任务摘要
- 推送理由
- 预期效果
- 任务内容 payload

## 6.5 英语最小学习闭环

```text
孩子打开任务
  -> 创建 LearningSession
  -> 下发若干 session items
  -> 孩子逐题回答
    -> 单词选义 / 拼写 / 基础跟读
  -> 服务端实时判分
  -> 更新 ChildWordProgress
  -> 完成会话
  -> 写回任务结果
```

---

## 7. 模块设计

## 7.1 Auth 模块

### 职责

- 验证码发送
- 登录鉴权
- JWT 解析
- 当前用户上下文注入

### 输入输出

- 输入：手机号、验证码
- 输出：访问令牌、家长身份、家庭上下文

### 非职责

- 不负责孩子、家庭业务逻辑

## 7.2 Family 模块

### 职责

- 家庭初始化
- 第二位家长邀请
- 家庭成员归属校验

### 关键规则

- 每个家庭最多两位家长
- 被邀请家长接受后加入同一家庭

## 7.3 Children 模块

### 职责

- 孩子创建、查询
- K12 阶段映射
- 学习设置读写
- 画像初始化

### 关键规则

- 创建孩子时同步初始化 `ChildProfile` 和 `ChildGameProfile`
- 所有子资源访问都需校验家庭归属

## 7.4 Pushes 模块

### 职责

- 推送建议生成
- 待审批列表查询
- 审批动作处理
- 学习任务派发
- 任务状态流转

### 状态机

`PENDING_APPROVAL -> APPROVED/MODIFIED/REJECTED/POSTPONED`

`APPROVED/MODIFIED -> DELIVERED -> COMPLETED`

### 设计说明

- `LearningPush` 表示待审批建议
- `LearningTask` 表示对孩子端可见的可执行任务
- 二者分离，避免审批中对象与执行中对象混淆

## 7.5 Content 模块

### 职责

- 维护英语词库
- 输出单词学习内容
- 输出基础例句、音标、释义

### 本阶段最小范围

- 只支持英语单词内容
- 不做 CMS 后台
- 词库可先采用静态导入 + 数据库存储

## 7.6 Learning 模块

### 职责

- 创建学习会话
- 组织题目顺序
- 提交回答并判分
- 更新词汇进度
- 结束会话

### 子能力

- 单词选义
- 拼写题
- 基础发音跟读
- 艾宾浩斯复习节点推进

## 7.7 Speech 模块

### 职责

- 封装第三方语音评测服务
- 统一返回内部评分结构

### 适配器接口

```ts
interface SpeechEvaluationProvider {
  evaluatePronunciation(input: {
    childId: string;
    word: string;
    audioUrl: string;
  }): Promise<{
    score: number;
    feedback: string;
    phonemeIssues?: string[];
  }>;
}
```

说明：

- 第三方 SDK 与供应商字段不直接暴露到业务层
- 方便后续更换服务商

---

## 8. 数据库设计主干

## 8.1 核心实体关系

```text
Family
  └─< FamilyMembership >─ Parent

Family
  └─< Child
        ├─ ChildProfile
        ├─ ChildGameProfile
        ├─ ChildLearningSettings
        ├─ ChildWordProgress
        ├─ LearningPush
        ├─ LearningTask
        └─ LearningSession
```

## 8.2 建议枚举

- `ParentRole`
  - `OWNER`
  - `MEMBER`
- `Gender`
  - `MALE`
  - `FEMALE`
- `K12Stage`
  - `LOWER_PRIMARY`
  - `MIDDLE_PRIMARY`
  - `UPPER_PRIMARY`
  - `JUNIOR_HIGH`
- `PushStatus`
  - `PENDING_APPROVAL`
  - `APPROVED`
  - `MODIFIED`
  - `REJECTED`
  - `POSTPONED`
- `TaskStatus`
  - `APPROVED`
  - `MODIFIED`
  - `DELIVERED`
  - `COMPLETED`
- `SessionStatus`
  - `IN_PROGRESS`
  - `COMPLETED`
  - `ABANDONED`
- `LearningItemType`
  - `WORD_MEANING`
  - `WORD_SPELLING`
  - `WORD_PRONUNCIATION`

## 8.3 表结构建议

### Parent

- `id`
- `phone`
- `nickname`
- `avatarUrl`
- `createdAt`
- `updatedAt`

### Family

- `id`
- `createdAt`
- `updatedAt`

### FamilyMembership

- `id`
- `familyId`
- `parentId`
- `role`
- `invitedByParentId`
- `createdAt`

### Child

- `id`
- `familyId`
- `name`
- `gender`
- `birthDate`
- `grade`
- `k12Stage`
- `avatarUrl`
- `createdAt`
- `updatedAt`

### ChildProfile

- `id`
- `childId`
- `learningMemoryJson`
- `cognitiveMemoryJson`
- `personalityMemoryJson`
- `teachingStrategyJson`
- `updatedAt`

### ChildGameProfile

- `id`
- `childId`
- `totalPoints`
- `currentLevel`
- `streakDays`
- `createdAt`
- `updatedAt`

### ChildLearningSettings

- `id`
- `childId`
- `subject`
- `autoApprove`
- `weekdayTimeWindowsJson`
- `weekendTimeWindowsJson`
- `dailyDurationMin`
- `wordsPerSession`
- `updatedAt`

### EnglishWord

- `id`
- `value`
- `phonetic`
- `meaningZh`
- `exampleSentence`
- `imageHint`
- `difficultyLevel`
- `k12Stage`

### ChildWordProgress

- `id`
- `childId`
- `wordId`
- `masteryLevel`
- `correctStreak`
- `lastReviewedAt`
- `nextReviewAt`
- `reviewStage`
- `totalAttempts`
- `correctAttempts`

### LearningPush

- `id`
- `childId`
- `summary`
- `reason`
- `expectedOutcome`
- `status`
- `scheduledAt`
- `contentJson`
- `createdBy`
- `createdAt`
- `updatedAt`

### LearningPushActionLog

- `id`
- `pushId`
- `action`
- `operatorParentId`
- `comment`
- `payloadJson`
- `createdAt`

### LearningTask

- `id`
- `pushId`
- `childId`
- `summary`
- `status`
- `scheduledAt`
- `contentJson`
- `deliveredAt`
- `completedAt`

### LearningSession

- `id`
- `taskId`
- `childId`
- `subject`
- `status`
- `startedAt`
- `finishedAt`
- `summaryJson`

### LearningSessionItem

- `id`
- `sessionId`
- `wordId`
- `itemType`
- `promptJson`
- `correctAnswerJson`
- `childAnswerJson`
- `resultJson`
- `sequence`

### PronunciationAttempt

- `id`
- `sessionItemId`
- `childId`
- `audioUrl`
- `score`
- `feedback`
- `provider`
- `providerRawJson`
- `createdAt`

---

## 9. API 设计

## 9.1 统一约定

### 基础约定

- 全局前缀：`/api`
- 鉴权：`Authorization: Bearer <token>`
- 数据格式：JSON
- 时间字段：ISO 8601

### 错误响应

```json
{
  "code": "VALIDATION_ERROR",
  "message": "weekdayTimeWindows is invalid",
  "details": {}
}
```

## 9.2 A-C 阶段接口

### Auth

- `POST /api/auth/send-code`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Children

- `GET /api/children`
- `POST /api/children`
- `GET /api/children/:id`
- `GET /api/children/:id/settings`
- `PUT /api/children/:id/settings`

### Family

- `POST /api/families/invite`
- `POST /api/families/invite/accept`

### Pushes

- `GET /api/pushes/pending`
- `POST /api/pushes/:id/approve`
- `GET /api/pushes/tasks/:childId`
- `POST /api/pushes/:id/deliver`
- `POST /api/pushes/:id/complete`

## 9.3 D1 阶段接口

### Learning

- `POST /api/learning/sessions`
- `GET /api/learning/sessions/:id`
- `POST /api/learning/sessions/:id/answer`
- `POST /api/learning/sessions/:id/finish`

### Content

- `GET /api/content/english/words`
- `GET /api/content/english/words/:id`

---

## 10. 推送引擎设计

## 10.1 初版策略

初版不做复杂 AI 规划，采用规则引擎：

1. 检查孩子是否存在学习设置
2. 判断当前是否落在可学习时间窗口
3. 查询到期复习单词
4. 若复习量不足，再补新单词
5. 生成建议内容

### 建议内容结构

```json
{
  "mode": "word_review",
  "dueWords": 8,
  "newWords": 2,
  "words": [
    { "id": "w1", "value": "apple" }
  ],
  "coachHint": "focus on animal words",
  "priority": "normal"
}
```

### 后续扩展点

- 将规则引擎替换为 AI 规划器
- 引入画像上下文
- 引入孩子近期表现和学习偏好

---

## 11. 英语学习引擎设计

## 11.1 学习会话生成

学习会话从 `LearningTask.contentJson` 生成：

1. 取出本次任务单词列表
2. 按策略组合题型
3. 生成 `LearningSessionItem`
4. 返回首题和进度信息

## 11.2 判题策略

### 单词选义

- 服务端直接对比标准答案

### 单词拼写

- 忽略大小写
- 初版不做模糊匹配

### 发音跟读

- 调语音评测适配器
- 返回 0-100 分
- 低于阈值返回纠音提示

## 11.3 复习推进规则

初版使用固定复习阶段：

- 5 分钟
- 30 分钟
- 12 小时
- 1 天
- 2 天
- 4 天
- 7 天
- 15 天

### 推进逻辑

- 回答正确：进入下一阶段
- 连续正确 3 次：可标记已掌握
- 回答错误：回退 1-2 阶段

---

## 12. 前端架构设计

## 12.1 页面分层

### 家长端

- 登录页
- 家庭初始化页
- 孩子建档页
- 家长首页
- 学习设置页
- 审批中心页

### 孩子端

- 任务板页
- 任务开始页
- 学习会话页
- 学习结果页

## 12.2 状态管理

建议保留轻量状态：

- `sessionStore`
  - accessToken
  - parentId
  - familyId
- `childStore`
  - currentChildId
  - childList

页面级数据尽量使用本地 `ref/reactive` 管理，不提前引入复杂全局 store。

## 12.3 API 调用层

建议拆分：

- `services/api/auth.ts`
- `services/api/children.ts`
- `services/api/pushes.ts`
- `services/api/learning.ts`

原因：

- 当前 `api.ts` 单文件会随着阶段推进变得过大
- 有利于前后端接口演进和类型维护

---

## 13. 安全设计

阶段 A-D1 需要具备的最低安全能力：

- JWT 鉴权
- 验证码频率限制
- 家庭归属校验
- 输入 DTO 校验
- 敏感字段脱敏日志
- 上传音频访问权限控制

### 特别要求

- 所有 `childId` 相关接口都必须检查该孩子是否属于当前家长家庭
- 所有审批接口都必须检查操作人是否属于该推送对应家庭

---

## 14. 可观测性设计

### 日志

最少记录：

- 登录成功/失败
- 孩子创建
- 学习设置修改
- 推送生成
- 审批动作
- 任务完成
- 学习会话完成

### 指标

阶段 A-D1 先统计：

- 登录成功率
- 家长建档完成率
- 推送审批率
- 任务完成率
- 单词掌握率

---

## 15. 测试设计

## 15.1 后端测试

- 单元测试
  - K12 阶段映射
  - 推送规则引擎
  - 复习阶段推进
- 集成测试
  - 鉴权
  - 家庭归属校验
  - 推送状态机
- E2E 测试
  - 登录 -> 建档 -> 设置 -> 审批 -> 学习 -> 完成

## 15.2 前端测试

当前仓库尚未配置前端测试框架，阶段 A 建议补充最小测试能力：

- API 层单元测试
- 关键页面联调验证清单

---

## 16. 阶段落地顺序

### A

- 清理 starter 残留
- 统一 API 基线

### B

- 鉴权与家庭主数据

### C

- 设置、推送、审批、任务流转

### D1

- 英语最小学习引擎

说明：

- A-C 完成后，现有前端原型即可转为真实可联调产品
- D1 是首个真正形成产品价值的学习闭环

---

## 17. 架构决策摘要

### 决策 1: 单体 API

原因：

- 当前团队和仓库规模不需要拆服务
- 先保证业务闭环和开发效率

### 决策 2: 推送与任务分离

原因：

- 审批中对象和执行中对象职责不同
- 更容易追踪修改、延后、拒绝等操作历史

### 决策 3: 规则引擎先行

原因：

- 可解释、可调试、成本低
- 足够支撑首轮闭环验证

### 决策 4: 语音服务采用适配器

原因：

- 降低第三方耦合
- 便于后续更换供应商

### 决策 5: 画像先存结构化 JSON

原因：

- 当前阶段不需要复杂画像查询
- 为后续 AI 记忆迭代保留灵活性

---

## 18. 下一步输出建议

基于本文档，下一步应直接进入：

1. Prisma schema 设计稿
2. NestJS 模块与接口清单
3. 阶段 A-D1 开发任务拆解

本文档只负责定义技术边界，不替代开发任务排期。
