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

A token belongs to one JOIN company, so store one profile per company. Profiles live in
`~/.config/join-cli/credentials.json` (mode 600).

Each command resolves the token in this order: `--token` or `$JOIN_TOKEN`, then `--profile` or
`$JOIN_PROFILE`, then the default profile. `--base-url` / `$JOIN_BASE_URL` override the API URL.

## Usage

Every command prints JSON to stdout.

```bash
join-com jobs list --status ONLINE,OFFLINE,ARCHIVED
join-com applications list --job-id 123 --hiring-state ACTIVE --all
join-com applications get 456
join-com applications list-scorecards 456
join-com candidates list-notes 789
join-com candidates create-note 789 --data '{"content":"Called, follow up Friday"}'
join-com applications replace-tags 456 --data '{"tags":["shortlist"]}'
join-com download "https://api.join.com/v2/attachments/<id>/<file>.pdf?sig=<sig>" -o cv.pdf
```

Command names follow the API paths:

| Pattern                    | Command                                      |
| -------------------------- | -------------------------------------------- |
| `GET /x`, `POST /x`        | `list`, `create`                             |
| `GET/PATCH/DELETE /x/{id}` | `get`, `update`, `delete`                    |
| `GET /x/{id}/sub`          | `list-sub`                                   |
| `POST /x/{id}/sub`         | `create-<singular>`                          |
| `PUT /x/{id}/sub`          | `replace-sub`                                |
| `PATCH /jobs/{id}/archive` | `archive` (also `activate`, `change-status`) |

- `--all` on list commands fetches every page (50 per request).
- Mutating commands read the body from `--data '<json>'`, `--data @file.json`, `--data -`, or stdin.
- The client retries HTTP 429 after the `x-ratelimit-reset` delay.

## Claude Code skill

A global install copies `skills/join/SKILL.md` and the generated `SCHEMA.md` to
`~/.claude/skills/join/`.

## Exit codes

`0` success, `1` error, `2` not authenticated.
