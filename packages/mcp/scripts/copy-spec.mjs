#!/usr/bin/env node
// Copies the repo-root openapi.json into src/spec.json so tsup/esbuild can
// bundle it into dist/index.js via a JSON import. Runs as the `generate` step.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..", "..");
const src = join(repoRoot, "openapi.json");
const dest = resolve(__dirname, "..", "src", "spec.json");

const spec = JSON.parse(readFileSync(src, "utf8"));
writeFileSync(dest, JSON.stringify(spec), "utf8");
console.log(
  `copied openapi.json → src/spec.json (${Object.keys(spec.paths ?? {}).length} paths)`,
);
