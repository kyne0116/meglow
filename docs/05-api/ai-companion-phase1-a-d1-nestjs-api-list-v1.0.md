# AI智慧学伴 Phase 1 A-D1 NestJS 接口清单

**版本**: v1.0  
**日期**: 2026-03-10  
**适用阶段**: 阶段 A - 阶段 D1  
**基础前缀**: `/api`

---

## 1. 文档目标

本文档定义 A-D1 阶段的 NestJS 接口清单，面向：

- 控制器与 DTO 开发
- 前后端联调
- Swagger 文档整理
- E2E 用例编写

本文档关注：

- 模块划分
- 路由
- 请求/响应结构
- 校验规则
- 鉴权要求

---

## 2. 通用约定

## 2.1 鉴权

除下列接口外，其余接口都要求 JWT：

- `POST /api/auth/send-code`
- `POST /api/auth/login`
- `POST /api/families/invite/accept`
- `GET /api/health`

## 2.2 成功响应

默认直接返回业务对象，不包裹 `data` 外层。

## 2.3 错误响应

```json
{
  "code": "FORBIDDEN",
  "message": "child does not belong to current family",
  "details": {}
}
```

建议错误码：

- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `RATE_LIMITED`
- `INTERNAL_ERROR`

## 2.4 公共 Header

- `Authorization: Bearer <token>`
- `X-Request-Id` 可选，用于链路追踪

---

## 3. Health 模块

## 3.1 GET /api/health

### 说明

健康检查接口。

### 鉴权

- 不需要

### 响应

```json
{
  "status": "ok",
  "timestamp": "2026-03-10T08:00:00.000Z"
}
```

---

## 4. Auth 模块

## 4.1 POST /api/auth/send-code

### 说明

发送短信验证码。

### 请求体

```json
{
  "phone": "13800138000"
}
```

### 校验规则

- `phone` 必填
- 符合中国大陆手机号格式

### 响应

```json
{
  "success": true,
  "expiresInSec": 60
}
```

### 错误

- 发送频率过高
- 手机号格式非法

## 4.2 POST /api/auth/login

### 说明

验证码登录。

### 请求体

```json
{
  "phone": "13800138000",
  "verificationCode": "123456"
}
```

### 响应

```json
{
  "accessToken": "jwt-token",
  "expiresIn": "7d",
  "parentId": "uuid",
  "familyId": "uuid"
}
```

### 业务规则

- 验证码必须未过期且未使用
- 首次登录自动创建家庭和主家长身份

## 4.3 GET /api/auth/me

### 说明

返回当前登录家长上下文。

### 响应

```json
{
  "parentId": "uuid",
  "familyId": "uuid",
  "phone": "13800138000",
  "nickname": null,
  "role": "OWNER"
}
```

---

## 5. Family 模块

## 5.1 POST /api/families/invite

### 说明

邀请第二位家长加入家庭。

### 鉴权

- 需要

### 请求体

```json
{
  "phone": "13900139000"
}
```

### 响应

```json
{
  "inviteId": "uuid",
  "token": "invite-token",
  "expiresAt": "2026-03-11T08:00:00.000Z"
}
```

### 业务规则

- 当前家庭最多 2 位家长
- 不能邀请自己

## 5.2 POST /api/families/invite/accept

### 说明

接受家长邀请。

### 请求体

```json
{
  "token": "invite-token",
  "phone": "13900139000",
  "verificationCode": "123456"
}
```

### 响应

```json
{
  "accessToken": "jwt-token",
  "expiresIn": "7d",
  "parentId": "uuid",
  "familyId": "uuid"
}
```

### 业务规则

- token 未过期
- 邀请手机号与接受手机号一致

---

## 6. Children 模块

## 6.1 GET /api/children

### 说明

获取当前家庭下的孩子列表。

### 响应

```json
[
  {
    "id": "uuid",
    "familyId": "uuid",
    "name": "小明",
    "gender": "MALE",
    "grade": 3,
    "k12Stage": "MIDDLE_PRIMARY"
  }
]
```

## 6.2 POST /api/children

### 说明

新增孩子。

### 请求体

```json
{
  "name": "小明",
  "gender": "MALE",
  "birthDate": "2018-01-01",
  "grade": 3,
  "avatarUrl": null
}
```

### 校验规则

- `name` 必填
- `grade` 范围 `1..9`
- `gender` 枚举合法

### 响应

```json
{
  "id": "uuid",
  "familyId": "uuid",
  "name": "小明",
  "gender": "MALE",
  "grade": 3,
  "k12Stage": "MIDDLE_PRIMARY"
}
```

### 业务规则

- 创建时同步初始化 `ChildProfile` 与 `ChildGameProfile`
- 家庭最多 5 个孩子

## 6.3 GET /api/children/:id

### 说明

获取孩子详情。

### 响应

