import { describe, expect, it, vi } from "vitest";
import { collectPages, createJoinClient, JoinError } from "../src/index.js";

function json(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");
  return new Response(JSON.stringify(body), { status: 200, ...init, headers });
}

describe("createJoinClient", () => {
  it("throws when token is empty", () => {
    expect(() => createJoinClient({ token: "" })).toThrow(JoinError);
  });

  it("sends the raw token in the Authorization header", async () => {
    const fetch = vi.fn(async () => json([]));
    const join = createJoinClient({ token: "tok_123", fetch });
    await join.GET("/jobs");
    const req = fetch.mock.calls[0]![0];
    expect(req.headers.get("authorization")).toBe("tok_123");
    expect(req.url).toBe("https://api.join.com/v2/jobs");
  });

  it("throws JoinError on non-2xx", async () => {
    const fetch = vi.fn(async () => new Response("forbidden", { status: 403 }));
    const join = createJoinClient({ token: "tok", fetch });
    await expect(join.GET("/jobs")).rejects.toMatchObject({
      name: "JoinError",
      status: 403,
    });
  });

  it("retries after 429 and waits for x-ratelimit-reset", async () => {
    vi.useFakeTimers();
    try {
      let calls = 0;
      const fetch = vi.fn(async () => {
        calls++;
        return calls === 1
          ? new Response("slow down", {
              status: 429,
              headers: { "x-ratelimit-reset": "2" },
            })
          : json([{ id: 1 }]);
      });
      const join = createJoinClient({ token: "tok", fetch });
      const pending = join.GET("/jobs");
      await vi.advanceTimersByTimeAsync(2_100);
      const { data } = await pending;
      expect(data).toEqual([{ id: 1 }]);
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
          headers: { "x-ratelimit-reset": "0" },
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
            headers: { "x-ratelimit-reset": "0" },
          })
        : json({ id: 7 }, { status: 201 });
    });
    const join = createJoinClient({ token: "tok", fetch });
    await join.POST("/candidates/{id}/notes", {
      params: { path: { id: 1 } },
      body: { content: "hello" },
    });
    expect(bodies).toEqual(['{"content":"hello"}', '{"content":"hello"}']);
  });
});

describe("collectPages", () => {
  it("follows x-page-count", async () => {
    const pages: Record<number, number[]> = { 1: [1, 2], 2: [3, 4], 3: [5] };
    const fetchPage = vi.fn(async (page: number) => ({
      data: pages[page],
      response: new Response(null, { headers: { "x-page-count": "3" } }),
    }));
    expect(await collectPages(fetchPage)).toEqual([1, 2, 3, 4, 5]);
    expect(fetchPage).toHaveBeenCalledTimes(3);
  });

  it("stops when the header is missing", async () => {
    const fetchPage = vi.fn(async () => ({
      data: [1],
      response: new Response(null),
    }));
    expect(await collectPages(fetchPage)).toEqual([1]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });
});
