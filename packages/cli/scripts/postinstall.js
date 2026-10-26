#!/usr/bin/env node
// Installs the join skill to ~/.claude/skills/join/ on global installs.
// Non-fatal: failures here must not break `npm install`.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = join(__dirname, "..", "skills", "join");
const dstDir = join(homedir(), ".claude", "skills", "join");

try {
  if (process.env.npm_config_global !== "true") process.exit(0);
  if (!existsSync(join(srcDir, "SKILL.md"))) process.exit(0);
  mkdirSync(dstDir, { recursive: true });
  for (const file of ["SKILL.md", "SCHEMA.md"]) {
    if (existsSync(join(srcDir, file)))
      copyFileSync(join(srcDir, file), join(dstDir, file));
  }
  console.log(`join: Claude Code skill installed -> ${dstDir}`);
} catch {
  // swallow
}
