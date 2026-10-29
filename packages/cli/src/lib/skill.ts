import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  realpathSync,
} from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join } from "node:path";

export const SKILL_FILES = ["SKILL.md", "SCHEMA.md"] as const;

export type SkillInstallResult =
  | { status: "installed"; dir: string; files: string[] }
  | { status: "linked"; dir: string };

/** Claude Code reads user skills from `$CLAUDE_CONFIG_DIR/skills`, default `~/.claude/skills`. */
export function defaultSkillDir(name: string): string {
  const configDir = process.env.CLAUDE_CONFIG_DIR;
  // A relative value would resolve against the current directory, which is
  // the package folder when the postinstall script runs.
  if (configDir && !isAbsolute(configDir)) {
    throw new Error(
      `CLAUDE_CONFIG_DIR must be an absolute path, got "${configDir}". Pass --dir instead.`,
    );
  }
  return join(configDir || join(homedir(), ".claude"), "skills", name);
}

function symlinkError(path: string): Error {
  const target = existsSync(path) ? realpathSync(path) : "a missing path";
  return new Error(
    `${path} is a symlink to ${target}. Remove it or pass --dir.`,
  );
}

/**
 * Copies the skill files from `srcDir` to `dstDir` and overwrites older copies.
 * Nothing is written through a symlink, neither `dstDir` nor a file in it: a
 * link to the package's own skill is already current, and a link elsewhere
 * (for example a checkout) must not be overwritten.
 */
export function installSkill(
  srcDir: string,
  dstDir: string,
): SkillInstallResult {
  if (!existsSync(join(srcDir, "SKILL.md"))) {
    throw new Error(`No SKILL.md in ${srcDir}`);
  }
  const dirStat = lstatSync(dstDir, { throwIfNoEntry: false });
  if (dirStat?.isSymbolicLink()) {
    if (existsSync(dstDir) && realpathSync(dstDir) === realpathSync(srcDir)) {
      return { status: "linked", dir: dstDir };
    }
    throw symlinkError(dstDir);
  }
  if (dirStat && !dirStat.isDirectory()) {
    throw new Error(`${dstDir} exists and is not a directory.`);
  }
  const files = SKILL_FILES.filter((f) => existsSync(join(srcDir, f)));
  for (const f of files) {
    const dst = join(dstDir, f);
    if (lstatSync(dst, { throwIfNoEntry: false })?.isSymbolicLink()) {
      throw symlinkError(dst);
    }
  }
  mkdirSync(dstDir, { recursive: true });
  for (const f of files) copyFileSync(join(srcDir, f), join(dstDir, f));
  return { status: "installed", dir: dstDir, files };
}
