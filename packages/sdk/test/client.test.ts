import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  collectPages,
  createJoinClient,
  DEFAULT_API_VERSION,
  JoinError,
} from "../src/index.js";

function json(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");
  return new Response(JSON.stringify(body), { status: 200, ...init, headers });
}

describe("createJoinClient", () => {
  it("throws when token is empty", () => {
    expect(() => createJoinClient({ token: "" })).toThrow(JoinError);
  });

  it("sends a Bearer token and pins Join-Version", async () => {
    const fetch = vi.fn(async () => json({ data: [], nextCursor: null }));
    const join = createJoinClient({ token: "join_sk_123", fetch });
    await join.GET("/jobs");
    const req = fetch.mock.calls[0][0];
    expect(req.headers.get("authorization")).toBe("Bearer join_sk_123");
    expect(req.headers.get("join-version")).toBe(DEFAULT_API_VERSION);
    expect(req.url).toBe("https://api.join.com/v3/jobs");
  });

  it("does not double a Bearer prefix and honors apiVersion", async () => {
    const fetch = vi.fn(async () => json({ data: [], nextCursor: null }));
    const join = createJoinClient({
      token: "Bearer tok",
      apiVersion: "2027-01-01",
      fetch,
    });
    await join.GET("/jobs");
    const req = fetch.mock.calls[0][0];
    expect(req.headers.get("authorization")).toBe("Bearer tok");
    expect(req.headers.get("join-version")).toBe("2027-01-01");
  });

  it("throws JoinError with the error code on non-2xx", async () => {
    const fetch = vi.fn(async () =>
      json(
        { error: { code: "token_invalid", message: "Invalid token" } },
        { status: 401 },
      ),
    );
    const join = createJoinClient({ token: "tok", fetch });
    await expect(join.GET("/jobs")).rejects.toMatchObject({
      name: "JoinError",
      status: 401,
      code: "token_invalid",
    });
  });

  it("retries after 429 and waits for Retry-After", async () => {
    vi.useFakeTimers();
    try {
      let calls = 0;
      const fetch = vi.fn(async () => {
        calls++;
        return calls === 1
          ? new Response("slow down", {
              status: 429,
              headers: { "retry-after": "2" },
            })
          : json({ data: [{ id: 1 }], nextCursor: null });
      });
      const join = createJoinClient({ token: "tok", fetch });
      const pending = join.GET("/jobs");
      await vi.advanceTimersByTimeAsync(2_100);
      const { data } = await pending;
      expect(data).toEqual({ data: [{ id: 1 }], nextCursor: null });
      expect(fetch).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("reads X-RateLimit-Reset as a Unix timestamp", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-11-01T00:00:00Z"));
      const reset = String(Date.now() / 1_000 + 3);
      let calls = 0;
      const fetch = vi.fn(async () => {
        calls++;
        return calls === 1
          ? new Response("", {
              status: 429,
              headers: { "x-ratelimit-reset": reset },
            })
          : json({ data: [], nextCursor: null });
      });
      const join = createJoinClient({ token: "tok", fetch });
      const pending = join.GET("/jobs");
      await vi.advanceTimersByTimeAsync(2_000);
      expect(fetch).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1_200);
      await pending;
      expect(fetch).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("uses the burst reset when the burst window is exhausted", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-11-01T00:00:00Z"));
      const now = Date.now() / 1_000;
      let calls = 0;
      const fetch = vi.fn(async () => {
        calls++;
        return calls === 1
          ? new Response("", {
              status: 429,
              headers: {
                "x-ratelimit-reset": String(now + 50),
                "x-ratelimit-burst-remaining": "0",
                "x-ratelimit-burst-reset": String(now + 2),
              },
            })
          : json({ data: [], nextCursor: null });
      });
      const join = createJoinClient({ token: "tok", fetch });
      const pending = join.GET("/jobs");
      await vi.advanceTimersByTimeAsync(2_200);
      await pending;
      expect(fetch).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("waits for the later reset when both windows are exhausted", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-11-01T00:00:00Z"));
      const now = Date.now() / 1_000;
      let calls = 0;
      const fetch = vi.fn(async () => {
        calls++;
        return calls === 1
          ? new Response("", {
              status: 429,
              headers: {
                "x-ratelimit-remaining": "0",
                "x-ratelimit-reset": String(now + 5),
                "x-ratelimit-burst-remaining": "0",
                "x-ratelimit-burst-reset": String(now + 2),
              },
            })
          : json({ data: [], nextCursor: null });
      });
      const join = createJoinClient({ token: "tok", fetch });
      const pending = join.GET("/jobs");
      await vi.advanceTimersByTimeAsync(3_000);
      expect(fetch).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(2_200);
      await pending;
      expect(fetch).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("gives up after maxRateLimitRetries", async () => {
    const fetch = vi.fn(
      async () =>
        new Response("slow down", {
          status: 429,
          headers: { "retry-after": "0" },
        }),
    );
    const join = createJoinClient({
      token: "tok",
      fetch,
      maxRateLimitRetries: 1,
    });
    await expect(join.GET("/jobs")).rejects.toMatchObject({ status: 429 });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("resends the request body on retry", async () => {
    const bodies: string[] = [];
    const fetch = vi.fn(async (input: Request | URL | string) => {
      bodies.push(await (input as Request).text());
      return bodies.length === 1
        ? new Response("", {
            status: 429,
            headers: { "retry-after": "0" },
          })
        : json({ id: 7 }, { status: 201 });
    });
    const join = createJoinClient({ token: "tok", fetch });
    await join.POST("/candidates/{candidateId}/notes", {
      params: { path: { candidateId: 1 } },
      body: { content: "hello" },
    });
    expect(bodies).toEqual(['{"content":"hello"}', '{"content":"hello"}']);
  });
});

describe("DEFAULT_API_VERSION", () => {
  it("matches the revision of openapi.json", () => {
    const spec = JSON.parse(
      readFileSync(new URL("../../../openapi.json", import.meta.url), "utf8"),
    ) as { info: { version: string } };
    expect(DEFAULT_API_VERSION).toBe(spec.info.version);
  });
});

describe("collectPages", () => {
  it("follows nextCursor until it is null", async () => {
    const pages: Record<string, { data: number[]; nextCursor: string | null }> =
      {
        start: { data: [1, 2], nextCursor: "b" },
        b: { data: [3, 4], nextCursor: "c" },
        c: { data: [5], nextCursor: null },
      };
    const fetchPage = vi.fn(async (cursor: string | undefined) => ({
      data: pages[cursor ?? "start"],
    }));
    expect(await collectPages(fetchPage)).toEqual([1, 2, 3, 4, 5]);
    expect(fetchPage.mock.calls.map((c) => c[0])).toEqual([
      undefined,
      "b",
      "c",
    ]);
  });

  it("throws when a cursor repeats", async () => {
    const fetchPage = vi.fn(async () => ({
      data: { data: [1], nextCursor: "same" },
    }));
    await expect(collectPages(fetchPage)).rejects.toThrow(/cursor repeated/);
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it("stops when nextCursor is absent", async () => {
    const fetchPage = vi.fn(async () => ({ data: { data: [1, 2] } }));
    expect(await collectPages(fetchPage)).toEqual([1, 2]);
  });
});
