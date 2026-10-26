import { openApiMcpServer } from "@cloudflare/codemode/mcp";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import spec from "./spec.json" with { type: "json" };
import { NodeExecutor } from "./executor.js";
import { DOWNLOAD_DIR, request } from "./lib/request.js";

declare const __VERSION__: string;

const server = openApiMcpServer({
  name: "join-mcp",
  version: __VERSION__,
  spec,
  executor: new NodeExecutor({ timeoutMs: 120_000 }),
  request,
  description: [
    "JOIN recruiting API (jobs, applications, candidates, notes, attachments).",
    "Agent-authored JavaScript runs in the host Node process (no sandbox).",
    "Auth is injected by the host before each call and never enters your code.",
    "List endpoints return a plain array of at most pageSize (max 50) items; loop `page` from 1 until a page returns fewer than pageSize items.",
    `Attachment URLs from application.attachments[].url can be passed as the path; the file is saved under ${DOWNLOAD_DIR} and the result names the local path.`,
    "The API cannot move applications between pipeline stages, reject applications, or send emails.",
    "Write operations (create/update jobs and offices, notes, tags, delete applications) take effect immediately; confirm with the user first.",
  ].join(" "),
});

const transport = new StdioServerTransport();
await server.connect(transport);
