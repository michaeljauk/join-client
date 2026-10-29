---
name: join
version: 0.1.0
description: "JOIN recruiting CLI (join.com, API v3): list jobs, applications, candidates, pipeline stages, screening answers, scorecards, notes and locations, move applications between stages, and download CVs and cover letters. Use when the user asks about JOIN, job applications, candidates, the hiring pipeline, or applicant documents."
---

# join - JOIN Recruiting CLI

Community CLI for the [JOIN](https://join.com) recruiting API, from `join-com-cli` and `join-sdk`.

## Setup check

```bash
join-com --help          # CLI installed?
join-com auth status     # token stored and valid?
```

If not authenticated, tell the user to:

1. In JOIN, open **Company Settings → Developer → API tokens** (System Admin only), create a token
   and copy it. It is shown once.
2. Run `join-com auth login --profile <name>`, then paste the token, or pipe it:
   `pbpaste | join-com auth login --profile <name>`.

One token belongs to one JOIN company. Store one profile per company and pick it with
`--profile <name>` or `$JOIN_PROFILE`. `join-com auth status` lists the profiles.

Auth sources, in order: `--token` / `$JOIN_TOKEN`, then `--profile` / `$JOIN_PROFILE`, then the
default profile. Tokens are stored in `~/.config/join-cli/credentials.json` (mode 600).

## Working with the CLI

Every command prints JSON to stdout. Errors go to stderr with a non-zero exit code. Pipe through
`jq`.

```bash
join-com --help                     # resources
join-com <resource> --help          # verbs
join-com <resource> <verb> --help   # flags
```

Common reads:

```bash
join-com jobs list --status ONLINE,OFFLINE --all        # omit --status for all published jobs
join-com jobs get <jobId>                               # includes the job's pipeline stages
join-com applications list --job-id <jobId> --status ACTIVE --all
join-com applications get <applicationId>               # screening answers, documents, stage
join-com scorecards list --candidate-id <candidateId>
join-com candidates list-notes <candidateId>
join-com download "<documents[].url>" -o cv.pdf         # then: pdftotext -layout cv.pdf -
```

## Response shapes

**Never guess field names.** Read [`SCHEMA.md`](./SCHEMA.md) (generated from the spec) or inspect a
real response: `join-com applications list --limit 1 | jq '.data[0] | keys'`.

Stable facts (JOIN API v3, revision `2026-11-01`):

- Every response wraps the payload under `data`. Paginated list commands return
  `{ data, nextCursor }`. Contract types, employment types, remote regions and scorecards return
  `{ data }` only, without `nextCursor`.
- Paging: `--limit` (max 50) and `--cursor <nextCursor>`. `--all` follows the cursor and prints
  one plain array. `--sort=-createdAt` returns newest first.
- An application has `status` (`ACTIVE`, `REJECTED`, `HIRED`) and `currentStage` (`id`, `name`,
  `type`, `order`). `OFFER` is not a status.
- `documents[].url` is a pre-signed link to external storage, valid for one hour. Pass it to
  `join-com download` as is. If it has expired, read the application again.
- Candidate IDs are company candidate IDs. IDs from API v2 may differ.
- Draft jobs never appear in the API.

## What the API cannot do

The JOIN API cannot reject or cancel an application, update a candidate profile, edit a note or
change application tags. Those actions stay in the JOIN web app. Do not try to emulate them with
notes or stage moves unless the user asks for that.

## Writes

Every `create`, `update` and `delete`, `move-stage` and `create-note` take effect immediately.
**Ask the user before every write.** Watch these side effects:

- `jobs create` creates the job `ONLINE` unless the body sets `"status": "OFFLINE"`, so it goes to
  job boards at once. Setting `status` to `ONLINE` on `jobs update` publishes as well.
- `applications move-stage` can trigger the stage's automated emails to the candidate, as a move
  in JOIN does. Moving to a `HIRED` stage hires the candidate.
- `applications create` adds a real application with candidate data to the job.
- `candidates delete` permanently removes the candidate with all applications, notes and
  documents.

## Errors

| Exit | Meaning                                      |
| ---- | -------------------------------------------- |
| `0`  | Success                                      |
| `1`  | Error on stderr (bad args, network, 4xx/5xx) |
| `2`  | Not authenticated: run `join-com auth login` |

Errors carry `error.code`, for example `token_invalid` (401: revoked or unknown token) or
`job_not_found` (404). 422 `validation_error` lists the failing fields in `error.details`. The
client retries 429 responses on its own.

## Things to avoid

- Do not print or log the token.
- Candidate data is personal data. Do not copy CVs or contact details into shared places without
  the user's instruction, and delete downloaded files when the task is done.

## Reference

- Field reference: [`SCHEMA.md`](./SCHEMA.md)
- API docs: <https://docs.join.com> (migration notes: `/reference/migration-guide-from-v2`)
- Repo: <https://github.com/michaeljauk/join-client>
