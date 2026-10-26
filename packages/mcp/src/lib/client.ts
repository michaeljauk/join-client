import { createJoinClient, type JoinClient } from "join-sdk";
import { loadProfile } from "./credentials.js";

let cached: JoinClient | null = null;

export async function getClient(): Promise<JoinClient> {
  cached ??= await resolveClient();
  return cached;
}

async function resolveClient(): Promise<JoinClient> {
  const baseUrl = process.env.JOIN_BASE_URL;

  const token = process.env.JOIN_TOKEN;
  if (token) return createJoinClient({ token, baseUrl });

  const stored = await loadProfile(process.env.JOIN_PROFILE);
  if (stored) {
    return createJoinClient({
      token: stored.token,
      baseUrl: baseUrl ?? stored.baseUrl,
    });
  }

  throw new Error(
    "Not authenticated. Run `join-com auth login` (join-com-cli) to store a token, or set JOIN_TOKEN. Select a stored profile with JOIN_PROFILE.",
  );
}
