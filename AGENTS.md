# AGENTS.md

Guidance for coding agents and contributors working in this repo.

## What this repo is

A community TypeScript client for the [JOIN](https://join.com) recruiting API, generated from the
OpenAPI documents on [docs.join.com](https://docs.join.com). Three published packages:

| Package        | Path           | Purpose                                                   |
| -------------- | -------------- | --------------------------------------------------------- |
| `join-sdk`     | `packages/sdk` | Typed `openapi-fetch` client, rate-limit retry, paging    |
| `join-com-cli` | `packages/cli` | `join-com` binary, one command per endpoint, Claude skill |
| `join-mcp`     | `packages/mcp` | MCP server in Code Mode (`search` + `execute`)            |

This is not an official JOIN product.

## Setup

```bash
pnpm install
pnpm generate     # openapi.json -> SDK types, CLI commands, SCHEMA.md, MCP spec
pnpm typecheck    # TypeScript 7 tsc
pnpm lint         # oxlint with type-aware rules
pnpm build
pnpm test
```

Development needs Node 22.12 or later (commitlint 21); `.nvmrc` pins 22. The published packages
support Node 20 or later.

## Core conventions

- pnpm and Turborepo. ESM only. Build with tsup.
- Conventional Commits, enforced by commitlint. **One package per commit**, scoped `sdk:`, `cli:`,
  `mcp:`. Release Please routes changelog entries by file path, not by scope.
- Never edit generated files: `packages/sdk/src/generated.ts`, `packages/cli/src/commands/generated/`,
  `packages/cli/skills/join/SCHEMA.md`, `packages/mcp/src/spec.json`.
- Toolchain: oxlint plus `oxlint-tsgolint`, Prettier, TypeScript 7 `tsc` for the typecheck. The
  `typescript` package stays on TS 6 (`@typescript/typescript6`) because tsup needs the compiler API
  for declaration files. Drop the alias when TS 7.1 ships an API.

## Spec workflow

JOIN publishes no single spec file. Each reference page on docs.join.com embeds an OpenAPI document
with one operation. `pnpm spec:fetch` reads the page index (`llms.txt`), skips guide pages without
a document, merges all documents into `openapi.json`, and fails on any conflict between two pages.

The client targets API v3. The URL selects the major version; the `Join-Version` header selects a
dated revision. `DEFAULT_API_VERSION` in `packages/sdk/src/client.ts` must match `info.version` in
`openapi.json`. Bump both together.

After a spec change:

1. `pnpm spec:fetch` and review the `openapi.json` diff.
2. `pnpm generate && pnpm typecheck && pnpm test`.
3. Commit the spec bump on its own.

## CLI commands are generated

`packages/cli/scripts/endpoints.mjs` maps each operation to a resource and a command name. Path
segments and parameters become kebab-case (`/employmentTypes` -> `employment-types`,
`createdAfter` -> `--created-after`). Action endpoints such as `PUT /applications/{id}/stage` have an
explicit entry in `OVERRIDES`.

Generated behavior:

- `GET` endpoints with a `cursor` parameter get `--all`, which follows `nextCursor`.
- Header parameters such as `Accept-Language` become flags. `Join-Version` is set by the SDK.
- Endpoints with a binary response write to `--output`. v3 has none.
- Mutating endpoints read the body from `--data`, `--data @file.json`, `--data -`, or stdin.

Hand-written commands: `auth` (token profiles) and `download` (application document by its
pre-signed URL, fetched without the JOIN token).

## Claude Code skill

`packages/cli/skills/join/SKILL.md` is hand-written. `SCHEMA.md` next to it is generated. `join-com skill
install` copies both to `$CLAUDE_CONFIG_DIR/skills/join/` (default `~/.claude/skills/join/`). The
postinstall script does the same on a global install, but npm 12+ and pnpm 10+ block it by default.

## Testing

Vitest. SDK tests mock `fetch` and cover auth, errors, 429 retry and paging. MCP tests cover path
normalization. Never call the live API from tests.

## Release

Release Please with linked versions. Merge the "Version Packages" PR, and the release workflow
publishes all three packages to npm through OIDC trusted publishing with provenance. No npm token.

## Scope discipline

Keep the SDK generic and small: one runtime dependency (`openapi-fetch`). No workflows that combine
JOIN with another system. Those belong in the consumer.

## Things to avoid

- Do not log tokens or candidate data. Redact both in issues and test fixtures.
- Do not commit real candidate data, attachment URLs or `sig` values.
- Do not add write operations to examples without a warning. Writes take effect at once.
