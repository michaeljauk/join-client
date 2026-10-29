# join-client

Community TypeScript SDK, CLI and MCP server for the [JOIN](https://join.com) recruiting API.
Generated from the OpenAPI documents on [docs.join.com](https://docs.join.com). Not an official JOIN
product.

| Package                        | What it is                                                   |
| ------------------------------ | ------------------------------------------------------------ |
| [`join-sdk`](packages/sdk)     | Typed client on `openapi-fetch`, with 429 retry and paging   |
| [`join-com-cli`](packages/cli) | `join-com` command, one subcommand per endpoint, JSON output |
| [`join-mcp`](packages/mcp)     | MCP server with two tools (`search`, `execute`)              |

## Quick start

Create a company API token in JOIN under Company Settings → Developer → API tokens. A token belongs
to one JOIN company.

```bash
npm install -g join-com-cli
join-com auth login --profile acme        # paste the token, or pipe it in
join-com jobs list
join-com applications list --job-id 123 --all | jq 'length'
join-com download "<documents[].url from an application>" -o cv.pdf
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
update a candidate profile or send email. Use the JOIN web app for those.

## Development

See [AGENTS.md](AGENTS.md).

```bash
pnpm install
pnpm generate && pnpm typecheck && pnpm lint && pnpm build && pnpm test
pnpm spec:fetch   # rebuild openapi.json from docs.join.com
```

## License

MIT for the code in this repository. The JOIN API and its documentation belong to JOIN.
