# 趣味学习

一个适合手机的小学趣味学习网站，包含学习前台和独立管理员后台。采用 Next.js 16、React 19、TypeScript 与 Supabase，无图片素材依赖。

## 功能

- `/`：今日挑战，按年级展示当天推荐、今日完成关卡数与学习足迹。
- `/practice`：全部练习，按年级、学科、知识分类浏览关卡，支持搜索。
- `/learn/[id]`：选择题、提示、题目朗读（浏览器支持时）、即时解析、进度恢复、学习成果、错题重练。
- `/progress`：会员练习记录、累计学习天数与完成题目，可确认导入本机旧记录。
- `/member-login`：只输入会员密码登录，默认记住30天。
- `/admin/members`：管理员创建会员、设置或生成密码、重置密码、停用会员。
- `/admin`：关卡统计、搜索筛选、分页与示例题库导入。
- `/admin/new`、`/admin/[id]/edit`：关卡信息、可视化题目编辑、排序、正确答案、提示、解析、学生视角预览、草稿/发布、删除。
- `/admin/login`：邮箱密码登录。每个写入操作均校验管理员权限，数据库通过 RLS 限制草稿访问与写入。

后台统一提供「关卡管理」「会员管理」模块导航。桌面使用左侧栏，手机使用顶部模块切换；新建和编辑关卡时保持关卡模块选中，学习前台入口与退出登录位于公共顶栏。

分类定义位于 `lib/classification.ts`，四个学科共28个主分类。前台只显示当前年级和学科中有已发布关卡的分类；切换年级或学科会重置分类。后台选择一个所属学科的主分类，可另填最多8个知识点标签，用逗号分隔。搜索支持关卡名称、主分类、原知识点和标签。

已有题库升级时，先运行 `node --import tsx scripts/classify-lessons.ts --check`，核对分类分布，再运行同一命令的 `--apply`。脚本在事务中添加字段并补齐分类，核对题目、关卡ID和发布状态保持不变；重复执行保留管理员已有分类与标签。数据库的分类列兼容旧客户端的空值，新后台保存必须选择有效分类。新建数据库直接使用完整的 `supabase/schema.sql`。

示例题库含9个关卡、90道题，主要面向二年级，并含一年级、三年级数学。示例内容按知识点组织，不声称与某一教材版本完全对应。4～6年级暂无预置内容，管理员可自行添加。

## 本地运行

需要 Node.js 22 或 24（支持小于26的版本）。

```sh
npm ci
# 配置数据库并创建会员后，可登录学习
npm run dev
```

访问 `http://localhost:3000`。前台学习页面需要会员登录；后台显示初始化步骤。已有配置时只展示数据库内已发布内容，不会用示例掩盖连接错误或空库。

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

## 会员与学习数据

后台「会员管理」可创建昵称、默认年级和唯一密码。支持自动生成8位数字密码或自定义8～64位密码（不含空格）。前台只需输入密码，因而不同会员不能使用同一密码。密码只在创建或重置成功时显示一次，数据库保存带盐 scrypt 验证值与使用私密随机密钥生成的 HMAC 索引，不保存明文。

会员会话使用随机令牌，数据库仅保存令牌哈希；浏览器使用 HttpOnly、SameSite Cookie，HTTPS 下启用 Secure，有效期30天。重置密码、停用会员会使所有设备上的旧会话失效；主动退出只退出当前会话。登录按来源地址在数据库中限制尝试次数。后台管理权限仍由原 Supabase 管理员账号校验，会员不能管理题库或其他会员。

使用已有的服务端 PostgreSQL 连接（`WYY_POSTGRES_URL`、`POSTGRES_URL`、`DATABASE_URL` 或 `WYY_POSTGRES_URL_NON_POOLING`）和仓库内 CA 证书，参数不可使用 NEXT_PUBLIC 前缀。首次安装运行 `node --import tsx scripts/setup-members.ts`，它在事务中安装 `supabase/migrations/20260930_members.sql`，不修改题库、管理员和已有学习记录。会员相关表和数据库函数不允许匿名或普通 Supabase 用户直接访问；所有页面、接口和管理动作单独校验身份。

会员的最近500次完整练习、错题、年级、未完成答题进度及每日挑战计划保存在云端。浏览器按会员隔离缓存和待上传队列，操作后自动同步，重新聚焦、联网或每10秒检查更新。并发写入采用版本比较重试，按答题会话ID去重，较旧的中途进度不会覆盖同一次答题的新进度。离线完成的记录在联网后补传；看到「学习进度已同步」后可在其他设备继续。浏览器无法持久化缓存时需保持页面打开直至同步完成。

旧的匿名本机记录保留，登录后可在「我的成长」确认这些记录属于当前会员，再导入云端，不自动把共用设备的历史分配给新会员。成绩统计首次提交的答案；错题重练不覆盖首次成绩。题库更新使中途答题版本不匹配时，会重新开始该关卡。

## 每日推荐

「今日挑战」按所选年级同时展示语文、数学、英语、科学，每科推荐1个已发布且含10题的关卡。没有可用关卡的学科不展示。各学科独立优先安排未学关卡，每完成两个新关卡后优先穿插一次薄弱复习，进度跨天累计。薄弱指最近一次完整练习正确率低于80%；新关卡与薄弱关卡都没有时，优先复习较久没练的关卡。

每日计划根据本地当天零点以前的记录生成，按会员、日期、年级保存；第一台设备生成后，其他设备同步同一份计划。完成后保留原卡片并标记「已完成」，不会继续追加该学科的新挑战；可自行再练，或到「全部练习」浏览更多内容。各科完成后显示「今日挑战全部完成啦」，次日根据最新记录重新安排。跨天停留、多标签页、切换年级和刷新均会同步状态。下架的关卡会替换，同一天新增已有学科的关卡不会挤掉当前推荐。

学习和推荐记录按会员在云端保存，最多参考最近500次练习。「全部练习」中的筛选和自由练习不增加今日挑战数量，完成与今日挑战相同的关卡会计为完成。

## 部署与验证

项目可部署到 Vercel，使用 `npm ci` 与 `npm run build`，配置上述公开变量、服务端 PostgreSQL 连接和 Node.js 版本即可。支持 Server Actions，不使用静态导出。题库持久化在 Supabase，重新部署不会丢失内容。

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

## 每关10题

基础题库121个关卡统一为10题，共1210题；新增数学提高题36关、360题后，正式库共157关、1570题。`content/ten-question-lessons.ts` 保留原605题并追加605题；原始500题及拼音60题批次作为历史数据保留。扩充脚本为 `scripts/expand-lessons-to-ten.ts`，先 `--check` 后 `--apply`；会备份旧关卡、事务更新、核对原题与分类、支持重复执行。后台新建预置10个题位，草稿可少于10道完整题目，发布必须包含10道完整题目。

会员浏览器测试会创建名称以「会员验证-」开头的临时会员，验证记住登录、两设备接续、断网补传、密码重置与停用，并清理临时数据。不要对真实会员执行测试清理。

二年级「数学提高题」分类包含由用户文档整理的360题、36关；操作、缺图和待确认题保留在 `content/math-enrichment/pending.md`。来源与导入方式见 `content/README.md`。
