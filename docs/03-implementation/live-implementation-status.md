# AI智慧学伴 实现状态记录

**更新时间**: 2026-03-10  
**适用范围**: 当前工作树 `frontend/` + `backend/`  
**状态说明**: 本文档记录已经落地并验证过的实现进度，不等同于 PRD 全量完成状态。

---

## 1. 当前结论

当前仓库已经从“前端有目标 API、后端仍是 starter 脚手架”的状态，推进到：

- 后端具备可运行的业务 API 基线
- 前端默认 API 地址已与后端对齐
- A-D1 的 Prisma 主干模型已落入代码
- `health / auth / family / children / pushes / content / learning` 七组后端接口已具备可运行实现

但当前仍然是 **阶段 A 完成，阶段 B 大体落地，阶段 C 完成后端闭环首版，阶段 D1 已进入最小学习闭环实现阶段**。

---

## 2. 已完成事项

## 2.1 文档产出已完成

已新增并完成以下文档：

- `docs/03-implementation/ai-companion-phase1-prd-implementation-plan-v1.0.md`
- `docs/03-implementation/ai-companion-phase1-a-d1-task-breakdown-v1.0.md`
- `docs/04-architecture/ai-companion-phase1-a-d1-technical-architecture-v1.0.md`
- `docs/04-architecture/ai-companion-phase1-a-d1-prisma-schema-draft-v1.0.md`
- `docs/05-api/ai-companion-phase1-a-d1-nestjs-api-list-v1.0.md`

说明：

- 需求、架构、数据模型、接口和任务拆解已经形成完整闭环
- 后续代码实现应以这些文档为准

## 2.2 后端工程基线已完成

已完成以下基线调整：

- 删除旧的 `Hello World` 示例入口
- 后端统一启用 `/api` 全局前缀
- 开启 CORS
- Swagger 标题已切换为 `Meglow API`
- 增加统一异常过滤器
- 增加全局 `ValidationPipe` 与统一验证错误结构
- 环境变量校验放宽为支持当前无数据库开发模式
- Prisma 服务在缺少 `DATABASE_URL` 时不再阻塞启动
- 接入正式 JWT 依赖与鉴权基础设施

对应文件：

- `backend/apps/api/src/main.ts`
- `backend/apps/api/src/app.module.ts`
- `backend/apps/api/src/common/filters/api-exception.filter.ts`
- `backend/apps/api/src/config/environment-variables.ts`
- `backend/apps/api/src/persistence/prisma/prisma.service.ts`

## 2.3 Prisma schema 首版已完成

已将 `backend/apps/api/prisma/schema.prisma` 从示例 `User` 模型重写为 A-D1 主干模型，覆盖：

- 家长与家庭
- 孩子与设置
- 推送与任务
- 英语单词与学习进度
- 学习会话与发音尝试

当前 schema 已包含：

- 枚举：
  - `ParentRole`
  - `Gender`
  - `K12Stage`
  - `SubjectType`
  - `PushStatus`
  - `PushActionType`
  - `TaskStatus`
  - `SessionStatus`
  - `LearningItemType`
- 模型：
  - `Parent`
  - `Family`
  - `FamilyMembership`
  - `VerificationCode`
  - `FamilyInvite`
  - `Child`
  - `ChildProfile`
  - `ChildGameProfile`
  - `ChildLearningSettings`
  - `EnglishWord`
  - `ChildWordProgress`
  - `LearningPush`
  - `LearningPushActionLog`
  - `LearningTask`
  - `LearningSession`
  - `LearningSessionItem`
  - `PronunciationAttempt`

## 2.4 后端业务骨架已完成

已新增以下模块：

- `health`
- `auth`
- `family`
- `children`
- `pushes`
- `dev-data`
- `common`

其中：

- `health` 提供健康检查
- `auth` 提供验证码发送、登录、JWT、当前会话查询
- `family` 提供第二位家长邀请与接受邀请
- `children` 提供孩子列表、创建、详情、学习设置，并真实初始化画像与游戏化档案
- `pushes` 提供待审批推送、审批动作、任务查询、状态流转与审批日志
- `dev-data` 提供开发态内存数据存储与最小业务逻辑

说明：

- `auth / family / children / pushes` 当前已切到 Prisma 持久化实现
- `DevDataService` 仍保留在代码库中，但已不再挂入主流程
- 当前推送生成仍是规则种子逻辑，不是完整学习引擎

## 2.5 前端联调基线已完成

已完成：

- 前端默认 API 地址从 `http://localhost:3000/api` 修正为 `http://localhost:5002/api`

对应文件：

- `frontend/src/services/http/client.ts`

这意味着：

- 当前前端默认配置已经可以直接请求新的后端 API 基线

---

## 3. 已验证结果

本轮已完成以下验证：

## 3.1 后端构建通过

已执行：

```bash
yarn workspace api build
```

结果：

- 通过

## 3.2 后端 e2e 通过

已执行：

```bash
yarn workspace api test:e2e
```

结果：

- 通过

当前覆盖：

- `GET /api/health`

## 3.3 Prisma schema 校验通过

已执行：

```bash
npx prisma validate --schema prisma/schema.prisma
```

