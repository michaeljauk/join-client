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
    "JOIN recruiting API v3 (jobs, applications, candidates, notes, scorecards, locations).",
    "Agent-authored JavaScript runs in the host Node process (no sandbox).",
    "Auth is injected by the host before each call and never enters your code.",
    "Responses wrap the payload under `data`. List endpoints return `{ data, nextCursor }` with at most `limit` (max 50) records; pass `nextCursor` as `cursor` until it is null.",
    `Document URLs from application.documents[].url can be passed as the path of a GET; the file is saved under ${DOWNLOAD_DIR} and the result names the local path. The links expire after one hour.`,
    "Move an application with PUT /applications/{id}/stage and a stageId from GET /jobs/{id}. The API cannot reject applications, update candidate profiles or send emails.",
    "Write operations (create/update jobs and locations, stage moves, notes, deleting candidates or locations) take effect immediately; deleting a candidate removes all their applications. Confirm with the user first.",
  ].join(" "),
});

const transport = new StdioServerTransport();
await server.connect(transport);
