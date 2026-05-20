# 我们的故事 — 恋爱记录网站

一个低调温暖、适合手机和电脑浏览的恋爱记录小站。

## 功能一览

| 功能 | 谁能看 | 谁能操作 |
|------|--------|----------|
| 纪念日日历 | 所有人 | 仅你俩（登录后添加） |
| 照片墙 | 所有人 | 仅你俩（登录后上传） |
| 悄悄话留言板 | 仅你俩（密码查看） | 所有人（写留言） |

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

-- ===== 权限策略 =====
-- 纪念日：公开读，登录写
CREATE POLICY "public_read_dates" ON important_dates FOR SELECT USING (true);
CREATE POLICY "auth_insert_dates" ON important_dates FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_update_dates" ON important_dates FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "auth_delete_dates" ON important_dates FOR DELETE USING (auth.role() = 'authenticated');

-- 照片：公开读，登录写
CREATE POLICY "public_read_photos" ON photos FOR SELECT USING (true);
CREATE POLICY "auth_insert_photos" ON photos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_delete_photos" ON photos FOR DELETE USING (auth.role() = 'authenticated');

-- 悄悄话：任何人写，登录读
CREATE POLICY "public_insert_messages" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "auth_read_messages" ON messages FOR SELECT USING (auth.role() = 'authenticated');
```

5. 左侧菜单点 "Storage"，点 "New bucket"，名称填 `photos`，勾选 "Public bucket"，点 "Save"。

6. 在 Storage 页面，点 `photos` 这个 bucket 进去，点 "Policies" 标签页，添加两条策略：
   - 点 "New policy" → 选 `SELECT` → 策略名 `public_read_photos_storage` → 表达式填 `true` → 保存
   - 点 "New policy" → 选 `INSERT` → 策略名 `auth_insert_photos_storage` → 表达式填 `(auth.role() = 'authenticated')` → 保存

7. 左侧菜单点 "Authentication" → "Users" → "Add user"：
   - Email: 你俩共用的邮箱（如 `ourstory@qq.com`）
   - Password: 设一个你俩都知道的密码（**这就是你们的登录密码**）
   - 勾选 "Auto Confirm User"（跳过邮箱验证）
   - 点 "Create user"

8. 左侧菜单点 "Settings" → "API"，复制两个值：
   - `Project URL`（长得像 `https://xxxxx.supabase.co`）
   - `anon public key`（很长一串乱码）

### 第三步：把配置填入代码

1. 用记事本打开本项目中的 `js/config.js` 文件。
2. 把第 5-6 行改成你刚才复制的值：

```js
const SUPABASE_URL = 'https://xxxxx.supabase.co';  // 你的 Project URL
const SUPABASE_ANON_KEY = '你的 anon public key';   // 你的 anon key
```

保存文件。

### 第四步：上传代码到 GitHub

1. 下载安装 **GitHub Desktop**：https://desktop.github.com/
2. 打开 GitHub Desktop，用你的 GitHub 账号登录。
3. 点 "File" → "Add local repository" → 选择 `love-story` 文件夹。
4. 如果提示 "This directory does not appear to be a Git repository"，点 "create a repository"。
5. 在左侧填写 Summary（如 "首次提交"），点 "Commit to main"。
6. 点 "Publish repository"，保持 Public，点 "Publish"。

### 第五步：部署到 Vercel

1. 打开 https://vercel.com ，确保已用 GitHub 登录。
2. 点 "Add New..." → "Project"。
3. 在列表中选择 `love-story` 仓库，点 "Import"。
4. 不需要改任何配置，直接点 "Deploy"。
5. 等 30 秒，部署完成。Vercel 会给你一个网址（如 `love-story.vercel.app`）。

**以后每次修改代码，只需在 GitHub Desktop 中 commit + push，Vercel 会自动更新网站。**

---

## 本地预览

在部署之前，你可以直接双击 `index.html` 文件在浏览器中查看效果（此时使用的是演示数据）。

---

## 使用指南

### 访客（朋友）
- 浏览首页、纪念日日历、照片墙
- 在「悄悄话」页面留言

### 你俩（登录后）
- 访问 `你的网址/#admin`（或点首页「我们的空间」卡片）
- 输入共用邮箱和密码登录
- 添加纪念日、上传照片
- 在「悄悄话」页面点击「查看收到的悄悄话」查看留言

---

## 常见问题

**Q: 免费版有什么限制？**
A: Supabase 免费版有 500MB 数据库、1GB 存储空间。对于个人纪念日网站来说绰绰有余。注意至少每个月登录一次 Supabase，防止项目因不活跃被暂停。

**Q: 照片上传失败？**
A: 检查照片是否超过 5MB。手机拍的照片通常很大，建议先用微信发给自己（微信会自动压缩），保存压缩后的图片再上传。

**Q: 想用自己的域名（如 xxx.love）？**
A: 可以在阿里云/腾讯云购买域名后，在 Vercel 的 Settings → Domains 中绑定。
