import { describe, expect, it } from "vitest";

describe("codemode MCP entry", () => {
  // The entry pulls in optional peers of the MCP SDK. A missing one crashes
  // the server at startup, which no other test would notice.
  it("loads with the installed dependencies", async () => {
    const mod = await import("@cloudflare/codemode/mcp");
    expect(typeof mod.openApiMcpServer).toBe("function");
  });
});
