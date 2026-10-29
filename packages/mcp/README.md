# join-mcp

[Model Context Protocol](https://modelcontextprotocol.io) server for the [JOIN](https://join.com)
recruiting API. Community project, not an official JOIN product.

It uses Code Mode from `@cloudflare/codemode`: two tools instead of one per endpoint.

- `search` runs JavaScript against the OpenAPI spec to find endpoints and fields.
- `execute` runs JavaScript that calls `codemode.request({ method, path, query, body })`.

The token stays in the server process and never reaches the model.

## Setup

Store a token with the CLI (`npx join-com-cli auth login --profile acme`) or pass `JOIN_TOKEN`.

```bash
claude mcp add join -e JOIN_PROFILE=acme -- npx -y join-mcp
```

```json
{
  "mcpServers": {
    "join": {
      "command": "npx",
      "args": ["-y", "join-mcp"],
      "env": { "JOIN_PROFILE": "acme" }
    }
  }
}
```

| Variable        | Meaning                                   |
| --------------- | ----------------------------------------- |
| `JOIN_TOKEN`    | Company API token. Wins over profiles.    |
| `JOIN_PROFILE`  | Stored profile from `join-com auth login` |
| `JOIN_BASE_URL` | API base URL override                     |

## Behavior

- Targets JOIN API v3, revision `2026-11-01`. Responses wrap the payload under `data`.
- Paginated list endpoints return `{ data, nextCursor }` with at most `limit` (max 50) records.
  Pass `nextCursor` as `cursor` until it is `null`. Contract types, employment types, remote
  regions and scorecards return `{ data }` only.
- A GET with a document URL from `application.documents[].url` as `path` downloads the file. The
  URL is pre-signed external storage, so the server fetches it without the JOIN token. It saves the
  file under `<os tmpdir>/join-mcp/` (mode 600) and returns `{ savedTo, contentType, bytes }`. The
  links expire after one hour. These files contain personal data. Delete them when you are done.
- The server exposes every operation, including writes. Writes take effect immediately. A stage
  move can send automated emails to the candidate, and `POST /jobs` publishes the job unless the
  body sets `status` to `OFFLINE`.

## Security

Agent-written code runs in the server's Node process without a sandbox, with the same rights as
the server. Run it only as a local stdio server for a user who already holds the token.
