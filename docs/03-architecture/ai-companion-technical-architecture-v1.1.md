# AI智慧学伴技术架构设计文档（评审版）

**文档版本**: v1.1  
**日期**: 2026-03-07  
**适用阶段**: Phase 1 英语 MVP（M1-M3）  
**关联文档**: `docs/01-prd/ai-companion-prd-v1.0.md`、`docs/02-product-design/ai-companion-product-design-v1.0.md`

---

## 1. 执行摘要

本架构用于支撑以下核心目标：
- AI教师具备可持续进化的一对一长期记忆
- 孩子学习体验千人千面
- 家长拥有关键学习决策控制权（审批流）
- 在英语MVP阶段快速上线并可运营验证

核心结论：
- **最佳实践不是单一框架，而是“分层可替换架构”**。
- `Mastra` 适合作为当前 TypeScript 技术栈下的 Agent 编排与记忆实现，但不应替代业务主干。
- 业务主干（账户、订阅、审批、学科规则、报表）保持在 `NestJS + Prisma + PostgreSQL`。

---

## 2. 背景与约束

### 2.1 已确定技术前提
- 前端：`uni-app`（微信小程序）
- 后端脚手架：`fullstack-turborepo-starter`（NestJS + Prisma + PostgreSQL）

### 2.2 业务硬约束（来自PRD）
- API 响应：P95 < 500ms
- AI教师回复：P95 < 3s
- 并发规模：1000+
- 家长审批流：AI推荐 -> 家长审批 -> 孩子执行 -> 即时简报
- 全人化记忆：学习层、认知层、情感层、策略层持续更新
- 千人千面：动态路径而非固定课程
- 儿童隐私与安全合规

### 2.3 设计目标
- 快速上线：Phase 1 2-4周形成可验证闭环
- 可演进：Phase 2/3 平滑扩展语文/数学
- 可替换：编排层、模型层、向量层可独立替换

---

## 3. 最佳实践与技术选型立场

### 3.1 “Mastra是否最佳实践”结论
- **不是唯一最佳实践**。
- **在当前项目上下文中是高匹配实现**：TypeScript 原生、工作流暂停恢复（Human-in-the-loop）、记忆机制成熟。
- 最优做法：Mastra 作为“AI编排层”，不是“系统内核”。

### 3.2 本项目最佳实践定义
1. 业务主干自有化（NestJS 域驱动）
2. Agent 编排可替换（Mastra/LangGraph 可灰度替换）
3. 长期记忆分层（结构化+语义+会话）
4. 家长审批是工作流一等公民
5. 模型网关化（统一协议、路由、限流、降级）
6. 观测与评测前置（避免模型或提示词回退）

---

## 4. 总体技术架构

### 4.1 分层架构图（逻辑）

```text
[uni-app 家长端/孩子端]
        |
        v
[API Gateway / BFF - NestJS]
        |
        +--> Auth & Family Domain
        +--> Child/Profile Domain
        +--> Learning Domain (英语5场景)
        +--> Push & Approval Domain
        +--> Report & Gamification Domain
        |
        +--> AI Orchestrator Layer (Mastra)
                |
                +--> Memory Service
                |      +--> Redis (会话短期记忆/缓存/队列)
                |      +--> PostgreSQL JSONB (结构化全人画像)
                |      +--> pgvector (语义长期记忆)
                |
                +--> Workflow Engine
                |      +--> suspend/resume (家长审批)
                |
                +--> Model Gateway (LiteLLM)
                       +--> OpenAI / Anthropic / DeepSeek / 本地模型

[Observability]
+--> Langfuse (Prompt/Trace/Score)
+--> OpenTelemetry + Prometheus + Grafana
```

### 4.2 部署形态（推荐）
- 单仓库 monorepo，业务 API 与 AI 编排同仓管理。
- 运行时为多服务容器：`api`、`postgres`、`redis`、`litellm`、`langfuse`。
- 初期可单机部署，后续按服务拆分水平扩展。

---

## 5. 需求到技术栈逐项映射

