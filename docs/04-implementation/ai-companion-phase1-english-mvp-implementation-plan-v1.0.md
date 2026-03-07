# AI鏅烘収瀛︿即 Phase 1 鑻辫 MVP 瀹炴柦璁″垝

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 鏋勫缓鑻辫瀛︾ MVP锛屽寘鍚搴处鎴蜂綋绯汇€佸瀛愮數瀛愬缓妗ｃ€佽嫳璇簲澶у涔犲満鏅€佸闀垮鎵规祦銆丄I鍏ㄤ汉鍖栬蹇嗐€佹父鎴忓寲婵€鍔?v1銆?
**Architecture:** Turborepo monorepo 鏋舵瀯锛屽悗绔?NestJS + Prisma + PostgreSQL 鎻愪緵 RESTful API锛屽墠绔?uni-app (Vue 3) 鏋勫缓寰俊灏忕▼搴忋€侫I 鏁欏笀閫氳繃 LLM API 闆嗘垚瀹炵幇锛岃闊宠兘鍔涢€氳繃寰俊灏忕▼搴忓師鐢?API + 绗笁鏂硅闊虫湇鍔″疄鐜般€傚墠鍚庣閫氳繃 JWT 璁よ瘉閫氫俊銆?
**Tech Stack:** NestJS 10, Prisma 5, PostgreSQL 15, Redis, uni-app (Vue 3), TypeScript, Docker, Jest, 寰俊灏忕▼搴?SDK, LLM API (Claude/OpenAI), TTS/STT API

**Design Doc:** `docs/02-product-design/ai-companion-product-design-v1.0.md`

---

## 鎬讳綋浠诲姟姒傝

| Task Group | 妯″潡 | 棰勪及宸ユ椂 | 渚濊禆 |
|------------|------|---------|------|
| Task 1 | 椤圭洰鑴氭墜鏋朵笌鍩虹璁炬柦 | 1-2澶?| 鏃?|
| Task 2 | 鏁版嵁搴?Schema 璁捐 | 1澶?| Task 1 |
| Task 3 | 璁よ瘉涓庡搴处鎴风郴缁?| 2-3澶?| Task 2 |
| Task 4 | 瀛╁瓙鐢靛瓙寤烘。绯荤粺 | 1-2澶?| Task 3 |
| Task 5 | AI 璁板繂寮曟搸 | 2-3澶?| Task 4 |
| Task 6 | 鑻辫瀛︿範妯″潡 鈥?鑹惧娴╂柉鍗曡瘝璁板繂 | 3-4澶?| Task 5 |
| Task 7 | 鑻辫瀛︿範妯″潡 鈥?鍙戦煶/璇煶缁冧範 | 2-3澶?| Task 6 |
| Task 8 | 鑻辫瀛︿範妯″潡 鈥?鎯呮櫙閫犲彞涓庡璇?| 2-3澶?| Task 6 |
| Task 9 | 鑻辫瀛︿範妯″潡 鈥?鍒嗙骇闃呰 | 2澶?| Task 6 |
| Task 10 | 鑻辫瀛︿範妯″潡 鈥?涓婚鍙ｈ瀵硅瘽 | 2澶?| Task 7 |
| Task 11 | 瀹堕暱瀹℃壒涓庢櫤鑳芥帹閫佹祦 | 2-3澶?| Task 5, Task 6 |
| Task 12 | 鍗虫椂瀛︿範锟斤拷锟芥姤 | 1-2澶?| Task 11 |
| Task 13 | 娓告垙鍖栨縺鍔变綋绯?v1 | 2澶?| Task 6 |
| Task 14 | 鍓嶇 鈥?瀹堕暱绔皬绋嬪簭 | 5-7澶?| Task 3-12 |
| Task 15 | 鍓嶇 鈥?瀛╁瓙绔皬绋嬪簭 | 5-7澶?| Task 6-13 |
| Task 16 | 闆嗘垚娴嬭瘯涓?E2E | 2-3澶?| 鍏ㄩ儴 |

---

## Task 1: 椤圭洰鑴氭墜鏋朵笌鍩虹璁炬柦