```json
{
  "id": "uuid",
  "familyId": "uuid",
  "name": "小明",
  "gender": "MALE",
  "birthDate": "2018-01-01T00:00:00.000Z",
  "grade": 3,
  "k12Stage": "MIDDLE_PRIMARY",
  "avatarUrl": null
}
```

### 业务规则

- 必须属于当前家庭

## 6.4 GET /api/children/:id/settings

### 说明

获取孩子学习设置。

### 响应

```json
{
  "childId": "uuid",
  "subject": "ENGLISH",
  "autoApprove": false,
  "weekdayTimeWindows": [
    { "start": "18:30", "end": "20:00" }
  ],
  "weekendTimeWindows": [
    { "start": "09:00", "end": "10:30" }
  ],
  "dailyDurationMin": 20,
  "wordsPerSession": 10
}
```

## 6.5 PUT /api/children/:id/settings

### 说明

更新孩子英语学习设置。

### 请求体

```json
{
  "autoApprove": false,
  "weekdayTimeWindows": [
    { "start": "18:30", "end": "20:00" }
  ],
  "weekendTimeWindows": [
    { "start": "09:00", "end": "10:30" }
  ],
  "dailyDurationMin": 20,
  "wordsPerSession": 10
}
```

### 校验规则

- `dailyDurationMin` 范围 `5..240`
- `wordsPerSession` 范围 `1..50`
- 时间格式 `HH:mm`
- `start != end`

### 响应

- 同 `GET /api/children/:id/settings`

---

## 7. Pushes 模块

## 7.1 GET /api/pushes/pending

### 说明

获取当前家庭下待审批推送。

### 查询参数

- `childId` 可选

### 响应

```json
[
  {
    "id": "uuid",
    "childId": "uuid",
    "childName": "小明",
    "summary": "今日英语复习任务",
    "reason": "3 个单词到达第一次复习节点",
    "expectedOutcome": "完成后预计掌握率提升到 80%",
    "status": "PENDING_APPROVAL",
    "scheduledAt": "2026-03-10T10:00:00.000Z",
    "content": {
      "mode": "word_review",
      "dueWords": 3,
      "newWords": 2
    }
  }
]
```

## 7.2 POST /api/pushes/:id/approve

### 说明

审批、修改、拒绝或延后推送。

### 请求体

```json
{
  "action": "MODIFY",
  "comment": "减少词量",
  "modifiedContent": {
    "mode": "word_review",
    "dueWords": 2,
    "newWords": 1
  },
  "postponedUntil": null
}
```

### 字段规则

- `action` 必填，枚举：
  - `APPROVE`
  - `MODIFY`
  - `REJECT`
  - `POSTPONE`
- `MODIFY` 时 `modifiedContent` 必填
- `POSTPONE` 时 `postponedUntil` 必填

### 响应

```json
{
  "pushId": "uuid",
  "status": "MODIFIED"
}
```

### 业务规则

- `APPROVE` 或 `MODIFY` 后创建 `LearningTask`
- `REJECT` 不创建任务
- `POSTPONE` 更新建议计划时间

## 7.3 GET /api/pushes/tasks/:childId

### 说明

获取孩子任务列表。

### 查询参数

- `date` 可选，格式 `YYYY-MM-DD`

### 响应

```json
[
  {
    "id": "uuid",
    "summary": "英语单词复习",
    "status": "APPROVED",
    "scheduledAt": "2026-03-10T10:00:00.000Z",
    "content": {
      "mode": "word_review",
      "words": [
        { "id": "uuid", "value": "apple" }
      ]
    }
  }
]
```

### 业务规则

- 只能查看当前家庭孩子的任务

## 7.4 POST /api/pushes/:id/deliver

### 说明

标记任务已下发到孩子端。

### 响应

```json
{
  "pushId": "uuid",
  "status": "DELIVERED"
}
```

### 业务规则

- 仅允许 `APPROVED/MODIFIED -> DELIVERED`

## 7.5 POST /api/pushes/:id/complete

### 说明

标记任务完成。

### 响应

```json
{
  "pushId": "uuid",
  "status": "COMPLETED"
}
```

### 业务规则

- 仅允许 `DELIVERED -> COMPLETED`

---

## 8. Content 模块

## 8.1 GET /api/content/english/words

### 说明

查询英语词库。

### 查询参数

- `k12Stage` 可选
- `limit` 可选

### 响应

```json
[
  {
    "id": "uuid",
    "value": "apple",
    "phonetic": "/ˈæp.əl/",
    "meaningZh": "苹果",
    "exampleSentence": "This is an apple.",
    "imageHint": "red fruit",
    "difficultyLevel": 1,
    "k12Stage": "LOWER_PRIMARY"
  }
]
```

## 8.2 GET /api/content/english/words/:id

### 说明

获取单个词条详情。

---

