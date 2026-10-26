import { describe, expect, it } from "vitest";
import { extractPathParams, normalizePath } from "../src/lib/request.js";

describe("normalizePath", () => {
  it("turns a full attachment URL into path and query", () => {
    const query: Record<string, unknown> = {};
    const path = normalizePath(
      "https://api.join.com/v2/attachments/abc/def.pdf?sig=xyz",
      query,
    );
    expect(path).toBe("/attachments/abc/def.pdf");
    expect(query).toEqual({ sig: "xyz" });
  });

  it("strips the /v2 prefix and moves the query string", () => {
    const query: Record<string, unknown> = { pageSize: 5 };
    expect(normalizePath("/v2/applications?page=2", query)).toBe(
      "/applications",
    );
    expect(query).toEqual({ pageSize: 5, page: "2" });
  });

  it("keeps explicit query values over URL values", () => {
    const query: Record<string, unknown> = { page: 3 };
    normalizePath("/jobs?page=1", query);
    expect(query.page).toBe(3);
  });

  it("adds a leading slash", () => {
    expect(normalizePath("jobs", {})).toBe("/jobs");
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
