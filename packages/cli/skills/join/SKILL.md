---
name: join
version: 0.1.0
description: "JOIN recruiting CLI (join.com): list jobs, applications, candidates, pipeline stages, screening answers, scorecards, notes, tags, and download CVs and cover letters. Use when the user asks about JOIN, job applications, candidates, the hiring pipeline, or applicant documents."
---

# join - JOIN Recruiting CLI

Community CLI for the [JOIN](https://join.com) recruiting API, from `join-com-cli` and `join-sdk`.

## Setup check

```bash
join-com --help          # CLI installed?
join-com auth status     # token stored and valid?
```

If not authenticated, tell the user to:

1. Open <https://join.com/user/api-credentials> and copy the API token.
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
join-com jobs list --status ONLINE,OFFLINE,ARCHIVED     # default is ONLINE only
join-com applications list --job-id <jobId> --hiring-state ACTIVE --all
join-com applications get <applicationId>               # screening answers, attachments, stage
join-com applications list-scorecards <applicationId>
join-com candidates list-notes <candidateId>
join-com download "<attachments[].url>" -o cv.pdf       # then: pdftotext -layout cv.pdf -
```

## Response shapes

**Never guess field names.** Read [`SCHEMA.md`](./SCHEMA.md) (generated from the spec) or inspect a
real response: `join-com applications list --page-size 1 | jq '.[0] | keys'`.

Stable facts:

- List endpoints return a plain array, not `{ data }`.
- Paging: `--page` and `--page-size` (max 50). `--all` fetches every page.
- An application has `pipelineStage` (`name` is the board column, `type` the stage kind),
  `state` (`SCREENING`, `QUALIFIED`, `OFFER`, `HIRED`, `REJECTED`) and `hiringState`.
- `attachments[].url` already contains the `sig` parameter. Pass it to `join-com download` as is.

## What the API cannot do

The JOIN API cannot move an application to another pipeline stage, reject an application, or send
email. Those actions stay in the JOIN web app. Do not try to emulate them with tags or notes unless
the user asks for that.

## Writes

`create`, `update`, `change-status`, `archive`, `activate`, `create-note`, `replace-tags`,
`update-external-data` and `applications delete` take effect immediately. `jobs create` and
`jobs activate` publish the job to job boards. **Ask the user before every write.**

## Errors

| Exit | Meaning                                      |
| ---- | -------------------------------------------- |
| `0`  | Success                                      |
| `1`  | Error on stderr (bad args, network, 4xx/5xx) |
| `2`  | Not authenticated: run `join-com auth login` |

401 means the token was revoked or belongs to no company. 422 means a parameter failed validation;
the message names the allowed values. The client retries 429 responses on its own.

## Things to avoid

- Do not print or log the token.
- Candidate data is personal data. Do not copy CVs or contact details into shared places without
  the user's instruction, and delete downloaded files when the task is done.

## Reference

- Field reference: [`SCHEMA.md`](./SCHEMA.md)
- API docs: <https://docs.join.com>
- Repo: <https://github.com/michaeljauk/join-client>
