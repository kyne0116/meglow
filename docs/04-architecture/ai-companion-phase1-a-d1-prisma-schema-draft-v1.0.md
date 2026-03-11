# AI智慧学伴 Phase 1 A-D1 Prisma Schema 设计稿

**版本**: v1.0  
**日期**: 2026-03-10  
**适用阶段**: 阶段 A - 阶段 D1  
**对应文档**:  
- `docs/04-architecture/ai-companion-phase1-a-d1-technical-architecture-v1.0.md`
- `docs/03-implementation/ai-companion-phase1-a-d1-task-breakdown-v1.0.md`

---

## 1. 文档目标

本文档定义 A-D1 阶段的 Prisma 数据模型草案，用于指导：

- Prisma `schema.prisma` 编写
- 初始 migration 设计
- NestJS 模块的数据访问边界
- 前后端接口字段命名统一

本文档不是最终 schema 文件，但字段、关系和索引已经细化到可直接进入实现。

---

## 2. 设计原则

### 2.1 ID 策略

统一使用：

- `String @id @default(uuid()) @db.Uuid`

原因：

- PostgreSQL 原生支持
- 方便跨服务和日志引用
- 不暴露自增序号

### 2.2 时间字段

统一包含：

- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

仅对确有业务意义的表补充：

- `deletedAt`
- `finishedAt`
- `expiresAt`

### 2.3 JSON 字段策略

以下场景优先使用 `Json`：

- 时间窗口数组
- AI/规则引擎生成的 payload
- 画像结构
- 第三方语音评测原始返回

说明：

- 当前阶段不追求复杂画像查询
- 等阶段 E/F 稳定后，再决定是否将高频字段拆列

### 2.4 软删除策略

A-D1 阶段默认不对核心表使用软删除，避免增加复杂度。  
如需保留历史，以状态字段和日志表解决。

---

## 3. 枚举设计

## 3.1 ParentRole

```prisma
enum ParentRole {
  OWNER
  MEMBER
}
```

## 3.2 Gender

```prisma
enum Gender {
  MALE
  FEMALE
}
```

## 3.3 K12Stage

```prisma
enum K12Stage {
  LOWER_PRIMARY
  MIDDLE_PRIMARY
  UPPER_PRIMARY
  JUNIOR_HIGH
}
```

## 3.4 SubjectType

```prisma
enum SubjectType {
  ENGLISH
}
```

## 3.5 PushStatus

```prisma
enum PushStatus {
  PENDING_APPROVAL
  APPROVED
  MODIFIED
  REJECTED
  POSTPONED
}
```

## 3.6 PushActionType

```prisma
enum PushActionType {
  APPROVE
  MODIFY
  REJECT
  POSTPONE
}
```

## 3.7 TaskStatus

```prisma
enum TaskStatus {
  APPROVED
  MODIFIED
  DELIVERED
  COMPLETED
}
```

## 3.8 SessionStatus

```prisma
enum SessionStatus {
  IN_PROGRESS
  COMPLETED
  ABANDONED
}
```

## 3.9 LearningItemType

```prisma
enum LearningItemType {
  WORD_MEANING
  WORD_SPELLING
  WORD_PRONUNCIATION
}
```

---

## 4. 模型关系总览

```text
Parent --< FamilyMembership >-- Family --< Child
Child --1 ChildProfile
Child --1 ChildGameProfile
Child --1 ChildLearningSettings
Child --< ChildWordProgress >-- EnglishWord
Child --< LearningPush --< LearningPushActionLog
Child --< LearningTask --< LearningSession --< LearningSessionItem
LearningSessionItem --< PronunciationAttempt
```

---

## 5. 核心模型设计

## 5.1 Parent

### 说明

家长主体。一个家长理论上只属于一个家庭，但为后续可扩展性，关系通过 `FamilyMembership` 维护。

### 字段

```prisma
model Parent {
  id          String             @id @default(uuid()) @db.Uuid
  phone       String             @unique @db.VarChar(20)
  nickname    String?            @db.VarChar(50)
  avatarUrl   String?            @db.VarChar(255)
  memberships FamilyMembership[]
  pushActions LearningPushActionLog[] @relation("PushActionOperator")
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt
}
```

### 索引与约束

- `phone` 唯一

## 5.2 Family

### 说明

家庭聚合根。

### 字段

```prisma
model Family {
  id          String             @id @default(uuid()) @db.Uuid
  memberships FamilyMembership[]
  children    Child[]
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt
}
```

