import { defineCommand } from "citty";
import { consola } from "consola";
import { createJoinClient } from "join-sdk";
import {
  CREDENTIALS_FILE,
  DEFAULT_PROFILE,
  credentialsFileMode,
  loadProfile,
  readCredentialsFile,
  removeProfile,
  saveProfile,
} from "../lib/credentials.js";
import { readStdinText } from "./_shared.js";

async function verifyToken(token: string, baseUrl?: string): Promise<void> {
  const join = createJoinClient({ token, baseUrl });
  await join.GET("/jobs", { params: { query: { limit: 1 } } });
}

const login = defineCommand({
  meta: {
    name: "login",
    description: "Store an API token under a profile and verify it",
  },
  args: {
    profile: {
      type: "string",
      description: `Profile name, e.g. one per company (default: "${DEFAULT_PROFILE}")`,
    },
    token: {
      type: "string",
      description: "API token (otherwise read from stdin or prompted)",
    },
    "base-url": { type: "string", description: "Override API base URL" },
    default: {
      type: "boolean",
      description: "Make this profile the default",
    },
  },
  async run({ args }) {
    const profile = args.profile || DEFAULT_PROFILE;
    let token = args.token?.trim();
    if (!token && !process.stdin.isTTY) token = await readStdinText();
    if (!token) {
      const answer = await consola.prompt(
        "Company API token (JOIN: Company Settings -> Developer -> API tokens)",
        { type: "text", cancel: "null" },
      );
      token = typeof answer === "string" ? answer.trim() : undefined;
    }
    if (!token) {
      consola.error("A token is required.");
      process.exit(1);
    }
    const baseUrl = args["base-url"] || undefined;

    consola.start("Verifying token...");
    try {
      await verifyToken(token, baseUrl);
    } catch (err) {
      consola.error(
        `Token rejected: ${err instanceof Error ? err.message : String(err)}`,
      );
      process.exit(1);
    }

    const path = await saveProfile(
      profile,
      { token, baseUrl },
      { makeDefault: Boolean(args.default) },
    );
    consola.success(`Profile "${profile}" saved to ${path} (mode 600)`);
  },
});

const logout = defineCommand({
  meta: { name: "logout", description: "Remove a stored profile" },
  args: {
    profile: {
      type: "string",
      description: `Profile to remove (default: "${DEFAULT_PROFILE}")`,
    },
  },
  async run({ args }) {
    const profile = args.profile || DEFAULT_PROFILE;
    if (await removeProfile(profile))
      consola.success(`Removed profile "${profile}"`);
    else consola.info(`No stored profile "${profile}".`);
  },
});

const status = defineCommand({
  meta: { name: "status", description: "Show auth status and test the token" },
  args: {
    profile: { type: "string", description: "Profile to test" },
  },
  async run({ args }) {
    const envToken = process.env.JOIN_TOKEN;
    const file = await readCredentialsFile();
    const names = Object.keys(file.profiles);
    if (names.length) {
      consola.info(`Profiles in ${CREDENTIALS_FILE}:`);
      for (const name of names) {
        const marker = name === file.defaultProfile ? " (default)" : "";
        consola.log(
          `  ${name}${marker}  saved ${file.profiles[name]!.savedAt}`,
        );
      }
      const mode = await credentialsFileMode();
      if (mode && mode !== "600") {
        consola.warn(
          `File mode is ${mode}, expected 600. Run: chmod 600 ${CREDENTIALS_FILE}`,
        );
      }
    }

    let token: string;
    let baseUrl = process.env.JOIN_BASE_URL;
    if (envToken) {
      consola.info("Using $JOIN_TOKEN.");
      token = envToken;
    } else {
      const stored = await loadProfile(
        args.profile ?? process.env.JOIN_PROFILE,
      );
      if (!stored) {
        consola.warn("Not authenticated. Run `join-com auth login`.");
        process.exit(2);
      }
      consola.info(`Using profile "${stored.name}".`);
      token = stored.profile.token;
      baseUrl ??= stored.profile.baseUrl;
    }

    consola.start("Testing token...");
    try {
      await verifyToken(token, baseUrl);
      consola.success("Token works.");
    } catch (err) {
      consola.error(
        `Token test failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      process.exit(1);
    }
  },
});

export const authCommand = defineCommand({
  meta: { name: "auth", description: "Manage JOIN API tokens" },
  subCommands: { login, logout, status },
});
