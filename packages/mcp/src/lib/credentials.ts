import { homedir } from "node:os";
import { join } from "node:path";
import { readFile } from "node:fs/promises";

// Read-only view of the file that `join-com auth login` (join-com-cli) writes.
export const CREDENTIALS_FILE = join(
  homedir(),
  ".config",
  "join-cli",
  "credentials.json",
);

interface CredentialsFile {
  defaultProfile?: string;
  profiles?: Record<string, { token?: string; baseUrl?: string }>;
}

export async function loadProfile(
  name?: string,
): Promise<{ token: string; baseUrl?: string } | null> {
  let file: CredentialsFile;
  try {
    file = JSON.parse(
      await readFile(CREDENTIALS_FILE, "utf8"),
    ) as CredentialsFile;
  } catch (err) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "ENOENT"
    ) {
      return null;
    }
    throw err;
  }
  const profile = file.profiles?.[name ?? file.defaultProfile ?? "default"];
  return profile?.token
    ? { token: profile.token, baseUrl: profile.baseUrl }
    : null;
}
