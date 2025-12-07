# 关注者列表配置

## 概述

关注者列表统一管理在 `data/followers.txt` 文件中（文本格式），通过 `build-followers.mjs` 脚本自动生成 `followers.json` 供前端使用。

## 数据流

```
data/followers.txt (文本格式)
    ↓ scripts/build-followers.mjs
data/followers.json (JSON 格式)
    ↓
scripts/fetch-tweets.mjs (读取)
src/config/followers.ts (导入)
```

## 使用方法

### 方法 1: GitHub Web UI（推荐）

1. 打开 [`data/followers.txt`](../../data/followers.txt)
2. 点击 ✏️ 编辑按钮
3. 编辑文本文件，每行一个用户名
4. 提交更改后，GitHub Action 会自动触发推文抓取

### 方法 2: GitHub Actions

1. 访问 Actions → Manage Followers
2. 点击 Run workflow
3. 选择操作类型：`add` 或 `remove`
4. 填写用户名和可选分组
5. 执行 workflow

### 方法 3: 本地命令行

```bash
# 添加关注者
pnpm run manage-followers add <username> [group]

# 删除关注者
pnpm run manage-followers remove <username>

# 验证配置
pnpm run validate-followers

# 构建 JSON
pnpm run build-followers
```

## 文本格式

`followers.txt` 使用简单的文本格式：

```
# 注释行以 # 开头，会被忽略
# 空行会被忽略

# 最简单格式（推荐）
username

# 带分组格式（可选）
username,group

# 示例
elonmusk
naval,Tech
VitalikButerin,Crypto
```

### 格式说明

- **简单格式**: `username` - 只写用户名
- **带分组格式**: `username,group` - 用户名和分组，用逗号分隔
- **注释**: 以 `#` 开头的行会被忽略
- **空行**: 会被忽略
- **displayName**: 会从推文数据中自动获取，无需手动配置

## JSON 格式

`followers.json` 由脚本自动生成，格式如下：

```json
{
  "followers": [
    {
      "username": "elonmusk"
    },
    {
      "username": "naval",
      "group": "Tech"
    }
  ]
}
```

### 字段说明

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `username` | string | ✅ | X 用户名，不包含 @ 符号 |
| `group` | string | ❌ | 分组名称，用于分类管理 |
| `displayName` | string | ❌ | 显示名称，从推文数据中自动获取 |

## GitHub Actions

### Fetch Tweets Workflow

以下情况会自动触发推文抓取：
- 定时执行：每 15 分钟
- 手动触发：在 Actions 页面手动触发
- 文件变化：`data/followers.txt` 或 `data/followers.json` 被修改时

### Manage Followers Workflow

用于通过 GitHub Web UI 添加或删除关注者：
- 手动触发：Actions → Manage Followers → Run workflow
- 操作类型：`add` 或 `remove`
- 自动处理：更新文件、验证配置、提交更改、触发推文抓取

## 脚本命令

```bash
# 管理关注者
pnpm run manage-followers add <username> [group]
pnpm run manage-followers remove <username>

# 构建 followers.json
pnpm run build-followers

# 验证配置
pnpm run validate-followers

# 抓取推文
pnpm run fetch-tweets
```

## 故障排除

### 格式错误

运行验证脚本查看详细错误：
```bash
pnpm run validate-followers
```

### GitHub Action 失败

1. 访问仓库的 Actions 页面
2. 查看最新的 workflow 运行记录
3. 检查错误信息