## 9. Learning 模块

## 9.1 POST /api/learning/sessions

### 说明

从任务创建学习会话。

### 请求体

```json
{
  "taskId": "uuid"
}
```

### 响应

```json
{
  "id": "uuid",
  "taskId": "uuid",
  "childId": "uuid",
  "subject": "ENGLISH",
  "status": "IN_PROGRESS",
  "startedAt": "2026-03-10T10:00:00.000Z",
  "items": [
    {
      "id": "uuid",
      "itemType": "WORD_MEANING",
      "sequence": 1,
      "prompt": {
        "word": "apple",
        "options": ["苹果", "香蕉", "学校", "老师"]
      }
    }
  ]
}
```

### 业务规则

- 一个任务在 A-D1 阶段默认只允许一个活跃会话
- 仅 `DELIVERED` 任务可创建会话

## 9.2 GET /api/learning/sessions/:id

### 说明

查询学习会话详情。

### 响应

```json
{
  "id": "uuid",
  "taskId": "uuid",
  "childId": "uuid",
  "subject": "ENGLISH",
  "status": "IN_PROGRESS",
  "startedAt": "2026-03-10T10:00:00.000Z",
  "finishedAt": null,
  "items": [
    {
      "id": "uuid",
      "itemType": "WORD_MEANING",
      "sequence": 1,
      "prompt": {
        "word": "apple",
        "options": ["苹果", "香蕉", "学校", "老师"]
      },
      "result": null
    }
  ]
}
```

## 9.3 POST /api/learning/sessions/:id/answer

### 说明

提交一道题的答案。

### 请求体示例 1: 选义

```json
{
  "sessionItemId": "uuid",
  "answer": {
    "selected": "苹果"
  }
}
```

### 请求体示例 2: 拼写

```json
{
  "sessionItemId": "uuid",
  "answer": {
    "text": "apple"
  }
}
```

### 请求体示例 3: 发音

```json
{
  "sessionItemId": "uuid",
  "answer": {
    "audioUrl": "https://example.com/audio/1.wav"
  }
}
```

### 响应

```json
{
  "sessionItemId": "uuid",
  "isCorrect": true,
  "score": 100,
  "feedback": "回答正确，继续保持",
  "guidance": "下一次注意更快识别词义",
  "encouragement": "做得很好",
  "progress": {
    "current": 1,
    "total": 5
  }
}
```

### 业务规则

- 只允许回答当前家庭孩子的会话
- 发音题需调用语音评测适配器

## 9.4 POST /api/learning/sessions/:id/finish

### 说明

结束学习会话并返回结果摘要。

### 响应

```json
{
  "sessionId": "uuid",
  "status": "COMPLETED",
  "summary": {
    "totalItems": 5,
    "correctItems": 4,
    "accuracy": 0.8,
    "newWordsLearned": 2,
    "reviewWordsCompleted": 3
  }
}
```

### 业务规则

- 更新 `ChildWordProgress`
- 推进 `LearningTask` 到 `COMPLETED`

---

## 10. DTO 清单建议

## 10.1 Auth

- `SendVerificationCodeDto`
- `LoginDto`

## 10.2 Family

- `InviteParentDto`
- `AcceptFamilyInviteDto`

## 10.3 Children

- `CreateChildDto`
- `UpsertChildLearningSettingsDto`

## 10.4 Pushes

- `ApprovePushDto`
- `ListPendingPushQueryDto`
- `ListChildTasksQueryDto`

## 10.5 Learning

- `CreateLearningSessionDto`
- `SubmitLearningAnswerDto`
- `FinishLearningSessionDto`

---

## 11. 守卫与装饰器建议

建议最少实现：

- `JwtAuthGuard`
- `CurrentParent()` 装饰器
- `FamilyChildAccessGuard`
- `PushAccessGuard`

说明：

- `FamilyChildAccessGuard` 用于校验 `childId`
- `PushAccessGuard` 用于校验 `pushId`

---

## 12. Swagger 分组建议

- `health`
- `auth`
- `family`
- `children`
- `pushes`
- `content`
- `learning`

每个 DTO 字段都应标注：

- 说明
- 是否必填
- 示例值

---

## 13. 首批 E2E 用例映射

建议按接口清单覆盖以下链路：

1. 发送验证码
2. 登录
3. 创建孩子
4. 保存学习设置
5. 生成并查询待审批推送
6. 审批并生成任务
7. 查询孩子任务
8. 创建学习会话
9. 提交答案
10. 完成会话

---

## 14. 下一步实施建议

如果按当前文档继续推进后端开发，推荐顺序：

1. 先写 Prisma schema
2. 再写 Auth/Children 基础接口
3. 再写 Pushes 状态流转
4. 最后写 Learning 会话与语音评测接入

到这一步，前端当前已有页面就能逐步接到真实接口。
