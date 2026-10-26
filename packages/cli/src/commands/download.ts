import { basename } from "node:path";
import { defineCommand } from "citty";
import { consola } from "consola";
import { downloadCall, globalArgs, resolveClient } from "./_shared.js";

// Attachment URLs in application responses look like
// https://api.join.com/v2/attachments/<id>/<file>?sig=<sig>
const FILE_PATH = /\/(attachments|application-files)\/([^/]+)\/([^/?]+)$/;

export const downloadCommand = defineCommand({
  meta: {
    name: "download",
    description:
      "Download an attachment by the full URL from an application's `attachments[].url`",
  },
  args: {
    ...globalArgs,
    url: { type: "positional", description: "Attachment URL", required: true },
    output: {
      type: "string",
      alias: "o",
      description:
        "Output file, or '-' for stdout (default: the file name from the URL)",
    },
  },
  async run({ args }) {
    let url: URL;
    try {
      url = new URL(args.url);
    } catch {
      consola.error("Expected a full attachment URL.");
      process.exit(1);
    }
    const match = url.pathname.match(FILE_PATH);
    const sig = url.searchParams.get("sig");
    if (!match || !sig) {
      consola.error(
        "URL must point to /attachments/<id>/<file> or /application-files/<id>/<file> and carry a sig parameter.",
      );
      process.exit(1);
    }
    const [, kind = "", id = "", externalFileName = ""] = match;
    const client = await resolveClient(args);
    await downloadCall(
      client,
      `/${kind}/{id}/{externalFileName}`,
      { path: { id, externalFileName }, query: { sig } },
      args.output || basename(externalFileName),
    );
  },
});
