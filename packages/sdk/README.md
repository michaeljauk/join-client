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

const { data: job } = await join.GET("/jobs/{id}", {
  params: { path: { id: 123 } },
});

const applications = await collectPages((page) =>
  join.GET("/applications", {
    params: {
      query: { jobId: 123, hiringState: "ACTIVE", page, pageSize: 50 },
    },
  }),
);

try {
  await join.GET("/applications/{id}", { params: { path: { id: 1 } } });
} catch (err) {
  if (err instanceof JoinError) console.error(err.status, err.body);
}
```

## Options

| Option                | Default                   | Meaning                                           |
| --------------------- | ------------------------- | ------------------------------------------------- |
| `token`               | required                  | API token from join.com/user/api-credentials      |
| `baseUrl`             | `https://api.join.com/v2` | API base URL                                      |
| `fetch`               | `globalThis.fetch`        | Custom fetch, e.g. for tests                      |
| `headers`             |                           | Extra headers on every request                    |
| `maxRateLimitRetries` | `3`                       | Retries after HTTP 429, waits `x-ratelimit-reset` |

## Behavior

- The token goes into the `Authorization` header as is, without `Bearer`.
- Every non-2xx response throws `JoinError` with `status` and `body`.
- List endpoints return a plain array. Paging metadata is in the `x-page`, `x-page-count` and
  `x-page-total` headers. `collectPages` follows `x-page-count`.
- Attachment endpoints return PDF data. Pass `parseAs: "arrayBuffer"`.

Types for every path, operation and schema are exported as `paths`, `operations` and `components`.
