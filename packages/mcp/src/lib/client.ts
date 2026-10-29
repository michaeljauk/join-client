import { createJoinClient, DEFAULT_BASE_URL, type JoinClient } from "join-sdk";
import { loadProfile } from "./credentials.js";

let cached: { client: JoinClient; baseUrl: string } | null = null;

export async function getClient(): Promise<JoinClient> {
  cached ??= await resolveClient();
  return cached.client;
}

/** The API base URL the client sends its token to. */
export async function getBaseUrl(): Promise<string> {
  cached ??= await resolveClient();
  return cached.baseUrl;
}

async function resolveClient(): Promise<{
  client: JoinClient;
  baseUrl: string;
}> {
  const envBaseUrl = process.env.JOIN_BASE_URL;

  const token = process.env.JOIN_TOKEN;
  if (token) {
    const baseUrl = envBaseUrl ?? DEFAULT_BASE_URL;
    return { client: createJoinClient({ token, baseUrl }), baseUrl };
  }

  const stored = await loadProfile(process.env.JOIN_PROFILE);
  if (stored) {
    const baseUrl = envBaseUrl ?? stored.baseUrl ?? DEFAULT_BASE_URL;
    return {
      client: createJoinClient({ token: stored.token, baseUrl }),
      baseUrl,
    };
  }

  throw new Error(
    "Not authenticated. Run `join-com auth login` (join-com-cli) to store a token, or set JOIN_TOKEN. Select a stored profile with JOIN_PROFILE.",
  );
}