**鐩爣:** 鎼缓 Turborepo monorepo 椤圭洰缁撴瀯锛岄厤缃紑鍙戠幆澧冦€丏ocker銆丆I 鍩虹銆?
**Files:**
- Create: `apps/backend/` (鍩轰簬 fullstack-turborepo-starter 鎵╁睍)
- Create: `apps/wechat-miniapp/` (uni-app 灏忕▼搴忛」鐩?
- Create: `packages/shared/` (鍓嶅悗绔叡浜被鍨?甯搁噺)
- Modify: `package.json` (鏍?monorepo 閰嶇疆)
- Modify: `docker-compose.yml` (娣诲姞 Redis)

### Step 1: 瑙ｅ帇骞跺垵濮嬪寲 monorepo

```bash
cd D:/02_Dev/Workspace/GitHub/ichild
unzip fullstack-turborepo-starter-master.zip
# 灏嗗唴瀹圭Щ鍒伴」鐩牴鐩綍
cp -r fullstack-turborepo-starter-master/* .
cp fullstack-turborepo-starter-master/.* . 2>/dev/null
rm -rf fullstack-turborepo-starter-master
git init
```

### Step 2: 鍒涘缓 uni-app 灏忕▼搴忛」鐩?
```bash
# 浣跨敤 HBuilderX CLI 鎴?vue-cli 鍒涘缓 uni-app 椤圭洰
npx degit dcloudio/uni-preset-vue#vite-ts wechat-miniapp
```

椤圭洰缁撴瀯搴斾负:
```
apps/wechat-miniapp/
鈹溾攢鈹€ src/
鈹?  鈹溾攢鈹€ pages/           # 椤甸潰鐩綍
鈹?  鈹?  鈹溾攢鈹€ parent/      # 瀹堕暱绔〉闈?鈹?  鈹?  鈹斺攢鈹€ child/       # 瀛╁瓙绔〉闈?鈹?  鈹溾攢鈹€ components/      # 鍏变韩缁勪欢
鈹?  鈹溾攢鈹€ composables/     # Vue 缁勫悎寮忓嚱鏁?鈹?  鈹溾攢鈹€ stores/          # Pinia 鐘舵€佺鐞?鈹?  鈹溾攢鈹€ services/        # API 璇锋眰灏佽
鈹?  鈹溾攢鈹€ utils/           # 宸ュ叿鍑芥暟
鈹?  鈹溾攢鈹€ static/          # 闈欐€佽祫婧?鈹?  鈹溾攢鈹€ App.vue
鈹?  鈹溾攢鈹€ main.ts
鈹?  鈹溾攢鈹€ manifest.json
鈹?  鈹溾攢鈹€ pages.json
鈹?  鈹斺攢鈹€ uni.scss
鈹溾攢鈹€ package.json
鈹溾攢鈹€ tsconfig.json
鈹斺攢鈹€ vite.config.ts
```

### Step 3: 鍒涘缓鍏变韩鍖?
```bash
mkdir -p packages/shared/src
```

```typescript
// packages/shared/src/types/index.ts
// 鍓嶅悗绔叡浜殑绫诲瀷瀹氫箟
export * from './user';
export * from './child';
export * from './learning';
export * from './english';
```

```json
// packages/shared/package.json
{
  "name": "shared",
  "version": "0.0.1",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "build": "tsc",
    "lint": "eslint src/"
  }
}
```

### Step 4: 鏇存柊 docker-compose.yml 娣诲姞 Redis

```yaml
# docker-compose.yml
version: "3.8"

services:
  reverse-proxy:
    image: nginx:latest
    container_name: nginx_container
    ports:
      - 80:80
    depends_on:
      - postgres
      - redis
    volumes:
      - ./apps/config/nginx.conf:/etc/nginx/nginx.conf
    extra_hosts:
      - "host.docker.internal:host-gateway"

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=ichild
      - POSTGRES_USER=ichild
      - POSTGRES_PASSWORD=ichild_dev_2026
    volumes:
      - db_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  db_data:
  redis_data:
```

### Step 5: 瀹夎鏍稿績渚濊禆

```bash
# 鍚庣棰濆渚濊禆
cd apps/backend
yarn add @nestjs/jwt @nestjs/passport passport passport-jwt
yarn add @nestjs/cache-manager cache-manager cache-manager-ioredis-yet ioredis
yarn add class-validator class-transformer
yarn add @nestjs/schedule
yarn add bcrypt uuid
yarn add -D @types/passport-jwt @types/bcrypt @types/uuid

# 鍓嶇渚濊禆
cd ../miniapp
yarn add pinia @dcloudio/uni-ui
yarn add -D @types/uni-app
```

### Step 6: 鍚姩 Docker 楠岃瘉鍩虹鐜

```bash
docker-compose up -d
# 楠岃瘉 PostgreSQL 鍜?Redis 姝ｅ父杩愯
docker-compose ps
```

### Step 7: 鍒濆鎻愪氦

```bash
git add .
git commit -m "chore: initialize ichild monorepo with NestJS API and uni-app miniapp"
```

---

## Task 2: 鏁版嵁搴?Schema 璁捐

**鐩爣:** 璁捐瀹屾暣鐨?Prisma Schema锛岃鐩栧搴处鎴枫€佸瀛愭。妗堛€佸涔犺褰曘€佽嫳璇唴瀹广€佹父鎴忓寲绛夋墍鏈?Phase 1 鏁版嵁妯″瀷銆?
**Files:**
- Modify: `apps/backend/prisma/schema.prisma`
- Create: `apps/backend/prisma/seed.ts`

### Step 1: 缂栧啓瀹屾暣鐨?Prisma Schema

```prisma
// apps/backend/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==========================================
// 1. 瀹跺涵璐︽埛浣撶郴
// ==========================================

model Family {
  id        String   @id @default(uuid())
  name      String   // 瀹跺涵鍚嶇О
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  parents  Parent[]
  children Child[]
}

model Parent {
  id          String   @id @default(uuid())
  phone       String   @unique
  nickname    String
  avatarUrl   String?
  role        ParentRole @default(PRIMARY)
  familyId    String
  family      Family   @relation(fields: [familyId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // 瀹堕暱鎿嶄綔璁板綍
  approvals   LearningPushApproval[]
  settings    ChildLearningSettings[]

  @@index([familyId])
}

enum ParentRole {
  PRIMARY    // 涓诲闀匡紙鍒涘缓鑰咃級
  SECONDARY  // 鍓闀匡紙琚個璇凤級
}

// ==========================================
// 2. 瀛╁瓙鐢靛瓙妗ｆ
// ==========================================

model Child {
  id           String   @id @default(uuid())
  name         String
  gender       Gender
  birthDate    DateTime
  avatarUrl    String?
  grade        Int      // 1-9 骞寸骇
  k12Stage     K12Stage
  schoolName   String?
  familyId     String
  family       Family   @relation(fields: [familyId], references: [id])
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // 鍏宠仈
  profile         ChildProfile?
  subscriptions   Subscription[]
  learningSettings ChildLearningSettings[]
  learningRecords LearningRecord[]
  wordProgress    WordProgress[]
  achievements    ChildAchievement[]
  pushHistory     LearningPush[]
  dailyChallenges DailyChallenge[]

  @@index([familyId])
}

enum Gender {
  MALE
  FEMALE
}

enum K12Stage {
  LOWER_PRIMARY   // 灏忓浣庡勾绾?1-2
  MIDDLE_PRIMARY  // 灏忓涓勾绾?3-4
  UPPER_PRIMARY   // 灏忓楂樺勾绾?5-6
  JUNIOR_HIGH     // 鍒濅腑 7-9
}

// 瀛╁瓙鍏ㄤ汉鍖栨。妗堬紙AI 璁板繂锛?model ChildProfile {
  id      String @id @default(uuid())
  childId String @unique
  child   Child  @relation(fields: [childId], references: [id])

  // 瀛︿範椋庢牸锛圓I 鎺ㄦ柇骞舵寔缁洿鏂帮級
  learningStyle    Json?   // { visual: 0.7, auditory: 0.8, kinesthetic: 0.3 }
  attentionSpan    Int?    // 骞冲潎娉ㄦ剰鍔涙寔缁垎閽熸暟
  bestStudyTime    Json?   // { weekday: "16:00-18:00", weekend: "09:00-11:00" }

  // 鎬ф牸鐗圭偣锛圓I 寤烘ā锛?  personality      Json?   // { introversion: 0.6, resilience: 0.7, curiosity: 0.9 }
  effectiveEncouragement Json? // ["鏁呬簨绫绘瘮", "绉垎婵€鍔?, "鎸戞垬寮?]
  interests        Json?   // ["鍔ㄧ墿", "澶┖", "瓒崇悆"]

  // 鏁欏绛栫暐锛圓I 浼樺寲锛?  teachingStrategy Json?   // AI 涓鸿瀛╁瓙鎬荤粨鐨勬渶浣虫暀瀛︾瓥鐣?  weaknessBreakthrough Json? // 钖勫急鐜妭绐佺牬绛栫暐璁板綍

  updatedAt DateTime @updatedAt
}

// ==========================================
// 3. 璁㈤槄绠＄悊
// ==========================================

model Subscription {
  id        String   @id @default(uuid())
  childId   String
  child     Child    @relation(fields: [childId], references: [id])
  subject   Subject
  plan      SubscriptionPlan
  status    SubscriptionStatus @default(ACTIVE)
  startDate DateTime
  endDate   DateTime
  createdAt DateTime @default(now())

  @@index([childId])
  @@index([status])
}

enum Subject {
  ENGLISH
  CHINESE
  MATH
}

enum SubscriptionPlan {
  MONTHLY
  QUARTERLY
  YEARLY
}

enum SubscriptionStatus {
  ACTIVE
  EXPIRED
  CANCELLED
}

// ==========================================
// 4. 瀛︿範璁剧疆锛堝闀胯嚜瀹氫箟锛?// ==========================================

model ChildLearningSettings {
  id        String   @id @default(uuid())
  childId   String
  child     Child    @relation(fields: [childId], references: [id])
  parentId  String
  parent    Parent   @relation(fields: [parentId], references: [id])
  subject   Subject

  // 鏃堕棿绐楀彛璁剧疆
  weekdayTimeWindows Json  // [{ start: "16:00", end: "18:00" }, ...]
  weekendTimeWindows Json  // [{ start: "09:00", end: "11:00" }, ...]

  // 瀛︿範寮哄害
  dailyDuration    Int   @default(30)   // 姣忔棩寤鸿瀛︿範鏃堕暱锛堝垎閽燂級
  wordsPerSession  Int   @default(10)   // 鑻辫锛氭瘡娆℃柊鍗曡瘝鏁?  difficulty       DifficultyPreference @default(AUTO)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([childId, subject])
  @@index([childId])
}

enum DifficultyPreference {
  AUTO      // AI 鑷姩璋冭妭
  EASY      // 鍋忕畝鍗?  MODERATE  // 閫備腑
  CHALLENGE // 鏈夋寫鎴?}

// ==========================================
// 5. 鑻辫瀛︿範鍐呭搴?// ==========================================

model Word {
  id            String   @id @default(uuid())
  word          String
  phonetic      String?  // 闊虫爣
  pronunciation String?  // 鍙戦煶闊抽 URL
  meanings      Json     // [{ pos: "n.", meaning: "鐚?, example: "I have a cat." }]
  difficulty    Int      // 1-9 瀵瑰簲骞寸骇闅惧害
  k12Stage      K12Stage
  category      String?  // 鍒嗙被鏍囩锛氬姩鐗┿€侀鐗┿€侀鑹茬瓑
  imageUrl      String?  // 鍥剧墖鑱旀兂

  // 鍏宠仈
  progress WordProgress[]

  @@index([k12Stage])
  @@index([difficulty])
  @@index([category])
}

model ReadingMaterial {
  id         String   @id @default(uuid())
  title      String
  content    String   // 鏂囩珷鍐呭
  audioUrl   String?  // 鏈楄闊抽 URL
  difficulty Int      // 1-9 瀵瑰簲骞寸骇
  k12Stage   K12Stage
  subject    Subject
  category   String?  // 鍒嗙被锛氬彜璇楄瘝銆佹垚璇晠浜嬨€佽嫳璇煭鏂囩瓑
  wordCount  Int
  questions  Json?    // 鐞嗚В闂鍒楄〃
  metadata   Json?    // 棰濆鍏冩暟鎹?
  @@index([k12Stage, subject])
  @@index([difficulty])
}

// ==========================================
// 6. 瀛︿範杩涘害涓庤褰?// ==========================================

// 鍗曡瘝瀛︿範杩涘害锛堣壘瀹炬旦鏂級
model WordProgress {
  id              String   @id @default(uuid())
  childId         String
  child           Child    @relation(fields: [childId], references: [id])
  wordId          String
  word            Word     @relation(fields: [wordId], references: [id])

  // 鑹惧娴╂柉鐘舵€?  ebStatus        EbReviewStage @default(NEW)
  nextReviewAt    DateTime?     // 涓嬫澶嶄範鏃堕棿
  reviewCount     Int      @default(0)
  correctCount    Int      @default(0)
  incorrectCount  Int      @default(0)
  lastReviewedAt  DateTime?
  mastered        Boolean  @default(false) // 鏄惁宸叉帉鎻?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([childId, wordId])
  @@index([childId, ebStatus])
  @@index([nextReviewAt])
}

enum EbReviewStage {
  NEW           // 鏂板
  REVIEW_5MIN   // 5鍒嗛挓鍚庡涔?  REVIEW_30MIN  // 30鍒嗛挓鍚庡涔?  REVIEW_12H    // 12灏忔椂鍚庡涔?  REVIEW_1D     // 1澶╁悗澶嶄範
  REVIEW_2D     // 2澶╁悗澶嶄範
  REVIEW_4D     // 4澶╁悗澶嶄範
  REVIEW_7D     // 7澶╁悗澶嶄範
  REVIEW_15D    // 15澶╁悗澶嶄範
  MASTERED      // 宸叉帉鎻?}

// 閫氱敤瀛︿範璁板綍
model LearningRecord {
  id          String   @id @default(uuid())
  childId     String
  child       Child    @relation(fields: [childId], references: [id])
  subject     Subject
  type        LearningType
  duration    Int      // 瀛︿範鏃堕暱锛堢锛?  score       Float?   // 姝ｇ‘鐜?0-100
  details     Json     // 璇︾粏瀛︿範鏁版嵁锛堝洜绫诲瀷鑰屽紓锛?
  // AI 浜掑姩璁板綍
  aiConversation Json?  // AI 瀵硅瘽鍘嗗彶鎽樿
  aiFeedback     String? // AI 鎬荤粨鍙嶉

  startedAt   DateTime
  completedAt DateTime?
  createdAt   DateTime @default(now())

  // 鍏宠仈绠€鎶?  briefing    LearningBriefing?

  @@index([childId, subject])
  @@index([childId, createdAt])
}

enum LearningType {
  // 鑻辫
  WORD_LEARNING       // 鍗曡瘝瀛︿範
  WORD_REVIEW         // 鍗曡瘝澶嶄範
  PRONUNCIATION       // 鍙戦煶缁冧範
  SENTENCE_BUILDING   // 鎯呮櫙閫犲彞
  READING             // 鍒嗙骇闃呰
  ORAL_DIALOGUE       // 鍙ｈ瀵硅瘽
  // 璇枃锛圥hase 2锛?  CLASSIC_READING     // 缁忓吀闃呰
  EXPRESSION          // 琛ㄨ揪璁粌
  // 鏁板锛圥hase 3锛?  CONCEPT_LEARNING    // 姒傚康瀛︿範
  PRACTICE            // 缁冧範宸╁浐
  THINKING_CHALLENGE  // 鎬濈淮鎸戞垬
}

// ==========================================
// 7. AI 鎺ㄩ€佷笌瀹堕暱瀹℃壒
// ==========================================

model LearningPush {
  id           String   @id @default(uuid())
  childId      String
  child        Child    @relation(fields: [childId], references: [id])
  subject      Subject
  type         LearningType

  // AI 鐢熸垚鐨勬帹閫佸唴瀹?  summary      String   // 褰撳墠瀛︿範鎯呭喌鎬荤粨
  reason       String   // 鏈鎺ㄩ€佺紭鐢?  expectedOutcome String // 棰勬湡杈惧埌鏁堟灉
  content      Json     // 鍏蜂綋鎺ㄩ€佸唴瀹癸紙鍗曡瘝鍒楄〃/鏂囩珷/棰樼洰绛夛級

  // 鎺ㄩ€佹椂鏈?  scheduledAt  DateTime // AI 瑙勫垝鐨勬帹閫佹椂闂?  status       PushStatus @default(PENDING_APPROVAL)

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // 瀹℃壒璁板綍
  approval     LearningPushApproval?

  @@index([childId, status])
  @@index([scheduledAt])
}

enum PushStatus {
  PENDING_APPROVAL  // 寰呭闀垮鎵?  APPROVED          // 宸叉壒鍑?  REJECTED          // 宸叉嫆缁?  MODIFIED          // 瀹堕暱淇敼鍚庢壒鍑?  DELIVERED         // 宸叉帹閫佺粰瀛╁瓙
  COMPLETED         // 瀛╁瓙宸插畬鎴?  EXPIRED           // 宸茶繃鏈?}

model LearningPushApproval {
  id        String   @id @default(uuid())
  pushId    String   @unique
  push      LearningPush @relation(fields: [pushId], references: [id])
  parentId  String
  parent    Parent   @relation(fields: [parentId], references: [id])
  action    ApprovalAction
  comment   String?  // 瀹堕暱澶囨敞
  modifiedContent Json?  // 瀹堕暱淇敼鐨勫唴瀹?
  createdAt DateTime @default(now())
}

enum ApprovalAction {
  APPROVE
  REJECT
  MODIFY
  POSTPONE
}

// ==========================================
// 8. 鍗虫椂瀛︿範绠€鎶?// ==========================================

model LearningBriefing {
  id              String   @id @default(uuid())
  learningRecordId String  @unique
  learningRecord  LearningRecord @relation(fields: [learningRecordId], references: [id])

  // 绠€鎶ュ唴瀹?  headline        String   // 涓€鍙ヨ瘽鎬荤粨
  correctRate     Float?   // 姝ｇ‘鐜?  newKnowledge    String?  // 鏂板鍐呭
  improvement     String?  // 杩涙鐐?  needsAttention  String?  // 闇€鍔犲己鐐?  aiComment       String   // AI 鏁欏笀璇勮
  encouragement   String   // 榧撳姳璇?
  createdAt DateTime @default(now())
}

// ==========================================
// 9. 娓告垙鍖栨縺鍔?// ==========================================

model Achievement {
  id          String   @id @default(uuid())
  code        String   @unique  // 鍞竴鏍囪瘑鐮?  name        String
  description String
  iconUrl     String?
  category    AchievementCategory
  condition   Json     // 杈炬垚鏉′欢鎻忚堪
  points      Int      @default(0) // 濂栧姳绉垎

  children ChildAchievement[]
}

enum AchievementCategory {
  STREAK        // 杩炵画鎵撳崱绫?  MILESTONE     // 閲岀▼纰戠被锛堝浜?00涓崟璇嶏級
  MASTERY       // 鎺屾彙绫伙紙鏌愮被璇嶆眹鍏ㄩ儴鎺屾彙锛?  CHALLENGE     // 鎸戞垬绫伙紙瀹屾垚姣忔棩鎸戞垬锛?  SPECIAL       // 鐗规畩鎴愬氨
}

model ChildAchievement {
  id            String   @id @default(uuid())
  childId       String
  child         Child    @relation(fields: [childId], references: [id])
  achievementId String
  achievement   Achievement @relation(fields: [achievementId], references: [id])
  earnedAt      DateTime @default(now())

  @@unique([childId, achievementId])
  @@index([childId])
}

model DailyChallenge {
  id        String   @id @default(uuid())
  childId   String
  child     Child    @relation(fields: [childId], references: [id])
  date      DateTime @db.Date
  subject   Subject
  content   Json     // 鎸戞垬鍐呭
  completed Boolean  @default(false)
  score     Float?
  points    Int      @default(0) // 鑾峰緱鐨勭Н鍒?
  @@unique([childId, date, subject])
  @@index([childId, date])
}

// 绉垎鍜岀瓑绾?model ChildGameProfile {
  id            String   @id @default(uuid())
  childId       String   @unique
  totalPoints   Int      @default(0)
  level         Int      @default(1)
  currentStreak Int      @default(0)  // 褰撳墠杩炵画鎵撳崱澶╂暟
  longestStreak Int      @default(0)  // 鏈€闀胯繛缁墦鍗″ぉ鏁?  lastActiveDate DateTime? @db.Date

  updatedAt DateTime @updatedAt
}
```

### Step 2: 缂栧啓 Seed 鏁版嵁

```typescript
// apps/backend/prisma/seed.ts
import { PrismaClient, K12Stage, Subject } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 绉嶅瓙璇嶆眹鏁版嵁锛堝皬瀛︿綆骞寸骇绀轰緥锛?  const lowerPrimaryWords = [
    { word: 'cat', phonetic: '/k忙t/', meanings: [{ pos: 'n.', meaning: '鐚?, example: 'I have a cat.' }], difficulty: 1, k12Stage: K12Stage.LOWER_PRIMARY, category: '鍔ㄧ墿' },
    { word: 'dog', phonetic: '/d蓲伞/', meanings: [{ pos: 'n.', meaning: '鐙?, example: 'The dog is big.' }], difficulty: 1, k12Stage: K12Stage.LOWER_PRIMARY, category: '鍔ㄧ墿' },
    { word: 'apple', phonetic: '/藞忙p.l/', meanings: [{ pos: 'n.', meaning: '鑻规灉', example: 'I eat an apple.' }], difficulty: 1, k12Stage: K12Stage.LOWER_PRIMARY, category: '椋熺墿' },
    // ... 鏇村璇嶆眹
  ];

  for (const wordData of lowerPrimaryWords) {
    await prisma.word.upsert({
      where: { id: wordData.word }, // 鐢ㄤ复鏃禝D
      update: {},
      create: wordData,
    });
  }

  // 绉嶅瓙鎴愬氨鏁版嵁
  const achievements = [
    { code: 'FIRST_WORD', name: '鍒濊瘑鑻辫', description: '瀛︿細绗竴涓嫳璇崟璇?, category: 'MILESTONE' as const, condition: { type: 'word_count', count: 1 }, points: 10 },
    { code: 'WORD_10', name: '灏忓皬瀛﹁€?, description: '绱瀛︿細10涓崟璇?, category: 'MILESTONE' as const, condition: { type: 'word_count', count: 10 }, points: 50 },
    { code: 'WORD_50', name: '璇嶆眹杈句汉', description: '绱瀛︿細50涓崟璇?, category: 'MILESTONE' as const, condition: { type: 'word_count', count: 50 }, points: 200 },
    { code: 'WORD_100', name: '鍗曡瘝澶у笀', description: '绱瀛︿細100涓崟璇?, category: 'MILESTONE' as const, condition: { type: 'word_count', count: 100 }, points: 500 },
    { code: 'STREAK_3', name: '鎸佷箣浠ユ亽', description: '杩炵画瀛︿範3澶?, category: 'STREAK' as const, condition: { type: 'streak', days: 3 }, points: 30 },
    { code: 'STREAK_7', name: '瀛︿範鍛ㄥ啝鍐?, description: '杩炵画瀛︿範7澶?, category: 'STREAK' as const, condition: { type: 'streak', days: 7 }, points: 100 },
    { code: 'STREAK_21', name: '涔犳儻鍏绘垚', description: '杩炵画瀛︿範21澶?, category: 'STREAK' as const, condition: { type: 'streak', days: 21 }, points: 500 },
    { code: 'PERFECT_SESSION', name: '瀹岀編琛ㄧ幇', description: '鍗曟瀛︿範姝ｇ‘鐜?00%', category: 'CHALLENGE' as const, condition: { type: 'perfect_score' }, points: 50 },
  ];

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { code: achievement.code },
      update: {},
      create: achievement,
    });
  }

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Step 3: 杩愯鏁版嵁搴撹縼绉?
```bash
cd apps/backend
npx prisma migrate dev --name init_ichild_schema
npx prisma db seed
```

### Step 4: 杩愯楠岃瘉

```bash
npx prisma studio  # 鎵撳紑 Prisma Studio 楠岃瘉鏁版嵁妯″瀷
```

### Step 5: 鎻愪氦

```bash
git add apps/backend/prisma/
git commit -m "feat: design complete database schema for Phase 1 MVP"
```

---

## Task 3: 璁よ瘉涓庡搴处鎴风郴缁?
**鐩爣:** 瀹炵幇鎵嬫満鍙?楠岃瘉鐮佺櫥褰曘€丣WT 璁よ瘉銆佸搴处鎴峰垱寤轰笌绠＄悊銆?
**Files:**
- Create: `apps/backend/src/auth/auth.module.ts`
- Create: `apps/backend/src/auth/auth.controller.ts`
- Create: `apps/backend/src/auth/auth.service.ts`
- Create: `apps/backend/src/auth/jwt.strategy.ts`
- Create: `apps/backend/src/auth/guards/jwt-auth.guard.ts`
- Create: `apps/backend/src/family/family.module.ts`
- Create: `apps/backend/src/family/family.controller.ts`
- Create: `apps/backend/src/family/family.service.ts`
- Test: `apps/backend/src/auth/auth.service.spec.ts`
- Test: `apps/backend/src/family/family.service.spec.ts`

### Step 1: 缂栧啓璁よ瘉妯″潡娴嬭瘯

```typescript
// apps/backend/src/auth/auth.service.spec.ts
describe('AuthService', () => {
  it('should send verification code to phone number', async () => {});
  it('should verify code and return JWT token', async () => {});
  it('should create family and parent on first login', async () => {});
  it('should return existing parent on subsequent login', async () => {});
  it('should reject invalid verification code', async () => {});
});
```

### Step 2: 瀹炵幇璁よ瘉鏈嶅姟

```typescript
// apps/backend/src/auth/auth.service.ts
@Injectable()
export class AuthService {
  // 鍙戦€侀獙璇佺爜
  async sendVerificationCode(phone: string): Promise<void> {}
  // 楠岃瘉鐮佺櫥褰曪紙鏂扮敤鎴疯嚜鍔ㄦ敞鍐岋級
  async verifyAndLogin(phone: string, code: string): Promise<{ token: string; isNewUser: boolean }> {}
  // 鐢熸垚 JWT
  private generateToken(parent: Parent): string {}
}
```

### Step 3: 瀹炵幇 JWT 绛栫暐鍜屽畧鍗?
```typescript
// apps/backend/src/auth/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: { sub: string; familyId: string }) {
    return { parentId: payload.sub, familyId: payload.familyId };
  }
}
```

### Step 4: 瀹炵幇瀹跺涵绠＄悊鏈嶅姟娴嬭瘯

```typescript
// apps/backend/src/family/family.service.spec.ts
describe('FamilyService', () => {
  it('should create a family with primary parent', async () => {});
  it('should invite secondary parent by phone', async () => {});
  it('should list all children in family', async () => {});
  it('should allow both parents to access family data', async () => {});
});
```

### Step 5: 瀹炵幇瀹跺涵绠＄悊鏈嶅姟

```typescript
// apps/backend/src/family/family.service.ts
@Injectable()
export class FamilyService {
  async createFamily(parentId: string, familyName: string): Promise<Family> {}
  async inviteParent(familyId: string, phone: string): Promise<void> {}
  async getFamilyDashboard(familyId: string): Promise<FamilyDashboard> {}
}
```

### Step 6: 瀹炵幇璁よ瘉鎺у埗鍣?
```typescript
// apps/backend/src/auth/auth.controller.ts
@Controller('auth')
@ApiTags('璁よ瘉')
export class AuthController {
  @Post('send-code')
  async sendCode(@Body() dto: SendCodeDto) {}