| 需求能力 | 技术实现 | 说明 |
|---|---|---|
| 孩子一对一长期记忆 | Mastra Memory + PostgreSQL(JSONB) + pgvector + Redis | `resourceId=childId` 做长期记忆主键 |
| 家长审批流 | Mastra Workflow suspend/resume + NestJS 审批接口 | 支持暂停等待家长动作后恢复 |
| 千人千面路径 | 规则打分引擎（P1）+ 工作流策略节点 | P2 增加 bandit/推荐模型 |
| 英语五大学习场景 | NestJS 学习域服务 + AI工具节点 | 业务规则在域层，生成在AI层 |
| AI多模型切换与控成本 | LiteLLM | 路由、限流、fallback、账单归因 |
| 即时简报 | 异步任务队列 + 报表服务 | 会话结束后30秒内生成 |
| 游戏化激励 | Gamification Domain + 事件驱动 | 积分/徽章/等级/打卡 |
| 质量可观测 | Langfuse + OTel + Prometheus | 跟踪回复质量、时延与失败率 |
| 安全合规 | JWT + 字段加密 + 审计日志 + 最小权限 | 儿童数据保护优先 |

---

## 6. 核心业务流程设计（时序）

### 6.1 流程A：AI推送与家长审批

```text
1. Scheduler 每小时扫描 child 学习状态
2. AI Orchestrator 读取画像 + 记忆曲线 + 时间窗口
3. 生成推送建议（原因、内容、预期效果）
4. Workflow 进入 suspend，通知家长审批
5. 家长确认/修改/拒绝/延后
6. Workflow resume
7. 已确认任务下发孩子端
```

### 6.2 流程B：孩子学习会话与长期记忆更新

```text
1. 孩子进入任务会话
2. AI教师多轮交互（文字/语音/图片）
3. 每轮输出结构化结果（对错、反馈、鼓励、下一步）
4. 会话完成后触发记忆写入
5. 更新结构化画像（L1）
6. 关键事件向量化写入（L2）
7. 触发简报生成与积分结算
```

### 6.3 流程C：即时简报生成

```text
1. 学习会话结束发布事件 session.completed
2. Report Service 聚合指标（正确率、新词、进步点、薄弱点）
3. LLM 生成一句话总结与可执行建议
4. 推送家长端并入历史记录
```

---

## 7. 数据架构设计

### 7.1 数据分层
- 事务主数据：`PostgreSQL`
- 会话缓存与队列：`Redis`
- 语义检索：`pgvector`（在 PostgreSQL 内）

### 7.2 核心实体（建议）

1. `family`
- id, created_at

2. `parent_user`
- id, family_id, phone, wechat_openid, role

3. `child`
- id, family_id, name, grade, k12_stage, birthday

4. `child_profile`（结构化全人画像，JSONB）
- child_id
- learning_profile_json
- cognitive_profile_json
- emotion_profile_json
- strategy_profile_json
- version, updated_at

5. `memory_event`（语义记忆）
- id, child_id, session_id
- event_type
- content_text
- embedding(vector)
- importance_score
- created_at

6. `learning_session`
- id, child_id, subject, scenario, status
- start_at, end_at
- accuracy, duration_sec

7. `push_recommendation`
- id, child_id, reason, expected_outcome, content_json
- scheduled_at, status, parent_action, parent_feedback

8. `session_report`
- id, session_id, child_id, summary, strengths, weaknesses, advice

9. `game_profile`
- child_id, points, level, streak_days

10. `badge_record`
- id, child_id, badge_code, granted_at

### 7.3 主键策略与索引建议
- 所有业务表使用 `uuid`
- 高频索引：`child_id + created_at`、`status + scheduled_at`
- 向量检索索引：`ivfflat/hnsw`（按 pgvector 版本能力）

---

## 8. AI架构与提示词工程

### 8.1 提示词分层
- System Prompt：教学边界、安全规则、输出格式
- Age Prompt：按 6-8/9-11/12-15 语言风格切换
- Child Prompt：孩子画像与当前薄弱点
- Task Prompt：当前任务目标与评测标准

### 8.2 输出协议（必须结构化）
统一 JSON Schema：
- correctness
- feedback
- encouragement
- next_action
- memory_candidate
- parent_visible_summary

### 8.3 记忆写入策略
- 非每轮都写入，只写高价值事件
- 引入置信度阈值与去重策略
- 家长关键反馈可覆盖画像字段

### 8.4 模型调用策略
- 高频低风险任务：小模型优先
- 关键教学节点：强模型
- 超时与失败：自动降级模板回复 + 重试队列

---

## 9. 非功能架构设计

### 9.1 性能设计
- API P95<500ms：读写分离、缓存前置、慢查询治理
- AI P95<3s：短上下文、分层召回、模型路由与超时控制

