import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { JoinError } from "join-sdk";
import { getBaseUrl, getClient } from "./client.js";

export interface RequestOptions {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  query?: Record<
    string,
    string | number | boolean | (string | number)[] | undefined
  >;
  body?: unknown;
  contentType?: string;
  rawBody?: boolean;
}

export const DOWNLOAD_DIR = join(tmpdir(), "join-mcp");

type Caller = (
  path: string,
  options: unknown,
) => Promise<{ data: unknown; response: Response }>;

/**
 * Bridges the `request` function expected by @cloudflare/codemode's
 * openApiMcpServer onto join-sdk. The SDK adds the token to each API call, so
 * agent code does not need it. Agent code runs unsandboxed in this process,
 * though, and can still read the environment (see README, Security).
 *
 * A GET on a document URL from `application.documents[].url` downloads the
 * file. The URL is pre-signed external storage, so it is fetched without the
 * JOIN token. Instead of pushing base64 through the model context, the file
 * is written to DOWNLOAD_DIR and the result names the local path.
 */
export async function request(opts: RequestOptions): Promise<unknown> {
  const documentUrl = /^https?:\/\//.test(opts.path)
    ? externalUrl(opts.path, await getBaseUrl())
    : undefined;
  if (documentUrl) {
    if (opts.method !== "GET")
      throw new Error("Only GET is allowed on document URLs.");
    return await download(documentUrl);
  }

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

  const caller = client[opts.method] as unknown as Caller;
  try {
    const { data } = await caller(path, callOpts);
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

/** Returns the URL when `path` is an https URL outside the JOIN API host. */
export function externalUrl(path: string, baseUrl: string): URL | undefined {
  if (!/^https?:\/\//.test(path)) return undefined;
  const url = new URL(path);
  if (url.host === new URL(baseUrl).host) return undefined;
  if (url.protocol !== "https:")
    throw new Error("Document URLs must use https.");
  return url;
}

async function download(url: URL): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Download failed with HTTP ${response.status}. Document links expire after one hour; read the application again for a fresh URL.`,
    );
  }
  await mkdir(DOWNLOAD_DIR, { recursive: true, mode: 0o700 });
  let decoded = url.pathname;
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // Keep the raw path when it holds a malformed escape.
  }
  const base = basename(decoded);
  const name = base && base !== ".." ? base : "document";
  const file = join(DOWNLOAD_DIR, `${Date.now()}-${name}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(file, bytes, { mode: 0o600 });
  return {
    savedTo: file,
    contentType: response.headers.get("content-type"),
    bytes: bytes.length,
  };
}

/**
 * Accepts what agents tend to pass: a full JOIN API URL, a path with the
 * `/v3` prefix, or a path with a query string. Moves any query string into
 * `query`.
 */
export function normalizePath(
  rawPath: string,
  query: Record<string, unknown>,
): string {
  let path = rawPath;
  if (/^https?:\/\//.test(path)) {
    const url = new URL(path);
    mergeSearchParams(url.searchParams, query);
    path = url.pathname;
  } else if (path.includes("?")) {
    const [p = "", qs = ""] = path.split("?", 2);
    mergeSearchParams(new URLSearchParams(qs), query);
    path = p;
  }
  path = path.replace(/^\/v3(?=\/)/, "");
  return path.startsWith("/") ? path : `/${path}`;
}

// A repeated key (`status=ONLINE&status=OFFLINE`) becomes an array, which the
// client sends as repeated parameters again. Explicit query values win.
function mergeSearchParams(
  params: URLSearchParams,
  query: Record<string, unknown>,
): void {
  for (const key of new Set(params.keys())) {
    if (query[key] !== undefined) continue;
    const values = params.getAll(key);
    query[key] = values.length === 1 ? values[0] : values;
  }
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