  @Post('verify')
  async verify(@Body() dto: VerifyCodeDto) {}
}
```

### Step 7: 杩愯娴嬭瘯楠岃瘉

```bash
cd apps/backend
yarn test src/auth/ src/family/ --verbose
```

### Step 8: 鎻愪氦

```bash
git add apps/backend/src/auth/ apps/backend/src/family/
git commit -m "feat: implement auth system with phone login and family accounts"
```

---

## Task 4: 瀛╁瓙鐢靛瓙寤烘。绯荤粺

**鐩爣:** 瀹炵幇瀛╁瓙淇℃伅鍒涘缓銆佸叏浜哄寲妗ｆ鍒濆鍖栥€佹。妗堟煡鐪嬩笌鏇存柊銆?
**Files:**
- Create: `apps/backend/src/child/child.module.ts`
- Create: `apps/backend/src/child/child.controller.ts`
- Create: `apps/backend/src/child/child.service.ts`
- Create: `apps/backend/src/child/profile/profile.service.ts`
- Test: `apps/backend/src/child/child.service.spec.ts`
- Test: `apps/backend/src/child/profile/profile.service.spec.ts`

### Step 1: 缂栧啓瀛╁瓙绠＄悊娴嬭瘯

```typescript
// apps/backend/src/child/child.service.spec.ts
describe('ChildService', () => {
  it('should create a child with initial profile', async () => {});
  it('should auto-determine K12 stage from grade', async () => {});
  it('should create empty ChildProfile and GameProfile on creation', async () => {});
  it('should list all children for a family', async () => {});
  it('should update child basic info', async () => {});
  it('should not allow access from another family', async () => {});
});
```

### Step 2: 瀹炵幇瀛╁瓙绠＄悊鏈嶅姟

```typescript
// apps/backend/src/child/child.service.ts
@Injectable()
export class ChildService {
  async createChild(familyId: string, dto: CreateChildDto): Promise<Child> {
    // 1. 鏍规嵁骞寸骇鑷姩鍒ゆ柇 K12 闃舵
    // 2. 鍒涘缓瀛╁瓙璁板綍
    // 3. 鍒涘缓绌虹殑 ChildProfile锛堝叏浜哄寲妗ｆ锛?    // 4. 鍒涘缓 ChildGameProfile锛堟父鎴忓寲妗ｆ锛?  }

  async getChildDetail(childId: string, familyId: string): Promise<ChildDetail> {}
  async updateChild(childId: string, dto: UpdateChildDto): Promise<Child> {}
  async listChildren(familyId: string): Promise<Child[]> {}
}
```

### Step 3: 瀹炵幇鍏ㄤ汉鍖栨。妗堟湇鍔?
```typescript
// apps/backend/src/child/profile/profile.service.ts
@Injectable()
export class ProfileService {
  // AI 鏇存柊妗ｆ锛堟瘡娆″涔犲悗璋冪敤锛?  async updateFromLearningSession(childId: string, sessionData: LearningSessionData): Promise<void> {
    // 鍒嗘瀽瀛︿範鏁版嵁鏇存柊锛氬涔犻鏍笺€佹敞鎰忓姏銆佹湁鏁堥紦鍔辨柟寮忕瓑
  }

