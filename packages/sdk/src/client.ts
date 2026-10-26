import createClient, { type Client, type Middleware } from "openapi-fetch";
import type { paths } from "./generated.js";

export const DEFAULT_BASE_URL = "https://api.join.com/v2";

export interface JoinClientOptions {
  /** API token from https://join.com/user/api-credentials */
  token: string;
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
  headers?: Record<string, string>;
  /**
   * How often a request is retried after HTTP 429. The client waits for the
   * `x-ratelimit-reset` header (seconds) before each retry. Default 3, 0 disables.
   */
  maxRateLimitRetries?: number;
}

export type JoinClient = Client<paths>;

export function createJoinClient(options: JoinClientOptions): JoinClient {
  if (!options.token) throw new JoinError("token is required");
  const token = options.token;

  const client = createClient<paths>({
    baseUrl: options.baseUrl ?? DEFAULT_BASE_URL,
    fetch: withRateLimitRetry(
      options.fetch ?? globalThis.fetch,
      options.maxRateLimitRetries ?? 3,
    ),
    headers: options.headers,
  });

  // JOIN expects the raw token in the Authorization header, without "Bearer".
  const authMiddleware: Middleware = {
    onRequest({ request }) {
      request.headers.set("authorization", token);
      return request;
    },
  };

  const errorMiddleware: Middleware = {
    async onResponse({ response }) {
      if (response.ok) return undefined;
      const body = await response.clone().text();
      throw new JoinError(
        `JOIN API ${response.status} ${response.statusText}: ${body.slice(0, 500)}`,
        { status: response.status, body },
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

function retryDelayMs(response: Response): number {
  const header =
    response.headers.get("x-ratelimit-reset") ??
    response.headers.get("retry-after");
  const seconds = Number(header);
  if (!Number.isFinite(seconds) || seconds < 0) return 1_000;
  return Math.min(seconds, 60) * 1_000 + 100;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface PageResult<T> {
  data?: T[];
  response: Response;
}

/**
 * Collects every page of a paginated list endpoint. JOIN reports the page
 * count in the `x-page-count` response header.
 *
 * @example
 * const all = await collectPages((page) =>
 *   join.GET("/applications", { params: { query: { page, pageSize: 50 } } }),
 * );
 */
export async function collectPages<T>(
  fetchPage: (page: number) => Promise<PageResult<T>>,
): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; ; page++) {
    const { data, response } = await fetchPage(page);
    items.push(...(data ?? []));
    const pageCount = Number(response.headers.get("x-page-count"));
    if (!Number.isFinite(pageCount) || page >= pageCount || !data?.length) {
      return items;
    }
  }
}

export class JoinError extends Error {
  readonly status?: number;
  readonly body?: string;
  constructor(message: string, meta?: { status?: number; body?: string }) {
    super(message);
    this.name = "JoinError";
    this.status = meta?.status;
    this.body = meta?.body;
  }
}
