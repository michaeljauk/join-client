import { defineCommand, runMain } from "citty";
import { authCommand } from "./commands/auth.js";
import { downloadCommand } from "./commands/download.js";
import { generatedSubCommands } from "./commands/generated/_root.js";

declare const __VERSION__: string;

// No root `run`: citty calls a parent's run after every subcommand, which
// would append the usage text to each command's JSON output.
const main = defineCommand({
  meta: {
    name: "join-com",
    version: __VERSION__,
    description: "Community CLI for the JOIN recruiting API",
  },
  subCommands: {
    auth: authCommand,
    download: downloadCommand,
    ...generatedSubCommands,
  },
});

void runMain(main);
