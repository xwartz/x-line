# Project Guidelines

This repo is a React + TypeScript + Vite reader for aggregated X timelines. Prefer small, concrete changes that match the existing editorial UI and current component structure.

## Do

- Preserve the design rules in `DESIGN.md`: black-and-white first, square corners, hairline dividers, serif-led hierarchy, and restrained motion.
- Use semantic CSS variables and shared interaction utilities from `src/index.css` for colours, surfaces, hover states, overlays, and motion.
- Keep changes narrow and local. Edit existing components before introducing new abstractions or dependencies.
- Use functional React components and hooks. Follow the composition already used in `src/App.tsx`, `src/components/FollowerList.tsx`, and `src/components/Timeline.tsx`.
- Keep data loading and adaptation outside presentational components. Use `src/hooks/useTweets.ts` and `src/hooks/useLocalStorage.ts` instead of ad hoc fetching or persistence logic.
- Respect `prefers-reduced-motion` whenever adding or changing animation.
- Update `DESIGN.md` when a visual rule or token contract changes.

## Don't

- Do not hard-code raw colour literals in component code, including `#hex`, `rgba(...)`, `bg-black/35`, or `text-white/72`. Add or extend tokens in `src/index.css` first.
- Do not add rounded corners or soft drop-shadows. The product should stay editorial, flat, and square.
- Do not wrap a whole quote block in an outer link. Quote content can already contain inline anchors in `src/components/TweetCard.tsx`.
- Do not fetch remote data directly inside UI components.
- Do not hand-edit generated output such as `data/followers.json` or `dist/`.
- Do not add new packages, change package versions, or swap core tooling without approval.

## Commands

Prefer the narrowest check that matches the change.

- Install dependencies: `pnpm install`
- Start local dev server: `pnpm dev`
- Lint a single file: `pnpm exec biome check path/to/file.tsx`
- Format a single file: `pnpm exec biome check --write path/to/file.tsx`
- Lint this instruction file: `pnpm exec biome check AGENTS.md`
- Validate follower source data: `pnpm run validate-followers`
- Regenerate `data/followers.json` after editing `data/followers.txt`: `pnpm run build-followers`
- Typecheck the app: `pnpm exec tsc -b --pretty false`
- Run the production build: `pnpm build`
- There is no dedicated unit test suite in this repo today; rely on lint, typecheck, and build unless the task adds tests.

## Safety and Permissions

Allowed without prompt:

- Read, search, and list files.
- Run `pnpm exec biome check ...`.
- Run `pnpm run validate-followers`.
- Run `pnpm run build-followers`.
- Run `pnpm exec tsc -b --pretty false`.
- Run `pnpm build`.

Ask first:

- `pnpm install` or any dependency/version change.
- `pnpm run fetch-tweets` or any networked data refresh.
- Deleting files or rewriting large generated datasets.
- Git push, release, or CI/workflow changes unless explicitly requested.
- Introducing a new test framework, state library, or build tool.

## Project Structure

- `src/main.tsx` boots `ThemeProvider` and `App`.
- `src/App.tsx` owns page composition: header, source filter, timeline, and footer.
- `src/index.css` is the shared design-system entry point for theme tokens, interaction feedback, and motion rules.
- `src/components/FollowerList.tsx` owns source filtering, the mobile drawer, and scroll lock behavior.
- `src/components/TweetCard.tsx` owns tweet content parsing, rich link rendering, media grids, and quote handling.
- `src/components/Button.tsx` is the baseline pattern for interactive controls.
- `src/hooks/useTweets.ts` adapts `data/tweets.json` into runtime-friendly values.
- `data/followers.txt` is the editable source of truth; `data/followers.json` is generated output.
- `docs/FOLLOWERS_CONFIG.md` documents follower configuration rules.

## Good Examples

- Interaction feedback and control styling: `src/components/Button.tsx`, `src/components/ThemeToggle.tsx`, `src/components/ScrollToTop.tsx`
- Editorial layout and section framing: `src/App.tsx`, `src/components/Timeline.tsx`
- Rich content rendering with inline links and quotes: `src/components/TweetCard.tsx`
- Token-driven surfaces and motion utilities: `src/index.css`

## PR Checklist

- Keep the diff small and focused.
- Run the narrowest relevant validation command for the files you changed.
- Run `pnpm build` for multi-file UI work, data-shape changes, or production-affecting behavior.
- Regenerate follower data if `data/followers.txt` changed.
- Remove raw colour literals, dead code, and unrelated refactors.
- Update `DESIGN.md`, `README.md`, or other docs when user-facing behavior or project rules change.

## When Stuck

- Ask a clarifying question or propose a short plan instead of guessing.
- Step to the closest owning file before making broader repo-wide changes.
- If multiple approaches are possible, prefer the one that reuses existing patterns and produces the smallest diff.
