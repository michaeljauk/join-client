import { homedir } from "node:os";
import { join } from "node:path";
import { chmod, mkdir, readFile, stat, writeFile } from "node:fs/promises";

export const CONFIG_DIR = join(homedir(), ".config", "join-cli");
export const CREDENTIALS_FILE = join(CONFIG_DIR, "credentials.json");
export const DEFAULT_PROFILE = "default";

export interface StoredProfile {
  token: string;
  baseUrl?: string;
  savedAt: string;
}

export interface CredentialsFile {
  /** Profile used when neither --profile nor $JOIN_PROFILE is set. */
  defaultProfile?: string;
  profiles: Record<string, StoredProfile>;
}

export async function readCredentialsFile(): Promise<CredentialsFile> {
  try {
    const parsed = JSON.parse(
      await readFile(CREDENTIALS_FILE, "utf8"),
    ) as Partial<CredentialsFile>;
    return {
      defaultProfile: parsed.defaultProfile,
      profiles: parsed.profiles ?? {},
    };
  } catch (err) {
    if (isNotFound(err)) return { profiles: {} };
    throw err;
  }
}

export async function loadProfile(
  name?: string,
): Promise<{ name: string; profile: StoredProfile } | null> {
  const file = await readCredentialsFile();
  const resolved = name ?? file.defaultProfile ?? DEFAULT_PROFILE;
  const profile = file.profiles[resolved];
  if (!profile?.token) return null;
  return { name: resolved, profile };
}

export async function saveProfile(
  name: string,
  profile: Omit<StoredProfile, "savedAt">,
  options: { makeDefault?: boolean } = {},
): Promise<string> {
  const file = await readCredentialsFile();
  file.profiles[name] = { ...profile, savedAt: new Date().toISOString() };
  if (options.makeDefault || !file.defaultProfile) file.defaultProfile = name;
  await writeCredentialsFile(file);
  return CREDENTIALS_FILE;
}

export async function removeProfile(name: string): Promise<boolean> {
  const file = await readCredentialsFile();
  if (!(name in file.profiles)) return false;
  delete file.profiles[name];
  if (file.defaultProfile === name) {
    file.defaultProfile = Object.keys(file.profiles)[0];
  }
  await writeCredentialsFile(file);
  return true;
}

export async function credentialsFileMode(): Promise<string | null> {
  try {
    const s = await stat(CREDENTIALS_FILE);
    return (s.mode & 0o777).toString(8).padStart(3, "0");
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
}

async function writeCredentialsFile(file: CredentialsFile): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 });
  await writeFile(CREDENTIALS_FILE, JSON.stringify(file, null, 2), {
    encoding: "utf8",
    mode: 0o600,
  });
  await chmod(CREDENTIALS_FILE, 0o600).catch(() => undefined);
}

function isNotFound(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "ENOENT"
  );
}
