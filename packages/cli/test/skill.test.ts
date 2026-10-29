import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultSkillDir, installSkill } from "../src/lib/skill.js";

let root: string;
let src: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "join-skill-"));
  src = join(root, "src");
  mkdirSync(src);
  writeFileSync(join(src, "SKILL.md"), "skill v2");
  writeFileSync(join(src, "SCHEMA.md"), "schema v2");
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
  vi.unstubAllEnvs();
});

describe("installSkill", () => {
  it("copies both files into a new directory", () => {
    const dst = join(root, "skills", "join");
    const result = installSkill(src, dst);
    expect(result).toEqual({
      status: "installed",
      dir: dst,
      files: ["SKILL.md", "SCHEMA.md"],
    });
    expect(readFileSync(join(dst, "SCHEMA.md"), "utf8")).toBe("schema v2");
  });

  it("overwrites an older copy", () => {
    const dst = join(root, "dst");
    mkdirSync(dst);
    writeFileSync(join(dst, "SKILL.md"), "skill v1");
    installSkill(src, dst);
    expect(readFileSync(join(dst, "SKILL.md"), "utf8")).toBe("skill v2");
  });

  it("leaves a symlink to the source alone", () => {
    const dst = join(root, "link");
    symlinkSync(src, dst);
    expect(installSkill(src, dst)).toEqual({ status: "linked", dir: dst });
    expect(readFileSync(join(src, "SKILL.md"), "utf8")).toBe("skill v2");
  });

  it("refuses to write through a symlink to another directory", () => {
    const other = join(root, "checkout");
    mkdirSync(other);
    writeFileSync(join(other, "SKILL.md"), "checkout copy");
    const dst = join(root, "link");
    symlinkSync(other, dst);
    expect(() => installSkill(src, dst)).toThrow(/is a symlink to/);
    expect(readFileSync(join(other, "SKILL.md"), "utf8")).toBe("checkout copy");
  });

  it("refuses a dangling symlink", () => {
    const dst = join(root, "link");
    symlinkSync(join(root, "gone"), dst);
    expect(() => installSkill(src, dst)).toThrow(/a missing path/);
  });

  it("skips SCHEMA.md when the package has none", () => {
    rmSync(join(src, "SCHEMA.md"));
    const result = installSkill(src, join(root, "dst"));
    expect(result).toMatchObject({ files: ["SKILL.md"] });
  });

  it("fails without SKILL.md", () => {
    rmSync(join(src, "SKILL.md"));
    expect(() => installSkill(src, join(root, "dst"))).toThrow(/No SKILL.md/);
  });
});

describe("defaultSkillDir", () => {
  it("uses CLAUDE_CONFIG_DIR when set", () => {
    vi.stubEnv("CLAUDE_CONFIG_DIR", "/tmp/claude-x");
    expect(defaultSkillDir("join")).toBe("/tmp/claude-x/skills/join");
  });

  it("falls back to ~/.claude", () => {
    vi.stubEnv("CLAUDE_CONFIG_DIR", "");
    expect(defaultSkillDir("join")).toMatch(/\.claude\/skills\/join$/);
  });
});
