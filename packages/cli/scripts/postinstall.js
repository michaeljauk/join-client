#!/usr/bin/env node
// On global installs, runs `join-com skill install`, which copies the skill to
// $CLAUDE_CONFIG_DIR/skills/join/ and leaves a symlinked skill folder alone.
// npm 11.19+ and pnpm skip install scripts by default; the README says so.
// Non-fatal: failures here must not break `npm install`.
import { execFileSync } from "node:child_process";
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
  execFileSync(process.execPath, [cli, "skill", "install"], {
    stdio: "inherit",
  });
} catch {
  // swallow
}
