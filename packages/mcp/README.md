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
| `JOIN_TOKEN`    | API token. Wins over stored profiles.     |
| `JOIN_PROFILE`  | Stored profile from `join-com auth login` |
| `JOIN_BASE_URL` | API base URL override                     |

## Behavior

- List endpoints return at most `pageSize` (max 50) items. Loop `page` until a page is short.
- `path` accepts a full attachment URL from `application.attachments[].url`. The server saves the
  file under `<os tmpdir>/join-mcp/` (mode 600) and returns `{ savedTo, contentType, bytes }`.
  These files contain personal data. Delete them when you are done.
- The server exposes every operation, including writes. Writes take effect immediately.

## Security

Agent-written code runs in the server's Node process without a sandbox, with the same rights as
the server. Run it only as a local stdio server for a user who already holds the token.