## 5.3 FamilyMembership

### 说明

家庭与家长的关联表。

### 字段

```prisma
model FamilyMembership {
  id                String     @id @default(uuid()) @db.Uuid
  familyId          String     @db.Uuid
  parentId          String     @db.Uuid
  role              ParentRole
  invitedByParentId String?    @db.Uuid
  createdAt         DateTime   @default(now())

  family            Family     @relation(fields: [familyId], references: [id], onDelete: Cascade)
  parent            Parent     @relation(fields: [parentId], references: [id], onDelete: Cascade)

  @@unique([familyId, parentId])
  @@index([parentId])
}
```

### 规则

- 业务层限制一个家庭最多 2 条 membership
- `OWNER` 仅允许一个

## 5.4 VerificationCode

### 说明

验证码临时表。

### 字段

```prisma
model VerificationCode {
  id         String   @id @default(uuid()) @db.Uuid
  phone      String   @db.VarChar(20)
  code       String   @db.VarChar(10)
  expiresAt  DateTime
  usedAt     DateTime?
  createdAt  DateTime @default(now())

  @@index([phone, createdAt])
  @@index([phone, expiresAt])
}
```

### 规则

- 业务层保证 60 秒有效
- 同手机号 1 分钟内最多 1 次发送

## 5.5 FamilyInvite

### 说明

第二位家长邀请记录。

### 字段

```prisma
model FamilyInvite {
  id               String    @id @default(uuid()) @db.Uuid
  familyId         String    @db.Uuid
  inviterParentId  String    @db.Uuid
  inviteePhone     String    @db.VarChar(20)
  token            String    @unique @db.VarChar(100)
  acceptedAt       DateTime?
  expiresAt        DateTime
  createdAt        DateTime  @default(now())

  family           Family    @relation(fields: [familyId], references: [id], onDelete: Cascade)

  @@index([familyId])
  @@index([inviteePhone])
}
```

## 5.6 Child

### 说明

孩子主表。

### 字段

```prisma
model Child {
  id               String                @id @default(uuid()) @db.Uuid
  familyId         String                @db.Uuid
  name             String                @db.VarChar(50)
  gender           Gender
  birthDate        DateTime?
  grade            Int
  k12Stage         K12Stage
  avatarUrl        String?               @db.VarChar(255)
  family           Family                @relation(fields: [familyId], references: [id], onDelete: Cascade)
  profile          ChildProfile?
  gameProfile      ChildGameProfile?
  learningSettings ChildLearningSettings?
  wordProgresses   ChildWordProgress[]
  pushes           LearningPush[]
  tasks            LearningTask[]
  sessions         LearningSession[]
  createdAt        DateTime              @default(now())
  updatedAt        DateTime              @updatedAt

  @@index([familyId])
  @@index([familyId, grade])
}
```

### 规则

- 业务层限制每个家庭最多 5 个孩子
- `grade` 取值范围 `1..9`

## 5.7 ChildProfile

### 说明

A-D1 阶段先存基础画像容器，不实现完整画像分析。

### 字段

```prisma
model ChildProfile {
  id                    String   @id @default(uuid()) @db.Uuid
  childId               String   @unique @db.Uuid
  learningMemoryJson    Json
  cognitiveMemoryJson   Json
  personalityMemoryJson Json
  teachingStrategyJson  Json
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  child                 Child    @relation(fields: [childId], references: [id], onDelete: Cascade)
}
```

### 初始化建议

- `learningMemoryJson = {}`
- `cognitiveMemoryJson = {}`
- `personalityMemoryJson = {}`
- `teachingStrategyJson = {}`

## 5.8 ChildGameProfile

### 说明

为后续积分和打卡预留，A-D1 只初始化。

### 字段

```prisma
model ChildGameProfile {
  id           String   @id @default(uuid()) @db.Uuid
  childId      String   @unique @db.Uuid
  totalPoints  Int      @default(0)
  currentLevel Int      @default(1)
  streakDays   Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  child        Child    @relation(fields: [childId], references: [id], onDelete: Cascade)
}
```

## 5.9 ChildLearningSettings

### 说明

每个孩子每个学科一份设置。A-D1 只支持英语，因此保留 `(childId, subject)` 唯一约束。

### 字段

