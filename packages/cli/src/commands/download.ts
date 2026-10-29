import { writeFile } from "node:fs/promises";
import { basename } from "node:path";
import { defineCommand } from "citty";
import { consola } from "consola";

// Document URLs in application responses are pre-signed links to external
// storage, valid for one hour. They need no JOIN token, and the token must
// not leave api.join.com, so this command fetches them without a client.
export const downloadCommand = defineCommand({
  meta: {
    name: "download",
    description:
      "Download an application document by its pre-signed URL from `documents[].url`",
  },
  args: {
    url: { type: "positional", description: "Document URL", required: true },
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
      consola.error("Expected a full document URL.");
      process.exit(1);
    }
    if (url.protocol !== "https:") {
      consola.error("Document URLs must use https.");
      process.exit(1);
    }
    const res = await fetch(url);
    if (!res.ok) {
      consola.error(
        `Download failed with HTTP ${res.status}. Links expire after one hour; read the application again for a fresh URL.`,
      );
      process.exit(1);
    }
    const bytes = Buffer.from(await res.arrayBuffer());
    const output = args.output || fileName(url);
    if (output === "-") {
      process.stdout.write(bytes);
      return;
    }
    await writeFile(output, bytes);
    consola.success(`Saved ${bytes.length} bytes to ${output}`);
  },
});

// Decode before basename: an encoded "%2F" must not become a path separator.
function fileName(url: URL): string {
  let path = url.pathname;
  try {
    path = decodeURIComponent(path);
  } catch {
    // Keep the raw path when it holds a malformed escape.
  }
  const name = basename(path);
  return name && name !== "." && name !== ".." ? name : "document";
}
