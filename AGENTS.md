# Repository Guidelines

## Project Structure & Module Organization
- Nx monorepo. Apps live in `apps/` and shared code in `libs/`.
- Key apps: `apps/client` (React + Vite), `apps/server` (NestJS), `apps/artboard` (preview), `apps/graphai` (AI workflows).
- Shared libs: `libs/{ui,utils,parser,schema,dto,hooks}`. Build output in `dist/`.
- Infra: Prisma schema in `tools/prisma/schema.prisma`; Docker compose files in `tools/compose/`.

## Build, Test, and Development Commands
- Prereqs: Node `>=22.13.1`, pnpm. Install: `pnpm install`.
- Dev (all/one): `pnpm dev`; or `pnpm nx serve client` / `pnpm nx serve server`.
- Build (all/one): `pnpm build`; or `pnpm nx build client`.
- Start prod server (after build): `pnpm start`.
- Tests: Vitest via `pnpm test`. Server (Jest): `pnpm nx test server`. Coverage: `pnpm vitest run --coverage`.
- Lint/format: `pnpm lint`, `pnpm lint:fix`, `pnpm format:fix`.
- Prisma: `pnpm prisma:generate`, local dev migrations: `pnpm prisma:migrate:dev`.
- Docker (optional): `docker compose -f compose.dev.yml up`.

## Coding Style & Naming Conventions
- TypeScript-first. Keep modules small, typed, and testable.
- Prettier (100 cols, Tailwind plugin). Run `pnpm format:fix` before pushing.
- ESLint enforces import sorting, no unused imports, and Nx module boundaries.
- Naming: folders kebab-case; React components `PascalCase`; functions/vars `camelCase`. Avoid `console` in server—use Nest logger.

## Testing Guidelines
- Co-locate tests under `src/` as `*.test.ts(x)` or `*.spec.ts(x)`.
- Prefer unit tests for libs; integration tests for apps (e.g., `apps/graphai/tests`).
- Mock network/IO; test public APIs. Aim for meaningful coverage, not just %.

## Commit & Pull Request Guidelines
- Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`.
- PRs: clear description, linked issues, screenshots for UI changes, note breaking changes and migration steps.
- Scope changes to a single area (`apps/...` or `libs/...`) and update related docs.

## Security & Configuration Tips
- Copy `/.env.example` to `/.env` (and `apps/graphai/.env.example` if needed). Never commit secrets.
- Required env: DB, MinIO/S3, SMTP, auth secrets. See `README.md` and `tools/compose/` for details.
