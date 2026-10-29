import { writeFile } from "node:fs/promises";
import { collectPages, createJoinClient, type JoinClient } from "join-sdk";
import { consola } from "consola";
import { loadProfile } from "../lib/credentials.js";

export interface GlobalArgs {
  token?: string;
  profile?: string;
  "base-url"?: string;
}

export const globalArgs = {
  token: {
    type: "string",
    description: "API token (defaults to $JOIN_TOKEN or the stored profile)",
  },
  profile: {
    type: "string",
    description:
      "Stored credentials profile (defaults to $JOIN_PROFILE or the default profile)",
  },
  "base-url": {
    type: "string",
    description: "API base URL (defaults to $JOIN_BASE_URL)",
  },
} as const;

export async function resolveClient(args: GlobalArgs): Promise<JoinClient> {
  const baseUrl = args["base-url"] ?? process.env.JOIN_BASE_URL;

  const token = args.token ?? process.env.JOIN_TOKEN;
  if (token) return createJoinClient({ token, baseUrl });

  const stored = await loadProfile(args.profile ?? process.env.JOIN_PROFILE);
  if (stored) {
    return createJoinClient({
      token: stored.profile.token,
      baseUrl: baseUrl ?? stored.profile.baseUrl,
    });
  }

  consola.error(
    "Not authenticated. Run `join-com auth login` to store a token, or set JOIN_TOKEN.",
  );
  return process.exit(2);
}

type Caller = (
  path: never,
  init: never,
) => Promise<{ data?: unknown; response: Response }>;

/**
 * Calls a list endpoint. With `all`, it follows `nextCursor` (limit 50) and
 * returns one combined array; otherwise it returns the `{ data, nextCursor }`
 * page as is.
 */
export async function listCall(
  client: JoinClient,
  path: string,
  params: {
    path?: Record<string, unknown>;
    query?: Record<string, unknown>;
    header?: Record<string, unknown>;
  },
  all: boolean | undefined,
): Promise<unknown> {
  const get = client.GET as unknown as Caller;
  if (!all) {
    const { data } = await get(path as never, { params } as never);
    return data;
  }
  return collectPages(async (cursor) => {
    const query = { ...params.query, cursor, limit: 50 };
    const res = await get(
      path as never,
      { params: { ...params, query } } as never,
    );
    return {
      data: res.data as { data: unknown[]; nextCursor?: string | null },
    };
  });
}

/** Downloads a binary endpoint and writes it to `output` (or stdout for "-"). */
export async function downloadCall(
  client: JoinClient,
  path: string,
  params: Record<string, unknown>,
  output: string,
): Promise<void> {
  const get = client.GET as unknown as Caller;
  const { data } = await get(
    path as never,
    { params, parseAs: "arrayBuffer" } as never,
  );
  const bytes = Buffer.from(data as ArrayBuffer);
  if (output === "-") {
    process.stdout.write(bytes);
    return;
  }
  await writeFile(output, bytes);
  consola.success(`Saved ${bytes.length} bytes to ${output}`);
}

/** Prints nothing for a 204 response, which has no body. */
export function printJson(value: unknown): void {
  if (value === undefined) return;
  process.stdout.write(JSON.stringify(value, null, 2) + "\n");
}

export async function readBody(dataFlag: string | undefined): Promise<unknown> {
  if (dataFlag != null && dataFlag !== "") {
    if (dataFlag === "-") return await readStdin();
    if (dataFlag.startsWith("@")) {
      const { readFile } = await import("node:fs/promises");
      return JSON.parse(await readFile(dataFlag.slice(1), "utf8"));
    }
    return JSON.parse(dataFlag);
  }
  if (!process.stdin.isTTY) return await readStdin();
  consola.error(
    "Request body required. Pass --data '<json>', --data @file.json, --data -, or pipe JSON via stdin.",
  );
  return process.exit(1);
}

async function readStdin(): Promise<unknown> {
  const raw = await readStdinText();
  if (raw === "") {
    consola.error("Empty body on stdin.");
    process.exit(1);
  }
  return JSON.parse(raw);
}

export async function readStdinText(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf8").trim();
}

export function numOrUndef(v: unknown): number | undefined {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function csv(v: unknown): string[] | undefined {
  if (typeof v !== "string" || v === "") return undefined;
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