```prisma
model ChildLearningSettings {
  id                   String      @id @default(uuid()) @db.Uuid
  childId              String      @db.Uuid
  subject              SubjectType
  autoApprove          Boolean     @default(false)
  weekdayTimeWindows   Json
  weekendTimeWindows   Json
  dailyDurationMin     Int
  wordsPerSession      Int
  createdAt            DateTime    @default(now())
  updatedAt            DateTime    @updatedAt

  child                Child       @relation(fields: [childId], references: [id], onDelete: Cascade)

  @@unique([childId, subject])
  @@index([childId])
}
```

### JSON 结构建议

```json
[
  { "start": "18:30", "end": "20:00" }
]
```

## 5.10 EnglishWord

### 说明

A-D1 阶段最小英语词库表。

### 字段

```prisma
model EnglishWord {
  id              String              @id @default(uuid()) @db.Uuid
  value           String              @db.VarChar(100)
  phonetic        String?             @db.VarChar(100)
  meaningZh       String              @db.VarChar(255)
  exampleSentence String?             @db.VarChar(500)
  imageHint       String?             @db.VarChar(255)
  difficultyLevel Int                 @default(1)
  k12Stage        K12Stage
  wordProgresses  ChildWordProgress[]
  sessionItems    LearningSessionItem[]
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  @@unique([value, k12Stage])
  @@index([k12Stage, difficultyLevel])
}
```

## 5.11 ChildWordProgress

### 说明

孩子与单词之间的学习进度表。

### 字段

```prisma
model ChildWordProgress {
  id              String      @id @default(uuid()) @db.Uuid
  childId         String      @db.Uuid
  wordId          String      @db.Uuid
  masteryLevel    Int         @default(0)
  correctStreak   Int         @default(0)
  reviewStage     Int         @default(0)
  lastReviewedAt  DateTime?
  nextReviewAt    DateTime?
  totalAttempts   Int         @default(0)
  correctAttempts Int         @default(0)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  child           Child       @relation(fields: [childId], references: [id], onDelete: Cascade)
  word            EnglishWord @relation(fields: [wordId], references: [id], onDelete: Cascade)

  @@unique([childId, wordId])
  @@index([childId, nextReviewAt])
  @@index([childId, reviewStage])
}
```

### 规则

- `reviewStage` 映射艾宾浩斯阶段
- `masteryLevel` 可先与 `reviewStage` 同步演进，后续再拆分

## 5.12 LearningPush

### 说明

待审批建议表。

### 字段

```prisma
model LearningPush {
  id              String      @id @default(uuid()) @db.Uuid
  childId         String      @db.Uuid
  summary         String      @db.VarChar(255)
  reason          String      @db.VarChar(500)
  expectedOutcome String      @db.VarChar(500)
  status          PushStatus
  scheduledAt     DateTime
  contentJson     Json
  createdBy       String      @db.VarChar(50) // rule_engine / system / manual
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  child           Child       @relation(fields: [childId], references: [id], onDelete: Cascade)
  actionLogs      LearningPushActionLog[]
  tasks           LearningTask[]

  @@index([childId, status])
  @@index([status, scheduledAt])
}
```

## 5.13 LearningPushActionLog

### 说明

审批动作留痕。

### 字段

```prisma
model LearningPushActionLog {
  id               String         @id @default(uuid()) @db.Uuid
  pushId           String         @db.Uuid
  action           PushActionType
  operatorParentId String         @db.Uuid
  comment          String?        @db.VarChar(500)
  payloadJson      Json?
  createdAt        DateTime       @default(now())

  push             LearningPush   @relation(fields: [pushId], references: [id], onDelete: Cascade)
  operator         Parent         @relation("PushActionOperator", fields: [operatorParentId], references: [id], onDelete: Cascade)

  @@index([pushId, createdAt])
  @@index([operatorParentId])
}
```

## 5.14 LearningTask

### 说明

审批完成后下发给孩子端的可执行任务。

### 字段

```prisma
model LearningTask {
  id           String            @id @default(uuid()) @db.Uuid
  pushId       String            @db.Uuid
  childId      String            @db.Uuid
  summary      String            @db.VarChar(255)
  status       TaskStatus
  scheduledAt  DateTime
  deliveredAt  DateTime?
  completedAt  DateTime?
  contentJson  Json
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt

  push         LearningPush      @relation(fields: [pushId], references: [id], onDelete: Cascade)
  child        Child             @relation(fields: [childId], references: [id], onDelete: Cascade)
  sessions     LearningSession[]

  @@index([childId, status])
  @@index([childId, scheduledAt])
}
```

## 5.15 LearningSession

### 说明

