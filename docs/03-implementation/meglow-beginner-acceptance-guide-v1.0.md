# Meglow 新手验收手册 v1.0

**更新时间**: 2026-03-11  
**适用范围**: 当前仓库 `frontend/` + `backend/` 的已实现能力  
**适用对象**: 第一次接触本项目的测试同学、产品同学、非开发同学

---

## 1. 本次可以验收什么

当前可以验收的是一条真实业务闭环：

1. 家长登录
2. 创建孩子档案
3. 设置英语学习参数
4. 查看并审批待处理学习推送
5. 投递任务给孩子
6. 孩子进入学习会话
7. 完成词义题和拼写题
8. 完成学习会话并查看结果

当前**不在本轮验收范围**内的内容：

- 发音评测
- 更复杂的 AI 学习简报
- 前端完整产品化体验
- 完整权限体系

---

## 2. 前置安装

第一次在新电脑上验收时，请先安装以下工具。

### 2.1 必装软件

- Docker Desktop
- Node.js
- pnpm
- 微信开发者工具

### 2.2 推荐版本

- Docker Desktop: 最新稳定版即可
- Node.js: 建议 20.x 或更高
- pnpm: 建议 10.x
- 微信开发者工具: 最新稳定版即可

### 2.3 安装完成后的简单确认

在 PowerShell 中执行以下命令，确认工具可用：

```powershell
docker --version
node --version
pnpm --version
```

---

## 3. 项目目录说明

项目根目录：

```text
D:\02_Dev\Workspace\GitHub\meglow
```

关键目录：

- `backend/`: 后端服务
- `frontend/`: uni-app 小程序前端
- `docs/`: 文档

---

## 4. 验收前准备

### 4.1 启动 Docker Desktop

确保 Docker Desktop 已启动，并且状态正常。

### 4.2 启动数据库和 Redis

在项目根目录执行：

```powershell
docker compose -f backend/docker-compose.yml -p meglow up -d
```

执行成功后，检查容器状态：

