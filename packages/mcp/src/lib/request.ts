import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { JoinError } from "join-sdk";
import { getClient } from "./client.js";

export interface RequestOptions {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  contentType?: string;
  rawBody?: boolean;
}

export const DOWNLOAD_DIR = join(tmpdir(), "join-mcp");

const BINARY_PATH = /^\/(attachments|application-files)\/[^/]+\/[^/]+$/;

type Caller = (
  path: string,
  options: unknown,
) => Promise<{ data: unknown; response: Response }>;

/**
 * Bridges the `request` function expected by @cloudflare/codemode's
 * openApiMcpServer onto join-sdk. Runs on the host, so the token is injected
 * by the SDK and never reaches agent-authored code.
 *
 * Attachment downloads return binary data. Instead of pushing base64 through
 * the model context, the file is written to DOWNLOAD_DIR and the result
 * names the local path.
 */
export async function request(opts: RequestOptions): Promise<unknown> {
  const client = await getClient();
  const query = stripUndefined(opts.query);
  const path = normalizePath(opts.path, query);
  const pathParams = extractPathParams(path, query);

  const params: Record<string, unknown> = {};
  if (Object.keys(pathParams).length) params.path = pathParams;
  if (Object.keys(query).length) params.query = query;

  const callOpts: Record<string, unknown> = {};
  if (Object.keys(params).length) callOpts.params = params;
  if (opts.body !== undefined) callOpts.body = opts.body;

  const resolvedPath = fillPath(path, pathParams);
  const binary = opts.method === "GET" && BINARY_PATH.test(resolvedPath);
  if (binary) callOpts.parseAs = "arrayBuffer";

  const caller = client[opts.method] as unknown as Caller;
  try {
    const { data, response } = await caller(path, callOpts);
    if (binary)
      return await saveDownload(resolvedPath, data as ArrayBuffer, response);
    return data ?? null;
  } catch (err) {
    if (err instanceof JoinError) {
      throw new Error(`JOIN API ${err.status ?? "?"}: ${err.message}`, {
        cause: err,
      });
    }
    throw err;
  }
}

async function saveDownload(
  path: string,
  data: ArrayBuffer,
  response: Response,
): Promise<unknown> {
  await mkdir(DOWNLOAD_DIR, { recursive: true, mode: 0o700 });
  const segments = path.split("/");
  const file = join(
    DOWNLOAD_DIR,
    `${segments.at(-2)}-${basename(segments.at(-1)!)}`,
  );
  const bytes = Buffer.from(data);
  await writeFile(file, bytes, { mode: 0o600 });
  return {
    savedTo: file,
    contentType: response.headers.get("content-type"),
    bytes: bytes.length,
  };
}

/**
 * Accepts what agents tend to pass: a full attachment URL from
 * `application.attachments[].url`, a path with the `/v2` prefix, or a path
 * with a query string. Moves any query string into `query`.
 */
export function normalizePath(
  rawPath: string,
  query: Record<string, unknown>,
): string {
  let path = rawPath;
  if (/^https?:\/\//.test(path)) {
    const url = new URL(path);
    for (const [k, v] of url.searchParams) query[k] ??= v;
    path = url.pathname;
  } else if (path.includes("?")) {
    const [p = "", qs = ""] = path.split("?", 2);
    for (const [k, v] of new URLSearchParams(qs)) query[k] ??= v;
    path = p;
  }
  path = path.replace(/^\/v2(?=\/)/, "");
  return path.startsWith("/") ? path : `/${path}`;
}

function stripUndefined(
  input: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!input) return out;
  for (const [k, v] of Object.entries(input)) {
    if (v !== undefined && v !== null && v !== "") out[k] = v;
  }
  return out;
}

/**
 * Agents may pass template paths such as "/jobs/{id}" with the values in
 * `query`. Pluck matching keys out of `query` and return them as path params.
 */
export function extractPathParams(
  path: string,
  query: Record<string, unknown>,
): Record<string, string> {
  const pathParams: Record<string, string> = {};
  for (const [, name] of path.matchAll(/\{([^}]+)\}/g)) {
    if (name === undefined) continue;
    const val = query[name];
    if (val === undefined) {
      throw new Error(
        `Missing path parameter "${name}" for ${path}. Pass it in the query object.`,
      );
    }
    if (
      typeof val !== "string" &&
      typeof val !== "number" &&
      typeof val !== "boolean"
    ) {
      throw new Error(`Path parameter "${name}" must be a string or number.`);
    }
    pathParams[name] = String(val);
    delete query[name];
  }
  return pathParams;
}

function fillPath(path: string, pathParams: Record<string, string>): string {
  return path.replace(
    /\{([^}]+)\}/g,
    (_, name: string) => pathParams[name] ?? "",
  );
}
