// Maps every operation in openapi.json to a CLI resource and command name.
// Shared by generate-commands.mjs and generate-schema.mjs.
//
// Naming:
//   GET    /x                   -> list
//   POST   /x                   -> create
//   GET    /x/{id}              -> get
//   PATCH  /x/{id}              -> update
//   PUT    /x/{id}              -> replace
//   DELETE /x/{id}              -> delete
//   GET    /x/{id}/sub          -> list-sub
//   POST   /x/{id}/sub          -> create-<singular(sub)>
//   PUT    /x/{id}/sub          -> replace-sub
//   PATCH  /x/{id}/sub          -> update-sub
//   GET    /x/{id}/sub/{sid}    -> get-<singular(sub)>
//   PATCH  /x/{id}/sub/{sid}    -> update-<singular(sub)>
//   DELETE /x/{id}/sub/{sid}    -> delete-<singular(sub)>
//   GET    /x/{id}/{file}       -> download (binary response)
// Path segments and parameter names become kebab-case.
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const repoRoot = resolve(__dirname, "..", "..", "..");
export const spec = JSON.parse(
  readFileSync(join(repoRoot, "openapi.json"), "utf8"),
);

// Sub-resources that are actions, not collections.
const OVERRIDES = {
  "PATCH /jobs/{id}/activate": "activate",
  "PATCH /jobs/{id}/archive": "archive",
  "PATCH /jobs/{id}/changeStatus": "change-status",
};

const METHODS = ["get", "post", "put", "patch", "delete"];

export function endpoints() {
  const out = [];
  for (const [path, ops] of Object.entries(spec.paths)) {
    for (const [method, op] of Object.entries(ops)) {
      if (!METHODS.includes(method)) continue;
      const ep = parseEndpoint(method.toUpperCase(), path, op);
      if (ep) out.push(ep);
      else console.warn(`skipped unhandled ${method.toUpperCase()} ${path}`);
    }
  }
  return out;
}

function parseEndpoint(method, path, op) {
  const segs = path.split("/").filter(Boolean);
  const resource = toKebab(segs[0]);
  const rest = segs.slice(1);
  const params = op.parameters ?? [];
  const positionals = params
    .filter((p) => p.in === "path")
    .map((p) => ({ name: p.name, description: p.description ?? p.name }));
  const query = params.filter((p) => p.in === "query");
  const hasBody = Boolean(op.requestBody);
  const binary = isBinary(op);
  const paginated = method === "GET" && query.some((q) => q.name === "page");
  const command =
    OVERRIDES[`${method} ${path}`] ?? commandName(method, rest, binary);
  if (!command) return null;
  return {
    resource,
    command,
    method,
    path,
    operationId: op.operationId,
    description: op.summary || op.operationId || `${method} ${path}`,
    positionals,
    query,
    hasBody,
    binary,
    paginated,
    op,
  };
}

function commandName(method, rest, binary) {
  if (rest.length === 0) {
    if (method === "GET") return "list";
    if (method === "POST") return "create";
  }
  if (rest.length === 1 && isParam(rest[0])) {
    return { GET: "get", PATCH: "update", PUT: "replace", DELETE: "delete" }[
      method
    ];
  }
  if (rest.length === 2 && isParam(rest[0]) && !isParam(rest[1])) {
    const sub = toKebab(rest[1]);
    return {
      GET: `list-${sub}`,
      POST: `create-${singular(sub)}`,
      PUT: `replace-${sub}`,
      PATCH: `update-${sub}`,
      DELETE: `delete-${sub}`,
    }[method];
  }
  if (rest.length === 2 && isParam(rest[0]) && isParam(rest[1])) {
    if (method === "GET" && binary) return "download";
  }
  if (
    rest.length === 3 &&
    isParam(rest[0]) &&
    !isParam(rest[1]) &&
    isParam(rest[2])
  ) {
    const s = singular(toKebab(rest[1]));
    return {
      GET: `get-${s}`,
      PATCH: `update-${s}`,
      PUT: `add-${s}`,
      DELETE: `delete-${s}`,
    }[method];
  }
  return undefined;
}

function isBinary(op) {
  const ok = op.responses?.["200"]?.content;
  if (!ok) return false;
  return !Object.keys(ok).some((t) => t.includes("json"));
}

function isParam(seg) {
  return seg.startsWith("{") && seg.endsWith("}");
}

export function singular(s) {
  if (s.endsWith("ies")) return s.slice(0, -3) + "y";
  if (s.endsWith("sses")) return s.slice(0, -2);
  if (s.endsWith("s") && !s.endsWith("ss")) return s.slice(0, -1);
  return s;
}

export function toKebab(s) {
  return s
    .replace(/_/g, "-")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();
}

export function toCamel(s) {
  return s.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
}
