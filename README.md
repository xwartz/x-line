# X-Line

<div align="center">

![X-Line Logo](https://img.shields.io/badge/X-Line-Timeline%20Aggregator-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)

一个简洁优雅的 X (Twitter) 时间线聚合器

</div>

## 快速开始

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/xwartz/x-line.git
cd x-line

# 安装依赖
pnpm install

# 构建关注者配置
pnpm run build-followers

# 启动开发服务器
pnpm dev
```

访问 http://localhost:3000 查看效果。

## 项目结构

```
x-line/
├── src/                    # 源代码
│   ├── components/         # React 组件
│   ├── config/             # 配置文件
│   ├── hooks/              # React Hooks
│   └── types.ts            # 类型定义
├── scripts/                # 脚本
│   ├── fetch-tweets.mjs    # 推文抓取
│   ├── build-followers.mjs # 构建关注者配置
│   └── manage-followers.mjs # 管理关注者
├── data/                   # 数据文件
│   ├── followers.txt       # 关注者列表（文本）
│   ├── followers.json      # 关注者列表（JSON，自动生成）
│   └── tweets.json         # 推文数据
├── .github/workflows/      # GitHub Actions
└── docs/                   # 文档
```

## 技术栈

- **构建工具**: [Vite](https://vitejs.dev/)
- **框架**: [React](https://react.dev/)
- **语言**: [TypeScript](https://www.typescriptlang.org/)
- **样式**: [Tailwind CSS](https://tailwindcss.com/)
- **数据源**: [Nitter](https://github.com/zedeus/nitter)
- **自动化**: GitHub Actions

## 脚本命令

```bash
# 开发
pnpm dev              # 启动开发服务器

# 构建
pnpm build            # 构建生产版本

# 数据管理
pnpm run build-followers      # 构建关注者配置
pnpm run validate-followers   # 验证关注者配置
pnpm run manage-followers     # 管理关注者（add/remove）
pnpm run fetch-tweets         # 抓取推文
```

## 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

[MIT License](LICENSE)

## 🙏 致谢

- [Nitter](https://github.com/zedeus/nitter) - 提供推文数据源
- [x-gpt.bwequation.com](https://x-gpt.bwequation.com/) - 功能灵感来源

---

<div align="center">
Made with ❤️ by <a href="https://github.com/xwartz">xwartz</a>
</div>
