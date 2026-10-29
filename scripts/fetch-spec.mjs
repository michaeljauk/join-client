#!/usr/bin/env node
// Rebuilds openapi.json from docs.join.com. JOIN publishes no single spec
// file: every reference page embeds an OpenAPI document with one operation.
// This script reads the page index from llms.txt, extracts each embedded
// document and merges paths and components. Guide pages carry no document
// and are skipped. It fails on any conflict between two pages, so a silent
// overwrite cannot happen.
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(__dirname, "..", "openapi.json");
const INDEX_URL = "https://docs.join.com/llms.txt";

const index = await fetchText(INDEX_URL);
const pageUrls = [
  ...new Set(
    index.match(/https:\/\/docs\.join\.com\/reference\/[^)\s]+\.md/g) ?? [],
  ),
].sort();
if (pageUrls.length === 0)
  throw new Error(`no reference pages in ${INDEX_URL}`);

let merged = null;
const conflicts = [];
const guides = [];
for (const url of pageUrls) {
  const page = await fetchText(url);
  const match = page.match(/```json\n([\s\S]*?)\n```/);
  const doc = match ? JSON.parse(match[1]) : null;
  if (!doc?.openapi) {
    guides.push(url);
    continue;
  }
  if (!merged) {
    const { paths: _p, components: _c, ...rest } = doc;
    merged = { ...rest, paths: {}, components: {} };
  }
  for (const [path, ops] of Object.entries(doc.paths ?? {})) {
    const target = (merged.paths[path] ??= {});
    for (const [method, op] of Object.entries(ops)) {
      if (method in target && !same(target[method], op))
        conflicts.push(`${method} ${path}`);
      target[method] = op;
    }
  }
  for (const [section, items] of Object.entries(doc.components ?? {})) {
    const target = (merged.components[section] ??= {});
    for (const [name, value] of Object.entries(items)) {
      if (name in target && !same(target[name], value))
        conflicts.push(`components.${section}.${name}`);
      target[name] = value;
    }
  }
}

if (!merged) throw new Error(`no OpenAPI documents in ${INDEX_URL}`);
if (conflicts.length) {
  throw new Error(`conflicting definitions:\n  ${conflicts.join("\n  ")}`);
}

merged.paths = sortKeys(merged.paths);
for (const section of Object.keys(merged.components)) {
  merged.components[section] = sortKeys(merged.components[section]);
}
writeFileSync(outPath, JSON.stringify(merged, null, 2) + "\n", "utf8");
const METHODS = new Set(["get", "post", "put", "patch", "delete"]);
const ops = Object.values(merged.paths).reduce(
  (n, item) => n + Object.keys(item).filter((k) => METHODS.has(k)).length,
  0,
);
console.log(
  `wrote ${outPath}: ${pageUrls.length - guides.length} reference pages (${guides.length} guides skipped), ${Object.keys(merged.paths).length} paths, ${ops} operations`,
);

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.text();
}

function same(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function sortKeys(obj) {
  return Object.fromEntries(
    Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)),
  );
}
