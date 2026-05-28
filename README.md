# yanbot-claw

考研教育领域 PC Web AI 智能体应用。yanbot 生态新增成员，定位 AI 工作台，服务内部运营与合作方。

## 技术栈

- Next 15（App Router） + React 19 + TypeScript
- Tailwind CSS + shadcn/ui（手工注入，避免 CLI）
- Vercel AI SDK（已安装，本期未消费）
- Zustand 状态、Zod 校验、jose JWT、react-hook-form

## 快速开始

```bash
pnpm install
cp .env.example .env        # 编辑 JWT_SECRET / MVP_ADMIN_*
pnpm dev                    # http://localhost:3000
```

默认账号：`.env` 的 `MVP_ADMIN_USER` / `MVP_ADMIN_PASS`（示例为 `admin / admin123`）。

## 目录速览

```
app/
  (app)/         受保护路由组：工作台首页 / Agent / 3 工具页
  api/           Route Handlers：auth / conversations / tools / health
  login/         登录页（公开）
components/
  ui/            shadcn/ui 原子组件
  layout/        AppHeader / AppSider / ThemeProvider / ThemeToggle
  chat/          MessageList / MessageInput / ToolCard
  common/        PageHeader / EmptyState
lib/
  api/           前端 fetch 封装（统一 envelope）
  auth/          JWT 签发与校验
  server/        yanbot Open API 客户端（HMAC）、LLM provider、Response 工具
  services/      业务逻辑（纯函数，禁止依赖 NextRequest，便于将来剥离）
middleware.ts    全局鉴权：白名单外未登录跳 /login
types/           api / domain（domain 收敛自 yanbot-mcp）
store/           Zustand
```

## 工程纪律（"降锁定"）

1. `app/api/**/route.ts` **只做 HTTP 适配**：参数校验（Zod）、鉴权、响应包装
2. 业务逻辑全部沉在 `lib/services/`，纯函数，不依赖 `NextRequest` / `cookies()`
3. 外部依赖统一在 `lib/server/` 暴露单例（`getYanbotClient()` / `openai()`）
4. 类型集中在 `types/`，client/server 共享
5. Server Component 优先；`'use client'` 控制在最小范围

## 验证

```bash
curl http://localhost:3000/api/health
# {"code":0,"data":{"ok":true,"ts":...}}

curl -X POST http://localhost:3000/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"username":"admin","password":"admin123"}' -i
# 200 + Set-Cookie: claw_session=...

curl -X POST http://localhost:3000/api/tools/search \
  -H 'content-type: application/json' --cookie 'claw_session=<token>' \
  -d '{"query":"复旦计算机"}'
# {"code":0,"data":{"list":[{"id":"mock-1",...}]}}
```

UI 走一遍：

1. 访问 `/` → 自动跳 `/login`
2. 用 admin / admin123 登录 → 工作台首页（3 卡片 + 最近会话空状态）
3. 点 Agent 对话 → 输入消息回车 → 收到 `echo: ...` 回显
4. 切换明暗主题正常，左侧导航高亮当前路由

## 范围之外（下一期）

- 3 个工具的真实 LLM 编排与 prompt
- 会话持久化与历史回放
- `useChat` + `streamText` 真正接入 LLM 流式
- 调用 yanbot Open API 取真实考研数据
- 重设计的多角色账号体系
