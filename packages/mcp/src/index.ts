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
    "The host adds auth to each API call; do not read environment variables or credential files.",
    "Responses wrap the payload under `data`. Paginated list endpoints return `{ data, nextCursor }` with at most `limit` (max 50) records; pass `nextCursor` as `cursor` while it is truthy. Contract types, employment types, remote regions and scorecards return `{ data }` only, without `nextCursor`. Array filters such as jobs `status` take an array in `query`.",
    `Document URLs from application.documents[].url can be passed as the path of a GET; the file is saved under ${DOWNLOAD_DIR} and the result names the local path. The links expire after one hour.`,
    "Move an application with PUT /applications/{id}/stage and a stageId from GET /jobs/{id}. The API cannot reject applications or update candidate profiles.",
    "Every POST, PUT, PATCH and DELETE takes effect immediately; confirm with the user first. Side effects: a stage move can send the stage's automated emails to the candidate, and a move to a HIRED stage hires them. POST /jobs creates the job ONLINE (published to job boards) unless the body sets status OFFLINE. POST /applications adds a real application. Deleting a candidate removes all their applications, notes and documents.",
  ].join(" "),
});

const transport = new StdioServerTransport();
await server.connect(transport);
