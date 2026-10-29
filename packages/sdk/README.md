# join-sdk

Typed TypeScript client for the [JOIN](https://join.com) recruiting API, generated from the
OpenAPI documents on [docs.join.com](https://docs.join.com). Community project, not an official
JOIN product.

```bash
pnpm add join-sdk
```

```ts
import { collectPages, createJoinClient, JoinError } from "join-sdk";

const join = createJoinClient({ token: process.env.JOIN_TOKEN! });

const { data } = await join.GET("/jobs/{id}", {
  params: { path: { id: 123 } },
});
const job = data?.data;

const applications = await collectPages((cursor) =>
  join.GET("/applications", {
    params: { query: { jobId: 123, status: "ACTIVE", cursor, limit: 50 } },
  }),
);

try {
  await join.GET("/applications/{id}", { params: { path: { id: 1 } } });
} catch (err) {
  if (err instanceof JoinError) console.error(err.status, err.code, err.body);
}
```

## Options

| Option                | Default                   | Meaning                                                   |
| --------------------- | ------------------------- | --------------------------------------------------------- |
| `token`               | required                  | Company API token (Company Settings → Developer)          |
| `baseUrl`             | `https://api.join.com/v3` | API base URL                                              |
| `apiVersion`          | `2026-11-01`              | `Join-Version` header, the dated v3 revision              |
| `fetch`               | `globalThis.fetch`        | Custom fetch, e.g. for tests                              |
| `headers`             |                           | Extra headers on every request                            |
| `maxRateLimitRetries` | `3`                       | Retries after HTTP 429, waits for `Retry-After` (seconds) |

## Behavior

- Targets JOIN API v3. The token goes into the `Authorization` header as `Bearer <token>`.
- Every request carries `Join-Version`, pinned to the revision the types describe. Override it with
  `apiVersion` or a `Join-Version` entry in `headers`.
- Every non-2xx response throws `JoinError` with `status`, `code` (from `error.code`) and `body`.
- Responses wrap the payload under `data`. Paginated list endpoints return `{ data, nextCursor }`;
  `collectPages` follows `nextCursor` until it is `null` and throws if a cursor repeats. Lookup
  lists (contract types, employment types, remote regions) and scorecards return `{ data }` only.
- Document URLs in application responses are pre-signed links to external storage, valid for one
  hour. Fetch them without the JOIN token.

Types for every path, operation and schema are exported as `paths`, `operations` and `components`.