  // 鑾峰彇瀛╁瓙鐨勬暀瀛︾瓥鐣ュ缓璁?  async getTeachingStrategy(childId: string): Promise<TeachingStrategy> {}

  // 鑾峰彇瀹屾暣鐨勫叏浜哄寲鐢诲儚
  async getFullProfile(childId: string): Promise<FullChildProfile> {}
}
```

### Step 4: 瀹炵幇鎺у埗鍣?
```typescript
// apps/backend/src/child/child.controller.ts
@Controller('children')
@UseGuards(JwtAuthGuard)
@ApiTags('瀛╁瓙绠＄悊')
export class ChildController {
  @Post()
  async create(@Body() dto: CreateChildDto, @CurrentUser() user) {}

  @Get()
  async list(@CurrentUser() user) {}

  @Get(':id')
  async getDetail(@Param('id') id: string, @CurrentUser() user) {}

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateChildDto, @CurrentUser() user) {}

  @Get(':id/profile')
  async getProfile(@Param('id') id: string, @CurrentUser() user) {}
}
```

### Step 5: 杩愯娴嬭瘯骞舵彁浜?
```bash
cd apps/backend && yarn test src/child/ --verbose
git add apps/backend/src/child/
git commit -m "feat: implement child electronic filing with AI profile"
```

---

## Task 5: AI 璁板繂寮曟搸

**鐩爣:** 鏋勫缓 AI 鏁欏笀鐨勬牳蹇冭兘鍔?鈥?涓?LLM API 闆嗘垚锛屽疄鐜伴暱鏈熻蹇嗐€佷釜鎬у寲鏁欏绛栫暐銆佸妯℃€佷氦浜掑熀纭€銆?
**Files:**
- Create: `apps/backend/src/ai/ai.module.ts`
- Create: `apps/backend/src/ai/llm/llm.service.ts` (LLM API 灏佽)
- Create: `apps/backend/src/ai/memory/memory.service.ts` (璁板繂寮曟搸)
- Create: `apps/backend/src/ai/teacher/teacher.service.ts` (AI 鏁欏笀)
- Create: `apps/backend/src/ai/prompts/` (Prompt 妯℃澘)
- Test: `apps/backend/src/ai/memory/memory.service.spec.ts`
- Test: `apps/backend/src/ai/teacher/teacher.service.spec.ts`

### Step 1: 灏佽 LLM 鏈嶅姟

```typescript
// apps/backend/src/ai/llm/llm.service.ts
@Injectable()
export class LlmService {
  private client: Anthropic; // 鎴?OpenAI

  // 閫氱敤瀵硅瘽
  async chat(messages: Message[], options?: ChatOptions): Promise<string> {}

  // 甯︾郴缁?prompt 鐨勬暀瀛﹀璇?  async teachingChat(
    systemPrompt: string,
    childProfile: FullChildProfile,
    messages: Message[],
  ): Promise<string> {}

  // 鍒嗘瀽瀛︿範鏁版嵁锛屾洿鏂版。妗?  async analyzeAndUpdateProfile(
    sessionData: LearningSessionData,
    currentProfile: FullChildProfile,
  ): Promise<ProfileUpdate> {}
}
```

### Step 2: 瀹炵幇璁板繂寮曟搸

```typescript
// apps/backend/src/ai/memory/memory.service.ts
@Injectable()
export class MemoryService {
  /**
   * 鏋勫缓瀛╁瓙鐨勫畬鏁翠笂涓嬫枃锛堟瘡娆?AI 浜掑姩鍓嶈皟鐢級
   * 鍖呭惈锛氬熀纭€淇℃伅 + 瀛︿範杩涘害 + 鍏ㄤ汉鍖栨。妗?+ 杩戞湡瀛︿範璁板綍
   */
  async buildChildContext(childId: string): Promise<ChildContext> {}

