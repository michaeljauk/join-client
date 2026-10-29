#!/usr/bin/env node
// On global installs, runs `join-com skill install`, which copies the skill to
// $CLAUDE_CONFIG_DIR/skills/join/ and never writes through a symlink.
// npm 11.19+ and pnpm skip install scripts by default; the README says so.
// Non-fatal and quiet on failure: it must not break or clutter `npm install`.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const cli = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "dist",
  "index.js",
);

try {
  if (process.env.npm_config_global !== "true") process.exit(0);
  if (!existsSync(cli)) process.exit(0);
  const run = spawnSync(process.execPath, [cli, "skill", "install"], {
    encoding: "utf8",
  });
  if (run.status === 0) process.stdout.write(`${run.stdout}${run.stderr}`);
} catch {
  // swallow
}
