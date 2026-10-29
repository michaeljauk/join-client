import { fileURLToPath } from "node:url";
import { defineCommand } from "citty";
import { consola } from "consola";
import { defaultSkillDir, installSkill } from "../lib/skill.js";

// npm 11.19+ and pnpm do not run the postinstall script by default, so a
// global install no longer copies the skill. This command does it on demand.
const installCommand = defineCommand({
  meta: {
    name: "install",
    description:
      "Copy the Claude Code skill to $CLAUDE_CONFIG_DIR/skills/join (default ~/.claude/skills/join)",
  },
  args: {
    dir: {
      type: "string",
      description: "Target directory (default: the Claude Code skills folder)",
    },
  },
  run({ args }) {
    // The bundle runs from dist/index.js; the skill ships next to dist/.
    const srcDir = fileURLToPath(new URL("../skills/join", import.meta.url));
    let result;
    try {
      result = installSkill(srcDir, args.dir ?? defaultSkillDir("join"));
    } catch (err) {
      consola.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
    if (result.status === "linked") {
      consola.info(`${result.dir} already points to this package's skill.`);
      return;
    }
    consola.success(
      `Installed ${result.files.join(" and ")} to ${result.dir}. Restart Claude Code to load it.`,
    );
  },
});

export const skillCommand = defineCommand({
  meta: { name: "skill", description: "Manage the Claude Code skill" },
  subCommands: { install: installCommand },
});
