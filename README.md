# 我们的故事 — 恋爱记录网站

一个低调温暖、适合手机和电脑浏览的恋爱记录小站。

## 功能一览

| 功能 | 谁能看 | 谁能操作 |
|------|--------|----------|
| 纪念日日历 | 所有人 | 仅你俩（登录后添加） |
| 照片墙 | 所有人 | 仅你俩（登录后上传） |
| 悄悄话留言板 | 仅你俩（密码查看） | 所有人（写留言） |

**注意：** 本站不使用任何第三方 SDK，数据直接走 Supabase REST API，国内网络友好。

---

## 部署步骤（跟着做就行，不需要懂代码）

整个流程大约需要 30 分钟，需要准备一台能上网的电脑。

### 第一步：注册三个免费账号

1. **GitHub 账号** — 打开 https://github.com ，点 "Sign up"，用邮箱注册。记好用户名和密码。
2. **Supabase 账号** — 打开 https://supabase.com ，点 "Start your project"，用 GitHub 账号登录。
3. **Vercel 账号** — 打开 https://vercel.com ，点 "Sign up"，选择 "Continue with GitHub"。

### 第二步：在 Supabase 创建数据库

1. 登录 Supabase 后，点 "New project"。
2. 填写：
   - Name: `love-story`（随意）
   - Database Password: 设置一个密码（**记下来，后面要用**）
   - Region: 选 `Southeast Asia`（新加坡，国内访问快）
3. 点 "Create project"，等 1-2 分钟。

4. 项目创建好后，左侧菜单点 "SQL Editor"，点 "New query"，把下面的 SQL **全部复制粘贴进去**，点 "Run" 执行：

```sql
-- 纪念日表
CREATE TABLE important_dates (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title       TEXT NOT NULL,
  event_date  DATE NOT NULL,
  description TEXT DEFAULT '',
  type        TEXT DEFAULT 'other',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 照片表
CREATE TABLE photos (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  image_url   TEXT NOT NULL,
  caption     TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 悄悄话表
CREATE TABLE messages (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  author_name TEXT DEFAULT '匿名',
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ===== 数据表权限策略 =====
-- 纪念日：公开读，登录写
CREATE POLICY "public_read_dates" ON important_dates FOR SELECT USING (true);
CREATE POLICY "auth_insert_dates" ON important_dates FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_update_dates" ON important_dates FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "auth_delete_dates" ON important_dates FOR DELETE USING (auth.role() = 'authenticated');

-- 照片：公开读，登录写
CREATE POLICY "public_read_photos" ON photos FOR SELECT USING (true);
CREATE POLICY "auth_insert_photos" ON photos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_delete_photos" ON photos FOR DELETE USING (auth.role() = 'authenticated');

-- 悄悄话：任何人写，登录读+删
CREATE POLICY "public_insert_messages" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "auth_read_messages" ON messages FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_delete_messages" ON messages FOR DELETE USING (auth.role() = 'authenticated');

-- ===== 存储桶权限策略 =====
CREATE POLICY "public_read_storage" ON storage.objects
  FOR SELECT USING (bucket_id = 'photos');

CREATE POLICY "auth_insert_storage" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'photos' AND auth.role() = 'authenticated');
```

5. 左侧菜单点 "Storage"，点 "New bucket"，名称填 `photos`，勾选 "Public bucket"，点 "Save"。

6. 左侧菜单点 "Authentication" → "Users" → "Add user"：
   - Email: 你俩共用的邮箱（如 `ourstory@qq.com`）
   - Password: 设一个你俩都知道的密码（**这就是你们的登录密码**）
   - 勾选 "Auto Confirm User"（跳过邮箱验证）
   - 点 "Create user"

7. 左侧菜单点 "Settings" → "API"，复制两个值：
   - `Project URL`（长得像 `https://xxxxx.supabase.co`）
   - `anon public key`（以 `sb_publishable_` 开头的一长串）

### 第三步：把配置填入代码

1. 用记事本打开本项目中的 `js/config.js` 文件。
2. 把第 6-7 行改成你刚才复制的值：

```js
const SUPABASE_URL = 'https://xxxxx.supabase.co';       // Project URL
const SUPABASE_ANON_KEY = 'sb_publishable_...';          // anon public key
```

保存文件。

### 第四步：上传代码到 GitHub

两种方式任选一种：

**方式 A（最简单）：直接在网页上传**

1. 打开 github.com，登录后点右上角 "+" → "New repository"
2. Repository name 填 `love-story`，选 Public，**不要**勾选任何初始化选项
3. 点 "Create repository"
4. 在跳转后的页面，点 "uploading an existing file" 链接
5. **进入你电脑上的 `love-story` 文件夹**，全选里面的 `index.html`、`css` 文件夹、`js` 文件夹、`README.md`，拖到浏览器上传区域
6. 点 "Commit changes"

**方式 B：用 GitHub Desktop（适合以后要经常修改）**

1. 下载安装 GitHub Desktop：https://desktop.github.com/
2. 用 GitHub 账号登录，点 "File" → "Add local repository" → 选择 `love-story` 文件夹
3. 点 "create a repository" → 填写 Summary → "Commit to main" → "Publish repository"

### 第五步：部署

**推荐用 Vercel（国外访问快）：**

1. 打开 https://vercel.com ，用 GitHub 登录
2. 点 "Add New..." → "Project" → 选择 `love-story` → "Deploy"
3. 等 30 秒，拿到网址（如 `love-story.vercel.app`）

**如果 Vercel 打不开，用 GitHub Pages（国内也能访问）：**

1. 打开你的 GitHub 仓库，点 "Settings" → 左侧 "Pages"
2. Branch 选 `main`，文件夹选 `/(root)`，点 "Save"
3. 等 1-2 分钟，网址是 `https://你的用户名.github.io/love-story/`

每次修改代码后，重新上传到 GitHub，部署会自动更新。

---

## 使用指南

### 访客（朋友）
- 浏览首页、纪念日日历、照片墙
- 在「悄悄话」页面留言

### 你俩（登录后）
- 网址后面加 `/#admin`（或点首页「我们的空间」卡片）
- 输入共用邮箱和密码登录
- 登录后可以：添加纪念日、上传照片、查看悄悄话
- 悄悄话密码和登录密码是同一个

---

## 常见问题

**Q: 演示密码是什么？**
A: 没配置 Supabase 时（演示模式），登录密码和查看悄悄话的密码都是 `123456`。

**Q: 免费版有什么限制？**
A: Supabase 免费版有 500MB 数据库、1GB 存储空间，对个人网站绰绰有余。建议每个月登录一次 Supabase 防止休眠。

**Q: 照片上传失败？**
A: 先确认已经在「我们的空间」页面登录。照片不能超过 5MB，大照片建议先用微信发给自己压缩。

**Q: 「数据库未连接」是什么问题？**
A: 需要先在「我们的空间」页面登录一次，登录后 token 会保存在浏览器里，之后上传照片、添加纪念日就正常了。
