import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  realpathSync,
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const SKILL_FILES = ["SKILL.md", "SCHEMA.md"] as const;

export type SkillInstallResult =
  | { status: "installed"; dir: string; files: string[] }
  | { status: "linked"; dir: string };

/** Claude Code reads user skills from `$CLAUDE_CONFIG_DIR/skills`, default `~/.claude/skills`. */
export function defaultSkillDir(name: string): string {
  const configDir = process.env.CLAUDE_CONFIG_DIR || join(homedir(), ".claude");
  return join(configDir, "skills", name);
}

/**
 * Copies the skill files from `srcDir` to `dstDir` and overwrites older copies.
 * If `dstDir` is a symlink, nothing is copied: a link to `srcDir` is already
 * current, and a link elsewhere (for example a checkout) must not be written
 * through.
 */
export function installSkill(
  srcDir: string,
  dstDir: string,
): SkillInstallResult {
  if (!existsSync(join(srcDir, "SKILL.md"))) {
    throw new Error(`No SKILL.md in ${srcDir}`);
  }
  if (lstatSync(dstDir, { throwIfNoEntry: false })?.isSymbolicLink()) {
    const target = existsSync(dstDir) ? realpathSync(dstDir) : undefined;
    if (target === realpathSync(srcDir))
      return { status: "linked", dir: dstDir };
    throw new Error(
      `${dstDir} is a symlink to ${target ?? "a missing path"}. Remove it or pass --dir.`,
    );
  }
  mkdirSync(dstDir, { recursive: true });
  const files = SKILL_FILES.filter((f) => existsSync(join(srcDir, f)));
  for (const f of files) copyFileSync(join(srcDir, f), join(dstDir, f));
  return { status: "installed", dir: dstDir, files };
}
