# join-com-cli

Command-line interface for the [JOIN](https://join.com) recruiting API. Installs the `join-com`
command. Community project, not an official JOIN product.
The command is not called `join` because macOS and Linux already ship a `join` utility.

```bash
npm install -g join-com-cli
```

## Authentication

```bash
join-com auth login --profile acme          # prompts for the token
pbpaste | join-com auth login --profile acme --default
join-com auth status                        # lists profiles and tests the active token
join-com auth logout --profile acme
```

Create a company API token in JOIN under Company Settings → Developer → API tokens. A token belongs
to one JOIN company, so store one profile per company. Profiles live in
`~/.config/join-cli/credentials.json` (mode 600).

Each command resolves the token in this order: `--token` or `$JOIN_TOKEN`, then `--profile` or
`$JOIN_PROFILE`, then the default profile. `--base-url` / `$JOIN_BASE_URL` override the API URL.

## Usage

Every command prints the JSON response to stdout. Targets JOIN API v3.

```bash
join-com jobs list --status ONLINE,OFFLINE
join-com applications list --job-id 123 --status ACTIVE --all
join-com applications get 456
join-com applications move-stage 456 --data '{"stageId":501}'
join-com scorecards list --candidate-id 789
join-com candidates list-notes 789
join-com candidates create-note 789 --data '{"content":"Called, follow up Friday"}'
join-com download "<documents[].url from an application>" -o cv.pdf
```

Command names follow the API paths:

| Pattern                        | Command                   |
| ------------------------------ | ------------------------- |
| `GET /x`, `POST /x`            | `list`, `create`          |
| `GET/PATCH/DELETE /x/{id}`     | `get`, `update`, `delete` |
| `GET /x/{id}/sub`              | `list-sub`                |
| `POST /x/{id}/sub`             | `create-<singular>`       |
| `DELETE /x/{id}/sub/{sid}`     | `delete-<singular>`       |
| `PUT /applications/{id}/stage` | `move-stage`              |

- Paginated list commands print `{ data, nextCursor }`. Pass `--cursor` for the next page, or
  `--all` to follow the cursor (`--limit`, default 50 per request) and print one array.
- `--accept-language de` translates display names where JOIN supports it.
- Mutating commands read the body from `--data '<json>'`, `--data @file.json`, `--data -`, or stdin.
- `download` fetches a pre-signed document URL without sending the JOIN token.
- The client retries HTTP 429 after the `Retry-After` delay.

## Claude Code skill

A global install copies `skills/join/SKILL.md` and the generated `SCHEMA.md` to
`~/.claude/skills/join/`.

## Exit codes

`0` success, `1` error, `2` not authenticated.