### 9.2 可用性设计
- 目标 99.5%
- 服务健康检查 + 自动重启
- 关键链路熔断与降级

### 9.3 安全与合规
- JWT 鉴权 + RBAC
- 手机号等敏感字段加密
- 操作审计日志（审批、画像修改、导出）
- 儿童隐私：最小化收集、可删除、可追踪

### 9.4 数据治理
- 每日备份
- 灾备演练
- 数据保留和脱敏策略

---

## 10. 可观测与评测体系

### 10.1 线上可观测
- 业务指标：审批通过率、学习完成率、单词掌握率
- AI指标：延迟、错误率、tokens、单次成本
- 体验指标：会话中断率、语音评测成功率

### 10.2 离线评测
- Prompt 回归集（按年级、场景、难度分层）
- 发布前必须通过评测基线
- 失败样本自动回流到优化池

### 10.3 告警策略
- AI响应超时率阈值告警
- 推送积压告警
- 审批链路异常告警

---

## 11. 基础设施与部署设计

### 11.1 容器编排（Phase 1）
- `api`（NestJS）
- `postgres`（含 pgvector 扩展）
- `redis`
- `litellm`
- `langfuse`

### 11.2 环境划分
- `dev`：单机 Docker Compose
- `staging`：预发压测与评测
- `prod`：生产环境，分服务扩容

### 11.3 CI/CD 要求
- PR 自动测试（单元+契约）
- AI评测门禁（Prompt 回归）
- 变更记录与回滚机制

---

## 12. 分阶段实施计划

### 12.1 Phase 1（M1-M3）
1. M1：账户体系、孩子建档、基础学习会话
2. M2：AI记忆分层、推送审批流、即时简报
3. M3：五大学习场景完善、游戏化、稳定性压测

### 12.2 Phase 2（M4-M5）
- 语文接入
- 推荐策略增强（bandit/排序）
- 画像解释能力增强

### 12.3 Phase 3（M6-M7）
- 数学接入
- 拍照批改与错因分析
- 向量层按规模评估是否迁移 Qdrant

---

## 13. 技术风险与缓解

| 风险 | 影响 | 缓解措施 |
|---|---|---|
| LLM 成本超支 | 高 | LiteLLM 路由、缓存、分级模型策略 |
| AI响应超时 | 高 | 超时降级、短上下文、检索优化 |
| 记忆污染 | 中 | 阈值写入、去重、家长纠偏 |
| 审批流中断 | 中 | 工作流可恢复、幂等操作 |
| 合规风险 | 高 | 数据分级、加密、审计、最小化采集 |
| 平台绑定风险 | 中 | 编排层可替换，业务域不耦合框架 |

---

## 14. 架构决策记录（ADR）

1. 采用 `NestJS` 作为业务主干：保障领域模型稳定。
2. 引入 `Mastra` 作为 AI 编排层：满足审批流 suspend/resume 与记忆能力。
3. 采用 `pgvector` 而非首期引入独立向量库：减少运维复杂度。
4. 采用 `LiteLLM` 作为统一模型网关：控成本与多模型路由。
5. 采用 `Langfuse` 作为 LLM 可观测与评测数据中枢。

---

## 15. 评审结论与待拍板项

### 15.1 建议通过项
- 架构主线：`uni-app + NestJS + Mastra + Postgres/pgvector + Redis + LiteLLM + Langfuse`
- MVP 以英语场景先行，验证留存与转化

### 15.2 待拍板项
1. 是否在 P1 即引入 `Mastra`，还是先 `LangGraph.js` 轻量实现
2. 是否启用“家长自动审批”策略作为可选开关
3. 是否在 P1 同时引入多模型，或先单模型再扩展
4. 音频与图片存储选型（云厂商或自建对象存储）

---

## 16. 参考资料

- Mastra: https://github.com/mastra-ai/mastra  
- Mastra 文档: https://mastra.ai/docs  
- LiteLLM: https://github.com/BerriAI/litellm  
- Langfuse: https://github.com/langfuse/langfuse  
- pgvector: https://github.com/pgvector/pgvector  
- LangGraph.js: https://github.com/langchain-ai/langgraphjs  
- LangChain.js: https://github.com/langchain-ai/langchainjs

---

**附注**  
本版为“可提交评审”的架构正文，后续可直接拆解为实施任务（模块创建、表结构迁移、接口开发、链路压测、灰度上线）。

