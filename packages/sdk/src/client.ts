import createClient, { type Client, type Middleware } from "openapi-fetch";
import type { paths } from "./generated.js";

export const DEFAULT_BASE_URL = "https://api.join.com/v3";

/** Dated v3 revision that the generated types describe. */
export const DEFAULT_API_VERSION = "2026-11-01";

export interface JoinClientOptions {
  /** Company API token from Company Settings -> Developer -> API tokens */
  token: string;
  baseUrl?: string;
  /** Value of the `Join-Version` header. Default: DEFAULT_API_VERSION. */
  apiVersion?: string;
  fetch?: typeof globalThis.fetch;
  headers?: Record<string, string>;
  /**
   * How often a request is retried after HTTP 429. The client waits for the
   * `Retry-After` header (seconds) before each retry. Default 3, 0 disables.
   */
  maxRateLimitRetries?: number;
}

export type JoinClient = Client<paths>;

export function createJoinClient(options: JoinClientOptions): JoinClient {
  if (!options.token) throw new JoinError("token is required");
  const token = options.token.replace(/^Bearer\s+/i, "");
  const apiVersion = options.apiVersion ?? DEFAULT_API_VERSION;

  const client = createClient<paths>({
    baseUrl: options.baseUrl ?? DEFAULT_BASE_URL,
    fetch: withRateLimitRetry(
      options.fetch ?? globalThis.fetch,
      options.maxRateLimitRetries ?? 3,
    ),
    headers: options.headers,
  });

  const authMiddleware: Middleware = {
    onRequest({ request }) {
      request.headers.set("authorization", `Bearer ${token}`);
      if (!request.headers.has("join-version"))
        request.headers.set("join-version", apiVersion);
      return request;
    },
  };

  const errorMiddleware: Middleware = {
    async onResponse({ response }) {
      if (response.ok) return undefined;
      const body = await response.clone().text();
      throw new JoinError(
        `JOIN API ${response.status} ${response.statusText}: ${body.slice(0, 500)}`,
        { status: response.status, body, code: errorCode(body) },
      );
    },
  };

  client.use(authMiddleware, errorMiddleware);
  return client;
}

function withRateLimitRetry(
  baseFetch: typeof globalThis.fetch,
  maxRetries: number,
): typeof globalThis.fetch {
  return async (input, init) => {
    const request = new Request(input, init);
    for (let attempt = 0; ; attempt++) {
      const response = await baseFetch(request.clone());
      if (response.status !== 429 || attempt >= maxRetries) return response;
      await sleep(retryDelayMs(response));
    }
  };
}

// Retry-After is in seconds. X-RateLimit-Reset is a Unix timestamp in
// seconds and serves only as a fallback.
function retryDelayMs(response: Response): number {
  const retryAfter = response.headers.get("retry-after");
  const reset = response.headers.get("x-ratelimit-reset");
  let seconds = Number.NaN;
  if (retryAfter != null) seconds = Number(retryAfter);
  else if (reset != null) seconds = Number(reset) - Date.now() / 1_000;
  if (!Number.isFinite(seconds)) return 1_000;
  return Math.min(Math.max(seconds, 0), 60) * 1_000 + 100;
}

function errorCode(body: string): string | undefined {
  try {
    const code = (JSON.parse(body) as { error?: { code?: unknown } }).error
      ?.code;
    return typeof code === "string" ? code : undefined;
  } catch {
    return undefined;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface PageResult<T> {
  data?: { data: T[]; nextCursor?: string | null };
}

/**
 * Collects every page of a paginated list endpoint by following
 * `nextCursor` until it is null.
 *
 * @example
 * const all = await collectPages((cursor) =>
 *   join.GET("/applications", { params: { query: { cursor, limit: 50 } } }),
 * );
 */
export async function collectPages<T>(
  fetchPage: (cursor: string | undefined) => Promise<PageResult<T>>,
): Promise<T[]> {
  const items: T[] = [];
  const seen = new Set<string>();
  let cursor: string | undefined;
  for (;;) {
    const { data } = await fetchPage(cursor);
    items.push(...(data?.data ?? []));
    const next = data?.nextCursor;
    if (!next || seen.has(next)) return items;
    seen.add(next);
    cursor = next;
  }
}

export class JoinError extends Error {
  readonly status?: number;
  readonly body?: string;
  /** `error.code` from the response body, such as `location_not_found`. */
  readonly code?: string;
  constructor(
    message: string,
    meta?: { status?: number; body?: string; code?: string },
  ) {
    super(message);
    this.name = "JoinError";
    this.status = meta?.status;
    this.body = meta?.body;
    this.code = meta?.code;
  }
}
