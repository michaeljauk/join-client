# join-client

A typed TypeScript SDK, CLI and MCP server for the [JOIN](https://join.com) recruiting API.
Unofficial, community-maintained.

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://buymeacoffee.com/michaeljauk)

[![CI](https://github.com/michaeljauk/join-client/actions/workflows/ci.yml/badge.svg)](https://github.com/michaeljauk/join-client/actions/workflows/ci.yml)
[![CodeQL](https://github.com/michaeljauk/join-client/actions/workflows/codeql.yml/badge.svg)](https://github.com/michaeljauk/join-client/actions/workflows/codeql.yml)
[![join-sdk](https://img.shields.io/npm/v/join-sdk.svg?label=join-sdk)](https://www.npmjs.com/package/join-sdk)
[![join-sdk downloads](https://img.shields.io/npm/dm/join-sdk.svg?label=sdk%20downloads)](https://www.npmjs.com/package/join-sdk)
[![join-com-cli](https://img.shields.io/npm/v/join-com-cli.svg?label=join-com-cli)](https://www.npmjs.com/package/join-com-cli)
[![join-com-cli downloads](https://img.shields.io/npm/dm/join-com-cli.svg?label=cli%20downloads)](https://www.npmjs.com/package/join-com-cli)
[![join-mcp](https://img.shields.io/npm/v/join-mcp.svg?label=join-mcp)](https://www.npmjs.com/package/join-mcp)
[![join-mcp downloads](https://img.shields.io/npm/dm/join-mcp.svg?label=mcp%20downloads)](https://www.npmjs.com/package/join-mcp)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## Why

JOIN publishes OpenAPI documents on [docs.join.com](https://docs.join.com), but no TypeScript client.
This repo generates three packages from those documents:

- **`join-sdk`**: a typed client on [`openapi-fetch`](https://openapi-ts.dev/openapi-fetch/). It
  retries on HTTP 429 and has a helper for cursor paging (`collectPages`).
- **`join-com-cli`**: the `join-com` command, with one subcommand per endpoint. It prints JSON, so
  you can pipe the output through `jq`. `join-com skill install` adds a Claude Code skill to
  `~/.claude/skills/join/`.
- **`join-mcp`**: a Model Context Protocol server for AI agents. It has two tools (`search`,
  `execute`) instead of one tool per endpoint.

Typical use cases:

- Export the applications and CV documents of a job for a review outside JOIN
- Move applications between pipeline stages from a script
- Show your open jobs on your own careers page
- Let an AI agent summarise new applications, candidate notes and scorecards

## Packages

| Package                        | What it is                                                   |
| ------------------------------ | ------------------------------------------------------------ |
| [`join-sdk`](packages/sdk)     | Typed client on `openapi-fetch`, with 429 retry and paging   |
| [`join-com-cli`](packages/cli) | `join-com` command, one subcommand per endpoint, JSON output |
| [`join-mcp`](packages/mcp)     | MCP server with two tools (`search`, `execute`)              |

---

## Quick start

Create a company API token in JOIN under Company Settings → Developer → API tokens. A token belongs
to one JOIN company.

```bash
npm install -g join-com-cli
join-com auth login --profile acme        # paste the token, or pipe it in
join-com jobs list
join-com applications list --job-id 123 --all | jq 'length'
join-com download "<documents[].url from an application>" -o cv.pdf
join-com skill install                    # optional: Claude Code skill
```

SDK:

```ts
import { collectPages, createJoinClient } from "join-sdk";

const join = createJoinClient({ token: process.env.JOIN_TOKEN! });
const { data: page } = await join.GET("/jobs", {
  params: { query: { status: ["ONLINE"] } },
});
const applications = await collectPages((cursor) =>
  join.GET("/applications", {
    params: { query: { jobId: 123, cursor, limit: 50 } },
  }),
);
```

MCP (Claude Code):

```bash
claude mcp add join -e JOIN_PROFILE=acme -- npx -y join-mcp
```

## Coverage

All 25 operations of JOIN API v3 (revision `2026-11-01`): jobs, applications and stage moves,
candidates, candidate notes, scorecards, locations, contract types, employment types, pipeline
templates and remote regions. Application documents download from pre-signed URLs.

JOIN API v2 is not supported from 1.0 on. The JOIN API has no endpoint to reject an application,
update a candidate profile or send a message. Use the JOIN web app for those. A stage move
(`move-stage`) can trigger the stage's automated emails, as a move in JOIN does.

## Development

See [AGENTS.md](AGENTS.md).

```bash
pnpm install
pnpm generate && pnpm typecheck && pnpm lint && pnpm build && pnpm test
pnpm spec:fetch   # rebuild openapi.json from docs.join.com
```

## Disclaimer

Unofficial and not affiliated with [JOIN](https://join.com). "JOIN" is their trademark. The JOIN
API and its documentation belong to JOIN.

## Support

Built by [Michael Jauk](https://github.com/michaeljauk). If this saves you time, consider
[buying me a coffee](https://buymeacoffee.com/michaeljauk).

## License

[MIT](./LICENSE) © Michael Jauk, for the code in this repository.