```powershell
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

预期至少看到：

- `ai-companion-postgres`
- `ai-companion-redis`

两者都应为 `Up` 或 `healthy`。

### 4.3 启动后端 API

打开一个新的 PowerShell 窗口，执行：

```powershell
cd D:\02_Dev\Workspace\GitHub\meglow\backend\apps\api
yarn start:prod
```

如果启动成功，后端默认监听：

```text
http://localhost:5002/api
```

可在电脑浏览器访问以下地址检查后端是否活着：

```text
http://localhost:5002/api/health
http://localhost:5002/docs
```

### 4.4 启动前端依赖并构建微信小程序

在新的 PowerShell 窗口执行：

```powershell
cd D:\02_Dev\Workspace\GitHub\meglow\frontend
pnpm install
pnpm build:mp-weixin
```

构建成功后，小程序目录在：

```text
D:\02_Dev\Workspace\GitHub\meglow\frontend\dist\build\mp-weixin
```

### 4.5 打开微信开发者工具

1. 打开微信开发者工具
2. 选择“导入项目”
3. 项目目录选择：

```text
D:\02_Dev\Workspace\GitHub\meglow\frontend\dist\build\mp-weixin
```

4. AppID:
   如果你有自己的测试 AppID，就填自己的
   如果只是本地验收，也可以使用测试号或无 AppID 模式

---

## 5. 真机访问前的网络准备

### 5.1 手机和电脑必须在同一局域网

否则手机无法直接访问你电脑上的本地后端。

### 5.2 本机当前局域网 IP

当前这台机器在 2026-03-11 检查到的 IPv4 地址是：

```text
10.87.57.23
```

如果之后网络环境变化，这个地址可能变化。  
如果不确定，请在 PowerShell 中重新执行：

```powershell
ipconfig
```

### 5.3 小程序登录页应填写的 API 地址

在小程序登录页的 `API Base` 输入框中填写：

```text
http://10.87.57.23:5002/api
```

如果你的电脑 IP 变了，就把 `10.87.57.23` 换成新的局域网 IP。

---

## 6. 测试账号信息

当前没有固定用户名密码体系，使用手机验证码登录。

### 6.1 登录方式

- 手机号：任意符合格式的中国大陆手机号
- 验证码：固定开发验证码 `123456`

### 6.2 示例账号

可直接使用：

```text
手机号: 13800138000
验证码: 123456
```

也可以使用任何其他符合规则的手机号，例如：

```text
13900000001
13712345678
```

### 6.3 账号规则

- 第一次登录一个新手机号，会自动创建家长账号
- 第一次登录还会自动创建家庭主账号身份
- 当前没有密码

---

## 7. 新手完整验收步骤

本项目当前前端**没有“创建孩子”页面**，所以第一次验收时，需要先在 Swagger 中创建一个孩子。

### 7.1 第一步：在小程序里登录

1. 打开微信开发者工具中的项目
2. 进入登录页
3. 在 `API Base` 中填写：

```text
http://10.87.57.23:5002/api
```

4. 输入手机号，例如：

```text
13800138000
```

5. 点击 `Send Code`
6. 输入验证码：

```text
123456
```

7. 点击 `Login`

成功后会进入家长首页。

### 7.2 第二步：拿到登录令牌

后续 Swagger 调试需要 `Bearer Token`。

最简单的方法：

1. 在电脑浏览器打开：

```text
http://localhost:5002/docs
```

2. 找到 `POST /auth/login`
3. 用刚才登录的小程序相同的手机号和验证码 `123456` 再调用一次
4. 复制返回结果里的 `accessToken`

### 7.3 第三步：在 Swagger 创建孩子

因为前端还没有“创建孩子”页面，所以这一步必须在 Swagger 做。

1. 在 Swagger 页面右上角点击 `Authorize`
2. 输入：

```text
Bearer 你的 accessToken
```

3. 找到 `POST /api/children`
4. 填入示例参数：

```json
{
  "name": "小明",
  "gender": "MALE",
  "grade": 3
}
```

5. 执行请求

成功后，系统会自动为孩子创建：

- 档案
- 游戏化档案
- 默认学习设置

### 7.4 第四步：在小程序中调整学习设置

1. 回到小程序家长首页
2. 点击 `Learning Settings`
3. 选择刚创建的孩子
4. 建议设置为：

- `Auto Approve`: 关闭
- `Words Per Session`: 3
- `Daily Duration Minutes`: 15

5. 点击 `Save Settings`

这样更适合快速验收，不会一轮题太多。

### 7.5 第五步：查看待审批推送

1. 回到家长首页
2. 点击 `Pending Push Center`
3. 点击 `Refresh`

预期结果：

- 页面出现一条待审批推送
- 能看到孩子名称、推送原因、预期结果

### 7.6 第六步：审批通过推送

在 `Pending Push Center` 中：

1. 点击 `Approve`

预期结果：

- 推送不再出现在待审批列表中
- 对应任务已生成

### 7.7 第七步：进入孩子任务页

1. 回到家长首页
2. 点击 `Child Task Board`
3. 选择孩子
4. 点击 `Refresh Tasks`

预期结果：

- 能看到一条状态为 `APPROVED` 的任务

### 7.8 第八步：投递任务

在任务列表中：

1. 点击 `Mark Delivered`

预期结果：

- 任务状态变成 `DELIVERED`
- 出现 `Start Learning` 按钮

### 7.9 第九步：开始学习

1. 点击 `Start Learning`

预期结果：

- 进入学习会话页面
- 页面显示当前题目进度
- 当前实现题型包括：
  - 词义选择题
  - 拼写题

### 7.10 第十步：完成学习题目

按页面提示逐题完成：

- 词义题：点击一个中文释义选项
- 拼写题：输入英文单词并提交

预期结果：

- 每题提交后会显示反馈
- 会显示正确/错误、指导语、鼓励语、分数

### 7.11 第十一步：完成学习会话

最后一题完成后：

1. 点击 `Finish Session`

预期结果：

- 页面显示学习结果摘要
- 包含：
  - 总题数
  - 正确题数
  - 正确率
  - 新学单词数
  - 复习完成单词数

### 7.12 第十二步：回到任务页确认状态

1. 点击 `Back To Task Board`

预期结果：

- 该任务后续应进入已完成状态
- 本轮学习闭环完成

---

## 8. 建议的最小验收结论

如果你已经完成以下检查，就可以认为本轮核心能力验收通过：

- 能登录
- 能创建孩子
- 能保存学习设置
- 能看到待审批推送
- 能审批通过推送
- 能看到孩子任务
- 能投递任务
- 能开始学习会话
- 能完成词义题和拼写题
- 能完成学习会话并看到摘要

---

## 9. 常见问题

### 9.1 手机上请求失败

常见原因：

- 手机和电脑不在同一局域网
- 登录页里填的还是 `localhost`
- 后端没有启动
- Windows 防火墙阻止了 5002 端口访问

建议检查：

```powershell
ipconfig
```

确认 IP 是否还是 `10.87.57.23`，并确认小程序里填的是：

```text
http://你的电脑IP:5002/api
```

### 9.2 Swagger 打不开

请确认后端 API 已启动，并在浏览器访问：

```text
http://localhost:5002/docs
```

### 9.3 看不到待审批推送

请先确认：

- 已创建孩子
- 已保存学习设置
- 当前登录的是同一个家庭下的家长账号

然后回到 `Pending Push Center` 点击 `Refresh`。

### 9.4 孩子任务页看不到任务

请确认：

- 推送已经 `Approve`
- 选择的是正确的孩子
- 日期过滤没有填错

建议先点击：

- `Clear Date`
- `Refresh Tasks`

### 9.5 学习页打不开

请确认：

- 当前任务状态已经是 `DELIVERED`
- 不是 `APPROVED`
- 不是 `COMPLETED`

---

## 10. 服务停止方式

### 10.1 停止后端 API

关闭运行 `yarn start:prod` 的 PowerShell 窗口，或在窗口内按：

```text
Ctrl + C
```

### 10.2 停止数据库和 Redis

在项目根目录执行：

```powershell
docker compose -f backend/docker-compose.yml -p meglow down
```

如果希望保留数据，这样就够了。

如果希望下次完全重新开始，可以再删除卷：

```powershell
docker compose -f backend/docker-compose.yml -p meglow down -v
```

---

## 11. 本文档对应的当前实现边界

本文档只保证当前已实现功能的验收可操作，不表示以下能力已经全部完成：

- 完整 Phase 1 产品能力
- 所有前端页面
- 语音评测
- 完整 AI 教学能力

如需继续推进真机验收，下一步建议是补齐：

1. 前端创建孩子页面
2. 前端更完整的学习结果页
3. 发音题型