  /**
   * 瀛︿範浼氳瘽鍚庢洿鏂拌蹇?   */
  async digestSession(childId: string, session: LearningSession): Promise<void> {
    // 1. 鏇存柊瀛︿範鏁版嵁灞傦紙姝ｇ‘鐜囥€佽繘搴︼級
    // 2. 璋冪敤 LLM 鍒嗘瀽璁ょ煡椋庢牸鍙樺寲
    // 3. 鏇存柊鎬ф牸鎯呮劅灞?    // 4. 浼樺寲鏁欏绛栫暐灞?  }

  /**
   * 鐢熸垚鎺ㄩ€佸缓璁殑涓婁笅鏂?   */
  async buildPushContext(childId: string, subject: Subject): Promise<PushContext> {}
}
```

### Step 3: 瀹炵幇 AI 鏁欏笀鏈嶅姟

```typescript
// apps/backend/src/ai/teacher/teacher.service.ts
@Injectable()
export class TeacherService {
  /**
   * AI 鏁欏笀涓庡瀛愪簰鍔ㄧ殑鏍稿績鏂规硶
   */
  async interact(
    childId: string,
    learningType: LearningType,
    userInput: UserInput,  // 鏂囧瓧/璇煶杞枃瀛?鍥剧墖璇嗗埆缁撴灉
    sessionId: string,
  ): Promise<TeacherResponse> {
    // 1. 鍔犺浇瀛╁瓙涓婁笅鏂囷紙璁板繂寮曟搸锛?    // 2. 鏍规嵁瀛╁瓙骞撮緞鍜屾€ф牸閫夋嫨浜や簰椋庢牸
    // 3. 璋冪敤 LLM 鐢熸垚鍥炲
    // 4. 鍒ゆ柇瀵归敊骞剁粰鍑哄弽棣?    // 5. 鏇存柊瀛︿範璁板綍
    // 6. 杩斿洖缁撴瀯鍖栧洖澶嶏紙鏂囧瓧+璇煶鎸囦护+琛ㄦ儏/鍔ㄧ敾鎸囦护锛?  }

  /**
   * 鐢熸垚瀛︿範鎺ㄩ€佸缓璁?   */
  async generatePushRecommendation(
    childId: string,
    subject: Subject,
  ): Promise<LearningPush> {}

  /**
   * 鐢熸垚鍗虫椂瀛︿範绠€鎶?   */
  async generateBriefing(
    learningRecordId: string,
  ): Promise<LearningBriefing> {}
}
```

### Step 4: 缂栧啓 Prompt 妯℃澘

```typescript
// apps/backend/src/ai/prompts/english-teacher.ts
export const ENGLISH_TEACHER_SYSTEM_PROMPT = `
浣犳槸涓€浣嶄笓涓氥€佹湁鐖卞績鐨凙I鑻辫鏁欏笀銆備綘姝ｅ湪鏁欎竴涓?{{age}} 宀佺殑 {{grade}} 骞寸骇瀛︾敓銆?
銆愬鐢熸。妗堛€?濮撳悕锛歿{name}}
鎬ф牸鐗圭偣锛歿{personality}}
瀛︿範椋庢牸锛歿{learningStyle}}
鍏磋叮鐖卞ソ锛歿{interests}}
鏈夋晥榧撳姳鏂瑰紡锛歿{encouragementStyle}}
褰撳墠鑻辫姘村钩锛氬凡鎺屾彙 {{masteredWords}} 涓崟璇?
銆愪氦浜掗鏍艰姹傘€?{{interactionStyleByAge}}

銆愭暀瀛﹀師鍒欍€?1. 姣忔鍥炵瓟蹇呴』鍖呭惈锛氬閿欏垽鏂?+ 瀛︿範鎸囧 + 榧撳姳
2. 鐢ㄥ鐢熸劅鍏磋叮鐨勮瘽棰橈紙{{interests}}锛夋潵涓句緥鍜岃仈鎯?3. 鏍规嵁瀛︾敓鎬ф牸璋冩暣榧撳姳鏂瑰紡
4. 淇濇寔鑰愬績锛岄敊璇椂寮曞鑰岄潪鎵硅瘎
5. 閫傚綋浣跨敤 emoji 澧炲姞瓒ｅ懗鎬?`;

// apps/backend/src/ai/prompts/push-generator.ts
export const PUSH_RECOMMENDATION_PROMPT = `
鍩轰簬浠ヤ笅瀛︾敓瀛︿範鏁版嵁锛岀敓鎴愪竴浠藉涔犳帹閫佸缓璁€?
銆愬鐢熷綋鍓嶇姸鎬併€?{{childContext}}

銆愰渶瑕佺敓鎴愩€?1. summary: 褰撳墠瀛︿範鎯呭喌鎬荤粨锛堥潰鍚戝闀匡紝绠€娲佹俯鍜岋紝100瀛椾互鍐咃級
2. reason: 鏈鎺ㄩ€佺紭鐢憋紙璇存槑涓轰粈涔堢幇鍦ㄩ渶瑕佸涔犺繖浜涘唴瀹癸級
3. expectedOutcome: 棰勬湡杈惧埌鏁堟灉锛堝叿浣撱€佸彲閲忓寲锛?4. content: 鍏蜂綋鎺ㄩ€佸唴瀹癸紙鍗曡瘝鍒楄〃/缁冧範棰樼洰绛夛級

璇蜂互 JSON 鏍煎紡杩斿洖銆?`;
```

### Step 5: 杩愯娴嬭瘯骞舵彁浜?
```bash
cd apps/backend && yarn test src/ai/ --verbose
git add apps/backend/src/ai/
git commit -m "feat: implement AI memory engine and teacher service"
```

---

## Task 6: 鑻辫瀛︿範妯″潡 鈥?鑹惧娴╂柉鍗曡瘝璁板繂

**鐩爣:** 瀹炵幇鏍稿績鐨勮嫳璇崟璇嶅涔犲満鏅紝鍖呭惈鏂拌瘝瀛︿範銆佽壘瀹炬旦鏂棿闅斿涔犮€佷腑鏂囧惈涔夊洖绛斻€佽嫳鏂囧崟璇嶆姤璇汇€?
**Files:**
- Create: `apps/backend/src/english/english.module.ts`
- Create: `apps/backend/src/english/word-learning/word-learning.service.ts`
- Create: `apps/backend/src/english/word-learning/word-learning.controller.ts`
- Create: `apps/backend/src/english/ebbinghaus/ebbinghaus.service.ts`
- Test: `apps/backend/src/english/word-learning/word-learning.service.spec.ts`
- Test: `apps/backend/src/english/ebbinghaus/ebbinghaus.service.spec.ts`

### Step 1: 瀹炵幇鑹惧娴╂柉绠楁硶

```typescript
// apps/backend/src/english/ebbinghaus/ebbinghaus.service.ts
@Injectable()
export class EbbinghausService {
  // 鑹惧娴╂柉澶嶄範闂撮殧锛堟爣鍑嗛棿闅旓紝AI 鍙姩鎬佽皟鏁达級
  private readonly REVIEW_INTERVALS = {
    [EbReviewStage.NEW]: 5 * 60 * 1000,           // 5鍒嗛挓
    [EbReviewStage.REVIEW_5MIN]: 30 * 60 * 1000,   // 30鍒嗛挓
    [EbReviewStage.REVIEW_30MIN]: 12 * 60 * 60 * 1000, // 12灏忔椂
    [EbReviewStage.REVIEW_12H]: 24 * 60 * 60 * 1000,   // 1澶?    [EbReviewStage.REVIEW_1D]: 2 * 24 * 60 * 60 * 1000, // 2澶?    [EbReviewStage.REVIEW_2D]: 4 * 24 * 60 * 60 * 1000, // 4澶?    [EbReviewStage.REVIEW_4D]: 7 * 24 * 60 * 60 * 1000, // 7澶?    [EbReviewStage.REVIEW_7D]: 15 * 24 * 60 * 60 * 1000, // 15澶?  };

  /**
   * 璁＄畻涓嬫澶嶄範鏃堕棿
   * 绛斿锛氳繘鍏ヤ笅涓€闃舵
   * 绛旈敊锛氭牴鎹敊璇▼搴﹀洖閫€1-2涓樁娈?   */
  calculateNextReview(
    currentStage: EbReviewStage,
    isCorrect: boolean,
    childProfile: ChildProfile, // 鐢ㄤ簬涓€у寲璋冩暣
  ): { nextStage: EbReviewStage; nextReviewAt: Date } {}

  /**
   * 鑾峰彇褰撳墠闇€瑕佸涔犵殑鍗曡瘝鍒楄〃
   */
  async getDueWords(childId: string, limit: number): Promise<WordProgress[]> {}

  /**
   * 鑾峰彇鎺ㄨ崘鐨勬柊鍗曡瘝锛堟牴鎹?K12 闃舵鍜屽凡瀛﹀唴瀹癸級
   */
  async getNewWords(childId: string, count: number): Promise<Word[]> {}
}
```

### Step 2: 瀹炵幇鍗曡瘝瀛︿範鏈嶅姟

```typescript
// apps/backend/src/english/word-learning/word-learning.service.ts
@Injectable()
export class WordLearningService {
  /**
   * 寮€濮嬩竴娆″崟璇嶅涔犱細璇?   * 杩斿洖鏈瑕佸/澶嶄範鐨勫崟璇嶅垪琛?   */
  async startSession(childId: string): Promise<WordLearningSession> {
    // 1. 鑾峰彇闇€瑕佸涔犵殑鍗曡瘝锛堣壘瀹炬旦鏂埌鏈熺殑锛?    // 2. 鑾峰彇鏂板崟璇嶏紙鏍规嵁璁剧疆鐨?wordsPerSession锛?    // 3. 娣峰悎鎺掑垪锛屽涔犱紭鍏?    // 4. 鍒涘缓瀛︿範璁板綍
  }