说明：

- 需要提供临时 `DATABASE_URL` 才能运行 Prisma 校验
- 在提供临时环境变量后，schema 校验通过

## 3.4 业务初始 migration 已更新

已完成：

- 删除旧的 starter `User` migration
- 新增与当前业务 schema 对齐的初始 migration

说明：

- 当前 Prisma migration 基线已不再停留在示例模型

---

## 4. 阶段进度判断

## 阶段 A: 基线与工程对齐

状态：

- 已完成

已完成内容：

- 后端 API 不再是 starter 示例入口
- API 路径、端口、Swagger、异常响应已统一
- 前后端默认联调地址已对齐
- Prisma schema 已切换到业务模型

## 阶段 B: 家庭账户与孩子建档

状态：

- 基本完成

已完成内容：

- 基于数据库的验证码发送与校验
- 正式 JWT 登录与 `GET /auth/me`
- 首次登录自动创建家庭与主家长身份
- 第二位家长邀请与接受邀请
- 孩子创建、列表、详情真实落库
- `ChildProfile / ChildGameProfile / ChildLearningSettings` 初始化
- K12 阶段映射逻辑

未完成内容：

- 前端登录与邀请页实机联调验证
- 更完整的家庭成员权限细则

## 阶段 C: 家长端审批与学习设置闭环

状态：

- 后端首版已完成

已完成内容：

- 学习设置真实读写接口
- 待审批推送真实落库
- 审批动作与审批日志落库
- 孩子任务列表与状态流转落库
- 基于学习设置的规则种子推送与任务生成逻辑

未完成内容：

- 家庭维度的更完整权限校验
- 与前端现有页面的实机联调验证
- 更完整的推送去重与调度策略

## 阶段 D1: 英语最小学习闭环

状态：

- 未开始

说明：

- 当前仅有 Prisma 模型设计
- 尚未开始 `learning` 模块、会话生成、答题提交、发音评测接入

---

## 5. 当前实现边界

为避免误判，当前代码实现的边界如下：

### 已具备

- 可运行的后端基础 API
- 正式 JWT 登录与会话上下文
- 基于 Prisma 的家庭、孩子、设置、推送、任务数据
- 第二位家长邀请链路
- 审批日志与任务状态流转
- 业务主干 Prisma schema

### 尚不具备

- 英语学习会话引擎
- AI 记忆与学习简报
- 游戏化能力

---

## 6. 当前技术债与风险

## 6.1 业务集成测试覆盖仍然偏弱

当前自动化验证仍以构建、schema 校验和 `GET /api/health` 为主，尚未覆盖登录、邀请、建档、设置、审批整链路。

影响：

- 核心业务路径的回归风险较高
- 数据库写路径缺少自动化保护

处理建议：

- 下一阶段优先补齐服务层/端到端测试

## 6.2 推送生成仍是最小规则种子逻辑

当前 `pushes` 虽已落库，但生成逻辑仍是最小可运行规则，不包含真实英语学习进度驱动。

影响：

- 待审批内容还不足以代表 D1 的真实业务价值
- 后续 `content / learning` 模块接入时仍需重构部分生成策略

处理建议：

- 在进入 D1 前补 content 词库与 progress 驱动逻辑

## 6.3 前端尚未完成本轮回归验证

虽然前端 API base 已修正，后端主路径也已切到 Prisma + JWT，但本轮没有完成小程序端页面联调回归。

影响：

- 不能认定前端已经完成真实联调

处理建议：

- 立即对登录、邀请、孩子、设置、审批、任务页做一轮最小联调

---

## 7. 下一步建议

按当前进度，建议后续顺序如下：

1. 补齐登录、邀请、建档、设置、审批链路测试
2. 联调当前前端的登录、邀请、孩子、设置、审批、任务页
3. 开始 `content` 模块与词库数据
4. 开始 `learning` 模块，进入阶段 D1
5. 用真实学习进度替换当前规则种子推送

---

## 8. 本文档用途

本文档用于：

- 记录当前工作树真实实现状态
- 区分“已实现”与“仅设计完成”
- 作为下一轮开发启动前的基线说明

后续每次有里程碑推进，应更新本文档，而不是只更新计划文档。

---

## 9. 增量更新（2026-03-10）

本轮已继续推进真实业务场景，实现结果如下：

- 新增 `content` 模块，提供英语词库查询与详情接口，并落入真实 `EnglishWord` 数据
- 新增 `learning` 模块，提供学习会话创建、会话详情、答题提交、会话完成四组接口
- `pushes` 已从硬编码示例词切换为基于词库与 `ChildWordProgress` 的最小推荐逻辑
- 学习会话可由真实 `LearningTask` 创建，生成词义题与拼写题，并在完成后回写 `ChildWordProgress`
- `LearningTask` 可在会话完成后推进到 `COMPLETED`

本轮新增验证：

- `yarn workspace api build` 通过
- `yarn workspace api test --runInBand` 通过
- `yarn workspace api test:e2e` 通过
- e2e 已覆盖登录、建档、学习设置、待审批推送、任务投递、学习会话、答题提交、会话完成整条链路
