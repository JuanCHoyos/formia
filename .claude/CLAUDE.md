# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Formly — Project Instructions

## Project Overview

Formly is a monorepo containing an Angular frontend and an Elysia backend, built with TypeScript.

The project uses:
- Angular with standalone components and signals.
- PrimeNG and Tailwind CSS.
- Elysia and Eden Treaty for API communication.
- AWS Cognito for authentication.
- AWS services managed with SST.
- pnpm for package management where configured.

## General Rules

- Use TypeScript strict typing.
- Never use `any`.
- Avoid unnecessary type assertions and unsafe casts.
- Prefer simple, readable solutions over unnecessary abstractions.
- Do not introduce dependencies unless they provide clear value.
- Do not modify unrelated files.
- Follow the existing project architecture and naming conventions.
- Do not invent APIs, methods, configuration options, or library behavior. Verify against installed types or official documentation when uncertain.
- Explain important trade-offs before introducing architectural changes.

## Angular

- Prefer standalone components; do not introduce NgModules.
- Use Angular signals and modern APIs where appropriate.
- Prefer `inject()` for dependency injection, following existing conventions.
- Use the project's existing state management and form patterns.
- Keep components focused and move reusable business logic into appropriate services or utilities.
- Avoid duplicating API authentication logic across individual requests.

## Backend

- Follow the existing Elysia routing and plugin conventions.
- Keep request validation and response types aligned with the schemas.
- Reuse existing authentication and authorization mechanisms.
- Keep backend business logic separate from route definitions when appropriate.
- Use Eden Treaty types instead of duplicating API contracts in the frontend.

## AWS and Authentication

- Follow the existing SST infrastructure configuration.
- Never expose credentials, tokens, secrets, or private environment variables.
- Do not change deployed resources or infrastructure without explicit authorization.
- Keep Cognito token validation on the backend; frontend token presence alone does not authorize access.

## Workflow

Before making changes:
1. Inspect the relevant files and existing patterns.
2. Identify the smallest coherent change that solves the requirement.
3. Check the installed library versions and available APIs when needed.

After making changes:
1. Run the relevant typecheck, lint, and tests when available.
2. Report the files changed and validation results.
3. Clearly identify any checks that could not be run.

Do not claim that a command or test passed unless it was actually executed successfully.

## Commands

Run from the repo root unless noted. The root is a single git repo for the whole monorepo.

- `pnpm dev` — builds `@formly/core`, then `sst dev --stage dev` (deploys/links real AWS resources; needs AWS credentials). `pnpm dev:secrets` loads SST secrets.
- Frontend only (`apps/frontend`): `pnpm dev` (`ng serve` plus watchers on backend types and core), `pnpm build`, `pnpm test`. A single spec: `pnpm exec ng test --include src/app/app.spec.ts`.
- Backend (`apps/backend`): `pnpm dev` (`tsx watch src/index.ts`, port 3000, prefix `/api/v1`); `pnpm build:types` emits the `.d.ts` the frontend needs. The backend imports `sst` `Resource`, so running it locally without `sst dev` will fail on missing linked resources.
- Typecheck: `pnpm exec tsc -p tsconfig.json --noEmit` inside `apps/backend` or `packages/core`; the frontend typechecks via `ng build`.
- Tests: `pnpm test:unit` runs backend, github-oidc and core with Vitest (root `vitest.config.ts`); the frontend runs through the Angular builder (`pnpm --filter @formly/frontend test`, `test:coverage`). Frontend specs run isolated so `vi.mock` works per file.
- Lint and format: `pnpm lint` / `pnpm lint:fix` (root `eslint.config.ts`) and `pnpm format` / `pnpm format:check` (root `.prettierrc.mjs`). ESLint forbids `any`, removes unused imports and sorts imports and union types; each package lists its framework imports first (Angular in the frontend, Elysia then SST in the backend, SST in infra).
- Git hooks (Lefthook, `lefthook.yml`): pre-commit runs ESLint `--fix` and Prettier on staged files, commit-msg validates the commit convention with commitlint (`.commitlintrc.yml`), pre-push runs all tests.

## Architecture

Workspaces: `apps/*`, `packages/*`, with shared versions in the `catalog:` of `pnpm-workspace.yaml`. `infra/*.ts` is SST infrastructure wired together in `sst.config.ts`.

- **`packages/core` (`@formly/core`)** is the shared layer. Zod schemas live in `src/schemas` and are the only part compiled to `dist` (`tsconfig.json` includes just `src/schemas`); consumers import them as `@formly/core/schemas/<name>`, so **rebuild core (`pnpm --filter @formly/core build`) after changing a schema**. `src/data` holds DynamoDB-Toolbox entities, one per table, wrapped by `createModel`. `src/auth` verifies Cognito JWTs with `aws-jwt-verify`. `src/lambda` adapts an Elysia app to an API Gateway v2 / function URL Lambda handler.
- **`apps/backend`** is an Elysia app (`src/app.ts`, prefix `/api/v1`) with feature modules in `src/modules/<name>/{x.router,x.service}.ts`, composed in `src/routers.ts`. The same app runs locally via `app.listen` and on AWS Lambda via `elysiaLambda` (from `@formly/core/lambda`, handler exported from `src/index.ts`). Its public contract is the `App` type, exposed as `@formly/backend/api` (types only, from `dist/api.d.ts`).
- **`apps/github-oidc`** is a separate Lambda (`infra/github-oidc.ts`) that bridges GitHub's OAuth 2.0 to OpenID Connect so Cognito can use GitHub as an OIDC provider. It reuses `elysiaLambda` from core.
- **`apps/frontend`** is Angular 22 (signals, PrimeNG, Tailwind 4, `@ngx-formly` for the form builder, ngx-translate with `public/i18n/{en,es}.json`, Amplify for Cognito). Path aliases: `@core/*`, `@features/*`, `@environments/*`, `@/*` (see `tsconfig.json`). Config comes from `NG_APP_*` env vars injected by SST (`@ngx-env/builder`). Angular conventions are in `apps/frontend/AGENTS.md` and take precedence for frontend code.

### Type flow between apps

The frontend's Eden client (`core/api/api-client.ts`, `treaty<App>`) gets its types from the backend's emitted `dist/api.d.ts`, not from source. After changing a backend route or schema, run `pnpm --filter @formly/backend build:types` or the frontend will see stale types. `apps/frontend` `dev`/`build`/`test` already do this first.

### Authentication

Every authenticated request carries **two** Cognito tokens: `Authorization: Bearer <accessToken>` and `x-id-token: <idToken>`. The frontend adds them in `core/api/api-client.ts` (Eden) and `core/auth/auth.interceptor.ts` (HttpClient). The backend verifies both in `middleware/authenticated.ts`:
- `authenticatedWithUser` — requires an existing user (looked up by ID-token email); derives `user`.
- `authenticatedWithCognito` — for registration; rejects with 409 if the user already exists; derives `cognito`.

### Data and infra

Five DynamoDB tables (User, Form, FormResponse, ProjectAsset, FormRespondentAccess), defined in `infra/dynamo.ts` and mirrored by entities in `packages/core/src/data/models`. Keep key and index definitions in both places in sync. Table names resolve from SST `Resource` links, with the region from the `DynamoDB` linkable. Stage regions are mapped in `sst.config.ts` (`prod` → us-east-1, `dev` → us-east-2). Note that `removal`/`protect` there key off the stage name `production`, not `prod`.

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues for `JuanCHoyos/formia`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
