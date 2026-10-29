import { describe, expect, it } from "vitest";
import {
  externalUrl,
  extractPathParams,
  normalizePath,
} from "../src/lib/request.js";

const API = "https://api.join.com/v3";

describe("normalizePath", () => {
  it("turns a full API URL into path and query", () => {
    const query: Record<string, unknown> = {};
    const path = normalizePath(
      "https://api.join.com/v3/applications?cursor=abc",
      query,
    );
    expect(path).toBe("/applications");
    expect(query).toEqual({ cursor: "abc" });
  });

  it("strips the /v3 prefix and moves the query string", () => {
    const query: Record<string, unknown> = { limit: 5 };
    expect(normalizePath("/v3/applications?cursor=abc", query)).toBe(
      "/applications",
    );
    expect(query).toEqual({ limit: 5, cursor: "abc" });
  });

  it("turns repeated query keys into an array", () => {
    const query: Record<string, unknown> = {};
    normalizePath("/jobs?status=ONLINE&status=OFFLINE&limit=5", query);
    expect(query).toEqual({ status: ["ONLINE", "OFFLINE"], limit: "5" });
  });

  it("keeps explicit query values over URL values", () => {
    const query: Record<string, unknown> = { limit: 3 };
    normalizePath("/jobs?limit=1", query);
    expect(query.limit).toBe(3);
  });

  it("adds a leading slash", () => {
    expect(normalizePath("jobs", {})).toBe("/jobs");
  });
});

describe("externalUrl", () => {
  it("detects a pre-signed document URL", () => {
    expect(
      externalUrl("https://storage.googleapis.com/bucket/cv.pdf?X-Sig=1", API)
        ?.host,
    ).toBe("storage.googleapis.com");
  });

  it("leaves JOIN API URLs and plain paths to the client", () => {
    expect(externalUrl("https://api.join.com/v3/jobs", API)).toBeUndefined();
    expect(externalUrl("/jobs", API)).toBeUndefined();
  });

  it("rejects plain http", () => {
    expect(() => externalUrl("http://example.com/cv.pdf", API)).toThrow(
      /https/,
    );
  });

  it("treats a custom base URL host as the API", () => {
    const base = "https://join.example.test/v3";
    expect(
      externalUrl("https://join.example.test/v3/jobs", base),
    ).toBeUndefined();
    expect(externalUrl("https://api.join.com/v3/jobs", base)?.host).toBe(
      "api.join.com",
    );
  });
});

describe("extractPathParams", () => {
  it("moves template values out of the query", () => {
    const query: Record<string, unknown> = { id: 42, noteId: 7, page: 1 };
    expect(extractPathParams("/candidates/{id}/notes/{noteId}", query)).toEqual(
      {
        id: "42",
        noteId: "7",
      },
    );
    expect(query).toEqual({ page: 1 });
  });

  it("throws when a value is missing", () => {
    expect(() => extractPathParams("/jobs/{id}", {})).toThrow(
      /Missing path parameter "id"/,
    );
  });
});
