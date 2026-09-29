# 柏童服饰

适合手机浏览的 Next.js 网站，使用 Supabase 数据库、登录与图片存储，可部署到 Vercel。

## 功能

- 前台 `/`：每页 6 款、季节筛选、款式详情、原图放大查看。
- 后台 `/admin`：邮箱密码登录、上传图片、录入介绍、编辑、草稿/发布、删除，每页 10 条。
- 空内容库可在后台一键导入已有 12 款校服及 9 张原始素材。
- 原静态页面保留在 `/school-uniforms.html`，素材位于 `public/assets/uniforms/`。
- 图片直接上传到 Supabase，不经过 Vercel Server Action 的请求体；支持 JPG、PNG、WebP，单张最多 5 MB。

## 本地运行

需要 Node.js 22 或 24。

```sh
npm ci
cp .env.example .env.local
# 在 .env.local 填入公开的 Supabase URL 和 publishable key
npm run dev
```

如果已有 `.env.local`，请保留它，不要执行覆盖命令。访问 `http://localhost:3000`。没有有效配置时，前台展示本地示例，后台提示配置；配置后只展示数据库中的真实内容。

### 环境变量

推荐配置：

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

也兼容 `NEXT_PUBLIC_SUPABASE_ANON_KEY`，以及当前 Vercel 集成生成的 `WYY_SUPABASE_URL` 和 `NEXT_PUBLIC_WYY_SUPABASE_PUBLISHABLE_KEY`（或 `WYY_SUPABASE_ANON_KEY`）。两种命名选择一种即可；标准名称优先，勿同时保留无效占位值。

网站运行只需要公开 URL 和 key。数据库密码、JWT secret、service-role key **不能以 NEXT_PUBLIC_ 开头**，也不要放在 `next.config.ts` 的 `env` 里。`.env.local`、`.env.admin.local` 均已被 Git 忽略，`.env.example` 仅保留占位模板。

## Supabase 初始化

新项目在 Supabase SQL Editor 执行 `supabase/schema.sql`，创建内容表、管理员表及私有存储桶。已有同名表或存储桶时先检查兼容性，不要直接覆盖。

在 Authentication → Users 创建邮箱密码用户，然后在 SQL Editor 授权：

```sql
insert into public.admins (user_id)
select id from auth.users where email = 'YOUR_ADMIN_EMAIL'
on conflict (user_id) do nothing;
```

无需开放公众注册。管理员忘记密码时，可由项目所有者在 Supabase 中重置。

本项目也提供初始化脚本，仅由项目所有者在本机运行。它读取 `.env.local` 中的 `WYY_POSTGRES_URL_NON_POOLING`（或 `POSTGRES_URL_NON_POOLING` / `WYY_POSTGRES_URL` / `DATABASE_URL`）以及服务端 `SUPABASE_SERVICE_ROLE_KEY` / `WYY_SUPABASE_SERVICE_ROLE_KEY` / `WYY_SUPABASE_SECRET_KEY`。数据库证书采用 Supabase 官方 CA 并校验主机名。

```sh
node scripts/supabase-setup.mjs inspect
node scripts/supabase-setup.mjs init
node scripts/supabase-setup.mjs admin YOUR_ADMIN_EMAIL
```

`admin` 命令保留已存在账号的密码；新账号随机初始密码写入权限为 0600 的 `.env.admin.local`，不会发送邮件。若该文件已存在，脚本会停止，避免覆盖凭据。

## Vercel 部署

项目中的 `vercel.json` 已指定 Next.js、`npm ci` 和 `npm run build`；`.vercelignore` 会排除本地环境变量、测试截图和构建缓存。

1. 将本项目连接至 Vercel，Framework Preset 选择 **Next.js**，Root Directory 选择此 `package.json` 所在目录。
2. Node.js 选 22.x 或 24.x；Install Command 使用 `npm ci`，Build Command 使用 `npm run build`，Output Directory 保持默认。
3. 在项目 Settings → Environment Variables 添加上述公开 URL/key，应用到需要的 Preview / Production 环境；已有 `WYY_` 集成变量可直接使用。
4. 重新部署。公开配置会在构建时写入前端，更改环境变量后必须重新部署。
5. 打开部署域名访问前台，在 `/admin` 使用已授权账号登录。

不要配置为静态导出：后台登录和 Server Actions 需要 Next.js 服务端。Supabase 数据与图片在 Vercel 重新部署后保留。上传素材不会写到 Vercel 的本地磁盘。

## 权限与图片

数据库启用 RLS：访客只能读取已发布内容，只有 `admins` 表内账号可写入。页面和每个写入操作也单独检查管理员身份。私有图片桶允许管理员访问全部素材，访客只能为已发布记录的图片获取签名 URL。

签名图片链接有效期为 1 小时。内容撤回后不会再签发新链接，已签发链接在有效期内仍可能访问，浏览器缓存也可能保留旧图。因此草稿应使用独立图片；共享素材已被其他已发布款式使用时，它本身是公开可见的。

新增图片保留原文件，不进行二次压缩。历史图片局部使用裁切视图；源素材本身低分辨率的款式需要在后台替换清晰原图，放大不能增加真实细节。

## 验证

```sh
npm test
npm run typecheck
npm run build
```

测试使用本地 PGlite 验证实际 SQL 的权限隔离、草稿可见性和图片策略，同时覆盖分页与输入验证，不依赖线上数据库。`test-results/` 为本地浏览器验证截图，已被 Git 忽略。
