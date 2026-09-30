# 趣味学习

一个适合手机的小学趣味学习网站，包含学习前台和独立管理员后台。采用 Next.js 16、React 19、TypeScript 与 Supabase，无图片素材依赖。

## 功能

- `/`：年级与学科筛选、今日挑战、学习足迹。
- `/practice`：数学、语文、英语、科学关卡，搜索与分类。
- `/learn/[id]`：选择题、提示、题目朗读（浏览器支持时）、即时解析、进度恢复、学习成果、错题重练。
- `/progress`：本机练习记录、累计学习天数与完成题目，支持清除记录。
- `/admin`：关卡统计、搜索筛选、分页与示例题库导入。
- `/admin/new`、`/admin/[id]/edit`：关卡信息、可视化题目编辑、排序、正确答案、提示、解析、学生视角预览、草稿/发布、删除。
- `/admin/login`：邮箱密码登录。每个写入操作均校验管理员权限，数据库通过 RLS 限制草稿访问与写入。

示例题库含9个关卡、45道题，主要面向二年级，并含一年级、三年级数学。示例内容按知识点组织，不声称与某一教材版本完全对应。4～6年级暂无预置内容，管理员可自行添加。

## 本地运行

需要 Node.js 22 或 24（支持小于26的版本）。

```sh
npm ci
# 未配置时可浏览与练习本地示例题库
npm run dev
```

访问 `http://localhost:3000`。没有数据库配置时，前台使用示例题库；后台显示初始化步骤，不开放匿名写入。已有配置时只展示数据库内已发布内容，不会用示例掩盖连接错误或空库。

## 数据库与管理账号

在 `.env.local` 配置以下公开参数，不要覆盖已有有效配置：

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

兼容 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 和现有 Vercel Supabase 集成的 `WYY_SUPABASE_URL`、`NEXT_PUBLIC_WYY_SUPABASE_PUBLISHABLE_KEY` / `WYY_SUPABASE_ANON_KEY`。更改公开变量后重新启动/部署。

1. 在 Supabase SQL Editor 执行 `supabase/schema.sql`。可重复执行，创建 `learning_lessons` 与 `admins` 及 RLS 策略。
2. 在 Authentication → Users 创建邮箱密码账号，将其加入管理员名单：

```sql
insert into public.admins(user_id)
select id from auth.users where email = 'YOUR_ADMIN_EMAIL'
on conflict (user_id) do nothing;
```

3. 登录 `/admin`，点击「导入示例题库」，或创建自定义关卡。重复导入不会覆盖已编辑的同编号关卡。

现有项目所有者也可使用本机初始化工具：

```sh
node scripts/supabase-setup.mjs inspect
node scripts/supabase-setup.mjs init
node scripts/supabase-setup.mjs admin YOUR_ADMIN_EMAIL
# 可选：使用服务端凭据导入示例题库
node --import tsx scripts/seed-learning.ts
```

工具读取服务端的数据库连接和 Supabase service-role 配置，仅供项目所有者运行。新账号凭据保存到权限为0600的 `.env.admin.local`，已有账号密码不变。私密密钥和数据库密码不能使用 `NEXT_PUBLIC_` 前缀，不能提交到版本库。

## 学习数据

学习记录、所选年级和未完成关卡保存在当前浏览器的 localStorage，最多保存最近500次练习。换设备、隐私模式或清除站点数据会影响保留；界面会提示保存失败。无需儿童账号，不采集姓名、联系方式，不向后台上传学习记录。后台统计的是内容数量，而非学生学习行为。

成绩统计首次提交的答案；错题重练不覆盖首次成绩。关卡内容更新后会丢弃旧的中途答题状态，避免将答案套用到新题目。练习用时是开始/恢复到完成的估计时长，不作为排名依据。

## 部署与验证

项目可部署到 Vercel，使用 `npm ci` 与 `npm run build`，配置上述公开变量和 Node.js 版本即可。支持 Server Actions，不使用静态导出。题库持久化在 Supabase，重新部署不会丢失内容。

```sh
npm test
npm run typecheck
npm run build
```

测试覆盖题目与关卡校验、本机进度恢复、周统计、数据库草稿隔离与管理员写入权限。线上首次使用前需检查题目内容与适用年级。

浏览器集成验证（已启动网站，且安装 Google Chrome）：

```sh
npm run test:e2e
```

后台集成验证读取本机 `.env.admin.local`，创建临时关卡验证草稿/发布/下架/删除并自动清理，不输出密码。无管理员凭据时跳过后台用例。截图仅保存在已忽略的 `test-results/`。