  /**
   * 澶勭悊瀛╁瓙鐨勭瓟棰?   */
  async submitAnswer(
    sessionId: string,
    wordId: string,
    answer: WordAnswer,  // { type: 'meaning' | 'spelling' | 'pronunciation', value: string }
  ): Promise<AnswerResult> {
    // 1. 鍒ゆ柇瀵归敊
    // 2. 璋冪敤 AI 鏁欏笀鐢熸垚鍙嶉
    // 3. 鏇存柊鑹惧娴╂柉杩涘害
    // 4. 鏇存柊瀛︿範璁板綍
    // 5. 妫€鏌ユ垚灏辫В閿?    // 6. 杩斿洖缁撴灉锛堝閿?+ AI鍙嶉 + 绉垎鍙樺寲锛?  }

  /**
   * 缁撴潫瀛︿範浼氳瘽
   */
  async endSession(sessionId: string): Promise<SessionSummary> {
    // 1. 璁＄畻鏈姝ｇ‘鐜?    // 2. 鏇存柊瀛╁瓙妗ｆ锛堣蹇嗗紩鎿庯級
    // 3. 鐢熸垚鍗虫椂绠€鎶?    // 4. 鏇存柊娓告垙鍖栨暟鎹?  }
}
```

### Step 3: 瀹炵幇鎺у埗鍣?
```typescript
// apps/backend/src/english/word-learning/word-learning.controller.ts
@Controller('english/word-learning')
@UseGuards(JwtAuthGuard)
@ApiTags('鑻辫-鍗曡瘝瀛︿範')
export class WordLearningController {
  @Post('session/start')
  async startSession(@Body() dto: StartSessionDto) {}

  @Post('session/:sessionId/answer')
  async submitAnswer(
    @Param('sessionId') sessionId: string,
    @Body() dto: SubmitAnswerDto,
  ) {}

  @Post('session/:sessionId/end')
  async endSession(@Param('sessionId') sessionId: string) {}

  @Get('progress/:childId')
  async getProgress(@Param('childId') childId: string) {}
}
```

### Step 4: 娴嬭瘯骞舵彁浜?
```bash
cd apps/backend && yarn test src/english/word-learning/ src/english/ebbinghaus/ --verbose
git add apps/backend/src/english/
git commit -m "feat: implement Ebbinghaus word learning with AI teacher interaction"
```

---

## Task 7-10: 鑻辫瀛︿範妯″潡 鈥?鍏朵綑鍥涗釜鍦烘櫙

> 浠ヤ笅鍥涗釜妯″潡缁撴瀯涓?Task 6 绫讳技锛屽湪姝ょ畝瑕佹弿杩版牳蹇冮€昏緫銆?
### Task 7: 鍙戦煶/璇煶缁冧範

**Files:**
- Create: `apps/backend/src/english/pronunciation/pronunciation.service.ts`
- Create: `apps/backend/src/english/pronunciation/pronunciation.controller.ts`
- Test: `apps/backend/src/english/pronunciation/pronunciation.service.spec.ts`

**鏍稿績閫昏緫:**
- 鎺ユ敹瀛╁瓙鐨勮闊筹紙鍓嶇褰曢煶 鈫?涓婁紶闊抽鏂囦欢锛?- 璋冪敤璇煶璇勬祴 API锛堝寰俊鍚屽０浼犺瘧鎻掍欢/璁璇煶璇勬祴锛夎幏鍙栧彂闊宠瘎鍒?- AI 鏁欏笀鍩轰簬璇勫垎缁欏嚭绾犻煶寤鸿
- 鏀寔璺熻瀵规瘮銆侀煶鏍囩骇璇勫垎

### Task 8: 鎯呮櫙閫犲彞涓庡璇?
**Files:**
- Create: `apps/backend/src/english/sentence/sentence.service.ts`
- Create: `apps/backend/src/english/sentence/sentence.controller.ts`
- Test: `apps/backend/src/english/sentence/sentence.service.spec.ts`

**鏍稿績閫昏緫:**
- 鍩轰簬褰撳墠瀛︿範鐨勫崟璇嶇敓鎴愭儏鏅鐩?- 闅惧害姊害锛氬～绌?鈫?鍗婂紑鏀鹃€犲彞 鈫?鑷敱琛ㄨ揪
- AI 鏁欏笀璇勪及璇硶姝ｇ‘鎬у拰鐢ㄨ瘝鎭板綋鎬?- 閿欒寮曞绾犳锛岃€岄潪鐩存帴缁欑瓟妗?
### Task 9: 鑻辫鍒嗙骇闃呰

**Files:**
- Create: `apps/backend/src/english/reading/reading.service.ts`
- Create: `apps/backend/src/english/reading/reading.controller.ts`
- Test: `apps/backend/src/english/reading/reading.service.spec.ts`

**鏍稿績閫昏緫:**
- 鏍规嵁瀛╁瓙璇嶆眹閲忓拰闃呰鑳藉姏鍖归厤闃呰鏉愭枡
- AI 鏈楄鏂囩珷锛圱TS锛夛紝瀛╁瓙璺熻
- 闃呰鐞嗚В鎻愰棶 鈫?妫€楠岀悊瑙ｆ繁搴?- 鐢熻瘝鑷姩绾冲叆鑹惧娴╂柉澶嶄範

### Task 10: 涓婚寮忓彛璇璇?
**Files:**
- Create: `apps/backend/src/english/dialogue/dialogue.service.ts`
- Create: `apps/backend/src/english/dialogue/dialogue.controller.ts`
- Test: `apps/backend/src/english/dialogue/dialogue.service.spec.ts`

**鏍稿績閫昏緫:**
- 鍩轰簬涓婚锛堝搴€佸鏍°€佹梾琛岀瓑锛夊紑灞曡嚜鐢卞璇?- AI 鎵紨涓嶅悓瑙掕壊涓庡瀛愬璇?- 瀹炴椂璇硶绾犳铻嶅叆瀵硅瘽
- 瀵硅瘽缁撴潫鍚庣敓鎴愯兘鍔涜瘎浼?
---

## Task 11: 瀹堕暱瀹℃壒涓庢櫤鑳芥帹閫佹祦

**鐩爣:** 瀹炵幇 AI 鏅鸿兘鎺ㄩ€佸缓璁?鈫?瀹堕暱瀹℃壒 鈫?鎺ㄩ€佺粰瀛╁瓙鐨勫畬鏁存祦绋嬨€?
**Files:**
- Create: `apps/backend/src/push/push.module.ts`
- Create: `apps/backend/src/push/push.service.ts`
- Create: `apps/backend/src/push/push.controller.ts`
- Create: `apps/backend/src/push/scheduler/push-scheduler.service.ts`
- Test: `apps/backend/src/push/push.service.spec.ts`
- Test: `apps/backend/src/push/scheduler/push-scheduler.service.spec.ts`

### Step 1: 瀹炵幇鎺ㄩ€佽皟搴﹀櫒

```typescript
// apps/backend/src/push/scheduler/push-scheduler.service.ts
@Injectable()
export class PushSchedulerService {
  // 姣忓皬鏃惰繍琛屼竴娆★紝妫€鏌ユ墍鏈夊瀛愮殑鎺ㄩ€侀渶姹?  @Cron('0 * * * *')
  async checkAndSchedulePushes(): Promise<void> {
    // 1. 閬嶅巻鎵€鏈夋椿璺冭闃呯殑瀛╁瓙
    // 2. 妫€鏌ユ槸鍚﹀湪瀹堕暱璁剧疆鐨勬椂闂寸獥鍙ｅ唴
    // 3. 妫€鏌ヨ壘瀹炬旦鏂埌鏈熺殑澶嶄範闇€姹?    // 4. 缁煎悎 AI 璁板繂寮曟搸鐨勫垎鏋?    // 5. 鐢熸垚鎺ㄩ€佸缓璁紙璋冪敤 TeacherService.generatePushRecommendation锛?    // 6. 鍒涘缓寰呭鎵圭殑 LearningPush
    // 7. 閫氱煡瀹堕暱锛堝皬绋嬪簭妯℃澘娑堟伅/璁㈤槄娑堟伅锛?  }
}
```

### Step 2: 瀹炵幇鎺ㄩ€佺鐞嗘湇鍔?
```typescript
// apps/backend/src/push/push.service.ts
@Injectable()
export class PushService {
  // 瀹堕暱鏌ョ湅寰呭鎵规帹閫?  async getPendingPushes(familyId: string): Promise<LearningPush[]> {}

  // 瀹堕暱瀹℃壒
  async approvePush(pushId: string, parentId: string, action: ApprovalAction, modification?: any): Promise<void> {
    // APPROVE: 鏍囪涓?APPROVED锛岀瓑寰呮帹閫佹椂闂村埌杈?    // REJECT: 鏍囪涓?REJECTED
    // MODIFY: 鏇存柊鍐呭鍚庢爣璁颁负 MODIFIED
    // POSTPONE: 寤跺悗鎺ㄩ€佹椂闂?  }

  // 鎺ㄩ€佸埌瀛╁瓙绔?  async deliverToChild(pushId: string): Promise<void> {}

  // 鏌ョ湅鎺ㄩ€佸巻鍙?  async getPushHistory(childId: string, subject?: Subject): Promise<LearningPush[]> {}
}
```

### Step 3: 瀹炵幇鎺у埗鍣?
```typescript
// apps/backend/src/push/push.controller.ts
@Controller('pushes')
@UseGuards(JwtAuthGuard)
@ApiTags('瀛︿範鎺ㄩ€?)
export class PushController {
  @Get('pending')
  async getPending(@CurrentUser() user) {}

  @Post(':id/approve')
  async approve(@Param('id') id: string, @Body() dto: ApprovalDto, @CurrentUser() user) {}

  @Get('history/:childId')
  async getHistory(@Param('childId') childId: string, @Query() query: HistoryQueryDto) {}
}
```

### Step 4: 娴嬭瘯骞舵彁浜?
```bash
cd apps/backend && yarn test src/push/ --verbose
git add apps/backend/src/push/
git commit -m "feat: implement AI smart push with parent approval workflow"
```

---

## Task 12: 鍗虫椂瀛︿範绠€鎶?
**鐩爣:** 姣忔瀛╁瓙瀹屾垚瀛︿範鍚庯紝鑷姩鐢熸垚绠€鎶ユ帹閫佺粰瀹堕暱銆?
**Files:**
- Create: `apps/backend/src/briefing/briefing.service.ts`
- Create: `apps/backend/src/briefing/briefing.controller.ts`
- Test: `apps/backend/src/briefing/briefing.service.spec.ts`

### Step 1: 瀹炵幇绠€鎶ユ湇鍔?
```typescript
// apps/backend/src/briefing/briefing.service.ts
@Injectable()
export class BriefingService {
  /**
   * 鐢熸垚鍗虫椂瀛︿範绠€鎶ワ紙瀛︿範浼氳瘽缁撴潫鏃惰嚜鍔ㄨ皟鐢級
   */
  async generateBriefing(learningRecordId: string): Promise<LearningBriefing> {
    // 1. 鑾峰彇瀛︿範璁板綍璇︽儏
    // 2. 璋冪敤 AI 鐢熸垚绠€鎶ュ唴瀹?
    //    - headline: "灏忔槑浠婂ぉ瀛︿簡8涓柊鍗曡瘝锛屾纭巼87.5%锛?
    //    - correctRate, newKnowledge, improvement, needsAttention
    //    - aiComment: AI 鏁欏笀鐨勪笓涓氳瘎璇?    //    - encouragement: 涓€у寲榧撳姳璇?    // 3. 淇濆瓨绠€鎶?    // 4. 鎺ㄩ€侀€氱煡缁欏闀?  }

  /**
   * 瀹堕暱鏌ョ湅绠€鎶ュ垪琛?   */
  async getBriefings(childId: string, page: number, limit: number): Promise<PaginatedBriefings> {}
}
```

### Step 2: 娴嬭瘯骞舵彁浜?
```bash
cd apps/backend && yarn test src/briefing/ --verbose
git add apps/backend/src/briefing/
git commit -m "feat: implement instant learning briefing for parents"
```

---

## Task 13: 娓告垙鍖栨縺鍔变綋绯?v1

**鐩爣:** 瀹炵幇绉垎銆佸窘绔犮€佺瓑绾с€佽繛缁墦鍗＄郴缁熴€?
**Files:**
- Create: `apps/backend/src/gamification/gamification.module.ts`
- Create: `apps/backend/src/gamification/gamification.service.ts`
- Create: `apps/backend/src/gamification/achievement.service.ts`
- Create: `apps/backend/src/gamification/gamification.controller.ts`
- Test: `apps/backend/src/gamification/gamification.service.spec.ts`

### Step 1: 瀹炵幇娓告垙鍖栨湇鍔?
```typescript
// apps/backend/src/gamification/gamification.service.ts
@Injectable()
export class GamificationService {
  // 娣诲姞绉垎
  async addPoints(childId: string, points: number, reason: string): Promise<PointsResult> {}

  // 鏇存柊杩炵画鎵撳崱
  async updateStreak(childId: string): Promise<StreakResult> {}

  // 璁＄畻绛夌骇
  async calculateLevel(totalPoints: number): number {
    // 绛夌骇绠楁硶: 1-5绾э紙瀛︿範鏂版墜鈫掑皬灏忓鑰呪啋鐭ヨ瘑鎺㈢储鑰呪啋瀛︿範杈句汉鈫掑闇革級
    const levelThresholds = [0, 100, 500, 1500, 5000];
    // ...
  }

  // 鑾峰彇娓告垙鍖栨瑙?  async getGameProfile(childId: string): Promise<GameProfile> {}
}

// apps/backend/src/gamification/achievement.service.ts
@Injectable()
export class AchievementService {
  // 妫€鏌ュ苟瑙ｉ攣鎴愬氨锛堟瘡娆″涔犲悗璋冪敤锛?  async checkAndUnlock(childId: string): Promise<Achievement[]> {
    // 妫€鏌ユ墍鏈夋湭瑙ｉ攣鐨勬垚灏辨潯浠?    // 杩斿洖鏈鏂拌В閿佺殑鎴愬氨鍒楄〃
  }

  // 鑾峰彇瀛╁瓙鐨勬垚灏卞垪琛?  async getAchievements(childId: string): Promise<ChildAchievementList> {}
}
```

### Step 2: 娴嬭瘯骞舵彁浜?
```bash
cd apps/backend && yarn test src/gamification/ --verbose
git add apps/backend/src/gamification/
git commit -m "feat: implement gamification system with points, badges, streaks"
```

---

## Task 14: 鍓嶇 鈥?瀹堕暱绔皬绋嬪簭

**鐩爣:** 鏋勫缓瀹堕暱绔皬绋嬪簭鐨勬墍鏈夐〉闈㈠拰浜や簰銆?
**Files (apps/wechat-miniapp/src/):**
- Create: `pages/parent/home/index.vue` (瀹跺涵浠〃鐩?
- Create: `pages/parent/approval/index.vue` (瀹℃壒涓績)
- Create: `pages/parent/approval/detail.vue` (瀹℃壒璇︽儏)
- Create: `pages/parent/briefing/index.vue` (绠€鎶ュ垪琛?
- Create: `pages/parent/briefing/detail.vue` (绠€鎶ヨ鎯?
- Create: `pages/parent/child/add.vue` (娣诲姞瀛╁瓙)
- Create: `pages/parent/child/profile.vue` (瀛╁瓙妗ｆ)
- Create: `pages/parent/settings/learning.vue` (瀛︿範璁剧疆)
- Create: `pages/parent/settings/account.vue` (璐︽埛璁剧疆)
- Create: `stores/parent.ts` (瀹堕暱鐘舵€佺鐞?
- Create: `services/api.ts` (API 璇锋眰灏佽)

### 鏍稿績椤甸潰缁撴瀯

```
瀹堕暱绔?TabBar:
鈹溾攢鈹€ 棣栭〉锛堝搴华琛ㄧ洏锛?鈹?  鈹溾攢鈹€ 鍚勫瀛愬涔犵姸鎬佸崱鐗?鈹?  鈹溾攢鈹€ 寰呭鎵规彁閱掕鏍?鈹?  鈹斺攢鈹€ 鏈€鏂扮畝鎶ラ€熻
鈹溾攢鈹€ 瀹℃壒锛堝鎵逛腑蹇冿級
鈹?  鈹溾攢鈹€ 寰呭鎵瑰垪琛?鈹?  鈹溾攢鈹€ 瀹℃壒璇︽儏锛堝涔犳儏鍐?鎺ㄩ€佺紭鐢?棰勬湡鏁堟灉锛?鈹?  鈹斺攢鈹€ 鎿嶄綔锛氱‘璁?淇敼/鎷掔粷/寤跺悗
鈹溾攢鈹€ 绠€鎶ワ紙瀛︿範绠€鎶ワ級
鈹?  鈹溾攢鈹€ 鎸夊瀛?鎸夋棩鏈熺瓫閫?鈹?  鈹斺攢鈹€ 绠€鎶ヨ鎯?鈹斺攢鈹€ 鎴戠殑锛堣缃級
    鈹溾攢鈹€ 瀛╁瓙绠＄悊锛堟坊鍔?缂栬緫锛?    鈹溾攢鈹€ 瀛︿範璁剧疆锛堟椂闂寸獥鍙?寮哄害/瀛︾锛?    鈹溾攢鈹€ 璁㈤槄绠＄悊
    鈹溾攢鈹€ 閭€璇峰浜?    鈹斺攢鈹€ 璐︽埛璁剧疆
```

### Step 1-7: 閫愰〉寮€鍙?
> 姣忎釜椤甸潰鎸変互涓嬫祦绋?
> 1. 鍒涘缓椤甸潰缁勪欢楠ㄦ灦
> 2. 瀹炵幇 UI 甯冨眬
> 3. 瀵规帴 API
> 4. 澶勭悊鍔犺浇/閿欒/绌虹姸鎬?> 5. 鏈湴娴嬭瘯

### Step 8: 鎻愪氦

```bash
git add apps/wechat-miniapp/src/pages/parent/ apps/wechat-miniapp/src/stores/ apps/wechat-miniapp/src/services/
git commit -m "feat: implement parent-side miniapp with dashboard, approval, briefing"
```

---

## Task 15: 鍓嶇 鈥?瀛╁瓙绔皬绋嬪簭

**鐩爣:** 鏋勫缓瀛╁瓙绔皬绋嬪簭鐨勬墍鏈夊涔犱氦浜掗〉闈€?
**Files (apps/wechat-miniapp/src/):**
- Create: `pages/child/home/index.vue` (瀛︿範涓婚〉)
- Create: `pages/child/english/word-session.vue` (鍗曡瘝瀛︿範浼氳瘽)
- Create: `pages/child/english/pronunciation.vue` (鍙戦煶缁冧範)
- Create: `pages/child/english/sentence.vue` (鎯呮櫙閫犲彞)
- Create: `pages/child/english/reading.vue` (鍒嗙骇闃呰)
- Create: `pages/child/english/dialogue.vue` (鍙ｈ瀵硅瘽)
- Create: `pages/child/achievements/index.vue` (鎴愬氨涓績)
- Create: `pages/child/profile/index.vue` (鎴戠殑瀛︿範)
- Create: `components/ai-teacher/chat-bubble.vue` (AI 瀵硅瘽姘旀场)
- Create: `components/ai-teacher/voice-recorder.vue` (璇煶褰曞埗)
- Create: `components/gamification/points-popup.vue` (绉垎寮圭獥)
- Create: `components/gamification/achievement-toast.vue` (鎴愬氨瑙ｉ攣鎻愮ず)
- Create: `stores/child.ts` (瀛╁瓙绔姸鎬佺鐞?

### 鏍稿績椤甸潰缁撴瀯

```
瀛╁瓙绔?TabBar:
鈹溾攢鈹€ 瀛︿範锛堝涔犱富椤碉級
鈹?  鈹溾攢鈹€ 浠婃棩瀛︿範浠诲姟鍒楄〃
鈹?  鈹溾攢鈹€ 褰撳墠杩涘害锛堢Н鍒?绛夌骇/杩炵画鎵撳崱锛?鈹?  鈹斺攢鈹€ 姣忔棩鎸戞垬鍏ュ彛
鈹溾攢鈹€ 鎴愬氨锛堟垚灏变腑蹇冿級
鈹?  鈹溾攢鈹€ 宸茶幏寰楀窘绔犲睍绀?鈹?  鈹溾攢鈹€ 鏈В閿佹垚灏憋紙鍚繘搴︽潯锛?鈹?  鈹斺攢鈹€ 绛夌骇鍜岀Н鍒?鈹斺攢鈹€ 鎴戠殑锛堜釜浜轰腑蹇冿級
    鈹溾攢鈹€ 瀛︿範璁板綍
    鈹斺攢鈹€ 璁剧疆锛堝ご鍍?鏄电О锛?```

### 鍏抽敭浜や簰: 鍗曡瘝瀛︿範浼氳瘽椤?
```
鈹屸攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹?鈹?  馃専 绉垎: 150  绛夌骇: 2  鈹?鈹溾攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹?鈹?                        鈹?鈹? AI鏁欏笀澶村儚 + 瀵硅瘽姘旀场:  鈹?鈹? "鎴戜滑鏉ヨ璇嗕竴涓柊鏈嬪弸锛? 鈹?鈹?  馃惐 杩欎釜鍗曡瘝鏄?cat"     鈹?鈹?                        鈹?鈹? 鈹屸攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹?鈹?鈹? 鈹? c a t             鈹?鈹?鈹? 鈹? /k忙t/  馃攰         鈹?鈹?鈹? 鈹? [鐐瑰嚮鎾斁鍙戦煶]      鈹?鈹?鈹? 鈹斺攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹?鈹?鈹?                        鈹?鈹? AI: "cat 鏄粈涔堟剰鎬濆憿锛? 鈹?鈹?                        鈹?鈹? 鈹屸攢鈹€鈹?鈹屸攢鈹€鈹?鈹屸攢鈹€鈹?鈹屸攢鈹€鈹? 鈹?鈹? 鈹傜尗鈹?鈹傜嫍鈹?鈹傞笩鈹?鈹傞奔鈹? 鈹?鈹? 鈹斺攢鈹€鈹?鈹斺攢鈹€鈹?鈹斺攢鈹€鈹?鈹斺攢鈹€鈹? 鈹?鈹?                        鈹?鈹? [馃帳 璇煶鍥炵瓟]  [鉁?鎵撳瓧] 鈹?鈹?                        鈹?鈹? 杩涘害: 鈻堚枅鈻堚枅鈻戔枒 4/10      鈹?鈹斺攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹?```

### Step 1-7: 閫愰〉寮€鍙戯紙鍚?Task 14 娴佺▼锛?
### Step 8: 鎻愪氦

```bash
git add apps/wechat-miniapp/src/pages/child/ apps/wechat-miniapp/src/components/
git commit -m "feat: implement child-side miniapp with all English learning scenarios"
```

---

## Task 16: 闆嗘垚娴嬭瘯涓?E2E

**鐩爣:** 缂栧啓鏍稿績娴佺▼鐨勯泦鎴愭祴璇曞拰绔埌绔祴璇曘€?
**Files:**
- Create: `apps/backend/test/auth.e2e-spec.ts`
- Create: `apps/backend/test/child-management.e2e-spec.ts`
- Create: `apps/backend/test/word-learning-flow.e2e-spec.ts`
- Create: `apps/backend/test/push-approval-flow.e2e-spec.ts`

### 鏍稿績 E2E 娴嬭瘯鍦烘櫙

```typescript
// apps/backend/test/word-learning-flow.e2e-spec.ts
describe('瀹屾暣鐨勫崟璇嶅涔犳祦绋?(E2E)', () => {
  it('瀹堕暱娉ㄥ唽 鈫?娣诲姞瀛╁瓙 鈫?璁㈤槄鑻辫 鈫?AI鎺ㄩ€?鈫?瀹堕暱瀹℃壒 鈫?瀛╁瓙瀛︿範 鈫?绠€鎶ョ敓鎴?, async () => {
    // 1. 瀹堕暱娉ㄥ唽骞跺垱寤哄搴?    // 2. 娣诲姞瀛╁瓙锛堝皬瀛?骞寸骇锛?    // 3. 璁㈤槄鑻辫瀛︾
    // 4. 璁剧疆瀛︿範鏃堕棿绐楀彛
    // 5. 瑙﹀彂 AI 鎺ㄩ€佽皟搴?    // 6. 楠岃瘉瀹堕暱鏀跺埌寰呭鎵规帹閫?    // 7. 瀹堕暱瀹℃壒閫氳繃
    // 8. 楠岃瘉瀛╁瓙绔敹鍒板涔犱换鍔?    // 9. 妯℃嫙瀛╁瓙瀹屾垚鍗曡瘝瀛︿範浼氳瘽
    // 10. 楠岃瘉鑹惧娴╂柉杩涘害鏇存柊
    // 11. 楠岃瘉鍗虫椂绠€鎶ョ敓鎴?    // 12. 楠岃瘉绉垎鍜屾垚灏辨洿鏂?  });
});
```

### 杩愯娴嬭瘯

```bash
cd apps/backend
yarn test:e2e --verbose
```

### 鏈€缁堟彁浜?
```bash
git add apps/backend/test/
git commit -m "test: add E2E tests for core learning flows"
```

---

## 闄勫綍 A: API 璺敱鎬昏

```
POST   /auth/send-code          # 鍙戦€侀獙璇佺爜
POST   /auth/verify              # 楠岃瘉鐮佺櫥褰?
GET    /family                   # 鑾峰彇瀹跺涵淇℃伅
POST   /family/invite            # 閭€璇峰闀?
POST   /children                 # 娣诲姞瀛╁瓙
GET    /children                 # 瀛╁瓙鍒楄〃
GET    /children/:id             # 瀛╁瓙璇︽儏
PATCH  /children/:id             # 鏇存柊瀛╁瓙淇℃伅
GET    /children/:id/profile     # 鑾峰彇鍏ㄤ汉鍖栨。妗?
PUT    /children/:id/settings/:subject  # 璁剧疆瀛︿範鍙傛暟

POST   /english/word-learning/session/start         # 寮€濮嬪崟璇嶅涔?POST   /english/word-learning/session/:id/answer     # 鎻愪氦绛旀
POST   /english/word-learning/session/:id/end        # 缁撴潫瀛︿範
GET    /english/word-learning/progress/:childId      # 瀛︿範杩涘害

POST   /english/pronunciation/session/start          # 鍙戦煶缁冧範
POST   /english/sentence/session/start               # 鎯呮櫙閫犲彞
POST   /english/reading/session/start                # 鍒嗙骇闃呰
POST   /english/dialogue/session/start               # 鍙ｈ瀵硅瘽

GET    /pushes/pending                               # 寰呭鎵规帹閫?POST   /pushes/:id/approve                           # 瀹℃壒鎺ㄩ€?GET    /pushes/history/:childId                      # 鎺ㄩ€佸巻鍙?
GET    /briefings/:childId                           # 瀛︿範绠€鎶ュ垪琛?GET    /briefings/detail/:id                         # 绠€鎶ヨ鎯?
GET    /gamification/:childId                        # 娓告垙鍖栨瑙?GET    /gamification/:childId/achievements           # 鎴愬氨鍒楄〃
```

## 闄勫綍 B: 鐜鍙橀噺

```env
# apps/backend/.env
DATABASE_URL="postgresql://ichild:ichild_dev_2026@localhost:5432/ichild"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-jwt-secret-change-in-production"
JWT_EXPIRES_IN="7d"

# AI 鐩稿叧
AI_PROVIDER="anthropic"  # anthropic | openai
ANTHROPIC_API_KEY="sk-ant-xxx"
# OPENAI_API_KEY="sk-xxx"

# 璇煶鏈嶅姟
STT_PROVIDER="wechat"  # wechat | xunfei
TTS_PROVIDER="wechat"

# 鐭俊楠岃瘉鐮?SMS_PROVIDER="aliyun"
SMS_ACCESS_KEY=""
SMS_ACCESS_SECRET=""
SMS_SIGN_NAME=""
SMS_TEMPLATE_CODE=""
```

## 闄勫綍 C: 鍚庣画杩唬锛圥hase 2-3锛?
Phase 1 MVP 瀹屾垚鍚庯紝鏍稿績鏋舵瀯锛圓I 璁板繂寮曟搸銆佹帹閫佸鎵规祦銆佹父鎴忓寲绯荤粺锛夊凡楠岃瘉锛屽悗缁墿灞?

- **Phase 2 (M4-M5)**: 澶嶇敤鑻辫妯″潡鐨勬灦鏋勶紝娣诲姞 `apps/backend/src/chinese/` 璇枃妯″潡
- **Phase 3 (M6-M7)**: 娣诲姞 `apps/backend/src/math/` 鏁板妯″潡锛屽惈鎷嶇収璇嗗埆鎵规敼
- **鍚庣画杩唬**: 鍛?鏈堟姤鍛娿€佹垚闀挎椂闂寸嚎銆佸搴椁愪紭鎯犮€佺ぞ浜ゅ姛鑳界瓑