孩子一次真实学习过程。

### 字段

```prisma
model LearningSession {
  id          String               @id @default(uuid()) @db.Uuid
  taskId      String               @db.Uuid
  childId     String               @db.Uuid
  subject     SubjectType
  status      SessionStatus
  startedAt   DateTime             @default(now())
  finishedAt  DateTime?
  summaryJson Json?
  createdAt   DateTime             @default(now())
  updatedAt   DateTime             @updatedAt

  task        LearningTask         @relation(fields: [taskId], references: [id], onDelete: Cascade)
  child       Child                @relation(fields: [childId], references: [id], onDelete: Cascade)
  items       LearningSessionItem[]

  @@index([taskId])
  @@index([childId, status])
}
```

## 5.16 LearningSessionItem

### 说明

会话中的单题记录。

### 字段

```prisma
model LearningSessionItem {
  id                String            @id @default(uuid()) @db.Uuid
  sessionId         String            @db.Uuid
  wordId            String?           @db.Uuid
  itemType          LearningItemType
  sequence          Int
  promptJson        Json
  correctAnswerJson Json
  childAnswerJson   Json?
  resultJson        Json?
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  session           LearningSession   @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  word              EnglishWord?      @relation(fields: [wordId], references: [id], onDelete: SetNull)
  pronunciationAttempts PronunciationAttempt[]

  @@index([sessionId, sequence])
  @@index([wordId])
}
```

## 5.17 PronunciationAttempt

### 说明

发音评测记录。

### 字段

```prisma
model PronunciationAttempt {
  id              String              @id @default(uuid()) @db.Uuid
  sessionItemId   String              @db.Uuid
  childId         String              @db.Uuid
  audioUrl        String              @db.VarChar(255)
  score           Int
  feedback        String?             @db.VarChar(500)
  provider        String              @db.VarChar(50)
  providerRawJson Json?
  createdAt       DateTime            @default(now())

  sessionItem     LearningSessionItem @relation(fields: [sessionItemId], references: [id], onDelete: Cascade)

  @@index([sessionItemId])
  @@index([childId, createdAt])
}
```

---

## 6. 建议的完整 Prisma 草稿骨架

以下为便于开发落地的骨架顺序：

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum ParentRole { ... }
enum Gender { ... }
enum K12Stage { ... }
enum SubjectType { ... }
enum PushStatus { ... }
enum PushActionType { ... }
enum TaskStatus { ... }
enum SessionStatus { ... }
enum LearningItemType { ... }

model Parent { ... }
model Family { ... }
model FamilyMembership { ... }
model VerificationCode { ... }
model FamilyInvite { ... }
model Child { ... }
model ChildProfile { ... }
model ChildGameProfile { ... }
model ChildLearningSettings { ... }
model EnglishWord { ... }
model ChildWordProgress { ... }
model LearningPush { ... }
model LearningPushActionLog { ... }
model LearningTask { ... }
model LearningSession { ... }
model LearningSessionItem { ... }
model PronunciationAttempt { ... }
```

---

## 7. 初始 migration 切分建议

为减少一次性变更多，建议拆成三批 migration：

### Migration 1: 身份与主数据

- `Parent`
- `Family`
- `FamilyMembership`
- `VerificationCode`
- `FamilyInvite`
- `Child`
- `ChildProfile`
- `ChildGameProfile`
- `ChildLearningSettings`

### Migration 2: 推送与任务

- `LearningPush`
- `LearningPushActionLog`
- `LearningTask`

### Migration 3: 英语学习 D1

- `EnglishWord`
- `ChildWordProgress`
- `LearningSession`
- `LearningSessionItem`
- `PronunciationAttempt`

---

## 8. Seed 数据建议

### 必备种子数据

- 1 个默认家庭
- 1 个默认家长
- 1-2 个默认孩子
- 30-50 个英语单词
- 3-5 条可生成的待复习进度数据

### 开发目标

- 本地环境执行 seed 后即可联调登录、设置、审批、任务、学习

---

## 9. 待最终确认项

以下内容在正式写 `schema.prisma` 前需要最终拍板：

1. 是否统一采用 `uuid()` 而非 `cuid()`
2. `birthDate` 是否必须
3. 家长邀请使用 token 还是验证码
4. 音频文件存储策略是本地、对象存储还是第三方直传
5. `ChildProfile` 的 JSON 字段是否拆成单个 `profileJson`

建议当前阶段先按本文档实现，不等待更大范围的建模讨论。
