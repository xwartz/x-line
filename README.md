<img src="https://img.shields.io/badge/X--Line-Timeline%20Aggregator-1DA1F2?style=for-the-badge&logo=x&logoColor=white" alt="X-Line Logo">

A clean and elegant X timeline aggregator.

## Quick Start

### Local Development

```bash
# Clone the repository
git clone https://github.com/xwartz/x-line.git
cd x-line

# Install dependencies
pnpm install

# Build the follower configuration
pnpm run build-followers

# Start the development server
pnpm dev
```

Open http://localhost:3000 to view the app.

## Project Structure

```
x-line/
├── src/                    # Source code
│   ├── components/         # React components
│   ├── config/             # Configuration
│   ├── hooks/              # React hooks
│   └── types.ts            # Type definitions
├── scripts/                # Utility scripts
│   ├── fetch-tweets.mjs    # Fetch tweets
│   ├── build-followers.mjs # Build follower config
│   └── manage-followers.mjs # Manage followers
├── data/                   # Data files
│   ├── followers.txt       # Follower list (editable source)
│   ├── followers.json      # Follower list (generated JSON)
│   └── tweets.json         # Tweet data
├── .github/workflows/      # GitHub Actions
└── docs/                   # Documentation
```

## Tech Stack

- **Build tool**: [Vite](https://vitejs.dev/)
- **Framework**: [React](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Data source**: [Nitter](https://github.com/zedeus/nitter)
- **Automation**: GitHub Actions

## Script Commands

```bash
# Development
pnpm dev              # Start the dev server

# Build
pnpm build            # Build for production

# Data management
pnpm run build-followers      # Build follower config
pnpm run validate-followers   # Validate follower config
pnpm run manage-followers     # Manage followers (add/remove)
pnpm run fetch-tweets         # Fetch tweets
```

## Automation

- **CI**: Runs lint and build on pushes and pull requests.
- **Dependency updates**: Automatically updates dependencies weekly and opens PRs.
- **Auto-merge**: Automatically merges eligible PRs after CI passes.

## Contributing

Issues and pull requests are welcome.

## License

[MIT License](LICENSE)

## Acknowledgments

- [Nitter](https://github.com/zedeus/nitter) - Provides the tweet data source
- [x-gpt.bwequation.com](https://x-gpt.bwequation.com/) - Feature inspiration

---

<div align="center">
Made with ❤️ by <a href="https://github.com/xwartz">xwartz</a>
</div>
